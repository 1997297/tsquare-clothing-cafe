-- Read-only, no customer data. Used to compare the actual linked baseline with
-- the disposable database before any Phase 4 migration is allowed to run live.
select 'columns' as kind, table_schema||'.'||table_name||'.'||column_name as name,
 jsonb_build_object('type',data_type,'udt',udt_name,'nullable',is_nullable,'default',column_default) as definition
from information_schema.columns
where table_schema in ('public','private')
union all
select 'constraint',n.nspname||'.'||c.relname||'.'||con.conname,to_jsonb(pg_get_constraintdef(con.oid))
from pg_constraint con join pg_class c on c.oid=con.conrelid join pg_namespace n on n.oid=c.relnamespace
where n.nspname in ('public','private')
union all
select 'index',schemaname||'.'||indexname,to_jsonb(indexdef) from pg_indexes where schemaname in ('public','private')
union all
select 'policy',schemaname||'.'||tablename||'.'||policyname,
 jsonb_build_object('roles',roles,'command',cmd,'using',qual,'check',with_check)
from pg_policies where schemaname in ('public','private','storage')
union all
select 'function',n.nspname||'.'||p.proname||'('||pg_get_function_identity_arguments(p.oid)||')',
 jsonb_build_object('security_definer',p.prosecdef,'config',p.proconfig,'body',regexp_replace(p.prosrc,'\s+',' ','g'),'owner',pg_get_userbyid(p.proowner))
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname in ('public','private') and not exists(select 1 from pg_depend d where d.classid='pg_proc'::regclass and d.objid=p.oid and d.deptype='e')
union all
select 'trigger',n.nspname||'.'||c.relname||'.'||t.tgname,to_jsonb(pg_get_triggerdef(t.oid))
from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace
where n.nspname in ('public','private','auth') and not t.tgisinternal
union all
select 'rls',n.nspname||'.'||c.relname,jsonb_build_object('enabled',c.relrowsecurity,'forced',c.relforcerowsecurity)
from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname in ('public','private') and c.relkind='r'
order by kind,name;
