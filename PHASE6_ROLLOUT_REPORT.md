# Phase 6 rollout checkpoint

Updated 2026-10-07 (Africa/Lagos). **PHASE 6 IS NOT COMPLETE.**
This is an unfinished rollout checkpoint, not a production-completion claim.
Phase 7 has not begun.

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
  removed before the pending security-contract cutover.

## Worker2 and Git

Actual second Codex account worked in its separate `codex/phase6-db` worktree.
Database commit `c6fa347` was reviewed and cherry-picked as `5c57452`.
Its separate HTTP security harness commit `f51c7a1` was reviewed and integrated as
`b8cd908`. Parent resolved Git metadata permissions through normal approved access.
Application changes are not yet committed or pushed. Production remains Phase 5.

## Database and preservation

Expansion `20261006063802_phase6_atelier_expansion.sql` applied live on October 6
after an expansion-only dry run. Existing policies remain unchanged and RLS stays
enabled. Original-field fingerprints matched for all 303 pre-existing rows across
33 public/private/storage tables immediately after expansion.

Contract `20261006063803_phase6_atelier_contract.sql` is NOT applied. Apply only
after the new application is deployed and its authenticated workflows work.
This contract retires the old three service-only signatures and raw sender columns;
public fitting and Phase 4 request-created appointments remain supported.

The expansion adds canonical schedules, versions, terminal timestamps, context IDs,
message sequences and read cursors; four private deny-all support tables preserve
internal attribution, staff notes and exact replay snapshots. All thirteen new RPCs
derive authority from verified session identity/live staff membership, reject
arbitrary sender/owner input and preserve idempotent retries.

## Verified so far

- Parent independently reran Worker2's native PostgreSQL 17.6 suite: 321 unique SQL
  assertions, 23 Phase 6 concurrency/replay checks and eight Phase 4 regression
  races passed. Both migration rollbacks, original-row preservation and unchanged
  RLS/storage policies passed. Native tests are not an Auth/Storage HTTP emulator.
- TypeScript, ESLint, 38 application tests and the fresh final optimized build passed,
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

## Supabase advisors after expansion

All four previous missing-FK index notices are resolved. Security: six intentional
private-table/no-policy INFO notices, 26 intentionally callable guarded-definer
notices, and pre-existing disabled leaked-password protection. Performance: 24
unused-index INFO notices, expected to change with use. No RLS weakening was used.

References: [private deny-all tables](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy),
[guarded function review](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable),
[password protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection),
[unused indexes](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index).

## Remaining gates

Finish local full Client/Admin/CEO browser flows and responsive/theme/regression
checks; review final build; commit/push main; verify exact READY production SHA;
exercise authenticated production paths; apply/recheck contract and HTTP suite;
rerun advisors; delete only exact tagged QA fixtures/sessions/accounts; compare
original-row fingerprints; close test browsers/remove temporary artifacts; push
final evidence and verify remote equality/clean worktree.

QA identities and generated credentials remain only in the ignored
`supabase/.temp/phase6-browser-fixtures.json`. Never print or commit it. The parent
also created exact QA context Request/Order IDs ending `f40da55a5120` and
`f40da55a5121`, owned by the tagged QA client. Preserve the manifest until cleanup.
No real bank, receipt, payment or existing customer record was used as test data.
The Phase 5 empty-bank statement describes its older closure checkpoint, not the
current configuration; the October 6 Phase 6 baseline includes later legitimate
payment/bank activity and must remain unchanged.

## Manual configuration

Phase 6 introduces no new environment variables or infrastructure services.
The pre-existing leaked-password setting remains a Supabase dashboard hardening
action when supported by the project plan. Deployment and contract are still pending;
do not interpret this report as a completed production rollout.
