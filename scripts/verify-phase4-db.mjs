// Disposable PostgreSQL verification only. Never accepts a remote connection URL.
// Install embedded-postgres@17.6.0-beta.15 in an isolated temporary directory,
// then pass that directory as the sole argument. No application dependency changes.
import { readFile, readdir, mkdtemp } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { verifyPhase4Storage } from './verify-phase4-storage.mjs';

const runtime = process.argv[2];
if (!runtime) throw new Error('Pass the isolated embedded-postgres installation directory.');
const { default: pgModule } = await import(pathToFileURL(resolve(runtime, 'node_modules/pg/lib/index.js')));
const bin = resolve(runtime, 'node_modules/@embedded-postgres/windows-x64/native/bin');
const databaseDir = await mkdtemp(join(tmpdir(), 'tcc-phase4-db-'));
function command(name, args) {
  const result = spawnSync(join(bin, name), args, { encoding: 'utf8', windowsHide: true, stdio: name === 'pg_ctl.exe' ? 'ignore' : 'pipe', timeout: 120000 });
  if (result.error || result.status !== 0) throw new Error(result.error?.message || result.stderr || result.stdout);
}
let client;
let started = false;
let activeFile = 'bootstrap';
try {
  command('initdb.exe', ['-D', databaseDir, '-U', 'postgres', '--auth=trust', '--encoding=UTF8', '--locale=C', '--no-sync']);
  command('pg_ctl.exe', ['-D', databaseDir, '-l', join(databaseDir, 'server.log'), '-o', '-h 127.0.0.1 -p 55439 -c fsync=off -c synchronous_commit=off', '-w', 'start']);
  started = true;
  client = new pgModule.Client({ host: '127.0.0.1', port: 55439, user: 'postgres', database: 'postgres' });
  await client.connect();
  console.log('PostgreSQL', (await client.query('show server_version')).rows[0].server_version);
  await client.query(await readFile('supabase/tests/local/platform.sql', 'utf8'));
  let preservedRows;
  for (const file of ['supabase/schema.sql', ...(await readdir('supabase/migrations')).filter(x => x.endsWith('.sql')).sort().map(x => `supabase/migrations/${x}`)]) {
    activeFile = file;
    if (file.includes('20260929140000')) {
      await client.query(await readFile('supabase/tests/local/phase3-fixtures.sql', 'utf8'));
      preservedRows = (await client.query('select to_jsonb(r) as row from public.bespoke_requests r order by id')).rows;
    }
    if (file.includes('20260929140000') && process.argv.includes('--compare-linked')) {
      const query = await readFile('supabase/tests/phase4_schema_inventory.sql', 'utf8');
      const local = (await client.query(query)).rows;
      if (!process.env.TCC_SUPABASE_CLI) throw new Error('Set TCC_SUPABASE_CLI to the installed Supabase executable for read-only baseline comparison.');
      const remoteResult = spawnSync(process.env.TCC_SUPABASE_CLI, ['db', 'query', '--linked', '--file', 'supabase/tests/phase4_schema_inventory.sql'], { encoding: 'utf8', windowsHide: true, maxBuffer: 10 * 1024 * 1024, timeout: 180000 });
      if (remoteResult.status !== 0) throw new Error(remoteResult.error?.message || remoteResult.stderr || `Supabase CLI exited ${remoteResult.status}: ${remoteResult.stdout}`);
      const remote = JSON.parse(remoteResult.stdout).rows;
      const differences = [];
      const canonical = value => Array.isArray(value) ? value.map(canonical) : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])])) : value;
      const lookup = rows => new Map(rows.map(row => [row.kind + ':' + row.name, JSON.stringify(canonical(row.definition))]));
      const left = lookup(local), right = lookup(remote);
      for (const name of new Set([...left.keys(), ...right.keys()])) if (left.get(name) !== right.get(name)) differences.push({ name, local: left.get(name), remote: right.get(name) });
      if (differences.length) { console.log('BASELINE DIFFERENCES', JSON.stringify(differences, null, 2)); throw new Error('Baseline mismatch; do not deploy until reviewed.'); }
      console.log('Linked baseline schema matches disposable baseline:', local.length, 'objects');
    }
    await client.query(await readFile(file, 'utf8'));
    console.log('Applied', file);
    if (file.includes('20260929140000')) {
      const after = (await client.query('select to_jsonb(r) as row from public.bespoke_requests r order by id')).rows;
      if (after.length !== preservedRows.length || preservedRows.some((before, i) => Object.keys(before.row).some(key => JSON.stringify(before.row[key]) !== JSON.stringify(after[i].row[key])))) throw new Error('Legacy request content changed');
      console.log('Preserved every original field of', after.length, 'pre-existing requests');
    }
  }
  await client.query(await readFile('supabase/tests/local/assertions.sql', 'utf8'));
  for (const file of ['supabase/tests/remediation_security.test.sql', 'supabase/tests/phase4_workflow.test.sql']) {
    activeFile = file;
    const results = await client.query(await readFile(file, 'utf8'));
    for (const result of results) for (const row of result.rows) {
      for (const value of Object.values(row)) if (typeof value === 'string' && /^(ok |1\.\.)/.test(value)) console.log(value);
    }
    console.log('Passed', file);
  }
  activeFile = 'scripts/verify-phase4-storage.mjs';
  await verifyPhase4Storage(client, () => new pgModule.Client({ host:'127.0.0.1',port:55439,user:'postgres',database:'postgres' }));
  console.log('All local SQL suites passed. This is not production/browser verification.');
} catch (error) {
  console.error(JSON.stringify({ file: activeFile, code: error.code, message: error.message, position: error.position, internalPosition: error.internalPosition, internalQuery: error.internalQuery, where: error.where }, null, 2));
  process.exitCode = 1;
} finally {
  if (client) await client.end();
  if (started) command('pg_ctl.exe', ['-D', databaseDir, '-m', 'fast', '-t', '110', '-w', 'stop']);
  console.log('Stopped disposable database:', databaseDir);
}
