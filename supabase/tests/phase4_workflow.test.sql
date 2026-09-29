-- Rollback-only integration suite. Run as postgres on a disposable baseline + migrations DB.
-- pgTAP is provided by the Supabase test database. Assertions also raise on failure.
begin;
select no_plan();
create function pg_temp.assert_true(p_ok boolean, label text) returns text language plpgsql as $$
begin if p_ok is distinct from true then raise exception 'ASSERTION FAILED: %',label; end if; return ok(true,label); end $$;
create function pg_temp.expect_error(command text, expected text) returns text language plpgsql as $$
declare caught text; begin
 begin execute command; exception when others then caught:=sqlerrm; end;
 if caught is null or position(expected in caught)=0 then
 raise exception 'Expected %, got % for %',expected,coalesce(caught,'SUCCESS'),command; end if;
 return ok(true,'Rejected with '||expected);
end $$;
create temporary table phase4_fixture(key text primary key,val jsonb);
grant all on phase4_fixture to authenticated;
-- These exact UUIDs exist only inside this rolled-back transaction.
insert into auth.users(id,email,raw_user_meta_data) values
 ('f4000000-0000-0000-0000-000000000001','phase4-client1@example.invalid','{}'),
 ('f4000000-0000-0000-0000-000000000002','phase4-client2@example.invalid','{"role":"ceo"}'),
 ('f4000000-0000-0000-0000-000000000003','phase4-admin@example.invalid','{}'),
 ('f4000000-0000-0000-0000-000000000004','phase4-inactive@example.invalid','{}'),
 ('f4000000-0000-0000-0000-000000000005','phase4-ceo@example.invalid','{}'),
 ('f4000000-0000-0000-0000-000000000006','phase4-inactive-ceo@example.invalid','{}');
insert into public.staff_accounts(user_id,role,status,deactivated_at) values
 ('f4000000-0000-0000-0000-000000000003','admin','active',null),
 ('f4000000-0000-0000-0000-000000000004','admin','inactive',now()),
 ('f4000000-0000-0000-0000-000000000005','ceo','active',null),
 ('f4000000-0000-0000-0000-000000000006','ceo','inactive',now());
insert into phase4_fixture values('payments',to_jsonb((select count(*) from public.payments)));
select pg_temp.assert_true(not has_function_privilege('anon','public.submit_bespoke_request(jsonb,uuid)','EXECUTE'),'anon cannot submit');
select pg_temp.assert_true(not has_function_privilege('service_role','public.submit_bespoke_request(uuid,jsonb)','EXECUTE'),'old submit retired');
select pg_temp.assert_true(not has_function_privilege('service_role','public.convert_bespoke_request_to_order(uuid,uuid,text)','EXECUTE'),'old convert retired');
select pg_temp.assert_true(not has_column_privilege('authenticated','public.bespoke_requests','admin_notes','SELECT'),'legacy notes inaccessible');
select pg_temp.assert_true(not has_column_privilege('authenticated','public.bespoke_requests','submission_intent','SELECT'),'raw intent inaccessible');
set local role authenticated;
select set_config('request.jwt.claim.sub','',true);
select pg_temp.expect_error($q$select public.submit_bespoke_request('{}',gen_random_uuid())$q$,'unauthorized');
select set_config('request.jwt.claim.sub','f4000000-0000-0000-0000-000000000001',true);
insert into phase4_fixture values('payload','{"is_idea_path":true,"style_name":"Test commission","contact_info":{"email":"client@example.invalid"},"measurements_snapshot":{"method":"schedule"}}');
insert into phase4_fixture values('request',public.submit_bespoke_request((select val from phase4_fixture where key='payload'),'f4100000-0000-0000-0000-000000000001'));
select pg_temp.assert_true((select val->>'status'='submitted' and val->>'revision'='1' from phase4_fixture where key='request'),'submitted revision one');
select pg_temp.assert_true(public.submit_bespoke_request((select val from phase4_fixture where key='payload'),'f4100000-0000-0000-0000-000000000001')->>'id'=(select val->>'id' from phase4_fixture where key='request'),'submission replay');
select pg_temp.expect_error($q$select public.submit_bespoke_request('{"is_idea_path":true}', 'f4100000-0000-0000-0000-000000000001')$q$,'idempotency_conflict');
select pg_temp.expect_error($q$select public.submit_bespoke_request('{"customer_id":"forged"}',gen_random_uuid())$q$,'invalid_field');
select pg_temp.expect_error($q$select public.submit_bespoke_request('{"contact_info":{},"style_id":"missing-fit"}',gen_random_uuid())$q$,'unavailable_fit');
select pg_temp.expect_error($q$select admin_notes from public.bespoke_requests$q$,'permission denied');
select pg_temp.expect_error($q$update public.bespoke_requests set status='confirmed'$q$,'permission denied');
select pg_temp.expect_error($q$select public.transition_bespoke_request((select (val->>'id')::uuid from phase4_fixture where key='request'),'approve',null,1,gen_random_uuid())$q$,'unauthorized');
select pg_temp.expect_error($q$select public.convert_bespoke_request_to_order((select (val->>'id')::uuid from phase4_fixture where key='request'),1,gen_random_uuid())$q$,'unauthorized');
select set_config('request.jwt.claim.sub','f4000000-0000-0000-0000-000000000002',true);
select pg_temp.assert_true((select count(*)=0 from public.bespoke_requests where id=(select (val->>'id')::uuid from phase4_fixture where key='request')),'client isolation');
select pg_temp.assert_true((select count(*)=0 from public.bespoke_request_revisions where request_id=(select (val->>'id')::uuid from phase4_fixture where key='request')),'revision isolation');
select pg_temp.expect_error($q$select public.resubmit_bespoke_request((select (val->>'id')::uuid from phase4_fixture where key='request'),'{}','response',1,gen_random_uuid())$q$,'not_found');
select pg_temp.expect_error($q$select public.transition_bespoke_request((select (val->>'id')::uuid from phase4_fixture where key='request'),'start_review',null,1,gen_random_uuid())$q$,'unauthorized');
select set_config('request.jwt.claim.sub','f4000000-0000-0000-0000-000000000004',true);
select pg_temp.expect_error($q$select public.transition_bespoke_request((select (val->>'id')::uuid from phase4_fixture where key='request'),'start_review',null,1,gen_random_uuid())$q$,'unauthorized');
select set_config('request.jwt.claim.sub','f4000000-0000-0000-0000-000000000006',true);
select pg_temp.expect_error($q$select public.convert_bespoke_request_to_order((select (val->>'id')::uuid from phase4_fixture where key='request'),1,gen_random_uuid())$q$,'unauthorized');
select set_config('request.jwt.claim.sub','f4000000-0000-0000-0000-000000000003',true);
select pg_temp.expect_error($q$select public.transition_bespoke_request((select (val->>'id')::uuid from phase4_fixture where key='request'),'approve',null,1,gen_random_uuid())$q$,'invalid_transition');
select public.transition_bespoke_request((select (val->>'id')::uuid from phase4_fixture where key='request'),'start_review',null,1,'f4200000-0000-0000-0000-000000000001');
select pg_temp.expect_error($q$select public.transition_bespoke_request((select (val->>'id')::uuid from phase4_fixture where key='request'),'approve',null,1,gen_random_uuid())$q$,'stale_version');
select pg_temp.expect_error($q$select public.transition_bespoke_request((select (val->>'id')::uuid from phase4_fixture where key='request'),'request_changes',' ',2,gen_random_uuid())$q$,'message_required');
select public.transition_bespoke_request((select (val->>'id')::uuid from phase4_fixture where key='request'),'request_changes','Please confirm fit',2,gen_random_uuid());
select public.add_commission_private_note((select (val->>'id')::uuid from phase4_fixture where key='request'),'PRIVATE TEST NOTE');
select pg_temp.assert_true((select count(*)=1 from public.commission_private_notes where note='PRIVATE TEST NOTE'),'staff can read private notes');
select set_config('request.jwt.claim.sub','f4000000-0000-0000-0000-000000000001',true);
select pg_temp.assert_true((select count(*)=0 from public.commission_private_notes),'customer cannot read private notes');
select pg_temp.expect_error($q$select public.resubmit_bespoke_request((select (val->>'id')::uuid from phase4_fixture where key='request'),'{}','',3,gen_random_uuid())$q$,'response_required');
select pg_temp.expect_error($q$select public.resubmit_bespoke_request((select (val->>'id')::uuid from phase4_fixture where key='request'),'{"style_id":"changed"}','response',3,gen_random_uuid())$q$,'invalid_field');
select public.resubmit_bespoke_request((select (val->>'id')::uuid from phase4_fixture where key='request'),'{"fit_preference":"relaxed"}','Confirmed relaxed',3,'f4300000-0000-0000-0000-000000000001');
select public.resubmit_bespoke_request((select (val->>'id')::uuid from phase4_fixture where key='request'),'{"fit_preference":"relaxed"}','Confirmed relaxed',3,'f4300000-0000-0000-0000-000000000001');
select pg_temp.assert_true((select revision=2 and lock_version=4 and request_reference=(select val->>'request_reference' from phase4_fixture where key='request') from public.bespoke_requests where id=(select (val->>'id')::uuid from phase4_fixture where key='request')),'resubmit preserves identity and advances once');
select pg_temp.assert_true((select count(*)=2 from public.bespoke_request_revisions where request_id=(select (val->>'id')::uuid from phase4_fixture where key='request')),'immutable history retained');
select pg_temp.expect_error($q$update public.bespoke_request_revisions set snapshot='{}'$q$,'permission denied');
select set_config('request.jwt.claim.sub','f4000000-0000-0000-0000-000000000003',true);
-- An old operation replay must not act again after the status returns to submitted.
select public.transition_bespoke_request((select (val->>'id')::uuid from phase4_fixture where key='request'),'start_review',null,1,'f4200000-0000-0000-0000-000000000001');
select pg_temp.assert_true((select status='submitted' from public.bespoke_requests where id=(select (val->>'id')::uuid from phase4_fixture where key='request')),'old operation cannot repeat after cycle');
select pg_temp.expect_error($q$select public.transition_bespoke_request((select (val->>'id')::uuid from phase4_fixture where key='request'),'start_review',null,4,'f4200000-0000-0000-0000-000000000001')$q$,'idempotency_conflict');
select public.transition_bespoke_request((select (val->>'id')::uuid from phase4_fixture where key='request'),'start_review',null,4,gen_random_uuid());
select public.transition_bespoke_request((select (val->>'id')::uuid from phase4_fixture where key='request'),'approve',null,5,gen_random_uuid());
insert into phase4_fixture values('order',public.convert_bespoke_request_to_order((select (val->>'id')::uuid from phase4_fixture where key='request'),6,'f4400000-0000-0000-0000-000000000001'));
select pg_temp.assert_true(public.convert_bespoke_request_to_order((select (val->>'id')::uuid from phase4_fixture where key='request'),6,'f4400000-0000-0000-0000-000000000001')->>'id'=(select val->>'id' from phase4_fixture where key='order'),'same-key conversion retry');
select pg_temp.assert_true(public.convert_bespoke_request_to_order((select (val->>'id')::uuid from phase4_fixture where key='request'),6,gen_random_uuid())->>'id'=(select val->>'id' from phase4_fixture where key='order'),'different-key conversion retry');
select pg_temp.assert_true((select val->>'total_amount' is null and val->>'source_request_revision'='2' and val#>>'{accepted_request_snapshot,fit_preference}'='relaxed' from phase4_fixture where key='order'),'unpriced accepted snapshot');
select pg_temp.assert_true((select count(*)=1 from public.lifecycle_events where entity_id=(select (val->>'id')::uuid from phase4_fixture where key='request') and event_type='request_converted_to_order'),'one conversion event');
select pg_temp.expect_error($q$select public.transition_order_status((select (val->>'id')::uuid from phase4_fixture where key='order'),'completed',null,1,gen_random_uuid())$q$,'invalid_transition');
select set_config('request.jwt.claim.sub','f4000000-0000-0000-0000-000000000005',true);
select public.transition_order_status((select (val->>'id')::uuid from phase4_fixture where key='order'),'measurements_confirmed',null,1,gen_random_uuid());
select public.transition_order_status((select (val->>'id')::uuid from phase4_fixture where key='order'),'in_production',null,2,gen_random_uuid());
select public.transition_order_status((select (val->>'id')::uuid from phase4_fixture where key='order'),'finishing',null,3,gen_random_uuid());
select public.transition_order_status((select (val->>'id')::uuid from phase4_fixture where key='order'),'ready',null,4,gen_random_uuid());
select public.transition_order_status((select (val->>'id')::uuid from phase4_fixture where key='order'),'completed',null,5,'f4500000-0000-0000-0000-000000000001');
select public.transition_order_status((select (val->>'id')::uuid from phase4_fixture where key='order'),'completed',null,5,'f4500000-0000-0000-0000-000000000001');
select pg_temp.assert_true((select count(*)=1 from public.wardrobe_items where order_id=(select (val->>'id')::uuid from phase4_fixture where key='order')),'one wardrobe item');
select pg_temp.expect_error($q$select public.transition_order_status((select (val->>'id')::uuid from phase4_fixture where key='order'),'ready',null,6,gen_random_uuid())$q$,'invalid_transition');
select set_config('request.jwt.claim.sub','f4000000-0000-0000-0000-000000000002',true);
select pg_temp.assert_true((select count(*)=0 from public.orders where id=(select (val->>'id')::uuid from phase4_fixture where key='order')),'order isolation');
select pg_temp.assert_true((select count(*)=0 from public.lifecycle_events where entity_id=(select (val->>'id')::uuid from phase4_fixture where key='request')),'event isolation');
select pg_temp.expect_error($q$select public.transition_order_status((select (val->>'id')::uuid from phase4_fixture where key='order'),'ready',null,6,gen_random_uuid())$q$,'unauthorized');
reset role;
-- Approval metadata is mandatory even for preserved confirmed legacy rows.
insert into public.bespoke_requests(id,request_reference,customer_id,status,contact_info,admin_notes)
values('f4600000-0000-0000-0000-000000000001','PHASE4-LEGACY-TEST','f4000000-0000-0000-0000-000000000001','confirmed','{}','LEGACY SECRET');
insert into public.bespoke_request_revisions(request_id,revision,snapshot,provenance)
select id,revision,to_jsonb(r)-'admin_notes'-'submission_intent','legacy_import' from public.bespoke_requests r where request_reference='PHASE4-LEGACY-TEST';
set local role authenticated;
select set_config('request.jwt.claim.sub','f4000000-0000-0000-0000-000000000003',true);
select pg_temp.expect_error($q$select public.convert_bespoke_request_to_order('f4600000-0000-0000-0000-000000000001',1,gen_random_uuid())$q$,'current_approval_required');
select public.transition_bespoke_request('f4600000-0000-0000-0000-000000000001','start_review',null,1,gen_random_uuid());
select public.transition_bespoke_request('f4600000-0000-0000-0000-000000000001','approve',null,2,gen_random_uuid());
reset role;
update public.bespoke_requests set approved_revision=2 where id='f4600000-0000-0000-0000-000000000001';
set local role authenticated;
select pg_temp.expect_error($q$select public.convert_bespoke_request_to_order('f4600000-0000-0000-0000-000000000001',3,gen_random_uuid())$q$,'current_approval_required');
select pg_temp.assert_true((select snapshot->>'admin_notes' is null from public.bespoke_request_revisions where request_id='f4600000-0000-0000-0000-000000000001'),'legacy revision omits private note');
select set_config('request.jwt.claim.sub','f4000000-0000-0000-0000-000000000001',true);
insert into phase4_fixture values('decline',public.submit_bespoke_request((select val from phase4_fixture where key='payload'),gen_random_uuid()));
select pg_temp.expect_error($q$select public.submit_bespoke_request('{"is_idea_path":true,"contact_info":{},"measurements_snapshot":{"method":"manual","unit":"inches","values":{"chest":200}}}',gen_random_uuid())$q$,'invalid_measurement');
select pg_temp.expect_error($q$select public.submit_bespoke_request('{"is_idea_path":true,"contact_info":{},"measurements_snapshot":{"method":"saved","sourceMeasurementId":"f4000000-0000-0000-0000-000000000002"}}',gen_random_uuid())$q$,'measurement_not_found');
select set_config('request.jwt.claim.sub','f4000000-0000-0000-0000-000000000003',true);
select public.transition_bespoke_request((select (val->>'id')::uuid from phase4_fixture where key='decline'),'start_review',null,1,gen_random_uuid());
select public.transition_bespoke_request((select (val->>'id')::uuid from phase4_fixture where key='decline'),'decline','Cannot fulfil this commission',2,gen_random_uuid());
select pg_temp.expect_error($q$select public.convert_bespoke_request_to_order((select (val->>'id')::uuid from phase4_fixture where key='decline'),3,gen_random_uuid())$q$,'current_approval_required');
select pg_temp.expect_error($q$select public.transition_bespoke_request((select (val->>'id')::uuid from phase4_fixture where key='decline'),'start_review',null,3,gen_random_uuid())$q$,'invalid_transition');
select set_config('request.jwt.claim.sub','f4000000-0000-0000-0000-000000000001',true);
select pg_temp.expect_error($q$select public.resubmit_bespoke_request((select (val->>'id')::uuid from phase4_fixture where key='decline'),'{}','Retry',3,gen_random_uuid())$q$,'invalid_transition');
reset role;
-- Use the seeded catalogue; all mutations below roll back.
insert into phase4_fixture
select 'catalogue_payload',jsonb_build_object('style_id',f.id,'style_name','FORGED LABEL','contact_info','{}'::jsonb,
 'fabric',jsonb_build_object('id',fab.fabric_id),'colour',jsonb_build_object('id',col.colour_id))
from public.catalogue_fits f join public.catalogue_categories cat on cat.slug=f.category_slug
join public.catalogue_fit_fabrics fab on fab.fit_id=f.id join public.catalogue_fabrics b on b.id=fab.fabric_id
join public.catalogue_fit_colours col on col.fit_id=f.id join public.catalogue_colours c on c.id=col.colour_id
where f.status='published' and cat.is_active and b.is_active and c.is_active order by f.id,fab.fabric_id,col.colour_id limit 1;
select pg_temp.assert_true(exists(select 1 from phase4_fixture where key='catalogue_payload'),'seeded published Fit available');
set local role authenticated;
select pg_temp.expect_error($q$select public.submit_bespoke_request((select val||'{"fabric":{"id":"not-a-member"}}'::jsonb from phase4_fixture where key='catalogue_payload'),gen_random_uuid())$q$,'unavailable_fabric');
insert into phase4_fixture values('catalogue_request',public.submit_bespoke_request((select val from phase4_fixture where key='catalogue_payload'),'f4700000-0000-0000-0000-000000000001'));
select pg_temp.assert_true((select val->>'style_name'<>'FORGED LABEL' and val#>>'{fabric,provenance}'='catalogue' from phase4_fixture where key='catalogue_request'),'server canonical catalogue snapshot');
reset role;
update public.catalogue_fits set status='archived',name='Archived renamed Fit' where id=(select val->>'style_id' from phase4_fixture where key='catalogue_payload');
set local role authenticated;
select pg_temp.assert_true(public.submit_bespoke_request((select val from phase4_fixture where key='catalogue_payload'),'f4700000-0000-0000-0000-000000000001')->>'style_name'=(select val->>'style_name' from phase4_fixture where key='catalogue_request'),'retry after archive keeps accepted snapshot');
select pg_temp.expect_error($q$select public.submit_bespoke_request((select val from phase4_fixture where key='catalogue_payload'),gen_random_uuid())$q$,'unavailable_fit');
reset role;
select pg_temp.assert_true((select count(*) from public.payments)=(select val::bigint from phase4_fixture where key='payments'),'no payment writes');
select pg_temp.expect_error($q$update public.bespoke_request_revisions set snapshot='{}' where request_id=(select (val->>'id')::uuid from phase4_fixture where key='request')$q$,'immutable_revision');
select * from finish();
rollback;
