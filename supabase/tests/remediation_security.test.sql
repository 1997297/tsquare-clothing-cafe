begin;

select plan(26);

select ok((select relrowsecurity from pg_class where oid = 'public.measurement_profiles'::regclass), 'measurement RLS is enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.bespoke_requests'::regclass), 'request RLS is enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.payments'::regclass), 'payment RLS is enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.wardrobe_items'::regclass), 'wardrobe RLS is enabled');
select ok(not has_table_privilege('authenticated', 'public.bespoke_requests', 'INSERT'), 'customers cannot insert requests directly');
select ok(not has_table_privilege('authenticated', 'public.bespoke_requests', 'UPDATE'), 'customers cannot update trusted request fields');
select ok(not has_table_privilege('authenticated', 'public.orders', 'INSERT'), 'customers cannot create orders');
select ok(not has_table_privilege('authenticated', 'public.payments', 'INSERT'), 'customers cannot create payments');
select ok(not has_table_privilege('authenticated', 'public.wardrobe_items', 'INSERT'), 'customers cannot create wardrobe records');
select ok(not has_function_privilege('authenticated', 'public.convert_bespoke_request_to_order(uuid,uuid,text)', 'EXECUTE'), 'customers cannot convert requests to orders');
select ok(not has_function_privilege('authenticated', 'public.record_verified_payment(uuid,bigint,text,text,text,text,timestamptz,jsonb)', 'EXECUTE'), 'customers cannot record verified payments');
select is((select count(*)::integer from pg_indexes where schemaname = 'public' and indexname = 'measurement_profiles_one_current_uidx'), 1, 'one-current-measurement index exists');
select ok((select relrowsecurity from pg_class where oid = 'public.staff_accounts'::regclass), 'staff account RLS is enabled');
select ok(not has_table_privilege('authenticated', 'public.staff_accounts', 'INSERT'), 'authenticated users cannot create staff authority');
select ok(not has_table_privilege('authenticated', 'public.staff_accounts', 'UPDATE'), 'staff cannot change their own role or status');
select ok(not has_table_privilege('authenticated', 'public.staff_accounts', 'DELETE'), 'staff cannot remove authorization records');
select ok(has_table_privilege('authenticated', 'public.staff_accounts', 'SELECT'), 'authenticated users can resolve their RLS-scoped staff record');
select ok(has_function_privilege('authenticated', 'private.current_staff_role()', 'EXECUTE'), 'authenticated sessions can resolve their active staff role inside RLS');
select ok(not has_function_privilege('authenticated', 'private.provision_initial_ceo(uuid)', 'EXECUTE'), 'browser users cannot provision the initial CEO');
select is((select count(*)::integer from pg_policies where schemaname = 'public' and tablename = 'profiles' and policyname = 'Clients read own profile or active staff'), 1, 'combined profile policy preserves client isolation and staff access');
select ok(has_column_privilege('authenticated', 'public.profiles', 'first_name', 'UPDATE'), 'authenticated users may update their own first name through RLS');
select ok(has_column_privilege('authenticated', 'public.profiles', 'avatar_url', 'UPDATE'), 'authenticated users may persist their own avatar reference through RLS');
select ok(not has_column_privilege('authenticated', 'public.profiles', 'email', 'UPDATE'), 'ordinary profile editing cannot change profile email');
select ok(not has_column_privilege('authenticated', 'public.profiles', 'id', 'UPDATE'), 'ordinary profile editing cannot change profile ownership');
select is((select count(*)::integer from pg_policies where schemaname = 'public' and tablename = 'profiles' and policyname = 'Customers update safe profile fields'), 1, 'own-profile update RLS remains active');
select is((select count(*)::integer from storage.buckets where id = 'profile-avatars' and public and file_size_limit = 5242880 and allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']), 1, 'shared profile avatar bucket retains its validated image limits');

select * from finish();
rollback;
