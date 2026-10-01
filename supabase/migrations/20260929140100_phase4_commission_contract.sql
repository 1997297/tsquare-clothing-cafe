-- Phase 4 contract migration. Apply only after the Phase 4 application is live.
begin;

-- Reconcile any row created during a partially completed deployment before the
-- legacy submit contract is retired. The expansion trigger normally makes this
-- a no-op, but the contract independently guarantees complete revision history.
insert into public.bespoke_request_revisions(request_id,revision,snapshot,provenance)
select r.id,r.revision,private.commission_snapshot(r),'cutover_reconcile'
from public.bespoke_requests r
where not exists (
 select 1 from public.bespoke_request_revisions rev
 where rev.request_id=r.id and rev.revision=r.revision
)
on conflict (request_id,revision) do nothing;

-- Preserve confidential values while allowing clients and staff to read every
-- explicitly public request field through the existing RLS policies.
revoke select on public.bespoke_requests from public,anon,authenticated;
do $$ declare c record; begin
 for c in select attname from pg_attribute where attrelid='public.bespoke_requests'::regclass and attnum>0 and not attisdropped loop
 execute format('revoke select (%I) on public.bespoke_requests from public, anon, authenticated',c.attname);
 if c.attname not in ('admin_notes','submission_intent') then
 execute format('grant select (%I) on public.bespoke_requests to authenticated',c.attname);
 end if;
 end loop;
end; $$;

-- Fail closed even if a future grant accidentally restores either legacy,
-- caller-supplied identity overload.
create or replace function public.submit_bespoke_request(p_customer_id uuid,p_payload jsonb)
returns public.bespoke_requests language plpgsql security invoker set search_path='' as $$
begin raise exception 'retired_rpc_use_authenticated_signature'; end; $$;
create or replace function public.convert_bespoke_request_to_order(p_request_id uuid,p_actor_id uuid,p_actor_type text)
returns public.orders language plpgsql security invoker set search_path='' as $$
begin raise exception 'retired_rpc_use_authenticated_signature'; end; $$;
revoke all on function public.submit_bespoke_request(uuid,jsonb),public.convert_bespoke_request_to_order(uuid,uuid,text)
 from public,anon,authenticated,service_role;

commit;
