# Phase 5 rollout report

Updated: 2026-10-06 (Africa/Lagos). Scope: manual bank-transfer requests, private receipts,
staff verification, deposits, instalments and balances. No Phase 6 work.

## Current checkpoint

Phase 5 implementation, migrations, authenticated production workflow and test-data
cleanup are complete. Application commit `f9ad898a97dd1a4e8430b3d12621c9cc62957f88`
is pushed on main and verified in READY production deployment
`dpl_LBia5c4QhdyGXVhQtY8b8sShS77T`. This report is its documentation-only closure
checkpoint; the delivery message records the follow-up commit/deployment verification.
Real bank activation remains deliberately deferred until CEO setup after approval.

## Implementation

- Admin/CEO can agree an order price with a reason, issue bounded payment requests,
  cancel eligible unpaid requests and explicitly verify or reject evidence.
- Only CEO can edit official bank fields. Fields have labelled placeholder hints,
  not payable dummy values. The live singleton is empty/unconfigured until approval.
- Clients see owned requests, immutable bank snapshots, verified/pending/balance
  summaries, payment history and dated financial activity. Evidence is never payment.
- JPEG/PNG/WebP/PDF receipt uploads are limited to 3 MB, checked against byte
  signatures, MIME and extension, and stored privately. Downloads require ownership
  or active staff and expire after 60 seconds. Receipt files cannot be overwritten.
- Integer minor units govern money. Verified entries are immutable and exactly-once;
  reported and recognized amounts may differ. All financial mutations lock the order.
- Version-fenced reads retry concurrent mutations and fail closed on contention.
  Legacy vouchers use exact authorized server lookups and retain kobo precision.

Changed areas: account/admin payment pages, order financial panels, account overview,
payment forms/history/list/details, authenticated server actions and receipt/summary
API routes, money/receipt/snapshot helpers, server workspace reads, admin pending
counts, versioned migrations and tests. See the Git checkpoint for the exact list.

## Financial calculations

- Order Total: existing `orders.total_amount_minor`, integer kobo; null means unpriced.
- Verified Paid: sum of successful immutable `payments.amount_minor` for the order.
- Pending Verification: sum of reported amounts on `awaiting_verification` submissions.
- Remaining Balance: agreed total minus verified paid; pending is never deducted.
- Payment %: integer division of `verified * 10000 / total`, then divide by 100 for
  display. It floors to two decimals so a nearly paid order cannot display 100%.
- Balance %: 100 minus displayed Payment %. Unpriced orders have no balance percentage.
- Fully Paid: an agreed positive total exists and verified funds cover it. Verification
  cannot exceed the outstanding request/order balance; no money is silently clamped.
- Active request reservations reduce the amount available for additional requests.
  A 200,000 request with 150,000 verified retains 50,000 outstanding. Multiple verified
  ledger entries aggregate without replacing earlier payments or rejected evidence.

## Database and security

Applied migrations (never edit/reapply):

- `20261002074022_phase5_payments.sql`: payment requests, submissions, receipt
  metadata, CEO bank singleton, private replay results, ledger provenance columns,
  eight guarded RPCs, immutable triggers, constraints, indexes and private Storage.
- `20261005075136_phase5_transfer_date_lagos.sql`: replaces only evidence RPC's
  calendar upper bound with Africa/Lagos. Its identity, signature, owner, EXECUTE
  ACL and pinned empty search path are unchanged. Real UTC session mismatch confirmed.

Existing `payments` remains the sole verified ledger. No replacement ledger,
gateway, refund flow or new production order status. All new public tables have
RLS and explicit read grants; direct financial writes are denied. Active staff and
customer ownership are checked inside each privileged RPC. Receipt registration is
service-only; signed downloads use the authenticated user's RLS client, not service.
Legacy service `record_verified_payment` execution is revoked. Private operation
ledgers deliberately have no public policies or grants. RLS was never disabled.

New tables: `payment_bank_settings`, `payment_requests`, `payment_submissions`,
`payment_receipts`, and `private.payment_operation_results`. Existing `payments` gains
request/submission provenance, verifier and verification time; submission linkage is
unique. Positive-amount, ownership, supported-state and immutable-history constraints
are enforced. Five immutable triggers protect requests, submissions, ledger entries,
receipt metadata and registered Storage objects. Restrictive Storage policies prohibit
browser insert/update/delete; registered receipts are owner/active-staff readable.

RPCs: `set_order_agreed_total`, `set_payment_bank_details`, `issue_payment_request`,
`cancel_payment_request`, `submit_payment_evidence`, `review_payment_submission`,
`get_order_financials`, and service-only `register_payment_receipt`. Exact signatures,
locking and constraints are documented in `supabase/PHASE5_DATABASE.md` and the
implementation contract. Client IDs and verified status are never trusted from UI.

Native PostgreSQL 17.6 full replay: 48 security + 58 Phase 4 + 79 Phase 5 assertions,
eight Phase 4 and eight Phase 5 observed concurrent races passed. Legacy columns
were preserved. Live rollback suite passed 79 assertions. The timezone replacement
also passed a live rollback test of exact body diff, preserved ACL/identity,
midnight/year boundaries and RPC acceptance/rejection under different session zones.
Before/after data fingerprints matched for both applied migrations.

## Local verification evidence

Real browser sign-in passed for temporary Client, Admin and CEO accounts. The
following browser actions ran against localhost:3001 and live Supabase, scoped
only to an explicitly synthetic QA order and accounts:

| Action | Verified funds | Pending | Balance |
| --- | ---: | ---: | ---: |
| Agree total 500,000; report deposit 200,000 | 0 | 200,000 | 500,000 |
| Staff recognizes only 150,000 | 150,000 | 0 | 350,000 |
| Report deposit remainder 50,000 | 150,000 | 50,000 | 350,000 |
| Verify remainder | 200,000 | 0 | 300,000 |
| Reject second instalment evidence | 200,000 | 0 | 300,000 |
| Resubmit and verify 150,000 instalment | 350,000 | 0 | 150,000 |
| Submit and verify final 150,000 | 500,000 | 0 | 0 |

No bank transfer occurred. Request creation and temporary CEO bank RPC were tested
in one guarded SQL transaction that restored the entire unconfigured bank row before
commit. Other sessions never saw temporary global details; only QA request snapshots
contained conspicuous NO TRANSFERS instructions. Positive request creation is SQL/RPC
verified, not claimed as a browser click while the real bank setup remains incomplete.
Browser issuance is correctly disabled until official CEO setup. The legacy voucher
displayed NGN 100.50 exactly. After a browser reconnect, the optimized-build fully-paid
screen passed, with no further-transfer form. Mobile (390), tablet (768) and desktop
(1440) passed without horizontal overflow in both themes, including rejection history,
CEO empty fields and confirmation dialogs. Light-theme feedback contrast was refined.
No browser page exceptions occurred.

Actual HTTP tests passed:

- Other-client request/summary isolation; clients cannot verify; Admin cannot edit bank.
- Receipt route: owner/Admin/CEO 303; other client 404; anonymous 401.
- Private PDF fetch succeeds, public bucket URL fails, and signed URL fails after expiry.
- Owner/staff direct Storage read is allowed; other-client read and browser uploads fail.
- Owner/other/Admin Storage deletion attempts leave the registered receipt intact.
- Anonymous/Admin/other-client uploads fail; forged PDF, MIME mismatch, oversized file
  and cross-origin upload fail. Identical upload retry returns one receipt ID;
  changed bytes under the same key return 409. Repeat verification cannot add payment.

Application: TypeScript, ESLint, 28 tests (including two timezone tests), and the
final optimized production build passed. Build generated all 68 static pages and
retained dynamic authenticated financial/receipt routes.

## Production verification (2026-10-06 Africa/Lagos)

The full browser workflow above was repeated against
https://tsquare-clothing-cafe.vercel.app on a separate explicitly synthetic order.
Real browser Client/Admin/CEO logins succeeded. Partial recognition, deposit remainder,
rejected evidence, corrected instalment and final balance all passed. Final state was
NGN 500,000 verified, zero pending, zero balance, 100% paid and no further-transfer form.
The complete HTTP security/receipt/upload suite also passed against this production
origin, including private PDF bytes, denial paths and actual expiry after 66 seconds.

Production display checks passed 390/768/1440 widths in dark/light themes, CEO blank
fields, rejection history and mobile confirmation dialogs. Screenshots were inspected;
light rejection text is rgb(190,18,60), warning text rgb(146,64,14). No browser page
exceptions occurred. No actual funds were transferred and no real order was modified.

Vercel runtime-log reads are unavailable to this connection: empty team scope returns
"Team ID is required", team listing is empty, and the observed account slug returns
403. Do not interpret this as a clean runtime-log audit. No log Drains are configured.
Application correctness is evidenced by actual authenticated browser/HTTP results,
SQL assertions and exact-SHA READY deployment metadata, not inferred from absent logs.

## Supabase advisors (2026-10-06 Africa/Lagos)

- Two INFO no-policy findings are intentional deny-all private operation ledgers.
- Thirteen WARN authenticated SECURITY DEFINER endpoints are intentional guarded
  APIs (seven Phase 5, six Phase 4). Authorization, scope, locks and fixed search paths
  were reviewed and tested; do not remove guards or broaden EXECUTE to silence notices.
- Pre-existing leaked-password protection warning remains. Owner can enable it in
  Supabase Authentication password-security settings, subject to project plan support.
- Four pre-existing missing FK indexes concern appointment/concierge tables, outside
  this phase. No Phase 5 missing FK index. Ten unused-index INFO notices remain;
  do not remove integrity/query indexes merely because the project is small/new.

References: [definer notice](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable),
[private RLS notice](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy),
[password protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection),
[FK indexes](https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys),
[unused indexes](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index).

## Environment and manual setup

Required: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
(legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY` fallback), and server-only
`SUPABASE_SECRET_KEY` (legacy `SUPABASE_SERVICE_ROLE_KEY` fallback).
Existing `NEXT_PUBLIC_SITE_URL` must match the deployment origin; demo mode remains off.
Production-scope presence was confirmed for `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `NEXT_PUBLIC_SITE_URL`
and `NEXT_PUBLIC_TCC_DEMO_MODE`. Values were not decrypted or displayed. Actual production
authentication and server-side receipt upload/download passed. No environment changes,
new secrets or `.env.local` commit were necessary.

After project approval, CEO signs in, opens `/admin/payments`, fills Official bank
details with TCC's actual bank name, account name, 10-digit number and optional
instructions, then confirms Save official bank details. Admin cannot change these.
Do not send money to test or placeholder details. New requests snapshot the saved
account; existing requests deliberately keep their original historical instructions.
No manual SQL or Storage changes are currently required; both migrations are applied.

## Git, deployment and cleanup

Branch main; database checkpoint `a5d7a6c`, derived from Worker2 `8d9ca7a`.
Application checkpoint `f9ad898a97dd1a4e8430b3d12621c9cc62957f88` is on GitHub main,
with Vercel's main branch/SHA, READY state and production alias confirmed. Final
closure changes only documentation; its exact commit, clean worktree, remote equality
and production promotion are checked after pushing and recorded in the delivery reply.

Exact-ID/tag cleanup removed four temporary Auth accounts and globally revoked their
sessions, two test staff memberships, three synthetic orders, six requests, ten
submissions, nine ledger entries (including the 100.50 legacy fixture), and twelve
receipt objects/metadata rows. Related test events, notifications and replay records
were removed. SQL confirmed zero remaining QA Auth users, sessions, profiles, staff,
orders or Storage objects, and zero financial fixture rows.

The owner cleanup transaction used exclusive table locks and restored all immutable
guards before commit; RLS stayed enabled. Storage objects were removed through the
Storage API after metadata cleanup, not by SQL deletion. All five guards remain active
and all five payment tables retain RLS. The receipt bucket remains private and 3 MB.
Before/after full-row fingerprints match across all 31 public/private tables, preserving
271 non-test rows: one order, two bespoke requests, four profiles, two staff, 24 Fits,
28 current catalogue images and six Saved Looks. The earlier 26-image count was stale;
current live images were preserved, never reset to an older baseline. The complete
empty bank singleton also retains its original fingerprint.

Disposable browser contexts were closed; temporary credentials, proof files,
screenshots and one-run verification helpers are removed before the closure push.
Both disposable PostgreSQL data directories are removed; existing Worker2 worktrees
and PostgreSQL distribution files are preserved. Removed fixtures were synthetic,
not business records; they were intentionally deleted, not archived.

Worker2 used separate `codex/phase5-db` and `codex/phase5-security-review` worktrees.
Its static review identified the financial read race and legacy voucher issues fixed
by the parent; its timezone-only migration was reviewed and runtime-tested by parent.
