# Phase 6 rollout report

Verified 2026-10-07–08 (Africa/Lagos). Application, database, security, production
workflows and exact-fixture cleanup passed. Phase 7 has not begun. This final
HTTP-status checkpoint is checked for Git equality and READY deployment
after push; its exact SHA is provided in the delivery message.

## Implemented

- Reused appointments/change requests with requested versus authoritative confirmed
  schedules, Lagos timezone, staff confirmation/reschedule/cancel/complete, reviewed
  client proposals, retained history and private staff notes. Completion has no
  financial or Order-status side effect. Optional owned Order/Request context.
- Reused Concierge conversations/messages with immutable text, safe TCC sender
  labels, contextual links, staff lifecycle controls, contiguous paginated history,
  monotonic per-side read cursors and shared Admin/CEO "read by TCC" semantics.
- Client/Admin screens, dashboard counts, notification deep links, Order appointment
  sections and unread indicators. No Realtime, attachments or external messaging.
- Session-authenticated server actions and SQL RPCs; no new service-key customer
  mutation path. Old appointment/Concierge exported actions and raw sender queries
  removed before the now-completed security-contract cutover.

### Appointments

Clients request consultation, measurement, fitting, final fitting, pickup or another
atelier visit using their authenticated profile. An Order/Request is optional but
must be owned. A request remains `requested` until staff confirms the authoritative
start/end; `confirmed`, `cancelled` and `completed` retain understandable history.
Legacy scheduled/rescheduled states remain supported. Nigeria dates use Africa/Lagos.

Client reschedule/cancellation requests need staff review and do not replace the
accepted slot while pending. Admin/CEO can also reschedule/cancel directly. Review
checks both versions, and transactional half-open overlap checks prevent obvious
single-atelier conflicts while allowing adjacent slots. Completion is permitted
only to staff after the accepted start, with no automatic Order/financial change.
Reasons, timestamps and client-visible events are retained; internal notes and
staff attribution stay private.

### Concierge, Admin and Client

Existing conversations contain immutable, bounded plain-text messages with optional
owned Request/Order/appointment context. Active Admin/CEO can reply and close,
resolve or reopen. Clients see **TCC Concierge**, not internal account identities.
Formal Phase 4 Changes Requested and Phase 5 receipts remain separate workflows.

Read cursors acknowledge only displayed contiguous messages; an arrival after that
boundary stays unread. Admin/CEO share "read by TCC", not per-employee cursors.
Message refresh is queued safely across sends; normal refresh/revalidation replaces
polling. No attachment, Realtime, email, SMS or WhatsApp service was introduced.

`/admin/appointments` and `/admin/concierge` are real list/detail workspaces with
status/time/unread filters and pagination. Appointment search is explicitly scoped
to the current page. Admin Overview shows pending appointments, today's confirmed
Lagos visits and unread activity. Navigation uses real unread data. Client Dashboard
prioritizes the next accepted visit, then pending requests, plus unread TCC replies;
terminal visits remain in history. Notifications and Order details link to context.

## Worker2 and Git

Actual second Codex account worked in its separate `codex/phase6-db` worktree.
Database commit `c6fa347` was reviewed and cherry-picked as `5c57452`.
Its separate HTTP security harness commit `f51c7a1` was reviewed and integrated as
`b8cd908`. Parent resolved Git metadata permissions through normal approved access.
Application commit `b4744b20e1ebd26449e544df107b1c27021827ed` is pushed to main.
Vercel deployment `dpl_FGqDdzhCLnR1pXt7hnBnVLA5Y9AT` is READY on the production
domain, built from that exact Git SHA in about 64 seconds. All 19 authenticated
production browser checks passed, followed by a nine-check post-contract browser
recheck. Contract and exact-fixture cleanup are complete. Documentation closure
`c308b64` also reached READY. The final narrow counts-endpoint HTTP-status correction
leaves the authenticated loader and business workflows unchanged. Remote equality,
clean worktree, its READY deployment and logged-out 401 are checked before delivery.

Production URL: https://tsquare-clothing-cafe.vercel.app
Framework: Next.js. Target: production. Worker2 never received project credentials
or direct production access. Parent independently reran its verification.

## Database and preservation

Expansion `20261006063802_phase6_atelier_expansion.sql` applied live on October 6
after an expansion-only dry run. Existing policies remain unchanged and RLS stays
enabled. Original-field fingerprints matched for all 303 pre-existing rows across
33 public/private/storage tables immediately after expansion.

Contract `20261006063803_phase6_atelier_contract.sql` applied October 7 after the new
application's exact-SHA deployment and authenticated production verification.
This contract retires the old three service-only signatures and raw sender columns;
public fitting and Phase 4 request-created appointments remain supported.
All 37 current full-row table fingerprints matched before/after the contract.
Both versions are present in remote migration history; existing policies retain
hash `ca9adf5be9bc5d9090d96717b9ff3001`, with no public table missing RLS. Catalog
privilege checks confirm old service signatures and raw sender selection are denied.

The expansion adds canonical schedules, versions, terminal timestamps, context IDs,
message sequences and read cursors; four private deny-all support tables preserve
internal attribution, staff notes and exact replay snapshots. All thirteen new RPCs
derive authority from verified session identity/live staff membership, reject
arbitrary sender/owner input and preserve idempotent retries.

The four new private tables are `atelier_operation_results`, `atelier_event_actors`,
`appointment_staff_notes` and `concierge_staff_senders`. Constraints cover paired
valid schedules, positive/unique message sequences and bounded read cursors.
RPCs use empty search paths, qualified objects and current membership/ownership
checks. Full signatures, indexes and behavior: `supabase/PHASE6_DATABASE.md`.
Existing RLS/storage policies and stable catalogue/Saved Look references are preserved.

## Verification

- Parent independently reran Worker2's native PostgreSQL 17.6 suite: 321 unique SQL
  assertions, 23 Phase 6 concurrency/replay checks and eight Phase 4 regression
  races passed. Both migration rollbacks, original-row preservation and unchanged
  RLS/storage policies passed. Native tests are not an Auth/Storage HTTP emulator.
- TypeScript, ESLint, 41 application tests and the fresh final optimized build passed,
  including all 68 generated pages. No lint rules or type errors were disabled.
- Live HTTP expansion suite: all 55 checks passed October 7. Includes four exact
  tagged QA identities, Client isolation, anonymous denial, staff authority,
  immutable messages, safe projections, replay, read-cursor race ordering and
  legacy service compatibility with deliberately invalid QA-only inputs.
- Initial local browser checks passed client appointment creation, Admin confirmation,
  client reschedule proposal, approved replacement time/duration, retained history,
  private-note isolation and persisted Concierge creation with escaped markup.
- The October 7 fresh-build browser run additionally passed four account logins,
  owned Order/Request context, CEO decline/approval and cancellation, Concierge
  round trip, dashboard unread indication, staff closure/CEO reopening and second-
  client isolation. Related Order links, 12 Concierge viewport/theme combinations
  and Client/staff navigation regression checks also passed.
- A browser check exposed native GET submission before form hydration. Shared
  AtelierForm now explicitly uses POST and disables controls until its action
  handler is ready. Independent review, the new regression test and fresh build
  pass. Actual disabled-JavaScript browser verification, CEO completion and retained
  client history pass. SQL confirms Order status and financial fields are unchanged.
- Transient PC-to-Supabase connectivity failed the first October 7 HTTP preflight
  before any writes. Public DNS/HTTP checks recovered; the complete retry passed.
- Local appointment forms/detail also pass 390/768/1440 in both themes. The reviewed
  cleanup transaction passed as a rollback-only dry run, with all 37 current table
  fingerprints unchanged. No QA data was permanently removed during the dry run.
- Full production browser workflow: 19 checks passed, including all four roles,
  schedule confirmation/change review/cancellation/completion, safe private notes,
  Concierge round trip/unread/closure/reopening, owned-context links, second-client
  isolation, both themes at all three widths, navigation and no-JavaScript privacy.
  No browser page errors were observed.
- Post-contract live HTTP suite: all 55 checks passed. Service-only legacy fitting
  intake also passed positive creation and owned requested-appointment visibility;
  anonymous and authenticated direct invocation remain denied.
- Post-contract production browser recheck: nine checks passed, including a fresh
  Client/staff server-action message round trip, navigation, responsive/themes,
  retained completion history and no-JavaScript privacy. No browser page errors.
- HTTP denial/replay tests include sender/owner/read-side spoofing, staff-only actions,
  immutable/direct-DML denial, intent conflicts, pagination, new-RPC service-key
  denial, retired signatures and raw sender identity denial. Native regression
  suites also cover the earlier security/Phase 4/Phase 5 boundaries.
- The final read-only logged-out probe found counts returned 503 for missing
  authentication. A narrow response adapter now returns 401 for AUTH_REQUIRED,
  403 for STAFF_ACCESS_DENIED and safe 503 for genuine service errors. It preserves
  private no-store caching, the existing verified-session loader and success data.
  Three regression tests cover 200/401/403/503 and sanitized error bodies. Final
  typecheck/lint/all 41 tests/build passed October 8. Actual localhost verification
  returns 401 Authentication required with private/no-store and no count data.
  The final production HTTP check uses the same assertion; no QA records were recreated.

## Supabase advisors after cleanup

All four previous missing-FK index notices are resolved. Security: six intentional
private-table/no-policy INFO notices, 26 intentionally callable guarded-definer
notices, and pre-existing disabled leaked-password protection. Performance: 15
unused-index INFO notices, expected to change with use. No RLS weakening was used.

Resolved FK columns: `appointments.bespoke_request_id`, `appointments.order_id`,
`appointment_change_requests.customer_id` and `concierge_messages.sender_id`.
Additional indexes support schedule queues, unread ranges, conversation activity,
typed context and private attribution; equivalent existing indexes were not duplicated.

References: [private deny-all tables](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy),
[guarded function review](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable),
[password protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection),
[unused indexes](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index).

## Final preservation and cleanup

All 303 original rows across all 33 baseline public/private/storage tables match
their original-field fingerprints after cleanup. Cleanup checked every non-test
full row and restored all ten exact immutable guards within the same locked
transaction. RLS and FK enforcement were not disabled. Two rollback dry runs passed
before committing exact tagged deletions, after QA sessions were globally revoked.

Permanently removed only synthetic records: 11 appointments, 10 changes, five
conversations, 20 messages, eight private notes, one fitting intake, one context
Request/revision/Order, four profiles, two staff memberships and their exact
events/notifications/private attribution/replay rows. Four QA Auth users were then
deleted through the Auth API. SQL confirms zero QA users, identities, sessions,
refresh tokens, profiles and memberships, and empty new private QA ledgers.

All ten guards and all public/private RLS remain enabled. The original four Auth
users and four storage buckets/five objects remain. Temporary QA browser contexts,
credentials, screenshots, proofs and one-run helpers are removed before closure.
Worker2's exact stopped log-only test directory was removed; its worktree and the
PostgreSQL distribution were preserved. Disposable reference-sequence gaps are
intentionally not reset. The deleted fixtures were test data, not business records.

No real bank, receipt, payment or existing customer record was used as test data.
The Phase 5 empty-bank statement describes its older closure checkpoint, not the
current configuration; the October 6 Phase 6 baseline includes later legitimate
payment/bank activity and must remain unchanged.

## Manual configuration

**No manual infrastructure action required.** Phase 6 needs no new environment
variables, buckets, auth callbacks or external services are needed. Existing
Supabase URL/public key/server-secret configuration and localhost login are intact;
`.env.local` and QA credentials were never committed.

Recommended pre-existing hardening: enable leaked-password protection in Supabase
Authentication password-security settings if available for the project plan.

## Production observability

Connected Vercel log access returned 403. The existing CLI subsequently authenticated
and confirmed the exact project. Its bounded one-hour production error/fatal scan
returned two expected `P0001` denials, exactly matching the two synthetic IDs in the
second-Client isolation browser tests. No unexplained errors appeared in that scan.
This is not a claim of continuous monitoring or a full historical log audit; no
monitoring infrastructure was changed.

Stop after this delivery. Phase 7 requires a new user instruction.
