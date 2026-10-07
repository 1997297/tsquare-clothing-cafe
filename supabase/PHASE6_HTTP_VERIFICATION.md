# Phase 6 disposable HTTP verification

Parent review and explicit execution only. The harness uses real Supabase HTTP clients; authoring validation is **syntax only**, with no remote execution. Run from the integrating application's cwd so its installed `@next/env` and `@supabase/supabase-js` and environment are used:

```powershell
node scripts/verify-phase6-http.mjs --manifest "C:\QA\phase6-private.json"
# Only after the separate security-contract migration is deployed:
node scripts/verify-phase6-http.mjs --manifest "C:\QA\phase6-private.json" --contract
```

Environment: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (fallback `NEXT_PUBLIC_SUPABASE_ANON_KEY`), and `SUPABASE_SECRET_KEY` (fallback `SUPABASE_SERVICE_ROLE_KEY`). HTTPS is required. The service client performs four exact Auth identity reads, denied new-RPC probes, legacy reachability/denial probes, and one guarded update attempt against a harness message. It never creates or deletes Auth users or changes membership/configuration. Session clients use the public key and real password sign-ins, with persistence/refresh disabled. No sessions or tokens are written into the manifest; password sign-in creates ordinary Auth sessions.

Supply an **untracked, private, writable** JSON manifest. Each of `client`, `other`, `admin`, and `ceo` must contain distinct `id`, `email`, and `password` fields. Example structure (placeholders only):

```json
{
  "tag": "tcc-phase6-parent-qa",
  "users": {
    "client": { "id": "QA-UUID", "email": "QA-EMAIL", "password": "QA-PASSWORD" },
    "other": { "id": "QA-UUID", "email": "QA-EMAIL", "password": "QA-PASSWORD" },
    "admin": { "id": "QA-UUID", "email": "QA-EMAIL", "password": "QA-PASSWORD" },
    "ceo": { "id": "QA-UUID", "email": "QA-EMAIL", "password": "QA-PASSWORD" }
  },
  "records": {}
}
```

Before sign-in or any business writes, admin `getUserById` must match each exact manifest UUID, exact email, and `user_metadata.tcc_phase6_verification === tag`. Tag must start `tcc-phase6-` and have a bounded letters/digits/dot/underscore/hyphen suffix. Parent must provision two customer QA accounts and existing active Admin/CEO QA memberships; the harness never activates staff. Keep this manifest outside committed files and use private filesystem permissions. Atomic replacement retains its credentials and existing record fields; do not edit the manifest concurrently.

Each invocation appends `records.phase6HttpRuns`, recording operation intents/keys **before dispatch**, then returned IDs immediately before further operations. It creates two requested appointments, one pending cancellation declined by staff, and one linked thread, normally five messages and one private note. Intended raw-insert IDs and unexpected successful RPC IDs are retained too. On transport ambiguity, parent can replay the recorded creation intent with the same authenticated QA actor/key to recover its ID. Do not blindly rerun ambiguous operations with fresh keys. Subsequent deliberate invocations create separate fixtures; they do not resume or clean an earlier run. Requests are capped at 200, with 12-second request timeouts, a six-minute dispatch deadline and fewer than 20 normal messages per run. No SDK error bodies, emails, tokens, IDs, or customer content are printed. Output contains named passes and a total; failures exit nonzero with only the fixed check label.

Coverage includes owner/anonymous isolation, client confirmation/completion/closure denial, rejected caller-selected read side and staff sender spoof, safe client RPC projections and private-note replay, exact appointment/thread/message/status replay, intent conflict, invalid input/context/pagination/read sequence, raw ownership/cursor mutation and message update/delete protection, small-page pagination, closure/reopening, and new-RPC service-key denial. Read tests explicitly place arrival N+1 after snapshot N and before acknowledgement; simultaneous Admin/CEO acknowledgements test a monotonic shared **read by TCC** cursor, not per-employee unread state. Rejected DML is followed by exact fixture readback; zero affected rows count only when that row is demonstrably unchanged and are labelled RLS blocking. DELETE requests are negative security probes scoped to the harness's own fixtures; there is no successful cleanup/delete path.

Default expansion mode checks that the three old service endpoints remain callable but reject wrong-owner context consisting exclusively of the harness's newly created QA rows. It does not invoke their successful write paths or retire them. `--contract` instead requires those three endpoints and direct `sender_id,sender_name` selection to be denied. Expansion direct sender selection checks only the harness's newly generated staff message, whose label is `TCC Concierge`; it makes no claim about legacy sender privacy.

All business reads are scoped to the invocation's exact fixture IDs. Positive scheduling, global inbox/counts, real overlap races, logout revocation, application server-action bypasses, legacy production sender/context privacy, storage policies and advisors are **not covered** here. Parent's native tests, browser checks and rollout preflight cover their separate responsibilities. An HTTP access-denial result establishes exposed API denial, not an independent catalogue-level ACL audit. A failing probe may reveal a successful unauthorized fixture write; retained IDs allow parent investigation and cleanup.

Parent owns execution, review and bounded fixture cleanup, including linked messages, lifecycle/notification records, private notes/attribution and idempotency rows according to existing immutable controls. The harness performs no cleanup and changes no global guards. Preserve the manifest until cleanup and any ambiguous operation recovery are verified. Do not expose it in logs, commits or review artifacts.
