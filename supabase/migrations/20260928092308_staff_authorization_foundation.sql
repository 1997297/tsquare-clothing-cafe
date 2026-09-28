-- TCC Phase 2: trusted staff roles and least-privilege back-office read access.

begin;

create table if not exists public.staff_accounts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'ceo')),
  status text not null default 'active' check (status in ('active', 'inactive')),
  invited_by uuid null,
  invited_at timestamptz null,
  deactivated_at timestamptz null,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  constraint staff_accounts_deactivation_state_check check (
    (status = 'active' and deactivated_at is null)
    or (status = 'inactive' and deactivated_at is not null)
  )
);

alter table public.staff_accounts
  drop constraint if exists staff_accounts_invited_by_fkey;

alter table public.staff_accounts
  add constraint staff_accounts_invited_by_fkey
  foreign key (invited_by) references public.staff_accounts(user_id) on delete set null;

create index if not exists staff_accounts_active_role_idx
  on public.staff_accounts(role, status)
  where status = 'active';

create or replace function private.set_staff_account_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := timezone('utc'::text, now());
  return new;
end;
$$;

revoke all on function private.set_staff_account_updated_at()
  from public, anon, authenticated;

drop trigger if exists set_staff_account_updated_at on public.staff_accounts;
create trigger set_staff_account_updated_at
  before update on public.staff_accounts
  for each row execute function private.set_staff_account_updated_at();

alter table public.staff_accounts enable row level security;

revoke all on table public.staff_accounts from public, anon, authenticated;
grant select on table public.staff_accounts to authenticated;
grant all on table public.staff_accounts to service_role;

-- This is the single database authorization resolver used by RLS. It only
-- returns active staff roles and reads from a table browser users cannot edit.
create or replace function public.current_staff_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select staff.role
  from public.staff_accounts as staff
  where staff.user_id = (select auth.uid())
    and staff.status = 'active'
  limit 1
$$;

revoke all on function public.current_staff_role() from public, anon, authenticated;
grant execute on function public.current_staff_role() to authenticated, service_role;

drop policy if exists "Staff read own authorization record" on public.staff_accounts;
drop policy if exists "CEOs read staff authorization records" on public.staff_accounts;

create policy "Staff read own authorization record"
  on public.staff_accounts for select to authenticated
  using (user_id = (select auth.uid()));

create policy "CEOs read staff authorization records"
  on public.staff_accounts for select to authenticated
  using ((select public.current_staff_role()) = 'ceo');

-- Staff receive additive read access. Existing customer policies remain
-- unchanged, so ordinary clients continue to see only their own rows.
grant select on table
  public.profiles,
  public.measurement_profiles,
  public.bespoke_requests,
  public.orders,
  public.appointments,
  public.saved_styles,
  public.notifications,
  public.payments,
  public.wardrobe_items,
  public.concierge_requests,
  public.concierge_messages,
  public.appointment_change_requests,
  public.lifecycle_events,
  public.contact_enquiries,
  public.public_fitting_requests
to authenticated;

drop policy if exists "Active staff read client profiles" on public.profiles;
create policy "Active staff read client profiles"
  on public.profiles for select to authenticated
  using ((select public.current_staff_role()) in ('admin', 'ceo'));

drop policy if exists "Active staff read client measurements" on public.measurement_profiles;
create policy "Active staff read client measurements"
  on public.measurement_profiles for select to authenticated
  using ((select public.current_staff_role()) in ('admin', 'ceo'));

drop policy if exists "Active staff read bespoke requests" on public.bespoke_requests;
create policy "Active staff read bespoke requests"
  on public.bespoke_requests for select to authenticated
  using ((select public.current_staff_role()) in ('admin', 'ceo'));

drop policy if exists "Active staff read orders" on public.orders;
create policy "Active staff read orders"
  on public.orders for select to authenticated
  using ((select public.current_staff_role()) in ('admin', 'ceo'));

drop policy if exists "Active staff read appointments" on public.appointments;
create policy "Active staff read appointments"
  on public.appointments for select to authenticated
  using ((select public.current_staff_role()) in ('admin', 'ceo'));

drop policy if exists "Active staff read saved styles" on public.saved_styles;
create policy "Active staff read saved styles"
  on public.saved_styles for select to authenticated
  using ((select public.current_staff_role()) in ('admin', 'ceo'));

drop policy if exists "Active staff read notifications" on public.notifications;
create policy "Active staff read notifications"
  on public.notifications for select to authenticated
  using ((select public.current_staff_role()) in ('admin', 'ceo'));

drop policy if exists "Active staff read payments" on public.payments;
create policy "Active staff read payments"
  on public.payments for select to authenticated
  using ((select public.current_staff_role()) in ('admin', 'ceo'));

drop policy if exists "Active staff read wardrobe" on public.wardrobe_items;
create policy "Active staff read wardrobe"
  on public.wardrobe_items for select to authenticated
  using ((select public.current_staff_role()) in ('admin', 'ceo'));

drop policy if exists "Active staff read concierge requests" on public.concierge_requests;
create policy "Active staff read concierge requests"
  on public.concierge_requests for select to authenticated
  using ((select public.current_staff_role()) in ('admin', 'ceo'));

drop policy if exists "Active staff read concierge messages" on public.concierge_messages;
create policy "Active staff read concierge messages"
  on public.concierge_messages for select to authenticated
  using ((select public.current_staff_role()) in ('admin', 'ceo'));

drop policy if exists "Active staff read appointment changes" on public.appointment_change_requests;
create policy "Active staff read appointment changes"
  on public.appointment_change_requests for select to authenticated
  using ((select public.current_staff_role()) in ('admin', 'ceo'));

drop policy if exists "Active staff read lifecycle events" on public.lifecycle_events;
create policy "Active staff read lifecycle events"
  on public.lifecycle_events for select to authenticated
  using ((select public.current_staff_role()) in ('admin', 'ceo'));

drop policy if exists "Active staff read contact enquiries" on public.contact_enquiries;
create policy "Active staff read contact enquiries"
  on public.contact_enquiries for select to authenticated
  using ((select public.current_staff_role()) in ('admin', 'ceo'));

drop policy if exists "Active staff read fitting requests" on public.public_fitting_requests;
create policy "Active staff read fitting requests"
  on public.public_fitting_requests for select to authenticated
  using ((select public.current_staff_role()) in ('admin', 'ceo'));

drop policy if exists "Active staff read bespoke references" on storage.objects;
create policy "Active staff read bespoke references"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'bespoke-references'
    and (select public.current_staff_role()) in ('admin', 'ceo')
  );

-- One-time bootstrap only. It is deliberately unavailable to anon and
-- authenticated API callers and refuses to run after the first CEO exists.
create or replace function private.provision_initial_ceo(p_user_id uuid)
returns public.staff_accounts
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_staff public.staff_accounts;
begin
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('tcc:initial-ceo', 0)
  );

  if exists (
    select 1 from public.staff_accounts where role = 'ceo'
  ) then
    raise exception 'The initial CEO has already been provisioned';
  end if;

  if not exists (
    select 1 from auth.users where id = p_user_id
  ) then
    raise exception 'The target Supabase Auth user does not exist';
  end if;

  insert into public.staff_accounts (
    user_id,
    role,
    status,
    invited_at
  ) values (
    p_user_id,
    'ceo',
    'active',
    timezone('utc'::text, now())
  )
  returning * into v_staff;

  return v_staff;
end;
$$;

revoke all on function private.provision_initial_ceo(uuid)
  from public, anon, authenticated;

grant usage on schema private to service_role;
grant execute on function private.provision_initial_ceo(uuid)
  to service_role;

commit;
