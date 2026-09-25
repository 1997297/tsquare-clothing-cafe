begin;

select plan(12);

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

select * from finish();
rollback;
