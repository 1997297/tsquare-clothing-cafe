-- TCC Phase 3/4 remediation: atomic trusted operations and public intake.

begin;

create table if not exists public.lifecycle_events (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid,
  customer_id uuid references public.profiles(id) on delete set null,
  event_type text not null,
  actor_type text not null check (actor_type in ('customer', 'staff', 'system', 'provider')),
  actor_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists lifecycle_events_entity_idx
  on public.lifecycle_events(entity_type, entity_id, created_at desc);
create index if not exists lifecycle_events_customer_idx
  on public.lifecycle_events(customer_id, created_at desc);

alter table public.lifecycle_events enable row level security;
revoke all on public.lifecycle_events from anon, authenticated;
grant select on public.lifecycle_events to authenticated;

drop policy if exists "Customers read own lifecycle events" on public.lifecycle_events;
create policy "Customers read own lifecycle events"
  on public.lifecycle_events for select to authenticated
  using ((select auth.uid()) = customer_id);

create table if not exists public.contact_enquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  subject text not null,
  message text not null,
  status text not null default 'new' check (status in ('new', 'in_review', 'responded', 'closed')),
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists contact_enquiries_status_idx
  on public.contact_enquiries(status, created_at desc);
alter table public.contact_enquiries enable row level security;
revoke all on public.contact_enquiries from anon, authenticated;

create table if not exists public.public_fitting_requests (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.profiles(id) on delete set null,
  name text not null,
  email text not null,
  phone text not null,
  appointment_type text not null,
  preferred_date date not null,
  preferred_time text not null,
  notes text,
  style_reference text,
  is_existing_customer boolean not null default false,
  status text not null default 'requested' check (status in ('requested', 'contacted', 'scheduled', 'declined')),
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists public_fitting_requests_status_idx
  on public.public_fitting_requests(status, preferred_date, created_at desc);
create index if not exists public_fitting_requests_customer_idx
  on public.public_fitting_requests(customer_id, created_at desc);
alter table public.public_fitting_requests enable row level security;
revoke all on public.public_fitting_requests from anon, authenticated;

-- Relational ownership guardrails for future trusted inserts.
create or replace function private.enforce_order_customer_consistency()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_order_customer uuid;
begin
  select customer_id into v_order_customer
  from public.orders
  where id = new.order_id;

  if v_order_customer is null or v_order_customer <> new.customer_id then
    raise exception 'Order and customer ownership do not match';
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_payment_order_customer on public.payments;
create trigger enforce_payment_order_customer
  before insert or update of order_id, customer_id on public.payments
  for each row execute function private.enforce_order_customer_consistency();

drop trigger if exists enforce_wardrobe_order_customer on public.wardrobe_items;
create trigger enforce_wardrobe_order_customer
  before insert or update of order_id, customer_id on public.wardrobe_items
  for each row execute function private.enforce_order_customer_consistency();

create or replace function private.enforce_appointment_relationships()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.order_id is not null and not exists (
    select 1 from public.orders
    where id = new.order_id and customer_id = new.customer_id
  ) then
    raise exception 'Appointment order does not belong to customer';
  end if;

  if new.bespoke_request_id is not null and not exists (
    select 1 from public.bespoke_requests
    where id = new.bespoke_request_id and customer_id = new.customer_id
  ) then
    raise exception 'Appointment request does not belong to customer';
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_appointment_relationships on public.appointments;
create trigger enforce_appointment_relationships
  before insert or update of customer_id, order_id, bespoke_request_id on public.appointments
  for each row execute function private.enforce_appointment_relationships();

revoke all on function private.enforce_order_customer_consistency() from public, anon, authenticated;
revoke all on function private.enforce_appointment_relationships() from public, anon, authenticated;

-- Customer measurement versioning. Only service_role may invoke it, after the
-- server authenticates the customer and supplies that authenticated user ID.
create or replace function public.create_customer_measurement_version(
  p_customer_id uuid,
  p_unit text,
  p_fit_preference text,
  p_measurements jsonb,
  p_notes text default null
)
returns public.measurement_profiles
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_version integer;
  v_record public.measurement_profiles;
begin
  if p_unit not in ('cm', 'inches') then
    raise exception 'Invalid measurement unit';
  end if;
  if p_fit_preference is not null and p_fit_preference not in ('tailored', 'regular', 'relaxed') then
    raise exception 'Invalid fit preference';
  end if;
  if jsonb_typeof(p_measurements) <> 'object' or p_measurements = '{}'::jsonb then
    raise exception 'Measurements are required';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_customer_id::text, 0));

  select coalesce(max(version), 0) + 1 into v_version
  from public.measurement_profiles
  where customer_id = p_customer_id;

  update public.measurement_profiles
  set is_current = false
  where customer_id = p_customer_id and is_current;

  insert into public.measurement_profiles (
    customer_id, version, is_current, unit, fit_preference,
    verification_status, measurements, notes
  ) values (
    p_customer_id, v_version, true, p_unit, p_fit_preference,
    'customer_entered', p_measurements, nullif(trim(p_notes), '')
  ) returning * into v_record;

  insert into public.lifecycle_events (
    entity_type, entity_id, customer_id, event_type, actor_type, actor_id, metadata
  ) values (
    'measurement_profile', v_record.id, p_customer_id,
    'measurement_version_created', 'customer', p_customer_id,
    jsonb_build_object('version', v_version, 'unit', p_unit)
  );

  return v_record;
end;
$$;

-- Request and optional appointment creation are one transaction.
create or replace function public.submit_bespoke_request(
  p_customer_id uuid,
  p_payload jsonb
)
returns public.bespoke_requests
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_request public.bespoke_requests;
  v_reference text;
  v_appointment jsonb;
  v_appointment_id uuid;
begin
  v_reference := 'TCC-REQ-' || to_char(clock_timestamp(), 'YYYYMMDD') || '-' ||
    upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
  v_appointment := p_payload->'appointment_request';

  insert into public.bespoke_requests (
    request_reference, customer_id, style_id, style_code, style_name, style_image,
    garment_category, is_idea_path, fabric, colour, preferences, fit_preference,
    measurements_snapshot, measurement_confidence, occasion, event_name, event_date,
    required_date, appointment_request, reference_images, special_instructions,
    contact_info, status
  ) values (
    v_reference, p_customer_id, p_payload->>'style_id', p_payload->>'style_code',
    p_payload->>'style_name', p_payload->>'style_image', p_payload->>'garment_category',
    coalesce((p_payload->>'is_idea_path')::boolean, false), p_payload->'fabric',
    p_payload->'colour', coalesce(p_payload->'preferences', '{}'::jsonb),
    p_payload->>'fit_preference', p_payload->'measurements_snapshot',
    coalesce((p_payload->>'measurement_confidence')::boolean, false),
    p_payload->>'occasion', p_payload->>'event_name', p_payload->>'event_date',
    p_payload->>'required_date', v_appointment,
    coalesce(p_payload->'reference_images', '[]'::jsonb),
    p_payload->>'special_instructions', p_payload->'contact_info', 'submitted'
  ) returning * into v_request;

  if v_appointment is not null
     and coalesce(v_appointment->>'type', 'none') <> 'none' then
    insert into public.appointments (
      customer_id, bespoke_request_id, type, preferred_date,
      preferred_time, status, notes
    ) values (
      p_customer_id, v_request.id, v_appointment->>'type',
      v_appointment->>'preferredDate', v_appointment->>'preferredTime',
      'requested', v_appointment->>'notes'
    ) returning id into v_appointment_id;
  end if;

  insert into public.lifecycle_events (
    entity_type, entity_id, customer_id, event_type, actor_type, actor_id, metadata
  ) values (
    'bespoke_request', v_request.id, p_customer_id,
    'request_submitted', 'customer', p_customer_id,
    jsonb_build_object('reference', v_reference, 'appointment_id', v_appointment_id)
  );

  return v_request;
end;
$$;

create or replace function public.request_appointment_change(
  p_customer_id uuid,
  p_appointment_id uuid,
  p_change_type text,
  p_proposed_date text default null,
  p_proposed_time text default null,
  p_reason text default null
)
returns public.appointment_change_requests
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_change public.appointment_change_requests;
begin
  if p_change_type not in ('reschedule', 'cancellation') then
    raise exception 'Invalid appointment change type';
  end if;
  if not exists (
    select 1 from public.appointments
    where id = p_appointment_id and customer_id = p_customer_id
  ) then
    raise exception 'Appointment not found';
  end if;

  insert into public.appointment_change_requests (
    appointment_id, customer_id, change_type, proposed_date,
    proposed_time, reason, status
  ) values (
    p_appointment_id, p_customer_id, p_change_type,
    p_proposed_date, p_proposed_time, nullif(trim(p_reason), ''), 'pending_review'
  ) returning * into v_change;

  insert into public.lifecycle_events (
    entity_type, entity_id, customer_id, event_type, actor_type, actor_id, metadata
  ) values (
    'appointment', p_appointment_id, p_customer_id,
    'appointment_change_requested', 'customer', p_customer_id,
    jsonb_build_object('change_request_id', v_change.id, 'change_type', p_change_type)
  );
  return v_change;
end;
$$;

create or replace function public.create_customer_concierge_request(
  p_customer_id uuid,
  p_payload jsonb
)
returns public.concierge_requests
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_request public.concierge_requests;
  v_reference text;
  v_sender_name text;
  v_related_request text := nullif(p_payload->>'related_request_id', '');
  v_related_order text := nullif(p_payload->>'related_order_id', '');
  v_related_appointment text := nullif(p_payload->>'related_appointment_id', '');
begin
  if v_related_request is not null and not exists (
    select 1 from public.bespoke_requests
    where customer_id = p_customer_id
      and (id::text = v_related_request or request_reference = v_related_request)
  ) then raise exception 'Related request not found'; end if;

  if v_related_order is not null and not exists (
    select 1 from public.orders
    where customer_id = p_customer_id and id::text = v_related_order
  ) then raise exception 'Related order not found'; end if;

  if v_related_appointment is not null and not exists (
    select 1 from public.appointments
    where customer_id = p_customer_id and id::text = v_related_appointment
  ) then raise exception 'Related appointment not found'; end if;

  select trim(first_name || ' ' || last_name) into v_sender_name
  from public.profiles where id = p_customer_id;
  v_reference := 'TCC-CONC-' || to_char(clock_timestamp(), 'YYYYMMDD') || '-' ||
    upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));

  insert into public.concierge_requests (
    reference_code, customer_id, category, subject, message,
    related_request_id, related_order_id, related_appointment_id, status
  ) values (
    v_reference, p_customer_id, p_payload->>'category', trim(p_payload->>'subject'),
    trim(p_payload->>'message'), v_related_request, v_related_order,
    v_related_appointment, 'open'
  ) returning * into v_request;

  insert into public.concierge_messages (
    request_id, sender_type, sender_id, sender_name, message
  ) values (
    v_request.id, 'customer', p_customer_id,
    coalesce(nullif(v_sender_name, ''), 'Client'), trim(p_payload->>'message')
  );

  insert into public.lifecycle_events (
    entity_type, entity_id, customer_id, event_type, actor_type, actor_id, metadata
  ) values (
    'concierge_request', v_request.id, p_customer_id,
    'concierge_request_created', 'customer', p_customer_id,
    jsonb_build_object('reference', v_reference)
  );
  return v_request;
end;
$$;

create or replace function public.add_customer_concierge_message(
  p_customer_id uuid,
  p_request_id uuid,
  p_message text
)
returns public.concierge_messages
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_message public.concierge_messages;
  v_sender_name text;
begin
  if not exists (
    select 1 from public.concierge_requests
    where id = p_request_id
      and customer_id = p_customer_id
      and status in ('open', 'in_review', 'awaiting_customer')
  ) then raise exception 'Concierge conversation is unavailable'; end if;

  select trim(first_name || ' ' || last_name) into v_sender_name
  from public.profiles where id = p_customer_id;

  insert into public.concierge_messages (
    request_id, sender_type, sender_id, sender_name, message
  ) values (
    p_request_id, 'customer', p_customer_id,
    coalesce(nullif(v_sender_name, ''), 'Client'), trim(p_message)
  ) returning * into v_message;
  return v_message;
end;
$$;

-- Future Phase 5 staff operation. No customer/anon execute grant exists.
create or replace function public.convert_bespoke_request_to_order(
  p_request_id uuid,
  p_actor_id uuid,
  p_actor_type text
)
returns public.orders
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_request public.bespoke_requests;
  v_order public.orders;
  v_reference text;
  v_total_minor bigint;
begin
  if p_actor_id is null or p_actor_type not in ('staff', 'system') then
    raise exception 'Trusted actor is required';
  end if;

  select * into v_request
  from public.bespoke_requests
  where id = p_request_id
  for update;

  if v_request.id is null or v_request.customer_id is null then
    raise exception 'Request not found or has no customer';
  end if;
  if v_request.status = 'converted_to_order' then
    select * into v_order
    from public.orders
    where bespoke_request_id = v_request.id;
    if v_order.id is null then
      raise exception 'Converted request is missing its order';
    end if;
    return v_order;
  end if;
  if v_request.status not in ('pricing_ready', 'confirmed') then
    raise exception 'Request is not eligible for conversion';
  end if;

  v_total_minor := coalesce(v_request.quoted_price_minor, round(v_request.quoted_price * 100)::bigint);
  if v_total_minor is null or v_total_minor <= 0 then
    raise exception 'Trusted quoted price is required';
  end if;

  v_reference := 'TCC-ORD-' || to_char(clock_timestamp(), 'YYYYMMDD') || '-' ||
    upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));

  insert into public.orders (
    order_reference, customer_id, bespoke_request_id, style_id, style_code,
    style_name, style_image, garment_category, fabric_details, colour_details,
    preferences, measurements_snapshot, status, total_amount, total_amount_minor,
    target_completion_date, special_instructions
  ) values (
    v_reference, v_request.customer_id, v_request.id,
    coalesce(v_request.style_id, 'tsq-custom'), coalesce(v_request.style_code, 'TSQ BESPOKE'),
    coalesce(v_request.style_name, 'Bespoke Sartorial Commission'), v_request.style_image,
    v_request.garment_category, v_request.fabric, v_request.colour,
    v_request.preferences, coalesce(v_request.measurements_snapshot, '{}'::jsonb),
    'order_confirmed', v_total_minor::numeric / 100, v_total_minor,
    v_request.required_date, v_request.special_instructions
  ) returning * into v_order;

  update public.bespoke_requests
  set status = 'converted_to_order', updated_at = timezone('utc'::text, now())
  where id = v_request.id;

  insert into public.lifecycle_events (
    entity_type, entity_id, customer_id, event_type, actor_type, actor_id, metadata
  ) values (
    'bespoke_request', v_request.id, v_request.customer_id,
    'request_converted_to_order', p_actor_type, p_actor_id,
    jsonb_build_object('order_id', v_order.id, 'order_reference', v_reference)
  );
  return v_order;
end;
$$;

create or replace function public.create_wardrobe_for_completed_order(
  p_order_id uuid,
  p_actor_id uuid,
  p_actor_type text
)
returns public.wardrobe_items
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_order public.orders;
  v_item public.wardrobe_items;
begin
  if p_actor_id is null or p_actor_type not in ('staff', 'system') then
    raise exception 'Trusted actor is required';
  end if;
  select * into v_order from public.orders where id = p_order_id for update;
  if v_order.id is null or v_order.status <> 'completed' then
    raise exception 'Only completed orders can enter the wardrobe';
  end if;

  select * into v_item from public.wardrobe_items where order_id = p_order_id;
  if v_item.id is not null then return v_item; end if;

  insert into public.wardrobe_items (
    customer_id, order_id, style_id, style_code, style_name, category,
    hero_image, fabric_snapshot, colour_snapshot, preferences_snapshot,
    measurements_snapshot, completion_date, craftsmanship_notes
  ) values (
    v_order.customer_id, v_order.id, v_order.style_id, v_order.style_code,
    v_order.style_name, coalesce(v_order.garment_category, 'bespoke'),
    coalesce(v_order.style_image, '/images/editorial/hero-editorial.jpg'),
    coalesce(v_order.fabric_details, '{}'::jsonb), coalesce(v_order.colour_details, '{}'::jsonb),
    coalesce(v_order.preferences, '{}'::jsonb), v_order.measurements_snapshot,
    current_date::text, v_order.special_instructions
  ) returning * into v_item;

  insert into public.notifications (
    customer_id, type, title, message, related_entity_type, related_entity_id
  ) values (
    v_order.customer_id, 'wardrobe_item_added', 'Garment Added to Your Wardrobe',
    v_order.style_name || ' is now recorded in your private digital wardrobe.',
    'wardrobe', v_item.id::text
  );

  insert into public.lifecycle_events (
    entity_type, entity_id, customer_id, event_type, actor_type, actor_id, metadata
  ) values (
    'wardrobe_item', v_item.id, v_order.customer_id,
    'wardrobe_item_created', p_actor_type, p_actor_id,
    jsonb_build_object('order_id', v_order.id)
  );
  return v_item;
end;
$$;

-- Future provider webhook operation. It derives ownership from the order and is
-- idempotent through the provider/reference unique index.
create or replace function public.record_verified_payment(
  p_order_id uuid,
  p_amount_minor bigint,
  p_type text,
  p_provider text,
  p_provider_reference text,
  p_internal_reference text,
  p_paid_at timestamptz,
  p_metadata jsonb default '{}'::jsonb
)
returns public.payments
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_order public.orders;
  v_payment public.payments;
  v_paid_minor bigint;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if v_order.id is null then raise exception 'Order not found'; end if;
  if p_amount_minor <= 0 or p_provider_reference is null or trim(p_provider_reference) = '' then
    raise exception 'Verified amount and provider reference are required';
  end if;
  if p_paid_at is null then
    raise exception 'A verified provider timestamp is required';
  end if;
  if p_provider not in ('paystack', 'flutterwave', 'manual_transfer', 'atelier_terminal') then
    raise exception 'Unsupported payment provider';
  end if;
  if p_type not in ('deposit', 'installment', 'final_payment', 'full_payment', 'adjustment') then
    raise exception 'Unsupported payment type';
  end if;
  if p_internal_reference is null or trim(p_internal_reference) = '' then
    raise exception 'Internal payment reference is required';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_provider || ':' || p_provider_reference, 0));

  select * into v_payment from public.payments
  where provider = p_provider and provider_reference = p_provider_reference;
  if v_payment.id is not null then
    if v_payment.order_id <> p_order_id
       or v_payment.amount_minor <> p_amount_minor
       or v_payment.type <> p_type then
      raise exception 'Provider payment reference conflicts with an existing payment';
    end if;
    return v_payment;
  end if;

  select coalesce(sum(amount_minor), 0) into v_paid_minor
  from public.payments where order_id = p_order_id and status = 'successful';
  if v_order.total_amount_minor is null or v_paid_minor + p_amount_minor > v_order.total_amount_minor then
    raise exception 'Verified payment exceeds outstanding balance';
  end if;

  insert into public.payments (
    order_id, customer_id, amount, amount_minor, currency, type, provider,
    provider_reference, internal_reference, status, paid_at, metadata
  ) values (
    p_order_id, v_order.customer_id, p_amount_minor::numeric / 100,
    p_amount_minor, 'NGN', p_type, p_provider, p_provider_reference,
    p_internal_reference, 'successful', p_paid_at, coalesce(p_metadata, '{}'::jsonb)
  ) returning * into v_payment;

  insert into public.notifications (
    customer_id, type, title, message, related_entity_type, related_entity_id
  ) values (
    v_order.customer_id, 'payment_successful', 'Payment Verified',
    'A verified payment has been recorded for ' || v_order.order_reference || '.',
    'payment', v_payment.id::text
  );

  insert into public.lifecycle_events (
    entity_type, entity_id, customer_id, event_type, actor_type, metadata
  ) values (
    'payment', v_payment.id, v_order.customer_id, 'payment_verified', 'provider',
    jsonb_build_object('order_id', p_order_id, 'provider', p_provider,
      'provider_reference', p_provider_reference, 'amount_minor', p_amount_minor)
  );
  return v_payment;
end;
$$;

-- None of these operations is a browser/customer RPC.
grant all on table
  public.measurement_profiles,
  public.bespoke_requests,
  public.orders,
  public.appointments,
  public.notifications,
  public.payments,
  public.wardrobe_items,
  public.concierge_requests,
  public.concierge_messages,
  public.appointment_change_requests,
  public.lifecycle_events,
  public.contact_enquiries,
  public.public_fitting_requests
to service_role;

revoke all on function public.create_customer_measurement_version(uuid, text, text, jsonb, text) from public, anon, authenticated;
revoke all on function public.submit_bespoke_request(uuid, jsonb) from public, anon, authenticated;
revoke all on function public.request_appointment_change(uuid, uuid, text, text, text, text) from public, anon, authenticated;
revoke all on function public.create_customer_concierge_request(uuid, jsonb) from public, anon, authenticated;
revoke all on function public.add_customer_concierge_message(uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.convert_bespoke_request_to_order(uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.create_wardrobe_for_completed_order(uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.record_verified_payment(uuid, bigint, text, text, text, text, timestamptz, jsonb) from public, anon, authenticated;

grant execute on function public.create_customer_measurement_version(uuid, text, text, jsonb, text) to service_role;
grant execute on function public.submit_bespoke_request(uuid, jsonb) to service_role;
grant execute on function public.request_appointment_change(uuid, uuid, text, text, text, text) to service_role;
grant execute on function public.create_customer_concierge_request(uuid, jsonb) to service_role;
grant execute on function public.add_customer_concierge_message(uuid, uuid, text) to service_role;
grant execute on function public.convert_bespoke_request_to_order(uuid, uuid, text) to service_role;
grant execute on function public.create_wardrobe_for_completed_order(uuid, uuid, text) to service_role;
grant execute on function public.record_verified_payment(uuid, bigint, text, text, text, text, timestamptz, jsonb) to service_role;

commit;
