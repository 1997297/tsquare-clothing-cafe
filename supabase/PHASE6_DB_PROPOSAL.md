# Phase 6 database proposal: atelier appointments and Concierge

Status: approved by parent; implemented locally in the two Phase 6 migrations.
This document preserves the original architecture audit/proposal. The executable
contract and verification evidence are in `PHASE6_DATABASE.md`. No live migration
has been applied by Worker2.
Prepared on 2026-10-06, Africa/Lagos, from `codex/phase6-db` at `b84c4bb`.
The initial worktree was clean. This was the original read-only audit deliverable;
parent subsequently authorized implementation in the explicit Phase 6 file scope.

## Scope and evidence

Reuse `appointments`, `appointment_change_requests`, `concierge_requests`,
`concierge_messages`, `lifecycle_events`, and `notifications`. Add incremental
columns, narrowly scoped private support records, guards, indexes and authenticated
RPCs. Preserve every existing ID, reference, message, appointment, Fit, Saved Look,
Request, Order and financial record. No attachments, Realtime, new communication
transport, automatic Order transitions, payment changes, or Phase 7 work.

Worker2 read `PROJECT_HANDOFF.md`, `AGENTS.md`, the entire attached Phase 6
directive, baseline schema, relevant migration definitions, repository rollout
reports, authorization helpers, account data reads and existing service wrappers.
No credentials, live API, production data, package installation, browser session,
commit or push was used. Parent supplied a later normally authorized live read-only
preflight; the following live facts are parent-reported, not independently queried:

- Three appointments, all `requested`, with no confirmed dates/times; zero changes.
- One Concierge conversation and three messages. Preserve all four records.
- Live read policies match repository ownership/active-staff policies.
- Exactly the four FK gaps below exist, without equivalent indexes.
- Advisor baseline: two intentional private RLS/no-policy INFO, thirteen guarded
  definer WARN, preexisting leaked-password WARN, four missing-FK INFO and ten
  unused-index INFO.

Parent also fetched current Supabase changelog, RLS/function docs and Next.js
data-security docs. Worker2 did not fetch those pages or claim to have verified
their contents. The supplied local `supabase/SKILL.md` and
`supabase-postgres-best-practices/SKILL.md` were read, together with the original
foreign-key-index, advisory-lock, deadlock-order, privileges, RLS-basics and
RLS-performance references. The user restriction to local proposal work takes
precedence over skill instructions to fetch docs or execute database operations.
Relevant official references for implementation review are
[RLS](https://supabase.com/docs/guides/database/postgres/row-level-security),
[database functions](https://supabase.com/docs/guides/database/functions),
[FK index advisor](https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys),
and [Postgres locks](https://www.postgresql.org/docs/current/explicit-locking.html).

## Existing state after all relevant increments

`supabase/schema.sql` is the development baseline, not the current schema.
`supabase/README.md` explicitly requires replaying it before the incremental chain.

| Source | Relevant effect still in force |
| --- | --- |
| Baseline `schema.sql` | Appointment owner, nullable Order/Request UUID FKs, unstructured preferred/confirmed date/time text, status check, location and notes. Change requests with pending/approved/declined review state. Concierge parent conversation and immutable-intent message model, but no message immutability trigger or read state. Customer notifications with read fields. |
| `20260923130313_harden_customer_authority.sql` | Removes broad client DML; authenticated appointment/change/Concierge reads only. Notification UPDATE limited to `is_read,read_at` and own rows. Change-to-appointment FK becomes `ON DELETE RESTRICT`. Private schema introduced. |
| `20260923130321_trusted_workflows_and_public_intake.sql` | Creates lifecycle events, service-only change and Concierge creation/reply RPCs, grants service table writes, and appointment relationship ownership trigger. Initial Concierge body is stored both in parent `message` and first message row. Creation validates context ownership, allowing Request ID or Request reference text. Reply accepts only open/in-review/awaiting-customer threads; no parent row lock, retry key, read state or staff reply RPC. |
| `20260923130330_private_reference_storage.sql` | Secures bespoke reference storage; no Concierge attachment architecture. Preserve storage policies. |
| `20260925060816_client_area_stabilization.sql` | Atomic service-only `submit_public_fitting_request(uuid,jsonb)` creates a requested appointment when customer is authenticated, links public intake via nullable `appointment_id`, and logs request event. Anonymous public intake remains separate. |
| `20260928092308_staff_authorization_foundation.sql` and `20260928092549_staff_authorization_hardening.sql` | Trusted `staff_accounts` is authoritative, active Admin/CEO can read operational tables, policies consolidated using private role resolver; public role resolver removed. Staff cannot grant themselves roles. |
| `20260928032520_catalogue_fit_architecture.sql`, `20260929131433_phase3_catalogue_management.sql`, `20260929131721_phase3_catalogue_policy_optimization.sql` | Catalogue-specific changes/indexes do not cover any of the four Phase 6 FK gaps; preserve Fit references, catalogue/media policies and options. |
| `20260929140000_phase4_commission_core.sql` | Authenticated Request submission may insert a requested appointment using legacy strings. Introduces `private.commission_actor`, `private.commission_replay`, deny-all private operation ledger, Request/Order versions and immutable revisions. No appointment review or scheduling workflow. |
| `20260929140100_phase4_commission_contract.sql` | Retires caller-identity Request submission/conversion overloads only. Does NOT retire appointment-change, public-fitting or Concierge service endpoints. Request private column grants illustrate safe staged cutover. |
| `20261002074022_phase5_payments.sql` | Adds private payment result snapshots keyed to commission operation ledger, guarded authenticated financial APIs and immutable financial guards. Do not repurpose payment result storage for Phase 6. |
| `20261005075136_phase5_transfer_date_lagos.sql` | Explicit Lagos calendar validation for transfer dates; retains RPC identity and ACL. Reuse explicit timezone approach, not payment-specific validation. |

Appointment statuses already allow `requested`, `scheduled`, `confirmed`,
`completed`, `rescheduled`, `cancelled`. A pending client change has its own status;
it must not overwrite the appointment's authoritative schedule. Baseline appointment
purpose is unrestricted text; current validators use consultation, measurement,
first-fitting, final-fitting and pickup; Phase 4 additionally accepts
style-consultation. Keep those spellings and add `other` for new requests.

Concierge categories already cover discuss_order, discuss_request, fitting_enquiry,
payment_question, style_consultation and general_enquiry. Parent statuses are
`open`, `in_review`, `awaiting_customer`, `resolved`, `closed`; message sender types
are `customer` and `concierge`. Context columns on the parent are text, not FKs.
There is no existing read/unread flag or cursor for messages. `sender_id` is
currently client-readable and references profiles; never put new staff identity in
that column while clients retain `select('*')`.

`lifecycle_events` has owner-or-staff read policy and includes `actor_id` and JSON
metadata. It has no general immutable trigger. Customer-visible metadata must not
contain staff notes, account details, financial snapshots or private attribution.
Notifications require a customer profile recipient, not an audience-wide staff
inbox. Staff have SELECT but cannot mark other clients' notifications read through
the existing own-recipient UPDATE policy. Concierge unread must be independent of
notification read state.

Application integration findings (read only): staff appointment/Concierge pages are
placeholders. Account store uses `select('*')` on appointments, changes, Concierge
parents and messages; message mapping consumes sender ID/name. Server customer
actions call `auth.getUser()` via `requireAuthenticatedCustomer()` and supply that
trusted ID to service-only wrappers. Staff server guard rechecks active membership;
DB staff mutation helper locks active membership `FOR SHARE`. Client mutation
helper excludes every staff membership, including inactive staff. There is no
existing `auth.sessions` database guard in the migration chain. Admin overview uses
UTC `toISOString()` date and preferred text for appointments, and counts open
conversations rather than unread messages. Account appointment UI treats
`rescheduled` as past and uses a confirmed heading for some non-requested states;
the later application transition must correct those presentations.

Orders advance explicitly from order_confirmed through measurements_confirmed,
in_production, finishing, ready and completed. There is no independent fitting
Order stage or rule connecting appointment completion to Order completion.

## Four FK indexes and existing equivalents

Both repository reconstruction and parent's live preflight agree:

| Uncovered FK column | Proposed nonduplicate index |
| --- | --- |
| `appointments.bespoke_request_id` | `appointments_bespoke_request_idx (bespoke_request_id)` |
| `appointments.order_id` | `appointments_order_idx (order_id)` |
| `appointment_change_requests.customer_id` | `appointment_changes_customer_idx (customer_id,created_at,id)` |
| `concierge_messages.sender_id` | `concierge_messages_sender_idx (sender_id)` |

Prefer full B-tree indexes here for predictable advisor recognition. Existing
`idx_appointments_customer`, `idx_appointment_changes_appt`,
`idx_concierge_requests_customer`, `idx_concierge_requests_status`, and
`idx_concierge_messages_request` already cover their leading FK/query columns.
`public_fitting_requests_appointment_uidx` covers non-null appointment links and
`public_fitting_requests_customer_idx` covers its customer FK. Do not duplicate
those. Existing Order/Request/catalogue indexes on other tables cannot cover an
appointment FK. Check index definitions, validity and leading column order at
implementation time, not just names or any appearance of a column in an index.

## Proposed appointment expansion

Retain all existing columns and status values, including legacy text exactly.
Add the following to `public.appointments`:

| Column | Definition / meaning |
| --- | --- |
| `lock_version` | `bigint NOT NULL DEFAULT 1 CHECK (>0)`; increment on every schedule, terminal transition and change submission/review. |
| `scheduled_start_at` | nullable `timestamptz`; authoritative actual start, never filled from preferred text. |
| `scheduled_end_at` | nullable `timestamptz`; authoritative end. |
| `confirmed_at` | nullable `timestamptz`; first staff acceptance timestamp. |
| `last_rescheduled_at` | nullable `timestamptz`; latest accepted staff schedule change. |
| `completed_at` | nullable `timestamptz`; actual completion action time. |
| `cancelled_at` | nullable `timestamptz`; cancellation action time. |
| `cancelled_actor_type` | nullable text constrained to `customer,staff,system`; for this workflow staff approval records `staff`, with requesting client in the change event. |
| `cancellation_reason` | nullable text, max 1000 characters for new writes; client-safe reason. |

Paired schedule timestamps must both be null or both non-null; end must exceed
start, and duration must be an integral 15–240 minutes. New scheduling operations
validate Lagos start date in 2000–2099 and exact minute precision. Require start at
or after transaction `now()` for new confirmations/reschedules. Derive
`confirmed_date` as Lagos ISO date and `confirmed_time` as Lagos `HH:mm` on every
staff schedule mutation. Old readers continue to work; new readers use canonical
timestamps. Do not infer UTC from browser locale. New preferred date remains ISO
text and preferred time remains a bounded label/time window; it is intent, not a
reservation. Retain old unstructured preferred times without parsing/backfill.

Add to `public.appointment_change_requests`:

| Column | Definition / meaning |
| --- | --- |
| `lock_version` | `bigint NOT NULL DEFAULT 1 CHECK (>0)` |
| `appointment_version` | nullable `bigint CHECK (>0)`; submitted version; nullable for legacy endpoint compatibility. |
| `review_reason` | nullable text, max 1000 for new writes; customer-visible decision reason. |

Retain existing `reviewed_at`, proposed date/time/reason and status. Do not invent
past reviewers or timestamps. No unrequested reschedule-proposal state on the
appointment is needed: client proposals live in this existing change table, and
staff directly confirms/reschedules with notification and history. A future staff
proposal requiring client acceptance would need an agreed additional contract.

Keep staff notes and attribution out of these broadly readable rows. Ancillary
private tables, not duplicate appointment/conversation systems:

- `private.atelier_operation_results(actor_id uuid, operation_key uuid,
  result jsonb NOT NULL, PRIMARY KEY(actor_id,operation_key),
  FOREIGN KEY(actor_id,operation_key) REFERENCES
  private.commission_operations(actor_id,operation_key) ON DELETE RESTRICT)`.
- `private.atelier_event_actors(event_id uuid PRIMARY KEY REFERENCES
  public.lifecycle_events(id) ON DELETE RESTRICT, actor_id uuid NOT NULL REFERENCES
  auth.users(id) ON DELETE RESTRICT, actor_role text NOT NULL CHECK IN
  ('client','admin','ceo'), created_at timestamptz NOT NULL DEFAULT now())`.
  Stores real actors for Phase 6 events; public staff event actor ID is null.
- `private.appointment_staff_notes(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL REFERENCES public.appointments(id) ON DELETE RESTRICT,
  actor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  note text NOT NULL, created_at timestamptz NOT NULL DEFAULT now())`.
  Append-only, validated 1–2000 characters. Never copy these into public event JSON.
- `private.concierge_staff_senders(message_id uuid PRIMARY KEY REFERENCES
  public.concierge_messages(id) ON DELETE RESTRICT, actor_id uuid NOT NULL REFERENCES
  auth.users(id) ON DELETE RESTRICT, actor_role text NOT NULL CHECK IN ('admin','ceo'))`.
  Staff sender audit is immutable and survives staff deactivation.

Enable RLS and revoke all table/function access from PUBLIC, anon, authenticated
and service_role for these private records. Only owned guarded helpers/RPCs can
read/write them. Add B-tree indexes on each new FK not already covered by the PK:
event actor, note appointment and actor, and Concierge staff actor. The operation
result composite PK covers its composite FK. No Auth deletion/account-management
operation is added; RESTRICT preserves new audit attribution.

## Exact proposed appointment RPCs

All public signatures below return `jsonb`, use `SECURITY DEFINER SET search_path=''`
with fully qualified objects, and are EXECUTE-granted only to authenticated after
revoking PUBLIC, anon and service_role. Private helpers are not API-callable.
Parameter names and nullability semantics below are the proposed contract; no
overloads/default parameters that could make PostgREST resolution ambiguous.

```sql
public.create_atelier_appointment(
  p_type text, p_preferred_date date, p_preferred_time text,
  p_order_id uuid, p_bespoke_request_id uuid, p_note text,
  p_operation_key uuid
) RETURNS jsonb

public.request_atelier_appointment_change(
  p_appointment_id uuid, p_change_type text,
  p_proposed_date date, p_proposed_time text, p_reason text,
  p_expected_version bigint, p_operation_key uuid
) RETURNS jsonb

public.manage_atelier_appointment(
  p_appointment_id uuid, p_action text,
  p_schedule_date date, p_schedule_time time without time zone,
  p_duration_minutes integer, p_reason text, p_staff_note text,
  p_expected_version bigint, p_operation_key uuid
) RETURNS jsonb

public.review_atelier_appointment_change(
  p_change_request_id uuid, p_decision text,
  p_schedule_date date, p_schedule_time time without time zone,
  p_duration_minutes integer, p_reason text, p_staff_note text,
  p_expected_appointment_version bigint, p_expected_change_version bigint,
  p_operation_key uuid
) RETURNS jsonb

public.add_atelier_appointment_note(
  p_appointment_id uuid, p_note text, p_operation_key uuid
) RETURNS jsonb

public.get_atelier_appointment_detail(p_appointment_id uuid) RETURNS jsonb
```

- Creation and client change require `private.commission_actor(false)`. Owner is
  always returned actor, never an input. Creation accepts the retained purpose
  tokens plus `other`, future/current Lagos preferred date (2000–2099), nonempty
  preferred time label up to 80 characters, and optional note up to 2000. Related
  Order/Request are optional UUIDs owned by that client. If both provided and Order
  has a source Request, require it to match. Creation is always `requested` with
  no schedule/confirmation/terminal fields and trusted default location.
- Client change accepts only reschedule/cancellation on nonterminal appointments.
  Reschedule requires future/current Lagos date and nonempty time label; cancellation
  requires null proposed date/time. Optional reason max 1000. Check expected
  appointment version, lock appointment, insert pending change and increment version.
  Do not change authoritative appointment status or schedule. Under parent lock,
  reject a second pending change with `pending_change_exists`; legacy duplicates,
  if any, are preserved and require explicit review, not destructive cleanup.
- Management requires `private.commission_actor(true)`. Actions:
  `confirm` on requested; `reschedule` on confirmed or legacy scheduled/rescheduled;
  `cancel` on any nonterminal state; `complete` on confirmed or legacy scheduled/
  rescheduled with a canonical schedule and start at or before now. Completed and
  cancelled are terminal. Confirm/reschedule set status `confirmed`; rescheduling
  is an event, not a past-appointment status. Never silently rewrite legacy status.
- Schedule arguments are mandatory only for confirm/reschedule, and must all be
  null for cancel/complete. Convert exactly
  `(p_schedule_date + p_schedule_time) AT TIME ZONE 'Africa/Lagos'`; end is start
  plus duration. Reject seconds/fractions and null/invalid/out-of-range durations.
  Require a client-safe reschedule reason; optional cancellation reason, max 1000.
  Staff note is separate, optional, max 2000. Confirm preserves the originally
  requested intent; cancellation/completion preserve accepted schedule and record
  terminal timestamp. No implicit completion based solely on date passing.
- Review decisions are `approve` or `decline` on pending only. Check both expected
  versions after locks. Approved reschedule requires an explicitly selected staff
  schedule, never blindly promotes the proposed text. It can initially confirm a
  requested appointment or reschedule a confirmed one. Approved cancellation runs
  the cancellation transition. Decline requires a public reason and null schedule
  arguments. Stamp reviewed_at/reason, bump both versions, append one review and
  relevant schedule/cancellation event atomically. A superseded proposal can be
  explicitly declined; submission version is informational history, while current
  expected version protects the review operation.
- Direct staff scheduling/terminal transition rejects if a pending change exists:
  staff must review it first. This avoids orphan pending changes and conflicting
  implicit decisions. Note append is allowed on terminal appointments and does not
  alter business status/version; its retry has one immutable result.
- Detail returns `{appointment, changes, history}` for owner or active staff, and
  additionally `{staff_notes, staff_actors}` for active staff only. RPC revalidates
  actor/ownership explicitly; private lookups must not depend on definer RLS.

Management/create return `{appointment}`; client change returns
`{appointment,change_request}`; review returns `{appointment,change_request}`;
note append returns `{note_id}`. Appointment/change objects are explicit safe
columns including IDs, links, original intent, current schedule, status, location,
client note/reasons, versions and timestamps. No private attribution or notes in
mutation results (including staff mutation results), so stored replay results are
safe. Staff detail supplies private data only after current authorization.

## Appointment serialization and compact history

Single atelier capacity. Every scheduling operation takes the same transaction
advisory lock on a fixed namespaced key, e.g.
`hashtextextended('tcc:phase6:atelier-capacity',0)`, BEFORE locking appointments.
Use transaction locks, not pooled session locks or a per-appointment-only lock.
After acquiring it, read competing accepted schedules afresh at READ COMMITTED.
Reject if `existing_start < new_end AND existing_end > new_start`, excluding self,
for statuses confirmed/scheduled/rescheduled. Half-open intervals `[start,end)`
permit a visit starting exactly when another ends. Requests/pending proposals do
not reserve capacity; completed/cancelled rows do not block capacity.

All appointment mutations (including changes, reviews and cancellation) follow
the same order: authenticated actor/staff membership lock, operation replay lock,
global atelier lock, appointment row FOR UPDATE, change rows in ID order, optional
context rows, event/notification/result inserts. Hold no network interaction within
transaction. At nondefault isolation, retry serialization failures with the same
operation key; do not rely on stale transaction snapshots for overlap checks.
An optional exclusion constraint on canonical ranges can be considered later, but
the required baseline contract is transaction serialization, with no new extension.

All three parent-reported existing appointments are requested without schedules,
so there is no confirmed-range backfill or collision to resolve now. For unexpected
legacy accepted rows with null canonical schedule, preserve their text/status and
block scheduling with `legacy_schedule_requires_review` until parent supplies an
explicit reconciliation. Never guess duration or parse arbitrary preferred labels.

Append client-safe lifecycle events for requested, change_requested,
change_approved/declined, confirmed, rescheduled, cancelled and completed.
Use entity_type `appointment` and its stable ID. Metadata is a small allowlist:
change ID/type, previous/new status, previous/new schedule, timezone, public reason.
Include previous legacy confirmed text if that is the only known prior schedule;
do not fabricate canonical history. Public actor_type remains customer/staff;
customer actor_id can be owner, staff actor_id null with real identity stored in
private attribution. Timeline pagination is `(created_at,id)`, not a large snapshot
per mutation. Do not synthesize historical events for old rows; a labeled legacy
record display may derive only known created_at/status.

## Proposed Concierge expansion

Keep existing parent/message rows and all text context strings. No new conversation
table and no duplication of the parent's initial message into a fourth message.
Add to `public.concierge_requests`:

| Column | Definition / meaning |
| --- | --- |
| `lock_version` | `bigint NOT NULL DEFAULT 1 CHECK (>0)`; business state/context changes, not read cursor updates. |
| `last_message_seq` | `bigint NOT NULL DEFAULT 0 CHECK (>=0)`; per-conversation serialized message counter. |
| `client_read_seq` | `bigint NOT NULL DEFAULT 0 CHECK (>=0)` |
| `staff_read_seq` | `bigint NOT NULL DEFAULT 0 CHECK (>=0)`; shared TCC-side cursor, not per employee. |
| `client_read_at`, `staff_read_at` | nullable `timestamptz`; action timestamps, never used as watermarks. |
| `last_message_at` | nullable `timestamptz`; most recent persisted message timestamp. |
| `context_request_id` | nullable UUID FK to bespoke_requests(id), ON DELETE RESTRICT. |
| `context_order_id` | nullable UUID FK to orders(id), ON DELETE RESTRICT. |
| `context_appointment_id` | nullable UUID FK to appointments(id), ON DELETE RESTRICT. |

Add `message_seq bigint NOT NULL CHECK (>0)` to `public.concierge_messages`, with
unique `(request_id,message_seq)`. No mutable is_read flag on messages. Under a
short migration write lock, assign existing messages row_number per request ordered
by `(created_at,id)` and set parent counters/last_message_at from those rows. Keep
every existing message's ID, timestamp, text and sender fields unchanged. Initialize
both read cursors to 0 (unread unknown historical messages); do not claim either
side has previously read anything. Validate `client_read_seq,staff_read_seq <=
last_message_seq`. Sequence creates deterministic pagination even for tied times.

New messages obtain their sequence only after parent FOR UPDATE; allocation and
insert commit atomically. An insert trigger supplies sequence/counter/last-message
metadata for the retained legacy service RPC too. The same parent lock prevents
message insert racing conversation closure. New message validation applies to both
paths: nonblank trimmed text of 1–4000 characters, valid conversation state,
customer sender matches owner, and new staff messages use `sender_type='concierge'`,
`sender_name='TCC Concierge'`, `sender_id=NULL`. Staff RPC records real identity in
private.concierge_staff_senders in the same transaction. Do not alter old staff
sender fields to make rollout pass; any existing identity leakage needs explicit
parent review/column-safe read cutover, not silent historical rewriting.

New typed context columns are resolved only where old text has one matching row
owned by that conversation's customer (Request ID or request_reference; Order and
appointment UUID text). Preserve every old string even when unresolved; leave
canonical field null and report unresolved/ambiguous contexts without personal
data. New creation writes both canonical UUIDs and compatible legacy strings.
Relationship guard validates every supplied context's owner and consistent source
Request when both Order and Request are present. Appointment context must be owned
by the client; validate its nonnull Order/Request against explicitly supplied context
as well. Context is immutable after creation in this phase; no arbitrary relinking.

## Exact proposed Concierge RPCs

```sql
public.create_atelier_concierge_request(
  p_category text, p_subject text, p_message text,
  p_order_id uuid, p_bespoke_request_id uuid, p_appointment_id uuid,
  p_operation_key uuid
) RETURNS jsonb

public.send_atelier_concierge_message(
  p_request_id uuid, p_message text, p_operation_key uuid
) RETURNS jsonb

public.mark_atelier_concierge_read(
  p_request_id uuid, p_observed_message_seq bigint
) RETURNS jsonb

public.set_atelier_concierge_status(
  p_request_id uuid, p_status text,
  p_expected_version bigint, p_operation_key uuid
) RETURNS jsonb

public.get_atelier_concierge_thread(
  p_request_id uuid, p_after_seq bigint, p_limit integer
) RETURNS jsonb

public.get_atelier_concierge_inbox(
  p_status text, p_unread_only boolean, p_before_activity_at timestamptz,
  p_before_request_id uuid, p_limit integer
) RETURNS jsonb

public.get_atelier_service_counts() RETURNS jsonb
```

Use the same restricted EXECUTE, pinned search_path, definer authorization and safe
JSON rules as appointment RPCs. Creation is client-only, owner from actor; category
uses existing allowlist, subject trimmed 3–160 characters, initial body 3–4000.
Create open parent plus exactly one immutable initial message atomically. Generate
unique reference with a private sequence (seed collision-safe against existing
references), or explicitly retry only reference uniqueness collisions. Do not rely
solely on short random suffixes without a unique/retry path.

Send accepts no identity/sender/role parameter. If an active staff account exists,
call commission_actor(true); otherwise commission_actor(false), which rejects
inactive staff rather than demoting them to clients. Lock parent and recheck current
access; active Admin/CEO may reply to any operational conversation, clients only
their own. Permit send only for open/in_review/awaiting_customer; reject
resolved/closed until staff explicitly reopens. Do not implicitly change a Request,
Order, payment or formal Phase 4 changes-requested state. A message updates activity
and sequence, not read cursors; sending a reply does not prove the sender read the
whole thread. Do not automatically resolve a conversation.

Staff-only status changes permit any different status in the existing allowlist;
reopening resolved/closed is explicit and audited. Expected version protects stale
staff state forms. Closing does not delete messages. Return not_found for unrelated
owner access, unauthorized for staff impersonation/inactive staff, conversation_closed
for prohibited sends, and invalid_input for malformed body/status.

Creation returns `{conversation,message}`, send returns `{message,last_message_seq}`,
status returns `{conversation}`. Message safe projection includes id, request_id,
message_seq, sender_type, display label, body and created_at. Client staff labels
are always TCC Concierge, even for legacy staff sender_name values in the RPC
projection. Internal sender identity is returned only as a staff-only separate
projection by thread read, never by public mutation results or cached replay.

### Concurrent read semantics

`mark_atelier_concierge_read` derives side from authorization; there is no p_side or
staff/client ID input. Require a nonnegative observed sequence; 0 is initial no-op.
For nonzero values validate a message with that sequence exists in this conversation
and value <= last_message_seq. Lock parent; set only authorized side cursor to
`greatest(current_cursor,p_observed_message_seq)`. Advance read_at only when cursor
advances. Return `{side,read_seq,unread_messages}`. This monotone operation does not
need an operation key or business expected_version. Clients cannot modify the staff
cursor and staff cannot mark the client's cursor.

Caller submits the highest message actually rendered from a contiguous loaded
prefix. Do not pass current DB MAX(), now(), or a value from a freshly refreshed
inbox if it was not displayed. Thread read never marks read implicitly. After a
snapshot displays through sequence 3, concurrent incoming sequence 4 remains unread
when cursor 3 is acknowledged. Parent locks serialize insert and read mutation;
ordering cannot turn sequence 4 into seen. Timestamp or a global sequence allocated
outside parent lock would not provide this guarantee. Out-of-order read requests
use GREATEST and never regress.

Client unread is count of concierge messages with seq > client_read_seq; TCC unread
is count of customer messages with seq > staff_read_seq. Do not use total message
count minus cursor, parent status, latest sender or notification is_read. Staff-side
cursor is shared among Admin/CEO: one staff member opening marks read for TCC. A
per-staff cursor is an unresolved product choice and would require another read
state table; shared per-side is recommended for this phase.

Thread read checks owner/active staff and returns `{conversation,messages,
observed_message_seq,has_more,unread_messages}` and staff-only sender attribution.
Use a single SQL statement snapshot for conversation/counters/messages/counts; no
mixed READ COMMITTED snapshots across separate statements. Limit 1–100, after_seq
>=0; sequence pagination ascending. For read acknowledgements begin at 0 and follow
contiguous pages. Loading only a latest page does not authorize claiming unseen
earlier content was read. observed_message_seq is maximum of the returned page,
not a current MAX over unreturned messages.

Inbox is staff-only; allow null status for all, otherwise existing status allowlist,
limit 1–100. Cursor time and ID are both null on first page or both nonnull. Return
`{conversations,has_more}` ordered by activity time descending and ID descending,
with latest safe preview, context IDs, client display name and actual unread count.
Use `coalesce(last_message_at,created_at)` for empty historical threads. Unread-only
filter prioritizes actionable conversations without fake status-based unread.
Counts returns owner-specific client counts or active-staff aggregate counts:
`{pending_appointments,today_confirmed_appointments,unread_concierge_messages,
unread_concierge_conversations}`. Counts use one SQL snapshot, Lagos midnight
boundaries converted to timestamptz, and accepted schedule timestamps. Pending
staff count includes requested appointments and pending changes without counting
the same appointment twice. Refresh/revalidation is sufficient; no aggressive polls.

## Guards, grants and retry behavior

Preserve consolidated owner/active-staff RLS SELECT policies. No direct authenticated
appointment/change/Concierge DML grants and no client INSERT policies are necessary:
guarded RPC is the only new mutation API. New public columns above contain only
client-safe information, so existing select('*') remains compatible during expansion.
Private notes/actors are not reachable through table reads, JSON snapshots, embeds
or optional browser fields. No new permissive views; if a view is later chosen,
use security_invoker and explicit grants, not definer-owned RLS-bypassing exposure.

Use private.commission_actor for the current staff/client boundary; keep active
staff membership FOR SHARE held through commit to serialize against deactivation.
Reauthorize every retry before reading operation results. Never trust user_metadata,
caller client/staff UUIDs or claimed role. Existing server `auth.getUser()` and
requireStaff checks remain necessary; route protection alone is insufficient.
Current DB helper checks auth.uid/profile/staff but does not verify session_id in
auth.sessions. Do not claim immediate JWT revocation after logout. Whether to add
a Phase-6-only strict session guard is a parent security-contract decision; do not
modify the shared Phase 4/5 actor helper or reject legitimate test/service contexts
without an agreed session claim contract. This proposal adds no new Auth management.

Reuse private.commission_replay with namespaced action intent such as
`phase6:appointment:confirm` and `phase6:concierge:send`; include EVERY parameter,
entity and expected version in intent. Reuse its actor/key serialization and
ledger, then store exact safe JSON response in private.atelier_operation_results.
Same key/same intent returns original committed response, even after entity later
changes; same key/different intent raises idempotency_conflict. Keys must survive
interrupted transport in the application. A failed transaction rolls back intent,
result, sequence, message, event and notification together. Cross-phase reuse of a
key fails closed due to different intent rather than overwriting a payment result.
Replay must also recheck current entity visibility before returning stored result.

Install guards BEFORE allowing new workflow writes:

- Concierge messages: BEFORE UPDATE OR DELETE always reject; immutable body,
  sender, sequence and timestamp, including service-role accidental DML. BEFORE
  INSERT allocates sequence under parent lock, enforces sender/ownership and open
  state, with compatible legacy customer inserts. RPC records private staff sender;
  raw legacy role does not gain a new staff impersonation path.
- Conversation: owner, reference, category, subject, initial body and both legacy/
  canonical context are immutable; narrowly permit counters/cursors/activity/status/
  version fields. Only authenticated guarded routines and legacy message bookkeeping
  may change managed state. Reject DELETE. At contract remove legacy service DML.
- Appointment: reject DELETE and changes to owner, links, original intent, notes,
  type, created_at; whitelist actual scheduling/terminal fields, timestamps, version
  and compatibility mirrors. Validate allowed status transitions and paired schedule.
  New rows from old public/Phase 4 routes still insert requested. Keep location trusted.
- Change requests: reject DELETE; preserve submission fields; allow one pending-to-
  approved/declined review and trusted review/version fields only. Validate owner
  matches appointment on every new INSERT, including retained service endpoint.
- Phase 6 lifecycle events: reject UPDATE/DELETE for entity_type appointment or
  concierge_request; leave preexisting Phase 4/5 trigger contracts untouched. Private
  staff notes/attribution/result records are append-only and inaccessible.

Do not use a caller-settable custom GUC as proof of trusted RPC execution, or grant
service_role UPDATE/DELETE just to bypass immutability. Trusted migration/fixture
maintenance by owner must be explicit, bounded and tested. Guards check nulls using
IS DISTINCT FROM as appropriate; SQL null must not bypass required transitions.

Add appointment queue index `(status,scheduled_start_at,id)`, pending change index
`(appointment_id,status,created_at,id)` only if justified beyond existing leading
appointment index, message index `(request_id,sender_type,message_seq)` for opposite-
side unread counts, and Concierge activity index on
`(coalesce(last_message_at,created_at) DESC,id DESC)`. Unique request/sequence already
supports chronology and message FK; do not blindly drop existing FK indexes.
Add indexes to all three new typed Concierge context FKs. A pending-only unique
change index is optional after proving no duplicate pending history; correctness
initially comes from parent locking, including a guard on legacy inserts.

## Notifications and compatibility rollout

Customer notifications for confirmed/rescheduled/cancelled/completed appointments
and staff Concierge replies use existing notifications table, with safe summary,
stable related entity and one insert per successful idempotent action. Do not
include full messages or internal notes in generic notification previews. New
appointment/change/customer-message staff attention is served by real pending and
unread state plus lifecycle events. No fanout to staff profiles by pretending they
are customer recipients; no new staff-notification system in this phase. If parent
requires per-staff notifications, agree explicit audience/recipient design first.

Recommended staged rollout (future work, not authorized by this task):

1. Parent agrees exact columns/signatures/result shapes and choices below. Create
   versioned expansion migration; replay baseline + ALL existing migrations locally
   before expansion and preservation tests. No baseline rewrite/reset.
2. Expansion adds safe columns, indexes, private support records, authenticated APIs,
   message-sequence trigger and immutable guards. Preserve existing three requested
   appointment rows and one conversation/three messages. Canonical schedule fields
   stay null; message sequence/read cursors are explicit new metadata, not history
   changes. No backfill of confirmed/completed/reviewed actors or timestamps.
3. KEEP these existing service-only signatures and execute grants operational until
   application transition: request_appointment_change(uuid,uuid,text,text,text,text),
   create_customer_concierge_request(uuid,jsonb),
   add_customer_concierge_message(uuid,uuid,text), and
   submit_public_fitting_request(uuid,jsonb). Their valid existing input/results must
   work with new guards/counters. Preserve Phase 4's appointment INSERT too.
   Do not expose any legacy caller-identity signature to authenticated.
4. Deploy parent application using session-bound authenticated RPCs, explicit safe
   reads, canonical Lagos schedules, history and observed-sequence acknowledgements.
   Preserve anonymous public intake; authenticated appointment creation should use
   the new RPC without collecting already-known contact fields. Existing public
   intake may intentionally remain a server-only service path after this phase.
5. Verify old/new application overlap before a separate contract migration retires
   unused legacy appointment-change/Concierge service signatures and revokes their
   broad service DML. Fail-closed function bodies plus revoked EXECUTE prevent future
   accidental reopening. Retain only minimum service INSERT permissions still needed
   by public fitting intake, including related event/link updates; do not break that
   authorized anonymous endpoint. Do not retire unrelated Phase 4/5 functions.
6. Run authorized advisors and preservation/security verification, then application
   and production synthetic tests under parent authorization. No live advisor or
   write execution is part of Worker2's proposal task.

Adding strict global CHECKs to all historical message text/purpose strings can fail
on old valid data. Validate new writes with guards, preflight old values, and apply
only compatible structural checks globally. Sequence backfill occurs before message
immutability trigger activation within one bounded transaction. No delete/reinsert
of existing messages, no conversion of requested to confirmed, no duplicate initial
message, no destructive FK cascades introduced. Existing cascading profile/message
FKs plus immutable guards may now block deletion rather than erase history; no
account deletion feature is in this phase, and this consequence must be tested.

## Parent-approved contract decisions

Parent approved the following defaults in the implementation authorization:

- Typed `date + time without time zone + duration` RPC schedule inputs, matching
  parent helper; 2000–2099 dates, minute precision, 15–240 minutes, explicit Lagos.
  Application must send `HH:mm`, never Date-parsed browser-local timestamps.
- Staff reschedule immediately establishes confirmed schedule; client proposal is
  pending review and does not reserve/rewrite existing accepted schedule.
- Client cancellation goes through existing change-request/staff approval flow;
  no direct client cancellation RPC in this proposal.
- Shared per-side staff read cursor. Historical read state unknown => both cursors 0.
- Staff detail alone reveals private identity/notes. Existing legacy sender fields
  are preserved; parent must assess whether any of the three historical messages
  has a staff identity requiring safe-read cutover before broader staff replies.
- No new strict auth.sessions check. Preserve the existing session architecture;
  live staff role lookup and transaction membership lock are mandatory.
- Staff notifications use operational unread/pending data, not recipient fanout.
- Parent to confirm legacy context resolution from its authorized preflight; absent
  evidence, retain strings and nullable canonical context rather than assert validity.

## Implementation test plan (not executed for documentation-only task)

1. Replay schema + every existing increment + future expansion in isolated local PG
   with repository platform/assertion adapters. Run remediation, Phase 4 and Phase 5
   suites before/after. Test migration rollback, grants, defaults, constraints,
   triggers, function ACLs/search_path and all new FK indexes. Include old service
   endpoints during expansion and intentional denial only after contract.
2. Preservation fingerprints of original columns and IDs across all public/private
   tables; separately explain additive sequence/cursor/context metadata. Three
   requested appointments remain requested, canonical schedules null, zero existing
   changes remains zero, one thread and three messages preserved. Compare storage
   bucket/policy inventory byte-equivalently; no storage additions. Fit/Saved Look,
   revisions, legitimate Order and all financial rows stay unchanged.
3. Appointment full request-confirm-client-change-staff-review-reschedule-complete
   path; separate requested and confirmed cancellation paths. Terminal reversals,
   client confirmation/completion, direct DML, missing/null versions, invalid dates,
   bad durations, fractional times, unrelated Order/Request and owner spoofing fail.
   Completion before start fails; completion changes no Order/financial field.
4. Real two-connection confirmation of overlapping requests: one commits, other
   gets schedule_conflict. Adjacent half-open ranges both succeed. Test identical
   range, containment, midnight-crossing visits, different duration, self exclusion,
   cancellation freeing capacity, simultaneous changes/reviews and stale versions.
   Same key replay adds no event/notification; changed intent fails. Failed overlap
   leaves no ledger result or partial schedule. Deactivation races serialize safely.
5. Timezone tests at Lagos midnight (23:00 UTC), date bounds 2000/2099, invalid
   leap/calendar dates and 2100, today counts, minute formatting, browser timezone
   mismatch, and legacy preferred labels. Assert conversion exactly agrees with
   parent's helper; no UTC ISO-date slicing for Nigerian calendar decisions.
6. Concierge create/send/staff reply/read/client reply, refresh/re-login, chronological
   sequence and pagination. Another client cannot read/enumerate/send/acknowledge,
   inactive staff cannot act as client, browser cannot impersonate staff, select
   private attribution, edit/delete old or new messages, relink context or alter
   staff notes. Safe projection never includes staff account email/ID/note.
7. Real two-connection read race: display through N, commit incoming N+1 before and
   after read acknowledgement; N+1 remains unread both ways. Same timestamps,
   delayed earlier transaction, concurrent sends, reverse-order acknowledgements,
   pagination, own-side-only sends, invalid/cross-thread sequence and closure/send
   races. Counts equal opposite-side unread, not all messages; notification reads
   have no effect on conversation cursors. Response snapshot is internally consistent.
8. Test existing initial parent body and three messages are not duplicated; old
   creation/reply get valid assigned sequence during expansion; retries preserve
   exact original safe result and no duplicate notification/message. Staff status
   reopening is explicit, formal Request change workflow remains untouched.
9. Parent-authorized live advisor comparison: four missing FK findings resolved,
   no new missing FK/disabled RLS/storage policy regression; intentional private
   no-policy and guarded definer findings reported separately, existing password
   warning and unused-index notices retained accurately. No claim of advisor pass
   before execution. Review EXPLAIN plans on synthetic scale for unread/inbox/queue.
10. Later application typecheck, lint, unit tests and production build; port 3001
   authenticated Client/Admin/CEO browser workflow, 390px/tablet/desktop and both
   themes, exact regression routes from directive, deployed-SHA verification and
   synthetic-only production paths. Explicitly clean fixtures, private replay/audit
   records, notifications, sessions and screenshots through approved bounded
   maintenance without disabling production financial or message guards globally.

## Delivery limitations

The original read-only architecture deliverable is complete. Parent subsequently
approved local implementation and tests with the listed decisions. Worker2 added
only the authorized Phase 6 migration, test, runner and documentation files; no
application, handoff, prior applied migration or other worktree changed. Local
native PostgreSQL verification is documented separately. Live context/privacy,
advisor, application and production verification remain parent's rollout work.
Parent's former approval-service limit was resolved through normal authorization;
Worker2 did not bypass it or attempt live access.

**PHASE 6 IS NOT COMPLETE.** Local database work does not imply application or
production deployment completion.
