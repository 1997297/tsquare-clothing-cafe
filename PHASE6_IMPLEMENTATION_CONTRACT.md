# Phase 6 implementation contract

Started 2026-10-06 (Africa/Lagos), from deployed main `b84c4bb`.
Status: application and both migrations deployed; production verification and
exact-fixture cleanup passed. Final documentation Git/READY checkpoint follows.
Scope: appointments/fittings and Concierge communication only. No Phase 7.

## Verified preflight

- Reuse `appointments`, `appointment_change_requests`, `concierge_requests` and
  `concierge_messages`; no duplicate booking/chat system.
- Live: three requested appointments (none confirmed), zero change requests,
  one conversation with three messages. These are legitimate records, not fixtures.
- Existing appointments relate optionally to an Order and/or Bespoke Request; an
  existing ownership trigger checks both. Date/time fields are legacy text.
- Public fitting intake can atomically create an authenticated customer's requested
  appointment. Phase 4 request submission can also create one. Preserve both paths.
- Existing client reschedule/cancellation and Concierge writes use service-only RPCs
  behind authenticated server actions; no operational staff mutation UI exists.
- Both Admin module pages are placeholders. Admin overview uses preferred date and
  UTC calendar boundaries; change it to authoritative confirmed times in Lagos.
- Client appointment display currently puts all rescheduled visits in past history
  and labels non-requested records as confirmed reservations. Replace those misleading
  state presentations while retaining TCC's layout/design language.
- Concierge has real persisted messages but no read cursor, staff reply workflow or
  operational inbox. Current client fetch includes sender identity; new presentation
  must expose only the appropriate sender label, not internal staff account details.
- Existing read RLS permits only owners and active Admin/CEO; raw client mutations
  are revoked. Keep RLS on and retain staff authorization/session guards.

## Live advisor baseline

Confirmed absent equivalent indexes for these four FK columns:

1. `appointment_change_requests.customer_id`
2. `appointments.bespoke_request_id`
3. `appointments.order_id`
4. `concierge_messages.sender_id`

Other baseline findings: two intentional private-ledger/no-policy INFO notices,
13 guarded authenticated SECURITY DEFINER WARN notices, one pre-existing disabled
leaked-password protection warning, ten unused-index INFO notices. Recheck after
rollout; do not weaken grants/guards or drop useful indexes to silence notices.

## Ownership and implementation boundaries

Actual second-account Worker2 uses `codex/phase6-db` in the separate
`TCC-worker2-phase6-db` worktree. Its initial task is the local database proposal
`supabase/PHASE6_DB_PROPOSAL.md`; parent reviews before assigning migration work.
Worker2 does not read credentials, mutate production, push main or edit application
files. Parent owns application/types/UI/server actions, integration, review and rollout.

The complete Worker2 proposal was reviewed and implementation authorized. Worker2
owns the new Phase 6 expansion/contract migrations, SQL tests, native verification
runner and database documentation in its isolated worktree. Main consumes the exact
proposed authenticated RPC signatures. Shared staff read state explicitly means
"read by TCC", not per-employee unread. No new strict auth.sessions revocation
contract is added or claimed; existing live membership checks/locks remain.

Client appointment cancellation requires staff review. Direct staff rescheduling
immediately establishes the new authoritative schedule. Staff attention uses real
pending/unread queues; no new staff notification fanout infrastructure is introduced.
The application removes the old service-based appointment/Concierge server actions,
and stops selecting raw message sender identity before the security contract applies.

The initial live-read approval-service failure cleared on a normal connector retry.
Worker2's network interruption was resumed using the same isolated account/thread;
do not call a partial review complete. No production records have been modified.

## Agreed application foundations

- Explicit Africa/Lagos calendar formatting and timestamp conversion, independent
  of the browser/server timezone. Accept actual calendar dates and 24-hour HH:mm;
  preserve legacy preferred strings without guessing ambiguous confirmed schedules.
- Staff supplies a 15–240 minute duration when confirming. Basic scheduling treats
  the atelier as a single appointment capacity; prevent overlapping half-open slots
  transactionally, while allowing adjacent appointments. No resource-planning engine.
- A requested date is not confirmed. A pending change leaves the existing confirmed
  slot authoritative until a staff decision. Terminal states retain history.
- Appointment completion never completes an Order or changes financial records.
- New mutations derive actor/owner/sender in the database, validate inputs in server
  actions, and preserve operation keys for retries. No browser-selected staff roles.
- Sent messages are immutable, bounded plain text, without attachments. Read updates
  acknowledge only the message boundary actually displayed, not a new arrival.
- Internal notes and staff identities must not leak in client payloads or event JSON.
- Reuse existing in-app notifications; no email, SMS, WhatsApp or Realtime service.
- Responsive 390/768/1440 and both themes, accessible confirmation dialogs, explicit
  errors and normal refresh/revalidation. No aggressive background polling.

## Implementation checkpoint (2026-10-07)

Actual Worker2 database and HTTP harness changes were reviewed and integrated as
`5c57452` and `b8cd908`. Native verification passed 321 unique SQL assertions,
23 Phase 6 concurrency/replay checks and eight Phase 4 races. Expansion is live;
all 55 live HTTP expansion checks pass. Application typecheck, lint, 38 tests and
optimized build pass. See PHASE6_ROLLOUT_REPORT.md for current rollout evidence.

## Completed rollout (2026-10-07)

Application b4744b2 is READY on the production domain. Expansion and contract are
live. All 19 production browser checks, nine post-contract browser checks and
55 checks in each live HTTP mode passed. Exact QA cleanup is complete; all 303
original rows across 33 baseline tables retain matching original-field hashes.
RLS/storage policies and all immutable guards remain enabled. See the final rollout
report and delivery message for the documentation-only Git/deployment checkpoint.

## Completion gates used

Reviewed RPC/schema contract, versioned migrations, security/concurrency/preservation
tests, application flows/dashboard integration, static checks/build, synthetic local
and production workflows, compatible migration order, advisors and exact-fixture
cleanup all passed. Commit/push the documentation closure, verify its exact READY
deployment SHA, remote equality and clean worktree, then STOP before Phase 7.
