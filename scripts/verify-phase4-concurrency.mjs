// Only called with clients of the disposable loopback PostgreSQL cluster.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';

export async function verifyPhase4Concurrency(observer, createClient) {
  const customer=randomUUID(), staff=randomUUID();
  for(const id of [customer,staff]) await observer.query('insert into auth.users(id,email) values($1,$2)',[id,`${id}@example.invalid`]);
  await observer.query("insert into public.staff_accounts(user_id,role,status) values($1,'admin','active')",[staff]);
  const left=createClient(), right=createClient();
  await left.connect(); await right.connect();
  const rightPid=(await right.query('select pg_backend_pid() as id')).rows[0].id;
  const begin=async(connection,actor)=>{
    await connection.query("begin; set local role authenticated; set local lock_timeout='10s'");
    await connection.query("select set_config('request.jwt.claim.sub',$1,true)",[actor]);
  };
  const race=async(sql,args)=>{
    let settled=false;
    const pending=right.query(sql,args).then(result=>{settled=true;return {result};},error=>{settled=true;return {error};});
    let waiting=false;
    for(let i=0;i<150&&!settled;i++){
      const state=(await observer.query('select wait_event_type from pg_stat_activity where pid=$1',[rightPid])).rows[0];
      if(state?.wait_event_type==='Lock'){waiting=true;break;}
      await delay(20);
    }
    assert.equal(waiting,true,'Competing transaction must actually wait on a database lock');
    await left.query('commit');
    const outcome=await pending;
    await right.query(outcome.error?'rollback':'commit');
    return outcome;
  };
  const submit='select public.submit_bespoke_request($1::jsonb,$2::uuid) as row';
  const transition='select public.transition_bespoke_request($1,$2,$3,$4,$5) as row';
  const payload={is_idea_path:true,style_name:'Concurrent test',contact_info:{firstName:'Test',email:'test@example.invalid'},measurements_snapshot:{method:'schedule'}};
  try{
    await begin(left,customer); await begin(right,customer);
    const submissionKey=randomUUID();
    const request=(await left.query(submit,[payload,submissionKey])).rows[0].row;
    const submitted=await race(submit,[payload,submissionKey]);
    if(submitted.error)throw submitted.error;
    assert.equal(submitted.result.rows[0].row.id,request.id);
    assert.equal((await observer.query("select count(*)::int as n from public.lifecycle_events where entity_id=$1 and event_type='request_submitted'",[request.id])).rows[0].n,1);
    console.log('Passed concurrent same-key submission: one request and one event');

    await begin(left,staff);
    await left.query(transition,[request.id,'start_review',null,1,randomUUID()]);
    await left.query('commit');
    await begin(left,staff); await begin(right,staff);
    await left.query(transition,[request.id,'approve',null,2,randomUUID()]);
    const conflict=await race(transition,[request.id,'decline','Conflicting decision',2,randomUUID()]);
    assert.equal(conflict.error?.message,'stale_version');
    console.log('Passed concurrent conflicting review: stale decision rejected');

    await begin(left,staff); await begin(right,staff);
    const convert='select public.convert_bespoke_request_to_order($1::uuid,$2::bigint,$3::uuid) as row';
    const order=(await left.query(convert,[request.id,3,randomUUID()])).rows[0].row;
    const converted=await race(convert,[request.id,3,randomUUID()]);
    if(converted.error)throw converted.error;
    assert.equal(converted.result.rows[0].row.id,order.id);
    assert.equal((await observer.query('select count(*)::int as n from public.orders where bespoke_request_id=$1',[request.id])).rows[0].n,1);
    console.log('Passed concurrent different-key conversion: exactly one order');

    await begin(left,customer);
    const revised=(await left.query(submit,[payload,randomUUID()])).rows[0].row;
    await left.query('commit');
    await begin(left,staff);
    await left.query(transition,[revised.id,'start_review',null,1,randomUUID()]);
    await left.query(transition,[revised.id,'request_changes','Confirm details',2,randomUUID()]);
    await left.query('commit');
    await begin(left,customer); await begin(right,staff);
    await left.query('select public.resubmit_bespoke_request($1,$2::jsonb,$3,$4,$5)',[revised.id,{special_instructions:'Updated'},'Confirmed details',3,randomUUID()]);
    const review=await race(transition,[revised.id,'start_review',null,3,randomUUID()]);
    assert.equal(review.error?.message,'stale_version');
    const current=(await observer.query('select status,revision::int,lock_version::int,special_instructions from public.bespoke_requests where id=$1',[revised.id])).rows[0];
    assert.deepEqual(current,{status:'submitted',revision:2,lock_version:4,special_instructions:'Updated'});
    console.log('Passed concurrent resubmission/review: revision preserved, stale review rejected');
  } finally {
    await left.query('rollback'); await right.query('rollback');
    await left.end(); await right.end();
  }
}
