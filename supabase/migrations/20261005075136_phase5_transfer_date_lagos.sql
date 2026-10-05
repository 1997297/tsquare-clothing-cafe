-- Align transfer-date validation with the application's Africa/Lagos calendar.
-- CREATE OR REPLACE preserves the existing function identity, ownership and ACL.
begin;

create or replace function public.submit_payment_evidence(p_request_id uuid,p_reported_amount_minor bigint,p_transfer_date date,
 p_transaction_reference text,p_receipt_id uuid,p_client_note text,p_operation_key uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare a uuid; o public.orders; r public.payment_requests; receipt public.payment_receipts; s public.payment_submissions; paid bigint; begin
 a:=private.commission_actor(false);
 if private.commission_replay(p_operation_key,jsonb_build_array('evidence',p_request_id,p_reported_amount_minor,p_transfer_date,p_transaction_reference,p_receipt_id,p_client_note)) then return private.payment_result(p_operation_key); end if;
 perform private.payment_money(p_reported_amount_minor); perform private.payment_text(p_transaction_reference,200,true); perform private.payment_text(p_client_note,2000);
 if p_transfer_date is null or p_transfer_date>(now() at time zone 'Africa/Lagos')::date or p_transfer_date<date '2000-01-01' then raise exception 'invalid_transfer_date'; end if;
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

commit;
