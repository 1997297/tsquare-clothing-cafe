// Offline disposable PostgreSQL only; no credentials, linked CLI, or remote URL.
import { readFile, readdir, mkdtemp, rm } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { verifyPhase4Storage } from './verify-phase4-storage.mjs';
import { verifyPhase4Concurrency } from './verify-phase4-concurrency.mjs';
const runtime = process.argv[2];
const external = process.argv[3] === '--external-lifecycle';
if (!runtime || (process.argv.length !== 3 && !(external && process.argv.length === 5))) throw new Error('Pass runtime directory, optionally --external-lifecycle disposable cluster directory.');
const { default: pg } = await import(pathToFileURL(resolve(runtime, 'node_modules/pg/lib/index.js')));
const bin = resolve(runtime, 'node_modules/@embedded-postgres/windows-x64/native/bin');
const dir = external ? resolve(process.argv[4]) : await mkdtemp(join(tmpdir(), 'tcc-phase5-db-'));
if (!(dir.startsWith(resolve(tmpdir()) + '\\') || (external && dir.startsWith(resolve(runtime,'..') + '\\'))) || !dir.includes('tcc-phase5-db-')) throw new Error('Cluster must be a disposable Phase 5 directory under OS/runtime temp.');
const connection = { host: '127.0.0.1', port: 55445, user: 'postgres', database: 'postgres' };
function command(name, args) {
 const r = spawnSync(join(bin, name), args, { encoding: 'utf8', windowsHide: true, stdio: name === 'pg_ctl.exe' ? 'ignore' : 'pipe', timeout: 120000 });
 if (r.error || r.status !== 0) throw new Error(r.error?.message || r.stderr || r.stdout);
}
let client, started = false, active = 'bootstrap';
try {
 if (!external) {
  command('initdb.exe', ['-D', dir, '-U', 'postgres', '--auth=trust', '--encoding=UTF8', '--locale=C', '--no-sync']);
  command('pg_ctl.exe', ['-D', dir, '-l', join(dir, 'server.log'), '-o', '-h 127.0.0.1 -p 55445 -c fsync=off -c synchronous_commit=off', '-w', 'start']);
  started = true;
 }
 client = new pg.Client(connection); await client.connect();
 const actualDir = (await client.query('show data_directory')).rows[0].data_directory;
 if (resolve(actualDir) !== dir) throw new Error('Connected cluster is not the supplied disposable directory');
 if (external) {
  connection.database = 'phase5_' + Date.now();
  await client.query('create database ' + connection.database);
  await client.end(); client = new pg.Client(connection); await client.connect();
 }
 console.log('PostgreSQL', (await client.query('show server_version')).rows[0].server_version);
 const platform = await readFile('supabase/tests/local/platform.sql', 'utf8');
 await client.query(external ? platform.replace(/create role (anon|authenticated|service_role) ([^;]+);/g, (_, name, options) => `do $$ begin if not exists(select 1 from pg_roles where rolname='${name}') then create role ${name} ${options}; end if; end $$;`) : platform);
 let before;
 for (const file of ['supabase/schema.sql', ...(await readdir('supabase/migrations')).filter(f => f.endsWith('.sql')).sort().map(f => `supabase/migrations/${f}`)]) {
  active = file;
  if (file.includes('20260929140000')) await client.query(await readFile('supabase/tests/local/phase3-fixtures.sql', 'utf8'));
  if (file.includes('phase5_payments')) {
   await client.query(`insert into public.orders(id,order_reference,customer_id,style_id,style_code,style_name,measurements_snapshot,total_amount,total_amount_minor)
    values('f5900000-0000-0000-0000-000000000099','PHASE5-PRESERVE','f3000000-0000-0000-0000-000000000001','test','test','Legacy order','{}',100,10000);
    insert into public.payments(order_id,customer_id,amount,amount_minor,type,provider,provider_reference,internal_reference,status,paid_at)
    values('f5900000-0000-0000-0000-000000000099','f3000000-0000-0000-0000-000000000001',25,2500,'deposit','manual_transfer','PHASE5-PRESERVE','PHASE5-PRESERVE','successful',now());`);
   before = (await client.query(`select jsonb_build_object('orders',(select jsonb_agg(o order by id) from public.orders o),'payments',(select jsonb_agg(p order by id) from public.payments p),'requests',(select jsonb_agg(r order by id) from public.bespoke_requests r)) snapshot`)).rows[0].snapshot;
  }
  await client.query(await readFile(file, 'utf8')); console.log('Applied', file);
  if (file.includes('phase5_payments')) {
   const after = (await client.query(`select jsonb_build_object('orders',(select jsonb_agg(o order by id) from public.orders o),'payments',(select jsonb_agg(to_jsonb(p)-array['payment_request_id','submission_id','verified_by','verified_at'] order by id) from public.payments p),'requests',(select jsonb_agg(r order by id) from public.bespoke_requests r)) snapshot`)).rows[0].snapshot;
   if (JSON.stringify(before) !== JSON.stringify(after)) throw new Error('Preexisting rows changed');
   console.log('Preserved original order, request and payment fields');
  }
 }
 await client.query((await readFile('supabase/tests/local/assertions.sql', 'utf8')).replace('grant all on tcc_assertions to authenticated;', 'grant all on tcc_assertions to authenticated,anon,service_role;'));
 for (const file of ['supabase/tests/remediation_security.test.sql', 'supabase/tests/phase4_workflow.test.sql', 'supabase/tests/phase5_payments.test.sql']) {
  active = file;
  for (const result of await client.query(await readFile(file, 'utf8'))) for (const row of result.rows) for (const value of Object.values(row)) if (typeof value === 'string' && /^(ok |1\.\.)/.test(value)) console.log(value);
  console.log('Passed', file);
 }
 active = 'Phase 4 concurrency regression';
 await verifyPhase4Storage(client, () => new pg.Client(connection));
 await verifyPhase4Concurrency(client, () => new pg.Client(connection));
 active = 'Phase 5 concurrency';
 await concurrency(client);
 console.log('All offline checks passed; not Storage HTTP, pgTAP extension, advisors or production verification.');
} catch (e) {
 console.error(JSON.stringify({ active, code: e.code, message: e.message, position: e.position, internalQuery: e.internalQuery, where: e.where }, null, 2)); process.exitCode = 1;
} finally {
 if (client) await client.end();
 if (started) command('pg_ctl.exe', ['-D', dir, '-m', 'fast', '-w', 'stop']);
 if (!external && resolve(dir).startsWith(resolve(tmpdir()) + '\\') && dir.includes('tcc-phase5-db-')) await rm(dir, { recursive: true, force: true });
 console.log(external ? 'External launcher must stop and remove its disposable database' : 'Stopped and removed disposable database');
}

async function concurrency(c) {
 // Fixtures are committed only in this disposable cluster, which is removed below.
 await c.query(await readFile('supabase/tests/phase5_payments.test.sql','utf8').then(s => s.slice(s.indexOf('-- CONCURRENCY FIXTURES START'),s.indexOf('-- CONCURRENCY FIXTURES END'))));
 const a = new pg.Client(connection), b = new pg.Client(connection);
  await a.connect(); await b.connect();
 const competingPid=(await b.query('select pg_backend_pid() pid')).rows[0].pid;
 async function assertBlocked() {
  for(let i=0;i<100;i++) {
   if((await c.query('select wait_event_type from pg_stat_activity where pid=$1',[competingPid])).rows[0]?.wait_event_type==='Lock') return;
   await new Promise(r=>setTimeout(r,20));
  }
  throw new Error('Competing transaction did not actually wait on a database lock');
 }
 async function actor(x,id) { await x.query('begin'); await x.query('set local role authenticated'); await x.query("select set_config('request.jwt.claim.sub',$1,true)",[id]); }
 const staff='f5000000-0000-0000-0000-000000000003';
 try {
  await actor(a,staff); await actor(b,staff);
  const first = await a.query("select public.review_payment_submission('f5600000-0000-0000-0000-000000000001','verify',15000,null,'f5700000-0000-0000-0000-000000000001')");
  let finished=false;
  const competing=b.query("select public.review_payment_submission('f5600000-0000-0000-0000-000000000001','verify',15000,null,'f5700000-0000-0000-0000-000000000002')").then(()=>{finished=true;return 'unexpected';},e=>{finished=true;return e.message;});
  await assertBlocked();
  if (finished) throw new Error('Competing verification did not block');
  await a.query('commit');
  if (await competing !== 'submission_already_reviewed') throw new Error('Competing verify did not reject');
  await b.query('rollback');
  if ((await c.query("select count(*)::int n,sum(amount_minor)::text amount from public.payments where submission_id='f5600000-0000-0000-0000-000000000001'")).rows[0].amount !== '15000') throw new Error('Double funds');
  console.log('Passed actual concurrent independent-key verification: one ledger entry');
  await actor(a,staff); await actor(b,staff);
  await a.query("select public.issue_payment_request('f5200000-0000-0000-0000-000000000002',6000,'installment',null,null,1,'f5700000-0000-0000-0000-000000000003')");
  finished=false;
  const issue=b.query("select public.issue_payment_request('f5200000-0000-0000-0000-000000000002',6000,'installment',null,null,1,'f5700000-0000-0000-0000-000000000004')").then(()=>{finished=true;return 'unexpected';},e=>{finished=true;return e.message;});
  await assertBlocked(); if(finished) throw new Error('Competing issue did not block');
  await a.query('commit'); if(await issue !== 'stale_version') throw new Error('Competing issue did not reject'); await b.query('rollback');
  console.log('Passed actual concurrent reservation issuance: stale competitor rejected');
  await actor(a,staff); await actor(b,staff);
  const key='f5700000-0000-0000-0000-000000000005';
  const row=(await a.query('select public.set_order_agreed_total($1,12000,\'race retry\',2,$2) row',['f5200000-0000-0000-0000-000000000002',key])).rows[0].row;
  finished=false;
  const replay=b.query('select public.set_order_agreed_total($1,12000,\'race retry\',2,$2) row',['f5200000-0000-0000-0000-000000000002',key]).then(r=>{finished=true;return r.rows[0].row;});
  await assertBlocked(); if(finished) throw new Error('Same key did not block'); await a.query('commit');
  if(JSON.stringify(await replay)!==JSON.stringify(row)) throw new Error('Retry result differs'); await b.query('commit');
  console.log('Passed actual concurrent same-key pricing: exact result replay');
  const submissions=[];
  for(let i=0;i<2;i++) {
   const order=(await c.query(`insert into public.orders(order_reference,customer_id,style_id,style_code,style_name,measurements_snapshot,total_amount,total_amount_minor)
    values($1,'f5000000-0000-0000-0000-000000000001','test','test','Race','{}',100,10000) returning id`,['PHASE5-DUPLICATE-'+i])).rows[0].id;
   const request=(await c.query(`insert into public.payment_requests(order_id,customer_id,requested_amount_minor,purpose,bank_snapshot,created_by)
    values($1,'f5000000-0000-0000-0000-000000000001',10000,'deposit','{}',$2) returning id`,[order,staff])).rows[0].id;
   const path='f5000000-0000-0000-0000-000000000001/'+request+'/'+(await c.query('select gen_random_uuid() id')).rows[0].id+'.png';
   await c.query("insert into storage.objects(bucket_id,name,metadata) values('payment-receipts',$1,'{\"size\":100,\"mimetype\":\"image/png\"}')",[path]);
   const receipt=(await c.query(`select public.register_payment_receipt('f5000000-0000-0000-0000-000000000001',$1,$2,'image/png',100,repeat('a',64)) row`,[request,path])).rows[0].row.id;
   submissions.push((await c.query(`insert into public.payment_submissions(request_id,order_id,customer_id,reported_amount_minor,transfer_date,transaction_reference,receipt_id)
    values($1,$2,'f5000000-0000-0000-0000-000000000001',10000,current_date,$3,$4) returning id`,[request,order,i ? 'phase5-cross-order-transfer' : 'PHASE5-CROSS-ORDER-TRANSFER',receipt])).rows[0].id);
  }
  await actor(a,staff); await actor(b,staff);
  await a.query("select public.review_payment_submission($1,'verify',10000,null,gen_random_uuid())",[submissions[0]]);
  const duplicate=b.query("select public.review_payment_submission($1,'verify',10000,null,gen_random_uuid())",[submissions[1]]).then(()=> 'unexpected',e=>e.message);
  await assertBlocked(); await a.query('commit');
  if(await duplicate!=='duplicate_transaction_reference') throw new Error('Cross-order duplicate transfer recognized twice'); await b.query('rollback');
  console.log('Passed actual concurrent cross-order normalized transfer reference: duplicate rejected');
  for (const action of ['update','delete']) {
   for (const registrationFirst of [true,false]) {
    const path='f5000000-0000-0000-0000-000000000001/f5300000-0000-0000-0000-000000000001/' + (await c.query('select gen_random_uuid() id')).rows[0].id + '.png';
    await c.query("insert into storage.objects(bucket_id,name,metadata) values('payment-receipts',$1,'{\"size\":100,\"mimetype\":\"image/png\"}')",[path]);
    const register="select public.register_payment_receipt('f5000000-0000-0000-0000-000000000001','f5300000-0000-0000-0000-000000000001',$1,'image/png',100,repeat('a',64))";
    const mutate=action==='delete' ? "delete from storage.objects where bucket_id='payment-receipts' and name=$1" : "update storage.objects set metadata='{\"size\":101,\"mimetype\":\"image/png\"}' where bucket_id='payment-receipts' and name=$1";
    await a.query('begin'); await b.query('begin');
    if(registrationFirst) await a.query('set local role service_role'); else await b.query('set local role service_role');
    await a.query(registrationFirst ? register : mutate,[path]);
    let settled=false;
    const pending=b.query(registrationFirst ? mutate : register,[path]).then(()=>{settled=true;return 'unexpected';},e=>{settled=true;return e.message;});
    await assertBlocked();
    if(settled) throw new Error('Receipt race did not block');
    await a.query('commit');
    const expected=registrationFirst ? 'immutable_registered_receipt' : action==='delete' ? 'receipt_object_missing' : 'receipt_object_mismatch';
    if(await pending !== expected) throw new Error('Storage/registration race invariant failed');
    await b.query('rollback');
    console.log(`Passed actual concurrent receipt ${action}, registration ${registrationFirst ? 'first' : 'second'}`);
   }
  }
 } finally { await a.query('rollback'); await b.query('rollback'); await a.end(); await b.end(); }
}
