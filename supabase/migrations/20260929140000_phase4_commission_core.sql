-- Phase 4 database core. Coordinated authenticated-client cutover required.
begin;
alter table public.bespoke_requests
 add column revision bigint not null default 1 check (revision > 0),
 add column lock_version bigint not null default 1 check (lock_version > 0),
 add column submission_key uuid,
 add column style_image_snapshot jsonb,
 add column submission_intent jsonb,
 add column submitted_at timestamptz,
 add column last_submitted_at timestamptz,
 add column reviewed_at timestamptz,
 add column reviewed_by uuid references auth.users(id),
 add column approved_at timestamptz,
 add column approved_by uuid references auth.users(id),
 add column approved_revision bigint;
alter table public.orders
 add column lock_version bigint not null default 1 check (lock_version > 0),
 add column source_request_revision bigint,
 add column accepted_request_snapshot jsonb;
create unique index bespoke_submission_key_uidx on public.bespoke_requests(customer_id,submission_key) where submission_key is not null;
create index bespoke_review_queue_idx on public.bespoke_requests(status,last_submitted_at,id);
create index bespoke_reviewed_by_idx on public.bespoke_requests(reviewed_by) where reviewed_by is not null;
create index bespoke_approved_by_idx on public.bespoke_requests(approved_by) where approved_by is not null;
create index orders_status_created_idx on public.orders(status,created_at,id);
create table public.bespoke_request_revisions (
 request_id uuid not null references public.bespoke_requests(id) on delete restrict,
 revision bigint not null, snapshot jsonb not null,
 provenance text not null, response text, created_at timestamptz not null default now(),
 primary key(request_id,revision)
);
insert into public.bespoke_request_revisions(request_id,revision,snapshot,provenance)
 select id,1,to_jsonb(r)-'admin_notes'-'submission_intent','legacy_import' from public.bespoke_requests r;
alter table public.orders add constraint orders_source_revision_fk
 foreign key(bespoke_request_id,source_request_revision) references public.bespoke_request_revisions(request_id,revision);
create index orders_source_revision_idx on public.orders(bespoke_request_id,source_request_revision);
alter table public.bespoke_request_revisions enable row level security;
create policy revisions_read on public.bespoke_request_revisions for select to authenticated using (
 exists(select 1 from public.bespoke_requests r where r.id=request_id and
 (r.customer_id=(select auth.uid()) or (select private.current_staff_role()) in ('admin','ceo'))));
revoke all on public.bespoke_request_revisions from public,anon,authenticated;
grant select on public.bespoke_request_revisions to authenticated;
-- Preserve confidential legacy values; column grants deliberately make SELECT * fail.
revoke select on public.bespoke_requests from public,anon,authenticated;
do $$ declare c record; begin
 for c in select attname from pg_attribute where attrelid='public.bespoke_requests'::regclass and attnum>0 and not attisdropped loop
 execute format('revoke select (%I) on public.bespoke_requests from public, anon, authenticated',c.attname);
 if c.attname not in ('admin_notes','submission_intent') then
 execute format('grant select (%I) on public.bespoke_requests to authenticated',c.attname);
 end if;
 end loop;
end $$;
create table public.commission_private_notes (
 id uuid primary key default gen_random_uuid(),
 request_id uuid not null references public.bespoke_requests(id) on delete restrict,
 author_id uuid references auth.users(id), note text not null,
 created_at timestamptz not null default now()
);
insert into public.commission_private_notes(request_id,note) select id,admin_notes from public.bespoke_requests where admin_notes is not null;
create index commission_notes_request_idx on public.commission_private_notes(request_id);
create index commission_notes_author_idx on public.commission_private_notes(author_id);
alter table public.commission_private_notes enable row level security;
create policy private_notes_staff_read on public.commission_private_notes for select to authenticated
 using ((select private.current_staff_role()) in ('admin','ceo'));
revoke all on public.commission_private_notes from public,anon,authenticated;
grant select on public.commission_private_notes to authenticated;
create table private.commission_operations (
 actor_id uuid not null, operation_key uuid not null, intent jsonb not null,
 primary key(actor_id,operation_key)
);
revoke all on private.commission_operations from public,anon,authenticated,service_role;
alter table private.commission_operations enable row level security;
create function private.commission_actor(p_staff boolean) returns uuid
language plpgsql security definer set search_path='' as $$
declare a uuid:=auth.uid(); begin
 if a is null then raise exception 'unauthorized'; end if;
 if p_staff then
 perform 1 from public.staff_accounts where user_id=a and status='active' and role in ('admin','ceo') for share;
 if not found then raise exception 'unauthorized'; end if;
 elsif exists(select 1 from public.staff_accounts where user_id=a) or not exists(select 1 from public.profiles where id=a) then
 raise exception 'unauthorized'; end if;
 return a;
end $$;
-- Operation lock precedes entity lock everywhere; intent includes expected version.
create function private.commission_replay(k uuid,i jsonb) returns boolean
language plpgsql security definer set search_path='' as $$
declare old jsonb; begin
 if k is null then raise exception 'operation_key_required'; end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text||k::text,0));
 select intent into old from private.commission_operations where actor_id=auth.uid() and operation_key=k;
 if found then
 if old is distinct from i then raise exception 'idempotency_conflict'; end if;
 return true;
 end if;
 insert into private.commission_operations values(auth.uid(),k,i);
 return false;
end $$;
create function private.commission_event(t text,e uuid,c uuid,a text,m text,staff boolean) returns void
language plpgsql security definer set search_path='' as $$ begin
 insert into public.lifecycle_events(entity_type,entity_id,customer_id,event_type,actor_type,actor_id,metadata)
 values(t,e,c,a,case when staff then 'staff' else 'customer' end,auth.uid(),jsonb_build_object('message',m));
 if c is not null then
 insert into public.notifications(customer_id,type,title,message,related_entity_type,related_entity_id)
 values(c,a,'Commission update',coalesce(nullif(m,''),replace(a,'_',' ')),t,e::text);
 end if;
end $$;
create function private.commission_immutable() returns trigger
language plpgsql set search_path='' as $$ begin raise exception 'immutable_revision'; end $$;
create trigger immutable_revision before update or delete on public.bespoke_request_revisions
 for each row execute function private.commission_immutable();
create function private.commission_snapshot(r public.bespoke_requests) returns jsonb
language sql immutable set search_path='' as $$ select to_jsonb(r)-'admin_notes'-'submission_intent' $$;

-- Numeric suffixes are allocated, never computed with MAX()+1 during requests.
-- Retry below also skips a preserved legacy reference if a matching value exists.
create sequence private.commission_request_reference_seq;
create sequence private.commission_order_reference_seq;
select setval('private.commission_request_reference_seq',
 (coalesce((select max(substring(request_reference from '^TCC-REQ-([0-9]+)$')::numeric) from public.bespoke_requests),0)+1)::bigint,false);
select setval('private.commission_order_reference_seq',
 (coalesce((select max(substring(order_reference from '^TCC-ORD-([0-9]+)$')::numeric) from public.orders),0)+1)::bigint,false);
revoke all on sequence private.commission_request_reference_seq,private.commission_order_reference_seq from public,anon,authenticated,service_role;
create function private.commission_reference(is_order boolean) returns text
language plpgsql security definer set search_path='' as $$
declare n text; begin
 n:=nextval(case when is_order then 'private.commission_order_reference_seq'::regclass else 'private.commission_request_reference_seq'::regclass end)::text;
 return case when is_order then 'TCC-ORD-' else 'TCC-REQ-' end||lpad(n,greatest(6,length(n)),'0');
end $$;

-- Validate only customer-editable fields. Resubmission merges a patch; origin is fixed.
create function private.commission_payload(p jsonb, old public.bespoke_requests)
returns public.bespoke_requests language plpgsql security definer set search_path='' as $$
declare r public.bespoke_requests; k text; v jsonb; f public.catalogue_fits;
 b public.catalogue_fabrics; c public.catalogue_colours; img public.catalogue_fit_images;
 mp public.measurement_profiles; m jsonb; method text; unit text;
 allowed text[]:=array['fabric','colour','preferences','fit_preference','measurements_snapshot',
 'measurement_confidence','occasion','event_name','event_date','required_date',
 'reference_images','special_instructions','contact_info'];
begin
 if p is null or jsonb_typeof(p)<>'object' or octet_length(p::text)>65536 then raise exception 'invalid_payload'; end if;
 if old.id is null then allowed:=allowed||array['style_id','style_code','style_name','style_image','garment_category','is_idea_path','appointment_request']; end if;
 for k in select jsonb_object_keys(p) loop
 if not k=any(allowed) then raise exception 'invalid_field: %',k; end if;
 end loop;
 for k,v in select * from jsonb_each(p) loop
 if k=any(array['fabric','colour','preferences','measurements_snapshot','contact_info','appointment_request']) then
 if jsonb_typeof(v) not in ('object','null') then raise exception 'invalid_object: %',k; end if;
 elsif k=any(array['is_idea_path','measurement_confidence']) then
 if jsonb_typeof(v)<>'boolean' then raise exception 'invalid_boolean'; end if;
 elsif k<>'reference_images' and jsonb_typeof(v) not in ('string','null') then raise exception 'invalid_text: %',k;
 end if;
 end loop;
 r:=jsonb_populate_record(old,p);
 r.is_idea_path:=coalesce(r.is_idea_path,false);
 r.preferences:=coalesce(r.preferences,'{}');
 r.reference_images:=coalesce(r.reference_images,'[]');
 r.measurement_confidence:=coalesce(r.measurement_confidence,false);
 if p ? 'fit_preference' and r.fit_preference is not null and r.fit_preference not in ('tailored','regular','relaxed') then raise exception 'invalid_fit_preference'; end if;
 if length(coalesce(p->>'special_instructions',''))>2000 or length(coalesce(p->>'event_name',''))>160
 or length(coalesce(p->>'occasion',''))>160 or length(coalesce(p->>'style_name',''))>120 then raise exception 'text_too_long'; end if;
 if old.id is null or p ? 'preferences' then
 if r.preferences ? 'agbadaLength' and r.preferences->>'agbadaLength' not in ('full-floor','ankle','mid-calf') then raise exception 'invalid_preference'; end if;
 if r.preferences ? 'trouserBreak' and r.preferences->>'trouserBreak' not in ('no-break','slight-break','full-break') then raise exception 'invalid_preference'; end if;
 for k,v in select * from jsonb_each(r.preferences) loop
 if not k=any(array['agbadaLength','capIncluded','innerBubaPreference','collarStyle','buttonPreference',
 'pocketStyle','sleevePreference','trouserBreak','collarHeight','embroideryStyle','embroideryColour','specialInstructions'])
 then raise exception 'invalid_preference'; end if;
 if k='capIncluded' then
 if jsonb_typeof(v)<>'boolean' then raise exception 'invalid_preference'; end if;
 elsif jsonb_typeof(v)<>'string' or length(v#>>'{}')>case when k='specialInstructions' then 2000 else 160 end then raise exception 'invalid_preference'; end if;
 end loop;
 end if;
 if old.id is null or p ? 'contact_info' then
 if r.contact_info is null or jsonb_typeof(r.contact_info)<>'object' then raise exception 'contact_required'; end if;
 for k,v in select * from jsonb_each(r.contact_info) loop
 if not k=any(array['firstName','lastName','email','phone','preferredContact','name']) or jsonb_typeof(v)<>'string'
 or length(v#>>'{}')>case when k='email' then 254 when k='phone' then 30 else 80 end then raise exception 'invalid_contact'; end if;
 end loop;
 if r.contact_info ? 'preferredContact' and r.contact_info->>'preferredContact' not in ('whatsapp','phone','email','') then raise exception 'invalid_contact'; end if;
 end if;
 for k in select unnest(array['event_date','required_date']) loop
 if p ? k and nullif(p->>k,'') is not null and (old.id is null or p->k is distinct from to_jsonb(old)->k) then
 if (p->>k) !~ '^\d{4}-\d{2}-\d{2}$' or (p->>k)::date<current_date then raise exception 'invalid_date'; end if;
 end if;
 end loop;
 -- Re-selecting the same canonical ID retains its historical description, even
 -- if the option has since been renamed, archived, or detached from the Fit.
 if old.id is not null and not r.is_idea_path then
 if old.fabric->>'id' is not null and r.fabric->>'id'=old.fabric->>'id' then r.fabric:=old.fabric; end if;
 if old.colour->>'id' is not null and r.colour->>'id'=old.colour->>'id' then r.colour:=old.colour; end if;
 end if;
 if old.id is null and r.is_idea_path then
 if nullif(r.style_id,'') is not null then raise exception 'idea_must_not_claim_fit'; end if;
 r.style_code:='TSQ BESPOKE'; r.style_name:=coalesce(nullif(r.style_name,''),'Bespoke commission');
 r.style_image:=null; r.style_image_snapshot:=jsonb_build_object('kind','unavailable');
 end if;
 -- A new non-idea submission always requires a real published Fit. Legacy unchanged
 -- choices survive later archival; new choices must pass current membership checks.
 if not r.is_idea_path and (old.id is null or
 r.fabric is distinct from old.fabric or r.colour is distinct from old.colour) then
 select fit.* into f from public.catalogue_fits fit join public.catalogue_categories cat on cat.slug=fit.category_slug
 where fit.id=r.style_id and fit.status='published' and cat.is_active for share of fit,cat;
 if not found then raise exception 'unavailable_fit'; end if;
 if old.id is null then
 r.style_code:=f.code; r.style_name:=f.name; r.garment_category:=f.category_slug;
 select * into img from public.catalogue_fit_images where fit_id=f.id order by is_primary desc,sort_order,id limit 1 for share;
 r.style_image:=img.image_path;
 r.style_image_snapshot:=case when img.storage_object_path is not null then
 jsonb_build_object('kind','storage','bucket','catalogue-media','path',img.storage_object_path,'alt',img.alt_text)
 when img.image_path is not null then jsonb_build_object('kind','local','path',img.image_path,'alt',img.alt_text)
 else jsonb_build_object('kind','unavailable') end;
 end if;
 end if;
 if old.id is null or r.fabric is distinct from old.fabric then
 if r.is_idea_path then
 r.fabric:=coalesce(r.fabric,'{}')||jsonb_build_object('provenance','client_proposal');
 else
 select fab.* into b from public.catalogue_fabrics fab join public.catalogue_fit_fabrics l on l.fabric_id=fab.id
 where l.fit_id=r.style_id and fab.id=r.fabric->>'id' and fab.is_active for share of fab,l;
 if not found then raise exception 'unavailable_fabric'; end if;
 r.fabric:=jsonb_build_object('id',b.id,'name',b.name,'description',b.description,'weight',b.weight,'finish',b.finish,'provenance','catalogue');
 end if;
 end if;
 if old.id is null or r.colour is distinct from old.colour then
 if r.is_idea_path then
 r.colour:=coalesce(r.colour,'{}')||jsonb_build_object('provenance','client_proposal');
 else
 select col.* into c from public.catalogue_colours col join public.catalogue_fit_colours l on l.colour_id=col.id
 where l.fit_id=r.style_id and col.id=r.colour->>'id' and col.is_active for share of col,l;
 if not found then raise exception 'unavailable_colour'; end if;
 r.colour:=jsonb_build_object('id',c.id,'name',c.name,'hex',c.hex,'provenance','catalogue');
 end if;
 end if;
 if old.id is null or p ? 'measurements_snapshot' then
 m:=coalesce(p->'measurements_snapshot','{}'); method:=coalesce(m->>'method','schedule'); unit:=coalesce(m->>'unit','cm');
 if method='saved' then
 select * into mp from public.measurement_profiles where customer_id=auth.uid() and
 (case when nullif(m->>'sourceMeasurementId','') is null then is_current else id=(m->>'sourceMeasurementId')::uuid end) for share;
 if not found then raise exception 'measurement_not_found'; end if;
 r.measurements_snapshot:=jsonb_build_object('method','saved','values',mp.measurements,'unit',mp.unit,
 'sourceMeasurementId',mp.id,'sourceVersion',mp.version,'verificationStatus',mp.verification_status);
 elsif method='manual' then
 if unit not in ('cm','inches') or jsonb_typeof(m->'values') is distinct from 'object' or m->'values'='{}'::jsonb then raise exception 'invalid_measurements'; end if;
 for k,v in select * from jsonb_each(m->'values') loop
 if not k=any(array['neck','shoulder','chest','sleeveLength','bicep','wrist','stomach','waist','topLength','trouserWaist','hip','thigh','knee','trouserLength','ankle'])
 or jsonb_typeof(v)<>'number' then raise exception 'invalid_measurement'; end if;
 if (v#>>'{}')::numeric<=0 or (v#>>'{}')::numeric*case when unit='inches' then 2.54 else 1 end>300 then raise exception 'invalid_measurement'; end if;
 end loop;
 r.measurements_snapshot:=jsonb_build_object('method','manual','values',m->'values','unit',unit,'verificationStatus','customer_entered');
 elsif method='schedule' then
 r.measurements_snapshot:=jsonb_build_object('method','schedule','values','{}'::jsonb,'verificationStatus','needs_confirmation');
 else raise exception 'invalid_measurement_method'; end if;
 end if;
 if old.id is null or p ? 'reference_images' then
 if jsonb_typeof(r.reference_images)<>'array' then raise exception 'invalid_references'; end if;
 if jsonb_array_length(r.reference_images)>6 then raise exception 'invalid_references'; end if;
 for v in select * from jsonb_array_elements(r.reference_images) loop
 if jsonb_typeof(v)<>'object' or split_part(v->>'path','/',1) is distinct from auth.uid()::text then raise exception 'invalid_reference'; end if;
 perform 1 from storage.objects where bucket_id='bespoke-references' and name=v->>'path' and owner_id=auth.uid()::text
 and metadata->>'mimetype' in ('image/jpeg','image/png','image/webp') and (metadata->>'size')::bigint between 1 and 10485760 for share;
 if not found then raise exception 'unavailable_reference'; end if;
 end loop;
 end if;
 if old.id is null and r.appointment_request is not null and coalesce(r.appointment_request->>'type','none')<>'none' then
 if r.appointment_request->>'type' not in ('consultation','measurement','first-fitting','final-fitting')
 or nullif(r.appointment_request->>'preferredDate','') is null or nullif(r.appointment_request->>'preferredTime','') is null
 or length(coalesce(r.appointment_request->>'notes',''))>1000 then raise exception 'invalid_appointment'; end if;
 perform (r.appointment_request->>'preferredDate')::date;
 end if;
 return r;
end $$;

create function public.submit_bespoke_request(p_payload jsonb,p_submission_key uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare a uuid; r public.bespoke_requests; n public.bespoke_requests; violated text;
begin
 a:=private.commission_actor(false);
 if p_submission_key is null then raise exception 'submission_key_required'; end if;
 perform pg_advisory_xact_lock(hashtextextended('submit:'||a::text||p_submission_key::text,0));
 select * into r from public.bespoke_requests where customer_id=a and submission_key=p_submission_key for update;
 if found then
 if r.submission_intent is distinct from p_payload then raise exception 'idempotency_conflict'; end if;
 return private.commission_snapshot(r);
 end if;
 n:=private.commission_payload(p_payload,n);
 -- Private sequence plus unique constraint/retry preserves every legacy reference.
 loop
 begin
 insert into public.bespoke_requests(request_reference,customer_id,style_id,style_code,style_name,style_image,style_image_snapshot,
 garment_category,is_idea_path,fabric,colour,preferences,fit_preference,measurements_snapshot,measurement_confidence,
 occasion,event_name,event_date,required_date,appointment_request,reference_images,special_instructions,contact_info,
 submission_key,submission_intent,submitted_at,last_submitted_at,status)
 values(private.commission_reference(false),a,n.style_id,n.style_code,n.style_name,n.style_image,n.style_image_snapshot,
 n.garment_category,n.is_idea_path,n.fabric,n.colour,n.preferences,n.fit_preference,n.measurements_snapshot,n.measurement_confidence,
 n.occasion,n.event_name,n.event_date,n.required_date,n.appointment_request,n.reference_images,n.special_instructions,n.contact_info,
 p_submission_key,p_payload,now(),now(),'submitted') returning * into r;
 exit;
 exception when unique_violation then
 get stacked diagnostics violated=CONSTRAINT_NAME;
 if violated<>'bespoke_requests_request_reference_key' then raise; end if;
 end;
 end loop;
 insert into public.bespoke_request_revisions values(r.id,r.revision,private.commission_snapshot(r),'customer_submission',null,now());
 if r.appointment_request is not null and coalesce(r.appointment_request->>'type','none')<>'none' then
 insert into public.appointments(customer_id,bespoke_request_id,type,preferred_date,preferred_time,status,notes)
 values(a,r.id,r.appointment_request->>'type',r.appointment_request->>'preferredDate',r.appointment_request->>'preferredTime','requested',r.appointment_request->>'notes');
 end if;
 perform private.commission_event('bespoke_request',r.id,a,'request_submitted',null,false);
 return private.commission_snapshot(r);
end $$;

create function public.transition_bespoke_request(p_request_id uuid,p_action text,p_message text,p_expected_version bigint,p_operation_key uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare a uuid; r public.bespoke_requests; replay boolean; target text;
begin
 a:=private.commission_actor(true);
 replay:=private.commission_replay(p_operation_key,jsonb_build_array('request_transition',p_request_id,p_action,p_message,p_expected_version));
 select * into r from public.bespoke_requests where id=p_request_id for update;
 if not found then raise exception 'not_found'; end if;
 if replay then return private.commission_snapshot(r); end if;
 if p_expected_version is distinct from r.lock_version then raise exception 'stale_version'; end if;
 if length(coalesce(p_message,''))>2000 then raise exception 'message_too_long'; end if;
 target:=case p_action when 'start_review' then 'under_review' when 'request_changes' then 'needs_clarification'
 when 'approve' then 'confirmed' when 'decline' then 'declined' end;
 if target is null or not (
 (p_action='start_review' and (r.status in ('submitted','pricing_ready') or (r.status='confirmed' and r.approved_at is null))) or
 (p_action in ('request_changes','approve','decline') and r.status='under_review')) then raise exception 'invalid_transition'; end if;
 if p_action in ('request_changes','decline') and nullif(btrim(p_message),'') is null then raise exception 'message_required'; end if;
 update public.bespoke_requests set status=target,lock_version=lock_version+1,updated_at=now(),
 reviewed_at=now(),reviewed_by=a,
 clarification_notes=case when target='needs_clarification' then btrim(p_message) else clarification_notes end,
 approved_at=case when target='confirmed' then now() end,
 approved_by=case when target='confirmed' then a end,
 approved_revision=case when target='confirmed' then revision end
 where id=r.id returning * into r;
 perform private.commission_event('bespoke_request',r.id,r.customer_id,'request_'||target,p_message,true);
 return private.commission_snapshot(r);
end $$;

create function public.resubmit_bespoke_request(p_request_id uuid,p_payload jsonb,p_response text,p_expected_version bigint,p_operation_key uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare a uuid; r public.bespoke_requests; n public.bespoke_requests; replay boolean;
begin
 a:=private.commission_actor(false);
 replay:=private.commission_replay(p_operation_key,jsonb_build_array('resubmit',p_request_id,p_payload,p_response,p_expected_version));
 select * into r from public.bespoke_requests where id=p_request_id and customer_id=a for update;
 if not found then raise exception 'not_found'; end if;
 if replay then return private.commission_snapshot(r); end if;
 if p_expected_version is distinct from r.lock_version then raise exception 'stale_version'; end if;
 if r.status<>'needs_clarification' then raise exception 'invalid_transition'; end if;
 if nullif(btrim(p_response),'') is null or length(p_response)>2000 then raise exception 'response_required'; end if;
 n:=private.commission_payload(p_payload,r);
 update public.bespoke_requests set fabric=n.fabric,colour=n.colour,preferences=n.preferences,fit_preference=n.fit_preference,
 measurements_snapshot=n.measurements_snapshot,measurement_confidence=n.measurement_confidence,
 occasion=n.occasion,event_name=n.event_name,event_date=n.event_date,required_date=n.required_date,
 reference_images=n.reference_images,special_instructions=n.special_instructions,contact_info=n.contact_info,
 status='submitted',revision=revision+1,lock_version=lock_version+1,last_submitted_at=now(),updated_at=now(),
 reviewed_at=null,reviewed_by=null,approved_at=null,approved_by=null,approved_revision=null
 where id=r.id returning * into r;
 insert into public.bespoke_request_revisions values(r.id,r.revision,private.commission_snapshot(r),'customer_resubmission',btrim(p_response),now());
 perform private.commission_event('bespoke_request',r.id,a,'request_resubmitted',btrim(p_response),false);
 return private.commission_snapshot(r);
end $$;

create function public.convert_bespoke_request_to_order(p_request_id uuid,p_expected_version bigint,p_operation_key uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare a uuid; r public.bespoke_requests; o public.orders; s jsonb; replay boolean; violated text;
begin
 a:=private.commission_actor(true);
 replay:=private.commission_replay(p_operation_key,jsonb_build_array('convert',p_request_id,p_expected_version));
 select * into r from public.bespoke_requests where id=p_request_id for update;
 if not found then raise exception 'not_found'; end if;
 select * into o from public.orders where bespoke_request_id=r.id;
 if r.status='converted_to_order' and o.id is not null then return to_jsonb(o); end if;
 if replay or o.id is not null then raise exception 'inconsistent_conversion'; end if;
 if p_expected_version is distinct from r.lock_version then raise exception 'stale_version'; end if;
 if r.status<>'confirmed' or r.customer_id is null or r.approved_at is null or r.approved_by is null
 or r.approved_revision is distinct from r.revision then raise exception 'current_approval_required'; end if;
 select snapshot into s from public.bespoke_request_revisions where request_id=r.id and revision=r.revision;
 if s is null then raise exception 'missing_revision'; end if;
 loop
 begin
 insert into public.orders(order_reference,customer_id,bespoke_request_id,source_request_revision,accepted_request_snapshot,
 style_id,style_code,style_name,style_image,garment_category,fabric_details,colour_details,preferences,measurements_snapshot,
 status,total_amount,total_amount_minor,target_completion_date,special_instructions)
 values(private.commission_reference(true),r.customer_id,r.id,r.revision,
 s||jsonb_build_object('approved_at',r.approved_at,'approved_by',r.approved_by,'approved_revision',r.approved_revision),
 coalesce(s->>'style_id','tsq-custom'),coalesce(s->>'style_code','TSQ BESPOKE'),coalesce(s->>'style_name','Bespoke commission'),
 s->>'style_image',s->>'garment_category',s->'fabric',s->'colour',s->'preferences',coalesce(s->'measurements_snapshot','{}'),
 'order_confirmed',r.quoted_price,r.quoted_price_minor,s->>'required_date',s->>'special_instructions') returning * into o;
 exit;
 exception when unique_violation then
 get stacked diagnostics violated=CONSTRAINT_NAME;
 if violated<>'orders_order_reference_key' then raise; end if;
 end;
 end loop;
 update public.bespoke_requests set status='converted_to_order',lock_version=lock_version+1,updated_at=now() where id=r.id;
 perform private.commission_event('bespoke_request',r.id,r.customer_id,'request_converted_to_order',o.order_reference,true);
 perform private.commission_event('order',o.id,o.customer_id,'order_confirmed',null,true);
 return to_jsonb(o);
end $$;

create function public.transition_order_status(p_order_id uuid,p_status text,p_message text,p_expected_version bigint,p_operation_key uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare a uuid; o public.orders; replay boolean; target text;
begin
 a:=private.commission_actor(true);
 replay:=private.commission_replay(p_operation_key,jsonb_build_array('order_transition',p_order_id,p_status,p_message,p_expected_version));
 select * into o from public.orders where id=p_order_id for update;
 if not found then raise exception 'not_found'; end if;
 if replay then return to_jsonb(o); end if;
 if p_expected_version is distinct from o.lock_version then raise exception 'stale_version'; end if;
 target:=case o.status when 'order_confirmed' then 'measurements_confirmed' when 'measurements_confirmed' then 'in_production'
 when 'in_production' then 'finishing' when 'finishing' then 'ready' when 'ready' then 'completed' end;
 if target is null or p_status is distinct from target then raise exception 'invalid_transition'; end if;
 if length(coalesce(p_message,''))>2000 then raise exception 'message_too_long'; end if;
 update public.orders set status=p_status,lock_version=lock_version+1,production_stage_updated_at=now(),updated_at=now()
 where id=o.id returning * into o;
 perform private.commission_event('order',o.id,o.customer_id,'order_'||p_status,p_message,true);
 if p_status='completed' then perform public.create_wardrobe_for_completed_order(o.id,a,'staff'); end if;
 return to_jsonb(o);
end $$;

create function public.add_commission_private_note(p_request_id uuid,p_note text)
returns uuid language plpgsql security definer set search_path='' as $$
declare a uuid; n uuid; begin
 a:=private.commission_actor(true);
 if nullif(btrim(p_note),'') is null or length(p_note)>10000 then raise exception 'invalid_note'; end if;
 perform 1 from public.bespoke_requests where id=p_request_id for share;
 if not found then raise exception 'not_found'; end if;
 insert into public.commission_private_notes(request_id,author_id,note) values(p_request_id,a,p_note) returning id into n;
 return n;
end $$;

-- Fail closed even if a future grant accidentally restores the legacy overloads.
create or replace function public.submit_bespoke_request(p_customer_id uuid,p_payload jsonb)
returns public.bespoke_requests language plpgsql security invoker set search_path='' as $$
begin raise exception 'retired_rpc_use_authenticated_signature'; end $$;
create or replace function public.convert_bespoke_request_to_order(p_request_id uuid,p_actor_id uuid,p_actor_type text)
returns public.orders language plpgsql security invoker set search_path='' as $$
begin raise exception 'retired_rpc_use_authenticated_signature'; end $$;
revoke all on function public.submit_bespoke_request(uuid,jsonb),public.convert_bespoke_request_to_order(uuid,uuid,text) from public,anon,authenticated,service_role;

revoke all on function private.commission_actor(boolean),private.commission_replay(uuid,jsonb),
 private.commission_event(text,uuid,uuid,text,text,boolean),private.commission_immutable(),
 private.commission_snapshot(public.bespoke_requests),private.commission_payload(jsonb,public.bespoke_requests),private.commission_reference(boolean)
 from public,anon,authenticated,service_role;
revoke all on function public.submit_bespoke_request(jsonb,uuid),
 public.transition_bespoke_request(uuid,text,text,bigint,uuid),public.resubmit_bespoke_request(uuid,jsonb,text,bigint,uuid),
 public.convert_bespoke_request_to_order(uuid,bigint,uuid),public.transition_order_status(uuid,text,text,bigint,uuid),
 public.add_commission_private_note(uuid,text) from public,anon,authenticated,service_role;
grant execute on function public.submit_bespoke_request(jsonb,uuid),
 public.transition_bespoke_request(uuid,text,text,bigint,uuid),public.resubmit_bespoke_request(uuid,jsonb,text,bigint,uuid),
 public.convert_bespoke_request_to_order(uuid,bigint,uuid),public.transition_order_status(uuid,text,text,bigint,uuid),
 public.add_commission_private_note(uuid,text) to authenticated;
-- Existing RLS read policies remain in force; every business mutation is RPC-only.
revoke insert,update,delete on public.bespoke_requests,public.orders from public,anon,authenticated;
commit;
