# TSquare Clothing Cafe — Project Handoff

Last updated: 2026-10-01

## Current status

Phase 3 is deployed. Phase 4's backward-compatible database expansion is now live;
the application deployment and final security contract are still pending. Phase 5
must not start until production workflow verification and the contract are complete.

The primary Phase 3 implementation is present on `main` in commit `26f8f82` (`Acc Migrations`).

The public catalogue still uses stable Fit IDs, while active Admin and CEO staff can manage catalogue records through the protected `/admin/collections` area. Existing customer Saved Looks remain intact.

Worker2's isolated database checkpoint was merged into local `main` as `1271b2c`.
The later application/integration fixes are still uncommitted at this checkpoint.
The required backward-compatible expansion has been applied, so the reviewed and
verified Phase 4 application can now be committed and pushed.

## Completed architecture

- Phase 1: database-backed catalogue architecture and public Fit/collection integration.
- Phase 2: active Admin/CEO authorization, protected staff routes, staff profile handling, and RLS foundations.
- Phase 3: Admin/CEO catalogue management for categories, Fits, galleries, fabrics, colours, publication lifecycle, staff preview, and safe archive/deactivation.
- Phase 4 (application local; database expansion live): authenticated request submission, staff review,
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
- Next: finish local app checks, commit/push main, verify the actual production SHA
  and real browser workflows, then dry-run/apply the security contract. Rerun live
  authorization tests/advisors and clean temporary tests before the final checkpoint.
- Current production is still Phase 3: Vercel deployment
  `dpl_FPzoLhcxA31zWThyc5TGkCBC9gXa`, main SHA
  `9d6894f70c70f001aa6ffbd4ec517087dbe9c5e3`. Connector calls need empty `teamId`
  for the connected account scope; passing the account's team ID returns 403.

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
- Post-expansion advisors: intentional deny-all private operation ledger and guarded
  SECURITY DEFINER RPC notices; preexisting leaked-password protection warning;
  four unrelated missing FK indexes and low-usage index notices. Recheck after contract.
- Supabase migration rollback tests: passed before application.
- Supabase catalogue security checks: anonymous insert denied; browser Fit deletion denied; gallery RPC uses invoker rights.
- Supabase advisors: no Phase 3 security issue; catalogue policy duplication and uploader index findings were remediated.
- Real temporary CRUD lifecycle under active-staff RLS: create draft, assign options, add/update/reorder gallery metadata, publish, anonymous visibility, archive, anonymous hiding, deactivate, exact cleanup — passed.
- Cleanup check: zero temporary Phase 3 validation records remain.
- Public browser verification on port 3001: all 24 Fits rendered; a real Fit detail loaded its three-image gallery and live option data; mobile collection layout was visually checked.

Full authenticated Admin UI browser verification still needs a valid staff sign-in password. The project/database password provided previously is not an Auth user password, and no staff credentials were changed during verification.

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

