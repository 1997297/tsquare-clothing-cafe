-- Phase 3: staff-managed catalogue lifecycle, reusable options, and runtime media.
-- Existing Fit IDs and saved_styles references are intentionally preserved.

alter table public.catalogue_categories
  drop constraint if exists catalogue_categories_slug_check;

alter table public.catalogue_categories
  add constraint catalogue_categories_slug_format
    check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  add constraint catalogue_categories_name_length
    check (char_length(name) between 2 and 80);

alter table public.catalogue_fits
  add column status text;

update public.catalogue_fits
set status = case when is_active then 'published' else 'archived' end;

alter table public.catalogue_fits
  alter column status set not null,
  alter column status set default 'draft',
  add constraint catalogue_fits_status_check
    check (status in ('draft', 'published', 'archived')),
  add constraint catalogue_fits_slug_format
    check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  add constraint catalogue_fits_name_length
    check (char_length(name) between 2 and 120),
  add constraint catalogue_fits_code_length
    check (char_length(code) between 2 and 40);

drop policy if exists "Public can read active catalogue categories" on public.catalogue_categories;
drop policy if exists "Public can read active catalogue fits" on public.catalogue_fits;
drop policy if exists "Public can read images for active fits" on public.catalogue_fit_images;
drop policy if exists "Public can read fabrics for active fits" on public.catalogue_fit_fabrics;
drop policy if exists "Public can read colours for active fits" on public.catalogue_fit_colours;

drop index if exists public.catalogue_fits_category_active_order;
drop index if exists public.catalogue_fits_featured_active;

alter table public.catalogue_fits drop column is_active;

create table public.catalogue_fabrics (
  id text primary key,
  name text not null,
  description text not null,
  weight text,
  finish text,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  constraint catalogue_fabrics_name_length check (char_length(name) between 2 and 80)
);

create unique index catalogue_fabrics_name_unique
  on public.catalogue_fabrics(lower(name));

insert into public.catalogue_fabrics (id, name, description, weight, finish)
select distinct on (lower(name))
  'fab-' || substr(md5(lower(name)), 1, 16),
  name,
  description,
  weight,
  finish
from public.catalogue_fit_fabrics
order by lower(name), id;

create table public.catalogue_fit_fabric_links (
  fit_id text not null references public.catalogue_fits(id) on delete cascade,
  fabric_id text not null references public.catalogue_fabrics(id) on delete restrict,
  sort_order integer not null default 0,
  primary key (fit_id, fabric_id),
  unique (fit_id, sort_order)
);

insert into public.catalogue_fit_fabric_links (fit_id, fabric_id, sort_order)
select
  fit_id,
  'fab-' || substr(md5(lower(name)), 1, 16),
  sort_order
from public.catalogue_fit_fabrics;

drop table public.catalogue_fit_fabrics;
alter table public.catalogue_fit_fabric_links rename to catalogue_fit_fabrics;

create index catalogue_fit_fabrics_fit_order
  on public.catalogue_fit_fabrics(fit_id, sort_order);
create index catalogue_fit_fabrics_fabric
  on public.catalogue_fit_fabrics(fabric_id);

create table public.catalogue_colours (
  id text primary key,
  name text not null,
  hex text not null check (hex ~ '^#[0-9A-Fa-f]{6}$'),
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  constraint catalogue_colours_name_length check (char_length(name) between 2 and 80)
);

create unique index catalogue_colours_name_unique
  on public.catalogue_colours(lower(name));

insert into public.catalogue_colours (id, name, hex)
select distinct on (lower(name))
  'clr-' || substr(md5(lower(name)), 1, 16),
  name,
  upper(hex)
from public.catalogue_fit_colours
order by lower(name), id;

create table public.catalogue_fit_colour_links (
  fit_id text not null references public.catalogue_fits(id) on delete cascade,
  colour_id text not null references public.catalogue_colours(id) on delete restrict,
  sort_order integer not null default 0,
  primary key (fit_id, colour_id),
  unique (fit_id, sort_order)
);

insert into public.catalogue_fit_colour_links (fit_id, colour_id, sort_order)
select
  fit_id,
  'clr-' || substr(md5(lower(name)), 1, 16),
  sort_order
from public.catalogue_fit_colours;

drop table public.catalogue_fit_colours;
alter table public.catalogue_fit_colour_links rename to catalogue_fit_colours;

create index catalogue_fit_colours_fit_order
  on public.catalogue_fit_colours(fit_id, sort_order);
create index catalogue_fit_colours_colour
  on public.catalogue_fit_colours(colour_id);

alter table public.catalogue_fit_images
  alter column image_path drop not null,
  add column storage_object_path text unique,
  add column uploaded_by uuid references auth.users(id) on delete set null,
  add column created_at timestamptz not null default timezone('utc'::text, now()),
  add constraint catalogue_fit_images_source_check
    check (
      (image_path is not null and storage_object_path is null)
      or (image_path is null and storage_object_path is not null)
    );

create index catalogue_fits_category_status_order
  on public.catalogue_fits(category_slug, status, display_order);
create index catalogue_fits_featured_published
  on public.catalogue_fits(featured, status)
  where featured and status = 'published';

create or replace function private.set_catalogue_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := timezone('utc'::text, now());
  return new;
end;
$$;

revoke all on function private.set_catalogue_updated_at() from public, anon, authenticated;

create trigger set_catalogue_categories_updated_at
  before update on public.catalogue_categories
  for each row execute function private.set_catalogue_updated_at();
create trigger set_catalogue_fits_updated_at
  before update on public.catalogue_fits
  for each row execute function private.set_catalogue_updated_at();
create trigger set_catalogue_fabrics_updated_at
  before update on public.catalogue_fabrics
  for each row execute function private.set_catalogue_updated_at();
create trigger set_catalogue_colours_updated_at
  before update on public.catalogue_colours
  for each row execute function private.set_catalogue_updated_at();

alter table public.catalogue_fabrics enable row level security;
alter table public.catalogue_colours enable row level security;
alter table public.catalogue_fit_fabrics enable row level security;
alter table public.catalogue_fit_colours enable row level security;

create policy "Public read visible catalogue categories"
  on public.catalogue_categories for select
  to anon, authenticated
  using (is_active);
create policy "Active staff read all catalogue categories"
  on public.catalogue_categories for select
  to authenticated
  using ((select private.current_staff_role()) in ('admin', 'ceo'));
create policy "Active staff create catalogue categories"
  on public.catalogue_categories for insert
  to authenticated
  with check ((select private.current_staff_role()) in ('admin', 'ceo'));
create policy "Active staff update catalogue categories"
  on public.catalogue_categories for update
  to authenticated
  using ((select private.current_staff_role()) in ('admin', 'ceo'))
  with check ((select private.current_staff_role()) in ('admin', 'ceo'));

create policy "Public read published catalogue fits"
  on public.catalogue_fits for select
  to anon, authenticated
  using (
    status = 'published'
    and exists (
      select 1 from public.catalogue_categories category
      where category.slug = catalogue_fits.category_slug and category.is_active
    )
  );
create policy "Active staff read all catalogue fits"
  on public.catalogue_fits for select
  to authenticated
  using ((select private.current_staff_role()) in ('admin', 'ceo'));
create policy "Active staff create catalogue fits"
  on public.catalogue_fits for insert
  to authenticated
  with check ((select private.current_staff_role()) in ('admin', 'ceo'));
create policy "Active staff update catalogue fits"
  on public.catalogue_fits for update
  to authenticated
  using ((select private.current_staff_role()) in ('admin', 'ceo'))
  with check ((select private.current_staff_role()) in ('admin', 'ceo'));

create policy "Public read published Fit images"
  on public.catalogue_fit_images for select
  to anon, authenticated
  using (exists (
    select 1
    from public.catalogue_fits fit
    join public.catalogue_categories category on category.slug = fit.category_slug
    where fit.id = catalogue_fit_images.fit_id
      and fit.status = 'published'
      and category.is_active
  ));
create policy "Active staff read all Fit images"
  on public.catalogue_fit_images for select
  to authenticated
  using ((select private.current_staff_role()) in ('admin', 'ceo'));
create policy "Active staff create Fit images"
  on public.catalogue_fit_images for insert
  to authenticated
  with check ((select private.current_staff_role()) in ('admin', 'ceo'));
create policy "Active staff update Fit images"
  on public.catalogue_fit_images for update
  to authenticated
  using ((select private.current_staff_role()) in ('admin', 'ceo'))
  with check ((select private.current_staff_role()) in ('admin', 'ceo'));
create policy "Active staff delete Fit images"
  on public.catalogue_fit_images for delete
  to authenticated
  using ((select private.current_staff_role()) in ('admin', 'ceo'));

create policy "Public read active catalogue fabrics"
  on public.catalogue_fabrics for select
  to anon, authenticated
  using (is_active);
create policy "Active staff read all catalogue fabrics"
  on public.catalogue_fabrics for select
  to authenticated
  using ((select private.current_staff_role()) in ('admin', 'ceo'));
create policy "Active staff create catalogue fabrics"
  on public.catalogue_fabrics for insert
  to authenticated
  with check ((select private.current_staff_role()) in ('admin', 'ceo'));
create policy "Active staff update catalogue fabrics"
  on public.catalogue_fabrics for update
  to authenticated
  using ((select private.current_staff_role()) in ('admin', 'ceo'))
  with check ((select private.current_staff_role()) in ('admin', 'ceo'));

create policy "Public read active catalogue colours"
  on public.catalogue_colours for select
  to anon, authenticated
  using (is_active);
create policy "Active staff read all catalogue colours"
  on public.catalogue_colours for select
  to authenticated
  using ((select private.current_staff_role()) in ('admin', 'ceo'));
create policy "Active staff create catalogue colours"
  on public.catalogue_colours for insert
  to authenticated
  with check ((select private.current_staff_role()) in ('admin', 'ceo'));
create policy "Active staff update catalogue colours"
  on public.catalogue_colours for update
  to authenticated
  using ((select private.current_staff_role()) in ('admin', 'ceo'))
  with check ((select private.current_staff_role()) in ('admin', 'ceo'));

create policy "Public read fabrics for published Fits"
  on public.catalogue_fit_fabrics for select
  to anon, authenticated
  using (exists (
    select 1
    from public.catalogue_fits fit
    join public.catalogue_categories category on category.slug = fit.category_slug
    where fit.id = catalogue_fit_fabrics.fit_id
      and fit.status = 'published'
      and category.is_active
  ));
create policy "Active staff manage Fit fabrics"
  on public.catalogue_fit_fabrics for all
  to authenticated
  using ((select private.current_staff_role()) in ('admin', 'ceo'))
  with check ((select private.current_staff_role()) in ('admin', 'ceo'));

create policy "Public read colours for published Fits"
  on public.catalogue_fit_colours for select
  to anon, authenticated
  using (exists (
    select 1
    from public.catalogue_fits fit
    join public.catalogue_categories category on category.slug = fit.category_slug
    where fit.id = catalogue_fit_colours.fit_id
      and fit.status = 'published'
      and category.is_active
  ));
create policy "Active staff manage Fit colours"
  on public.catalogue_fit_colours for all
  to authenticated
  using ((select private.current_staff_role()) in ('admin', 'ceo'))
  with check ((select private.current_staff_role()) in ('admin', 'ceo'));

revoke all on public.catalogue_categories, public.catalogue_fits,
  public.catalogue_fit_images, public.catalogue_fabrics, public.catalogue_colours,
  public.catalogue_fit_fabrics, public.catalogue_fit_colours from anon, authenticated;

grant select on public.catalogue_categories, public.catalogue_fits,
  public.catalogue_fit_images, public.catalogue_fabrics, public.catalogue_colours,
  public.catalogue_fit_fabrics, public.catalogue_fit_colours to anon, authenticated;
grant insert, update on public.catalogue_categories, public.catalogue_fits,
  public.catalogue_fabrics, public.catalogue_colours to authenticated;
grant insert, update, delete on public.catalogue_fit_images,
  public.catalogue_fit_fabrics, public.catalogue_fit_colours to authenticated;
grant usage, select on sequence public.catalogue_fit_images_id_seq to authenticated;
grant all on public.catalogue_categories, public.catalogue_fits,
  public.catalogue_fit_images, public.catalogue_fabrics, public.catalogue_colours,
  public.catalogue_fit_fabrics, public.catalogue_fit_colours to service_role;

create or replace function public.reorder_catalogue_fit_images(
  p_fit_id text,
  p_image_ids bigint[],
  p_primary_id bigint default null
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  image_id bigint;
  image_index integer;
  stored_count integer;
begin
  if (select private.current_staff_role()) not in ('admin', 'ceo') then
    raise exception 'STAFF_ACCESS_DENIED' using errcode = '42501';
  end if;

  if cardinality(p_image_ids) <> (
    select count(distinct supplied_id)
    from unnest(p_image_ids) supplied_id
  ) then
    raise exception 'IMAGE_ORDER_CONTAINS_DUPLICATES' using errcode = '22023';
  end if;

  select count(*) into stored_count
  from public.catalogue_fit_images
  where fit_id = p_fit_id;

  if stored_count <> cardinality(p_image_ids)
    or exists (
      select 1 from unnest(p_image_ids) supplied_id
      where not exists (
        select 1 from public.catalogue_fit_images image
        where image.id = supplied_id and image.fit_id = p_fit_id
      )
    ) then
    raise exception 'IMAGE_ORDER_MISMATCH' using errcode = '22023';
  end if;

  if p_primary_id is not null and not (p_primary_id = any(p_image_ids)) then
    raise exception 'PRIMARY_IMAGE_MISMATCH' using errcode = '22023';
  end if;

  update public.catalogue_fit_images
  set sort_order = sort_order + 100000,
      is_primary = false
  where fit_id = p_fit_id;

  for image_index in 1..coalesce(cardinality(p_image_ids), 0) loop
    image_id := p_image_ids[image_index];
    update public.catalogue_fit_images
    set sort_order = image_index - 1,
        is_primary = image_id = p_primary_id
    where id = image_id and fit_id = p_fit_id;
  end loop;
end;
$$;

revoke all on function public.reorder_catalogue_fit_images(text, bigint[], bigint)
  from public, anon;
grant execute on function public.reorder_catalogue_fit_images(text, bigint[], bigint)
  to authenticated, service_role;

create or replace function public.replace_catalogue_fit_options(
  p_fit_id text,
  p_fabric_ids text[],
  p_colour_ids text[]
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if (select private.current_staff_role()) not in ('admin', 'ceo') then
    raise exception 'STAFF_ACCESS_DENIED' using errcode = '42501';
  end if;

  if not exists (select 1 from public.catalogue_fits where id = p_fit_id) then
    raise exception 'FIT_NOT_FOUND' using errcode = 'P0002';
  end if;

  if cardinality(p_fabric_ids) <> (
    select count(distinct supplied_id) from unnest(p_fabric_ids) supplied_id
  ) or exists (
    select 1 from unnest(p_fabric_ids) supplied_id
    where not exists (select 1 from public.catalogue_fabrics where id = supplied_id)
  ) then
    raise exception 'INVALID_FABRIC_SELECTION' using errcode = '22023';
  end if;

  if cardinality(p_colour_ids) <> (
    select count(distinct supplied_id) from unnest(p_colour_ids) supplied_id
  ) or exists (
    select 1 from unnest(p_colour_ids) supplied_id
    where not exists (select 1 from public.catalogue_colours where id = supplied_id)
  ) then
    raise exception 'INVALID_COLOUR_SELECTION' using errcode = '22023';
  end if;

  delete from public.catalogue_fit_fabrics where fit_id = p_fit_id;
  insert into public.catalogue_fit_fabrics (fit_id, fabric_id, sort_order)
  select p_fit_id, supplied_id, ordinal - 1
  from unnest(p_fabric_ids) with ordinality selected(supplied_id, ordinal);

  delete from public.catalogue_fit_colours where fit_id = p_fit_id;
  insert into public.catalogue_fit_colours (fit_id, colour_id, sort_order)
  select p_fit_id, supplied_id, ordinal - 1
  from unnest(p_colour_ids) with ordinality selected(supplied_id, ordinal);
end;
$$;

revoke all on function public.replace_catalogue_fit_options(text, text[], text[])
  from public, anon;
grant execute on function public.replace_catalogue_fit_options(text, text[], text[])
  to authenticated, service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'catalogue-media',
  'catalogue-media',
  false,
  8388608,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "Public read published catalogue media"
  on storage.objects for select
  to anon, authenticated
  using (
    bucket_id = 'catalogue-media'
    and exists (
      select 1
      from public.catalogue_fits fit
      join public.catalogue_categories category on category.slug = fit.category_slug
      where fit.id = (storage.foldername(storage.objects.name))[1]
        and fit.status = 'published'
        and category.is_active
    )
  );

create policy "Active staff read catalogue media"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'catalogue-media'
    and (select private.current_staff_role()) in ('admin', 'ceo')
  );
create policy "Active staff upload catalogue media"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'catalogue-media'
    and (select private.current_staff_role()) in ('admin', 'ceo')
    and exists (
      select 1 from public.catalogue_fits fit
      where fit.id = (storage.foldername(storage.objects.name))[1]
    )
  );
create policy "Active staff update catalogue media"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'catalogue-media'
    and (select private.current_staff_role()) in ('admin', 'ceo')
  )
  with check (
    bucket_id = 'catalogue-media'
    and (select private.current_staff_role()) in ('admin', 'ceo')
    and exists (
      select 1 from public.catalogue_fits fit
      where fit.id = (storage.foldername(storage.objects.name))[1]
    )
  );
create policy "Active staff delete catalogue media"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'catalogue-media'
    and (select private.current_staff_role()) in ('admin', 'ceo')
  );
