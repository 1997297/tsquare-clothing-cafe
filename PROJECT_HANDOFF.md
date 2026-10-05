# TSquare Clothing Cafe — Project Handoff

Last updated: 2026-10-05

## Current status

Phase 4's backward-compatible expansion, application, and security contract are live
and the authenticated request-to-completed-order workflow has passed production tests.
The contact-input fix is verified live. Temporary production records, Auth users and
sessions have been removed with legitimate data preserved. The final navigation fix
is pushed and verified on production as `3c7d4a9`; this follow-up is documentation only.
Phase 4 is complete. Phase 5 is in progress: its database migration is live, but
the application is not yet pushed/deployed or authenticated-browser verified.
Phase 6 remains out of scope. Do not describe Phase 5 as complete.

## Phase 5 current checkpoint

- Phase 4 is complete. Phase 5 local implementation and database are verified;
  application push/deployment, production workflow and cleanup are next. No Phase 6.
- User approved CEO-editable bank fields with placeholder hints. Real bank details
  are not supplied: the singleton remains empty/unconfigured. Issuance is blocked
  until CEO deliberately saves official details after approval.
- Worker2 database work in codex/phase5-db was committed as 8d9ca7a and cherry-picked
  as a5d7a6c. Its separate codex/phase5-security-review worktree produced reviews and
  the narrow timezone fix. Accounts did not edit the same worktree.
- BOTH migrations are live: 20261002074022_phase5_payments.sql and
  20261005075136_phase5_transfer_date_lagos.sql. NEVER edit/reapply them. Dry runs
  listed only the intended migration each time; data fingerprints matched.
- Native PG17.6 replay passed 48 security + 58 Phase 4 + 79 Phase 5 assertions
  and 16 observed concurrent races. Live rollback suite passed 79 assertions;
  timezone follow-up passed exact-body/ACL/identity/calendar/RPC rollback checks.
- Worker2's mixed-read-snapshot and two legacy-voucher findings are fixed. The
  follow-up fixes the UTC/Lagos midnight mismatch without changing RPC permissions.
- Final TypeScript, ESLint, 28 tests and optimized production build passed.
  Browser Client/Admin/CEO authentication, pricing, deposit, partial recognition,
  remainder, rejection/resubmission, instalment and final-balance actions passed.
  Fully-paid display shows NGN 500,000 verified and zero balance, with no transfer
  form. Mobile/tablet/desktop and both themes fit; light feedback contrast refined.
- Actual HTTP verifies owner/staff private receipt access, other/anonymous denial,
  signed URL expiry, MIME/size/origin rejection, immutable upload retry, Storage
  deletion denial, client verification denial, Admin bank-edit denial and duplicate
  verification rejection. Never describe these as actual bank transfers.
- Request creation and CEO configuration were exercised in a guarded SQL transaction
  that restored the original bank row before commit; only QA request snapshots
  contain conspicuous synthetic NO TRANSFERS instructions. Global settings stayed
  unconfigured for all other sessions. Positive issuance UI awaits real CEO setup.
- Advisors: two intentional deny-all private ledgers, 13 guarded definer RPC notices,
  existing leaked-password warning, four unrelated missing FK indexes and sixteen
  unused-index INFO notices. RLS remains enabled throughout.
- TEMPORARY LIVE FIXTURES MUST BE REMOVED: four Auth users tagged
  tcc-phase5-127c78d96e81, two TCC-QA5-127C78-* orders and synthetic financial rows/
  receipt objects. Credentials are in ignored supabase/.temp/phase5-browser-fixtures.json.
  Exact-tag locked cleanup passed a rollback dry run; do not run old Phase 4 cleanup.
- Legitimate data: one order, two requests, four profiles, two staff, 24 Fits,
  26 catalogue images and six Saved Looks. Do not use these as test fixtures.
- Parent disposable PG cluster is removed. Worker2's stopped test-only cluster
  AppData/Local/Temp/tcc-phase5-db-worker2 remains for validated exact-path cleanup.
- Remaining: push main, verify READY deployment's exact SHA, authenticated production
  upload/review/read workflow, cleanup Auth/sessions/objects/screenshots, final docs.
  See PHASE5_ROLLOUT_REPORT.md and supabase/PHASE5_DATABASE.md.

The primary Phase 3 implementation is present on `main` in commit `26f8f82` (`Acc Migrations`).

The public catalogue still uses stable Fit IDs, while active Admin and CEO staff can manage catalogue records through the protected `/admin/collections` area. Existing customer Saved Looks remain intact.

Worker2's isolated database checkpoint was merged into local `main` as `1271b2c`.
The Phase 4 application checkpoint is committed and pushed as `2b5697c`.
Production testing found contact input focus loss: a nested Field component remounted
per keystroke. The stable-component fix is pushed as `6eb82d5` and real keyboard typing
passed in production. Final browser inspection also found the configurator's change-style
link targeted nonexistent `/styles`; it now uses `/collections`. No bank details have
been supplied for the queued Phase 5.

## Completed architecture

- Phase 1: database-backed catalogue architecture and public Fit/collection integration.
- Phase 2: active Admin/CEO authorization, protected staff routes, staff profile handling, and RLS foundations.
- Phase 3: Admin/CEO catalogue management for categories, Fits, galleries, fabrics, colours, publication lifecycle, staff preview, and safe archive/deactivation.
- Phase 4 (application and both database migrations live): authenticated request submission, staff review,
  client changes/resubmission, approval/decline, explicit idempotent order conversion,
  production status controls, revision snapshots, timelines, and historical media retention.

## Phase 4 rollout state

- New operational routes: `/admin/requests`, `/admin/requests/[id]`, `/admin/orders`,
  and `/admin/orders/[id]`.
- Client request/order pages now use real workflow labels, timelines, action-required
  resubmission, and no operational payment claims.
- Database files are split deliberately:
  1. `20260929140000_phase4_commission_core.sql` is the backward-compatible expansion.
  2. Deploy the Phase 4 application and verify it.
  3. `20260929140100_phase4_commission_contract.sql` retires the legacy RPCs and broad request SELECT.
- Never batch those two migrations before the Phase 4 app is live.
- The prior expansion failure was reproduced on native PostgreSQL 17.6: SQLSTATE
  42601 in `private.commission_payload`, caused by an unparenthesized CASE within
  an ELSIF condition. Three embedded CASE expressions are now parenthesized. The
  earlier claim that terminator/block fixes alone resolved this was incorrect.
- Local replay of the complete baseline and migrations passed. A read-only schema
  inventory matched 552 live baseline definitions before expansion.
- Live Supabase now includes `20260929140000_phase4_commission_core.sql`. Its linked
  dry-run listed only that migration. The staged file matched the reviewed source
  hash, and application completed successfully. Do not edit this applied migration.
- Preserved live data preflight: 2 owned `submitted` requests, 0 orders, 0 duplicate
  conversions, 0 ownerless requests/orders, and 0 populated legacy private-note rows.
- Before/after fingerprints match across 13 existing tables, including original
  request fields, profiles, staff, catalogue, Saved Looks, orders, and payments. Both
  existing requests have immutable revision snapshots; no original row was changed.
- A guarded transactional live expansion test passed 53 workflow assertions and
  rolled back all fixtures. No test users remain; the 13 fingerprints still match.
  PostgreSQL reference sequences can advance despite rollback (harmless gaps).
- Security contract `20260929140100` was dry-run separately after the application
  workflow passed, then applied successfully. Remote migration history confirms both
  migrations. Do not rerun or edit either applied file.
- Verified final application checkpoint: READY Vercel deployment
  `dpl_69qPGFRVgvuNUbmUuWn6Kzb8wxvc`, main SHA
  `3c7d4a91022eade95d580837498bbc97a5a0d09d`. Corrected change-style navigation,
  collections and sign-in page passed on localhost:3001 and production without page
  exceptions or failed responses. A transient connection reset cleared on retry.
  The final documentation-only checkpoint follows this application SHA.
  Connector calls need empty `teamId`
  for the connected account scope; passing the account's team ID returns 403.
- Production Client/Admin/CEO authentication, dashboard, Fit detail, MAKE THIS MINE,
  submission, changes requested, client resubmission, revision-2 approval, conversion,
  production stages through completion and wardrobe creation passed. Other clients
  cannot read the request/order. CEO Staff access remains denied to Admin.
- All four temporary Auth users and their sessions are removed. Exact-ID/tag guarded,
  locally validated cleanup removed only their request, order, revisions, events,
  notifications, wardrobe entry and staff memberships. The immutable revision trigger
  was restored inside the locked cleanup transaction; RLS remained enabled throughout.
- Cleanup fingerprints matched across 13 tables. Remaining legitimate records include
  2 requests, 1 order, 4 profiles, 2 staff, 24 Fits and 6 Saved Looks. No temporary
  Phase 4 SQL-suite users remain. Temporary credentials must never be committed.
- Temporary credential manifest, screenshots and stopped disposable PostgreSQL
  clusters were removed. Existing Worker2 worktrees and unrelated changes are preserved.
- A legitimate existing staff member converted an original request while testing was
  in progress. Preserve that new live order; do not try to restore the earlier zero
  orders baseline. Our browser tests operate only on tagged temporary customers.
- Worker2's second isolated read-only review of `2b5697c` found no concrete remaining
  Phase 4 RPC/authorization/retry/locking blockers. This is static, not runtime proof.

## Phase 3 functionality

- `/admin/collections`: live totals, search, filters, Fit inventory, archive controls, and reusable option management.
- `/admin/collections/new`: validated draft creation.
- `/admin/collections/[fitId]/edit`: Fit details, lifecycle, fabrics, colours, and gallery management.
- `/admin/collections/[fitId]/preview`: staff-only preview using the customer presentation with customer actions disabled.
- Gallery: private JPEG/PNG/WebP upload, 8 MB limit, Fit-scoped paths, persistent ordering, cover selection, alt text, focal position, and confirmed removal.
- Lifecycle: `draft`, `published`, and `archived`; public queries return published Fits under active categories only.
- Safe options: published Fits require an active category plus at least one active fabric, active colour, and gallery image.
- Existing public collection/category filters now derive from live catalogue data.

## Live Supabase migrations

- `20260929131433_phase3_catalogue_management.sql`
- `20260929131721_phase3_catalogue_policy_optimization.sql`
- `20260929140000_phase4_commission_core.sql`
- `20260929140100_phase4_commission_contract.sql`

Post-migration preservation check:

- 6 categories
- 24 published Fits
- 26 Fit images
- 12 reusable fabrics and 48 Fit/fabric links
- 33 reusable colours and 72 Fit/colour links
- 6 existing Saved Looks

The private `catalogue-media` bucket is configured for JPEG, PNG, and WebP objects up to 8 MB. Anonymous users can read media only for published Fits; active Admin/CEO staff can manage media.

## Verification completed

- TypeScript typecheck: passed.
- ESLint: passed.
- Node tests: 18 passed.
- Next.js production build: passed.
- Current Phase 4 application checks: TypeScript passed, ESLint passed, 20 Node tests
  passed, and the optimized Next.js build passed with all 67 routes generated.
- Phase 4 SQL: native PostgreSQL 17.6 replay passed 48 security and 58 workflow
  assertions using the repository SQL suites with a local assertion adapter (not the
  pgTAP extension or a complete local Supabase service). Four real concurrent storage
  UPDATE/DELETE versus submission tests passed. Existing synthetic rows were preserved.
- `scripts/verify-phase4-db.mjs` creates and stops an isolated disposable Windows
  PostgreSQL cluster. Its `--compare-linked` mode compares the pre-expansion baseline
  and was used before rollout; it is not a current-live-schema comparison after core.
- Worker2 performed an isolated read-only review. Retry keys now survive interrupted
  transport within each form, saved measurement intent is deterministic, measurement
  provenance is visible, and resubmitted special instructions map correctly.
- Production browser workflow passed creation, changes requested, client resubmission,
  current-revision approval, conversion, and Admin/CEO stage updates. Unrelated clients
  cannot view the request/order; Admin is denied CEO-only Staff while CEO is allowed.
- Contract dry-run listed only `20260929140100`; application succeeded and remote
  history confirms it. The complete 58-assertion lifecycle suite passed live inside
  a rolled-back transaction. The final native replay passed 48 security + 58 lifecycle
  assertions and eight real concurrent storage/workflow race cases.
- Contact input focus fix: TypeScript, ESLint, 20 tests and production build passed.
- Post-contract checks: 48 live security assertions and 58 live workflow assertions
  passed inside rolled-back transactions. All 23 actual Supabase HTTP authentication/
  RLS checks passed, including forbidden client actions and duplicate conversion.
- Final application checks after the navigation correction: TypeScript, ESLint,
  20 tests and optimized production build (67 routes) passed on 2026-10-01.
- Post-contract advisors rerun: intentional deny-all private operation ledger and six
  guarded authenticated SECURITY DEFINER RPC notices; preexisting leaked-password
  protection warning; four unrelated missing FK indexes and 14 unused-index notices.
  No Phase 4 blocking regression identified. Details: `PHASE4_ROLLOUT_REPORT.md`.
- Supabase migration rollback tests: passed before application.
- Supabase catalogue security checks: anonymous insert denied; browser Fit deletion denied; gallery RPC uses invoker rights.
- Supabase advisors: no Phase 3 security issue; catalogue policy duplication and uploader index findings were remediated.
- Real temporary CRUD lifecycle under active-staff RLS: create draft, assign options, add/update/reorder gallery metadata, publish, anonymous visibility, archive, anonymous hiding, deactivate, exact cleanup — passed.
- Cleanup check: zero temporary Phase 3 validation records remain.
- Public browser verification on port 3001: all 24 Fits rendered; a real Fit detail loaded its three-image gallery and live option data; mobile collection layout was visually checked.

Authenticated Phase 4 Client/Admin/CEO browser checks used isolated temporary accounts,
not existing staff passwords. Existing users' credentials were not changed. The final
one-line navigation fix does not change authentication, authorization or database code.

## Key files

- `src/app/admin/collections/` — management UI, server actions, Fit editor, gallery manager, and staff preview routes.
- `src/lib/catalogue-admin.ts` — shared catalogue types and mutation validation.
- `src/lib/server/catalogue-management.ts` — staff catalogue snapshot loader.
- `src/lib/catalogue-server.ts` — public published catalogue loader and private media URL signing.
- `src/components/admin/ConfirmDialog.tsx` — safe confirmation UI.
- `supabase/migrations/20260929131433_phase3_catalogue_management.sql` — Phase 3 schema, RLS, RPC, and storage.
- `supabase/migrations/20260929131721_phase3_catalogue_policy_optimization.sql` — RLS performance cleanup and uploader index.
- `tests/remediation.test.mts` and `supabase/tests/remediation_security.test.sql` — application and database security assertions.

## Environment and local run

Required public Supabase variable names:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (preferred) or `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Do not copy secret values into this file or Git. Keep them in each account's untracked `.env.local` or configured deployment environment.

Local command: `npm run dev -- -p 3001`

## Second Codex account startup

1. Obtain repository access from the owner and clone or pull the latest `main` branch.
2. Open the repository in Codex; this `AGENTS.md` will be loaded automatically.
3. Read this handoff and inspect the latest commits before making changes.
4. Configure that machine/account's untracked `.env.local` with the required variable names.
5. For independent parallel work, create a separate worktree and `codex/<task>` branch. Do not share one checked-out branch between both accounts.
6. Update this handoff whenever a task or phase is completed or paused.

## Remaining manual security setting

Supabase currently reports leaked-password protection as disabled. This is an Auth dashboard setting, not a Phase 3 code issue. Enable it in Supabase Auth password-security settings when available for the project plan.

