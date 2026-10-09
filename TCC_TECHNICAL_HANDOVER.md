# TCC technical handover

## Application and deployment

- Next.js 15 App Router, React 19, TypeScript, Tailwind CSS 3.
- Next.js security patch: 15.5.27. PostCSS 8.5.29 and source-map-js 1.2.2 overrides
  remove vulnerable transitive copies. Sharp is locked to 0.35.5. Keep the lockfile.
- GitHub `1997297/tsquare-clothing-cafe`, production branch `main`.
- Vercel project `prj_SHRDiNsdKldDRJG7RfzPaXD0zXNG`;
  presentation origin `https://tsquare-clothing-cafe.vercel.app`.
- Verify exact commit, READY deployment and production alias after every release.
  A successful push alone is not deployment verification.
- Local browser port: **3001**. Required checks: `npm run typecheck`, `npm run lint`,
  `npm test`, `npm run build`.

## Environment variable names only

Configured application names: `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`,
`NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_TCC_DEMO_MODE`.

Compatibility fallbacks exist for `NEXT_PUBLIC_SUPABASE_ANON_KEY` and
`SUPABASE_SERVICE_ROLE_KEY`; do not add competing values unnecessarily. The secret
key is server-only. Public variables are embedded at build time; redeploy after
changing them. Production demo authentication is disabled by code regardless of
the public demo flag. Never commit `.env.local` or copy credentials into reports.

## Supabase and roles

Project reference: `egahodxarflluctmnkqu`. Auth sessions are cookie-backed through
the browser/server clients and middleware. Server actions and database APIs enforce
their own authorization; navigation is not a security boundary.

### Authentication release gate verified October 9

The remaining blocker was hosted Auth configuration: `mailer_autoconfirm: true`
previously allowed registration without proving mailbox ownership. The owner enabled
**Confirm email**. Public Auth settings and authenticated Supabase CLI
`config pull --dry-run` independently verified the following live values without writes:

- Confirm email: ON (`auth.email.enable_confirmations=true`, `mailer_autoconfirm=false`).
- Site URL: `https://tsquare-clothing-cafe.vercel.app`.
- Callback allowlist: `https://tsquare-clothing-cafe.vercel.app/auth/callback`.

The production application supplies the callback's `next=/account` or
`next=/auth/reset-password`; both were retained by the verified actual-email callbacks.
Do not confuse desired development entries with live configuration: localhost entries
were not present in this observed allowlist. No localhost code/auth flow was modified.
Any later local email-callback configuration is separate from this passed production gate.

Controlled signup received no session and could not access `/account` or sign in before
confirmation. The actual delivered confirmation link completed PKCE, established a
persistent session, and allowed a fresh password login plus protected SSR/API access.
The production Forgot Password form delivered an actual recovery email; its real link
reached the authenticated reset form. No password was changed. No admin-generated
link substituted for inbox delivery. Both temporary email-test accounts were globally
session-revoked/deleted and verified absent; local cookies/credentials/links were removed.
All five legitimate passwords and all 327 production rows across 38 tables are unchanged.
Existing Client/Admin/CEO dashboard access was user-verified, not automated with their
legitimate credentials. Detailed timestamps/evidence are in PHASE7_ROLLOUT_REPORT.md.

The application uses its existing PKCE code-exchange callback. Preserve SMTP and URL
settings; no new email service, environment change or code repair was needed in this
final pass. Confirmation/recovery links are one-use and expire; complete them promptly
with the initiating browser's PKCE state. Earlier reused/expired links were diagnosed
from Auth logs, and a normal resend produced the successful confirmation link.
Previously autoconfirmed accounts are not retroactively inbox-verified; the CEO must
verify staff work identity through a trusted channel before granting access.

Client owns their profile and business records. Active Admin can operate the atelier.
CEO additionally manages Admin access and official bank configuration. Authority
comes from `staff_accounts`, not user-editable metadata. Inactive staff do not fall
back to a client account. No new client suspension/deletion system was introduced.

Apply only versioned migrations in `supabase/migrations/` in timestamp order.
Sixteen migrations are currently applied, including
`20261008002757_phase7_people_management.sql`. Do not rewrite already-applied files.
Phase 7 adds guarded people RPCs, private immutable staff access history, version
checks and serialized final-CEO protection; existing RLS/storage policies are retained.

The local native PostgreSQL harness replays schema/migrations, tests rollback and row
preservation and exercises real races. It is not a replacement for Auth/Storage HTTP
or browser verification. See `scripts/verify-phase7-launch.ps1` and SQL suites.

## Storage boundaries

| Bucket | Visibility | Limit | Purpose |
| --- | --- | --- | --- |
| `profile-avatars` | Public reads; guarded writes | 5 MB | JPEG/PNG/WebP profile images |
| `catalogue-media` | Private; guarded published/staff access | 8 MB | JPEG/PNG/WebP Fit galleries |
| `bespoke-references` | Private | 10 MB | JPEG/PNG/WebP request references |
| `payment-receipts` | Private; owner/active staff | 3 MB | JPEG/PNG/WebP/PDF receipt evidence |

Receipts use guarded endpoints and short-lived access, not saved public/signed URLs.
Preserve immutable registered receipt metadata and financial history. Never disable
RLS or make a private bucket public to repair access.

## Operational routes and invariants

`/account`: profile, measurements, saved, requests, orders, payments, appointments,
concierge, notifications and wardrobe. `/admin`: overview, collections, requests,
orders, payments, appointments, concierge, clients and profile. `/admin/staff` is
CEO-only. People dossiers link to the existing authoritative modules.

- Preserve stable Fit IDs and Saved Looks. Archive catalogue records.
- Preserve request revisions, approved order snapshots and actor attribution.
- Financial amounts use integer minor units. Pending evidence is never verified money.
- Mutations use operation keys/current versions. Do not remove idempotency guards.
- Appointments use Africa/Lagos/WAT and canonical confirmed start/end timestamps.
- Concierge messages/history are retained; private notes are not client messages.
- JS-only forms must remain POST-only and inert/disabled until hydration.

## Security findings and maintenance

The production dependency audit is clear after the patch. The full audit still lists
9 development-tool findings (7 high, 2 moderate) rooted in braces and selector parsing
through Tailwind/ESLint. No client input is compiled as CSS/glob patterns; these tools
process trusted repository source during development/build. Keep untrusted PRs out of
secret-bearing builds. Revisit compatible upstream fixes; do not force a framework or
Tailwind major upgrade merely to remove advisory counts.

Supabase advisor notices require classification: private deny-all ledgers and guarded
SECURITY DEFINER APIs are intentional. Keep pinned search paths and restrictive grants.
Unused-index notices are not evidence that an index is safe to delete. Enable leaked-
password protection in Auth password-security settings if supported by the plan.

## Data safety and parallel work

Real bank details and financial activity were added after Phase 5. Historical reports
about an empty bank row are not the current baseline. Never restore an old snapshot
over legitimate later activity. QA cleanup must target the exact tagged fixture IDs,
retain all real rows and use the Storage API for objects.

Read `PROJECT_HANDOFF.md` before work. Two accounts need separate worktrees and
`codex/<task>` branches, with review before integration. Never share an actively edited
worktree or copy credentials into commits/messages. Final QA and cleanup status belong
in the rollout report; this architecture guide does not itself certify completion.
