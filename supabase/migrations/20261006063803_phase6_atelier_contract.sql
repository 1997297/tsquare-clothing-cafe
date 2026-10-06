-- Apply ONLY after the Phase 6 application and exported actions have transitioned.
begin;
set local lock_timeout='10s';
create or replace function public.request_appointment_change(p_customer_id uuid,p_appointment_id uuid,p_change_type text,
 p_proposed_date text default null,p_proposed_time text default null,p_reason text default null)
returns public.appointment_change_requests language plpgsql security invoker set search_path='' as $$ begin
 raise exception 'retired_rpc_use_authenticated_signature'; end $$;
create or replace function public.create_customer_concierge_request(p_customer_id uuid,p_payload jsonb)
returns public.concierge_requests language plpgsql security invoker set search_path='' as $$ begin
 raise exception 'retired_rpc_use_authenticated_signature'; end $$;
create or replace function public.add_customer_concierge_message(p_customer_id uuid,p_request_id uuid,p_message text)
returns public.concierge_messages language plpgsql security invoker set search_path='' as $$ begin
 raise exception 'retired_rpc_use_authenticated_signature'; end $$;
revoke all on function public.request_appointment_change(uuid,uuid,text,text,text,text),
 public.create_customer_concierge_request(uuid,jsonb),public.add_customer_concierge_message(uuid,uuid,text)
 from public,anon,authenticated,service_role;

-- Broad table grants and any residual column grants must both be removed.
do $$ declare t text; c record; begin
 foreach t in array array['appointments','appointment_change_requests','concierge_requests','concierge_messages','public_fitting_requests'] loop
 execute format('revoke insert,update,delete,truncate on public.%I from public,anon,authenticated,service_role',t);
 for c in select attname from pg_attribute where attrelid=format('public.%I',t)::regclass and attnum>0 and not attisdropped loop
 execute format('revoke insert (%I),update (%I) on public.%I from public,anon,authenticated,service_role',c.attname,c.attname,t);
 end loop;
 end loop;
end $$;
-- The retained public-intake function is SECURITY INVOKER and service-only. These
-- are exactly its appointment insert and intake insert/link-update requirements.
grant insert(customer_id,type,preferred_date,preferred_time,status,notes) on public.appointments to service_role;
grant insert(customer_id,name,email,phone,appointment_type,preferred_date,preferred_time,notes,style_reference,is_existing_customer,status)
 on public.public_fitting_requests to service_role;
grant update(appointment_id,updated_at) on public.public_fitting_requests to service_role;
-- Existing SELECT and lifecycle INSERT remain for the invoker's RETURNING and
-- public-fitting event; the appointment insert trigger permits requested only.

-- Old sender values remain stored unchanged, but raw internal identity/name is no
-- longer selectable through the Data API. Safe label comes from guarded thread RPC.
revoke select on public.concierge_messages from public,anon,authenticated;
do $$ declare c record; begin
 for c in select attname from pg_attribute where attrelid='public.concierge_messages'::regclass and attnum>0 and not attisdropped loop
 execute format('revoke select (%I) on public.concierge_messages from public,anon,authenticated',c.attname);
 if c.attname not in ('sender_id','sender_name') then execute format('grant select (%I) on public.concierge_messages to authenticated',c.attname); end if;
 end loop;
end $$;
commit;
