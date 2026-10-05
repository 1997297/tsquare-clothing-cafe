// Prints a rollback-only SQL suite; it never connects to a database.
// Temporary helpers are explicitly qualified because PostgreSQL does not search
// pg_temp for unqualified function names.
import { readFile } from 'node:fs/promises';
const adapter = (await readFile('supabase/tests/local/assertions.sql', 'utf8'))
  .replaceAll('public.', 'pg_temp.')
  .replace('grant all on tcc_assertions to authenticated;', 'grant all on tcc_assertions to authenticated,anon,service_role;');
let suite = await readFile('supabase/tests/phase5_payments.test.sql', 'utf8');
if (!suite.trimEnd().endsWith('rollback;')) throw new Error('Suite is not rollback-only');
const guards = `do $$ begin
 if exists(select 1 from auth.users where id::text like 'f5000000-%') then raise exception 'Fixture IDs already exist'; end if;
 if exists(select 1 from public.payment_bank_settings where is_configured) then raise exception 'Bank setup changed; review fixture assumptions'; end if;
end $$;`;
// Live Supabase protects Storage metadata DELETE at statement level even before
// RLS. Respect that stronger protection instead of disabling it for a test.
const storageHelper = `create function pg_temp.check_storage_delete(p_expected text) returns text language plpgsql as $$
declare affected bigint; caught text; begin
 begin
   delete from storage.objects where bucket_id='payment-receipts' and name like 'f5000000-0000-0000-0000-000000000001/%';
   get diagnostics affected = row_count;
 exception when others then caught := sqlerrm; end;
 if caught like '%Direct deletion from storage tables is not allowed%' then
   return pg_temp.ok(true,'Live Storage statement guard denies SQL deletion; HTTP RLS needs separate test');
 elsif p_expected='rls' and caught is null and affected=0 then
   return pg_temp.ok(true,'RLS denies owner receipt deletion');
 elsif p_expected='immutable' and caught='immutable_registered_receipt' then
   return pg_temp.ok(true,'Registered receipt immutable');
 end if;
 raise exception 'Unexpected Storage delete result: %, rows %',caught,affected;
end; $$;`;
suite = suite.replace('begin;', () => "begin;\nset local lock_timeout='5s';\nset local statement_timeout='60s';\n" + guards + '\n' + adapter + '\n' + storageHelper)
  .replaceAll('select no_plan()', 'select pg_temp.no_plan()')
  .replaceAll('return ok(true,', 'return pg_temp.ok(true,')
  .replaceAll('select * from finish()', 'select * from pg_temp.finish()')
  .replace(/with deleted as \(delete from storage\.objects where bucket_id='payment-receipts' returning id\)\r?\nselect pg_temp\.assert_true\(\(select count\(\*\)=0 from deleted\),'browser receipt deletion denied'\);/, "select pg_temp.check_storage_delete('rls');")
  .replace("select pg_temp.expect_error($q$delete from storage.objects where bucket_id='payment-receipts'$q$,'immutable_registered_receipt');", "select pg_temp.check_storage_delete('immutable');");
if (suite.includes('with deleted as (delete from storage.objects')) throw new Error('Live storage adapter did not apply');
process.stdout.write(suite);
