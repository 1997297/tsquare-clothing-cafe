-- TCC Phase 2 hardening: keep the role resolver outside the exposed API schema
-- and consolidate equivalent permissive read policies.

begin;

drop index if exists public.staff_accounts_active_role_idx;
create index if not exists staff_accounts_invited_by_idx
  on public.staff_accounts(invited_by)
  where invited_by is not null;

create or replace function private.current_staff_role()
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

revoke all on function private.current_staff_role()
  from public, anon, authenticated;
grant usage on schema private to authenticated, service_role;
grant execute on function private.current_staff_role()
  to authenticated, service_role;

drop policy if exists "Staff read own authorization record" on public.staff_accounts;
drop policy if exists "CEOs read staff authorization records" on public.staff_accounts;
drop policy if exists "Staff read permitted authorization records" on public.staff_accounts;
create policy "Staff read permitted authorization records"
  on public.staff_accounts for select to authenticated
  using (
    user_id = (select auth.uid())
    or (select private.current_staff_role()) = 'ceo'
  );

drop policy if exists "Customers read own profile" on public.profiles;
drop policy if exists "Active staff read client profiles" on public.profiles;
create policy "Clients read own profile or active staff"
  on public.profiles for select to authenticated
  using (
    id = (select auth.uid())
    or (select private.current_staff_role()) in ('admin', 'ceo')
  );

drop policy if exists "Customers read own measurement history" on public.measurement_profiles;
drop policy if exists "Active staff read client measurements" on public.measurement_profiles;
create policy "Clients read own measurements or active staff"
  on public.measurement_profiles for select to authenticated
  using (
    customer_id = (select auth.uid())
    or (select private.current_staff_role()) in ('admin', 'ceo')
  );

drop policy if exists "Customers read own bespoke requests" on public.bespoke_requests;
drop policy if exists "Active staff read bespoke requests" on public.bespoke_requests;
create policy "Clients read own requests or active staff"
  on public.bespoke_requests for select to authenticated
  using (
    customer_id = (select auth.uid())
    or (select private.current_staff_role()) in ('admin', 'ceo')
  );

drop policy if exists "Customers read own orders" on public.orders;
drop policy if exists "Active staff read orders" on public.orders;
create policy "Clients read own orders or active staff"
  on public.orders for select to authenticated
  using (
    customer_id = (select auth.uid())
    or (select private.current_staff_role()) in ('admin', 'ceo')
  );

drop policy if exists "Customers read own appointments" on public.appointments;
drop policy if exists "Active staff read appointments" on public.appointments;
create policy "Clients read own appointments or active staff"
  on public.appointments for select to authenticated
  using (
    customer_id = (select auth.uid())
    or (select private.current_staff_role()) in ('admin', 'ceo')
  );

drop policy if exists "Customers read own saved styles" on public.saved_styles;
drop policy if exists "Active staff read saved styles" on public.saved_styles;
create policy "Clients read own saved styles or active staff"
  on public.saved_styles for select to authenticated
  using (
    customer_id = (select auth.uid())
    or (select private.current_staff_role()) in ('admin', 'ceo')
  );

drop policy if exists "Customers read own notifications" on public.notifications;
drop policy if exists "Active staff read notifications" on public.notifications;
create policy "Clients read own notifications or active staff"
  on public.notifications for select to authenticated
  using (
    customer_id = (select auth.uid())
    or (select private.current_staff_role()) in ('admin', 'ceo')
  );

drop policy if exists "Customers read own payments" on public.payments;
drop policy if exists "Active staff read payments" on public.payments;
create policy "Clients read own payments or active staff"
  on public.payments for select to authenticated
  using (
    customer_id = (select auth.uid())
    or (select private.current_staff_role()) in ('admin', 'ceo')
  );

drop policy if exists "Customers read own wardrobe" on public.wardrobe_items;
drop policy if exists "Active staff read wardrobe" on public.wardrobe_items;
create policy "Clients read own wardrobe or active staff"
  on public.wardrobe_items for select to authenticated
  using (
    customer_id = (select auth.uid())
    or (select private.current_staff_role()) in ('admin', 'ceo')
  );

drop policy if exists "Customers read own concierge requests" on public.concierge_requests;
drop policy if exists "Active staff read concierge requests" on public.concierge_requests;
create policy "Clients read own concierge requests or active staff"
  on public.concierge_requests for select to authenticated
  using (
    customer_id = (select auth.uid())
    or (select private.current_staff_role()) in ('admin', 'ceo')
  );

drop policy if exists "Customers read own concierge messages" on public.concierge_messages;
drop policy if exists "Active staff read concierge messages" on public.concierge_messages;
create policy "Clients read own concierge messages or active staff"
  on public.concierge_messages for select to authenticated
  using (
    (select private.current_staff_role()) in ('admin', 'ceo')
    or exists (
      select 1
      from public.concierge_requests as request
      where request.id = concierge_messages.request_id
        and request.customer_id = (select auth.uid())
    )
  );

drop policy if exists "Customers read own appointment changes" on public.appointment_change_requests;
drop policy if exists "Active staff read appointment changes" on public.appointment_change_requests;
create policy "Clients read own appointment changes or active staff"
  on public.appointment_change_requests for select to authenticated
  using (
    customer_id = (select auth.uid())
    or (select private.current_staff_role()) in ('admin', 'ceo')
  );

drop policy if exists "Customers read own lifecycle events" on public.lifecycle_events;
drop policy if exists "Active staff read lifecycle events" on public.lifecycle_events;
create policy "Clients read own lifecycle events or active staff"
  on public.lifecycle_events for select to authenticated
  using (
    customer_id = (select auth.uid())
    or (select private.current_staff_role()) in ('admin', 'ceo')
  );

drop policy if exists "Active staff read contact enquiries" on public.contact_enquiries;
create policy "Active staff read contact enquiries"
  on public.contact_enquiries for select to authenticated
  using ((select private.current_staff_role()) in ('admin', 'ceo'));

drop policy if exists "Active staff read fitting requests" on public.public_fitting_requests;
create policy "Active staff read fitting requests"
  on public.public_fitting_requests for select to authenticated
  using ((select private.current_staff_role()) in ('admin', 'ceo'));

drop policy if exists "Active staff read bespoke references" on storage.objects;
create policy "Active staff read bespoke references"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'bespoke-references'
    and (select private.current_staff_role()) in ('admin', 'ceo')
  );

drop function if exists public.current_staff_role();

commit;
