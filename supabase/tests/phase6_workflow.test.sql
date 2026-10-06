begin;
select no_plan();
create function pg_temp.expect_error(command text,expected text) returns text language plpgsql as $$ declare caught text; begin
 begin execute command; exception when others then caught:=sqlerrm; end;
 if caught is null or position(expected in caught)=0 then raise exception 'Expected %, got % for %',expected,coalesce(caught,'SUCCESS'),command; end if;
 return ok(true,'Rejected with '||expected); end $$;
create temporary table phase6_fixture(key text primary key,val jsonb);
grant all on phase6_fixture to authenticated,service_role;
create function pg_temp.ap(k text) returns uuid language sql as $$ select (val->'appointment'->>'id')::uuid from phase6_fixture where key=k $$;
create function pg_temp.co(k text) returns uuid language sql as $$ select (val->'conversation'->>'id')::uuid from phase6_fixture where key=k $$;
create function pg_temp.av(k text) returns bigint language sql as $$ select lock_version from public.appointments where id=pg_temp.ap(k) $$;
create function pg_temp.cv(k text) returns bigint language sql as $$ select lock_version from public.concierge_requests where id=pg_temp.co(k) $$;
insert into auth.users(id,email,raw_user_meta_data) values
 ('f6000000-0000-0000-0000-000000000001','phase6-client@example.invalid','{}'),
 ('f6000000-0000-0000-0000-000000000002','phase6-other@example.invalid','{"role":"ceo"}'),
 ('f6000000-0000-0000-0000-000000000003','phase6-admin@example.invalid','{}'),
 ('f6000000-0000-0000-0000-000000000004','phase6-inactive@example.invalid','{}'),
 ('f6000000-0000-0000-0000-000000000005','phase6-ceo@example.invalid','{}');
insert into public.staff_accounts(user_id,role,status,deactivated_at) values
 ('f6000000-0000-0000-0000-000000000003','admin','active',null),
 ('f6000000-0000-0000-0000-000000000004','admin','inactive',now()),
 ('f6000000-0000-0000-0000-000000000005','ceo','active',null);
insert into public.orders(id,order_reference,customer_id,style_id,style_code,style_name,measurements_snapshot,total_amount_minor,total_amount)
 values('f6200000-0000-0000-0000-000000000001','PHASE6-OTHER-ORDER','f6000000-0000-0000-0000-000000000002','test','test','Other order','{}',10000,100);
insert into phase6_fixture values('financial_before',(select to_jsonb(o) from public.orders o where id='f6200000-0000-0000-0000-000000000001'));
insert into public.bespoke_requests(id,request_reference,customer_id,contact_info) values
 ('f6210000-0000-0000-0000-000000000001','PHASE6-OWNED-REQ1','f6000000-0000-0000-0000-000000000001','{}'),
 ('f6210000-0000-0000-0000-000000000002','PHASE6-OWNED-REQ2','f6000000-0000-0000-0000-000000000001','{}');
insert into public.orders(id,order_reference,customer_id,bespoke_request_id,style_id,style_code,style_name,measurements_snapshot)
 values('f6200000-0000-0000-0000-000000000002','PHASE6-OWNED-ORDER','f6000000-0000-0000-0000-000000000001','f6210000-0000-0000-0000-000000000001','test','test','Owned order','{}');
select ok((select bool_and(to_regprocedure(signature) is not null) from unnest(array[
 'public.create_atelier_appointment(text,date,text,uuid,uuid,text,uuid)',
 'public.request_atelier_appointment_change(uuid,text,date,text,text,bigint,uuid)',
 'public.manage_atelier_appointment(uuid,text,date,time without time zone,integer,text,text,bigint,uuid)',
 'public.review_atelier_appointment_change(uuid,text,date,time without time zone,integer,text,text,bigint,bigint,uuid)',
 'public.add_atelier_appointment_note(uuid,text,uuid)',
 'public.get_atelier_appointment_detail(uuid)',
 'public.create_atelier_concierge_request(text,text,text,uuid,uuid,uuid,uuid)',
 'public.send_atelier_concierge_message(uuid,text,uuid)',
 'public.mark_atelier_concierge_read(uuid,bigint)',
 'public.set_atelier_concierge_status(uuid,text,bigint,uuid)',
 'public.get_atelier_concierge_thread(uuid,bigint,integer)',
 'public.get_atelier_concierge_inbox(text,boolean,timestamptz,uuid,integer)',
 'public.get_atelier_service_counts()']) signature),'all approved RPC argument signatures exist exactly');
select ok((select count(*)=13 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and proname like '%atelier%' and has_function_privilege('authenticated',p.oid,'execute') and not has_function_privilege('anon',p.oid,'execute') and not has_function_privilege('service_role',p.oid,'execute') and p.prosecdef and p.proconfig=array['search_path=""']),'all 13 guarded authenticated RPCs have pinned ACL/search_path');
select ok((select bool_and(relrowsecurity) from pg_class c join pg_namespace n on n.oid=c.relnamespace where (n.nspname='private' and relname in ('atelier_operation_results','atelier_event_actors','appointment_staff_notes','concierge_staff_senders')) or (n.nspname='public' and relname in ('appointments','appointment_change_requests','concierge_requests','concierge_messages'))),'all operational/private tables retain RLS');
select ok((select count(*)=4 from pg_indexes where schemaname='public' and indexname in ('appointments_bespoke_request_idx','appointments_order_idx','appointment_changes_customer_idx','concierge_messages_sender_idx')),'four FK gaps indexed');
set local role authenticated;
select set_config('request.jwt.claim.sub','f6000000-0000-0000-0000-000000000001',true);
select pg_temp.expect_error($q$select public.create_atelier_appointment('measurement','1999-12-31','morning',null,null,null,gen_random_uuid())$q$,'invalid_date');
select pg_temp.expect_error($q$select public.create_atelier_appointment('measurement','2100-01-01','morning',null,null,null,gen_random_uuid())$q$,'invalid_date');
select pg_temp.expect_error($q$select public.create_atelier_appointment('measurement','2099-12-01','morning','f6200000-0000-0000-0000-000000000001',null,null,gen_random_uuid())$q$,'not_found');
select pg_temp.expect_error($q$select public.create_atelier_appointment('measurement','2099-12-01','morning','f6200000-0000-0000-0000-000000000002','f6210000-0000-0000-0000-000000000002',null,gen_random_uuid())$q$,'context_mismatch');
select pg_temp.expect_error($q$select public.create_atelier_appointment('invalid','2099-12-01','morning',null,null,null,gen_random_uuid())$q$,'invalid_purpose');
select pg_temp.expect_error($q$select public.create_atelier_appointment('measurement','2099-12-01','  ',null,null,null,gen_random_uuid())$q$,'invalid_input');
select pg_temp.expect_error($q$select public.create_atelier_appointment('measurement','2099-12-01','morning',null,null,null,null)$q$,'operation_key_required');
insert into phase6_fixture values('appointment',public.create_atelier_appointment('style-consultation','2099-12-01','morning',null,null,'client note','f6800000-0000-0000-0000-000000000001'));
insert into phase6_fixture values('second',public.create_atelier_appointment('pickup','2099-12-01','afternoon',null,null,null,gen_random_uuid()));
select ok((select val->'appointment' @> '{"status":"requested","scheduled_start_at":null,"confirmed_at":null,"preferred_time":"morning"}' from phase6_fixture where key='appointment'),'request is not confirmation and retains time window');
select ok(public.create_atelier_appointment('style-consultation','2099-12-01','morning',null,null,'client note','f6800000-0000-0000-0000-000000000001')=(select val from phase6_fixture where key='appointment'),'creation exact snapshot replay');
select pg_temp.expect_error($q$select public.create_atelier_appointment('pickup','2099-12-01','morning',null,null,'client note','f6800000-0000-0000-0000-000000000001')$q$,'idempotency_conflict');
select pg_temp.expect_error($q$select public.manage_atelier_appointment(pg_temp.ap('appointment'),'confirm','2099-12-01','10:00',60,null,null,1,gen_random_uuid())$q$,'unauthorized');
select pg_temp.expect_error($q$update public.appointments set status='confirmed' where id=pg_temp.ap('appointment')$q$,'permission denied');
select set_config('request.jwt.claim.sub','f6000000-0000-0000-0000-000000000002',true);
select ok((select count(*)=0 from public.appointments where id=pg_temp.ap('appointment')),'other client RLS isolation');
select pg_temp.expect_error($q$select public.get_atelier_appointment_detail(pg_temp.ap('appointment'))$q$,'not_found');
select pg_temp.expect_error($q$select public.request_atelier_appointment_change(pg_temp.ap('appointment'),'cancellation',null,null,null,1,gen_random_uuid())$q$,'not_found');
select set_config('request.jwt.claim.sub','f6000000-0000-0000-0000-000000000004',true);
select pg_temp.expect_error($q$select public.create_atelier_appointment('measurement','2099-12-01','morning',null,null,null,gen_random_uuid())$q$,'unauthorized');
select set_config('request.jwt.claim.sub','f6000000-0000-0000-0000-000000000003',true);
select pg_temp.expect_error($q$select public.manage_atelier_appointment(pg_temp.ap('appointment'),'confirm','2099-12-01','10:00',14,null,null,1,gen_random_uuid())$q$,'invalid_schedule');
select pg_temp.expect_error($q$select public.manage_atelier_appointment(pg_temp.ap('appointment'),'confirm','2099-12-01','10:00:01',60,null,null,1,gen_random_uuid())$q$,'invalid_schedule');
select pg_temp.expect_error($q$select public.manage_atelier_appointment(pg_temp.ap('appointment'),'confirm','2099-12-01','24:00',60,null,null,1,gen_random_uuid())$q$,'invalid_schedule');
select pg_temp.expect_error($q$select public.manage_atelier_appointment(pg_temp.ap('appointment'),'confirm','2099-12-01','10:00',241,null,null,1,gen_random_uuid())$q$,'invalid_schedule');
select pg_temp.expect_error($q$select public.manage_atelier_appointment(pg_temp.ap('appointment'),'confirm','2000-01-01','10:00',60,null,null,1,gen_random_uuid())$q$,'schedule_in_past');
select pg_temp.expect_error($q$select public.manage_atelier_appointment(pg_temp.ap('appointment'),'confirm','2099-12-01','10:00',60,null,null,null,gen_random_uuid())$q$,'stale_version');
insert into phase6_fixture values('confirmed',public.manage_atelier_appointment(pg_temp.ap('appointment'),'confirm','2099-12-01','10:00',60,null,'PRIVATE STAFF NOTE',1,'f6800000-0000-0000-0000-000000000002'));
select ok((select val->'appointment' @> '{"status":"confirmed","confirmed_time":"10:00","scheduled_start_at":"2099-12-01T09:00:00+00:00","scheduled_end_at":"2099-12-01T10:00:00+00:00"}' from phase6_fixture where key='confirmed'),'explicit Lagos conversion and schedule mirrors');
select ok((select position('PRIVATE STAFF NOTE' in val::text)=0 from phase6_fixture where key='confirmed'),'private note absent from mutation replay');
select pg_temp.expect_error($q$select public.manage_atelier_appointment(pg_temp.ap('second'),'confirm','2099-12-01','10:30',60,null,null,1,gen_random_uuid())$q$,'schedule_conflict');
select public.manage_atelier_appointment(pg_temp.ap('second'),'confirm','2099-12-01','11:00',15,null,null,1,gen_random_uuid());
select pg_temp.expect_error($q$select public.manage_atelier_appointment(pg_temp.ap('appointment'),'complete',null,null,null,null,null,pg_temp.av('appointment'),gen_random_uuid())$q$,'completion_not_available');
select ok(public.get_atelier_appointment_detail(pg_temp.ap('appointment'))?'staff_notes','active staff detail can read private notes');
select set_config('request.jwt.claim.sub','f6000000-0000-0000-0000-000000000001',true);
select ok(not public.get_atelier_appointment_detail(pg_temp.ap('appointment'))?'staff_notes','client detail excludes staff notes');
select ok(position('PRIVATE STAFF NOTE' in public.get_atelier_appointment_detail(pg_temp.ap('appointment'))::text)=0,'public history excludes private note');
select pg_temp.expect_error($q$select * from private.appointment_staff_notes$q$,'permission denied');
select pg_temp.expect_error($q$select public.request_atelier_appointment_change(pg_temp.ap('appointment'),'cancellation','2099-12-02','morning',null,pg_temp.av('appointment'),gen_random_uuid())$q$,'invalid_input');
insert into phase6_fixture values('change',public.request_atelier_appointment_change(pg_temp.ap('appointment'),'reschedule','2099-12-02','evening','new preference',pg_temp.av('appointment'),'f6800000-0000-0000-0000-000000000003'));
select ok((select status='confirmed' and confirmed_date='2099-12-01' from public.appointments where id=pg_temp.ap('appointment')),'pending change preserves authoritative schedule');
select pg_temp.expect_error($q$select public.request_atelier_appointment_change(pg_temp.ap('appointment'),'cancellation',null,null,null,pg_temp.av('appointment'),gen_random_uuid())$q$,'pending_change_exists');
select set_config('request.jwt.claim.sub','f6000000-0000-0000-0000-000000000003',true);
select pg_temp.expect_error($q$select public.manage_atelier_appointment(pg_temp.ap('appointment'),'reschedule','2099-12-02','14:00',60,'staff changed',null,pg_temp.av('appointment'),gen_random_uuid())$q$,'pending_change_exists');
insert into phase6_fixture values('review',public.review_atelier_appointment_change((select (val->'change_request'->>'id')::uuid from phase6_fixture where key='change'),'approve','2099-12-02','14:00',60,'accepted new date','SECOND PRIVATE NOTE',pg_temp.av('appointment'),1,'f6800000-0000-0000-0000-000000000004'));
select ok((select val->'change_request'->>'status'='approved' and val->'appointment'->>'confirmed_time'='14:00' from phase6_fixture where key='review'),'staff confirms an explicit new schedule');
select ok(public.manage_atelier_appointment(pg_temp.ap('appointment'),'confirm','2099-12-01','10:00',60,null,'PRIVATE STAFF NOTE',1,'f6800000-0000-0000-0000-000000000002')=(select val from phase6_fixture where key='confirmed'),'original confirmation result preserved after later reschedule');
select pg_temp.expect_error($q$select public.review_atelier_appointment_change((select (val->'change_request'->>'id')::uuid from phase6_fixture where key='change'),'decline',null,null,null,'too late',null,pg_temp.av('appointment'),2,gen_random_uuid())$q$,'change_already_reviewed');
select public.add_atelier_appointment_note(pg_temp.ap('appointment'),'standalone private note',gen_random_uuid());
select set_config('request.jwt.claim.sub','f6000000-0000-0000-0000-000000000001',true);
insert into phase6_fixture values('cancel',public.request_atelier_appointment_change(pg_temp.ap('appointment'),'cancellation',null,null,'client cancellation',pg_temp.av('appointment'),gen_random_uuid()));
select set_config('request.jwt.claim.sub','f6000000-0000-0000-0000-000000000005',true);
select public.review_atelier_appointment_change((select (val->'change_request'->>'id')::uuid from phase6_fixture where key='cancel'),'approve',null,null,null,'approved cancellation',null,pg_temp.av('appointment'),1,gen_random_uuid());
select ok((select status='cancelled' and cancelled_at is not null and scheduled_start_at is not null from public.appointments where id=pg_temp.ap('appointment')),'cancellation preserves accepted schedule and actor timestamp');
select pg_temp.expect_error($q$select public.manage_atelier_appointment(pg_temp.ap('appointment'),'reschedule','2099-12-03','10:00',60,'try reopen',null,pg_temp.av('appointment'),gen_random_uuid())$q$,'appointment_terminal');
reset role;
-- Bounded owner-only synthetic time adjustment, no trigger disabled.
update public.appointments set scheduled_start_at=now()-interval '1 hour',scheduled_end_at=now(),lock_version=lock_version+1 where id=pg_temp.ap('second');
set local role authenticated;
select set_config('request.jwt.claim.sub','f6000000-0000-0000-0000-000000000003',true);
select public.manage_atelier_appointment(pg_temp.ap('second'),'complete',null,null,null,null,null,pg_temp.av('second'),gen_random_uuid());
select ok((select status='completed' and completed_at is not null from public.appointments where id=pg_temp.ap('second')),'completion after canonical start');
select set_config('request.jwt.claim.sub','f6000000-0000-0000-0000-000000000001',true);
select pg_temp.expect_error($q$select public.create_atelier_concierge_request('general_enquiry','Test subject','test body','f6200000-0000-0000-0000-000000000001',null,null,gen_random_uuid())$q$,'not_found');
select pg_temp.expect_error($q$select public.create_atelier_concierge_request('general_enquiry','Test subject','test body','f6200000-0000-0000-0000-000000000002','f6210000-0000-0000-0000-000000000002',null,gen_random_uuid())$q$,'context_mismatch');
select pg_temp.expect_error($q$select public.create_atelier_concierge_request('general_enquiry','Test subject','test body',null,null,'f6900000-0000-0000-0000-000000000001',gen_random_uuid())$q$,'not_found');
select pg_temp.expect_error($q$select public.create_atelier_concierge_request('general_enquiry','ab','test body',null,null,null,gen_random_uuid())$q$,'invalid_input');
insert into phase6_fixture values('thread',public.create_atelier_concierge_request('general_enquiry','Test subject','test body',null,null,null,'f6800000-0000-0000-0000-000000000005'));
insert into phase6_fixture values('context_thread',public.create_atelier_concierge_request('discuss_order','Owned order context','context message','f6200000-0000-0000-0000-000000000002','f6210000-0000-0000-0000-000000000001',null,gen_random_uuid()));
select ok((select val->'conversation'->>'context_order_id'='f6200000-0000-0000-0000-000000000002' and val->'conversation'->>'related_request_id'='f6210000-0000-0000-0000-000000000001' from phase6_fixture where key='context_thread'),'owned canonical and legacy context persisted together');
select ok((select val->'conversation'->>'last_message_seq'='1' from phase6_fixture where key='thread'),'one initial message and sequence');
select ok(public.create_atelier_concierge_request('general_enquiry','Test subject','test body',null,null,null,'f6800000-0000-0000-0000-000000000005')=(select val from phase6_fixture where key='thread'),'exact conversation replay');
select pg_temp.expect_error($q$select public.send_atelier_concierge_message(pg_temp.co('thread'),'  ',gen_random_uuid())$q$,'invalid_input');
select pg_temp.expect_error($q$select public.send_atelier_concierge_message(pg_temp.co('thread'),repeat('x',4001),gen_random_uuid())$q$,'invalid_input');
select public.send_atelier_concierge_message(pg_temp.co('thread'),'second client message',gen_random_uuid());
select set_config('request.jwt.claim.sub','f6000000-0000-0000-0000-000000000003',true);
select ok(public.get_atelier_concierge_thread(pg_temp.co('thread'),0,100)->>'unread_messages'='2','staff unread counts only client messages');
select ok(public.mark_atelier_concierge_read(pg_temp.co('thread'),1)->>'unread_messages'='1','read acknowledgement bounded to observed content');
insert into phase6_fixture values('reply',public.send_atelier_concierge_message(pg_temp.co('thread'),'staff reply','f6800000-0000-0000-0000-000000000006'));
select ok((select val->'message'->>'sender_name'='TCC Concierge' and not (val->'message'?'sender_id') from phase6_fixture where key='reply'),'safe staff label without internal identity');
select ok(public.get_atelier_concierge_thread(pg_temp.co('thread'),0,100)?'staff_senders','staff detail attribution available');
select ok(public.get_atelier_concierge_thread(pg_temp.co('thread'),0,1)->>'has_more'='true','bounded thread pagination');
select ok(public.get_atelier_concierge_inbox(null,true,null,null,1)->>'has_more'='true','bounded actual-unread inbox');
select ok((public.get_atelier_service_counts()->>'unread_concierge_messages')::bigint>=1,'real operational service counts');
select pg_temp.expect_error($q$select public.get_atelier_concierge_thread(pg_temp.co('thread'),0,101)$q$,'invalid_pagination');
select pg_temp.expect_error($q$select public.get_atelier_concierge_thread(pg_temp.co('thread'),999,10)$q$,'invalid_pagination');
select pg_temp.expect_error($q$select public.get_atelier_concierge_inbox(null,true,now(),null,10)$q$,'invalid_pagination');
select pg_temp.expect_error($q$select public.mark_atelier_concierge_read(pg_temp.co('thread'),999)$q$,'invalid_read_sequence');
select public.mark_atelier_concierge_read(pg_temp.co('thread'),3);
select ok(public.mark_atelier_concierge_read(pg_temp.co('thread'),1)->>'read_seq'='3','reverse read does not regress staff cursor');
select set_config('request.jwt.claim.sub','f6000000-0000-0000-0000-000000000001',true);
select ok(not public.get_atelier_concierge_thread(pg_temp.co('thread'),0,100)?'staff_senders','client cannot read staff attribution');
select ok(public.get_atelier_concierge_thread(pg_temp.co('thread'),0,100)->>'unread_messages'='1','client unread counts only staff messages');
select ok(public.mark_atelier_concierge_read(pg_temp.co('thread'),3)->>'side'='client','client acknowledgement is owner-side only');
select ok((select staff_read_seq=3 and client_read_seq=3 from public.concierge_requests where id=pg_temp.co('thread')),'per-side cursor state');
select pg_temp.expect_error($q$select public.get_atelier_concierge_inbox(null,false,null,null,10)$q$,'unauthorized');
select pg_temp.expect_error($q$update public.concierge_requests set staff_read_seq=999 where id=pg_temp.co('thread')$q$,'permission denied');
select pg_temp.expect_error($q$select sender_id from public.concierge_messages$q$,'permission denied');
select pg_temp.expect_error($q$select * from private.concierge_staff_senders$q$,'permission denied');
select set_config('request.jwt.claim.sub','f6000000-0000-0000-0000-000000000002',true);
select ok((select count(*)=0 from public.concierge_requests where id=pg_temp.co('thread')),'other client cannot enumerate thread');
select pg_temp.expect_error($q$select public.get_atelier_concierge_thread(pg_temp.co('thread'),0,100)$q$,'not_found');
select pg_temp.expect_error($q$select public.mark_atelier_concierge_read(pg_temp.co('thread'),3)$q$,'not_found');
select pg_temp.expect_error($q$select public.send_atelier_concierge_message(pg_temp.co('thread'),'steal',gen_random_uuid())$q$,'not_found');
select set_config('request.jwt.claim.sub','f6000000-0000-0000-0000-000000000004',true);
select pg_temp.expect_error($q$select public.send_atelier_concierge_message(pg_temp.co('thread'),'inactive',gen_random_uuid())$q$,'unauthorized');
select set_config('request.jwt.claim.sub','f6000000-0000-0000-0000-000000000003',true);
select public.set_atelier_concierge_status(pg_temp.co('thread'),'closed',pg_temp.cv('thread'),gen_random_uuid());
select pg_temp.expect_error($q$select public.send_atelier_concierge_message(pg_temp.co('thread'),'closed write',gen_random_uuid())$q$,'conversation_closed');
select ok(public.send_atelier_concierge_message(pg_temp.co('thread'),'staff reply','f6800000-0000-0000-0000-000000000006')=(select val from phase6_fixture where key='reply'),'reply snapshot replay even after close');
select public.set_atelier_concierge_status(pg_temp.co('thread'),'open',pg_temp.cv('thread'),gen_random_uuid());
select pg_temp.expect_error($q$select public.set_atelier_concierge_status(pg_temp.co('thread'),'resolved',1,gen_random_uuid())$q$,'stale_version');
reset role;
select ok((select count(*)=3 from public.concierge_messages where request_id=pg_temp.co('thread')),'no duplicate initial or replay messages');
select ok((select count(*)=1 from private.concierge_staff_senders s join public.concierge_messages m on m.id=s.message_id where m.request_id=pg_temp.co('thread')),'one immutable actual staff attribution');
select pg_temp.expect_error($q$update public.concierge_messages set message='tampered' where request_id=pg_temp.co('thread')$q$,'immutable_atelier_record');
select pg_temp.expect_error($q$delete from public.concierge_messages where request_id=pg_temp.co('thread')$q$,'immutable_atelier_record');
select pg_temp.expect_error($q$delete from public.appointments where id=pg_temp.ap('appointment')$q$,'immutable_atelier_record');
select pg_temp.expect_error($q$update private.atelier_operation_results set result='{}'$q$,'immutable_atelier_record');
select pg_temp.expect_error($q$update private.concierge_staff_senders set actor_role='ceo'$q$,'immutable_atelier_record');
select pg_temp.expect_error($q$delete from public.lifecycle_events where entity_type='appointment' and entity_id=pg_temp.ap('appointment')$q$,'immutable_atelier_record');
select ok((select to_jsonb(o)=(select val from phase6_fixture where key='financial_before') from public.orders o where id='f6200000-0000-0000-0000-000000000001'),'appointments/messages never implicitly change Order or financial fields');
select ok((select count(*)=0 from public.lifecycle_events where entity_type in ('appointment','concierge_request') and actor_type='staff' and actor_id is not null),'public Phase 6 staff identity withheld');
select ok((select count(*)=1 from public.notifications where related_entity_id=pg_temp.ap('appointment')::text and type='appointment_rescheduled'),'one reschedule notification despite replay and review history');
select ok((select count(*)=1 from public.notifications where related_entity_id=pg_temp.co('thread')::text and type='concierge_staff_reply'),'one staff reply notification despite replay');
select ok((select count(*)=0 from public.lifecycle_events where metadata::text like '%PRIVATE%'),'no private notes in public event metadata');
set local role authenticated;
select set_config('request.jwt.claim.sub','f6000000-0000-0000-0000-000000000001',true);
insert into phase6_fixture values('today',public.create_atelier_appointment('measurement','2099-12-01','morning',null,null,null,gen_random_uuid()));
select set_config('request.jwt.claim.sub','f6000000-0000-0000-0000-000000000003',true);
select public.manage_atelier_appointment(pg_temp.ap('today'),'confirm','2099-12-03','23:30',60,null,null,1,gen_random_uuid());
select ok((select scheduled_start_at='2099-12-03 22:30:00+00'::timestamptz and scheduled_end_at='2099-12-03 23:30:00+00'::timestamptz from public.appointments where id=pg_temp.ap('today')),'midnight-crossing range uses explicit Lagos start and duration');
reset role;
update public.appointments set scheduled_start_at=((now() at time zone 'Africa/Lagos')::date+time '00:30') at time zone 'Africa/Lagos',
 scheduled_end_at=((now() at time zone 'Africa/Lagos')::date+time '01:30') at time zone 'Africa/Lagos',lock_version=lock_version+1 where id=pg_temp.ap('today');
set local role authenticated;
select set_config('request.jwt.claim.sub','f6000000-0000-0000-0000-000000000001',true);
select ok(public.get_atelier_service_counts()->>'today_confirmed_appointments'='1','today is Lagos day even when canonical start is previous UTC date');
set local timezone='America/New_York';
insert into phase6_fixture values('nonutc',public.create_atelier_concierge_request('general_enquiry','Timezone proof','Non UTC absolute message',null,null,null,gen_random_uuid()));
select ok((select (val->'message'->>'created_at')::timestamptz=now() and (val->'conversation'->>'created_at')::timestamptz=now() from phase6_fixture where key='nonutc'),'new message/conversation timestamps are absolute under non-UTC session');
set local timezone='UTC';
reset role;
select * from finish();
rollback;
