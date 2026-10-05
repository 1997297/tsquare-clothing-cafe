# Phase 5 rollout report

Updated: 2026-10-05. Scope: manual bank-transfer requests, private receipts,
staff verification, deposits, instalments and balances. No Phase 6 work.

## Current checkpoint

PHASE 5 IS NOT COMPLETE. Database and local authenticated workflow are verified;
the application Git push, exact-SHA production deployment and removal of temporary
fixtures are still pending at this checkpoint.

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

## Supabase advisors (2026-10-05)

- Two INFO no-policy findings are intentional deny-all private operation ledgers.
- Thirteen WARN authenticated SECURITY DEFINER endpoints are intentional guarded
  APIs (seven Phase 5, six Phase 4). Authorization, scope, locks and fixed search paths
  were reviewed and tested; do not remove guards or broaden EXECUTE to silence notices.
- Pre-existing leaked-password protection warning remains. Owner can enable it in
  Supabase Authentication password-security settings, subject to project plan support.
- Four pre-existing missing FK indexes concern appointment/concierge tables, outside
  this phase. No Phase 5 missing FK index. Sixteen unused-index INFO notices remain;
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
No secrets or `.env.local` are committed. Production receipt runtime still needs checking.
The connector exposes deployment metadata but not an environment-value inventory;
do not claim every production variable was inspected from dashboard configuration.

After project approval, CEO signs in, opens `/admin/payments`, fills Official bank
details with TCC's actual bank name, account name, 10-digit number and optional
instructions, then confirms Save official bank details. Admin cannot change these.
Do not send money to test or placeholder details. New requests snapshot the saved
account; existing requests deliberately keep their original historical instructions.
No manual SQL or Storage changes are currently required; both migrations are applied.

## Git, deployment and cleanup

Branch main; database checkpoint `a5d7a6c`, derived from Worker2 `8d9ca7a`.
Remote main is still Phase 4 `74b05f6` at this checkpoint. Final application commit,
push, `HEAD == origin/main`, clean worktree and production verification are pending.

Four temporary Auth accounts, two QA orders and their synthetic financial records
currently remain for production verification. Secret manifest and proof files are
gitignored under `supabase/.temp`. Exact-tag cleanup and session revocation are
mandatory before closure. Real customer data, catalogue IDs and Saved Looks are untouched.

Worker2 used separate `codex/phase5-db` and `codex/phase5-security-review` worktrees.
Its static review identified the financial read race and legacy voucher issues fixed
by the parent; its timezone-only migration was reviewed and runtime-tested by parent.
