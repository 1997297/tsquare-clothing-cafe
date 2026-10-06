// Real independent transactions in the runner's disposable loopback PG cluster.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';

export async function verifyPhase6Concurrency(observer,createClient){
 const client=randomUUID(),staff=randomUUID(),other=randomUUID(),ceo=randomUUID();
 for(const id of [client,staff,other,ceo]) await observer.query('insert into auth.users(id,email) values($1,$2)',[id,`${id}@example.invalid`]);
 for(const [id,role] of [[staff,'admin'],[ceo,'ceo']]) await observer.query("insert into public.staff_accounts(user_id,role,status) values($1,$2,'active')",[id,role]);
 const left=createClient(),right=createClient(); await left.connect();await right.connect();
 for(const c of [left,right]) await c.query("set timezone='UTC'");
 const rightPid=(await right.query('select pg_backend_pid() pid')).rows[0].pid;
 let count=0;
 const begin=async(c,actor)=>{
  await c.query("begin; set local lock_timeout='10s'");
  if(actor){await c.query('set local role authenticated');await c.query("select set_config('request.jwt.claim.sub',$1,true)",[actor]);}
 };
 const run=async(actor,sql,args)=>{
  await begin(observer,actor);
  try{const result=await observer.query(sql,args);await observer.query('commit');return result.rows[0]?.row;}
  catch(error){await observer.query('rollback');throw error;}
 };
 async function blocked(pending,settled){
  for(let i=0;i<200;i++){
   const state=(await observer.query('select wait_event_type from pg_stat_activity where pid=$1',[rightPid])).rows[0];
   if(state?.wait_event_type==='Lock') return;
   if(settled()) break;
   await delay(10);
  }
  // Consume a rejection/result before reporting failure to avoid an unhandled promise.
  if(settled()) await pending;
  throw new Error('Competing transaction must actually wait on a database lock');
 }
 async function compete(sql,args,expected,label,beforeCommit){
  let settled=false;
  const pending=right.query(sql,args).then(result=>{settled=true;return {result};},error=>{settled=true;return {error};});
  await blocked(pending,()=>settled);
  if(beforeCommit) await beforeCommit();
  await left.query('commit');
  const outcome=await pending;
  await right.query(outcome.error?'rollback':'commit');
  if(expected) assert.equal(outcome.error?.message,expected,label); else if(outcome.error) throw outcome.error;
  count++;console.log('Passed actual Phase 6 race:',label);return outcome.result?.rows[0]?.row;
 }
 const createAppointment=()=>run(client,"select public.create_atelier_appointment('measurement','2098-06-01','morning',null,null,null,$1) row",[randomUUID()]);
 const manage="select public.manage_atelier_appointment($1,$2,$3,$4,$5,$6,$7,$8,$9) row";
 const args=(id,action,date,time,minutes,version,key=randomUUID())=>[id,action,date,time,minutes,action==='reschedule'?'explicit schedule change':null,null,version,key];
 const createThread=()=>run(client,"select public.create_atelier_concierge_request('general_enquiry','Concurrent thread','Initial client message',null,null,null,$1) row",[randomUUID()]);
 const send='select public.send_atelier_concierge_message($1,$2,$3) row';
 const read='select public.mark_atelier_concierge_read($1,$2) row';
 const close="select public.set_atelier_concierge_status($1,'closed',$2,$3) row";
 try{
  const first=await createAppointment(),second=await createAppointment(),adjacent=await createAppointment();
  await begin(left,staff);await begin(right,ceo);
  await left.query(manage,args(first.appointment.id,'confirm','2098-06-01','10:00',60,1));
  await compete(manage,args(second.appointment.id,'confirm','2098-06-01','10:30',60,1),'schedule_conflict','independent confirmation keys: overlap rejected');
  assert.equal((await observer.query('select status from public.appointments where id=$1',[second.appointment.id])).rows[0].status,'requested');
  await begin(left,staff);await begin(right,ceo);
  await left.query(manage,args(second.appointment.id,'confirm','2098-06-01','11:00',15,1));
  await compete(manage,args(adjacent.appointment.id,'confirm','2098-06-01','11:15',15,1),null,'adjacent half-open ranges both accepted');

  const same=await createAppointment(),sameKey=randomUUID(),sameArgs=args(same.appointment.id,'confirm','2098-06-02','10:00',60,1,sameKey);
  await begin(left,staff);await begin(right,staff);
  const original=(await left.query(manage,sameArgs)).rows[0].row;
  assert.deepEqual(await compete(manage,sameArgs,null,'same actor/key confirmation exact replay'),original);
  assert.equal((await observer.query("select count(*)::int n from public.lifecycle_events where entity_id=$1 and event_type='appointment_confirmed'",[same.appointment.id])).rows[0].n,1);

  await begin(left,staff);await begin(right,ceo);
  await left.query(manage,args(first.appointment.id,'cancel',null,null,null,2));
  const replacement=await createAppointment();
  await compete(manage,args(replacement.appointment.id,'confirm','2098-06-01','10:00',60,1),null,'cancellation frees a reserved range');

  const rescheduleTarget=await createAppointment();
  await begin(left,staff);await begin(right,ceo);
  await left.query(manage,args(same.appointment.id,'reschedule','2098-06-03','10:00',60,2));
  await compete(manage,args(rescheduleTarget.appointment.id,'confirm','2098-06-03','10:15',60,1),'schedule_conflict','reschedule and confirmation serialize global capacity');

  const changing=await createAppointment();
  const change='select public.request_atelier_appointment_change($1,\'reschedule\',\'2098-06-05\',\'afternoon\',\'review me\',$2,$3) row';
  await begin(left,client);await begin(right,client);
  const proposed=(await left.query(change,[changing.appointment.id,1,randomUUID()])).rows[0].row;
  await compete(change,[changing.appointment.id,1,randomUUID()],'stale_version','concurrent client change submissions preserve one pending change');
  assert.equal((await observer.query('select count(*)::int n from public.appointment_change_requests where appointment_id=$1',[changing.appointment.id])).rows[0].n,1);
  const review='select public.review_atelier_appointment_change($1,$2,$3,$4,$5,$6,null,2,1,$7) row';
  await begin(left,staff);await begin(right,ceo);
  await left.query(review,[proposed.change_request.id,'approve','2098-06-05','14:00',60,'approved',randomUUID()]);
  await compete(review,[proposed.change_request.id,'decline',null,null,null,'competing decision',randomUUID()],'stale_version','concurrent change review retains one authorized decision');

  const snapshotThread=await createThread();
  await begin(left,staff);await begin(right,client);
  await left.query(send,[snapshotThread.conversation.id,'Uncommitted staff message',randomUUID()]);
  const snapshot=(await right.query('select public.get_atelier_concierge_thread($1,0,100) row',[snapshotThread.conversation.id])).rows[0].row;
  assert.equal(snapshot.conversation.last_message_seq,1);assert.equal(snapshot.messages.length,1);assert.equal(snapshot.unread_messages,0);assert.equal(snapshot.observed_message_seq,1);
  await left.query('commit');
  const refreshed=(await right.query('select public.get_atelier_concierge_thread($1,0,100) row',[snapshotThread.conversation.id])).rows[0].row;
  assert.equal(refreshed.conversation.last_message_seq,2);assert.equal(refreshed.messages.length,2);assert.equal(refreshed.unread_messages,1);await right.query('commit');
  count++;console.log('Passed actual Phase 6 concurrent snapshot: counter/messages/unread agree before and after commit');

  // Creation must take its operation lock BEFORE context row locks. A different
  // phase can own that operation lock and subsequently need the same Request row.
  const contextRequest=randomUUID();
  await observer.query("insert into public.bespoke_requests(id,request_reference,customer_id,contact_info) values($1,$2,$3,'{}')",[contextRequest,'PHASE6-LOCK-CONTEXT-'+randomUUID(),client]);
  for(const concierge of [false,true]){
   const operationKey=randomUUID();
   await begin(left,null);await begin(right,client);
   await left.query('select pg_advisory_xact_lock(hashtextextended($1,0))',[client+operationKey]);
   const sql=concierge?
    "select public.create_atelier_concierge_request('general_enquiry','Context lock test','Context lock body',null,$1,null,$2) row":
    "select public.create_atelier_appointment('measurement','2098-06-01','morning',null,$1,null,$2) row";
   await compete(sql,[contextRequest,operationKey],null,`${concierge?'Concierge':'appointment'} creation locks operation before context`,()=>left.query('select id from public.bespoke_requests where id=$1 for update',[contextRequest]));
  }
  await right.query('begin isolation level repeatable read; set local role authenticated');
  await right.query("select set_config('request.jwt.claim.sub',$1,true)",[staff]);
  await assert.rejects(right.query(manage,args(rescheduleTarget.appointment.id,'confirm','2098-06-09','10:00',60,1)),/read_committed_required/);
  await right.query('rollback');count++;console.log('Passed Phase 6 scheduling isolation guard');

  // Real read/new-arrival races in BOTH lock acquisition orders, for BOTH sides.
  for(const staffSide of [true,false]) for(const arrivalFirst of [true,false]){
   const thread=await createThread(),id=thread.conversation.id;
   const reader=staffSide?staff:client,writer=staffSide?client:staff;
   const readCall=[id,1],sendCall=[id,'Concurrent unseen arrival',randomUUID()];
   await begin(left,arrivalFirst?writer:reader);await begin(right,arrivalFirst?reader:writer);
   await left.query(arrivalFirst?send:read,arrivalFirst?sendCall:readCall);
   await compete(arrivalFirst?read:send,arrivalFirst?readCall:sendCall,null,`${staffSide?'TCC':'client'} read/new arrival, arrival ${arrivalFirst?'first':'second'}`);
   const row=(await observer.query('select client_read_seq,staff_read_seq,last_message_seq from public.concierge_requests where id=$1',[id])).rows[0];
   assert.equal(row[staffSide?'staff_read_seq':'client_read_seq'],'1');assert.equal(row.last_message_seq,'2');
   assert.equal((await run(reader,'select public.get_atelier_concierge_thread($1,0,100) row',[id])).unread_messages,1);
  }

  const thread=await createThread(),id=thread.conversation.id;
  await begin(left,client);await begin(right,client);
  const key=randomUUID(),sendArgs=[id,'Same immutable message',key];
  const sent=(await left.query(send,sendArgs)).rows[0].row;
  assert.deepEqual(await compete(send,sendArgs,null,'same-key message inserts one row with exact snapshot'),sent);
  assert.equal((await observer.query('select count(*)::int n from public.concierge_messages where request_id=$1',[id])).rows[0].n,2);

  await begin(left,client);await begin(right,client);
  await left.query(send,[id,'Same timestamps do not matter',randomUUID()]);
  const next=await compete(send,[id,'Independent next message',randomUUID()],null,'independent message sends get serialized conversation sequences');
  assert.equal(next.last_message_seq,4);

  for(const closeFirst of [true,false]){
   const closing=await createThread(),closeArgs=[closing.conversation.id,1,randomUUID()],sendArgs=[closing.conversation.id,'closure race',randomUUID()];
   await begin(left,closeFirst?staff:client);await begin(right,closeFirst?client:staff);
   await left.query(closeFirst?close:send,closeFirst?closeArgs:sendArgs);
   await compete(closeFirst?send:close,closeFirst?sendArgs:closeArgs,closeFirst?'conversation_closed':null,`close/send, close ${closeFirst?'first':'second'}`);
   assert.equal((await observer.query('select status from public.concierge_requests where id=$1',[closing.conversation.id])).rows[0].status,'closed');
  }

  // Reverse read arrivals cannot regress the cursor.
  await begin(left,staff);await begin(right,ceo);
  await left.query(read,[id,4]);
  assert.equal((await compete(read,[id,1],null,'shared TCC read cursor is monotone across Admin/CEO')).read_seq,4);

  // Staff membership FOR SHARE is held through commit, in both race orders.
  const deactivate="update public.staff_accounts set status='inactive',deactivated_at=now() where user_id=$1";
  const deactivationReplayArgs=[id,'Reply before deactivation',randomUUID()];
  await begin(left,staff);await begin(right,null);
  await left.query(send,deactivationReplayArgs);
  await compete(deactivate,[staff],null,'authorized staff mutation holds membership lock against deactivation');
  await observer.query("update public.staff_accounts set status='active',deactivated_at=null where user_id=$1",[staff]);
  await begin(left,null);await begin(right,staff);
  await left.query(deactivate,[staff]);
  await compete(send,[id,'Must not reply after deactivation',randomUUID()],'unauthorized','deactivation first prevents staff reply');

  // Replays are reauthorized, not merely a lookup of privately cached outputs.
  await begin(right,staff);
  await assert.rejects(right.query(send,deactivationReplayArgs),/unauthorized/);await right.query('rollback');
  count++;console.log('Passed Phase 6 replay after deactivation denial');
  console.log(`Passed ${count} Phase 6 concurrency/replay checks`);
 }finally{
  await left.query('rollback');await right.query('rollback');await left.end();await right.end();
 }
}
