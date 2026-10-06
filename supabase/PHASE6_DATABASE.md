# Phase 6 atelier database contract

Worker2 deliverable on `codex/phase6-db`. Local implementation only; parent owns
application transition, authorized live migration/advisor checks and production
rollout. No live database or credential access was used by this worker.

## Migration order

1. `20261006063802_phase6_atelier_expansion.sql` expands the existing tables and
   keeps legacy service-only appointment-change, Concierge and public-fitting
   endpoints operational. Apply before the Phase 6 application.
2. `20261006063803_phase6_atelier_contract.sql` retires only the three old
   appointment-change/Concierge signatures after ALL old exported server action
   paths have transitioned. Removes unnecessary service table/column writes and
   hides raw message `sender_id` AND `sender_name` from authenticated SELECT.
   Apply only after the parent replaces message SELECT * with safe RPC projections.

Names were generated with cached Supabase CLI `migration new`, following `--help`,
`migration --help` and `migration new --help`. `DO_NOT_TRACK=1` disables telemetry
so the CLI does not write outside the workspace. No CLI login, link, push, remote
query or installation was performed. Do not reapply previous production migrations.

The approved design is documented in `PHASE6_DB_PROPOSAL.md`; this file records
the executable integration contract. Client/session architecture is unchanged:
server checks use verified user identity, DB mutations use `commission_actor`,
staff membership is checked and locked live. JWTs are not claimed to be immediately
revoked by logout. No auth.sessions change and no Phase 7 work.

## Persisted model and preservation

Reuse `appointments`, `appointment_change_requests`, `concierge_requests`,
`concierge_messages`, `lifecycle_events`, and `notifications`; no duplicate service
system. Added appointment fields: lock_version, scheduled_start_at/end_at,
confirmed_at, last_rescheduled_at, completed_at, cancelled_at,
cancelled_actor_type and cancellation_reason. Changes add lock_version,
appointment_version (submitted version) and review_reason; existing reviewed_at is
retained. Staff notes and attribution live only in private tables.

Conversation additions: lock_version, last_message_seq, client_read_seq,
staff_read_seq, client_read_at, staff_read_at, last_message_at, context_request_id,
context_order_id and context_appointment_id. Message addition: message_seq, unique
per request. Existing initial parent body remains unchanged and is not reinserted
as an extra message. Backfill orders messages by `(created_at,id)`; all original
message IDs, timestamps, text and sender fields remain stored unchanged. Both read
cursors start at 0: historical read state is unknown.

Legacy preferred date/time strings, including morning/afternoon/evening, remain
original intent. No canonical schedule is inferred. Parent's live preflight reports
three requested appointments without confirmed dates/times, zero changes, one
conversation and three messages. Local preservation fixtures mirror those counts,
plus a valid Request reference and an unresolved legacy context label. Canonical
context is backfilled only for exactly one owned match; old strings remain even if
unresolvable. Expansion emits an aggregate NOTICE of unresolved conversations.
Parent must record the actual live count and assess historical sender privacy.
Future timestamp defaults on the four Phase 6 tables use `now()` rather than a
naive timezone('utc',now()) cast; Phase 6 event/notification inserts explicitly
use now(). Historical timestamps are unchanged, and absolute instants remain
correct even when a DB session uses a timezone other than UTC.

Four previously missing FK indexes cover appointments.bespoke_request_id,
appointments.order_id, appointment_change_requests.customer_id and
concierge_messages.sender_id. Existing customer/parent indexes are not duplicated.
Additional indexes support accepted schedule queue, unread queries, activity,
typed context links and private attribution FKs.

Private append-only support tables:

- atelier_operation_results: exact safe result snapshots linked to the existing
  private commission operation ledger.
- atelier_event_actors: actual client/Admin/CEO identity keyed to the public event.
- appointment_staff_notes: immutable staff notes keyed to stable appointment ID.
- concierge_staff_senders: immutable internal staff attribution keyed to message ID.

All have RLS and no API/service table grants; no-policy advisor INFO is deliberate.
No financial, Order, Request, catalogue, Saved Look, profile or storage policy
change is introduced. No new media bucket, receipt access, attachments or Realtime.

## RPC signatures and results

Use a session-bound authenticated Supabase client. No caller client/staff identity
or sender role is accepted. Nullable parameters must be present with null; there
are no new overloads or optional-argument defaults. All functions below return
JSONB, are pinned SECURITY DEFINER with empty search_path and fully qualified
objects, and EXECUTE is granted only to authenticated, not PUBLIC/anon/service_role.

```sql
create_atelier_appointment(
 p_type text,p_preferred_date date,p_preferred_time text,
 p_order_id uuid,p_bespoke_request_id uuid,p_note text,p_operation_key uuid)
-- {appointment}

request_atelier_appointment_change(
 p_appointment_id uuid,p_change_type text,p_proposed_date date,
 p_proposed_time text,p_reason text,p_expected_version bigint,p_operation_key uuid)
-- {appointment,change_request}

manage_atelier_appointment(
 p_appointment_id uuid,p_action text,p_schedule_date date,
 p_schedule_time time without time zone,p_duration_minutes integer,
 p_reason text,p_staff_note text,p_expected_version bigint,p_operation_key uuid)
-- {appointment}

review_atelier_appointment_change(
 p_change_request_id uuid,p_decision text,p_schedule_date date,
 p_schedule_time time without time zone,p_duration_minutes integer,
 p_reason text,p_staff_note text,p_expected_appointment_version bigint,
 p_expected_change_version bigint,p_operation_key uuid)
-- {appointment,change_request}

add_atelier_appointment_note(
 p_appointment_id uuid,p_note text,p_operation_key uuid)
-- {note_id}; staff only

get_atelier_appointment_detail(p_appointment_id uuid)
-- {appointment,changes,history}; staff additionally {staff_notes,staff_actors}

create_atelier_concierge_request(
 p_category text,p_subject text,p_message text,p_order_id uuid,
 p_bespoke_request_id uuid,p_appointment_id uuid,p_operation_key uuid)
-- {conversation,message}

send_atelier_concierge_message(
 p_request_id uuid,p_message text,p_operation_key uuid)
-- {message,last_message_seq}

mark_atelier_concierge_read(p_request_id uuid,p_observed_message_seq bigint)
-- {side,read_seq,unread_messages}; naturally monotone/idempotent, no operation key

set_atelier_concierge_status(
 p_request_id uuid,p_status text,p_expected_version bigint,p_operation_key uuid)
-- {conversation}; staff only

get_atelier_concierge_thread(
 p_request_id uuid,p_after_seq bigint,p_limit integer)
-- {conversation,messages,observed_message_seq,has_more,unread_messages}
-- staff additionally {staff_senders}

get_atelier_concierge_inbox(
 p_status text,p_unread_only boolean,p_before_activity_at timestamptz,
 p_before_request_id uuid,p_limit integer)
-- {conversations,has_more}; staff only

get_atelier_service_counts()
-- {pending_appointments,today_confirmed_appointments,
--  unread_concierge_messages,unread_concierge_conversations}
```

`appointment` includes original and additive public columns: id, customer_id,
bespoke_request_id, order_id, type, preferred_date/time, confirmed_date/time,
status, location, notes, created_at/updated_at, lock_version, scheduled_start_at/
scheduled_end_at, confirmed_at, last_rescheduled_at, completed_at, cancelled_at,
cancelled_actor_type and cancellation_reason. `change_request` includes all its
original public columns plus lock_version, appointment_version and review_reason.
There are no private notes or internal staff IDs in those records.

`conversation` includes original public parent columns plus the new cursors,
versions, canonical context and activity fields. `message` is explicitly:
`id,request_id,message_seq,sender_type,sender_name,message,created_at`.
No sender_id. Staff display name is always **TCC Concierge**, including legacy staff
messages. New customer label is Client. Render body as escaped plain text.

History excludes actor_id in detail projection; new public staff events have null
actor_id, with true identity only in private attribution. Staff-only detail arrays
return private records after active staff checks, never in shared replay outputs.
Inbox rows include parent fields plus activity_at, unread_messages, client_name and
latest_message (body limited to 160 characters). Inbox cursor is activity_at plus
request ID; both null for first page, both nonnull subsequently. A conversation may
move due to new activity between pages; normal refresh is appropriate.

## Scheduling behavior

Creation is client-only, purpose allowlist consultation, style-consultation,
measurement, first-fitting, final-fitting, pickup, other. Related Order/Request
optional and owned by client; both must agree with Order's nonnull source Request.
Preferred date 2000–2099, current/future Lagos date; preferred_time is a bounded
nonempty label up to 80 characters. Note max 2000. Status always requested, no
accepted schedule. Profile supplies identity/contact; no duplicate contact inputs.

Staff manage actions: confirm on requested; reschedule on confirmed or legacy
scheduled/rescheduled; cancel on nonterminal; complete on accepted state with
canonical start <= now. Completed/cancelled are terminal. Reschedule immediately
sets status confirmed with updated authoritative schedule, history and notification.
The old `rescheduled` token is retained for old records, not emitted by new actions.

Confirm/reschedule requires all typed date/time/duration arguments, time `HH:mm`
without seconds/fractions or 24:00, date 2000–2099, duration 15–240 integer minutes.
Start is explicitly `(date + time) AT TIME ZONE 'Africa/Lagos'`; end adds duration.
Start must not be past. Browser locale/UTC parsing does not determine the schedule.
Staff reschedule requires a public reason max 1000. Cancel/complete require null
schedule arguments; completion never changes Order status or financial records.
Cancellation keeps original intent and accepted schedule, status/timestamp/reason.

Client reschedule/cancellation creates a pending change and increments appointment
version; actual accepted schedule/status remains unchanged. One pending change per
appointment is enforced under the parent/global lock; no destructive uniqueness
backfill. Staff review approves or declines, checks BOTH current expected versions,
and needs explicit typed schedule for approved reschedule. Decline requires reason.
Direct staff scheduling/terminal actions with pending change fail pending_change_exists;
review the pending proposal first. Notes append separately even after terminal state.

All schedule/change mutations acquire membership/replay/global atelier/appointment/
change locks in that order. The single-capacity lock is transaction-scoped; accepted
half-open intervals overlap exactly when start < other end AND end > other start.
Adjacent visits are allowed. Pending requests/proposals do not reserve capacity.
READ COMMITTED is required for capacity operations (explicit error otherwise) so
the post-lock query sees a preceding committer. Unexpected accepted legacy records
without canonical ranges block scheduling until explicit parent reconciliation.

## Concierge and read by TCC

Existing categories and parent statuses retained. Client creates open conversation
with subject 3–160 and initial message 3–4000 characters. Replies require 1–4000
nonblank characters and open/in_review/awaiting_customer. Staff explicitly reopen
resolved/closed threads; sending does not implicitly change status or read cursors.
Order/Request/appointment context is owned, validated and immutable. Phase 4 formal
changes-requested workflow remains independent.

Message insert has two deliberately ordered BEFORE triggers: the first is SECURITY
INVOKER and checks the actual caller/sender, the second is SECURITY DEFINER and
only assigns sequence and controlled parent bookkeeping. It cannot turn the first
check into a trusted staff check by inspecting its own definer current_user. Every
insert locks the conversation, serializing sequences, state closure and reads.
Sent messages reject ALL updates/deletes, including service/owner accidental DML.

Staff read means **read by TCC**, shared among Admin/CEO, not read by an employee.
Client read is owner-side only. Each side's unread count includes only the opposite
sender's messages beyond that side's cursor. Cursor advances with GREATEST, never
regresses, and is independent of notifications/status/sending. No p_side input.

Thread/inbox/count response fields use a single SQL statement snapshot. Thread
limit 1–100, after_seq >=0, ascending sequence. Read GET never mutates cursor.
Load a contiguous prefix beginning at 0 (and subsequent pages), then acknowledge
the highest displayed sequence. Do not acknowledge a current MAX(), server now(),
inbox latest sequence, or skipped unseen page. A concurrent N+1 arrival remains
unread when displayed content through N is acknowledged. Read operation accepts
zero no-op or a valid existing sequence in the owned conversation, not a future
watermark. Client cannot acknowledge staff side or another conversation.

## Immutable authority and replay

No new browser DML grants/policies. Existing owner-or-active-staff SELECT RLS stays
enabled. An INVOKER writer predicate compares actual current_user to the guarded
manage RPC's owner; only database-owner execution can perform protected transitions.
Caller-settable custom GUCs and JWT role strings are not authority. Existing
service-role customer INSERTs remain narrowly compatible during expansion; raw
service confirmation/review/staff sender/cursor manipulation is rejected by guards.
Contract denies unnecessary raw service writes through table AND column ACLs.

Every keyed mutation reauthorizes actor and entity ownership/access before exposing
a private result snapshot. Intent includes namespaced action and all arguments;
same key/intent returns original committed safe JSON even after later changes,
different intent errors. Private result retrieval also checks current visibility.
Rollbacks leave no replay/result/message/event/notification partial records. Reads
and read acknowledgement have no operation key. Keys should persist in forms across
interrupted transport; use a new key only for a genuinely different intended action.

Public lifecycle metadata is compact (IDs, transitions, schedules, public reason),
not a whole business/financial snapshot. Private notes never enter history,
notifications or replay. Staff replies and accepted appointment changes emit
customer notifications; staff attention uses actual pending/unread counts rather
than fake client-recipient fanout. No new notification transport or per-staff inbox.

## Retained public fitting endpoint

`submit_public_fitting_request(uuid,jsonb)` remains service-only and invoker. Contract
preserves appointment SELECT plus INSERT only of customer_id,type,preferred_date,
preferred_time,status,notes; public fitting INSERT only of its actual input columns;
UPDATE only appointment_id,updated_at for atomic link. Existing lifecycle INSERT
and relevant SELECT remain for RETURNING/event. Anonymous public intake creates
no appointment; authenticated intake creates requested only. Phase 4 authenticated
Request submission's appointment insert remains compatible. Parent must retire old
exported appointment-change/Concierge server actions before contract, not just hide UI.

## Errors

Common tokens: unauthorized, not_found, invalid_input, invalid_date,
preferred_date_in_past, invalid_purpose, invalid_change_type, invalid_schedule,
schedule_in_past, schedule_conflict, legacy_schedule_requires_review,
completion_not_available, appointment_terminal, pending_change_exists,
stale_version, invalid_transition, invalid_decision, change_already_reviewed,
context_mismatch, invalid_category, conversation_closed, invalid_pagination,
invalid_read_sequence, operation_key_required, idempotency_conflict,
missing_operation_result, read_committed_required.
Direct prohibited writes may raise permission denied, immutable_atelier_record,
appointment_rpc_required, review_rpc_required, conversation_rpc_required,
staff_message_rpc_required, invalid_sender or server_sequence_required.
Retired legacy signatures fail retired_rpc_use_authenticated_signature if an owner
invokes their fail-closed body; API roles have no EXECUTE at all after contract.

## Local verification and remaining rollout

Use existing PG17.6/pg distribution, not dependency installation:

```powershell
./scripts/verify-phase6-launch.ps1 -Runtime 'C:/Users/Young Duke/AppData/Local/Temp/tcc-phase4-pg17'
```

`verify-phase6-db.mjs` also supports direct native lifecycle where Node subprocess
launch works. PowerShell launcher handles this worker's Windows restricted-token
environment, uses a unique checked disposable temp directory and dedicated loopback
port 55466, hides the postgres process, verifies actual data_directory, retries
startup readiness, and stops/removes only that cluster. No remote URL/credential
or external shared-cluster mode is accepted. Test-only platform/assertion adapters
are never migration/deployment inputs. This is native PostgreSQL, not a complete
Supabase Auth/Storage HTTP service or installed pgTAP extension.

Verification includes complete baseline/incremental replay, DDL rollback, old SQL
suites, all original-field fingerprints, storage rows/policies, old/new expansion
compatibility, contract denial, workflow, private projections, GUC spoofing,
idempotent outputs and actual observed lock waits across independent connections.
Final native PG17.6 replay passed on 2026-10-06:

- 14 expansion + 97 workflow + 25 contract assertions: 136 Phase 6 assertions.
- Existing 48 security + 58 Phase 4 + 79 Phase 5 assertions passed before AND after
  Phase 6. The final unique suite total is 321 assertions; reruns are not counted
  as additional coverage.
- 23 Phase 6 concurrency/replay/isolation checks: 20 observed real lock races,
  one concurrent snapshot read, one nondefault-isolation rejection and one replay
  denial after deactivation. Eight Phase 4 storage/workflow concurrency regressions
  also passed. Operation-before-context lock order is tested for BOTH creation RPCs.
- All original fields in 33 public/private/storage tables preserved, including a
  successful-payment fixture and Order; existing RLS/storage policies unchanged.
  Both expansion and contract rollback checks passed.
- Node syntax and source whitespace/conflict-marker/credential-pattern checks passed;
  Git staging is blocked by the shared-metadata permission below.

The Windows token denied pg_ctl's graceful stop signal; the launcher terminated
only its owned process after a bounded wait and removed its disposable cluster.
No PostgreSQL processes remained. One earlier failed-launch log-only directory
could not be removed because automatic tool policy rejected the cleanup command
as "blocked by policy":
`C:/Users/Young Duke/AppData/Local/Temp/tcc-phase6-db-0195f652b6804347aa5210871aefabc7`
(contains only `server.log`). This is a local cleanup limitation, not a live
database or migration blocker. Parent may remove that exact stopped directory.

Commit blocker: `git add` failed with `Permission denied` creating
`C:/Users/Young Duke/Documents/VS Codes Doc/TCC/.git/worktrees/TCC-worker2-phase6-db/index.lock`.
This worktree's shared Git metadata is outside the session's writable root; no
escalation is available. No commit SHA, push or merge is claimed. The twelve owned
files are complete and remain untracked in `codex/phase6-db`; normal access to that
metadata directory is needed to stage/commit them. Do not replace or relocate the
repository metadata to bypass the restriction.

Parent still must run authorized live dry-run/migrations, preservation fingerprints,
context/sender assessment, security/performance advisors, application typecheck/
lint/tests/build, authenticated browser checks and synthetic production verification.
Expected advisor comparison starts at 2 private no-policy INFO, 13 guarded-definer
WARN, preexisting leaked-password WARN, 4 missing-FK INFO and 10 unused-index INFO.
Four FK gaps should disappear; additional deliberately private tables/guarded RPCs
may add corresponding intentional notices. Do not weaken guards/RLS to silence them.
No live advisor pass or deployed Phase 6 completion is claimed by this deliverable.
