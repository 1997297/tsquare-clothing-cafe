-- Phase 7: existing client dossier reads and CEO-controlled Admin onboarding.
-- Additive only. No production records, bank settings, finance or storage edits.
begin;

alter table public.staff_accounts add column lock_version bigint not null default 1
  check (lock_version > 0);

create table private.staff_management_events (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references auth.users(id) on delete restrict,
  target_id uuid not null references auth.users(id) on delete restrict,
  operation_key uuid not null,
  action text not null check (action in ('add_admin','activate_admin','deactivate_admin')),
  intent jsonb not null,
  previous_status text,
  resulting_status text not null check (resulting_status in ('active','inactive')),
  created_at timestamptz not null default now(),
  unique(actor_id,operation_key)
);
create index staff_management_target_idx on private.staff_management_events(target_id,created_at desc);
alter table private.staff_management_events enable row level security;
revoke all on private.staff_management_events from public,anon,authenticated,service_role;
create trigger staff_management_events_immutable before update or delete on private.staff_management_events
for each row execute function private.commission_immutable();

-- All authorization writes acquire this lock BEFORE row locks. Statement trigger
-- also covers trusted SQL/bootstrap writes; API callers have no direct DML grant.
create function private.staff_management_lock() returns trigger
language plpgsql security invoker set search_path='' as $$ begin
  if current_setting('transaction_isolation') <> 'read committed' then raise exception 'read_committed_required'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('tcc:staff-management',0));
  return null;
end $$;
create trigger staff_management_lock before insert or update or delete on public.staff_accounts
for each statement execute function private.staff_management_lock();

create function private.protect_staff_history() returns trigger
language plpgsql security definer set search_path='' as $$ begin
  if tg_op='UPDATE' and new.user_id is distinct from old.user_id then raise exception 'staff_identity_immutable'; end if;
  if old.role='ceo' and old.status='active' and
    (tg_op='DELETE' or new.role is distinct from 'ceo' or new.status is distinct from 'active') then
    if not exists(select 1 from public.staff_accounts where role='ceo' and status='active' and user_id<>old.user_id) then
      raise exception 'last_active_ceo_required';
    end if;
  end if;
  if tg_op='DELETE' then return old; end if;
  new.lock_version := old.lock_version + 1;
  return new;
end $$;
create trigger protect_staff_history before update or delete on public.staff_accounts
for each row execute function private.protect_staff_history();
revoke all on function private.staff_management_lock(),private.protect_staff_history() from public,anon,authenticated,service_role;

create function private.people_actor(ceo_only boolean default false) returns uuid
language plpgsql security definer set search_path='' as $$ declare a uuid; begin
  a := private.commission_actor(true);
  if ceo_only and private.current_staff_role() is distinct from 'ceo' then raise exception 'unauthorized'; end if;
  return a;
end $$;
revoke all on function private.people_actor(boolean) from public,anon,authenticated,service_role;

-- Profiles contain the operational contact fields. No Auth metadata is returned.
-- Definer is needed only to exclude ALL staff without giving Admin staff-table access.
create function public.get_staff_clients(p_search text default '',p_activity text default 'all',p_page integer default 0,p_client_id uuid default null)
returns jsonb language plpgsql security definer set search_path='' as $$ declare result jsonb; begin
  perform private.people_actor();
  if p_search is null or length(p_search)>120 or p_activity is null or p_activity not in ('all','active_orders','pending_requests')
    or p_page is null or p_page<0 or p_page>10000 then raise exception 'invalid_input'; end if;
  with clients as (
    select p.id,p.first_name,p.last_name,p.email,p.phone,p.avatar_url,p.created_at,
      (select count(*) from public.bespoke_requests r where r.customer_id=p.id) as request_count,
      (select count(*) from public.orders o where o.customer_id=p.id) as order_count,
      exists(select 1 from public.orders o where o.customer_id=p.id and o.status<>'completed') as active_orders,
      exists(select 1 from public.bespoke_requests r where r.customer_id=p.id and r.status in ('submitted','under_review')) as pending_requests
    from public.profiles p
    where not exists(select 1 from public.staff_accounts s where s.user_id=p.id)
      and (p_client_id is null or p.id=p_client_id)
      and (p_search='' or strpos(lower(concat_ws(' ',p.first_name,p.last_name,p.email,p.phone)),lower(btrim(p_search)))>0)
  ), filtered as (
    select * from clients where p_activity='all' or (p_activity='active_orders' and active_orders) or (p_activity='pending_requests' and pending_requests)
  ), page as (select * from filtered order by created_at desc,id limit 30 offset p_page*30)
  select jsonb_build_object('clients',coalesce((select jsonb_agg(to_jsonb(page) order by created_at desc,id) from page),'[]'::jsonb),
    'total',(select count(*) from filtered),'page',p_page) into result;
  return result;
end $$;

create function public.get_ceo_staff(p_page integer default 0) returns jsonb
language plpgsql security definer set search_path='' as $$ declare result jsonb; begin
  perform private.people_actor(true);
  if p_page is null or p_page<0 or p_page>10000 then raise exception 'invalid_input'; end if;
  with page as (
    select s.user_id,s.role,s.status,s.created_at,s.invited_at,s.deactivated_at,s.lock_version,
      p.first_name,p.last_name,u.email
    from public.staff_accounts s join auth.users u on u.id=s.user_id left join public.profiles p on p.id=s.user_id
    order by s.created_at desc,s.user_id limit 30 offset p_page*30
  ) select jsonb_build_object('staff',coalesce((select jsonb_agg(to_jsonb(page) order by created_at desc,user_id) from page),'[]'::jsonb),
    'total',(select count(*) from public.staff_accounts)) into result;
  return result;
end $$;

create function public.find_admin_candidate(p_email text) returns jsonb
language plpgsql security definer set search_path='' as $$ declare result jsonb; begin
  perform private.people_actor(true);
  if p_email is null or length(btrim(p_email)) not between 3 and 254 then raise exception 'invalid_input'; end if;
  select jsonb_build_object('id',u.id,'email',u.email,'first_name',p.first_name,'last_name',p.last_name,
    'existing_staff',exists(select 1 from public.staff_accounts s where s.user_id=u.id)) into result
  from auth.users u join public.profiles p on p.id=u.id
  where lower(u.email)=lower(btrim(p_email)) and u.email_confirmed_at is not null
    and u.deleted_at is null and not coalesce(u.is_anonymous,false)
    and (u.banned_until is null or u.banned_until<=now());
  return result;
end $$;

create function public.manage_admin_staff(p_target_id uuid,p_email text,p_action text,p_expected_version bigint,p_operation_key uuid)
returns uuid language plpgsql security definer set search_path='' as $$
declare a uuid; target public.staff_accounts; old_event private.staff_management_events; intent jsonb; previous text; next_status text;
begin
  if current_setting('transaction_isolation')<>'read committed' then raise exception 'read_committed_required'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('tcc:staff-management',0));
  a := private.people_actor(true);
  if p_target_id is null or p_target_id=a or p_operation_key is null or p_email is null
    or length(btrim(p_email)) not between 3 and 254 or p_action is null
    or p_action not in ('add_admin','activate_admin','deactivate_admin')
    or p_expected_version is null or p_expected_version<0 then raise exception 'invalid_input'; end if;
  intent := jsonb_build_object('target',p_target_id,'email',lower(btrim(p_email)),'action',p_action,'version',p_expected_version);
  select * into old_event from private.staff_management_events where actor_id=a and operation_key=p_operation_key;
  if found then
    if old_event.intent is distinct from intent then raise exception 'idempotency_conflict'; end if;
    return old_event.target_id;
  end if;
  -- Resolve the current exact identity again inside the mutation, never trust a
  -- lookup result, browser role, user_metadata or stale email/profile value.
  perform 1 from auth.users u where u.id=p_target_id and lower(u.email)=lower(btrim(p_email))
    and u.email_confirmed_at is not null and u.deleted_at is null and not coalesce(u.is_anonymous,false)
    and (p_action='deactivate_admin' or u.banned_until is null or u.banned_until<=now()) for share;
  if not found then raise exception 'verified_account_required'; end if;
  select * into target from public.staff_accounts where user_id=p_target_id for update;
  if found then
    if target.role<>'admin' then raise exception 'ceo_protected'; end if;
    if p_action='add_admin' then raise exception 'already_staff'; end if;
    if target.lock_version<>p_expected_version then raise exception 'stale_version'; end if;
    previous:=target.status;
    next_status:=case when p_action='activate_admin' then 'active' else 'inactive' end;
    if previous=next_status then raise exception 'status_unchanged'; end if;
    update public.staff_accounts set status=next_status,
      deactivated_at=case when next_status='inactive' then now() else null end where user_id=p_target_id;
  else
    if p_action<>'add_admin' or p_expected_version<>0 then raise exception 'not_found'; end if;
    -- Keep a working client portal for accounts with business history. Future
    -- staff should register a separate verified work account in that case.
    if exists(select 1 from public.bespoke_requests where customer_id=p_target_id)
      or exists(select 1 from public.orders where customer_id=p_target_id)
      or exists(select 1 from public.appointments where customer_id=p_target_id)
      or exists(select 1 from public.concierge_requests where customer_id=p_target_id)
      or exists(select 1 from public.payments where customer_id=p_target_id) then raise exception 'client_history_present'; end if;
    next_status:='active';
    insert into public.staff_accounts(user_id,role,status,invited_by,invited_at)
      values(p_target_id,'admin','active',a,now());
  end if;
  insert into private.staff_management_events(actor_id,target_id,operation_key,action,intent,previous_status,resulting_status)
    values(a,p_target_id,p_operation_key,p_action,intent,previous,next_status);
  return p_target_id;
end $$;

create function public.get_staff_management_history(p_target_id uuid,p_page integer default 0) returns jsonb
language plpgsql security definer set search_path='' as $$ declare result jsonb; begin
  perform private.people_actor(true);
  if p_target_id is null or p_page is null or p_page<0 or p_page>10000 then raise exception 'invalid_input'; end if;
  with page as (
    select e.id,e.action,e.previous_status,e.resulting_status,e.created_at,
      nullif(trim(concat_ws(' ',p.first_name,p.last_name)),'') as actor_name
    from private.staff_management_events e left join public.profiles p on p.id=e.actor_id
    where e.target_id=p_target_id order by e.created_at desc,e.id limit 30 offset p_page*30
  ) select jsonb_build_object('events',coalesce((select jsonb_agg(to_jsonb(page) order by created_at desc,id) from page),'[]'::jsonb),
    'total',(select count(*) from private.staff_management_events where target_id=p_target_id)) into result;
  return result;
end $$;

revoke all on function public.get_staff_clients(text,text,integer,uuid),public.get_ceo_staff(integer),
  public.find_admin_candidate(text),public.manage_admin_staff(uuid,text,text,bigint,uuid),public.get_staff_management_history(uuid,integer)
  from public,anon,authenticated,service_role;
grant execute on function public.get_staff_clients(text,text,integer,uuid),public.get_ceo_staff(integer),
  public.find_admin_candidate(text),public.manage_admin_staff(uuid,text,text,bigint,uuid),public.get_staff_management_history(uuid,integer)
  to authenticated;
-- Preserve existing RLS SELECT policies and deny direct browser membership writes.
revoke insert,update,delete,truncate on public.staff_accounts from anon,authenticated;
commit;
