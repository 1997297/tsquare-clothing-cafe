-- Synthetic transaction only. Native assertion adapter or pgTAP required.
begin;
select no_plan();
create function pg_temp.people_error(command text,expected text) returns text language plpgsql as $$ declare caught text; begin
  begin execute command; exception when others then caught:=sqlerrm; end;
  if caught is null or strpos(caught,expected)=0 then raise exception 'Expected %, got %',expected,coalesce(caught,'SUCCESS'); end if;
  return ok(true,'Rejected with '||expected);
end $$;
insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values
 ('f7000000-0000-4000-8000-000000000001','phase7-client@example.invalid',now(),'{"first_name":"Phase7","last_name":"Client","role":"ceo"}'),
 ('f7000000-0000-4000-8000-000000000002','phase7-other@example.invalid',now(),'{}'),
 ('f7000000-0000-4000-8000-000000000003','phase7-admin@example.invalid',now(),'{}'),
 ('f7000000-0000-4000-8000-000000000004','phase7-ceo@example.invalid',now(),'{}'),
 ('f7000000-0000-4000-8000-000000000005','phase7-candidate@example.invalid',now(),'{}'),
 ('f7000000-0000-4000-8000-000000000006','phase7-unverified@example.invalid',null,'{}');
insert into public.staff_accounts(user_id,role,status) values
 ('f7000000-0000-4000-8000-000000000003','admin','active'),
 ('f7000000-0000-4000-8000-000000000004','ceo','active');
insert into public.bespoke_requests(id,request_reference,customer_id,contact_info) values
 ('f7100000-0000-4000-8000-000000000001','PHASE7-CLIENT-REQUEST','f7000000-0000-4000-8000-000000000001','{}');
insert into public.orders(id,order_reference,customer_id,style_id,style_code,style_name,measurements_snapshot)
 values('f7200000-0000-4000-8000-000000000001','PHASE7-CLIENT-ORDER','f7000000-0000-4000-8000-000000000001','test','test','Client order','{}');

select ok((select count(*)=5 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in
 ('get_staff_clients','get_ceo_staff','find_admin_candidate','manage_admin_staff','get_staff_management_history')
 and p.prosecdef and p.proconfig=array['search_path=""'] and has_function_privilege('authenticated',p.oid,'execute')
 and not has_function_privilege('anon',p.oid,'execute') and not has_function_privilege('service_role',p.oid,'execute')),'five guarded pinned RPCs have minimal grants');
select ok((select relrowsecurity from pg_class where oid='private.staff_management_events'::regclass),'private staff audit has RLS');
select ok(not has_table_privilege('authenticated','public.staff_accounts','insert') and not has_table_privilege('authenticated','public.staff_accounts','update') and not has_table_privilege('authenticated','public.staff_accounts','delete'),'no direct membership DML');
select ok(not has_table_privilege('authenticated','private.staff_management_events','select'),'audit table not exposed');
set local role anon;
select pg_temp.people_error($q$select public.get_staff_clients()$q$,'permission denied');
select pg_temp.people_error($q$select public.get_ceo_staff()$q$,'permission denied');
set local role authenticated;
select set_config('request.jwt.claim.sub','f7000000-0000-4000-8000-000000000001',true);
select pg_temp.people_error($q$select public.get_staff_clients()$q$,'unauthorized');
select pg_temp.people_error($q$select public.get_ceo_staff()$q$,'unauthorized');
select pg_temp.people_error($q$select public.find_admin_candidate('phase7-candidate@example.invalid')$q$,'unauthorized');
select pg_temp.people_error($q$select public.manage_admin_staff('f7000000-0000-4000-8000-000000000001','phase7-client@example.invalid','add_admin',0,gen_random_uuid())$q$,'unauthorized');
select pg_temp.people_error($q$update public.staff_accounts set role='ceo'$q$,'permission denied');
select ok((select count(*)=1 from public.profiles where id in ('f7000000-0000-4000-8000-000000000001','f7000000-0000-4000-8000-000000000002')),'client profiles retain owner isolation');
select set_config('request.jwt.claim.sub','f7000000-0000-4000-8000-000000000003',true);
select ok(jsonb_array_length(public.get_staff_clients('phase7-')->'clients')=4,'directory excludes all staff identities');
select ok((public.get_staff_clients('phase7-client')->'clients'->0->>'request_count')::int=1,'request count derives from real rows');
select ok((public.get_staff_clients('phase7-client')->'clients'->0->>'order_count')::int=1,'order count derives from real rows');
select ok(jsonb_array_length(public.get_staff_clients('phase7-','active_orders')->'clients')=1,'active order filter');
select ok(jsonb_array_length(public.get_staff_clients('phase7-','pending_requests')->'clients')=1,'pending request filter');
select ok(jsonb_array_length(public.get_staff_clients('%')->'clients')=0,'search uses literal substrings not wildcard injection');
select ok(jsonb_array_length(public.get_staff_clients('phase7-','all',1)->'clients')=0,'bounded second page');
select ok(jsonb_array_length(public.get_staff_clients('','all',0,'f7000000-0000-4000-8000-000000000004')->'clients')=0,'CEO is not a client dossier');
select pg_temp.people_error($q$select public.get_staff_clients('',null)$q$,'invalid_input');
select pg_temp.people_error($q$select public.get_ceo_staff()$q$,'unauthorized');
select pg_temp.people_error($q$select public.find_admin_candidate('phase7-candidate@example.invalid')$q$,'unauthorized');
select pg_temp.people_error($q$select public.manage_admin_staff('f7000000-0000-4000-8000-000000000005','phase7-candidate@example.invalid','add_admin',0,gen_random_uuid())$q$,'unauthorized');
select pg_temp.people_error($q$select public.get_staff_management_history('f7000000-0000-4000-8000-000000000003')$q$,'unauthorized');
select set_config('request.jwt.claim.sub','f7000000-0000-4000-8000-000000000004',true);
select ok(public.find_admin_candidate(' PHASE7-CANDIDATE@example.invalid ')->>'id'='f7000000-0000-4000-8000-000000000005','exact verified case-insensitive identity');
select ok(public.find_admin_candidate('phase7-unverified@example.invalid') is null,'unverified lookup denied');
select ok(public.find_admin_candidate('unknown@example.invalid') is null,'unknown identity safe result');
select ok(public.find_admin_candidate('phase7-admin@example.invalid')->>'existing_staff'='true','existing email collision identified');
select ok(not (public.find_admin_candidate('phase7-candidate@example.invalid') ? 'raw_user_meta_data'),'no raw auth metadata');
select pg_temp.people_error($q$select public.manage_admin_staff('f7000000-0000-4000-8000-000000000005','wrong@example.invalid','add_admin',0,gen_random_uuid())$q$,'verified_account_required');
select pg_temp.people_error($q$select public.manage_admin_staff('f7000000-0000-4000-8000-000000000006','phase7-unverified@example.invalid','add_admin',0,gen_random_uuid())$q$,'verified_account_required');
select pg_temp.people_error($q$select public.manage_admin_staff('f7000000-0000-4000-8000-000000000001','phase7-client@example.invalid','add_admin',0,gen_random_uuid())$q$,'client_history_present');
select pg_temp.people_error($q$select public.manage_admin_staff('f7000000-0000-4000-8000-000000000004','phase7-ceo@example.invalid','deactivate_admin',1,gen_random_uuid())$q$,'invalid_input');
select pg_temp.people_error($q$select public.manage_admin_staff('f7000000-0000-4000-8000-000000000005','phase7-candidate@example.invalid','ceo',0,gen_random_uuid())$q$,'invalid_input');
select ok(public.manage_admin_staff('f7000000-0000-4000-8000-000000000005','phase7-candidate@example.invalid','add_admin',0,'f7800000-0000-4000-8000-000000000001')='f7000000-0000-4000-8000-000000000005','CEO provisions active Admin');
select ok(public.manage_admin_staff('f7000000-0000-4000-8000-000000000005','phase7-candidate@example.invalid','add_admin',0,'f7800000-0000-4000-8000-000000000001')='f7000000-0000-4000-8000-000000000005','exact add retry safe');
select ok((select role='admin' and status='active' and lock_version=1 and invited_by=auth.uid() from public.staff_accounts where user_id='f7000000-0000-4000-8000-000000000005'),'trusted membership fields');
select pg_temp.people_error($q$select public.manage_admin_staff('f7000000-0000-4000-8000-000000000005','phase7-candidate@example.invalid','add_admin',0,gen_random_uuid())$q$,'already_staff');
select pg_temp.people_error($q$select public.manage_admin_staff('f7000000-0000-4000-8000-000000000005','phase7-candidate@example.invalid','deactivate_admin',1,'f7800000-0000-4000-8000-000000000001')$q$,'idempotency_conflict');
select pg_temp.people_error($q$select public.manage_admin_staff('f7000000-0000-4000-8000-000000000005','phase7-candidate@example.invalid','deactivate_admin',2,gen_random_uuid())$q$,'stale_version');
select public.manage_admin_staff('f7000000-0000-4000-8000-000000000005','phase7-candidate@example.invalid','deactivate_admin',1,'f7800000-0000-4000-8000-000000000002');
select ok((select status='inactive' and lock_version=2 and deactivated_at is not null from public.staff_accounts where user_id='f7000000-0000-4000-8000-000000000005'),'deactivate retains membership and timestamp');
select set_config('request.jwt.claim.sub','f7000000-0000-4000-8000-000000000005',true);
select pg_temp.people_error($q$select public.get_staff_clients()$q$,'unauthorized');
select pg_temp.people_error($q$select public.get_atelier_service_counts()$q$,'unauthorized');
select ok((select count(*)=0 from public.orders where id='f7200000-0000-4000-8000-000000000001'),'inactive staff denied other client RLS');
select set_config('request.jwt.claim.sub','f7000000-0000-4000-8000-000000000004',true);
select public.manage_admin_staff('f7000000-0000-4000-8000-000000000005','phase7-candidate@example.invalid','activate_admin',2,'f7800000-0000-4000-8000-000000000003');
select ok((select status='active' and lock_version=3 and deactivated_at is null from public.staff_accounts where user_id='f7000000-0000-4000-8000-000000000005'),'reactivation keeps original attribution');
select public.manage_admin_staff('f7000000-0000-4000-8000-000000000005','phase7-candidate@example.invalid','deactivate_admin',1,'f7800000-0000-4000-8000-000000000002');
select ok((select status='active' and lock_version=3 from public.staff_accounts where user_id='f7000000-0000-4000-8000-000000000005'),'old exact retry does not undo newer activation');
select ok((public.get_staff_management_history('f7000000-0000-4000-8000-000000000005')->>'total')::int=3,'one private event per successful unique operation');
select ok((public.get_ceo_staff()->>'total')::int>=3,'CEO directory real memberships');
reset role;
select pg_temp.people_error($q$update private.staff_management_events set action='activate_admin'$q$,'immutable_revision');
select pg_temp.people_error($q$delete from private.staff_management_events$q$,'immutable_revision');
-- Native baseline contains no other CEO; reject trusted deletion/update too.
select ok((select count(*)=1 from public.staff_accounts where role='ceo' and status='active'),'single active CEO test precondition');
select pg_temp.people_error($q$update public.staff_accounts set status='inactive',deactivated_at=now() where user_id='f7000000-0000-4000-8000-000000000004'$q$,'last_active_ceo_required');
select pg_temp.people_error($q$delete from public.staff_accounts where user_id='f7000000-0000-4000-8000-000000000004'$q$,'last_active_ceo_required');
select pg_temp.people_error($q$update public.staff_accounts set role='admin' where user_id='f7000000-0000-4000-8000-000000000004'$q$,'last_active_ceo_required');
select ok((select count(*)=1 from public.orders where id='f7200000-0000-4000-8000-000000000001'),'client history preserved');
select * from finish();
rollback;
