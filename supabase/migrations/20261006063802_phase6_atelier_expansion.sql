-- Phase 6 expansion: apply BEFORE the application transition. Legacy service
-- appointment-change/Concierge/public-fitting endpoints remain available here.
begin;
set local lock_timeout='10s';
do $$ begin
 if current_user in ('anon','authenticated','service_role') then raise exception 'migration_requires_database_owner'; end if;
end $$;
lock table public.appointments,public.appointment_change_requests,
 public.concierge_requests,public.concierge_messages in share row exclusive mode;

alter table public.appointments
 add column lock_version bigint not null default 1 check(lock_version>0),
 add column scheduled_start_at timestamptz,
 add column scheduled_end_at timestamptz,
 add column confirmed_at timestamptz,
 add column last_rescheduled_at timestamptz,
 add column completed_at timestamptz,
 add column cancelled_at timestamptz,
 add column cancelled_actor_type text check(cancelled_actor_type in ('customer','staff','system')),
 add column cancellation_reason text,
 add constraint atelier_schedule_pair check(
  (scheduled_start_at is null and scheduled_end_at is null) or
  (scheduled_start_at is not null and scheduled_end_at is not null and
   scheduled_end_at-scheduled_start_at between interval '15 minutes' and interval '240 minutes'
   and extract(epoch from scheduled_end_at-scheduled_start_at)::numeric % 60=0));
alter table public.appointment_change_requests
 add column lock_version bigint not null default 1 check(lock_version>0),
 add column appointment_version bigint check(appointment_version>0),
 add column review_reason text;
-- New timestamps are absolute instants even when a session timezone is not UTC.
-- This changes defaults only; every historical timestamp remains untouched.
alter table public.appointments alter column created_at set default now(),alter column updated_at set default now();
alter table public.appointment_change_requests alter column created_at set default now();
alter table public.concierge_requests alter column created_at set default now(),alter column updated_at set default now();
alter table public.concierge_messages alter column created_at set default now();
alter table public.concierge_requests
 add column lock_version bigint not null default 1 check(lock_version>0),
 add column last_message_seq bigint not null default 0 check(last_message_seq>=0),
 add column client_read_seq bigint not null default 0 check(client_read_seq>=0),
 add column staff_read_seq bigint not null default 0 check(staff_read_seq>=0),
 add column client_read_at timestamptz,
 add column staff_read_at timestamptz,
 add column last_message_at timestamptz,
 add column context_request_id uuid references public.bespoke_requests(id) on delete restrict,
 add column context_order_id uuid references public.orders(id) on delete restrict,
 add column context_appointment_id uuid references public.appointments(id) on delete restrict,
 add constraint atelier_read_bounds check(client_read_seq<=last_message_seq and staff_read_seq<=last_message_seq);
alter table public.concierge_messages add column message_seq bigint;
with numbered as (
 select id,row_number() over(partition by request_id order by created_at,id) seq from public.concierge_messages
) update public.concierge_messages m set message_seq=n.seq from numbered n where m.id=n.id;
alter table public.concierge_messages alter column message_seq set not null,
 add constraint atelier_message_seq_positive check(message_seq>0),
 add constraint atelier_message_sequence_key unique(request_id,message_seq);
update public.concierge_requests r set
 last_message_seq=(select coalesce(max(message_seq),0) from public.concierge_messages where request_id=r.id),
 last_message_at=(select created_at from public.concierge_messages where request_id=r.id order by message_seq desc limit 1);
-- Exactly one owned match only. Retain original context strings byte-for-byte.
update public.concierge_requests r set context_request_id=(
 select (array_agg(b.id))[1] from public.bespoke_requests b where b.customer_id=r.customer_id
 and (b.id::text=r.related_request_id or b.request_reference=r.related_request_id) having count(*)=1),
 context_order_id=(select (array_agg(o.id))[1] from public.orders o where o.customer_id=r.customer_id
 and o.id::text=r.related_order_id having count(*)=1),
 context_appointment_id=(select (array_agg(a.id))[1] from public.appointments a where a.customer_id=r.customer_id
 and a.id::text=r.related_appointment_id having count(*)=1);
do $$ declare unresolved bigint; begin
 select count(*) into unresolved from public.concierge_requests where
 (nullif(related_request_id,'') is not null and context_request_id is null) or
 (nullif(related_order_id,'') is not null and context_order_id is null) or
 (nullif(related_appointment_id,'') is not null and context_appointment_id is null);
 raise notice 'Phase 6 preserved unresolved legacy context conversations: %',unresolved;
end $$;

create index appointments_bespoke_request_idx on public.appointments(bespoke_request_id);
create index appointments_order_idx on public.appointments(order_id);
create index appointment_changes_customer_idx on public.appointment_change_requests(customer_id,created_at,id);
create index concierge_messages_sender_idx on public.concierge_messages(sender_id);
create index atelier_appointment_queue_idx on public.appointments(status,scheduled_start_at,id);
create index atelier_message_unread_idx on public.concierge_messages(request_id,sender_type,message_seq);
create index atelier_conversation_activity_idx on public.concierge_requests((coalesce(last_message_at,created_at)) desc,id desc);
create index atelier_context_request_idx on public.concierge_requests(context_request_id);
create index atelier_context_order_idx on public.concierge_requests(context_order_id);
create index atelier_context_appointment_idx on public.concierge_requests(context_appointment_id);

create table private.atelier_operation_results (
 actor_id uuid not null,operation_key uuid not null,result jsonb not null,
 primary key(actor_id,operation_key),
 foreign key(actor_id,operation_key) references private.commission_operations(actor_id,operation_key) on delete restrict
);
create table private.atelier_event_actors (
 event_id uuid primary key references public.lifecycle_events(id) on delete restrict,
 actor_id uuid not null references auth.users(id) on delete restrict,
 actor_role text not null check(actor_role in ('client','admin','ceo')),
 created_at timestamptz not null default now()
);
create table private.appointment_staff_notes (
 id uuid primary key default gen_random_uuid(),
 appointment_id uuid not null references public.appointments(id) on delete restrict,
 actor_id uuid not null references auth.users(id) on delete restrict,
 note text not null check(length(btrim(note)) between 1 and 2000),
 created_at timestamptz not null default now()
);
create table private.concierge_staff_senders (
 message_id uuid primary key references public.concierge_messages(id) on delete restrict,
 actor_id uuid not null references auth.users(id) on delete restrict,
 actor_role text not null check(actor_role in ('admin','ceo'))
);
create index atelier_event_actor_idx on private.atelier_event_actors(actor_id);
create index atelier_note_appointment_idx on private.appointment_staff_notes(appointment_id);
create index atelier_note_actor_idx on private.appointment_staff_notes(actor_id);
create index atelier_sender_actor_idx on private.concierge_staff_senders(actor_id);
alter table private.atelier_operation_results enable row level security;
alter table private.atelier_event_actors enable row level security;
alter table private.appointment_staff_notes enable row level security;
alter table private.concierge_staff_senders enable row level security;
revoke all on private.atelier_operation_results,private.atelier_event_actors,
 private.appointment_staff_notes,private.concierge_staff_senders from public,anon,authenticated,service_role;
create sequence private.atelier_concierge_reference_seq;
revoke all on sequence private.atelier_concierge_reference_seq from public,anon,authenticated,service_role;

create function private.atelier_text(t text,maximum integer,required boolean default false)
returns void language plpgsql set search_path='' as $$ begin
 if length(coalesce(t,''))>maximum or (required and nullif(btrim(t),'') is null) then raise exception 'invalid_input'; end if;
end $$;
create function private.atelier_date(d date) returns void language plpgsql set search_path='' as $$ begin
 if d is null or d<date '2000-01-01' or d>date '2099-12-31' then raise exception 'invalid_date'; end if;
end $$;
create function private.atelier_capacity_lock() returns void language plpgsql set search_path='' as $$ begin
 if current_setting('transaction_isolation')<>'read committed' then raise exception 'read_committed_required'; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('tcc:phase6:atelier-capacity',0));
end $$;
create function private.atelier_actor() returns uuid language plpgsql security definer set search_path='' as $$ begin
 return private.commission_actor(private.current_staff_role() in ('admin','ceo') is true);
end $$;
create function private.atelier_result(k uuid,r jsonb default null) returns jsonb
language plpgsql security definer set search_path='' as $$ declare v jsonb; begin
 if r is not null then insert into private.atelier_operation_results values(auth.uid(),k,r); return r; end if;
 select result into v from private.atelier_operation_results where actor_id=auth.uid() and operation_key=k;
 if v is null then raise exception 'missing_operation_result'; end if;
 if v?'appointment' then
  perform 1 from public.appointments where id=(v->'appointment'->>'id')::uuid and
  (customer_id=auth.uid() or private.current_staff_role() in ('admin','ceo'));
  if not found then raise exception 'not_found'; end if;
 end if;
 if v?'conversation' then
  perform 1 from public.concierge_requests where id=(v->'conversation'->>'id')::uuid and
  (customer_id=auth.uid() or private.current_staff_role() in ('admin','ceo'));
  if not found then raise exception 'not_found'; end if;
 end if;
 if v?'message' then
  perform 1 from public.concierge_requests where id=(v->'message'->>'request_id')::uuid and
  (customer_id=auth.uid() or private.current_staff_role() in ('admin','ceo'));
  if not found then raise exception 'not_found'; end if;
 end if;
 return v;
end $$;
create function private.atelier_immutable() returns trigger language plpgsql set search_path='' as $$ begin
 raise exception 'immutable_atelier_record';
end $$;
create trigger atelier_result_immutable before update or delete on private.atelier_operation_results for each row execute function private.atelier_immutable();
create trigger atelier_actor_immutable before update or delete on private.atelier_event_actors for each row execute function private.atelier_immutable();
create trigger atelier_note_immutable before update or delete on private.appointment_staff_notes for each row execute function private.atelier_immutable();
create trigger atelier_sender_immutable before update or delete on private.concierge_staff_senders for each row execute function private.atelier_immutable();
create trigger atelier_message_immutable before update or delete on public.concierge_messages for each row execute function private.atelier_immutable();
create function private.atelier_event_guard() returns trigger language plpgsql set search_path='' as $$ begin
 if old.entity_type in ('appointment','concierge_request') or
 (tg_op='UPDATE' and new.entity_type in ('appointment','concierge_request')) then raise exception 'immutable_atelier_record'; end if;
 if tg_op='DELETE' then return old; end if; return new;
end $$;
create trigger atelier_event_immutable before update or delete on public.lifecycle_events for each row execute function private.atelier_event_guard();

-- SECURITY INVOKER: compare the actual DML caller to the RPC owner. Never use
-- a caller-settable GUC or the current_user of a SECURITY DEFINER guard trigger.
create function private.atelier_trusted_writer() returns boolean language sql stable security invoker set search_path='' as $$
 select current_user=pg_catalog.pg_get_userbyid(p.proowner) from pg_catalog.pg_proc p
 where p.oid=pg_catalog.to_regprocedure('public.manage_atelier_appointment(uuid,text,date,time without time zone,integer,text,text,bigint,uuid)')
$$;
create function private.atelier_appointment_guard() returns trigger language plpgsql security invoker set search_path='' as $$ begin
 if tg_op='DELETE' then raise exception 'immutable_atelier_record'; end if;
 if tg_op='INSERT' then
  if new.status is distinct from 'requested' or new.scheduled_start_at is not null or new.scheduled_end_at is not null
  or new.confirmed_at is not null or new.confirmed_date is not null or new.confirmed_time is not null
  or new.completed_at is not null or new.cancelled_at is not null or new.last_rescheduled_at is not null
  or new.cancelled_actor_type is not null or new.cancellation_reason is not null or new.lock_version<>1 then raise exception 'appointment_requires_request'; end if;
  return new;
 end if;
 if private.atelier_trusted_writer() is distinct from true then raise exception 'appointment_rpc_required'; end if;
 if (to_jsonb(new)-array['status','confirmed_date','confirmed_time','scheduled_start_at','scheduled_end_at','confirmed_at',
 'last_rescheduled_at','completed_at','cancelled_at','cancelled_actor_type','cancellation_reason','lock_version','updated_at'])
 is distinct from (to_jsonb(old)-array['status','confirmed_date','confirmed_time','scheduled_start_at','scheduled_end_at','confirmed_at',
 'last_rescheduled_at','completed_at','cancelled_at','cancelled_actor_type','cancellation_reason','lock_version','updated_at'])
 or new.lock_version<>old.lock_version+1 then raise exception 'immutable_appointment_intent'; end if;
 if old.status in ('completed','cancelled') then raise exception 'appointment_terminal'; end if;
 if new.status not in ('requested','confirmed','completed','cancelled','scheduled','rescheduled') then raise exception 'invalid_transition'; end if;
 return new;
end $$;
create trigger atelier_appointment_guard before insert or update or delete on public.appointments for each row execute function private.atelier_appointment_guard();

create function private.atelier_change_guard() returns trigger language plpgsql security invoker set search_path='' as $$
declare a public.appointments; begin
 if tg_op='DELETE' then raise exception 'immutable_atelier_record'; end if;
 if tg_op='INSERT' then
  perform private.atelier_capacity_lock();
  select * into a from public.appointments where id=new.appointment_id for update;
  if not found or a.customer_id is distinct from new.customer_id then raise exception 'not_found'; end if;
  if a.status in ('completed','cancelled') then raise exception 'appointment_terminal'; end if;
  if new.status is distinct from 'pending_review' or new.reviewed_at is not null or new.review_reason is not null or new.lock_version<>1 then raise exception 'review_rpc_required'; end if;
  if exists(select 1 from public.appointment_change_requests where appointment_id=a.id and status='pending_review') then raise exception 'pending_change_exists'; end if;
  new.appointment_version:=a.lock_version; return new;
 end if;
 if private.atelier_trusted_writer() is distinct from true then raise exception 'review_rpc_required'; end if;
 if (to_jsonb(new)-array['status','reviewed_at','review_reason','lock_version']) is distinct from
 (to_jsonb(old)-array['status','reviewed_at','review_reason','lock_version']) or old.status<>'pending_review'
 or new.status not in ('approved','declined') or new.reviewed_at is null or new.lock_version<>old.lock_version+1 then raise exception 'immutable_change_request'; end if;
 return new;
end $$;
create trigger atelier_change_guard before insert or update or delete on public.appointment_change_requests for each row execute function private.atelier_change_guard();
-- Only bookkeeping is definer; the preceding invoker guard authorized the insert.
create function private.atelier_change_bookkeeping() returns trigger language plpgsql security definer set search_path='' as $$ begin
 update public.appointments set lock_version=lock_version+1,updated_at=now() where id=new.appointment_id; return new;
end $$;
create trigger atelier_change_bookkeeping after insert on public.appointment_change_requests for each row execute function private.atelier_change_bookkeeping();

create function private.atelier_conversation_guard() returns trigger language plpgsql security invoker set search_path='' as $$ begin
 if tg_op='DELETE' then raise exception 'immutable_atelier_record'; end if;
 if tg_op='INSERT' then
  if new.status is distinct from 'open' or new.lock_version<>1 or new.last_message_seq<>0 or new.client_read_seq<>0 or new.staff_read_seq<>0
  or new.client_read_at is not null or new.staff_read_at is not null or new.last_message_at is not null then raise exception 'conversation_rpc_required'; end if;
  return new;
 end if;
 if private.atelier_trusted_writer() is distinct from true then raise exception 'conversation_rpc_required'; end if;
 if (to_jsonb(new)-array['status','lock_version','last_message_seq','client_read_seq','staff_read_seq','client_read_at','staff_read_at','last_message_at','updated_at'])
 is distinct from (to_jsonb(old)-array['status','lock_version','last_message_seq','client_read_seq','staff_read_seq','client_read_at','staff_read_at','last_message_at','updated_at'])
 or new.client_read_seq<old.client_read_seq or new.staff_read_seq<old.staff_read_seq or new.last_message_seq<old.last_message_seq then raise exception 'immutable_conversation'; end if;
 return new;
end $$;
create trigger atelier_conversation_guard before insert or update or delete on public.concierge_requests for each row execute function private.atelier_conversation_guard();

create function private.atelier_message_guard() returns trigger language plpgsql security invoker set search_path='' as $$
declare r public.concierge_requests; begin
 perform private.atelier_text(new.message,4000,true);
 select * into r from public.concierge_requests where id=new.request_id for update;
 if not found then raise exception 'not_found'; end if;
 if r.status not in ('open','in_review','awaiting_customer') then raise exception 'conversation_closed'; end if;
 if new.sender_type='customer' then
  if new.sender_id is distinct from r.customer_id then raise exception 'invalid_sender'; end if;
 elsif new.sender_type='concierge' then
  if private.atelier_trusted_writer() is distinct from true or new.sender_id is not null or new.sender_name is distinct from 'TCC Concierge' then raise exception 'staff_message_rpc_required'; end if;
 else raise exception 'invalid_sender'; end if;
 if new.message_seq is not null then raise exception 'server_sequence_required'; end if;
 return new;
end $$;
create trigger a_atelier_message_guard before insert on public.concierge_messages for each row execute function private.atelier_message_guard();
-- Alphabetical trigger order is intentional: caller identity is checked by the
-- INVOKER guard FIRST, then this definer performs only controlled bookkeeping.
create function private.atelier_message_sequence() returns trigger language plpgsql security definer set search_path='' as $$ begin
 update public.concierge_requests set last_message_seq=last_message_seq+1,last_message_at=new.created_at,updated_at=now()
 where id=new.request_id returning last_message_seq into new.message_seq; return new;
end $$;
create trigger b_atelier_message_sequence before insert on public.concierge_messages for each row execute function private.atelier_message_sequence();

create function private.atelier_context(c uuid,o uuid,b uuid,a uuid) returns void language plpgsql security definer set search_path='' as $$
declare source uuid; ap public.appointments; begin
 if o is not null then
  select bespoke_request_id into source from public.orders where id=o and customer_id=c for share;
  if not found then raise exception 'not_found'; end if;
  if b is not null and source is not null and source<>b then raise exception 'context_mismatch'; end if;
 end if;
 if b is not null then perform 1 from public.bespoke_requests where id=b and customer_id=c for share; if not found then raise exception 'not_found'; end if; end if;
 if a is not null then
  select * into ap from public.appointments where id=a and customer_id=c for share;
  if not found then raise exception 'not_found'; end if;
  if (o is not null and ap.order_id is not null and ap.order_id<>o) or
   (b is not null and ap.bespoke_request_id is not null and ap.bespoke_request_id<>b) then raise exception 'context_mismatch'; end if;
 end if;
end $$;
create function private.atelier_conversation_context_guard() returns trigger language plpgsql security definer set search_path='' as $$
declare resolved uuid; matches bigint; begin
 if nullif(new.related_request_id,'') is not null then
  select count(*),(array_agg(id))[1] into matches,resolved from public.bespoke_requests where customer_id=new.customer_id and (id::text=new.related_request_id or request_reference=new.related_request_id);
  if matches<>1 then raise exception 'not_found'; end if;
  if new.context_request_id is not null and new.context_request_id<>resolved then raise exception 'context_mismatch'; end if;
  new.context_request_id:=resolved;
 end if;
 if nullif(new.related_order_id,'') is not null then
  select id into resolved from public.orders where customer_id=new.customer_id and id::text=new.related_order_id;
  if not found then raise exception 'not_found'; end if;
  if new.context_order_id is not null and new.context_order_id<>resolved then raise exception 'context_mismatch'; end if;
  new.context_order_id:=resolved;
 end if;
 if nullif(new.related_appointment_id,'') is not null then
  select id into resolved from public.appointments where customer_id=new.customer_id and id::text=new.related_appointment_id;
  if not found then raise exception 'not_found'; end if;
  if new.context_appointment_id is not null and new.context_appointment_id<>resolved then raise exception 'context_mismatch'; end if;
  new.context_appointment_id:=resolved;
 end if;
 perform private.atelier_context(new.customer_id,new.context_order_id,new.context_request_id,new.context_appointment_id); return new;
end $$;
create trigger atelier_conversation_context before insert on public.concierge_requests for each row execute function private.atelier_conversation_context_guard();

create function private.atelier_event(t text,e uuid,c uuid,k text,m jsonb,notify boolean) returns void
language plpgsql security definer set search_path='' as $$ declare id uuid; role text:=coalesce(private.current_staff_role(),'client'); begin
 insert into public.lifecycle_events(entity_type,entity_id,customer_id,event_type,actor_type,actor_id,metadata,created_at)
 values(t,e,c,k,case when role='client' then 'customer' else 'staff' end,case when role='client' then auth.uid() end,m,now()) returning lifecycle_events.id into id;
 insert into private.atelier_event_actors values(id,auth.uid(),role,now());
 if notify then insert into public.notifications(customer_id,type,title,message,related_entity_type,related_entity_id,created_at)
 values(c,k,case when t='appointment' then 'Atelier appointment' else 'TCC Concierge' end,
 coalesce(m->>'reason',replace(k,'_',' ')),t,e::text,now()); end if;
end $$;
create function private.atelier_message_json(m public.concierge_messages) returns jsonb language sql immutable set search_path='' as $$
 select jsonb_build_object('id',m.id,'request_id',m.request_id,'message_seq',m.message_seq,'sender_type',m.sender_type,
 'sender_name',case when m.sender_type='concierge' then 'TCC Concierge' else m.sender_name end,'message',m.message,'created_at',m.created_at)
$$;
create function private.atelier_note(a uuid,n text) returns uuid language plpgsql security definer set search_path='' as $$ declare id uuid; begin
 perform private.atelier_text(n,2000); if nullif(btrim(n),'') is null then return null; end if;
 insert into private.appointment_staff_notes(appointment_id,actor_id,note) values(a,auth.uid(),btrim(n)) returning appointment_staff_notes.id into id; return id;
end $$;
create function private.atelier_apply(a public.appointments,action text,d date,t time without time zone,minutes integer,reason text)
returns public.appointments language plpgsql security definer set search_path='' as $$
declare start_at timestamptz; end_at timestamptz; before_row jsonb:=to_jsonb(a); begin
 perform private.atelier_text(reason,1000);
 if a.status in ('completed','cancelled') then raise exception 'appointment_terminal'; end if;
 if action in ('confirm','reschedule') then
  if (action='confirm' and a.status<>'requested') or (action='reschedule' and a.status not in ('confirmed','scheduled','rescheduled')) then raise exception 'invalid_transition'; end if;
  perform private.atelier_date(d);
  if t is null or extract(second from t)<>0 or t>=time '24:00' or minutes is null or minutes not between 15 and 240 then raise exception 'invalid_schedule'; end if;
  if action='reschedule' then perform private.atelier_text(reason,1000,true); end if;
  start_at:=(d+t) at time zone 'Africa/Lagos'; end_at:=start_at+minutes*interval '1 minute';
  if start_at<now() then raise exception 'schedule_in_past'; end if;
  if exists(select 1 from public.appointments where id<>a.id and status in ('confirmed','scheduled','rescheduled') and scheduled_start_at is null) then raise exception 'legacy_schedule_requires_review'; end if;
  if exists(select 1 from public.appointments where id<>a.id and status in ('confirmed','scheduled','rescheduled')
   and scheduled_start_at<end_at and scheduled_end_at>start_at) then raise exception 'schedule_conflict'; end if;
  update public.appointments set status='confirmed',scheduled_start_at=start_at,scheduled_end_at=end_at,
   confirmed_date=d::text,confirmed_time=to_char(start_at at time zone 'Africa/Lagos','HH24:MI'),confirmed_at=coalesce(confirmed_at,now()),
   last_rescheduled_at=case when action='reschedule' then now() else last_rescheduled_at end,
   lock_version=lock_version+1,updated_at=now() where id=a.id returning * into a;
 elsif action in ('cancel','complete') then
  if d is not null or t is not null or minutes is not null then raise exception 'invalid_schedule'; end if;
  if action='complete' and (a.status not in ('confirmed','scheduled','rescheduled') or a.scheduled_start_at is null or a.scheduled_start_at>now()) then raise exception 'completion_not_available'; end if;
  update public.appointments set status=case when action='cancel' then 'cancelled' else 'completed' end,
   cancelled_at=case when action='cancel' then now() else cancelled_at end,
   cancelled_actor_type=case when action='cancel' then 'staff' else cancelled_actor_type end,
   cancellation_reason=case when action='cancel' then nullif(btrim(reason),'') else cancellation_reason end,
   completed_at=case when action='complete' then now() else completed_at end,
   lock_version=lock_version+1,updated_at=now() where id=a.id returning * into a;
 else raise exception 'invalid_transition'; end if;
 perform private.atelier_event('appointment',a.id,a.customer_id,
  case action when 'confirm' then 'appointment_confirmed' when 'reschedule' then 'appointment_rescheduled' when 'cancel' then 'appointment_cancelled' else 'appointment_completed' end,
  jsonb_build_object('previous_status',before_row->>'status','status',a.status,'previous_start_at',before_row->'scheduled_start_at',
  'previous_end_at',before_row->'scheduled_end_at','previous_confirmed_date',before_row->'confirmed_date','previous_confirmed_time',before_row->'confirmed_time',
  'start_at',a.scheduled_start_at,'end_at',a.scheduled_end_at,'timezone','Africa/Lagos','reason',nullif(btrim(reason),'')),true);
 return a;
end $$;

create function public.create_atelier_appointment(p_type text,p_preferred_date date,p_preferred_time text,
 p_order_id uuid,p_bespoke_request_id uuid,p_note text,p_operation_key uuid) returns jsonb
language plpgsql security definer set search_path='' as $$ declare actor uuid; a public.appointments; replay boolean; begin
 actor:=private.commission_actor(false);
 replay:=private.commission_replay(p_operation_key,jsonb_build_array('phase6:appointment:create',p_type,p_preferred_date,p_preferred_time,p_order_id,p_bespoke_request_id,p_note));
 -- Operation lock precedes context row locks; ownership precedes cached output.
 perform private.atelier_context(actor,p_order_id,p_bespoke_request_id,null);
 if replay then return private.atelier_result(p_operation_key); end if;
 perform private.atelier_date(p_preferred_date);
 if p_preferred_date<(now() at time zone 'Africa/Lagos')::date then raise exception 'preferred_date_in_past'; end if;
 if p_type is null or p_type not in ('consultation','style-consultation','measurement','first-fitting','final-fitting','pickup','other') then raise exception 'invalid_purpose'; end if;
 perform private.atelier_text(p_preferred_time,80,true); perform private.atelier_text(p_note,2000);
 insert into public.appointments(customer_id,type,preferred_date,preferred_time,order_id,bespoke_request_id,notes)
 values(actor,p_type,p_preferred_date::text,btrim(p_preferred_time),p_order_id,p_bespoke_request_id,nullif(btrim(p_note),'')) returning * into a;
 perform private.atelier_event('appointment',a.id,actor,'appointment_requested',jsonb_build_object('status','requested'),false);
 return private.atelier_result(p_operation_key,jsonb_build_object('appointment',to_jsonb(a)));
end $$;

create function public.request_atelier_appointment_change(p_appointment_id uuid,p_change_type text,p_proposed_date date,
 p_proposed_time text,p_reason text,p_expected_version bigint,p_operation_key uuid) returns jsonb
language plpgsql security definer set search_path='' as $$ declare actor uuid; a public.appointments; ch public.appointment_change_requests; replay boolean; begin
 actor:=private.commission_actor(false);
 perform 1 from public.appointments where id=p_appointment_id and customer_id=actor; if not found then raise exception 'not_found'; end if;
 replay:=private.commission_replay(p_operation_key,jsonb_build_array('phase6:appointment:change',p_appointment_id,p_change_type,p_proposed_date,p_proposed_time,p_reason,p_expected_version));
 perform private.atelier_capacity_lock();
 select * into a from public.appointments where id=p_appointment_id and customer_id=actor for update;
 if not found then raise exception 'not_found'; end if;
 if replay then return private.atelier_result(p_operation_key); end if;
 if a.lock_version is distinct from p_expected_version then raise exception 'stale_version'; end if;
 perform private.atelier_text(p_reason,1000);
 if p_change_type='reschedule' then
  perform private.atelier_date(p_proposed_date); perform private.atelier_text(p_proposed_time,80,true);
  if p_proposed_date<(now() at time zone 'Africa/Lagos')::date then raise exception 'preferred_date_in_past'; end if;
 elsif p_change_type='cancellation' then
  if p_proposed_date is not null or p_proposed_time is not null then raise exception 'invalid_input'; end if;
 else raise exception 'invalid_change_type'; end if;
 insert into public.appointment_change_requests(appointment_id,customer_id,change_type,proposed_date,proposed_time,reason)
 values(a.id,actor,p_change_type,p_proposed_date::text,nullif(btrim(p_proposed_time),''),nullif(btrim(p_reason),'')) returning * into ch;
 select * into a from public.appointments where id=a.id;
 perform private.atelier_event('appointment',a.id,actor,'appointment_change_requested',jsonb_build_object('change_request_id',ch.id,'change_type',ch.change_type),false);
 return private.atelier_result(p_operation_key,jsonb_build_object('appointment',to_jsonb(a),'change_request',to_jsonb(ch)));
end $$;

create function public.manage_atelier_appointment(p_appointment_id uuid,p_action text,p_schedule_date date,
 p_schedule_time time without time zone,p_duration_minutes integer,p_reason text,p_staff_note text,p_expected_version bigint,p_operation_key uuid)
returns jsonb language plpgsql security definer set search_path='' as $$ declare actor uuid; a public.appointments; replay boolean; begin
 actor:=private.commission_actor(true);
 perform 1 from public.appointments where id=p_appointment_id; if not found then raise exception 'not_found'; end if;
 replay:=private.commission_replay(p_operation_key,jsonb_build_array('phase6:appointment:manage',p_appointment_id,p_action,p_schedule_date,p_schedule_time,p_duration_minutes,p_reason,p_staff_note,p_expected_version));
 perform private.atelier_capacity_lock(); select * into a from public.appointments where id=p_appointment_id for update;
 if not found then raise exception 'not_found'; end if;
 if replay then return private.atelier_result(p_operation_key); end if;
 if a.lock_version is distinct from p_expected_version then raise exception 'stale_version'; end if;
 if exists(select 1 from public.appointment_change_requests where appointment_id=a.id and status='pending_review') then raise exception 'pending_change_exists'; end if;
 a:=private.atelier_apply(a,p_action,p_schedule_date,p_schedule_time,p_duration_minutes,p_reason);
 perform private.atelier_note(a.id,p_staff_note);
 return private.atelier_result(p_operation_key,jsonb_build_object('appointment',to_jsonb(a)));
end $$;

create function public.review_atelier_appointment_change(p_change_request_id uuid,p_decision text,p_schedule_date date,
 p_schedule_time time without time zone,p_duration_minutes integer,p_reason text,p_staff_note text,
 p_expected_appointment_version bigint,p_expected_change_version bigint,p_operation_key uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare actor uuid; a public.appointments; ch public.appointment_change_requests; replay boolean; ap uuid; begin
 actor:=private.commission_actor(true);
 select appointment_id into ap from public.appointment_change_requests where id=p_change_request_id;
 if not found then raise exception 'not_found'; end if;
 replay:=private.commission_replay(p_operation_key,jsonb_build_array('phase6:appointment:review',p_change_request_id,p_decision,p_schedule_date,p_schedule_time,p_duration_minutes,p_reason,p_staff_note,p_expected_appointment_version,p_expected_change_version));
 perform private.atelier_capacity_lock(); select * into a from public.appointments where id=ap for update;
 select * into ch from public.appointment_change_requests where id=p_change_request_id for update;
 if a.id is null or ch.id is null then raise exception 'not_found'; end if;
 if replay then return private.atelier_result(p_operation_key); end if;
 if a.lock_version is distinct from p_expected_appointment_version or ch.lock_version is distinct from p_expected_change_version then raise exception 'stale_version'; end if;
 if ch.status<>'pending_review' then raise exception 'change_already_reviewed'; end if;
 perform private.atelier_text(p_reason,1000,p_decision='decline');
 if p_decision='approve' then
  a:=private.atelier_apply(a,case when ch.change_type='cancellation' then 'cancel' when a.status='requested' then 'confirm' else 'reschedule' end,p_schedule_date,p_schedule_time,p_duration_minutes,p_reason);
 elsif p_decision='decline' then
  if p_schedule_date is not null or p_schedule_time is not null or p_duration_minutes is not null then raise exception 'invalid_schedule'; end if;
  update public.appointments set lock_version=lock_version+1,updated_at=now() where id=a.id returning * into a;
 else raise exception 'invalid_decision'; end if;
 update public.appointment_change_requests set status=case when p_decision='approve' then 'approved' else 'declined' end,
 reviewed_at=now(),review_reason=nullif(btrim(p_reason),''),lock_version=lock_version+1 where id=ch.id returning * into ch;
 perform private.atelier_note(a.id,p_staff_note);
 perform private.atelier_event('appointment',a.id,a.customer_id,'appointment_change_'||ch.status,
 jsonb_build_object('change_request_id',ch.id,'change_type',ch.change_type,'reason',ch.review_reason),p_decision='decline');
 return private.atelier_result(p_operation_key,jsonb_build_object('appointment',to_jsonb(a),'change_request',to_jsonb(ch)));
end $$;

create function public.add_atelier_appointment_note(p_appointment_id uuid,p_note text,p_operation_key uuid)
returns jsonb language plpgsql security definer set search_path='' as $$ declare actor uuid; replay boolean; note_id uuid; begin
 actor:=private.commission_actor(true);
 perform 1 from public.appointments where id=p_appointment_id; if not found then raise exception 'not_found'; end if;
 replay:=private.commission_replay(p_operation_key,jsonb_build_array('phase6:appointment:note',p_appointment_id,p_note));
 perform private.atelier_capacity_lock(); perform 1 from public.appointments where id=p_appointment_id for share;
 if not found then raise exception 'not_found'; end if;
 if replay then return private.atelier_result(p_operation_key); end if;
 perform private.atelier_text(p_note,2000,true); note_id:=private.atelier_note(p_appointment_id,p_note);
 return private.atelier_result(p_operation_key,jsonb_build_object('note_id',note_id));
end $$;

create function public.get_atelier_appointment_detail(p_appointment_id uuid) returns jsonb
language plpgsql security definer set search_path='' as $$ declare actor uuid; staff boolean; result jsonb; begin
 actor:=private.atelier_actor(); staff:=private.current_staff_role() in ('admin','ceo') is true;
 -- All projections, including staff-only data, are produced in one SQL snapshot.
 select jsonb_build_object('appointment',to_jsonb(a),'changes',coalesce((select jsonb_agg(to_jsonb(c) order by c.created_at,c.id) from public.appointment_change_requests c where c.appointment_id=a.id),'[]'::jsonb),
 'history',coalesce((select jsonb_agg(to_jsonb(e)-'actor_id' order by e.created_at,e.id) from public.lifecycle_events e where e.entity_type='appointment' and e.entity_id=a.id),'[]'::jsonb)) ||
 case when staff then jsonb_build_object('staff_notes',coalesce((select jsonb_agg(to_jsonb(n) order by n.created_at,n.id) from private.appointment_staff_notes n where n.appointment_id=a.id),'[]'::jsonb),
 'staff_actors',coalesce((select jsonb_agg(to_jsonb(x)) from private.atelier_event_actors x join public.lifecycle_events e on e.id=x.event_id where e.entity_type='appointment' and e.entity_id=a.id),'[]'::jsonb)) else '{}'::jsonb end
 into result from public.appointments a where a.id=p_appointment_id and (a.customer_id=actor or staff);
 if result is null then raise exception 'not_found'; end if; return result;
end $$;

create function public.create_atelier_concierge_request(p_category text,p_subject text,p_message text,
 p_order_id uuid,p_bespoke_request_id uuid,p_appointment_id uuid,p_operation_key uuid) returns jsonb
language plpgsql security definer set search_path='' as $$ declare actor uuid; r public.concierge_requests; m public.concierge_messages; replay boolean; reference text; violated text; reference_number bigint; begin
 actor:=private.commission_actor(false);
 replay:=private.commission_replay(p_operation_key,jsonb_build_array('phase6:concierge:create',p_category,p_subject,p_message,p_order_id,p_bespoke_request_id,p_appointment_id));
 perform private.atelier_context(actor,p_order_id,p_bespoke_request_id,p_appointment_id);
 if replay then return private.atelier_result(p_operation_key); end if;
 if p_category is null or p_category not in ('discuss_order','discuss_request','fitting_enquiry','payment_question','style_consultation','general_enquiry') then raise exception 'invalid_category'; end if;
 perform private.atelier_text(p_subject,160,true); perform private.atelier_text(p_message,4000,true);
 if length(btrim(p_subject))<3 or length(btrim(p_message))<3 then raise exception 'invalid_input'; end if;
 loop begin
  reference_number:=nextval('private.atelier_concierge_reference_seq');
  reference:='TCC-CONC-'||lpad(reference_number::text,greatest(8,length(reference_number::text)),'0');
  insert into public.concierge_requests(reference_code,customer_id,category,subject,message,related_order_id,related_request_id,related_appointment_id,context_order_id,context_request_id,context_appointment_id)
  values(reference,actor,p_category,btrim(p_subject),btrim(p_message),p_order_id::text,p_bespoke_request_id::text,p_appointment_id::text,p_order_id,p_bespoke_request_id,p_appointment_id) returning * into r;
  exit;
 exception when unique_violation then get stacked diagnostics violated=CONSTRAINT_NAME;
  if violated<>'concierge_requests_reference_code_key' then raise; end if;
 end; end loop;
 insert into public.concierge_messages(request_id,sender_type,sender_id,sender_name,message)
 values(r.id,'customer',actor,'Client',btrim(p_message)) returning * into m;
 select * into r from public.concierge_requests where id=r.id;
 perform private.atelier_event('concierge_request',r.id,actor,'concierge_request_created',jsonb_build_object('message_id',m.id,'message_seq',m.message_seq),false);
 return private.atelier_result(p_operation_key,jsonb_build_object('conversation',to_jsonb(r),'message',private.atelier_message_json(m)));
end $$;

create function public.send_atelier_concierge_message(p_request_id uuid,p_message text,p_operation_key uuid) returns jsonb
language plpgsql security definer set search_path='' as $$ declare actor uuid; staff boolean; r public.concierge_requests; m public.concierge_messages; replay boolean; begin
 actor:=private.atelier_actor(); staff:=private.current_staff_role() in ('admin','ceo') is true;
 perform 1 from public.concierge_requests where id=p_request_id and (customer_id=actor or staff); if not found then raise exception 'not_found'; end if;
 replay:=private.commission_replay(p_operation_key,jsonb_build_array('phase6:concierge:send',p_request_id,p_message));
 select * into r from public.concierge_requests where id=p_request_id and (customer_id=actor or staff) for update;
 if not found then raise exception 'not_found'; end if;
 if replay then return private.atelier_result(p_operation_key); end if;
 perform private.atelier_text(p_message,4000,true);
 insert into public.concierge_messages(request_id,sender_type,sender_id,sender_name,message)
 values(r.id,case when staff then 'concierge' else 'customer' end,case when not staff then actor end,case when staff then 'TCC Concierge' else 'Client' end,btrim(p_message)) returning * into m;
 if staff then insert into private.concierge_staff_senders values(m.id,actor,private.current_staff_role()); end if;
 perform private.atelier_event('concierge_request',r.id,r.customer_id,case when staff then 'concierge_staff_reply' else 'concierge_customer_message' end,
 jsonb_build_object('message_id',m.id,'message_seq',m.message_seq),staff);
 return private.atelier_result(p_operation_key,jsonb_build_object('message',private.atelier_message_json(m),'last_message_seq',m.message_seq));
end $$;

create function public.mark_atelier_concierge_read(p_request_id uuid,p_observed_message_seq bigint) returns jsonb
language plpgsql security definer set search_path='' as $$ declare actor uuid; staff boolean; r public.concierge_requests; cursor bigint; unread bigint; begin
 actor:=private.atelier_actor(); staff:=private.current_staff_role() in ('admin','ceo') is true;
 select * into r from public.concierge_requests where id=p_request_id and (customer_id=actor or staff) for update;
 if not found then raise exception 'not_found'; end if;
 if p_observed_message_seq is null or p_observed_message_seq<0 or p_observed_message_seq>r.last_message_seq or
 (p_observed_message_seq>0 and not exists(select 1 from public.concierge_messages where request_id=r.id and message_seq=p_observed_message_seq)) then raise exception 'invalid_read_sequence'; end if;
 cursor:=greatest(case when staff then r.staff_read_seq else r.client_read_seq end,p_observed_message_seq);
 if staff then update public.concierge_requests set staff_read_seq=cursor,staff_read_at=case when cursor>staff_read_seq then now() else staff_read_at end where id=r.id;
 else update public.concierge_requests set client_read_seq=cursor,client_read_at=case when cursor>client_read_seq then now() else client_read_at end where id=r.id; end if;
 select count(*) into unread from public.concierge_messages where request_id=r.id and message_seq>cursor and sender_type=case when staff then 'customer' else 'concierge' end;
 return jsonb_build_object('side',case when staff then 'staff' else 'client' end,'read_seq',cursor,'unread_messages',unread);
end $$;

create function public.set_atelier_concierge_status(p_request_id uuid,p_status text,p_expected_version bigint,p_operation_key uuid)
returns jsonb language plpgsql security definer set search_path='' as $$ declare actor uuid; r public.concierge_requests; previous text; replay boolean; begin
 actor:=private.commission_actor(true);
 perform 1 from public.concierge_requests where id=p_request_id; if not found then raise exception 'not_found'; end if;
 replay:=private.commission_replay(p_operation_key,jsonb_build_array('phase6:concierge:status',p_request_id,p_status,p_expected_version));
 select * into r from public.concierge_requests where id=p_request_id for update;
 if not found then raise exception 'not_found'; end if;
 if replay then return private.atelier_result(p_operation_key); end if;
 if r.lock_version is distinct from p_expected_version then raise exception 'stale_version'; end if;
 if p_status is null or p_status not in ('open','in_review','awaiting_customer','resolved','closed') or p_status=r.status then raise exception 'invalid_transition'; end if;
 previous:=r.status;
 update public.concierge_requests set status=p_status,lock_version=lock_version+1,updated_at=now() where id=r.id returning * into r;
 perform private.atelier_event('concierge_request',r.id,r.customer_id,'concierge_status_changed',jsonb_build_object('previous_status',previous,'status',r.status),false);
 return private.atelier_result(p_operation_key,jsonb_build_object('conversation',to_jsonb(r)));
end $$;

create function public.get_atelier_concierge_thread(p_request_id uuid,p_after_seq bigint,p_limit integer) returns jsonb
language plpgsql security definer set search_path='' as $$ declare actor uuid; staff boolean; result jsonb; begin
 actor:=private.atelier_actor(); staff:=private.current_staff_role() in ('admin','ceo') is true;
 if p_after_seq is null or p_after_seq<0 or p_limit is null or p_limit not between 1 and 100 then raise exception 'invalid_pagination'; end if;
 with visible as (select * from public.concierge_requests where id=p_request_id and (customer_id=actor or staff)),
 page as (select m.* from public.concierge_messages m join visible r on r.id=m.request_id where m.message_seq>p_after_seq order by m.message_seq limit p_limit)
 select jsonb_build_object('conversation',to_jsonb(r),'messages',coalesce((select jsonb_agg(private.atelier_message_json(m) order by m.message_seq) from page m),'[]'::jsonb),
 'observed_message_seq',(select coalesce(max(message_seq),p_after_seq) from page),
 'has_more',exists(select 1 from public.concierge_messages where request_id=r.id and message_seq>(select coalesce(max(message_seq),p_after_seq) from page)),
 'unread_messages',(select count(*) from public.concierge_messages where request_id=r.id and sender_type=case when staff then 'customer' else 'concierge' end and message_seq>case when staff then r.staff_read_seq else r.client_read_seq end)) ||
 case when staff then jsonb_build_object('staff_senders',coalesce((select jsonb_agg(to_jsonb(s)) from private.concierge_staff_senders s join page m on m.id=s.message_id),'[]'::jsonb)) else '{}'::jsonb end into result from visible r;
 if result is null then raise exception 'not_found'; end if;
 if p_after_seq>(result->'conversation'->>'last_message_seq')::bigint then raise exception 'invalid_pagination'; end if;
 return result;
end $$;

create function public.get_atelier_concierge_inbox(p_status text,p_unread_only boolean,p_before_activity_at timestamptz,p_before_request_id uuid,p_limit integer)
returns jsonb language plpgsql security definer set search_path='' as $$ declare actor uuid; result jsonb; begin
 actor:=private.commission_actor(true);
 if p_limit is null or p_limit not between 1 and 100 or p_unread_only is null or
 (p_status is not null and p_status not in ('open','in_review','awaiting_customer','resolved','closed')) or
 (p_before_activity_at is null)<>(p_before_request_id is null) then raise exception 'invalid_pagination'; end if;
 with candidates as (
 select r.*,coalesce(r.last_message_at,r.created_at) activity_at,
 (select count(*) from public.concierge_messages where request_id=r.id and sender_type='customer' and message_seq>r.staff_read_seq) unread_messages
 from public.concierge_requests r where (p_status is null or r.status=p_status) and
 (p_before_activity_at is null or (coalesce(r.last_message_at,r.created_at),r.id)<(p_before_activity_at,p_before_request_id))
 ), page as (select * from candidates where not p_unread_only or unread_messages>0 order by activity_at desc,id desc limit p_limit+1),
 bounded as (select * from page order by activity_at desc,id desc limit p_limit)
 select jsonb_build_object('conversations',coalesce((select jsonb_agg(to_jsonb(r)||jsonb_build_object(
 'client_name',(select btrim(first_name||' '||last_name) from public.profiles where id=r.customer_id),
 'latest_message',(select private.atelier_message_json(m)||jsonb_build_object('message',left(m.message,160)) from public.concierge_messages m where m.request_id=r.id order by m.message_seq desc limit 1)) order by r.activity_at desc,r.id desc) from bounded r),'[]'::jsonb),
 'has_more',(select count(*)>p_limit from page)) into result; return result;
end $$;

create function public.get_atelier_service_counts() returns jsonb language plpgsql security definer set search_path='' as $$
declare actor uuid; staff boolean; today date; result jsonb; begin
 actor:=private.atelier_actor(); staff:=private.current_staff_role() in ('admin','ceo') is true; today:=(now() at time zone 'Africa/Lagos')::date;
 with visible_appointments as (select * from public.appointments where staff or customer_id=actor),
 unread as (select r.id,count(m.id) n from public.concierge_requests r join public.concierge_messages m on m.request_id=r.id
 where (staff or r.customer_id=actor) and m.sender_type=case when staff then 'customer' else 'concierge' end
 and m.message_seq>case when staff then r.staff_read_seq else r.client_read_seq end group by r.id)
 select jsonb_build_object('pending_appointments',(select count(*) from visible_appointments a where a.status='requested' or
 exists(select 1 from public.appointment_change_requests c where c.appointment_id=a.id and c.status='pending_review')),
 'today_confirmed_appointments',(select count(*) from visible_appointments where status in ('confirmed','scheduled','rescheduled') and
 scheduled_start_at>=today::timestamp at time zone 'Africa/Lagos' and scheduled_start_at<(today+1)::timestamp at time zone 'Africa/Lagos'),
 'unread_concierge_messages',(select coalesce(sum(n),0) from unread),'unread_concierge_conversations',(select count(*) from unread)) into result;
 return result;
end $$;

-- Pin and revoke every new helper/trigger API. Only harmless invoker helpers used
-- by legacy DML triggers are callable by those DML roles; they grant no write power.
do $$ declare f record; begin
 for f in select p.oid::regprocedure signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace
 where n.nspname='private' and (p.proname like 'atelier_%') loop
 execute format('revoke all on function %s from public,anon,authenticated,service_role',f.signature);
 end loop;
 for f in select p.oid::regprocedure signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace
 where n.nspname='public' and p.proname in ('create_atelier_appointment','request_atelier_appointment_change','manage_atelier_appointment',
 'review_atelier_appointment_change','add_atelier_appointment_note','get_atelier_appointment_detail','create_atelier_concierge_request',
 'send_atelier_concierge_message','mark_atelier_concierge_read','set_atelier_concierge_status','get_atelier_concierge_thread',
 'get_atelier_concierge_inbox','get_atelier_service_counts') loop
 execute format('revoke all on function %s from public,anon,authenticated,service_role',f.signature);
 execute format('grant execute on function %s to authenticated',f.signature);
 end loop;
end $$;
grant execute on function private.atelier_trusted_writer(),private.atelier_capacity_lock(),private.atelier_text(text,integer,boolean) to authenticated,service_role;
revoke insert,update,delete,truncate on public.appointments,public.appointment_change_requests,public.concierge_requests,public.concierge_messages from public,anon,authenticated;
commit;
