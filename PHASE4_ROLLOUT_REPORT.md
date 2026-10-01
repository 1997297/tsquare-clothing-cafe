# Phase 4 rollout verification

Date: 2026-10-01. Production: https://tsquare-clothing-cafe.vercel.app

## Migration root cause and recovery

`20260929140000_phase4_commission_core.sql` failed with SQLSTATE 42601
(syntax error at end of input) while defining `private.commission_payload`.
An ELSIF boolean expression contained an unparenthesized CASE expression.
Three embedded CASE expressions were parenthesized. This was reproduced and
corrected on native PostgreSQL 17.6 before production application; terminator
changes alone were not sufficient.

The pre-expansion baseline matched 552 live schema definitions. Ordered local
replay passed 48 security assertions, 58 workflow assertions and eight real
concurrent storage/workflow cases. This used a minimal assertion adapter, not
the pgTAP extension or a complete local Supabase service stack.

## Live database and security

- Compatible expansion `20260929140000` applied after its isolated dry-run.
- Application deployed and real request-to-order workflow verified.
- Security contract `20260929140100` then dry-run and applied separately.
- Both versions confirmed in remote migration history.
- Post-contract live rollback suites: 48 security and 58 workflow assertions passed.
- Real Supabase HTTP tests: 23 authentication/authorization checks passed.
- All public tables retain RLS; raw private request columns and direct workflow
  writes are denied. Guarded RPCs enforce owner/staff identity, current approval,
  expected version and idempotency. No service-role credential reaches the client.

## Workflow evidence

Production browser tests passed Client/Admin/CEO login, dashboard, Fit detail,
MAKE THIS MINE, request creation, staff review, changes requested, visible staff
message, client resubmission, revision-2 approval, explicit order conversion,
production progression through completion and wardrobe creation. Accepted manual
measurements retained their 104 cm unit and revised instructions. Unrelated clients
received no request/order access; Admin was denied CEO-only Staff access.

Decline/conversion denial, stale decisions, immutable revisions and replay safety
passed database tests. Actual HTTP retries returned the same order without duplicates.
Decline was not separately repeated in the production browser.

Two small browser defects were corrected: contact inputs remounted on every keystroke
(stable module-level field component), and the change-style link used nonexistent
`/styles` (corrected to `/collections`). Real keyboard name/phone entry and contact
method selection passed in production at `6eb82d5`. The navigation fix does not
change authentication or database behavior.

## Application and cleanup

TypeScript, ESLint, all 20 tests and optimized Next.js production build (67 routes)
passed after the final navigation edit. Local browser verification uses port 3001.

The four temporary accounts had global sessions revoked and were deleted. Their
request/order, revisions, events, notifications, wardrobe entry and staff rows were
removed with exact-ID/tag guards. The immutable-revision trigger bypass was confined
to an exclusively locked cleanup transaction and restored before commit. RLS stayed
enabled. No temporary Auth users or sessions remain.

Before/after cleanup fingerprints match across 13 tables. Legitimate data retained:
2 requests, 1 order, 4 profiles, 2 staff, 24 Fits, 26 images and 6 Saved Looks.
A real staff member converted an original request during rollout; that legitimate
order was deliberately preserved. Temporary reference sequences may contain harmless
gaps from rolled-back tests. Disposable stopped database clusters and obsolete
credential manifests/screenshots were removed; unrelated worktrees were preserved.

## Advisor review and limitations

The post-contract security/performance advisors were rerun on 2026-10-01:

- [Private ledger without policies](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy): intentional deny-all access.
- [Six authenticated SECURITY DEFINER RPCs](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable): intentional guarded workflow endpoints, tested against unauthorized callers; pinned search paths and restricted grants retained.
- [Leaked-password protection disabled](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection): preexisting manual setting. Enable in Supabase Auth password-security settings when available for the project plan.
- [Four unindexed foreign keys](https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys): unrelated appointment/concierge tables. Fourteen unused-index notices are informational; protective new indexes were retained.

No Phase 4 blocking advisor regression was identified. Vercel deployment metadata
and browser checks are available; a centralized runtime-log scan was not available
through this connector's account/team scope. Do not treat browser checks as a
complete production error-log audit.

## Git and deployment checkpoint

Application checkpoint `2b5697c` and contact/concurrency checkpoint `6eb82d5` are on
GitHub main. READY deployment `dpl_7rkQm4eBqk8h34f6FQD8M9UVWdCK` serves `6eb82d5`.
The final navigation/documentation checkpoint is pending push and production check.
Verify exact HEAD/origin/main equality and the Vercel deployment SHA before calling
this final checkpoint complete. `.env.local` and temporary credentials are ignored.

Phase 5 is authorized next but has not been implemented. No official bank details
have been supplied; do not invent them. Phase 6 is not authorized.
