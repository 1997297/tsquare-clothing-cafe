-- TCC client-area stabilization: atomic fitting persistence and secure avatars.

begin;

alter table public.public_fitting_requests
  add column if not exists appointment_id uuid
  references public.appointments(id) on delete set null;

create unique index if not exists public_fitting_requests_appointment_uidx
  on public.public_fitting_requests(appointment_id)
  where appointment_id is not null;

create or replace function public.submit_public_fitting_request(
  p_customer_id uuid,
  p_payload jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_request public.public_fitting_requests;
  v_appointment_id uuid;
begin
  if p_customer_id is not null and not exists (
    select 1 from public.profiles where id = p_customer_id
  ) then
    raise exception 'Customer profile not found';
  end if;

  insert into public.public_fitting_requests (
    customer_id,
    name,
    email,
    phone,
    appointment_type,
    preferred_date,
    preferred_time,
    notes,
    style_reference,
    is_existing_customer,
    status
  ) values (
    p_customer_id,
    trim(p_payload->>'customer_name'),
    lower(trim(p_payload->>'email')),
    trim(p_payload->>'phone'),
    p_payload->>'appointment_type',
    (p_payload->>'preferred_date')::date,
    p_payload->>'preferred_time',
    nullif(trim(p_payload->>'notes'), ''),
    nullif(trim(p_payload->>'style_reference'), ''),
    coalesce((p_payload->>'is_existing_customer')::boolean, false),
    'requested'
  ) returning * into v_request;

  if p_customer_id is not null then
    insert into public.appointments (
      customer_id,
      type,
      preferred_date,
      preferred_time,
      status,
      notes
    ) values (
      p_customer_id,
      v_request.appointment_type,
      v_request.preferred_date::text,
      v_request.preferred_time,
      'requested',
      concat_ws(
        E'\n',
        nullif(v_request.notes, ''),
        case
          when v_request.style_reference is not null
            then 'Style reference: ' || v_request.style_reference
          else null
        end
      )
    ) returning id into v_appointment_id;

    update public.public_fitting_requests
    set appointment_id = v_appointment_id,
        updated_at = timezone('utc'::text, now())
    where id = v_request.id;

    insert into public.lifecycle_events (
      entity_type,
      entity_id,
      customer_id,
      event_type,
      actor_type,
      actor_id,
      metadata
    ) values (
      'appointment',
      v_appointment_id,
      p_customer_id,
      'appointment_requested',
      'customer',
      p_customer_id,
      jsonb_build_object('public_fitting_request_id', v_request.id)
    );
  end if;

  return jsonb_build_object(
    'id', v_request.id,
    'appointment_id', v_appointment_id
  );
end;
$$;

revoke all on function public.submit_public_fitting_request(uuid, jsonb)
  from public, anon, authenticated;
grant execute on function public.submit_public_fitting_request(uuid, jsonb)
  to service_role;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
) values (
  'profile-avatars',
  'profile-avatars',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = true,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Customers read own profile avatars" on storage.objects;
drop policy if exists "Customers upload own profile avatars" on storage.objects;
drop policy if exists "Customers update own profile avatars" on storage.objects;
drop policy if exists "Customers delete own profile avatars" on storage.objects;

create policy "Customers read own profile avatars"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'profile-avatars'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
    and owner_id = (select auth.uid()::text)
  );

create policy "Customers upload own profile avatars"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'profile-avatars'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy "Customers update own profile avatars"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'profile-avatars'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
    and owner_id = (select auth.uid()::text)
  )
  with check (
    bucket_id = 'profile-avatars'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy "Customers delete own profile avatars"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'profile-avatars'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
    and owner_id = (select auth.uid()::text)
  );

commit;
