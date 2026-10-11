# TCC — Stage 2 Interface Refinements & Usability

Date: 11 October 2026 (Africa/Lagos)

Status: all Stage 2 application, production smoke and account-cleanup gates passed.
The final documentation-only Git/READY checkpoint is verified after this report's
commit and recorded in the delivery message; a document cannot embed its own SHA.

## 1. CEO bank account card

Configured bank details now open as a solid, read-only card with an Edit action.
The separated editor is prefilled, supports Save Changes/Cancel, and uses the existing
confirmation dialog, CEO server action, validation, version check and retry key.
Successful persistence closes the editor, refreshes the server data and announces success.
Failure keeps the editor open. Unconfigured accounts show an explicit setup state.
Keyboard focus enters the editor after hydration and returns to Edit on dismissal.

Save/failure/retry behavior is tested with actual components and explicitly mocked actions.
No successful bank-save call is made against production, including an identical-value save.
Admin display remains read-only; Clients do not receive bank-settings controls.

## 2. Client payment transfer card

Payment details separate request amounts from a dedicated Transfer To card, stacked
on mobile and beside the request summary on wide screens. The card consumes the
request's immutable bank snapshot, not today's bank-settings singleton. Copy Account
Number copies the exact string, including leading zeroes, with truthful success or
manual-copy feedback. Cancelled/satisfied/pending-review transfer warnings remain.
Receipt instructions and whole-order financial figures retain their existing meaning.

## 3. Concierge layout and interaction

Client messages stay left and TCC messages right for all three roles. Distinct muted
bubbles, sender labels and WAT timestamps preserve chronological order. Staff replies
render publicly as TCC Concierge, without private staff names. Plain text stays escaped;
long text and URLs wrap. The composer is below history; Refresh is below the composer.

The bounded, keyboard-focusable history follows new messages when near the bottom.
Readers viewing earlier messages retain their position and receive a View latest action.
Existing contiguous pagination, queued refresh after sending, shared read boundaries,
loading/error handling and read-status retry remain. No Realtime or new infrastructure.

## 4. Appointment language

Shared presentation helpers distinguish Preferred Date & Time, Confirmed Date & Time,
and Recorded Date & Time for completed/cancelled visits. Change proposals are labelled
Reschedule Request or Cancellation Request, with Awaiting TCC review separate from
approval. Nigerian dates/times use Africa/Lagos/WAT. History has human-readable labels
and a safe fallback rather than raw event/RPC identifiers.

Staff request detail replaces the appointment JSON object with allowlisted purpose,
preferred time and client note, explicitly not a confirmed booking. Appointment pages,
client dashboard, request/order detail and staff client dossier use consistent wording.
Private staff notes, actual statuses and scheduling rules remain unchanged.

## 5. Decorative eyebrow removal

Removed decorative headings from public marketing/catalogue/auth/legal pages,
Client and Admin/CEO pages, shared headers and relevant review/profile panels.
Removed label-only wrappers and adjusted dependent title spacing. Meaningful page
titles, supporting copy, form/accessibility labels, status/category/navigation labels,
payment instructions, Fit/request/conversation references and numbered form steps remain.
No design-system replacement or comprehensive theme redesign was introduced.

## 6. Responsive and accessibility verification

The isolated real-component browser matrix covers 390, 768 and 1440 pixels in both
themes: CEO display/edit/cancel/save, Admin read-only state, Client snapshot copying,
all-role Concierge sides/escaping/scrolling/sending, and appointment semantics.
Keyboard editor focus and native confirmation-dialog containment, live status/error
feedback, clipboard denial, unconfigured setup, queued refresh, pagination and retry
are included. Screenshot review uses the actual compiled fonts/CSS. All 48 checks
passed, including the final two-theme bubble-colour separation assertion. No overflow
or uncaught browser exception was observed. The actual Next.js local role matrix also
passed 36 grouped checks: public pages, sign-in/guards, all-role Payments/Appointments/
Concierge, CEO Edit/Cancel without saving, staff real-record details and exact copy.

## 7. Security and production data preservation

No migration, policy, server-auth/callback, environment, ledger, payment verification,
order-state or scheduling changes. Existing CEO-only bank RPC checks and optimistic
concurrency remain. Eight live read/security checks passed: Client/Admin bank writes
denied, unrelated-client financial/appointment/conversation reads isolated, foreign
thread RPC denied, and original row/security fingerprints preserved.

Four tagged temporary Auth identities were created solely for role-specific checks;
only their own profiles and two staff memberships were added. No business fixture,
payment, appointment, conversation, storage upload or email was created. Authenticated
site smoke blocks every same-origin application POST, including automatic mark-read,
so browsing legitimate conversations cannot change their shared unread state.
Browser denial checks inspect the not-found page/noindex marker and absence of
protected content: an App Router streamed not-found page may already have a 200
response header. Live database/RPC isolation is independently checked, not inferred
from the browser HTTP status alone.

Baseline: 38 tables / 327 original rows, five original Auth identities/password hashes,
four buckets and seven objects. Production bank saving is intentionally not exercised; local mocked
save tests are not represented as live database-persistence tests.

**Final preservation and cleanup, 18:34 WAT:** zero tagged QA users, profiles, staff
memberships, sessions or refresh tokens remain. Cleanup first checked every application/
Storage UUID reference and Storage owner_id for unexpected business ownership.
Five legitimate Auth users remain; all five original password hashes match. Bank
configuration, verified-payment rows, original order, four buckets/seven objects and
RLS/policy/trigger fingerprints match. No application table lacks RLS or has disabled
application triggers.

Do not mistake concurrent legitimate use for QA activity: the original active CEO
converted a confirmed request at 18:22 WAT, confirmed measurements, set its new order
price and issued a payment request by 18:28 WAT. All five audit events and six added
operation/result rows belong to an original actor, never a QA identity. There are now
345 rows across the same 38 tables, including two orders and two payment requests.
326 original rows are byte-for-byte fingerprint matches. For the one converted
request, a READ-ONLY reconstruction of the prior status/version/timestamp exactly
matches its original fingerprint, and the new order/event timestamps match the
conversion. No rollback or restoration was performed. All 18 newly added legitimate
rows, including notifications and financial activity, were preserved.

Read-only Supabase advisors are unchanged: seven intentional deny-all INFO, 31 guarded
SECURITY DEFINER WARN, 14 unused-index INFO and the existing leaked-password-protection
WARN. No RLS weakening or new finding. A known-secret scan checked 438 source/browser
assets with zero matches and zero tracked private env/temp files. The final scan,
including this report and the final production bundle, checked 439 files: zero matches.

## 8. Tests and build

- Final TypeScript, ESLint, 70 application tests and optimized build (68 generated
  pages) passed after the colour and auth-heading spacing refinements.
- Final isolated browser suite: 48 checks passed, zero production writes.
- Live permission/isolation/preservation checks: eight passed.
- Actual local Next.js role smoke: 36 passed, zero browser exceptions/business POSTs.
- Exact READY production Next.js role smoke: 36 passed, zero browser exceptions or
  business POSTs. Client/Admin/CEO password login, dashboards, permissions and the
  same 390/768/1440 light/dark checks all passed.
- Exact four-account/session cleanup and the concurrent-activity-aware preservation
  comparison above: passed. No existing password was used or changed; no email sent.

Reusable verification: `npm run typecheck`, `npm run lint`, `npm test`,
`npm run build`, then `node scripts/verify-stage2-ui.mjs` with port 3001 free.
The browser harness deliberately mocks server actions, blocks external requests and
does not load credentials. Set CHROME_PATH if Chrome is installed elsewhere.

## 9. Git checkpoint

Entry main/local/origin/GitHub were equal and clean at
`3bb9505f1f1eeab215ad705ed73fadde307b8121`.
Stage 2 application commit `2a441c89c0a9e6289d81f210335a571c7ce60ee9` is pushed
to main. Local HEAD/origin/main matched with a clean worktree after that push.
The final closure commit changes only this report and PROJECT_HANDOFF.md. Verify its
HEAD/origin/GitHub equality, clean worktree and exact READY alias after push; the
delivery message records the final documentation SHA and deployment ID.

## 10. Production deployment

Entry production was READY on `dpl_FVdvxgQ7zyEGf8A3jjjiSEhhteuN` at the entry SHA,
with https://tsquare-clothing-cafe.vercel.app assigned.

Stage 2 deployment `dpl_6eb7CtNMj8XH92B28wgWvti3WdY9` is verified READY,
production/main, at the exact application SHA above, with the public production
alias assigned. Build logs confirm successful compilation and 68 generated pages,
with zero catalogue-fallback warnings. All 36 targeted production smoke checks passed.
The documentation-only deployment is checked separately after its push.

## 11. Remaining gates / manual actions

No Stage 2 production blocker or manual Supabase/Vercel/environment action remains.
All 22 temporary QA credential, screenshot, browser-profile, proof, helper and bundle
items were removed after recording their results here. Disposable browsers are closed.
The non-secret deployment-inspection helper is removed after the final Git/READY
checkpoint. The documentation push and exact READY check are recorded in delivery.
The existing leaked-password setting is optional previously documented hardening,
not a newly introduced Stage 2 blocker. Stage 3 and Phase 8 have not begun.

### Files changed

Core: `BankAccountCard`, `PaymentForms`, `PaymentDetail`, `ClientForm`,
`ConciergeMessages`, `ConciergePages`, appointment forms/pages/shared service UI,
`RequestAppointmentSummary` and `atelier-presentation`.
The remaining application edits are scoped heading/appointment presentation changes
under `src/app` and shared header/review components. Added regression tests and the
isolated browser harness; updated package test command and PROJECT_HANDOFF.md.
