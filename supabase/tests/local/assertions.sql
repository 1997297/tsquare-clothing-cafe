-- Native assertion adapter for machines without the pgTAP extension.
-- Same test statements; every false assertion and incorrect plan raises an error.
-- Do not install on any shared database; the runner uses only its own loopback cluster.
create function public.no_plan() returns text language plpgsql as $$ begin
 create temporary table tcc_assertions(n integer not null, expected integer);
 insert into tcc_assertions values(0,null);
 grant all on tcc_assertions to authenticated;
 return 'Native assertions (no pgTAP extension)';
end; $$;
create function public.plan(expected integer) returns text language plpgsql as $$ begin
 perform public.no_plan(); update tcc_assertions set expected=plan.expected;
 return '1..'||expected;
end; $$;
create function public.ok(p_ok boolean,label text) returns text language plpgsql as $$
declare count integer; begin
 if p_ok is distinct from true then raise exception 'ASSERTION FAILED: %', label; end if;
 update tcc_assertions set n=n+1 returning n into count;
 return 'ok '||count||' - '||label;
end; $$;
create function public.is(actual anyelement,expected anyelement,label text) returns text language sql as $$
 select public.ok(actual is not distinct from expected,label)
$$;
create function public.finish() returns setof text language plpgsql as $$
declare row record; begin
 select * into row from tcc_assertions;
 if row.expected is not null and row.expected<>row.n then raise exception 'Incorrect assertion count: expected %, got %',row.expected,row.n; end if;
 return next '1..'||row.n;
end; $$;
