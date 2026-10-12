# TCC Stage 2.1 — Payment verification visibility and dashboard action indicators

Status: implementation, production verification and QA cleanup passed.
October 12, 2026 (WAT). Final documentation checkpoint: see section 8.
Stage 3 has not started.

## 1. Payment verification highlighting

Staff payment-request cards with pending evidence have a restrained red-tinted surface,
visible **Needs Verification** text and prominent **Review Payment** link treatment.
The whole card is one keyboard-accessible link (no nested button/link), targeting the
specific pending submission's review form on the existing authorized request detail.
Multiple pending submissions show their count. Action cards precede normal cards;
newest-first ordering within each group and existing search/status filters remain.
Client cards retain their normal appearance and chronological ordering.

## 2. Exact Needs Verification definition

A distinct payment_submissions.id whose authoritative status is
`awaiting_verification`, attached to an `active` payment request with matching order
and customer IDs. No amount, unpaid balance or unsubmitted request implies attention.
Verified/rejected/unknown/superseded statuses and cancelled requests do not qualify.
The database currently permits only one pending submission per payment request.
The presentation defensively deduplicates IDs and supports multiple pending items;
the fixture test of that branch does not relax the database constraint.
Each existing card represents one payment request, not an aggregate order card.

## 3. Dashboard counters and exact actionable states

| Shortcut | Count unit and definition | Destination |
| --- | --- | --- |
| Verify payments | Distinct pending submission on an active request | `/admin/payments?status=pending` |
| Review requests | Request in submitted, under_review, or confirmed; the last awaits deliberate order conversion | `/admin/requests?status=attention` |
| View orders | Order in order_confirmed (measurement confirmation) or ready (handover/completion) | `/admin/orders?status=attention` |
| Appointments | Appointment requested OR having a pending_review change request, counted once even if both apply | `/admin/appointments` |
| Concierge | Conversation with at least one client message above the shared staff_read_seq | `/admin/concierge?unread=1` |

No badge on Add Fit or Find client. In-progress production, completed orders,
requests awaiting the client's reply, and outstanding balances are not pending staff
decisions. The separate Active Orders informational metric remains unchanged.
Badges hide at zero, cap visually at 99+, retain exact accessible counts, and reserve
label space. Failed/unknown counts show **Count unavailable**, never a fabricated zero.

## 4. Destination consistency and refresh

Request/order filters share their status constants with server counts. The payment
filter/card/header share the deduplicated predicate; the dashboard uses an exact
pending-submission count joined to active requests, with no one-to-many row expansion.
Existing database constraints enforce matching request/order/customer identities.
Request/order list reads use deterministic 500-row batches and a fail-visible safety
bound rather than silently stopping at the API response cap.

Appointments retain the existing Requested and Changes awaiting review filters;
their union is the badge count, not the number of all historical appointment cards.
The shortcut opens the existing all-appointments view because it has no combined
filter. Concierge counts conversations, not messages, to match the unread inbox cards.

Existing successful actions revalidate the Admin layout/Overview and refresh the
destination. Overview uses fresh authenticated server reads on navigation/reload,
manual Refresh counts, tab return and restored-page refresh, with no polling or new
public count endpoint. Only one extra exact order-action count query was added;
the existing cached-per-render atelier aggregation is reused.

## 5. Authorization

Overview now explicitly requires active staff before its queries, in addition to the
existing Admin layout/route guards. Queries use the caller's server Supabase session
and existing RLS, never a service key. Admin and CEO share authorized operational
counts; CEO-only bank editing remains unchanged. Client/public routes do not receive
these staff props. No financial decisions or authorization policies were changed.

Live temporary-role query checks passed: Admin and CEO match independent SQL;
Client sees only its own zero counts; anonymous payment-submission access is denied.
Actual local and production Client/Admin/CEO browser logins and staff/public guard
checks passed. These used temporary role accounts, not legitimate users' credentials.

## 6. Tests and responsive checks

- TypeScript: passed.
- ESLint: passed.
- Automated tests: 78 passed, including eight new Stage 2.1 regressions.
- Optimized production build: passed, 68 generated pages.
- New isolated real-component browser harness: all 18 scenarios passed at
  390/768/1440, dark/light, Admin/CEO/Client. Synthetic snapshots test positive
  payments, duplicate IDs, multiple submissions, reviewed-state removal, priorities,
  pending filters, zero/unknown/99+ badges, keyboard focus and actual colour contrast
  (new label/badge text at least 4.5:1). Actual Review Payment navigation reaches the
  real review form anchor. No uncaught browser errors or backend writes.
- Known-private-secret scan: 438 source/browser files, zero matches; no private
  environment/temporary files tracked.
- Actual Next local production build: all 44 checks passed at 05:37 WAT, including
  Client/Admin/CEO login, public/client staff denial, exact dashboard counts, pending
  filters, request/order destination totals, existing payment-detail access, CEO-only
  bank Edit visibility, all widths/themes, refresh and revisit. No browser errors or
  business writes.
- Exact application deployment: all 44 production browser checks passed at
  05:48 WAT on October 12, covering the same roles, responsive/theme matrix,
  authorized counts, destinations and guards. Zero browser errors or business writes.

No legitimate receipt will be verified/rejected to test presentation. Production
currently has zero pending payment submissions; positive payment UI/transition cases
are therefore explicitly synthetic, not a claim of a real production payment decision.

## 7. Production preservation

Fresh baseline: 38 application/storage tables, 376 rows, five original Auth users.
This supersedes the older Stage 2 baseline and preserves subsequent real activity.
Only three clearly tagged temporary Auth identities and two QA staff memberships
were created. No QA business records, bank edits, financial submissions or emails.
All same-origin business POSTs are blocked during read-only browser verification.
All three temporary Auth users and their profiles, two staff memberships, sessions
and refresh tokens are removed; each corresponding remaining count is zero.
Deletion was restricted to manifest IDs whose email and stage tag were verified,
after checking that no business or Storage records referenced those identities.

Final comparison matched all 376 original full-row fingerprints across all 38 tables.
Bank configuration, payment evidence, verified-payment ledger, order balances and
client records are unchanged. All five original Auth/password fingerprints, four
Storage buckets, eight Storage objects and policy fingerprints match. Zero application
tables lack RLS; zero application triggers are disabled. No snapshot was restored.

The initial cleanup verification timed out after account deletion. A separate Auth
read confirmed all three accounts absent; only read-only verification was retried,
using smaller fingerprint-query batches. The final comparison passed without any
additional deletion or production-data repair.

Stage-owned local credentials, screenshots, generated bundle, browser profiles and
one-run proof/QA helpers are removed during closure. Reusable synthetic tests remain
tracked. The non-secret deployment helper is removed after the final READY check.
No schema migration or RLS/storage-policy change is required for this correction.

## 8. Git and deployment

Entry: `9be78d12f5288f54ad4d19f251529e31e0fe3256`, synchronized clean main.
Entry production: `dpl_5ryVWiZoeYWnqZgqdLFBwC15BaiA`, exact SHA, READY, production,
main, alias https://tsquare-clothing-cafe.vercel.app.
Application commit: `40d7a82cb92cce09b17fc68bdbf0056f6b24889a`, pushed to main with
verified local/origin/GitHub equality and a clean worktree at the application checkpoint.
Deployment: `dpl_FYEZ7iTP44t7FexeCbUyopLvW6mq`, READY, production, main, exact commit,
with https://tsquare-clothing-cafe.vercel.app assigned. Build logs confirm all 68 pages
and zero catalogue fallback warnings. Git-triggered deployment appeared after a delay;
no manual deployment, configuration change or extra application commit was needed.
The production alias was also independently resolved through Vercel's alias API and
matched that deployment exactly.

The final documentation-only commit updates this report and PROJECT_HANDOFF.md;
application source is unchanged from the verified commit above. After pushing it,
verify clean local HEAD/origin/main/GitHub equality, its exact READY deployment and
the live production alias, then perform a final public/unauthenticated HTTP smoke.
The final delivery message records that SHA and deployment ID, avoiding a circular
self-referential commit hash inside this report.

## 9. Remaining work / manual actions

No unresolved Stage 2.1 application, authorization or production-data blocker remains.
The final documentation checkpoint described above is the last release operation.
No manual Supabase configuration or new environment variable is needed.
No real payment-verification decision was performed; positive receipt transitions
were tested synthetically to preserve legitimate financial activity.
Optional pre-existing hardening and future theme work are not Stage 2.1 blockers.
Stop after Stage 2.1; Stage 3 theme refinement is not authorized by this directive.
