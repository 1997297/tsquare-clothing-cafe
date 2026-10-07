# TSquare Clothing Cafe — Project Handoff

Last updated: 2026-10-07 (Africa/Lagos)

## Current status

Phases 1–5 are complete. Phase 6 application b4744b2 is pushed to main and live on
https://tsquare-clothing-cafe.vercel.app. Its migrations, authenticated production
workflows, security checks and exact-fixture cleanup passed. This closure checkpoint
changes documentation only; verify its Git SHA/READY promotion after push.
Phase 7 has not begun and requires explicit user authorization.

## Phase 6 completed rollout

- Appointments/fittings and Concierge are production-verified. Do not begin Phase 7
  without a new instruction. Detailed evidence: PHASE6_ROLLOUT_REPORT.md and
  supabase/PHASE6_DATABASE.md.
- Application b4744b20e1ebd26449e544df107b1c27021827ed is pushed to main and READY
  in production deployment dpl_FGqDdzhCLnR1pXt7hnBnVLA5Y9AT, public domain assigned.
  The final documentation-only closure must also be checked for exact SHA/READY
  assignment, origin/main equality and clean worktree after its push.
- Actual second-account Worker2 used branch codex/phase6-db at
  C:/Users/Young Duke/Documents/VS Codes Doc/TCC-worker2-phase6-db, thread
  01a10ed7-bd33-7cb3-8532-56464033910f. Database c6fa347 and HTTP harness f51c7a1
  were reviewed and integrated as 5c57452 and b8cd908. No shared-worktree edits,
  credentials supplied to Worker2, or Worker2 production mutation.
- Existing appointments/changes and Concierge threads/messages were extended.
  Both Admin modules are operational. New actions use session-authenticated RPCs;
  old service-based appointment/Concierge wrappers and raw sender reads are removed.
  Preserve the retained public fitting and Phase 4 appointment-creation paths.
- Canonical Lagos schedules, conflict/version guards, staff confirmation/reschedule/
  cancellation/completion, reviewed Client proposals, history/private notes,
  safe paginated messages and monotonic shared TCC read state are implemented.
  Order detail, dashboards, notification links and unread navigation use real data.
- Expansion 20261006063802 applied October 6; contract 20261006063803 applied
  October 7 only after the exact application SHA and 19 production browser checks
  passed. Both are in migration history. Never edit/reapply them.
- All 37 expanded-table full-row hashes matched across contract application.
  After exact QA cleanup, all 303 original rows across 33 baseline tables retain
  identical original-field fingerprints. Existing policies hash remains
  ca9adf5be9bc5d9090d96717b9ff3001; every public/private table retains RLS.
- Verification: typecheck, lint, 38 tests, optimized build/68 pages; 321 unique
  native SQL assertions, 23 Phase 6 concurrency/replay checks, eight Phase 4 races;
  55 live expansion and 55 live contract HTTP checks; full 19-check production
  browser workflow and nine-check post-contract recheck all passed.
- Both features passed 390/768/1440 in Dark/Light with visual review. Tests cover
  owned context, confirmation/review/decline/reschedule/cancel/complete, private
  notes, Concierge round trip/unread/closure/reopen/isolation and navigation.
  Public fitting positive HTTP compatibility passed after the contract.
- Pre-hydration form privacy was fixed: explicit POST, controls disabled until
  hydration. Regression and actual JavaScript-disabled checks pass. Message
  refresh queuing preserves visibility when sending during an existing fetch.
- QA sessions were revoked; exact synthetic records and four Auth accounts were
  removed after reviewed rollback dry runs. SQL confirms no QA identities,
  sessions, refresh tokens, profiles or staff memberships remain. All ten exact
  immutable guards are enabled. Four original Auth users and four storage
  buckets/five objects remain. No real bank/payment/customer/catalogue data changed.
- Temporary QA browsers were closed and all 70 top-level Phase 6 temp artifacts
  (including credentials, screenshots, proofs, helpers and rollout copies) removed.
  Worker2's stopped log-only temp directory was removed; its worktree and the
  PostgreSQL distribution were preserved. Never commit QA credentials.
- Final advisors: zero missing-FK warnings, six intentional private deny-all INFO,
  26 guarded-definer WARN, 15 unused-index INFO and the pre-existing leaked-password
  warning. No RLS weakening or unnecessary index deletion.
- The Vercel connector log scope returned 403; the CLI subsequently authenticated
  and confirmed the exact project. A bounded one-hour error scan returned only two
  expected P0001 denials, matching the tagged second-Client isolation test IDs.
  No unexplained errors in that window; no continuous monitoring claim.
- No new environment variables or manual infrastructure action for Phase 6.
  Recommended pre-existing hardening: enable leaked-password protection if the
  Supabase plan supports it. Keep .env.local and all secrets untracked.
- Phase 5 empty-bank statements below describe historical closure only. Legitimate
  bank/payment activity existed in the Phase 6 baseline and was preserved exactly.

## Phase 5 historical closure checkpoint

- User approved CEO-editable bank fields with placeholder hints. Real details are
  deliberately absent; the singleton is empty/unconfigured. Payment issuance stays
  blocked until CEO saves TCC's actual bank account after approval.
- Both migrations are live: 20261002074022_phase5_payments.sql and
  20261005075136_phase5_transfer_date_lagos.sql. NEVER edit/reapply them. Separate
  dry runs, row fingerprints, live rollback and calendar/ACL checks passed.
- Worker2 used separate codex/phase5-db and codex/phase5-security-review worktrees.
  Database commit 8d9ca7a was cherry-picked as a5d7a6c. Its review found mixed-read
  snapshots and two legacy voucher issues; parent fixed all three. Its date fix
  aligns evidence validation with Africa/Lagos without changing RPC privileges.
- Native PG17.6 replay: 48 security + 58 Phase 4 + 79 Phase 5 assertions and 16
  observed concurrent races passed. Live rollback suite passed 79 assertions.
- TypeScript, ESLint, 28 application tests and optimized production build passed.
  Local authenticated browser workflow passed price setting, deposit, partial
  recognition, remainder, rejection/correction, instalment and final balance.
  Fully-paid display correctly removes further-transfer forms.
- Mobile 390, tablet 768 and desktop 1440 layouts fit in both themes. Confirmation
  dialogs and CEO placeholder fields passed locally and on production. Final light
  feedback contrast was verified on the deployed application.
- Local HTTP receipt/RLS/role/origin/MIME/size/retry/expiry/immutable tests passed.
  The same complete suite and browser workflow passed on the deployed site, including
  private receipt bytes and actual signed-URL expiry. Final synthetic order reached
  NGN 500,000 verified, zero balance and Fully paid with no further-transfer form.
- Request creation/CEO configuration were tested in a guarded SQL transaction that
  restored the original bank row before commit. Other sessions never saw temporary
  global bank details; only QA requests have explicit NO TRANSFERS snapshots.
  Positive issuance is RPC-verified; real bank activation is deliberately deferred.
- Production variable names/scopes confirmed, values never displayed:
  NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  SUPABASE_SECRET_KEY, NEXT_PUBLIC_SITE_URL, NEXT_PUBLIC_TCC_DEMO_MODE.
- Advisors: two deliberate deny-all private ledgers; 13 guarded definer RPC notices;
  preexisting leaked-password warning; four unrelated missing FK indexes and ten
  unused-index INFO notices. RLS remains enabled.
- All four tagged QA Auth users/sessions, two staff memberships, three orders, six
  payment requests, ten submissions, nine synthetic payments and twelve receipt
  objects were removed. Related events/notifications/private replay results removed.
  SQL confirms zero fixtures and active immutable triggers/RLS. Storage deletion used
  its API after exact-fixture metadata cleanup under owner/exclusive transaction locks.
- Full-row before/after fingerprints matched for all 31 public/private tables and
  271 non-test rows. Bank singleton remains byte-equivalent and unconfigured.
- Test browser contexts closed; temporary manifest, proof, screenshots and one-run
  helpers removed before closure push. Parent/Worker2 disposable PG data removed;
  preserve Worker2 worktrees and the PostgreSQL distribution.
- Vercel runtime logs could not be read: connection has no listed teams, empty team
  is rejected and observed slug returns 403. No log-drain integration is configured.
  Do not claim a clean runtime-log audit; browser/HTTP/SQL verification passed.
- Detailed contract/evidence: PHASE5_ROLLOUT_REPORT.md,
  PHASE5_IMPLEMENTATION_CONTRACT.md, supabase/PHASE5_DATABASE.md.

## Completed earlier phases

Phase 1 catalogue architecture, Phase 2 active Admin/CEO authorization and Phase 3
catalogue management are implemented. Stable Fit IDs and Saved Looks are preserved.
Phase 4 authenticated request/revision/review/approval/order/production workflow is
live and verified. Both its expansion and security-contract migrations are applied.
Its final application fix is 3c7d4a9; final documentation checkpoint is 74b05f6.
See PHASE4_ROLLOUT_REPORT.md for exact deployment, SQL, HTTP, browser and cleanup
evidence. Phase 4 fixtures were removed; that statement does not refer to Phase 5.

Legitimate preserved baseline: one order, two requests, four profiles, two staff,
24 Fits, 28 current catalogue images and six Saved Looks. The earlier 26-image count
was stale; preserve current rows. A legitimate staff member created
the original order during Phase 4 testing; never restore the older zero-order count.
Connector deployment reads use empty teamId for this connected account scope.

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
- `20261002074022_phase5_payments.sql`
- `20261005075136_phase5_transfer_date_lagos.sql`
- `20261006063802_phase6_atelier_expansion.sql`
- `20261006063803_phase6_atelier_contract.sql`

Historical Phase 3/4 post-migration preservation check:

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

