// Independent native PostgreSQL transactions. Disposable loopback runner only.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';

export async function verifyPhase7Concurrency(observer, createClient) {
  const ceo = randomUUID(), secondCEO = randomUUID(), candidate = randomUUID(), secondCandidate = randomUUID();
  const email = id => `${id}@example.invalid`;
  for (const id of [ceo, secondCEO, candidate, secondCandidate]) await observer.query('insert into auth.users(id,email,email_confirmed_at) values($1,$2,now())', [id, email(id)]);
  for (const id of [ceo, secondCEO]) await observer.query("insert into public.staff_accounts(user_id,role,status) values($1,'ceo','active')", [id]);
  const left = createClient(), right = createClient();
  await left.connect(); await right.connect();
  const pid = (await right.query('select pg_backend_pid() pid')).rows[0].pid;
  const begin = async (connection, actor) => {
    await connection.query("begin; set local lock_timeout='10s'");
    if (actor) { await connection.query('set local role authenticated'); await connection.query("select set_config('request.jwt.claim.sub',$1,true)", [actor]); }
  };
  let count = 0;
  async function compete(sql, args, expected, label) {
    let settled = false;
    const pending = right.query(sql, args).then(result => { settled = true; return { result }; }, error => { settled = true; return { error }; });
    let blocked = false;
    for (let i = 0; i < 200; i++) {
      const state = (await observer.query('select wait_event_type from pg_stat_activity where pid=$1', [pid])).rows[0];
      if (state?.wait_event_type === 'Lock') { blocked = true; break; }
      if (settled) break;
      await delay(10);
    }
    if (!blocked) { await left.query('rollback'); await pending; throw new Error(`No actual lock wait: ${label}`); }
    await left.query('commit');
    const outcome = await pending;
    await right.query(outcome.error ? 'rollback' : 'commit');
    if (expected) assert.equal(outcome.error?.message, expected, label);
    else if (outcome.error) throw outcome.error;
    count++; console.log('Passed actual Phase 7 race:', label);
  }
  const sql = 'select public.manage_admin_staff($1,$2,$3,$4,$5)';
  const args = (id, action, version, key = randomUUID()) => [id, email(id), action, version, key];
  try {
    const same = args(candidate, 'add_admin', 0);
    await begin(left, ceo); await begin(right, ceo);
    await left.query(sql, same);
    await compete(sql, same, null, 'same-key onboarding creates one membership and event');
    assert.equal((await observer.query('select count(*)::int n from private.staff_management_events where target_id=$1', [candidate])).rows[0].n, 1);

    await begin(left, ceo); await begin(right, secondCEO);
    await left.query(sql, args(secondCandidate, 'add_admin', 0));
    await compete(sql, args(secondCandidate, 'add_admin', 0), 'already_staff', 'two CEOs cannot provision duplicate memberships');

    await begin(left, ceo); await begin(right, secondCEO);
    await left.query(sql, args(candidate, 'deactivate_admin', 1));
    await compete(sql, args(candidate, 'deactivate_admin', 1), 'stale_version', 'conflicting status updates reject the stale version');

    await begin(left, candidate); await begin(right, ceo);
    // Restore a synthetic membership outside these transactions first.
    await left.query('rollback'); await right.query('rollback');
    await observer.query("update public.staff_accounts set status='active',deactivated_at=null where user_id=$1", [candidate]);
    await begin(left, candidate); await begin(right, ceo);
    await left.query('select public.get_staff_clients()');
    await compete(sql, args(candidate, 'deactivate_admin', 3), null, 'an in-flight authorized read finishes before deactivation commits');

    await observer.query("update public.staff_accounts set status='active',deactivated_at=null where user_id=$1", [candidate]);
    await begin(left, ceo); await begin(right, candidate);
    await left.query(sql, args(candidate, 'deactivate_admin', 5));
    await compete('select public.get_staff_clients()', [], 'unauthorized', 'deactivation first denies an existing-session staff read');

    const deactivateCEO = "update public.staff_accounts set status='inactive',deactivated_at=now() where user_id=$1";
    await begin(left, null); await begin(right, null);
    await left.query(deactivateCEO, [ceo]);
    await compete(deactivateCEO, [secondCEO], 'last_active_ceo_required', 'simultaneous CEO removal retains the final active CEO');
    assert.equal((await observer.query("select count(*)::int n from public.staff_accounts where role='ceo' and status='active'")).rows[0].n, 1);

    await begin(right, ceo);
    await assert.rejects(right.query(sql, same), /unauthorized/);
    await right.query('rollback');
    count++; console.log('Passed Phase 7 replay after CEO deactivation denial');
    console.log(`Passed ${count} Phase 7 concurrency/replay checks`);
  } finally {
    await left.query('rollback'); await right.query('rollback'); await left.end(); await right.end();
  }
}
