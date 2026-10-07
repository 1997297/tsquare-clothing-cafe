# TSquare Clothing Cafe — Project Handoff

Last updated: 2026-10-07 (Africa/Lagos)

## Current status

Phase 4 is complete. Phase 5 application commit f9ad898 is pushed to main and live
on https://tsquare-clothing-cafe.vercel.app in READY production deployment
dpl_LBia5c4QhdyGXVhQtY8b8sShS77T. Authenticated production workflow, security tests
and exact-fixture cleanup passed. Phase 5 implementation is complete. This closure
checkpoint changes documentation only; verify its Git SHA/READY promotion after push.
Phase 6 is now authorized and in progress. Phase 7 is out of scope.

## Phase 6 active handoff

- User directive: attachment 885a6256-56a0-4d5c-b81d-60099803a25c, appointments,
  fittings and Concierge; complete only Phase 6, verify production and stop.
- Phase 5 closure b84c4bb was pushed and deployed READY (dpl_7VTqkjQXiSxFL5HtnhcJGdbtng9F).
  Current Phase 6 work is not deployed; do not report completion.
- Main was clean at b84c4bb and pulled before creating codex/phase6-db at
  C:/Users/Young Duke/Documents/VS Codes Doc/TCC-worker2-phase6-db.
- Actual second-account Worker2 completed its local proposal. Parent reviewed it
  and authorized database implementation in thread 01a10ed7-bd33-7cb3-8532-56464033910f.
  It owns new Phase 6 migrations/tests/native runner/database docs in its worktree.
  Main owns application integration and this handoff. No shared-worktree edits.
- Existing appointments/change requests and Concierge threads/messages are reusable.
  Admin pages are placeholders; current client writes use service-only RPCs.
  Preserve older public-fitting and Phase 4 appointment creation during rollout.
- Main added Lagos scheduling/priority helpers, authenticated server actions, shared
  Client/Admin appointment and Concierge screens, internal-note and lifecycle UI,
  safe paginated messages/read acknowledgments, dashboard/navigation/order integration.
  Old service-based appointment/Concierge application wrappers were removed. Account
  loader no longer fetches raw message sender identity. None of this is deployed.
- Worker2 database commit c6fa347 was reviewed and cherry-picked as 5c57452 on main.
  The parent independently reran native PG17.6: 321 unique SQL assertions, 23 Phase 6
  concurrency/replay checks and eight Phase 4 races pass; both migrations roll back
  cleanly and preserve original fields, RLS and storage policies.
- Expansion 20261006063802 was applied live on 2026-10-06 after expansion-only dry
  run. All 303 original rows across 33 tables retain matching original-field hashes.
  Contract 20261006063803 MUST wait until the new application is deployed and tested.
  Application typecheck, lint, 38 tests and the final production build passed,
  including all 68 generated pages. Worker2 HTTP commit f51c7a1 was reviewed and
  integrated as b8cd908; its live expansion suite passed all 55 checks on October 7.
  Main application/tests/docs (50 files) are staged but not yet committed or pushed.
- Local browser checks passed four account logins, owned Order/Request context,
  confirmation, reviewed rescheduling, CEO decline/approval, cancellation, Concierge
  round trip, unread dashboard, closure/reopening and second-client isolation.
  Related Order links, all 12 Concierge viewport/theme combinations and navigation
  regressions also passed. A final check exposed a pre-hydration native GET form
  fallback; AtelierForm now uses POST and disables controls until hydration. The
  regression test, independent review and fresh production build pass.
  Disabled-JavaScript privacy and CEO completion also pass; SQL confirms the linked
  Order status and financial fields remain unchanged. Production workflow, contract,
  cleanup and final Git checkpoint remain.
- Exact QA context Request/Order IDs end f40da55a5120/f40da55a5121 and belong to
  the tagged QA client. Do not remove or alter any real business data. Current
  legitimate bank/payment activity postdates the historical Phase 5 empty-bank note.
- Tagged QA accounts are temporarily present for live/local browser verification;
  their exact IDs and generated credentials are in ignored
  supabase/.temp/phase6-browser-fixtures.json. Never print or commit that manifest.
  Clean only those tagged fixtures after verification, then recheck baseline hashes.
- Expansion advisors: zero missing-FK warnings, 24 unused-index INFO, six intentional
  private deny-all/no-policy INFO, 26 guarded-definer notices and the pre-existing
  leaked-password protection warning. RLS and all existing policies remain enabled.
- Live Supabase read preflight initially hit approval-service usage limits, then
  succeeded through the normal connector review on retry. Three appointments, zero
  changes, one Concierge conversation and three messages exist. Ownership/active-staff
  SELECT policies are live. Preserve these legitimate records; do not use as fixtures.
- Worker2 launch prompt/helper/log are ignored under supabase/.temp/phase6-worker2*.
  No secrets were read or supplied to Worker2. Read its proposal before implementation.

## Phase 5 current checkpoint

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

