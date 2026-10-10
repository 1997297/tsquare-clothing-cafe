# TCC — Post-Phase-7 corrections: Stage 1 final report

Verified 11 October 2026 (Africa/Lagos). All seven corrections and their functional,
security, production and actual-email gates passed. No architecture blocker remains.
No Stage 2, Stage 3, new development phase or redesign was started.

Phase 7's original email tests, cleanup and release checkpoint were already complete
at entry. The Stage 1 email tests are the separately authorized regression after the
cookie changes, not an unacknowledged unfinished Phase 7 gate.

The final documentation push is followed by a fresh clean-Git/exact-READY/production
alias check. Its exact commit and deployment are recorded in the final delivery message.

## 1. Corrections and results

1. **New Fit lifecycle — passed.** The creation dropdown was deliberately disabled
   with a hidden Draft value. Draft and Published are now selectable. Creation stages
   an idempotent draft, options and photos before the existing publication guards run.
   Incomplete drafts stay private and recoverable. Archived remains available in editing.
2. **New Fit photographs — passed.** Added multiple-file selection, local previews,
   ordering, first-image cover and removal before saving. Existing private
   catalogue-media Storage and staff-session authorization are retained. JPEG/PNG/WebP,
   8 MB and actual header/MIME validation apply. Existing photographs are preserved.
3. **CEO/Admin payment balance — passed.** The old card showed the individual payment
   request's remainder, which could correctly be zero while the order still had a
   balance. The card now separately labels Order total, Verified paid on order,
   Order outstanding balance and Request outstanding amount. Existing authorized
   get_order_financials supplies order figures inside the version-fenced read.
   The reported NGN 360,000 total / 260,000 verified / 100,000 balance passed live
   read-only ledger checks and both staff UIs. No financial row, bank setting or
   payment evidence was changed. Partial/full/multiple-request and pending/rejected
   evidence cases are regression-tested; unverified funds do not reduce the balance.
4. **Request Payment visibility — passed.** A prominent button has hover, focus,
   pending text/spinner and disabled-during-navigation states. It opens the existing
   Orders workflow, preserving authorization and validation; no alternative payment flow.
5. **Staff sidebar overflow — passed.** Viewport-bounded desktop navigation scrolls
   vertically. The last item is reachable/clickable at laptop height. The native modal
   mobile/tablet drawer has keyboard focus containment/restoration, Escape/backdrop/
   navigation dismissal and safe-area padding. No extra page-level horizontal overflow.
6. **Client sidebar — passed.** All twelve existing sections/routes remain. A desktop
   sidebar and accessible mobile/tablet drawer replace the horizontal tab strip.
   Active section, internal scrolling and closing after navigation are verified.
7. **Session persistence — passed.** Browser, server and middleware normalize actual
   Supabase writes to session-only cookies, including chunked tokens and per-flow PKCE
   verifiers. HTTPS Secure, SameSite=Lax, path scope and explicit deletions are preserved.
   Refresh, new tabs, SSR and token rotation remain functional. No auth localStorage,
   unload logout or disabled Supabase session persistence was introduced.

## 2. Photograph and Storage verification

Creation uses stable Fit/upload UUIDs. A retry reuses its draft and object paths,
recovers already-linked uploads and removes only definitely unregistered failures;
ambiguous network results remain recoverable. Publication is always the last guarded step.

Seven local checks and the same seven production checks passed: missing-photo
publication rejection; previews/order/removal; intentionally interrupted second upload;
private retained draft/first image; retry resulting in one published Fit with two
images and one cover; correct public detail photograph; archive restoring public 404.
Only copies of existing photographs of the same Fit were used. No generated/external
placeholder imagery or new Storage bucket was introduced. Original stable Fit IDs,
Saved Looks and all seven original Storage objects remain unchanged.

## 3. Authentication verification and limits

All roles passed reload/new-tab access, migration of older persistent cookies,
expired-session refresh through redirects and clean close/reopen of the same browser
profile requiring sign-in. Six refresh/restart checks passed locally and in production.
The forced-expiry harness initially raced an active page's own refresh; injecting in
a blank page isolated the test and all six checks passed. This was a harness issue.

Browser session restore can retain session cookies. Browser closure is not a reliable
server-side security event, so guaranteed sign-in after every possible restart is not
promised. A stricter future policy would require explicitly approved server-enforced
session/inactivity limits or reauthentication.

Actual delivered-email tests used only the owner-approved temporary mailbox:

- Signup created no session. Password login returned email_not_confirmed, /account
  redirected to sign-in, and SQL showed zero sessions/refresh tokens before confirmation.
- The actual confirmation link completed the production PKCE callback to /account at
  about 17:21 WAT on October 10. Auth confirmation, reload and fresh password login passed.
- The actual recovery email was requested at about 17:21 WAT. Its delivered link
  completed the production callback to /auth/reset-password at 17:25 WAT. The authenticated
  reset form rendered. No password was submitted or changed, including the QA password.
- No admin-generated verification link was substituted for email delivery.
- One earlier link was rejected by Supabase as otp_expired before any callback code.
  A normal resend with fresh PKCE in the same test browser passed. The earliest swallowed
  callback failure cannot be retrospectively diagnosed; no invented root cause is claimed.
  Safe reason/error-code diagnostics now exclude URLs, tokens, verifier values and user data.
- The callback supports the SDK's optional flow identifier. This preserves compatibility;
  it is not asserted to be the proven cause of the earlier test failure.

Live settings reverified during closure, without changes:

- Confirm email: enabled.
- Site URL: https://tsquare-clothing-cafe.vercel.app
- Callback allowlist: https://tsquare-clothing-cafe.vercel.app/auth/callback

Existing legitimate passwords were never used or changed for these tests. Automated
Client/Admin/CEO access tests used isolated, correctly provisioned QA identities.

References: [Supabase SSR guidance](https://supabase.com/docs/guides/auth/server-side/advanced-guide),
[session-cookie behavior](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie).

## 4. Tests and production evidence

- TypeScript, ESLint, all 63 application tests and optimized Next.js 15.5.27 build:
  passed, 68 pages generated.
- Native PostgreSQL 17.6 replay: seven existing SQL suites, 377 unique assertions,
  including 79 payment and 56 people assertions, plus 38 concurrency/replay checks.
  This was a disposable cluster, not a production reset; its data directory was removed.
- Local and production role/navigation/payment/auth matrices: 39 checks each, including
  390/768/1440 widths, 650px height, both themes, every menu item, keyboard focus, drawer
  dismissal, last-item access and no horizontal overflow. Screenshots visually reviewed.
  All 39 production checks were repeated successfully on the authentication follow-up.
- Authorization checks passed anonymous/Client staff-RPC denial, Admin-versus-CEO
  separation, unrelated-client financial isolation and Client catalogue/media denial.
- No uncaught browser exceptions in the final matrix. Live collection/detail/sign-in
  requests returned 200; logged-out /account returned the expected 307.
- A concurrent local development server caused an initial /icon.svg build-manifest
  failure. It was stopped and the clean rebuild passed; the generated backup was removed.
  Local build-time live catalogue fetches failed and used the existing bundled fallback.
  Production verification was separate: the Vercel build had successful compilation,
  68-page generation and zero catalogue-fallback warnings across 138 build events.
- Latest known-secret scan: 428 source/browser assets, zero known server-secret or QA-
  password matches. Earlier scans also passed. .env.local and temporary files were
  ignored/untracked; no secret was committed.
- One earlier harness parser error exposed a disposable QA session in diagnostics.
  That exact QA CEO was globally revoked, deleted and replaced; zero remnants verified.
  Parser errors suppress payloads. No legitimate credential was involved.

## 5. Synthetic cleanup and production preservation

All six Stage 1 Auth identities, their profiles/staff memberships/sessions/refresh
tokens and two stale verification-flow records are removed. Three synthetic Fits and
their copied media were removed only after archive/public-404 verification. No real
payment, receipt, bank transfer, order or customer request was created for this stage.

Before final email-user deletion, 87 application UUID references and owned Storage
objects were checked: only its expected profile existed. Cleanup used exact stage-owned
identities; no broad email/domain-based deletion or RLS/trigger disabling occurred.

Final comparison at 00:33 WAT on October 11 confirms:

- All 38 tables and 327 original production rows unchanged.
- All five existing Auth users/password hashes preserved.
- All four Storage buckets and seven original objects preserved.
- Original RLS/policy fingerprints unchanged; zero unprotected application tables and
  zero disabled application triggers.
- Zero Stage 1 users, staff memberships, profiles, sessions, refresh tokens, flow states
  or catalogue Fits remain.
- Bank configuration, financial activity, appointments, messages and legitimate catalogue
  records remain intact.

The isolated QA browsers closed. Final local cleanup removed only the 34 stage-owned
temporary helpers, screenshots, proofs, credential manifests and consumed email links.
Unrelated project files, environment configuration, prior worktrees and runtimes are kept.

## 6. Git and deployment

Entry checkpoint: 4b77b5e6d40a2d0b19fb4ee0c273d4467841a0ce.
Main implementation: be14098c07833024decd452459dfc53f4e6038a7.
Authentication follow-up: fe504fcf7be0cb6e0dbe653d3622d1ef9603b619.

The follow-up is verified READY on dpl_8vSHPRAHKhnJK5wQSnQ8VnES4G7u. Documentation
checkpoint 7699443919489f4b83d3afadb08b4bc5be77d56a is READY on
dpl_3kGZDtEscwPTkPcJGxp2Zdq8ZBHr, with the production alias assigned. Later changes
are documentation only. GitHub automatic deployment worked for the follow-up and
documentation checkpoints; an explicit exact-Git-source deployment was used earlier
when no queued build was visible. No deployment/environment setting was changed.

Final closure documentation is committed/pushed after this report is written, then
HEAD/origin/GitHub equality, clean worktree and its exact READY/public-alias assignment
are checked. The final delivery message supplies that resulting SHA and deployment ID.

Main changes cover catalogue creation/gallery/upload validation; shared navigation
drawer and account/admin layouts; payment summary loading/labels/action; browser/server/
middleware cookie handling and auth callback; regression tests and handoff documentation.
No schema migration or dependency upgrade was required.

## 7. Blockers, manual actions and optional future work

**Actual production blockers: none after the successful email regression and cleanup.**
No required Supabase, Vercel, bank, SMTP or environment-variable action remains.

Unchanged advisor findings: seven intentional private-table deny-all INFO, 31 guarded
authenticated-definer WARN, 14 unused-index INFO and one existing leaked-password-
protection WARN. No new Stage 1 finding or RLS weakening was introduced.

Optional existing hardening: enable leaked-password protection if supported by the
project plan. This is not a Stage 1 functionality blocker. A stricter session-expiry
policy needs separate approval. Browser session-restore limits remain as documented.
No Stage 2/3 theme work, new major feature or Phase 8 is authorized. Stop after Stage 1.
