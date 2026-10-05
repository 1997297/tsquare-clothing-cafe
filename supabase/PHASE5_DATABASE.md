# Phase 5 database integration

Worker2 database module on `codex/phase5-db`, based on `74b05f6`.
Parent integration update (2026-10-06): the original four files were committed as
Worker2 `8d9ca7a` and cherry-picked to main as `a5d7a6c`; the Git limitation below
describes the historical worker handoff, not current state. Core migration is live.
Follow-up `20261005075136_phase5_transfer_date_lagos.sql` is also live, preserving
the evidence RPC except its upper date bound now uses the Africa/Lagos calendar.
Both migrations passed dry runs, row-preservation checks and rollback verification.
See `../PHASE5_ROLLOUT_REPORT.md` for application/HTTP/advisor/deployment status.
Parent has now completed production browser/HTTP verification and exact-fixture
cleanup. The stopped Worker2 disposable cluster was removed after exact-path and
no-running-PostgreSQL checks. The limitations below are historical Worker2 handoff
notes, resolved by parent integration. Real bank activation is intentionally deferred
for CEO configuration after project approval, not an unfinished database task.

Migration: `20261002074022_phase5_payments.sql`, generated with the supplied native
Supabase CLI after `migration new --help`. Process-only `DO_NOT_TRACK=1` and
`SUPABASE_NO_UPDATE_NOTIFIER=1` avoided an otherwise forbidden telemetry write.
No live Supabase calls, credential reads, pushes or deployments were performed.
No applied migration, application file, dependency, environment file or handoff was edited.

## Contract and parent responsibilities

All eight RPC signatures match `PHASE5_IMPLEMENTATION_CONTRACT.md`; no essential
signature or accounting deviation. Cancellation fields are `cancelled_by`,
`cancelled_at`, `cancelled_reason`. RPC results are JSON objects, not arrays or a
set-returning composite. Replays return the **original result**, including its
original version. Refresh the order/request/settings after a successful mutation.

Parent owns authenticated UI/server calls, explicit price/review confirmations,
actual upload byte/MIME/hash validation, 60-second signed download URLs, live
rollout, live advisors and browser verification. SQL cannot inspect object bytes
or enforce the lifetime of a server-generated signed URL. Never put admin client
credentials in a browser. Bank fields are empty/unconfigured until a CEO supplies
real details. Test-only bank values exist exclusively in disposable SQL fixtures.

Additional validation: required reasons and references are trimmed/nonempty;
notes/instructions/reasons are at most 2,000 characters, transaction references
200, bank name 120, account name 160. Account numbers must be ten digits;
common placeholders, sequential test numbers and repeated digits fail. This is
input validation, not external bank-account verification. Transfer dates must be
between 2000-01-01 and today's Africa/Lagos date (follow-up migration). Reject with
`p_verified_amount_minor = null`; verify with a positive recognized amount.

## Tables and ledger

- `payment_bank_settings`: singleton boolean `id=true`, initial version 1,
  staff SELECT, CEO-only configuration RPC. Bank edits have staff-only lifecycle
  events (`customer_id` null) with before/after snapshots.
- `payment_requests`: immutable order/customer, amount, purpose, note, due date,
  bank snapshot and human reference `TCC-PAY-NNNNNN` (expands beyond six digits).
  Status is `active` or `cancelled`; derive partial/fulfilled display from ledger
  sums. Cancellation retains actor/time/reason and increments request version.
- `payment_receipts`: immutable server registration metadata, unique storage path,
  owner/request relationships, validated MIME, byte count and SHA-256.
- `payment_submissions`: immutable reported amount/date/reference/receipt/note;
  one pending row per request; terminal verified or rejected review. Rejected
  correction inserts a fresh receipt/submission. Recognized money is obtained
  only through `payment_id -> payments.amount_minor`.
- Existing `payments` is the only verified ledger. New nullable
  `payment_request_id`, unique `submission_id`, `verified_by`, `verified_at`
  preserve legacy records without invented provenance. Successful rows cannot
  be updated/deleted, including old successful rows. New verification inserts
  an exact numeric mirror `amount_minor / 100` and `manual_transfer` provider.
  The legacy `record_verified_payment` RPC loses all EXECUTE grants, including
  service role. Service/browser raw payment writes are revoked.

All new public tables have RLS, explicit read grants and no browser/service raw
writes. Clients see owned rows; active Admin/CEO see all relevant rows. Service
role gets SELECT for the parent upload/server workflow. Definer RPCs have pinned
empty search paths and explicit EXECUTE grants; private helpers/results and
reference sequence are unavailable to browser/service callers. Foreign-key and
ownership/queue dependencies are indexed, including normalized transfer lookup.

## Exact RPC API

```sql
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
register_payment_receipt(p_customer_id uuid,p_request_id uuid,p_storage_path text,
  p_mime_type text,p_size_bytes integer,p_sha256 text)
```

Authenticated EXECUTE for the first seven, service-role-only EXECUTE for receipt
registration. Bank configuration additionally requires active CEO; price/issue/
cancel/review require active staff; evidence requires an authenticated customer
profile without staff membership. Relationships and actor are database-derived.
The functions return the bank/order/request/submission/receipt JSON row as
appropriate. Financial summary keys are exactly:

`order_id, total_minor, verified_minor, pending_minor, balance_minor, reserved_minor,
requestable_minor, fully_paid`.

Pricing/issue use the current `orders.lock_version`. Issue, cancel, evidence,
review and pricing increment it once. Cancel uses request version; bank edits use
bank version. Bank version starts at 1. No new order status is introduced.
Keep the same operation UUID and complete arguments across retries; new intent
requires a new UUID. Phase 4 actor guards and actor/key intent locks are reused;
a private result table preserves exact replay. A changed intent fails
`idempotency_conflict`; a fresh key cannot re-review a terminal submission.

Common errors include `unauthorized`, `not_found`, `stale_version`,
`invalid_amount`, `invalid_text`, `invalid_bank_details`, `price_required`,
`bank_not_configured`, `price_below_commitments`, `exceeds_requestable`,
`request_inactive`, `request_has_funds_or_pending`, `pending_submission_exists`,
`exceeds_request_remaining`, `receipt_not_found`, `receipt_already_submitted`,
`duplicate_transaction_reference`, `submission_already_reviewed`,
`verification_exceeds_balance`, and receipt path/metadata/object/conflict errors.
Verification references are compared case-insensitively after trimming globally
across successful manual transfers, including legacy ledger rows. Rejected
references can be corrected and reused; no gateway/refund/correction ledger exists.

## Exact accounting and locking

Money mutations accept integer minor units in `1..999999999999`.
Verified = sum of existing successful ledger `amount_minor` for the order.
Pending = sum of awaiting submissions' reported amounts; never changes balance.
Balance = total minus verified. Each active request reserves requested minus its
successful ledger sum. Requestable = total minus verified minus reservations.
Unpriced orders have null total/balance/requestable. Fully paid requires a known
positive total covered by verified funds. Percentages are parent-derived from
verified/total; pending must never enter their numerator.

Pricing cannot undercut verified plus remaining active reservations. Issue cannot
exceed requestable. Cancellation permits only wholly unpaid requests with no
pending evidence. Evidence cannot exceed the remaining request; one pending row
is allowed. Recognized amount may differ from reported, but cannot exceed request
remaining or order balance. There is no clamping, refund or historical rewrite.
All customer financial mutations emit safe order lifecycle events and notifications;
price history includes previous/new amounts and reason.

Locks: staff actor row / actor-operation advisory lock, order, request,
submission/receipt, storage object. Cross-order verification additionally locks a
normalized transaction reference before checking/inserting its ledger row.
Order locks serialize reservations, pricing, evidence and recognition.

## Receipts

Private `payment-receipts` bucket: JPEG (`jpg`/`jpeg`), PNG, WebP, PDF; maximum
3,145,728 bytes. Object path must be canonical lowercase
`customerUUID/requestUUID/randomUUID.ext`. Metadata checks include MIME/extension,
object existence, stored MIME/size, lowercase 64-character SHA-256, active owned
request and positive size. Same path and identical metadata replay; conflicts fail.

Browser INSERT/UPDATE/DELETE are denied by restrictive policies, including in the
presence of a future permissive policy. Anonymous SELECT is restricted; owner and
active staff SELECT require a registered receipt. Unregistered upload objects have
no customer/staff visibility. Registered object UPDATE/DELETE is also trigger-blocked
for service/owner SQL to preserve evidence. Registration takes an object share lock;
update/delete races either preserve the registered object or prevent registration.
Do not delete a registered receipt as an ordinary failed-upload cleanup.

Tests roll back their receipts. Parent live-test cleanup must use exact tagged IDs
and a reviewed owner transaction that restores any temporarily suspended immutable
guards, as in Phase 4; keep RLS enabled. No cleanup bypass RPC is shipped.

## Actual verification (2026-10-02)

Native PostgreSQL 17.6 full baseline plus every migration replayed successfully.
Original fields of synthetic legacy requests, a priced order and a successful
payment remained byte-equivalent JSON before/after the new migration.

- 48 existing remediation/security assertions passed.
- 58 existing Phase 4 workflow assertions passed.
- 79 Phase 5 assertions passed: unpriced/blank-bank guards, CEO-only configuration,
  reservations and price floor, stale versions, 200 requested/150 recognized/50
  remaining, partial remainder, instalment, final balance, rejection/correction,
  original snapshot retention, replay/conflicting intent, duplicate references,
  immutable ledger/history, RLS isolation, receipt formats/metadata and raw-write denial.
- Eight existing Phase 4 actual concurrent race tests passed.
- Eight Phase 5 actual concurrent race tests passed: independent-key verification,
  competing issuance, same-key pricing, cross-order normalized duplicate transfer,
  registration vs object update/delete in both lock orders. The observer confirms
  competitors actually wait on database locks.

The suites use the repository's native assertion adapter, **not** a pgTAP extension
or a complete Supabase service. Node subprocess spawning initially failed (`EPERM`)
and native `pg_ctl start` could not create a restricted Windows token. PowerShell
direct `initdb` and hidden direct `postgres.exe` launch worked; the runner's
`--external-lifecycle` mode verifies the actual disposable data directory and creates
a fresh database on fixed loopback port 55445. The caller must stop/remove that
exact disposable cluster. Normal runner mode starts/stops/removes its own cluster.

```powershell
node scripts/verify-phase5-db.mjs 'C:/Users/Young Duke/AppData/Local/Temp/tcc-phase4-pg17'
# If native subprocess launch is denied, manually launch an isolated cluster:
node scripts/verify-phase5-db.mjs 'C:/Users/Young Duke/AppData/Local/Temp/tcc-phase4-pg17' --external-lifecycle 'C:/Users/Young Duke/AppData/Local/Temp/tcc-phase5-db-worker2'
```

Not performed by Worker2: live migration/dry run, live security/performance advisors,
Auth/Storage HTTP, signed-URL expiry, actual byte validation, browser workflow,
TypeScript/lint/application tests/build, push or deployment. No application files
changed; parent owns those checks. Review live advisors after rollout, especially
the intentional deny-all private result ledger and guarded definer RPC notices.

Git checkpoint limitation: `git add` was attempted with only these four permitted
files. The sandbox denied creating
`TCC/.git/worktrees/TCC-worker2-phase5-db/index.lock`, because the worktree's Git
administrative directory is outside this workspace's writable root. No staging or
commit occurred; no commit hash is available. Parent must stage/commit the four
files from an authorized environment after review. The branch remains
`codex/phase5-db` at `74b05f6`; changes remain untracked for handoff.

Disposable cleanup limitation: the server was stopped and `pg_ctl status` confirmed
`no server running`. Recursive removal of the exact disposable directory was rejected
by tool policy (`blocked by policy`). The stopped test-only cluster remains at
`C:/Users/Young Duke/AppData/Local/Temp/tcc-phase5-db-worker2` for authorized cleanup.
It contains synthetic local data only, never credentials or production records.

Historical Worker2 status at handoff: database module locally verified, full Phase 5
not yet complete. Parent integration and production verification have since completed;
see the dated parent update above and the rollout report. No Phase 6 work was performed.
