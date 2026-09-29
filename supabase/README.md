# Supabase remediation migrations

The root `schema.sql` remains the pre-migration development snapshot. The incremental files in `migrations/` assume that baseline already exists, as it does in the original TCC environment. Do not push them to an empty project without applying the baseline first.

```powershell
npx supabase init
npx supabase login
npx supabase link --project-ref <project-ref>
npx supabase db push --dry-run --linked
npx supabase db push --linked
npx supabase db lint --linked --fail-on error
npx supabase test db --linked
```

Run `supabase init` only while `supabase/config.toml` is absent. Before pushing, confirm the linked project already contains the tables from `schema.sql` and review any sandbox payment rows or duplicate identifiers called out by the migration's safety checks.

For a fresh local verification database with Docker running, apply the preserved baseline before the incremental migrations:

```powershell
npx supabase init
npx supabase start
npx supabase db query --local --file supabase/schema.sql
npx supabase db push --local
npx supabase db lint --local --fail-on error
npx supabase test db --local
```

For an existing local database that already has the baseline:

```powershell
npx supabase db push --local
npx supabase db lint --local --fail-on error
npx supabase test db --local
```

Never place the service-role key in a `NEXT_PUBLIC_` variable. Deployment is a separate, explicitly authorized operation.

## Phase 4 database core (not applied)

`20260929140000_phase4_commission_core.sql` follows `20260929131721`. Coordinate
application integration before applying it: both old service-role request RPC
overloads are retired, and request `select('*')` intentionally fails because
`admin_notes` and `submission_intent` are no longer granted to authenticated users.
Use explicit safe request columns (for example `id,request_reference,customer_id,
status,revision,lock_version,style_name,fabric,colour,clarification_notes,
submitted_at,last_submitted_at,reviewed_at,approved_at,approved_revision`).
Staff also use explicit columns; read private notes from `commission_private_notes`.
Legacy note strings remain unchanged in their original rows and are copied exactly
to that staff-only table, with unknown author/time left unattributed (the copy's
`created_at` records migration time). No existing request/order status or reference
is rewritten. Legacy revision 1 records are labelled `legacy_import`; approval
dates and actors are never inferred.

All RPCs below return a JSON object containing the current request or order row,
not a wrapper. Request results omit private notes and raw submission intent. Use
an authenticated Supabase client; execution derives identity from `auth.uid()`.
Active Admin/CEO is required for staff actions and checked under a row lock. Any
staff account, including inactive staff, is excluded from customer submission and
resubmission. The integration signatures are:

```sql
submit_bespoke_request(p_payload jsonb, p_submission_key uuid)
transition_bespoke_request(p_request_id uuid, p_action text, p_message text,
                          p_expected_version bigint, p_operation_key uuid)
resubmit_bespoke_request(p_request_id uuid, p_payload jsonb, p_response text,
                        p_expected_version bigint, p_operation_key uuid)
convert_bespoke_request_to_order(p_request_id uuid, p_expected_version bigint,
                                p_operation_key uuid)
transition_order_status(p_order_id uuid, p_status text, p_message text,
                        p_expected_version bigint, p_operation_key uuid)
add_commission_private_note(p_request_id uuid, p_note text)
```

Request actions are `start_review`, `request_changes`, `approve`, `decline`.
The graph is submitted -> under_review -> needs_clarification / confirmed /
declined; owner resubmission changes needs_clarification -> submitted. Changes
and decline require a nonblank client-visible message. Display needs_clarification
as **Changes Requested** and confirmed as **Approved**. Legacy pricing_ready and
confirmed-without-approval can enter under_review via start_review. Declined and
converted requests are terminal. No pricing_ready transition is introduced.

Conversion requires confirmed, approved_at, approved_by and approved_revision equal
to the current content revision. Price is optional. The order copies the immutable
accepted revision plus recorded approval into `accepted_request_snapshot`, links
`source_request_revision`, and begins at order_confirmed. It does not write payment
rows. Existing converted requests return their existing order, including on retries
with an earlier expected version. The existing unique source-request index remains.
The unchanged production graph is order_confirmed -> measurements_confirmed ->
in_production -> finishing -> ready -> completed. Completion calls the existing
idempotent wardrobe workflow with the database-derived actor. No cancellation
status is added.

Both `revision` and `lock_version` start at 1. Only resubmission increments revision;
every lifecycle mutation increments lock_version. Pass the last read lock_version,
not revision. Reuse an operation UUID with the **identical** arguments for transport
retries; changed arguments under a used key raise idempotency_conflict. Replay
returns current state without new events or notifications. A private actor/key
ledger and advisory locks serialize operations before entity row locks. Submission
uses a separate per-owner submission UUID and exact jsonb intent comparison; retry
lookup precedes catalogue/profile reads. New human references use private sequences
with collision retry and padding that never truncates larger values.

Submission payload uses snake_case database field names. A minimal idea example:

```json
{
  "is_idea_path": true,
  "style_name": "Bespoke commission",
  "contact_info": {"firstName": "Client", "email": "client@example.com"},
  "measurements_snapshot": {"method": "schedule"}
}
```

For a catalogue submission supply `style_id`, `fabric: {"id": "<real fabric ID>"}`
and `colour: {"id": "<real colour ID>"}`. Positional/generated option IDs fail.
The Fit must be published under an active category, with active linked options;
the database copies canonical names/code/category/option details and image source.
Idea submissions cannot claim a Fit ID; freeform options are explicitly marked
client_proposal. New references are limited to six existing owned image objects
in bespoke-references; each uses `path`, not a signed URL. Whole payload limit is
64 KiB. Customer-supplied authority/status/price/approval/version keys are rejected.

`measurements_snapshot` accepts method `saved` with optional sourceMeasurementId
(otherwise current owned profile), `manual` with unit cm/inches and a nonempty
values object using the existing 15 measurement keys, or `schedule`. Saved values,
version, unit and verification status are resolved inside SQL. Manual values are
positive and bounded by 300 cm after unit conversion. Schedule always stores empty
values and needs_confirmation; supplied verification claims are discarded.

Resubmission is a patch allowing only fabric, colour, preferences, fit_preference,
measurements_snapshot, measurement_confidence, occasion, event_name, event_date,
required_date, reference_images, special_instructions and contact_info. Origin and
appointment preference stay fixed, and a nonblank response is required. Omitted
historical fields survive unchanged; nested objects supplied in the patch replace
the object. Re-selecting the same canonical option ID preserves its historical
description. Changed selections require current published membership. Dates are
ISO dates; changed dates cannot be past. Only first submission creates an optional
appointment. Revisions cannot be updated/deleted, even through ordinary owner SQL.

Stable application-facing error messages include unauthorized, not_found,
invalid_transition, stale_version, idempotency_conflict, current_approval_required,
unavailable_fit/fabric/colour, message_required and response_required. Malformed
SQL casts may also return native invalid-input errors. Staff messages/events are
client-visible: use add_commission_private_note for confidential content.

Verification on a **disposable** database with the baseline and ordered migrations:

```powershell
# LOCAL_DATABASE_URL must point to the disposable instance, never the live project.
psql "$env:LOCAL_DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/phase4_workflow.test.sql
psql "$env:LOCAL_DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/remediation_security.test.sql
```

Both suites use pgTAP and rollback their fixtures; sequence gaps are expected.
The Phase 4 suite exercises auth roles, private-note isolation, immutable revisions,
stale/replayed operations, approval gates, catalogue canonicalization/archive
retries, conversion, production progression, wardrobe idempotency and no payment
writes. Before rollout, also run two actual concurrent sessions for same-key
submission, conversion with different keys, conflicting review actions and
resubmission/review. The serialized SQL suite does not prove concurrency behavior.

Known boundary: immutable JSON snapshots preserve business data and canonical media
locators, **not storage bytes**. This core does not change existing storage policies
or freeze historical media; referenced objects may still be removed and archived
catalogue media may require later authenticated historical-media access work.
Storage retention/race tests, live schema comparison, row-count preservation tests,
and security/performance advisors remain rollout checks. Do not claim those passed
from repository tests alone. Existing application pricing rules and unsafe broad
request selects must be updated by the application owner before deployment.

## Initial CEO provisioning

Public signup always creates a client account. To establish the first CEO, create and verify that account through the normal TCC/Supabase Auth flow, then use the Supabase SQL Editor as a trusted database administrator:

```sql
select id, email, created_at
from auth.users
where lower(email) = lower('replace-with-the-ceo-email@example.com');
```

Copy the returned UUID and run the one-time bootstrap function:

```sql
select *
from private.provision_initial_ceo('replace-with-the-auth-user-uuid'::uuid);
```

Verify the result without exposing credentials:

```sql
select staff.user_id, users.email, staff.role, staff.status, staff.created_at
from public.staff_accounts as staff
join auth.users as users on users.id = staff.user_id
where staff.user_id = 'replace-with-the-auth-user-uuid'::uuid;
```

The bootstrap refuses to run after a CEO exists. Do not add `role` to signup metadata, edit `profiles` to simulate staff access, or expose this operation through a browser route.
