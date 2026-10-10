# Post-Phase-7 corrections — Stage 1

Started 2026-10-10 (Africa/Lagos). In progress; not release certification.
No Stage 2, Stage 3, new development phase or redesign is authorized.

## Preflight

- Clean main at `4b77b5e6d40a2d0b19fb4ee0c273d4467841a0ce`; GitHub main matches.
- Production alias is READY on `dpl_abXzVJLmrvHxXcP9SATvMUK3cUVk`, the Phase 7
  closure deployment. Phase 7 real-email confirmation, recovery callback and cleanup
  are recorded in PHASE7_ROLLOUT_REPORT.md. No email test is silently repeated or reset.
- Catalogue uses session-authorized mutations and private catalogue-media storage.
  Upload policy requires an existing Fit; publication requires its gallery/options.
- Payment card remainder is request-specific; order financials use the verified ledger
  via get_order_financials and stable version-fenced reads. No ledger correction needed.
- Admin navigation has no vertical scrolling region; Client has horizontal tabs.
- Supabase SSR writes persistent cookies. Browser/session cookies must be normalized
  consistently in browser, server and middleware without changing PKCE or refresh tokens.

## Implementation and release checklist

- [x] Draft/Published creation choice, existing Archived editing preserved.
- [x] Local photo previews/order/cover/removal, Fit-scoped uploads and safe retry handling.
- [x] Order total/verified paid/outstanding clearly distinct from request outstanding.
- [x] Prominent Request Payment action using the existing workflow.
- [x] Staff navigation scrolls within viewport; accessible mobile drawer.
- [x] Client desktop sidebar and accessible mobile drawer, all existing routes retained.
- [x] Session-cookie persistence strategy plus restart/session-restore limitations.
- [x] Typecheck, lint, unit tests, optimized build, SQL/authorization regression.
- [x] Isolated authenticated local browser and upload tests; 390/768/1440, both themes.
- [ ] Actual delivered confirmation/recovery emails through corrected production callback.
- [ ] Production row/storage preservation; exact stage-owned test fixture cleanup.
- [ ] Secret/diff review; main commit/push; Git equality/clean; exact READY and live smoke.

## Authentication decision

Use browser-session cookies, not unload handlers, per-tab sessionStorage or disabled
Supabase persistSession. Refresh/new tabs must continue working. Keep SameSite=Lax
for email/OAuth callbacks and Secure on HTTPS. Preserve explicit cookie deletion.
Existing persistent cookie chunks should be rewritten as session cookies without
revoking legitimate sessions or changing passwords.

Browser restore may retain session cookies, so browser closure is not a guaranteed
security event. A stricter future policy would use server-enforced inactivity/session
limits or explicit reauthentication, not unreliable browser-close detection. No such
new policy is silently introduced in Stage 1.

The SDK's persistent-cookie default is stripped at its actual cookie write boundary
in browser, server and middleware. Session cookies retain path `/`, SameSite=Lax,
HTTPS Secure, chunking and explicit deletion semantics. No localStorage auth or
per-tab/unload logout is introduced. Middleware redirects carry refreshed cookies
and private/no-store. Existing sessions are migrated without revocation.

References: https://supabase.com/docs/guides/auth/server-side/advanced-guide and
https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie.

## Preservation boundaries

Never reset bank settings, verify real evidence, change existing passwords, delete
legitimate users/records or weaken RLS. Only exact stage-tagged synthetic records
may be cleaned up. The original snapshot covers 38 tables/327 rows and five Auth
users/password hashes, including the configured bank row and all original media.

## Results by correction

1. **Lifecycle:** the new-Fit control was deliberately disabled with a hidden Draft
   value. It now offers Draft/Published; Archived remains available when editing.
   Creation first persists an idempotent draft, then options/photos, then runs the
   existing publication guards. Incomplete saves remain hidden and recoverable.
2. **Photographs:** new creation picker supports multiple previews, moving images,
   first-image cover selection and removal before saving. JPEG/PNG/WebP, 8 MB,
   MIME/header checks and the existing session-authorized private bucket apply.
   UUID paths belong to the saved Fit. Retry preserves IDs/paths, recovers linked
   uploads and only removes definitely unregistered failures. Ambiguous network
   outcomes are preserved for retry, not deleted blindly. No new imagery was sourced.
3. **Payment balance:** the old card used `requestPosition().remaining`, which is
   correct for an individual paid-off request but was ambiguous as an order balance.
   Cards now separately show Order total, Verified paid on order, Order outstanding
   balance and Request outstanding amount. `get_order_financials` supplies the order
   totals within the existing order-version read fence. Live read-only verification
   and Admin/CEO UI both confirmed NGN 360,000 / 260,000 / 100,000. No ledger edits.
4. **Request Payment:** prominent button with hover, keyboard focus, pending text,
   spinner and disabled-during-navigation behavior. It opens the existing Orders
   workflow; no alternate issuance path or authorization change.
5. **Staff sidebar:** desktop navigation has a viewport-bounded scroll area; the
   mobile/tablet drawer uses a native modal dialog, focus containment/restoration,
   Escape/backdrop/navigation dismissal, safe-area padding and internal scrolling.
6. **Client sidebar:** all twelve original sections retained. Desktop sidebar and
   mobile/tablet drawer replace horizontal tabs, with active-section indication.
7. **Authentication:** all three roles passed reload/new-tab access, migration from
   persistent cookies, real refresh-token rotation through redirect, and a clean
   close/reopen of the same browser profile requiring sign-in. Session restore is
   explicitly outside that last guarantee. Real-email production regression pending.

## Verification evidence

- Latest source: typecheck, lint, all 62 application tests and optimized Next 15.5.27
  build with 68 generated pages passed. Initial sandbox spawn EPERM was an execution
  restriction; the approved build completed successfully.
- Native PostgreSQL 17.6 migration replay passed all seven existing suites (377 unique
  SQL assertions including expansion), 7 Phase 7, 8 Phase 4 and 23 Phase 6 race/replay
  checks. This was an isolated cluster, not a reset of production; its data was removed.
- Local all-role matrix: 39 checks passed, 390/768/1440 at 650px height, both themes,
  all menu items, last-item reachability, focus, drawer dismissal and no horizontal
  overflow. Settled-page screenshots visually reviewed. No uncaught browser exceptions.
- Six separate all-role checks passed expired-session refresh on redirect and actual
  clean browser restart. Disposable browser profile was closed and removed.
- Seven Fit checks passed: missing-photo publication rejected; local previews/order/
  removal; second upload interrupted; first image/draft remain private; retry creates
  exactly one published Fit/two images/one cover; public detail photograph loads;
  archive hides the Fit again. Copies of existing same-Fit local assets were used.
- Live authorization probes passed anonymous/Client staff-RPC denial, Admin versus CEO
  separation, unrelated-client financial isolation and Client catalogue/media denial.
- Read-only advisors: 7 intentional private-table deny-all INFO, 31 guarded definer
  WARN, 14 unused-index INFO and the existing leaked-password-protection warning.
  No RLS, schema, migration, Storage policy, bank or Auth configuration changed.
- 428 source/browser assets scanned: zero known server-secret or QA-password matches.
  `.env.local` and all temporary fixture/credential files remain ignored/untracked.
- Harness corrections: scoped form selectors to avoid SEO metadata; used normalized
  uppercase Fit codes; waited for route loading before screenshots. A harness parser
  error exposed a disposable QA session in diagnostics; that exact QA CEO was revoked,
  deleted and replaced. SQL confirmed zero old user/session/refresh-token remnants.
  Parser errors now suppress payloads. No legitimate credential was involved.

## Release status and remaining gates

Implementation is deployed, not yet declared fully released. Stage 1 SHA
`be14098c07833024decd452459dfc53f4e6038a7` is on GitHub main and production READY
deployment `dpl_6zhCD6KtBNoZYU4FwiteB3dyGE2L`. The 39-check production role/navigation/
payment matrix, seven production Fit tests and six role refresh/restart checks pass.
The forced-expiry harness initially raced the active browser's auto-refresh; injection
in a blank page isolated the server-refresh test and all six production checks passed.
Production QA Fits and their exact copied media have been removed after archive checks.

The owner approved the same real mailbox for a temporary confirmation/recovery test.
Live Confirm email is ON. Site URL is `https://tsquare-clothing-cafe.vercel.app` and
the allowlist contains `https://tsquare-clothing-cafe.vercel.app/auth/callback`.
These settings are preserved; the new email regression runs on production, not an
unallowlisted localhost callback. The first actual signup email passed pre-confirmation
denial. Its delivered link confirmed the temporary account but the application callback
did not establish a session. This remains an unresolved release gate: the previous
callback suppressed the underlying error, so no specific root cause is claimed.
The retained verifier matched that flow's challenge. The exact failed temporary user
and its sessions were revoked/deleted, with zero SQL remnants. No existing user changed.

A narrow follow-up adds safe callback reason/error-code diagnostics (no URLs, codes,
tokens or user details), passes an optional SDK PKCE flow identifier and recognizes
per-flow verifier/index cookies when migrating older persistent cookies. All 63 tests
pass, along with typecheck and lint. The clean optimized build generated 68 pages.
An overlapping TCC development server was stopped after a shared-cache /icon.svg
manifest failure; the clean rebuild passed. Live catalogue fetches failed during
that local build and its existing bundled fallback was used, so live production
catalogue verification remains distinct from the successful compilation.
Follow-up `fe504fcf7be0cb6e0dbe653d3622d1ef9603b619` is pushed to main and READY on
`dpl_8vSHPRAHKhnJK5wQSnQ8VnES4G7u`, with the public production alias assigned.
GitHub triggered this deployment automatically. Its 138 build events include
successful compilation and 68-page generation with zero catalogue-fallback warnings.
All 39 production role/navigation/payment checks passed again, with no browser
exceptions. Public collection/detail/sign-in pages return 200; anonymous /account
returns the expected 307. The fresh signup email was sent around 16:12 WAT October 10;
pre-confirmation denial passes. That link was saved at 17:15 WAT and Supabase
rejected it as otp_expired before issuing any callback code (303 redirect). This
observed failure is email-token expiry upstream of the application callback.
A normal public Auth resend at 17:19 WAT retained the same unconfirmed temporary
account and refreshed its session-only PKCE cookies in the original browser.
Zero sessions/refresh tokens and no password change were verified. The new actual
link is awaited. No recovery email has been requested on this attempt yet. The latest scan
covered 442 source/browser assets with zero known secret matches. At 14:49:59 UTC,
all 327 original rows, five passwords and original RLS/triggers were unchanged.

The three completed role fixtures, rotated QA CEO and first failed email attempt
are now revoked/deleted. SQL confirms zero users/profiles/staff/sessions/refresh
tokens for those five IDs. Only the fresh approved-mailbox test remains.

Remaining release gates: actual delivered confirmation/recovery callbacks,
remaining email-test identity/session cleanup,
final preservation comparison and clean synchronized Git checkpoint. The unresolved
email callback is a release blocker until a fresh actual-email test passes. No new
environment variable or migration is required. Optional leaked-password
protection remains an existing owner/plan-dependent hardening item, not a new Stage 1
regression. No Stage 2/3, SMTP replacement or forced browser-close detection is included.
