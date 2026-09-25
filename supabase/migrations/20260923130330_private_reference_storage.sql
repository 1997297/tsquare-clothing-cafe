-- TCC private bespoke reference-image bucket and owner-scoped policies.

begin;

insert into storage.buckets (
  id, name, public, file_size_limit, allowed_mime_types
) values (
  'bespoke-references',
  'bespoke-references',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Customers read own bespoke references" on storage.objects;
drop policy if exists "Customers upload own bespoke references" on storage.objects;
drop policy if exists "Customers update own bespoke references" on storage.objects;
drop policy if exists "Customers delete own bespoke references" on storage.objects;

create policy "Customers read own bespoke references"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'bespoke-references'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
    and owner_id = (select auth.uid()::text)
  );

create policy "Customers upload own bespoke references"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'bespoke-references'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy "Customers update own bespoke references"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'bespoke-references'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
    and owner_id = (select auth.uid()::text)
  )
  with check (
    bucket_id = 'bespoke-references'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy "Customers delete own bespoke references"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'bespoke-references'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
    and owner_id = (select auth.uid()::text)
  );

commit;
