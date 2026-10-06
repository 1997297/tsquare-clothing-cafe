// Offline disposable native PostgreSQL only. No env files, linked CLI or HTTP.
import assert from 'node:assert/strict';
import { readFile, readdir, mkdtemp, rm, realpath } from 'node:fs/promises';
import { resolve, join, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { verifyPhase4Storage } from './verify-phase4-storage.mjs';
import { verifyPhase4Concurrency } from './verify-phase4-concurrency.mjs';
import { verifyPhase6Concurrency } from './verify-phase6-concurrency.mjs';
const runtime=process.argv[2];
const external=process.argv[3]==='--external-lifecycle';
if(!runtime || !(process.argv.length===3 || (external&&process.argv.length===5))) throw new Error('Pass native runtime, optionally --external-lifecycle disposable cluster directory.');
const {default:pg}=await import(pathToFileURL(resolve(runtime,'node_modules/pg/lib/index.js')));
const bin=resolve(runtime,'node_modules/@embedded-postgres/windows-x64/native/bin');
const safeTemp=await realpath(tmpdir());
const dir=await realpath(external?resolve(process.argv[4]):await mkdtemp(join(safeTemp,'tcc-phase6-db-')));
if(!dir.toLowerCase().startsWith((safeTemp+sep).toLowerCase())||!dir.includes('tcc-phase6-db-')) throw new Error('Unsafe disposable directory');
const connection={host:'127.0.0.1',port:55466,user:'postgres',database:'postgres'};
function command(name,args){
 const result=spawnSync(join(bin,name),args,{encoding:'utf8',windowsHide:true,stdio:name==='pg_ctl.exe'?'ignore':'pipe',timeout:60000});
 if(result.error||result.status!==0) throw new Error(result.error?.message||result.stderr||result.stdout||`${name} failed: ${result.status}`);
}
let c,started=false,active='bootstrap';
async function run(file){
 active=file;
 const results=await c.query(await readFile(file,'utf8'));
 let assertions=0;
 for(const result of Array.isArray(results)?results:[results]) for(const row of result.rows) for(const value of Object.values(row))
  if(typeof value==='string'&&/^ok /.test(value)) assertions++;
 console.log('Passed',file,assertions?`(${assertions} assertions)`:'');
}
async function snapshot(){
 const tables=(await c.query(`select schemaname,tablename from pg_tables where schemaname in ('public','private','storage') order by 1,2`)).rows;
 const out={};
 for(const {schemaname,tablename} of tables){
  const columns=(await c.query(`select attname from pg_attribute where attrelid=$1::regclass and attnum>0 and not attisdropped order by attnum`,[`${schemaname}.${tablename}`])).rows.map(x=>x.attname);
  const rows=(await c.query(`select jsonb_build_array(${columns.map(x=>`"${x}"`).join(',')}) r from "${schemaname}"."${tablename}" order by 1`)).rows.map(x=>x.r);
  out[`${schemaname}.${tablename}`]={columns,rows};
 }
 return out;
}
async function preserve(before){
 for(const [table,{columns,rows}] of Object.entries(before)){
  const after=(await c.query(`select jsonb_build_array(${columns.map(x=>`"${x}"`).join(',')}) r from ${table} order by 1`)).rows.map(x=>x.r);
  assert.deepEqual(after,rows,`Original fields preserved: ${table}`);
 }
 console.log(`Preserved all original fields in ${Object.keys(before).length} public/private/storage tables`);
}
try{
 if(!external){
  command('initdb.exe',['-D',dir,'-U','postgres','--auth=trust','--encoding=UTF8','--locale=C','--no-sync']);
  command('pg_ctl.exe',['-D',dir,'-l',join(dir,'server.log'),'-o','-h 127.0.0.1 -p 55466 -c fsync=off -c synchronous_commit=off','-w','start']); started=true;
 }
 for(let attempt=0;;attempt++){
  c=new pg.Client(connection);
  try{await c.connect();break;}catch(error){
   await c.end();
   if(attempt>=100||!['57P03','ECONNREFUSED'].includes(error.code)) throw error;
   await new Promise(r=>setTimeout(r,100));
  }
 }
 assert.equal(resolve((await c.query('show data_directory')).rows[0].data_directory),resolve(dir));
 await c.query("set timezone='UTC'");
 console.log('PostgreSQL',(await c.query('show server_version')).rows[0].server_version);
 await run('supabase/tests/local/platform.sql'); await run('supabase/schema.sql');
 const migrations=(await readdir('supabase/migrations')).filter(x=>x.endsWith('.sql')).sort();
 for(const file of migrations.filter(x=>!x.includes('phase6_'))){
  if(file.includes('20260929140000')) await run('supabase/tests/local/phase3-fixtures.sql');
  await run(`supabase/migrations/${file}`);
 }
 await c.query((await readFile('supabase/tests/local/assertions.sql','utf8')).replace('grant all on tcc_assertions to authenticated;','grant all on tcc_assertions to authenticated,anon,service_role;'));
 for(const file of ['remediation_security.test.sql','phase4_workflow.test.sql','phase5_payments.test.sql']) await run(`supabase/tests/${file}`);
 await run('supabase/tests/phase6_preservation_fixtures.sql');
 const before=await snapshot();
 const policySql="select schemaname,tablename,policyname,permissive,roles,cmd,qual,with_check from pg_policies where schemaname in ('public','private','storage') order by 1,2,3";
 const beforePolicies=(await c.query(policySql)).rows;
 const expansion=migrations.find(x=>x.includes('phase6_atelier_expansion'));
 const contract=migrations.find(x=>x.includes('phase6_atelier_contract'));
 assert.ok(expansion&&contract);
 // DDL rollback before the real local replay; never touch a shared database.
 active='expansion rollback';
 await c.query((await readFile(`supabase/migrations/${expansion}`,'utf8')).replace(/commit;\s*$/i,'rollback;'));
 assert.equal((await c.query("select count(*)::int n from information_schema.columns where table_name='appointments' and column_name='scheduled_start_at'")).rows[0].n,0);
 await run(`supabase/migrations/${expansion}`); await preserve(before);
 await run('supabase/tests/phase6_expansion.test.sql');
 active='contract rollback';
 await c.query((await readFile(`supabase/migrations/${contract}`,'utf8')).replace(/commit;\s*$/i,'rollback;'));
 assert.equal((await c.query("select has_function_privilege('service_role','public.request_appointment_change(uuid,uuid,text,text,text,text)','execute') permitted")).rows[0].permitted,true);
 await run(`supabase/migrations/${contract}`); await preserve(before);
 assert.deepEqual((await c.query(policySql)).rows,beforePolicies,'Every existing RLS/storage policy remains byte-equivalent');
 console.log('Preserved every existing RLS and storage policy; both migration rollbacks passed');
 for(const file of ['remediation_security.test.sql','phase4_workflow.test.sql','phase5_payments.test.sql','phase6_workflow.test.sql','phase6_contract.test.sql']) await run(`supabase/tests/${file}`);
 active='Phase 4 real concurrency regressions';
 await verifyPhase4Storage(c,()=>new pg.Client(connection));
 await verifyPhase4Concurrency(c,()=>new pg.Client(connection));
 active='Phase 6 real concurrency';
 await verifyPhase6Concurrency(c,()=>new pg.Client(connection));
 console.log('All local checks passed. Not Auth/Storage HTTP, pgTAP extension, live advisors or production verification.');
}catch(e){console.error(JSON.stringify({active,code:e.code,message:e.message,detail:e.detail,position:e.position,where:e.where},null,2));process.exitCode=1;}
finally{
 if(c) await c.end();
 if(started) command('pg_ctl.exe',['-D',dir,'-m','fast','-w','stop']);
 if(!external&&dir.toLowerCase().startsWith((safeTemp+sep).toLowerCase())&&dir.includes('tcc-phase6-db-')) await rm(dir,{recursive:true,force:true});
 console.log(external?'External Phase 6 launcher owns cluster cleanup':'Stopped and removed only the disposable Phase 6 cluster');
}
