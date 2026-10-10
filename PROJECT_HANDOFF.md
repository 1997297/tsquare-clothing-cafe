# TSquare Clothing Cafe — Project Handoff

Last updated: 2026-10-10 (Africa/Lagos)

## Current status

Phases 1–6 are complete. The Phase 7 entry gate freshly verified clean `main`,
HEAD/origin/main/remote equality at `76bbb53318cff0ac541dc5354e42fa4bfdcc7712`,
and production alias https://tsquare-clothing-cafe.vercel.app assigned to READY
deployment `dpl_FK3c3Fc7dtRtecTF5rt1CpbZDKsQ` at that exact SHA.
Phase 7 implementation and its final authentication release gate have passed.
This remains the final development phase; no Phase 8 is authorized. The user has
now authorized the separate post-Phase-7 Stage 1 corrections described below.

### Post-Phase-7 Stage 1 corrections — verification in progress

- Read `STAGE1_CORRECTIONS_REPORT.md`. Seven scoped corrections are implemented
  locally: Fit lifecycle/photos, payment-card balances/action, staff/client
  navigation and session-cookie persistence. No Stage 2/3 or redesign.
- Entry SHA is `4b77b5e6d40a2d0b19fb4ee0c273d4467841a0ce`, main equals GitHub.
  Stage 1 implementation is pushed as `be14098c07833024decd452459dfc53f4e6038a7`.
  Vercel production is READY on `dpl_6zhCD6KtBNoZYU4FwiteB3dyGE2L`, branch main,
  exact implementation SHA. Git push did not queue a deployment, so the authorized
  rollout used the Vercel Git-source API with that exact SHA; settings were preserved.
- Latest local optimized build (68 pages), typecheck, lint and all 62 tests pass.
  Offline native PG replay passed all suites, including 79 payment assertions,
  56 people assertions and 38 workflow/concurrency checks. Disposable PG data removed.
- Read-only production ledger confirms the reported 360000/260000/100000 example.
  Request remainder was mislabeled as order remainder; no financial row was changed.
- Baseline: 38 tables/327 legitimate rows, five existing Auth users/password hashes,
  all RLS enabled and no disabled application triggers. Stored only in ignored
  `supabase/.temp/stage1-state.json`; never commit this file or print credentials.
- Three Stage 1 QA identities and two QA staff memberships now exist. They are
  recorded by exact ID and metadata tag in that manifest. Do not confuse them with
  the already-deleted Phase 7 email fixtures. A QA CEO was rotated after a harness
  cookie-parser error; old user/sessions/refresh tokens were verified absent.
- Local browser checks use port 3001 and `stage1-browser.mjs` / `stage1-session.mjs`
  in ignored temp storage. The final 39-check responsive/auth matrix passed with
  settled-page screenshots, plus six real token-refresh/browser-restart checks and
  seven Fit upload/retry/publication/archive checks. Live role/financial/media
  isolation probes passed. The production 39-check matrix, seven Fit checks and six
  refresh/restart checks also passed. Forced-expiry harness injection must navigate
  away from the active page first, avoiding a race with browser auto-refresh.
- User approved reuse of anselmkarsten179@gmail.com for one real-mailbox test,
  with the user supplying actual email links. The first signup passed pre-confirmation
  denial, but its delivered link confirmed the account without completing the app
  session. That callback failure is unresolved, not a passed release gate. Its browser
  verifier matched the stored challenge; the old callback swallowed the error code.
  That exact temporary email user/sessions were revoked/deleted, SQL zero confirmed.
  A narrow follow-up adds secret-safe callback reasons, optional SDK PKCE flow-ID
  selection and migration of the SDK's per-flow verifier cookies; 63 tests pass.
  Follow-up typecheck, lint, 63 tests and clean optimized build (68 pages) passed.
  An overlapping TCC dev server was stopped before the clean rebuild; the initial
  shared-cache build failed at /icon.svg. Clean build used the existing catalogue
  fallback when live fetches failed, so this alone is not a live-catalogue check.
  Follow-up deployment and a fresh actual-email regression remain pending. Resume
  ignored stage1-email-state.json/command.json only after checking the live phase;
  stage1-email.mjs watches newly saved links and retains its own browser for PKCE.
  Confirm email is live ON; Site URL and callback allowlist use production only.
  Do not change existing passwords or add localhost URLs to production settings.
- Remaining: finish browser/auth/upload regressions, real email confirmation and
  recovery on the corrected deployment, exact QA cleanup/baseline comparison,
  secret review, reports, main push and exact READY/SHA/clean-worktree checkpoint.
  Production bank settings, payments, legitimate users and original assets must remain.

### Phase 7 release checkpoint — authentication gate passed

- EMAIL-GATE COMPLETE, October 9: Confirm email is verified ON by public Auth
  settings (`mailer_autoconfirm=false`) and authenticated CLI `config pull --dry-run`.
  Live Site URL is `https://tsquare-clothing-cafe.vercel.app`; live redirect list
  contains `https://tsquare-clothing-cafe.vercel.app/auth/callback`. No config was
  changed. HEAD/origin/GitHub main equal `97de604fa048771c5d257557f9ffa91e621fd519`;
  production alias was verified READY on `dpl_3J2RrL5Q27Tv32Hrz9CzdjHHRkgA` at that
  SHA for the actual email tests. The final docs-only SHA/READY checkpoint is recorded
  in the delivery message after its push; do not confuse these two checkpoints.
- Approved real-mailbox signup used the production UI after checking the address was
  absent. Signup returned 200/no session; password login returned 400/email_not_confirmed;
  protected /account redirected to sign-in. SQL verified zero pre-confirmation sessions
  and refresh tokens. Actual user-supplied confirmation-email link then passed the
  production PKCE callback (307 to /account) at 16:40:37 UTC / 17:40:37 WAT. Session
  survived reload; fresh password login and protected SSR/API access also passed.
- Production Forgot Password sent an actual email at 16:41:38 UTC / 17:41:38 WAT.
  Its delivered link passed the callback (307 to /auth/reset-password); the authenticated
  reset form was displayed. No password was changed, including the QA password.
  No admin-generated link was used. Earlier consumed/expired email links were identified
  through Auth logs; a normal resend with fresh PKCE resolved that test-link issue.
- Exact Auth IDs `f9659c33-6b8b-473d-a573-1e5f04049c9e` and
  `bf6e9296-4a73-4ed6-b95e-dad29f282940` are now deleted through the Auth API after
  global session revocation. SQL confirms zero users/profiles/sessions/refresh tokens
  for both. No staff/business fixture was created. The disposable browsers closed and
  all four local email-test files, including credentials and consumed links, were removed.
  Do not recreate fixtures or try to resume the deleted helper/session manifest.
- Fresh post-cleanup comparison matched all 38 tables/327 legitimate rows exactly,
  including bank configuration, payments, four buckets and seven storage objects.
  All five existing passwords remain unchanged; five legitimate Auth users remain.
  Zero public/private application tables lack RLS; zero application triggers are disabled.
  Existing Client/Admin/CEO dashboards were explicitly confirmed accessible by the user
  on October 9: user-verified access, not automated use of legitimate credentials.
  No code, environment, schema, RLS, bank or SMTP changes were made in this closure pass.

- Client directory/dossier and CEO Admin onboarding/status/history are implemented
  and deployed. No Phase 8 or new messaging/payment infrastructure was introduced.
- Application repair commit `5ed69195fb06e227cb8e9ff2c226c25292f85e31` is pushed
  to main. Exact production alias was verified READY on
  `dpl_EqyPVXKxR8a1prv7ossWHJexXayu`. Local and origin/main were equal/clean after
  this push. The documentation-only follow-up also requires exact Git/READY equality.
- Typecheck, lint, all 52 tests and optimized Next 15.5.27 build (68 pages) passed.
  Production dependency audit is clear. Nine development-tool findings remain
  classified in TCC_TECHNICAL_HANDOVER.md; no forced major upgrade was made.
- Additive migration `20261008002757_phase7_people_management.sql` is live; all 16
  migration files are applied. Native PostgreSQL replay passed 377 SQL assertions,
  seven staff concurrency/replay checks, eight Phase 4 races and 23 Phase 6 checks.
- Full synthetic browser journey passed locally against live Supabase: profile,
  measurements, Saved Look, request/change/revision/approval/conversion, partial
  payment/synthetic receipt/exact balance, appointment, Concierge, completed wardrobe.
  No real bank transfer occurred. All 38 live HTTP security/isolation checks passed.
- Exact repaired production passed the 151-check all-role responsive/theme/invalid
  reference/private receipt/SSR-form matrix, 11 completed-journey rechecks, and both
  modal keyboard tests. No browser exceptions or horizontal overflow were recorded.
  Bounded CLI error scan of that deployment over one hour returned no error rows.
  Connector build-log access returned 403; scoped CLI inspection/logs succeeded.
  This is not continuous monitoring or a guarantee about older deployments.
- Repairs include owned UUID/readable Request links, saved_styles.saved_at in the
  dossier, route-tree-based SiteLayout for root 404 hydration, focus containment/
  restoration in confirmation and catalogue option dialogs, truthful contact copy,
  explicit same-origin signup callback and compatible dependency security patches.
- FINAL QA CLEANUP COMPLETE: six tagged Auth users, sessions/refresh tokens, three
  test staff memberships, synthetic business/financial records and one receipt object
  were removed after an exact rollback rehearsal. Do not recreate the completed
  workflow fixtures. All 15 affected immutable guards are enabled; no RLS was weakened.
  A transaction verified all 316 non-QA rows across 36 public/private tables unchanged.
- Final comparison preserves all 326 original-field row fingerprints across the
  37 pre-migration tables, including all seven original storage objects/four buckets.
  One additional legitimate profile/Auth user created during testing was also retained:
  five real users remain. Final table set has 38 tables/327 rows. Final email-pass
  bank aggregate full-row hash is `1ac370f4d4507fa6d601704f1199046a` (the earlier
  Phase 7 hash used a different serialization). Never restore the older empty bank state.
- Final advisors: seven intentional private deny-all INFO, 31 guarded-definer WARN,
  14 unused-index INFO and one existing leaked-password warning; no missing-FK finding.
  Secret scan: 436 source/browser assets, zero known-secret matches, private files
  untracked. Rerun if source changes. All 29 generated Phase 7 temporary files
  (credential manifest, screenshots, receipt, helpers and proofs) were removed after
  documenting results; unrelated temp files/runtime/worktrees were preserved. All QA
  browsers closed, including the two stale helper processes. Port 3001 serves the
  verified local production build for the user.
- RESOLVED BLOCKER: hosted Auth previously had `mailer_autoconfirm=true`; the owner
  enabled Confirm email and actual inbox/callback/login/recovery testing now passes.
  Preserve current SMTP and URL settings. Previously autoconfirmed accounts are not
  retroactively inbox-verified; CEO must independently verify intended staff identities.
- PHASE7_ROLLOUT_REPORT.md contains all 17 sections and distinguishes no remaining
  functional blockers from post-approval business/legal decisions, accepted security
  maintenance and future enhancements. Technical handover reflects verified live Auth.
  Final docs-only Git equality, clean worktree and exact READY deployment are checked
  after this commit; the delivery message records that checkpoint and completion.

Final HTTP-status correction: after c308b64 reached READY, a read-only
logged-out probe found /api/atelier/counts returned 503 for AUTH_REQUIRED. The narrow
response adapter now distinguishes 401/403 from genuine 503 outages, keeps private
no-store and leaves getAtelierCounts authentication/data loading unchanged. Three
regression tests were added; typecheck/lint/all 41 tests/optimized build passed.
Local HTTP verification passed: 401 Authentication required, private/no-store and
no exposed counts. The final Phase 6 SHA/READY equality was verified at Phase 7 entry.
Do not recreate cleaned QA data; authenticated success output is unchanged and
regression-tested. The final commit/SHA check is recorded in the delivery message.

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
- Verification: typecheck, lint, 41 tests, optimized build/68 pages; 321 unique
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

