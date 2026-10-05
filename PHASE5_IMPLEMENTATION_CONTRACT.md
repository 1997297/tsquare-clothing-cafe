# Phase 5 implementation contract (2026-10-02)

Status: in progress, not deployed. Phase 4 base: 74b05f6.
User approved CEO-editable bank fields with placeholders. Placeholders are UI hints,
not payable instructions. Bank configuration starts incomplete; issuing a request
requires real bank details deliberately saved by CEO. No Phase 6.

## Audit and ownership

Live preflight: one legitimate order, zero payments. Existing orders.total_amount_minor
and payments.amount_minor remain authoritative integer minor units. Legacy numeric
columns remain compatible mirrors. Existing payment SELECT RLS isolates clients and
permits active staff; old write RPC is service-role only, unused by current UI.
No payment-request, evidence, receipt bucket or bank configuration exists.
Admin Payments is a placeholder; client payment pages are read-only legacy UI.

Main owns TypeScript/UI/server routes, integration and live deployment. Worker2 owns
only a NEW Phase 5 migration, supabase/tests/phase5_payments.test.sql,
supabase/PHASE5_DATABASE.md and optionally scripts/verify-phase5-db.mjs in its isolated
codex/phase5-db worktree. No applied migration edits, live mutations, pushes or secrets.
Parent reviews/cherry-picks the coherent database commit.

## Database contract

Use existing payments for verified ledger entries. Add payment_request_id uuid,
submission_id uuid UNIQUE, verified_by uuid, verified_at timestamptz. Preserve existing
successful rows. Verified ledger records immutable. Never count evidence until staff
explicitly verifies it. Retire/revoke unused legacy record_verified_payment service RPC
if necessary to prevent bypassing new invariants; no gateway is active.

New tables with explicit grants and RLS, no authenticated raw writes:

- payment_bank_settings: id boolean singleton true, bank_name, account_name,
  account_number, instructions, is_configured boolean, lock_version bigint,
  updated_by, updated_at. Initial empty strings, is_configured=false. Admin/CEO SELECT;
  CEO RPC edits. Clients see only request snapshots.
- payment_requests: id, order_id, customer_id (trusted order owner), request_reference
  unique TCC-PAY-NNNNNN, requested_amount_minor bigint, purpose using existing payment
  types deposit/installment/final_payment/full_payment/adjustment, note, due_date,
  bank_snapshot jsonb, status active/cancelled, lock_version, created_by, created_at,
  cancelled_by/at/reason. Request amounts/instructions immutable. Fulfilled/partial
  display derives from evidence/verified sums, not counters.
- payment_receipts: id, request_id, customer_id, storage_path unique, mime_type,
  size_bytes, sha256, created_at. Server-validated uploads only. Registration RPC is
  service_role only. Immutable receipts, owner/active staff SELECT only.
- payment_submissions: id, request_id, order_id, customer_id, reported_amount_minor,
  transfer_date date, transaction_reference, receipt_id UNIQUE FK, client_note,
  status awaiting_verification/verified/rejected, reviewed_by/at, rejection_reason,
  payment_id UNIQUE nullable FK, created_at. No recognized amount duplication: read
  payments.amount_minor through payment_id. Rejection terminal; resubmission inserts
  a new row preserving history.

Index dependencies and ownership filters. Money range 1..999999999999 minor units
fits existing numeric(12,2) and JS safe integers. No new Order cancellation state.

## Exact RPC signatures

Authenticated RPCs return JSON row (except summary):

    set_payment_bank_details(p_bank_name text,p_account_name text,p_account_number text,
      p_instructions text,p_expected_version bigint,p_operation_key uuid)
    set_order_agreed_total(p_order_id uuid,p_amount_minor bigint,p_reason text,
      p_expected_version bigint,p_operation_key uuid)
    issue_payment_request(p_order_id uuid,p_amount_minor bigint,p_purpose text,p_note text,
      p_due_date date,p_expected_version bigint,p_operation_key uuid)
    cancel_payment_request(p_request_id uuid,p_reason text,p_expected_version bigint,p_operation_key uuid)
    submit_payment_evidence(p_request_id uuid,p_reported_amount_minor bigint,p_transfer_date date,
      p_transaction_reference text,p_receipt_id uuid,p_client_note text,p_operation_key uuid)
    review_payment_submission(p_submission_id uuid,p_decision text,p_verified_amount_minor bigint,
      p_reason text,p_operation_key uuid)
    get_order_financials(p_order_id uuid)

Review decision verify/reject, positive recognized amount on verify; reason required
on reject. Financial summary JSON: order_id,total_minor nullable,verified_minor,
pending_minor,balance_minor nullable,reserved_minor,requestable_minor nullable,fully_paid.
Pending sums reported amounts for awaiting_verification only. Pricing/issue expected
version uses orders.lock_version, increment on every money-affecting mutation.
Cancel expected version uses request lock_version. Bank version starts 1. Bank RPC
requires bounded nonempty details and 10-digit account number; placeholders fail.

Service-only registration RPC (no browser EXECUTE):

    register_payment_receipt(p_customer_id uuid,p_request_id uuid,p_storage_path text,
      p_mime_type text,p_size_bytes integer,p_sha256 text)

Checks active owned request, trusted customer, object existence in private
payment-receipts, safe path customerUUID/requestUUID/randomUUID.ext, MIME/extension
consistency, 1..3145728 bytes, lowercase 64-char hex digest. Idempotent same path and
metadata; conflicting content rejected. Server validates actual bytes and uploads
using server-only admin client. Browser bucket INSERT/UPDATE/DELETE denied.
Owner/staff SELECT requires registered receipt. Signed downloads last 60 seconds.

## Accounting and concurrency

Reuse trusted guards/event history/operation keys. Financial mutations derive auth.uid
except service-only registration after server authentication. Pinned search paths and
restricted grants. Consistent locks: actor/operation, order, request, submission/receipt,
storage. Prove races with actual concurrent tests.

Verified sum = successful ledger amount_minor only. Pending never changes verified,
balance or fully_paid. Every active request reserves requested minus verified amount.
Requestable = total - verified - active reservations. Pricing cannot reduce below
verified + active remaining reservations. Cancel only wholly unpaid requests without
pending evidence; keep reason/history. Evidence positive, no more than request remaining
minus pending reported amounts. One pending submission per request is acceptable.
Verification cannot exceed request or order balance; never clamp history. Recognized
amount may differ from reported; partial fulfillment remains open. Reject duplicate
external transaction references after verified transfer; rejected correction may reuse.
Idempotency keys reject changed intent and replay same result. Independent retry keys
cannot duplicate one submission's funds. No refunds/corrections.

Audit price before/after/reason, bank edits (staff-only history), request issue/cancel,
evidence submit/reject/verify with actor/time/amount. Customer financial events use
lifecycle_events and notifications with safe fields.

## Verification

Replay full baseline/migrations locally before live. Preserve old rows and Phase 4 tests.
Test 200 requested/150 verified/50 remaining; deposit + instalments + final balance;
reject/resubmit; duplicate/idempotent/concurrent verification; excess reservations;
price reduction; stale versions; immutable ledger; inactive staff; CEO-only bank config;
anonymous/unrelated isolation; storage privacy and blocked raw writes. Parent handles
live workflows after review. Cleanup exact tagged test records/receipts. Never edit a
real order price or show test bank instructions to real customers.
