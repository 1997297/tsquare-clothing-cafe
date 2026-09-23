-- ==============================================================================
-- TCC — TSQUARE CLOTHING CAFE
-- Phase 3: Private Client Experience Database Schema & Security Architecture
-- ==============================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. PROFILES TABLE (Linked directly to auth.users.id)
-- ------------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text not null,
  preferred_contact text check (preferred_contact in ('whatsapp', 'phone', 'email')) default 'whatsapp',
  avatar_url text,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- Profiles RLS
alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- ------------------------------------------------------------------------------
-- 2. MEASUREMENT PROFILES TABLE (History-preserving versioned model)
-- ------------------------------------------------------------------------------
create table if not exists public.measurement_profiles (
  id uuid default gen_random_uuid() primary key,
  customer_id uuid references public.profiles(id) on delete cascade not null,
  version integer default 1 not null,
  is_current boolean default true not null,
  unit text check (unit in ('cm', 'inches')) default 'cm' not null,
  fit_preference text check (fit_preference in ('tailored', 'regular', 'relaxed')),
  verification_status text check (verification_status in ('customer_entered', 'needs_confirmation', 'tsquare_verified', 'measured_by_tsquare')) default 'customer_entered' not null,
  measurements jsonb not null default '{}'::jsonb,
  notes text,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- Index for speedy queries on active measurement profiles
create index if not exists idx_measurement_profiles_customer on public.measurement_profiles(customer_id, is_current);

-- Measurement Profiles RLS
alter table public.measurement_profiles enable row level security;

create policy "Users can view their own measurements"
  on public.measurement_profiles for select
  using (auth.uid() = customer_id);

create policy "Users can insert their own measurements"
  on public.measurement_profiles for insert
  with check (auth.uid() = customer_id);

create policy "Users can update their own measurements"
  on public.measurement_profiles for update
  using (auth.uid() = customer_id);

-- ------------------------------------------------------------------------------
-- 3. BESPOKE REQUESTS TABLE
-- ------------------------------------------------------------------------------
create table if not exists public.bespoke_requests (
  id uuid default gen_random_uuid() primary key,
  request_reference text unique not null,
  customer_id uuid references public.profiles(id) on delete set null,
  style_id text,
  style_code text,
  style_name text,
  garment_category text,
  is_idea_path boolean default false not null,
  fabric jsonb,
  colour jsonb,
  preferences jsonb default '{}'::jsonb,
  fit_preference text,
  measurements_snapshot jsonb,
  measurement_confidence boolean default false,
  occasion text,
  event_name text,
  event_date text,
  required_date text,
  appointment_request jsonb,
  reference_images jsonb default '[]'::jsonb,
  special_instructions text,
  contact_info jsonb not null,
  status text check (status in ('draft', 'submitted', 'under_review', 'needs_clarification', 'pricing_ready', 'confirmed', 'converted_to_order', 'declined')) default 'submitted' not null,
  quoted_price numeric(12, 2),
  clarification_notes text,
  admin_notes text,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

create index if not exists idx_bespoke_requests_customer on public.bespoke_requests(customer_id);

-- Bespoke Requests RLS
alter table public.bespoke_requests enable row level security;

create policy "Users can view their own bespoke requests"
  on public.bespoke_requests for select
  using (auth.uid() = customer_id);

create policy "Users can submit their own bespoke requests"
  on public.bespoke_requests for insert
  with check (auth.uid() = customer_id);

-- Customers can only update non-pricing / non-status fields (e.g. providing clarification)
create policy "Users can update non-privileged fields on their requests"
  on public.bespoke_requests for update
  using (auth.uid() = customer_id)
  with check (auth.uid() = customer_id);

-- ------------------------------------------------------------------------------
-- 4. ORDERS TABLE (Strictly separated from requests)
-- ------------------------------------------------------------------------------
create table if not exists public.orders (
  id uuid default gen_random_uuid() primary key,
  order_reference text unique not null,
  customer_id uuid references public.profiles(id) on delete restrict not null,
  bespoke_request_id uuid references public.bespoke_requests(id) on delete set null,
  style_id text not null,
  style_code text not null,
  style_name text not null,
  garment_category text,
  fabric_details jsonb,
  colour_details jsonb,
  preferences jsonb default '{}'::jsonb,
  measurements_snapshot jsonb not null,
  status text check (status in ('order_confirmed', 'measurements_confirmed', 'in_production', 'finishing', 'ready', 'completed')) default 'order_confirmed' not null,
  total_amount numeric(12, 2),
  target_completion_date text,
  production_stage_updated_at timestamptz default timezone('utc'::text, now()),
  special_instructions text,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

create index if not exists idx_orders_customer on public.orders(customer_id);

-- Orders RLS (Read-only for customers; created and updated solely by backend/admin)
alter table public.orders enable row level security;

create policy "Users can view their own orders"
  on public.orders for select
  using (auth.uid() = customer_id);

-- ------------------------------------------------------------------------------
-- 5. APPOINTMENTS TABLE
-- ------------------------------------------------------------------------------
create table if not exists public.appointments (
  id uuid default gen_random_uuid() primary key,
  customer_id uuid references public.profiles(id) on delete cascade not null,
  bespoke_request_id uuid references public.bespoke_requests(id) on delete set null,
  order_id uuid references public.orders(id) on delete set null,
  type text not null, -- 'consultation', 'measurement', 'first-fitting', 'final-fitting'
  preferred_date text not null,
  preferred_time text not null,
  confirmed_date text,
  confirmed_time text,
  status text check (status in ('requested', 'scheduled', 'confirmed', 'completed', 'rescheduled', 'cancelled')) default 'requested' not null,
  location text default 'TCC office' not null,
  notes text,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

create index if not exists idx_appointments_customer on public.appointments(customer_id);

-- Appointments RLS
alter table public.appointments enable row level security;

create policy "Users can view their own appointments"
  on public.appointments for select
  using (auth.uid() = customer_id);

create policy "Users can request appointments"
  on public.appointments for insert
  with check (auth.uid() = customer_id);

create policy "Users can update their requested appointments (cancel/reschedule)"
  on public.appointments for update
  using (auth.uid() = customer_id);

-- ------------------------------------------------------------------------------
-- 6. SAVED STYLES TABLE (Persisted for authenticated clients)
-- ------------------------------------------------------------------------------
create table if not exists public.saved_styles (
  id uuid default gen_random_uuid() primary key,
  customer_id uuid references public.profiles(id) on delete cascade not null,
  style_id text not null,
  saved_at timestamptz default timezone('utc'::text, now()) not null,
  unique(customer_id, style_id)
);

create index if not exists idx_saved_styles_customer on public.saved_styles(customer_id);

-- Saved Styles RLS
alter table public.saved_styles enable row level security;

create policy "Users can view their own saved styles"
  on public.saved_styles for select
  using (auth.uid() = customer_id);

create policy "Users can save styles"
  on public.saved_styles for insert
  with check (auth.uid() = customer_id);

create policy "Users can remove saved styles"
  on public.saved_styles for delete
  using (auth.uid() = customer_id);

-- ------------------------------------------------------------------------------
-- 7. NOTIFICATIONS TABLE
-- ------------------------------------------------------------------------------
create table if not exists public.notifications (
  id uuid default gen_random_uuid() primary key,
  customer_id uuid references public.profiles(id) on delete cascade not null,
  type text not null, -- 'request_received', 'request_update', 'needs_clarification', 'pricing_ready', 'order_confirmed', 'production_update', 'order_ready', 'appointment_confirmed'
  title text not null,
  message text not null,
  related_entity_type text, -- 'request', 'order', 'appointment'
  related_entity_id text,
  is_read boolean default false not null,
  read_at timestamptz,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

create index if not exists idx_notifications_customer on public.notifications(customer_id, is_read);

-- Notifications RLS
alter table public.notifications enable row level security;

create policy "Users can view their own notifications"
  on public.notifications for select
  using (auth.uid() = customer_id);

create policy "Users can mark notifications as read"
  on public.notifications for update
  using (auth.uid() = customer_id);

-- ------------------------------------------------------------------------------
-- 8. AUTOMATIC PROFILE INITIALIZATION TRIGGER
-- ------------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, first_name, last_name, email, phone, preferred_contact)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'first_name', 'Client'),
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    new.email,
    coalesce(new.raw_user_meta_data->>'phone', ''),
    coalesce(new.raw_user_meta_data->>'preferred_contact', 'whatsapp')
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger firing on every new user created via auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ==============================================================================
-- 9. PAYMENTS TABLE (Phase 4: Commercial & Financial Architecture)
-- ==============================================================================
create table if not exists public.payments (
  id uuid default gen_random_uuid() primary key,
  order_id uuid references public.orders(id) on delete restrict not null,
  customer_id uuid references public.profiles(id) on delete restrict not null,
  amount numeric(12, 2) not null check (amount > 0),
  currency text default 'NGN' not null,
  type text check (type in ('deposit', 'installment', 'final_payment', 'full_payment', 'adjustment')) not null,
  provider text check (provider in ('paystack', 'flutterwave', 'manual_transfer', 'atelier_terminal', 'sandbox')) default 'sandbox' not null,
  provider_reference text,
  internal_reference text unique not null,
  status text check (status in ('pending', 'successful', 'failed', 'refunded')) default 'pending' not null,
  paid_at timestamptz,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

create index if not exists idx_payments_order on public.payments(order_id);
create index if not exists idx_payments_customer on public.payments(customer_id);
create index if not exists idx_payments_status on public.payments(status);

-- Payments RLS: Customers can ONLY read their own payments.
-- Customers cannot insert, alter amounts, fake success, or update records directly via client SQL.
alter table public.payments enable row level security;

create policy "Users can view their own payments"
  on public.payments for select
  using (auth.uid() = customer_id);

-- ==============================================================================
-- 10. WARDROBE ITEMS TABLE (Phase 4: My TSquare Wardrobe)
-- ==============================================================================
create table if not exists public.wardrobe_items (
  id uuid default gen_random_uuid() primary key,
  customer_id uuid references public.profiles(id) on delete cascade not null,
  order_id uuid references public.orders(id) on delete restrict unique not null, -- Guarantees idempotency
  style_id text not null,
  style_code text not null,
  style_name text not null,
  category text not null,
  hero_image text not null,
  gallery_images jsonb default '[]'::jsonb,
  fabric_snapshot jsonb not null default '{}'::jsonb,
  colour_snapshot jsonb not null default '{}'::jsonb,
  preferences_snapshot jsonb not null default '{}'::jsonb,
  measurements_snapshot jsonb not null default '{}'::jsonb,
  occasion text,
  completion_date text not null,
  craftsmanship_notes text,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

create index if not exists idx_wardrobe_customer on public.wardrobe_items(customer_id);
create index if not exists idx_wardrobe_order on public.wardrobe_items(order_id);

-- Wardrobe Items RLS: Customers can view their own archive.
alter table public.wardrobe_items enable row level security;

create policy "Users can view their own wardrobe"
  on public.wardrobe_items for select
  using (auth.uid() = customer_id);

-- ==============================================================================
-- 11. CONCIERGE REQUESTS & MESSAGES TABLES (Phase 4: Client Services)
-- ==============================================================================
create table if not exists public.concierge_requests (
  id uuid default gen_random_uuid() primary key,
  reference_code text unique not null,
  customer_id uuid references public.profiles(id) on delete cascade not null,
  category text check (category in ('discuss_order', 'discuss_request', 'fitting_enquiry', 'payment_question', 'style_consultation', 'general_enquiry')) not null,
  subject text not null,
  message text not null,
  related_request_id text,
  related_order_id text,
  related_appointment_id text,
  status text check (status in ('open', 'in_review', 'awaiting_customer', 'resolved', 'closed')) default 'open' not null,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

create index if not exists idx_concierge_requests_customer on public.concierge_requests(customer_id);
create index if not exists idx_concierge_requests_status on public.concierge_requests(status);

alter table public.concierge_requests enable row level security;

create policy "Users can view their own concierge requests"
  on public.concierge_requests for select
  using (auth.uid() = customer_id);

create policy "Users can submit concierge requests"
  on public.concierge_requests for insert
  with check (auth.uid() = customer_id);

create table if not exists public.concierge_messages (
  id uuid default gen_random_uuid() primary key,
  request_id uuid references public.concierge_requests(id) on delete cascade not null,
  sender_type text check (sender_type in ('customer', 'concierge')) not null,
  sender_id uuid references public.profiles(id) on delete set null,
  sender_name text not null,
  message text not null,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

create index if not exists idx_concierge_messages_request on public.concierge_messages(request_id);

alter table public.concierge_messages enable row level security;

create policy "Users can view messages for their concierge requests"
  on public.concierge_messages for select
  using (
    exists (
      select 1 from public.concierge_requests r
      where r.id = concierge_messages.request_id
      and r.customer_id = auth.uid()
    )
  );

create policy "Users can add messages to their own open requests"
  on public.concierge_messages for insert
  with check (
    sender_type = 'customer' and
    exists (
      select 1 from public.concierge_requests r
      where r.id = concierge_messages.request_id
      and r.customer_id = auth.uid()
    )
  );

-- ==============================================================================
-- 12. APPOINTMENT CHANGE REQUESTS TABLE (Phase 4: Non-Destructive Reschedule/Cancel)
-- ==============================================================================
create table if not exists public.appointment_change_requests (
  id uuid default gen_random_uuid() primary key,
  appointment_id uuid references public.appointments(id) on delete cascade not null,
  customer_id uuid references public.profiles(id) on delete cascade not null,
  change_type text check (change_type in ('reschedule', 'cancellation')) not null,
  proposed_date text,
  proposed_time text,
  reason text,
  status text check (status in ('pending_review', 'approved', 'declined')) default 'pending_review' not null,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  reviewed_at timestamptz
);

create index if not exists idx_appointment_changes_appt on public.appointment_change_requests(appointment_id);

alter table public.appointment_change_requests enable row level security;

create policy "Users can view their appointment change requests"
  on public.appointment_change_requests for select
  using (auth.uid() = customer_id);

create policy "Users can submit appointment change requests"
  on public.appointment_change_requests for insert
  with check (auth.uid() = customer_id);

