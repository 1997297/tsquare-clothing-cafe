-- TCC Phase 3/4 remediation: customer authority, immutable history and grants.
-- Apply after supabase/schema.sql. This migration is intentionally non-destructive.

begin;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

-- Repair existing measurement sequencing before enforcing uniqueness.
with ranked as (
  select
    id,
    row_number() over (
      partition by customer_id
      order by created_at asc, id asc
    ) as repaired_version,
    row_number() over (
      partition by customer_id
      order by created_at desc, id desc
    ) as current_rank
  from public.measurement_profiles
)
update public.measurement_profiles as measurement
set
  version = ranked.repaired_version,
  is_current = ranked.current_rank = 1
from ranked
where measurement.id = ranked.id;

create unique index if not exists measurement_profiles_customer_version_uidx
  on public.measurement_profiles(customer_id, version);

create unique index if not exists measurement_profiles_one_current_uidx
  on public.measurement_profiles(customer_id)
  where is_current;

-- Historical snapshot and money compatibility columns. Existing numeric NGN values
-- remain available while trusted workflows standardize on integer kobo.
alter table public.bespoke_requests
  add column if not exists style_image text,
  add column if not exists quoted_price_minor bigint;

update public.bespoke_requests
set quoted_price_minor = round(quoted_price * 100)::bigint
where quoted_price is not null and quoted_price_minor is null;

alter table public.bespoke_requests
  drop constraint if exists bespoke_requests_quoted_price_minor_check,
  add constraint bespoke_requests_quoted_price_minor_check
    check (quoted_price_minor is null or quoted_price_minor > 0);

alter table public.orders
  add column if not exists style_image text,
  add column if not exists total_amount_minor bigint;

update public.orders
set total_amount_minor = round(total_amount * 100)::bigint
where total_amount is not null and total_amount_minor is null;

alter table public.orders
  drop constraint if exists orders_total_amount_minor_check,
  add constraint orders_total_amount_minor_check
    check (total_amount_minor is null or total_amount_minor >= 0);

alter table public.payments
  add column if not exists amount_minor bigint;

update public.payments
set amount_minor = round(amount * 100)::bigint
where amount_minor is null;

alter table public.payments
  alter column amount_minor set not null,
  alter column provider drop default,
  drop constraint if exists payments_amount_minor_check,
  add constraint payments_amount_minor_check check (amount_minor > 0),
  drop constraint if exists payments_currency_ngn_check,
  add constraint payments_currency_ngn_check check (currency = 'NGN');

do $$
begin
  if exists (select 1 from public.payments where provider = 'sandbox') then
    raise exception 'Sandbox payment rows must be reviewed before production payment hardening can be applied';
  end if;
end;
$$;

alter table public.payments
  drop constraint if exists payments_provider_check,
  add constraint payments_provider_check
    check (provider in ('paystack', 'flutterwave', 'manual_transfer', 'atelier_terminal'));

do $$
begin
  if exists (
    select 1
    from public.payments
    where provider_reference is not null
    group by provider, provider_reference
    having count(*) > 1
  ) then
    raise exception 'Duplicate provider payment references must be resolved before applying the idempotency constraint';
  end if;
end;
$$;

create unique index if not exists payments_provider_reference_uidx
  on public.payments(provider, provider_reference)
  where provider_reference is not null;

do $$
begin
  if exists (
    select 1
    from public.orders
    where bespoke_request_id is not null
    group by bespoke_request_id
    having count(*) > 1
  ) then
    raise exception 'Duplicate orders for a bespoke request must be resolved before applying the conversion idempotency constraint';
  end if;
end;
$$;

create unique index if not exists orders_bespoke_request_uidx
  on public.orders(bespoke_request_id)
  where bespoke_request_id is not null;

-- Keep appointment-change history if an appointment is removed operationally.
alter table public.appointment_change_requests
  drop constraint if exists appointment_change_requests_appointment_id_fkey;

alter table public.appointment_change_requests
  add constraint appointment_change_requests_appointment_id_fkey
  foreign key (appointment_id) references public.appointments(id) on delete restrict;

-- Replace the exposed SECURITY DEFINER signup trigger with a private, pinned one.
drop trigger if exists on_auth_user_created on auth.users;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, first_name, last_name, email, phone, preferred_contact)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'first_name', 'Client'),
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'phone', ''),
    case
      when new.raw_user_meta_data->>'preferred_contact' in ('whatsapp', 'phone', 'email')
        then new.raw_user_meta_data->>'preferred_contact'
      else 'whatsapp'
    end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke all on function private.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

drop function if exists public.handle_new_user();

-- Remove broad legacy policies.
drop policy if exists "Users can view their own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;
drop policy if exists "Users can insert their own profile" on public.profiles;
drop policy if exists "Users can view their own measurements" on public.measurement_profiles;
drop policy if exists "Users can insert their own measurements" on public.measurement_profiles;
drop policy if exists "Users can update their own measurements" on public.measurement_profiles;
drop policy if exists "Users can view their own bespoke requests" on public.bespoke_requests;
drop policy if exists "Users can submit their own bespoke requests" on public.bespoke_requests;
drop policy if exists "Users can update non-privileged fields on their requests" on public.bespoke_requests;
drop policy if exists "Users can view their own orders" on public.orders;
drop policy if exists "Users can view their own appointments" on public.appointments;
drop policy if exists "Users can request appointments" on public.appointments;
drop policy if exists "Users can update their requested appointments (cancel/reschedule)" on public.appointments;
drop policy if exists "Users can view their own saved styles" on public.saved_styles;
drop policy if exists "Users can save styles" on public.saved_styles;
drop policy if exists "Users can remove saved styles" on public.saved_styles;
drop policy if exists "Users can view their own notifications" on public.notifications;
drop policy if exists "Users can mark notifications as read" on public.notifications;
drop policy if exists "Users can view their own payments" on public.payments;
drop policy if exists "Users can view their own wardrobe" on public.wardrobe_items;
drop policy if exists "Users can view their own concierge requests" on public.concierge_requests;
drop policy if exists "Users can submit concierge requests" on public.concierge_requests;
drop policy if exists "Users can view messages for their concierge requests" on public.concierge_messages;
drop policy if exists "Users can add messages to their own open requests" on public.concierge_messages;
drop policy if exists "Users can view their appointment change requests" on public.appointment_change_requests;
drop policy if exists "Users can submit appointment change requests" on public.appointment_change_requests;

-- Least-privilege grants. Trusted writes use server-only service-role operations.
revoke all on table
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
  public.appointment_change_requests
from anon, authenticated;

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
  public.appointment_change_requests
to authenticated;

grant update (first_name, last_name, phone, preferred_contact, avatar_url, updated_at)
  on public.profiles to authenticated;
grant insert (customer_id, style_id), delete on public.saved_styles to authenticated;
grant update (is_read, read_at) on public.notifications to authenticated;

-- Explicit authenticated-role policies.
create policy "Customers read own profile"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = id);
create policy "Customers update safe profile fields"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "Customers read own measurement history"
  on public.measurement_profiles for select to authenticated
  using ((select auth.uid()) = customer_id);

create policy "Customers read own bespoke requests"
  on public.bespoke_requests for select to authenticated
  using ((select auth.uid()) = customer_id);

create policy "Customers read own orders"
  on public.orders for select to authenticated
  using ((select auth.uid()) = customer_id);

create policy "Customers read own appointments"
  on public.appointments for select to authenticated
  using ((select auth.uid()) = customer_id);

create policy "Customers read own saved styles"
  on public.saved_styles for select to authenticated
  using ((select auth.uid()) = customer_id);
create policy "Customers save own styles"
  on public.saved_styles for insert to authenticated
  with check ((select auth.uid()) = customer_id);
create policy "Customers remove own saved styles"
  on public.saved_styles for delete to authenticated
  using ((select auth.uid()) = customer_id);

create policy "Customers read own notifications"
  on public.notifications for select to authenticated
  using ((select auth.uid()) = customer_id);
create policy "Customers update own notification read state"
  on public.notifications for update to authenticated
  using ((select auth.uid()) = customer_id)
  with check ((select auth.uid()) = customer_id);

create policy "Customers read own payments"
  on public.payments for select to authenticated
  using ((select auth.uid()) = customer_id);

create policy "Customers read own wardrobe"
  on public.wardrobe_items for select to authenticated
  using ((select auth.uid()) = customer_id);

create policy "Customers read own concierge requests"
  on public.concierge_requests for select to authenticated
  using ((select auth.uid()) = customer_id);
create policy "Customers read own concierge messages"
  on public.concierge_messages for select to authenticated
  using (
    exists (
      select 1 from public.concierge_requests as request
      where request.id = concierge_messages.request_id
        and request.customer_id = (select auth.uid())
    )
  );

create policy "Customers read own appointment changes"
  on public.appointment_change_requests for select to authenticated
  using ((select auth.uid()) = customer_id);

commit;
