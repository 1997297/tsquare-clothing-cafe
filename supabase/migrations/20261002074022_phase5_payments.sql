-- Phase 5 manual bank-transfer workflow. No payable bank details are seeded.
begin;
set local lock_timeout='10s';

create table public.payment_bank_settings (
 id boolean primary key default true check(id),
 bank_name text not null default '', account_name text not null default '',
 account_number text not null default '', instructions text not null default '',
 is_configured boolean not null default false,
 lock_version bigint not null default 1 check(lock_version>0),
 updated_by uuid references auth.users(id), updated_at timestamptz not null default now()
);
insert into public.payment_bank_settings(id) values(true);
create sequence private.payment_request_reference_seq;
create function private.next_payment_reference() returns text language sql volatile set search_path='' as $$
 select 'TCC-PAY-'||lpad(n::text,greatest(6,length(n::text)),'0') from (select nextval('private.payment_request_reference_seq') n) value;
$$;
create table public.payment_requests (
 id uuid primary key default gen_random_uuid(),
 order_id uuid not null references public.orders(id) on delete restrict,
 customer_id uuid not null references public.profiles(id) on delete restrict,
 request_reference text not null unique default private.next_payment_reference(),
 requested_amount_minor bigint not null check(requested_amount_minor between 1 and 999999999999),
 purpose text not null check(purpose in ('deposit','installment','final_payment','full_payment','adjustment')),
 note text, due_date date, bank_snapshot jsonb not null,
 status text not null default 'active' check(status in ('active','cancelled')),
 lock_version bigint not null default 1 check(lock_version>0),
 created_by uuid not null references auth.users(id), created_at timestamptz not null default now(),
 cancelled_by uuid references auth.users(id), cancelled_at timestamptz, cancelled_reason text,
 check((status='active' and cancelled_by is null and cancelled_at is null and cancelled_reason is null)
 or (status='cancelled' and cancelled_by is not null and cancelled_at is not null and cancelled_reason is not null and length(trim(cancelled_reason))>0))
);
create table public.payment_receipts (
 id uuid primary key default gen_random_uuid(),
 request_id uuid not null references public.payment_requests(id) on delete restrict,
 customer_id uuid not null references public.profiles(id) on delete restrict,
 storage_path text not null unique,
 mime_type text not null check(mime_type in ('image/jpeg','image/png','image/webp','application/pdf')),
 size_bytes integer not null check(size_bytes between 1 and 3145728),
 sha256 text not null check(sha256 ~ '^[0-9a-f]{64}$'), created_at timestamptz not null default now()
);
create table public.payment_submissions (
 id uuid primary key default gen_random_uuid(),
 request_id uuid not null references public.payment_requests(id) on delete restrict,
 order_id uuid not null references public.orders(id) on delete restrict,
 customer_id uuid not null references public.profiles(id) on delete restrict,
 reported_amount_minor bigint not null check(reported_amount_minor between 1 and 999999999999),
 transfer_date date not null, transaction_reference text not null,
 receipt_id uuid not null unique references public.payment_receipts(id) on delete restrict,
 client_note text, status text not null default 'awaiting_verification'
 check(status in ('awaiting_verification','verified','rejected')),
 reviewed_by uuid references auth.users(id), reviewed_at timestamptz, rejection_reason text,
 payment_id uuid unique references public.payments(id) on delete restrict,
 created_at timestamptz not null default now(),
 check((status='awaiting_verification' and reviewed_by is null and reviewed_at is null and payment_id is null and rejection_reason is null)
 or (status='verified' and reviewed_by is not null and reviewed_at is not null and payment_id is not null and rejection_reason is null)
 or (status='rejected' and reviewed_by is not null and reviewed_at is not null and payment_id is null and rejection_reason is not null and length(trim(rejection_reason))>0))
);
create unique index payment_one_pending_request on public.payment_submissions(request_id) where status='awaiting_verification';
alter table public.payments
 add column payment_request_id uuid references public.payment_requests(id) on delete restrict,
 add column submission_id uuid unique references public.payment_submissions(id) on delete restrict,
 add column verified_by uuid references auth.users(id), add column verified_at timestamptz;
-- Preserve historical ledger records without inventing verifier provenance.
create index payments_request_idx on public.payments(payment_request_id);
create index payments_verifier_idx on public.payments(verified_by);
create index payments_manual_transfer_normalized_idx on public.payments(lower(trim(provider_reference)))
 where provider='manual_transfer' and status='successful';
create index payment_requests_order_idx on public.payment_requests(order_id,status);
create index payment_requests_customer_idx on public.payment_requests(customer_id,created_at);
create index payment_requests_creator_idx on public.payment_requests(created_by);
create index payment_requests_canceller_idx on public.payment_requests(cancelled_by);
create index payment_receipts_request_idx on public.payment_receipts(request_id);
create index payment_receipts_customer_idx on public.payment_receipts(customer_id);
create index payment_submissions_order_idx on public.payment_submissions(order_id,status);
create index payment_submissions_request_idx on public.payment_submissions(request_id,created_at);
create index payment_submissions_customer_idx on public.payment_submissions(customer_id,created_at);
create index payment_submissions_reviewer_idx on public.payment_submissions(reviewed_by);
create index payment_bank_updater_idx on public.payment_bank_settings(updated_by);
create table private.payment_operation_results (
 actor_id uuid not null, operation_key uuid not null, result jsonb not null,
 primary key(actor_id,operation_key),
 foreign key(actor_id,operation_key) references private.commission_operations(actor_id,operation_key)
);
alter table private.payment_operation_results enable row level security;
revoke all on private.payment_operation_results from public,anon,authenticated,service_role;
revoke all on sequence private.payment_request_reference_seq from public,anon,authenticated,service_role;

alter table public.payment_bank_settings enable row level security;
create policy bank_staff_read on public.payment_bank_settings for select to authenticated
 using ((select private.current_staff_role()) in ('admin','ceo'));
alter table public.payment_requests enable row level security;
create policy payment_requests_read on public.payment_requests for select to authenticated
 using (customer_id=(select auth.uid()) or (select private.current_staff_role()) in ('admin','ceo'));
alter table public.payment_receipts enable row level security;
create policy payment_receipts_read on public.payment_receipts for select to authenticated
 using (customer_id=(select auth.uid()) or (select private.current_staff_role()) in ('admin','ceo'));
alter table public.payment_submissions enable row level security;
create policy payment_submissions_read on public.payment_submissions for select to authenticated
 using (customer_id=(select auth.uid()) or (select private.current_staff_role()) in ('admin','ceo'));
revoke all on public.payment_bank_settings,public.payment_requests,public.payment_receipts,public.payment_submissions from public,anon,authenticated,service_role;
grant select on public.payment_bank_settings,public.payment_requests,public.payment_receipts,public.payment_submissions to authenticated,service_role;
revoke insert,update,delete,truncate on public.payments from public,anon,authenticated,service_role;
revoke all on function public.record_verified_payment(uuid,bigint,text,text,text,text,timestamptz,jsonb) from public,anon,authenticated,service_role;

create function private.payment_immutable() returns trigger language plpgsql set search_path='' as $$
begin raise exception 'immutable_financial_record'; end; $$;
create trigger payment_receipt_immutable before update or delete on public.payment_receipts
 for each row execute function private.payment_immutable();
create function private.payment_ledger_guard() returns trigger language plpgsql set search_path='' as $$
begin
 if old.status='successful' then raise exception 'immutable_verified_payment'; end if;
 if tg_op='DELETE' then return old; end if;
 if new.status='successful' then raise exception 'verification_requires_submission'; end if;
 return new;
end; $$;
create trigger payment_ledger_immutable before update or delete on public.payments
 for each row execute function private.payment_ledger_guard();
create function private.payment_request_guard() returns trigger language plpgsql set search_path='' as $$
begin
 if tg_op='DELETE' then raise exception 'immutable_financial_record'; end if;
 if (to_jsonb(new)-array['status','lock_version','cancelled_by','cancelled_at','cancelled_reason'])
 is distinct from (to_jsonb(old)-array['status','lock_version','cancelled_by','cancelled_at','cancelled_reason'])
 or old.status<>'active' or new.status<>'cancelled' then raise exception 'immutable_payment_request'; end if;
 return new;
end; $$;
create trigger payment_request_immutable before update or delete on public.payment_requests
 for each row execute function private.payment_request_guard();
create function private.payment_submission_guard() returns trigger language plpgsql set search_path='' as $$
begin
 if tg_op='DELETE' then raise exception 'immutable_financial_record'; end if;
 if (to_jsonb(new)-array['status','reviewed_by','reviewed_at','rejection_reason','payment_id'])
 is distinct from (to_jsonb(old)-array['status','reviewed_by','reviewed_at','rejection_reason','payment_id'])
 or old.status<>'awaiting_verification' or new.status not in ('verified','rejected') then
 raise exception 'immutable_payment_submission'; end if;
 return new;
end; $$;
create trigger payment_submission_immutable before update or delete on public.payment_submissions
 for each row execute function private.payment_submission_guard();

create function private.payment_result(k uuid, r jsonb default null) returns jsonb
language plpgsql security definer set search_path='' as $$
declare v jsonb; begin
 if r is not null then insert into private.payment_operation_results values(auth.uid(),k,r); return r; end if;
 select result into v from private.payment_operation_results where actor_id=auth.uid() and operation_key=k;
 if v is null then raise exception 'missing_operation_result'; end if;
 return v;
end; $$;
create function private.payment_money(n bigint) returns void language plpgsql set search_path='' as $$
begin if n is null or n not between 1 and 999999999999 then raise exception 'invalid_amount'; end if; end; $$;
create function private.payment_text(t text, maximum integer, required boolean default false) returns void
language plpgsql set search_path='' as $$ begin
 if length(coalesce(t,''))>maximum or (required and length(trim(coalesce(t,'')))=0) then raise exception 'invalid_text'; end if;
end; $$;
create function private.payment_financials(o public.orders) returns jsonb
language sql stable set search_path='' as $$
 with verified as (select coalesce(sum(amount_minor),0)::bigint n from public.payments where order_id=o.id and status='successful'),
 pending as (select coalesce(sum(reported_amount_minor),0)::bigint n from public.payment_submissions where order_id=o.id and status='awaiting_verification'),
 reserved as (select coalesce(sum(r.requested_amount_minor-coalesce((select sum(p.amount_minor) from public.payments p where p.payment_request_id=r.id and p.status='successful'),0)),0)::bigint n
 from public.payment_requests r where r.order_id=o.id and r.status='active')
 select jsonb_build_object('order_id',o.id,'total_minor',o.total_amount_minor,'verified_minor',v.n,'pending_minor',p.n,
 'balance_minor',o.total_amount_minor-v.n,'reserved_minor',r.n,'requestable_minor',o.total_amount_minor-v.n-r.n,
 'fully_paid',o.total_amount_minor is not null and o.total_amount_minor>0 and v.n>=o.total_amount_minor)
 from verified v,pending p,reserved r;
$$;
create function public.get_order_financials(p_order_id uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare o public.orders; begin
 if auth.uid() is null then raise exception 'unauthorized'; end if;
 select * into o from public.orders where id=p_order_id and
 (customer_id=auth.uid() or private.current_staff_role() in ('admin','ceo'));
 if not found then raise exception 'not_found'; end if;
 return private.payment_financials(o);
end; $$;
create function private.payment_event(o public.orders,t text,m jsonb,staff boolean) returns void
language plpgsql security definer set search_path='' as $$ begin
 insert into public.lifecycle_events(entity_type,entity_id,customer_id,event_type,actor_type,actor_id,metadata)
 values('order',o.id,o.customer_id,t,case when staff then 'staff' else 'customer' end,auth.uid(),m);
 insert into public.notifications(customer_id,type,title,message,related_entity_type,related_entity_id)
 values(o.customer_id,t,'Payment update',coalesce(m->>'message',replace(t,'_',' ')),'order',o.id::text);
end; $$;

create function public.set_payment_bank_details(p_bank_name text,p_account_name text,p_account_number text,
 p_instructions text,p_expected_version bigint,p_operation_key uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare a uuid; b public.payment_bank_settings; before_row jsonb; begin
 a:=private.commission_actor(true);
 if private.current_staff_role()<>'ceo' then raise exception 'unauthorized'; end if;
 if private.commission_replay(p_operation_key,jsonb_build_array('bank',p_bank_name,p_account_name,p_account_number,p_instructions,p_expected_version)) then return private.payment_result(p_operation_key); end if;
 perform private.payment_text(p_bank_name,120,true); perform private.payment_text(p_account_name,160,true);
 perform private.payment_text(p_instructions,2000);
 if p_account_number is null or p_account_number !~ '^[0-9]{10}$' or p_account_number ~ '^([0-9])\1{9}$' or p_account_number in ('1234567890','0123456789')
 or lower(p_bank_name||' '||p_account_name) ~ '(placeholder|example|your bank|your account|enter bank|enter account|bank name|account name|tbd|to be supplied)' then raise exception 'invalid_bank_details'; end if;
 select * into b from public.payment_bank_settings where id for update;
 if b.lock_version is distinct from p_expected_version then raise exception 'stale_version'; end if;
 before_row:=to_jsonb(b);
 update public.payment_bank_settings set bank_name=trim(p_bank_name),account_name=trim(p_account_name),account_number=p_account_number,
 instructions=coalesce(p_instructions,''),is_configured=true,lock_version=lock_version+1,updated_by=a,updated_at=now() where id returning * into b;
 insert into public.lifecycle_events(entity_type,entity_id,event_type,actor_type,actor_id,metadata)
 values('payment_bank_settings',a,'payment_bank_updated','staff',a,jsonb_build_object('before',before_row,'after',to_jsonb(b)));
 return private.payment_result(p_operation_key,to_jsonb(b));
end; $$;
create function public.set_order_agreed_total(p_order_id uuid,p_amount_minor bigint,p_reason text,
 p_expected_version bigint,p_operation_key uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare a uuid; o public.orders; f jsonb; old_total bigint; begin
 a:=private.commission_actor(true);
 if private.commission_replay(p_operation_key,jsonb_build_array('price',p_order_id,p_amount_minor,p_reason,p_expected_version)) then return private.payment_result(p_operation_key); end if;
 perform private.payment_money(p_amount_minor); perform private.payment_text(p_reason,2000,true);
 select * into o from public.orders where id=p_order_id for update;
 if not found then raise exception 'not_found'; end if;
 if o.lock_version is distinct from p_expected_version then raise exception 'stale_version'; end if;
 f:=private.payment_financials(o);
 if p_amount_minor<(f->>'verified_minor')::bigint+(f->>'reserved_minor')::bigint then raise exception 'price_below_commitments'; end if;
 old_total:=o.total_amount_minor;
 update public.orders set total_amount_minor=p_amount_minor,total_amount=p_amount_minor::numeric/100,lock_version=lock_version+1,updated_at=now()
 where id=o.id returning * into o;
 perform private.payment_event(o,'order_price_set',jsonb_build_object('before_minor',old_total,'after_minor',p_amount_minor,'message',trim(p_reason)),true);
 return private.payment_result(p_operation_key,to_jsonb(o));
end; $$;
create function public.issue_payment_request(p_order_id uuid,p_amount_minor bigint,p_purpose text,p_note text,
 p_due_date date,p_expected_version bigint,p_operation_key uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare a uuid; o public.orders; b public.payment_bank_settings; r public.payment_requests; f jsonb; begin
 a:=private.commission_actor(true);
 if private.commission_replay(p_operation_key,jsonb_build_array('issue',p_order_id,p_amount_minor,p_purpose,p_note,p_due_date,p_expected_version)) then return private.payment_result(p_operation_key); end if;
 perform private.payment_money(p_amount_minor); perform private.payment_text(p_note,2000);
 if p_purpose is null or p_purpose not in ('deposit','installment','final_payment','full_payment','adjustment') then raise exception 'invalid_purpose'; end if;
 select * into o from public.orders where id=p_order_id for update;
 if not found then raise exception 'not_found'; end if;
 if o.lock_version is distinct from p_expected_version then raise exception 'stale_version'; end if;
 f:=private.payment_financials(o);
 if o.total_amount_minor is null then raise exception 'price_required'; end if;
 if p_amount_minor>(f->>'requestable_minor')::bigint then raise exception 'exceeds_requestable'; end if;
 select * into b from public.payment_bank_settings where id for share;
 if not b.is_configured then raise exception 'bank_not_configured'; end if;
 insert into public.payment_requests(order_id,customer_id,requested_amount_minor,purpose,note,due_date,bank_snapshot,created_by)
 values(o.id,o.customer_id,p_amount_minor,p_purpose,p_note,p_due_date,
 jsonb_build_object('bank_name',b.bank_name,'account_name',b.account_name,'account_number',b.account_number,'instructions',b.instructions),a) returning * into r;
 update public.orders set lock_version=lock_version+1,updated_at=now() where id=o.id;
 perform private.payment_event(o,'payment_request_issued',jsonb_build_object('request_id',r.id,'request_reference',r.request_reference,'amount_minor',p_amount_minor,'message',p_note),true);
 return private.payment_result(p_operation_key,to_jsonb(r));
end; $$;
create function public.cancel_payment_request(p_request_id uuid,p_reason text,p_expected_version bigint,p_operation_key uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare a uuid; o public.orders; r public.payment_requests; begin
 a:=private.commission_actor(true);
 if private.commission_replay(p_operation_key,jsonb_build_array('cancel_payment',p_request_id,p_reason,p_expected_version)) then return private.payment_result(p_operation_key); end if;
 perform private.payment_text(p_reason,2000,true);
 select o1.* into o from public.orders o1 join public.payment_requests r1 on r1.order_id=o1.id where r1.id=p_request_id for update of o1;
 if not found then raise exception 'not_found'; end if;
 select * into r from public.payment_requests where id=p_request_id for update;
 if r.lock_version is distinct from p_expected_version then raise exception 'stale_version'; end if;
 if r.status<>'active' then raise exception 'request_inactive'; end if;
 if exists(select 1 from public.payments where payment_request_id=r.id and status='successful') or
 exists(select 1 from public.payment_submissions where request_id=r.id and status='awaiting_verification') then raise exception 'request_has_funds_or_pending'; end if;
 update public.payment_requests set status='cancelled',cancelled_by=a,cancelled_at=now(),cancelled_reason=trim(p_reason),lock_version=lock_version+1 where id=r.id returning * into r;
 update public.orders set lock_version=lock_version+1,updated_at=now() where id=o.id;
 perform private.payment_event(o,'payment_request_cancelled',jsonb_build_object('request_id',r.id,'amount_minor',r.requested_amount_minor,'message',trim(p_reason)),true);
 return private.payment_result(p_operation_key,to_jsonb(r));
end; $$;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
 values('payment-receipts','payment-receipts',false,3145728,array['image/jpeg','image/png','image/webp','application/pdf']);
create policy payment_receipts_storage_read on storage.objects for select to authenticated using (
 bucket_id='payment-receipts' and exists(select 1 from public.payment_receipts r where r.storage_path=name and
 (r.customer_id=(select auth.uid()) or (select private.current_staff_role()) in ('admin','ceo'))));
-- Restrictive policies protect this bucket even if a future broad storage policy is added.
create policy payment_receipts_no_insert on storage.objects as restrictive for insert to anon,authenticated with check(bucket_id<>'payment-receipts');
create policy payment_receipts_no_update on storage.objects as restrictive for update to anon,authenticated using(bucket_id<>'payment-receipts') with check(bucket_id<>'payment-receipts');
create policy payment_receipts_no_delete on storage.objects as restrictive for delete to anon,authenticated using(bucket_id<>'payment-receipts');
create policy payment_receipts_anon_boundary on storage.objects as restrictive for select to anon using(bucket_id<>'payment-receipts');
create policy payment_receipts_read_boundary on storage.objects as restrictive for select to authenticated using(
 bucket_id<>'payment-receipts' or exists(select 1 from public.payment_receipts r where r.storage_path=name and
 (r.customer_id=(select auth.uid()) or (select private.current_staff_role()) in ('admin','ceo'))));
create function private.payment_storage_guard() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if old.bucket_id='payment-receipts' and exists(select 1 from public.payment_receipts where storage_path=old.name) then raise exception 'immutable_registered_receipt'; end if;
 if tg_op='DELETE' then return old; end if; return new;
end; $$;
create trigger payment_receipt_storage_immutable before update or delete on storage.objects for each row execute function private.payment_storage_guard();
create function public.register_payment_receipt(p_customer_id uuid,p_request_id uuid,p_storage_path text,p_mime_type text,p_size_bytes integer,p_sha256 text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare o public.orders; r public.payment_requests; receipt public.payment_receipts; ext text; obj storage.objects; begin
 -- EXECUTE is service-only; do not derive the customer from the service JWT.
 select o1.* into o from public.orders o1 join public.payment_requests r1 on r1.order_id=o1.id where r1.id=p_request_id for update of o1;
 if not found then raise exception 'not_found'; end if;
 select * into r from public.payment_requests where id=p_request_id for update;
 if r.customer_id is distinct from p_customer_id then raise exception 'not_found'; end if;
 if p_storage_path is null or p_storage_path !~ ('^'||p_customer_id::text||'/'||p_request_id::text||'/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|jpeg|png|webp|pdf)$') then raise exception 'invalid_receipt_path'; end if;
 ext:=substring(p_storage_path from '\.([a-z]+)$');
 if p_mime_type is null or not ((p_mime_type='image/jpeg' and ext in ('jpg','jpeg')) or (p_mime_type='image/png' and ext='png')
 or (p_mime_type='image/webp' and ext='webp') or (p_mime_type='application/pdf' and ext='pdf'))
 or p_size_bytes is null or p_size_bytes not between 1 and 3145728 or p_sha256 is null or p_sha256 !~ '^[0-9a-f]{64}$' then raise exception 'invalid_receipt_metadata'; end if;
 select * into receipt from public.payment_receipts where storage_path=p_storage_path;
 if found then
 if receipt.request_id is distinct from p_request_id or receipt.customer_id is distinct from p_customer_id or receipt.mime_type is distinct from p_mime_type
 or receipt.size_bytes is distinct from p_size_bytes or receipt.sha256 is distinct from p_sha256 then raise exception 'receipt_conflict'; end if;
 return to_jsonb(receipt);
 end if;
 if r.status<>'active' then raise exception 'request_inactive'; end if;
 select * into obj from storage.objects where bucket_id='payment-receipts' and name=p_storage_path for share;
 if not found then raise exception 'receipt_object_missing'; end if;
 if obj.metadata->>'mimetype' is distinct from p_mime_type or (obj.metadata->>'size')::bigint is distinct from p_size_bytes::bigint then raise exception 'receipt_object_mismatch'; end if;
 insert into public.payment_receipts(request_id,customer_id,storage_path,mime_type,size_bytes,sha256)
 values(r.id,r.customer_id,p_storage_path,p_mime_type,p_size_bytes,p_sha256) returning * into receipt;
 return to_jsonb(receipt);
end; $$;
create function public.submit_payment_evidence(p_request_id uuid,p_reported_amount_minor bigint,p_transfer_date date,
 p_transaction_reference text,p_receipt_id uuid,p_client_note text,p_operation_key uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare a uuid; o public.orders; r public.payment_requests; receipt public.payment_receipts; s public.payment_submissions; paid bigint; begin
 a:=private.commission_actor(false);
 if private.commission_replay(p_operation_key,jsonb_build_array('evidence',p_request_id,p_reported_amount_minor,p_transfer_date,p_transaction_reference,p_receipt_id,p_client_note)) then return private.payment_result(p_operation_key); end if;
 perform private.payment_money(p_reported_amount_minor); perform private.payment_text(p_transaction_reference,200,true); perform private.payment_text(p_client_note,2000);
 if p_transfer_date is null or p_transfer_date>current_date or p_transfer_date<date '2000-01-01' then raise exception 'invalid_transfer_date'; end if;
 select o1.* into o from public.orders o1 join public.payment_requests r1 on r1.order_id=o1.id where r1.id=p_request_id and r1.customer_id=a for update of o1;
 if not found then raise exception 'not_found'; end if;
 select * into r from public.payment_requests where id=p_request_id for update;
 if r.status<>'active' then raise exception 'request_inactive'; end if;
 select coalesce(sum(amount_minor),0) into paid from public.payments where payment_request_id=r.id and status='successful';
 if p_reported_amount_minor>r.requested_amount_minor-paid then raise exception 'exceeds_request_remaining'; end if;
 if exists(select 1 from public.payment_submissions where request_id=r.id and status='awaiting_verification') then raise exception 'pending_submission_exists'; end if;
 select * into receipt from public.payment_receipts where id=p_receipt_id and request_id=r.id and customer_id=a for share;
 if not found then raise exception 'receipt_not_found'; end if;
 if exists(select 1 from public.payment_submissions where receipt_id=receipt.id) then raise exception 'receipt_already_submitted'; end if;
 if exists(select 1 from public.payments where provider='manual_transfer' and lower(trim(provider_reference))=lower(trim(p_transaction_reference)) and status='successful') then raise exception 'duplicate_transaction_reference'; end if;
 insert into public.payment_submissions(request_id,order_id,customer_id,reported_amount_minor,transfer_date,transaction_reference,receipt_id,client_note)
 values(r.id,o.id,a,p_reported_amount_minor,p_transfer_date,trim(p_transaction_reference),receipt.id,p_client_note) returning * into s;
 update public.orders set lock_version=lock_version+1,updated_at=now() where id=o.id;
 perform private.payment_event(o,'payment_evidence_submitted',jsonb_build_object('request_id',r.id,'submission_id',s.id,'reported_amount_minor',p_reported_amount_minor),false);
 return private.payment_result(p_operation_key,to_jsonb(s));
end; $$;
create function public.review_payment_submission(p_submission_id uuid,p_decision text,p_verified_amount_minor bigint,p_reason text,p_operation_key uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare a uuid; o public.orders; r public.payment_requests; s public.payment_submissions; p public.payments; f jsonb; paid bigint; begin
 a:=private.commission_actor(true);
 if private.commission_replay(p_operation_key,jsonb_build_array('review_payment',p_submission_id,p_decision,p_verified_amount_minor,p_reason)) then return private.payment_result(p_operation_key); end if;
 if p_decision is null or p_decision not in ('verify','reject') then raise exception 'invalid_decision'; end if;
 perform private.payment_text(p_reason,2000,p_decision='reject');
 if p_decision='verify' then perform private.payment_money(p_verified_amount_minor);
 elsif p_verified_amount_minor is not null then raise exception 'rejection_amount_must_be_null'; end if;
 select o1.* into o from public.orders o1 join public.payment_submissions s1 on s1.order_id=o1.id where s1.id=p_submission_id for update of o1;
 if not found then raise exception 'not_found'; end if;
 select r1.* into r from public.payment_requests r1 join public.payment_submissions s1 on s1.request_id=r1.id where s1.id=p_submission_id for update of r1;
 select * into s from public.payment_submissions where id=p_submission_id for update;
 if s.status<>'awaiting_verification' then raise exception 'submission_already_reviewed'; end if;
 if r.status<>'active' then raise exception 'request_inactive'; end if;
 if p_decision='verify' then
 f:=private.payment_financials(o);
 select coalesce(sum(amount_minor),0) into paid from public.payments where payment_request_id=r.id and status='successful';
 if o.total_amount_minor is null or p_verified_amount_minor>(f->>'balance_minor')::bigint or p_verified_amount_minor>r.requested_amount_minor-paid then raise exception 'verification_exceeds_balance'; end if;
 perform pg_advisory_xact_lock(hashtextextended('payment-transfer:'||lower(trim(s.transaction_reference)),0));
 if exists(select 1 from public.payments where provider='manual_transfer' and lower(trim(provider_reference))=lower(trim(s.transaction_reference)) and status='successful') then raise exception 'duplicate_transaction_reference'; end if;
 insert into public.payments(order_id,customer_id,amount,amount_minor,currency,type,provider,provider_reference,internal_reference,status,paid_at,
 payment_request_id,submission_id,verified_by,verified_at)
 values(o.id,o.customer_id,p_verified_amount_minor::numeric/100,p_verified_amount_minor,'NGN',r.purpose,'manual_transfer',s.transaction_reference,
 'TCC-VER-'||s.id::text,'successful',s.transfer_date::timestamptz,r.id,s.id,a,now()) returning * into p;
 end if;
 update public.payment_submissions set status=case when p_decision='verify' then 'verified' else 'rejected' end,
 reviewed_by=a,reviewed_at=now(),payment_id=p.id,rejection_reason=case when p_decision='reject' then trim(p_reason) end where id=s.id returning * into s;
 update public.orders set lock_version=lock_version+1,updated_at=now() where id=o.id;
 perform private.payment_event(o,case when p_decision='verify' then 'payment_verified' else 'payment_evidence_rejected' end,
 jsonb_build_object('request_id',r.id,'submission_id',s.id,'payment_id',p.id,'reported_amount_minor',s.reported_amount_minor,'verified_amount_minor',p.amount_minor,'message',p_reason),true);
 return private.payment_result(p_operation_key,to_jsonb(s));
end; $$;

-- Explicit function grants: default PUBLIC execute must never expose definer helpers.
revoke all on function private.next_payment_reference(),private.payment_immutable(),private.payment_ledger_guard(),private.payment_request_guard(),private.payment_submission_guard(),
 private.payment_result(uuid,jsonb),private.payment_money(bigint),private.payment_text(text,integer,boolean),private.payment_financials(public.orders),
 private.payment_event(public.orders,text,jsonb,boolean),private.payment_storage_guard() from public,anon,authenticated,service_role;
revoke all on function public.set_payment_bank_details(text,text,text,text,bigint,uuid),public.set_order_agreed_total(uuid,bigint,text,bigint,uuid),
 public.issue_payment_request(uuid,bigint,text,text,date,bigint,uuid),public.cancel_payment_request(uuid,text,bigint,uuid),
 public.submit_payment_evidence(uuid,bigint,date,text,uuid,text,uuid),public.review_payment_submission(uuid,text,bigint,text,uuid),public.get_order_financials(uuid),
 public.register_payment_receipt(uuid,uuid,text,text,integer,text) from public,anon,authenticated,service_role;
grant execute on function public.set_payment_bank_details(text,text,text,text,bigint,uuid),public.set_order_agreed_total(uuid,bigint,text,bigint,uuid),
 public.issue_payment_request(uuid,bigint,text,text,date,bigint,uuid),public.cancel_payment_request(uuid,text,bigint,uuid),
 public.submit_payment_evidence(uuid,bigint,date,text,uuid,text,uuid),public.review_payment_submission(uuid,text,bigint,text,uuid),public.get_order_financials(uuid) to authenticated;
grant execute on function public.register_payment_receipt(uuid,uuid,text,text,integer,text) to service_role;
commit;
