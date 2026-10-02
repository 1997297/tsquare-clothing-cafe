-- Rollback-only SQL suite; test-only instructions never reach a real customer.
begin;
select no_plan();
create function pg_temp.assert_true(p_ok boolean,label text) returns text language plpgsql as $$
begin if p_ok is distinct from true then raise exception 'ASSERTION FAILED: %',label; end if; return ok(true,label); end; $$;
create function pg_temp.expect_error(command text,expected text) returns text language plpgsql as $$
declare caught text; begin
 begin execute command; exception when others then caught:=sqlerrm; end;
 if caught is null or position(expected in caught)=0 then raise exception 'Expected %, got % for %',expected,coalesce(caught,'SUCCESS'),command; end if;
 return ok(true,'Rejected with '||expected);
end; $$;
select pg_temp.assert_true((select not is_configured and bank_name='' and account_name='' and account_number='' and lock_version=1 from public.payment_bank_settings),'starts incomplete, no invented payable details');
-- CONCURRENCY FIXTURES START
insert into auth.users(id,email,raw_user_meta_data) values
 ('f5000000-0000-0000-0000-000000000001','phase5-client@example.invalid','{}'),
 ('f5000000-0000-0000-0000-000000000002','phase5-other@example.invalid','{}'),
 ('f5000000-0000-0000-0000-000000000003','phase5-admin@example.invalid','{}'),
 ('f5000000-0000-0000-0000-000000000004','phase5-inactive@example.invalid','{}'),
 ('f5000000-0000-0000-0000-000000000005','phase5-ceo@example.invalid','{}');
insert into public.staff_accounts(user_id,role,status,deactivated_at) values
 ('f5000000-0000-0000-0000-000000000003','admin','active',null),
 ('f5000000-0000-0000-0000-000000000004','admin','inactive',now()),
 ('f5000000-0000-0000-0000-000000000005','ceo','active',null);
insert into public.orders(id,order_reference,customer_id,style_id,style_code,style_name,measurements_snapshot,total_amount,total_amount_minor) values
 ('f5200000-0000-0000-0000-000000000001','PHASE5-TEST-1','f5000000-0000-0000-0000-000000000001','test','test','Test','{}',500,50000),
 ('f5200000-0000-0000-0000-000000000002','PHASE5-TEST-2','f5000000-0000-0000-0000-000000000001','test','test','Test','{}',100,10000);
insert into public.orders(id,order_reference,customer_id,style_id,style_code,style_name,measurements_snapshot)
 values('f5200000-0000-0000-0000-000000000003','PHASE5-UNPRICED','f5000000-0000-0000-0000-000000000001','test','test','Test','{}');
insert into public.payment_requests(id,order_id,customer_id,requested_amount_minor,purpose,bank_snapshot,created_by) values
 ('f5300000-0000-0000-0000-000000000001','f5200000-0000-0000-0000-000000000001','f5000000-0000-0000-0000-000000000001',20000,'deposit','{"test_only":true}','f5000000-0000-0000-0000-000000000003');
insert into storage.objects(bucket_id,name,metadata) values
 ('payment-receipts','f5000000-0000-0000-0000-000000000001/f5300000-0000-0000-0000-000000000001/f5400000-0000-0000-0000-000000000001.png','{"size":100,"mimetype":"image/png"}');
insert into public.payment_receipts(id,request_id,customer_id,storage_path,mime_type,size_bytes,sha256) values
 ('f5500000-0000-0000-0000-000000000001','f5300000-0000-0000-0000-000000000001','f5000000-0000-0000-0000-000000000001',
 'f5000000-0000-0000-0000-000000000001/f5300000-0000-0000-0000-000000000001/f5400000-0000-0000-0000-000000000001.png','image/png',100,repeat('a',64));
insert into public.payment_submissions(id,request_id,order_id,customer_id,reported_amount_minor,transfer_date,transaction_reference,receipt_id) values
 ('f5600000-0000-0000-0000-000000000001','f5300000-0000-0000-0000-000000000001','f5200000-0000-0000-0000-000000000001','f5000000-0000-0000-0000-000000000001',20000,current_date,'PHASE5-TRANSFER-1','f5500000-0000-0000-0000-000000000001');
set role authenticated;
select set_config('request.jwt.claim.sub','f5000000-0000-0000-0000-000000000005',false);
select public.set_payment_bank_details('LOCAL TEST BANK','DISPOSABLE SQL TEST ONLY','8675309123','Not payable; isolated test fixture only',1,'f5800000-0000-0000-0000-000000000001');
reset role;
-- CONCURRENCY FIXTURES END
create temporary table phase5_fixture(key text primary key,val jsonb);
grant all on phase5_fixture to authenticated,service_role;
create function pg_temp.order_version() returns bigint language sql as $$ select lock_version from public.orders where id='f5200000-0000-0000-0000-000000000001' $$;
create function pg_temp.fixture_id(k text) returns uuid language sql as $$ select (val->>'id')::uuid from phase5_fixture where key=k $$;
select pg_temp.assert_true(not has_function_privilege('authenticated','public.register_payment_receipt(uuid,uuid,text,text,integer,text)','execute'),'browser registration denied');
select pg_temp.assert_true(has_function_privilege('service_role','public.register_payment_receipt(uuid,uuid,text,text,integer,text)','execute'),'service registration allowed');
select pg_temp.assert_true(not has_function_privilege('service_role','public.record_verified_payment(uuid,bigint,text,text,text,text,timestamptz,jsonb)','execute'),'legacy bypass retired');
select pg_temp.assert_true((select not public and file_size_limit=3145728 and cardinality(allowed_mime_types)=4 from storage.buckets where id='payment-receipts'),'private bucket, four types, 3MB');
select pg_temp.assert_true((select bool_and(relrowsecurity) from pg_class where oid in ('public.payment_bank_settings'::regclass,'public.payment_requests'::regclass,'public.payment_receipts'::regclass,'public.payment_submissions'::regclass,'public.payments'::regclass)),'RLS enabled');
update public.payment_bank_settings set is_configured=false;
set local role authenticated;
select set_config('request.jwt.claim.sub','f5000000-0000-0000-0000-000000000003',true);
select pg_temp.expect_error($q$select public.issue_payment_request('f5200000-0000-0000-0000-000000000002',100,'deposit',null,null,1,gen_random_uuid())$q$,'bank_not_configured');
reset role;
update public.payment_bank_settings set is_configured=true;
set local role authenticated;
select pg_temp.expect_error($q$select public.issue_payment_request('f5200000-0000-0000-0000-000000000003',100,'deposit',null,null,1,gen_random_uuid())$q$,'price_required');
select pg_temp.assert_true(public.get_order_financials('f5200000-0000-0000-0000-000000000003') @> '{"total_minor":null,"balance_minor":null,"requestable_minor":null,"fully_paid":false}','unpriced summary remains unknown');
select pg_temp.expect_error($q$select public.set_payment_bank_details('LOCAL TEST BANK','DISPOSABLE TEST','8675309123','',2,gen_random_uuid())$q$,'unauthorized');
select pg_temp.expect_error($q$select public.issue_payment_request('f5200000-0000-0000-0000-000000000001',30001,'installment',null,null,1,gen_random_uuid())$q$,'exceeds_requestable');
select pg_temp.expect_error($q$select public.set_order_agreed_total('f5200000-0000-0000-0000-000000000001',19999,'reduce',1,gen_random_uuid())$q$,'price_below_commitments');
select pg_temp.expect_error($q$select public.set_order_agreed_total('f5200000-0000-0000-0000-000000000001',9999999999999,'large',1,gen_random_uuid())$q$,'invalid_amount');
select pg_temp.expect_error($q$select public.set_order_agreed_total('f5200000-0000-0000-0000-000000000001',50000,'reason',0,gen_random_uuid())$q$,'stale_version');
select pg_temp.expect_error($q$select public.cancel_payment_request('f5300000-0000-0000-0000-000000000001','cancel',1,gen_random_uuid())$q$,'request_has_funds_or_pending');
select pg_temp.assert_true(public.get_order_financials('f5200000-0000-0000-0000-000000000001')->>'verified_minor'='0' and public.get_order_financials('f5200000-0000-0000-0000-000000000001')->>'balance_minor'='50000','pending never counts as verified');
select pg_temp.assert_true(public.get_order_financials('f5200000-0000-0000-0000-000000000001')->>'pending_minor'='20000','reported pending shown separately');
select pg_temp.expect_error($q$select public.review_payment_submission('f5600000-0000-0000-0000-000000000001','verify',20001,null,gen_random_uuid())$q$,'verification_exceeds_balance');
insert into phase5_fixture values('verified',public.review_payment_submission('f5600000-0000-0000-0000-000000000001','verify',15000,null,'f5900000-0000-0000-0000-000000000001'));
select pg_temp.assert_true(public.review_payment_submission('f5600000-0000-0000-0000-000000000001','verify',15000,null,'f5900000-0000-0000-0000-000000000001')=(select val from phase5_fixture where key='verified'),'same-key exact result replay');
select pg_temp.expect_error($q$select public.review_payment_submission('f5600000-0000-0000-0000-000000000001','verify',15001,null,'f5900000-0000-0000-0000-000000000001')$q$,'idempotency_conflict');
select pg_temp.expect_error($q$select public.review_payment_submission('f5600000-0000-0000-0000-000000000001','verify',15000,null,gen_random_uuid())$q$,'submission_already_reviewed');
select pg_temp.assert_true(public.get_order_financials('f5200000-0000-0000-0000-000000000001')->>'reserved_minor'='5000','200 requested, 150 verified, 50 remains reserved');
select pg_temp.assert_true(public.get_order_financials('f5200000-0000-0000-0000-000000000001')->>'verified_minor'='15000' and public.get_order_financials('f5200000-0000-0000-0000-000000000001')->>'balance_minor'='35000','recognized amount differs from reported');
select pg_temp.expect_error($q$select public.cancel_payment_request('f5300000-0000-0000-0000-000000000001','cancel',1,gen_random_uuid())$q$,'request_has_funds_or_pending');
insert into phase5_fixture values('cancel',public.issue_payment_request('f5200000-0000-0000-0000-000000000001',1000,'adjustment','cancel test',null,pg_temp.order_version(),gen_random_uuid()));
select pg_temp.expect_error($q$select public.cancel_payment_request(pg_temp.fixture_id('cancel'),'reason',0,gen_random_uuid())$q$,'stale_version');
select public.cancel_payment_request(pg_temp.fixture_id('cancel'),'not required',1,gen_random_uuid());
select pg_temp.assert_true(public.get_order_financials('f5200000-0000-0000-0000-000000000001')->>'requestable_minor'='30000','cancel releases reservation');
select pg_temp.expect_error($q$update public.payment_requests set requested_amount_minor=1$q$,'permission denied');
select pg_temp.expect_error($q$update public.payments set amount_minor=1$q$,'permission denied');
select pg_temp.expect_error($q$delete from public.payment_receipts$q$,'permission denied');
select pg_temp.expect_error($q$insert into public.payment_submissions default values$q$,'permission denied');
select set_config('request.jwt.claim.sub','f5000000-0000-0000-0000-000000000005',true);
select pg_temp.expect_error($q$select public.set_payment_bank_details('Placeholder','Your Account','0000000000','',2,gen_random_uuid())$q$,'invalid_bank_details');
select pg_temp.expect_error($q$select public.set_payment_bank_details('LOCAL TEST BANK','DISPOSABLE TEST','8675309123','',1,gen_random_uuid())$q$,'stale_version');
select public.set_payment_bank_details('LOCAL TEST BANK TWO','DISPOSABLE SQL TEST ONLY','8675309124','test only',2,gen_random_uuid());
insert into phase5_fixture values('installment',public.issue_payment_request('f5200000-0000-0000-0000-000000000001',15000,'installment','test',null,pg_temp.order_version(),gen_random_uuid()));
select pg_temp.assert_true((select val->'bank_snapshot'->>'account_number'='8675309124' and val->>'request_reference' ~ '^TCC-PAY-[0-9]{6,}$' from phase5_fixture where key='installment'),'new request snapshots latest instructions and readable reference');
insert into phase5_fixture values('snapshot-copy',(select bank_snapshot from public.payment_requests where id=pg_temp.fixture_id('installment')));
select public.set_payment_bank_details('LOCAL TEST BANK THREE','DISPOSABLE SQL TEST ONLY','8675309125','test only',3,gen_random_uuid());
select pg_temp.assert_true((select bank_snapshot=(select val from phase5_fixture where key='snapshot-copy') from public.payment_requests where id=pg_temp.fixture_id('installment')),'bank edits preserve existing instruction snapshot');
select set_config('request.jwt.claim.sub','f5000000-0000-0000-0000-000000000004',true);
select pg_temp.expect_error($q$select public.set_order_agreed_total('f5200000-0000-0000-0000-000000000001',50000,'test',1,gen_random_uuid())$q$,'unauthorized');
select pg_temp.expect_error($q$select public.review_payment_submission('f5600000-0000-0000-0000-000000000001','verify',100,null,gen_random_uuid())$q$,'unauthorized');
select set_config('request.jwt.claim.sub','f5000000-0000-0000-0000-000000000002',true);
select pg_temp.assert_true((select count(*)=0 from public.payment_requests),'unrelated client request isolation');
select pg_temp.assert_true((select count(*)=0 from public.payment_submissions),'unrelated client submission isolation');
select pg_temp.assert_true((select count(*)=0 from public.payment_receipts),'unrelated client receipt isolation');
select pg_temp.assert_true((select count(*)=0 from storage.objects where bucket_id='payment-receipts'),'unrelated storage isolation');
select pg_temp.expect_error($q$select public.get_order_financials('f5200000-0000-0000-0000-000000000001')$q$,'not_found');
select pg_temp.expect_error($q$select public.submit_payment_evidence('f5300000-0000-0000-0000-000000000001',100,current_date,'X','f5500000-0000-0000-0000-000000000001',null,gen_random_uuid())$q$,'not_found');
select set_config('request.jwt.claim.sub','f5000000-0000-0000-0000-000000000001',true);
select pg_temp.assert_true((select count(*)=0 from public.payment_bank_settings),'client cannot read global bank config');
select pg_temp.assert_true((select count(*)=0 from public.lifecycle_events where event_type='payment_bank_updated'),'bank history staff-only');
select pg_temp.assert_true((select count(*)=1 from storage.objects where bucket_id='payment-receipts'),'owner registered storage read');
select pg_temp.assert_true((select count(*)=1 from public.payments where order_id='f5200000-0000-0000-0000-000000000001'),'owner ledger read');
select pg_temp.expect_error($q$select public.set_order_agreed_total('f5200000-0000-0000-0000-000000000001',50000,'test',1,gen_random_uuid())$q$,'unauthorized');
select pg_temp.expect_error($q$select public.issue_payment_request('f5200000-0000-0000-0000-000000000001',100,'deposit',null,null,1,gen_random_uuid())$q$,'unauthorized');
select pg_temp.expect_error($q$select public.review_payment_submission('f5600000-0000-0000-0000-000000000001','verify',100,null,gen_random_uuid())$q$,'unauthorized');
select pg_temp.expect_error($q$insert into storage.objects(bucket_id,name) values('payment-receipts','forged.png')$q$,'row-level security');
with deleted as (delete from storage.objects where bucket_id='payment-receipts' returning id)
select pg_temp.assert_true((select count(*)=0 from deleted),'browser receipt deletion denied');
reset role;
select pg_temp.expect_error($q$update public.payments set amount_minor=1 where submission_id='f5600000-0000-0000-0000-000000000001'$q$,'immutable_verified_payment');
select pg_temp.expect_error($q$delete from public.payments where submission_id='f5600000-0000-0000-0000-000000000001'$q$,'immutable_verified_payment');
select pg_temp.expect_error($q$update public.payment_requests set bank_snapshot='{}' where id='f5300000-0000-0000-0000-000000000001'$q$,'immutable_payment_request');
select pg_temp.expect_error($q$update public.payment_submissions set reported_amount_minor=1 where id='f5600000-0000-0000-0000-000000000001'$q$,'immutable_payment_submission');
select pg_temp.expect_error($q$delete from storage.objects where bucket_id='payment-receipts'$q$,'immutable_registered_receipt');
-- Fresh receipts for partial remainder, rejection/correction, instalment and final.
create function pg_temp.make_receipt(k text,request uuid,ext text default 'png',mime text default 'image/png') returns void language plpgsql as $$
declare path text; result jsonb; begin
 path:='f5000000-0000-0000-0000-000000000001/'||request::text||'/'||gen_random_uuid()::text||'.'||ext;
 insert into storage.objects(bucket_id,name,metadata) values('payment-receipts',path,jsonb_build_object('size',100,'mimetype',mime));
 result:=public.register_payment_receipt('f5000000-0000-0000-0000-000000000001',request,path,mime,100,repeat('a',64));
 insert into phase5_fixture values(k,result);
end; $$;
select pg_temp.make_receipt('partial-receipt','f5300000-0000-0000-0000-000000000001');
select pg_temp.make_receipt('bad-receipt',pg_temp.fixture_id('installment'),'pdf','application/pdf');
select pg_temp.make_receipt('corrected-receipt',pg_temp.fixture_id('installment'),'webp','image/webp');
select pg_temp.assert_true(public.register_payment_receipt('f5000000-0000-0000-0000-000000000001','f5300000-0000-0000-0000-000000000001',(select val->>'storage_path' from phase5_fixture where key='partial-receipt'),'image/png',100,repeat('a',64))=(select val from phase5_fixture where key='partial-receipt'),'receipt registration exact replay');
select pg_temp.expect_error($q$select public.register_payment_receipt('f5000000-0000-0000-0000-000000000001','f5300000-0000-0000-0000-000000000001',(select val->>'storage_path' from phase5_fixture where key='partial-receipt'),'image/png',101,repeat('a',64))$q$,'receipt_conflict');
select pg_temp.expect_error($q$select public.register_payment_receipt('f5000000-0000-0000-0000-000000000002','f5300000-0000-0000-0000-000000000001','bad','image/png',100,repeat('a',64))$q$,'not_found');
select pg_temp.expect_error($q$select public.register_payment_receipt('f5000000-0000-0000-0000-000000000001','f5300000-0000-0000-0000-000000000001','../bad.png','image/png',100,repeat('a',64))$q$,'invalid_receipt_path');
select pg_temp.expect_error($q$select public.register_payment_receipt('f5000000-0000-0000-0000-000000000001','f5300000-0000-0000-0000-000000000001',(select val->>'storage_path' from phase5_fixture where key='partial-receipt'),'application/pdf',100,repeat('a',64))$q$,'invalid_receipt_metadata');
select pg_temp.expect_error($q$select public.register_payment_receipt('f5000000-0000-0000-0000-000000000001','f5300000-0000-0000-0000-000000000001',(select val->>'storage_path' from phase5_fixture where key='partial-receipt'),'image/png',3145729,repeat('a',64))$q$,'invalid_receipt_metadata');
set local role authenticated;
select set_config('request.jwt.claim.sub','f5000000-0000-0000-0000-000000000001',true);
select pg_temp.expect_error($q$select public.submit_payment_evidence('f5300000-0000-0000-0000-000000000001',5001,current_date,'NEW',pg_temp.fixture_id('partial-receipt'),null,gen_random_uuid())$q$,'exceeds_request_remaining');
select pg_temp.expect_error($q$select public.submit_payment_evidence('f5300000-0000-0000-0000-000000000001',5000,current_date,'phase5-transfer-1',pg_temp.fixture_id('partial-receipt'),null,gen_random_uuid())$q$,'duplicate_transaction_reference');
insert into phase5_fixture values('partial',public.submit_payment_evidence('f5300000-0000-0000-0000-000000000001',5000,current_date,'PHASE5-PARTIAL',pg_temp.fixture_id('partial-receipt'),null,'f5900000-0000-0000-0000-000000000002'));
select pg_temp.assert_true(public.submit_payment_evidence('f5300000-0000-0000-0000-000000000001',5000,current_date,'PHASE5-PARTIAL',pg_temp.fixture_id('partial-receipt'),null,'f5900000-0000-0000-0000-000000000002')=(select val from phase5_fixture where key='partial'),'submit exact replay');
select pg_temp.expect_error($q$select public.submit_payment_evidence('f5300000-0000-0000-0000-000000000001',1,current_date,'NEW',pg_temp.fixture_id('partial-receipt'),null,gen_random_uuid())$q$,'pending_submission_exists');
insert into phase5_fixture values('bad',public.submit_payment_evidence(pg_temp.fixture_id('installment'),15000,current_date,'PHASE5-CORRECTABLE',pg_temp.fixture_id('bad-receipt'),null,gen_random_uuid()));
select set_config('request.jwt.claim.sub','f5000000-0000-0000-0000-000000000003',true);
select pg_temp.expect_error($q$select public.review_payment_submission(pg_temp.fixture_id('bad'),'reject',null,' ',gen_random_uuid())$q$,'invalid_text');
select public.review_payment_submission(pg_temp.fixture_id('bad'),'reject',null,'Receipt unclear',gen_random_uuid());
select pg_temp.assert_true(public.get_order_financials('f5200000-0000-0000-0000-000000000001')->>'verified_minor'='15000','rejection adds no verified money');
select public.review_payment_submission(pg_temp.fixture_id('partial'),'verify',5000,null,gen_random_uuid());
select set_config('request.jwt.claim.sub','f5000000-0000-0000-0000-000000000001',true);
insert into phase5_fixture values('corrected',public.submit_payment_evidence(pg_temp.fixture_id('installment'),15000,current_date,'PHASE5-CORRECTABLE',pg_temp.fixture_id('corrected-receipt'),'Clear correction',gen_random_uuid()));
select set_config('request.jwt.claim.sub','f5000000-0000-0000-0000-000000000003',true);
select public.review_payment_submission(pg_temp.fixture_id('corrected'),'verify',15000,null,gen_random_uuid());
select pg_temp.assert_true((select status='rejected' and rejection_reason='Receipt unclear' from public.payment_submissions where id=pg_temp.fixture_id('bad')),'rejected history retained after correction');
select pg_temp.assert_true(public.get_order_financials('f5200000-0000-0000-0000-000000000001')->>'verified_minor'='35000','deposit + partial + instalment aggregate');
select pg_temp.expect_error($q$select public.set_order_agreed_total('f5200000-0000-0000-0000-000000000001',34999,'reduce',pg_temp.order_version(),gen_random_uuid())$q$,'price_below_commitments');
insert into phase5_fixture values('final',public.issue_payment_request('f5200000-0000-0000-0000-000000000001',15000,'final_payment','final',null,pg_temp.order_version(),gen_random_uuid()));
reset role;
select pg_temp.make_receipt('final-receipt',pg_temp.fixture_id('final'),'jpg','image/jpeg');
set local role authenticated;
select set_config('request.jwt.claim.sub','f5000000-0000-0000-0000-000000000001',true);
insert into phase5_fixture values('final-submission',public.submit_payment_evidence(pg_temp.fixture_id('final'),15000,current_date,'PHASE5-FINAL',pg_temp.fixture_id('final-receipt'),null,gen_random_uuid()));
select pg_temp.assert_true(public.get_order_financials('f5200000-0000-0000-0000-000000000001')->>'fully_paid'='false','final pending cannot mark fully paid');
select set_config('request.jwt.claim.sub','f5000000-0000-0000-0000-000000000003',true);
select public.review_payment_submission(pg_temp.fixture_id('final-submission'),'verify',15000,null,gen_random_uuid());
select pg_temp.assert_true(public.get_order_financials('f5200000-0000-0000-0000-000000000001') @> '{"verified_minor":50000,"pending_minor":0,"balance_minor":0,"reserved_minor":0,"requestable_minor":0,"fully_paid":true}','final verified makes fully paid exactly');
select pg_temp.expect_error($q$select public.issue_payment_request('f5200000-0000-0000-0000-000000000001',1,'adjustment',null,null,pg_temp.order_version(),gen_random_uuid())$q$,'exceeds_requestable');
select pg_temp.assert_true((select count(*)=4 and sum(amount_minor)=50000 and bool_and(verified_by is not null and verified_at is not null) from public.payments where order_id='f5200000-0000-0000-0000-000000000001'),'four immutable ledger records with provenance');
select pg_temp.assert_true((select count(*)>0 from public.lifecycle_events where entity_id='f5200000-0000-0000-0000-000000000001' and event_type='payment_verified'),'financial audit history');
reset role;
set local role anon;
select set_config('request.jwt.claim.sub','',true);
select pg_temp.expect_error($q$select * from public.payment_requests$q$,'permission denied');
select pg_temp.expect_error($q$select public.get_order_financials('f5200000-0000-0000-0000-000000000001')$q$,'permission denied');
select pg_temp.assert_true((select count(*)=0 from storage.objects where bucket_id='payment-receipts'),'anonymous receipt isolation');
reset role;
select * from finish();
rollback;
