-- Keep one permissive policy per role/action and cover the new uploader FK.

create index catalogue_fit_images_uploaded_by_idx
  on public.catalogue_fit_images(uploaded_by)
  where uploaded_by is not null;

drop policy "Public read visible catalogue categories" on public.catalogue_categories;
drop policy "Active staff read all catalogue categories" on public.catalogue_categories;
create policy "Anonymous read visible catalogue categories"
  on public.catalogue_categories for select to anon using (is_active);
create policy "Authenticated read visible or staff catalogue categories"
  on public.catalogue_categories for select to authenticated
  using (is_active or (select private.current_staff_role()) in ('admin', 'ceo'));

drop policy "Public read published catalogue fits" on public.catalogue_fits;
drop policy "Active staff read all catalogue fits" on public.catalogue_fits;
create policy "Anonymous read published catalogue fits"
  on public.catalogue_fits for select to anon
  using (
    status = 'published'
    and exists (
      select 1 from public.catalogue_categories category
      where category.slug = catalogue_fits.category_slug and category.is_active
    )
  );
create policy "Authenticated read published or staff catalogue fits"
  on public.catalogue_fits for select to authenticated
  using (
    (
      status = 'published'
      and exists (
        select 1 from public.catalogue_categories category
        where category.slug = catalogue_fits.category_slug and category.is_active
      )
    )
    or (select private.current_staff_role()) in ('admin', 'ceo')
  );

drop policy "Public read published Fit images" on public.catalogue_fit_images;
drop policy "Active staff read all Fit images" on public.catalogue_fit_images;
create policy "Anonymous read published Fit images"
  on public.catalogue_fit_images for select to anon
  using (exists (
    select 1
    from public.catalogue_fits fit
    join public.catalogue_categories category on category.slug = fit.category_slug
    where fit.id = catalogue_fit_images.fit_id
      and fit.status = 'published'
      and category.is_active
  ));
create policy "Authenticated read published or staff Fit images"
  on public.catalogue_fit_images for select to authenticated
  using (
    exists (
      select 1
      from public.catalogue_fits fit
      join public.catalogue_categories category on category.slug = fit.category_slug
      where fit.id = catalogue_fit_images.fit_id
        and fit.status = 'published'
        and category.is_active
    )
    or (select private.current_staff_role()) in ('admin', 'ceo')
  );

drop policy "Public read active catalogue fabrics" on public.catalogue_fabrics;
drop policy "Active staff read all catalogue fabrics" on public.catalogue_fabrics;
create policy "Anonymous read active catalogue fabrics"
  on public.catalogue_fabrics for select to anon using (is_active);
create policy "Authenticated read active or staff catalogue fabrics"
  on public.catalogue_fabrics for select to authenticated
  using (is_active or (select private.current_staff_role()) in ('admin', 'ceo'));

drop policy "Public read active catalogue colours" on public.catalogue_colours;
drop policy "Active staff read all catalogue colours" on public.catalogue_colours;
create policy "Anonymous read active catalogue colours"
  on public.catalogue_colours for select to anon using (is_active);
create policy "Authenticated read active or staff catalogue colours"
  on public.catalogue_colours for select to authenticated
  using (is_active or (select private.current_staff_role()) in ('admin', 'ceo'));

drop policy "Public read fabrics for published Fits" on public.catalogue_fit_fabrics;
drop policy "Active staff manage Fit fabrics" on public.catalogue_fit_fabrics;
create policy "Anonymous read fabrics for published Fits"
  on public.catalogue_fit_fabrics for select to anon
  using (exists (
    select 1
    from public.catalogue_fits fit
    join public.catalogue_categories category on category.slug = fit.category_slug
    where fit.id = catalogue_fit_fabrics.fit_id
      and fit.status = 'published'
      and category.is_active
  ));
create policy "Authenticated read published or staff Fit fabrics"
  on public.catalogue_fit_fabrics for select to authenticated
  using (
    exists (
      select 1
      from public.catalogue_fits fit
      join public.catalogue_categories category on category.slug = fit.category_slug
      where fit.id = catalogue_fit_fabrics.fit_id
        and fit.status = 'published'
        and category.is_active
    )
    or (select private.current_staff_role()) in ('admin', 'ceo')
  );
create policy "Active staff create Fit fabrics"
  on public.catalogue_fit_fabrics for insert to authenticated
  with check ((select private.current_staff_role()) in ('admin', 'ceo'));
create policy "Active staff update Fit fabrics"
  on public.catalogue_fit_fabrics for update to authenticated
  using ((select private.current_staff_role()) in ('admin', 'ceo'))
  with check ((select private.current_staff_role()) in ('admin', 'ceo'));
create policy "Active staff delete Fit fabrics"
  on public.catalogue_fit_fabrics for delete to authenticated
  using ((select private.current_staff_role()) in ('admin', 'ceo'));

drop policy "Public read colours for published Fits" on public.catalogue_fit_colours;
drop policy "Active staff manage Fit colours" on public.catalogue_fit_colours;
create policy "Anonymous read colours for published Fits"
  on public.catalogue_fit_colours for select to anon
  using (exists (
    select 1
    from public.catalogue_fits fit
    join public.catalogue_categories category on category.slug = fit.category_slug
    where fit.id = catalogue_fit_colours.fit_id
      and fit.status = 'published'
      and category.is_active
  ));
create policy "Authenticated read published or staff Fit colours"
  on public.catalogue_fit_colours for select to authenticated
  using (
    exists (
      select 1
      from public.catalogue_fits fit
      join public.catalogue_categories category on category.slug = fit.category_slug
      where fit.id = catalogue_fit_colours.fit_id
        and fit.status = 'published'
        and category.is_active
    )
    or (select private.current_staff_role()) in ('admin', 'ceo')
  );
create policy "Active staff create Fit colours"
  on public.catalogue_fit_colours for insert to authenticated
  with check ((select private.current_staff_role()) in ('admin', 'ceo'));
create policy "Active staff update Fit colours"
  on public.catalogue_fit_colours for update to authenticated
  using ((select private.current_staff_role()) in ('admin', 'ceo'))
  with check ((select private.current_staff_role()) in ('admin', 'ceo'));
create policy "Active staff delete Fit colours"
  on public.catalogue_fit_colours for delete to authenticated
  using ((select private.current_staff_role()) in ('admin', 'ceo'));

drop policy "Public read published catalogue media" on storage.objects;
drop policy "Active staff read catalogue media" on storage.objects;
create policy "Anonymous read published catalogue media"
  on storage.objects for select to anon
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
create policy "Authenticated read published or staff catalogue media"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'catalogue-media'
    and (
      exists (
        select 1
        from public.catalogue_fits fit
        join public.catalogue_categories category on category.slug = fit.category_slug
        where fit.id = (storage.foldername(storage.objects.name))[1]
          and fit.status = 'published'
          and category.is_active
      )
      or (select private.current_staff_role()) in ('admin', 'ceo')
    )
  );
