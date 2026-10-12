# TSquare Clothing Cafe — Project Handoff

Last updated: 2026-10-13 (Africa/Lagos)

## Current scope

Phases 1–7 and post-development corrections Stages 1, 2 and 2.1 are complete.
Stage 3 theme refinement is now authorized by the October 12 user brief. It covers
the existing dark/light colour system, contrast, surfaces and visual usability only.
Do not redesign routes/layouts, change workflows or start Phase 8/new major features.

The previous task was repository housekeeping: remove historical reports, superseded
planning/progress notes, two obsolete screenshot-audit scripts and an accidental
empty file. No application source, assets, dependency configuration, tests, database
schema, production data or secrets were changed. Cleanup is checkpointed locally as
6cccf0dd902fb9f0668a65bd1bf3f9cc3ef7aea2; it has not yet been pushed or deployed.

Stage 3 is in progress. Read the full user attachment c90a8fe6-350f-41ee-835f-f688f36edc73
before resuming. Required: shared semantic tokens; all Public/Client/Admin/CEO surfaces;
preserved payment attention indicators; before/after rendered QA at 390/768/1440,
both themes; contrast/focus and theme persistence checks; typecheck/lint/tests/build;
exact Git/READY deployment and production smoke. No business or authentication logic
changes. Final results should be delivered to the user, not recreate removed report files.
Ignored supabase/.temp/stage3-* helpers/state are owned by this pass. The manifest may
contain temporary QA credentials and baseline fingerprints: never display or commit it.
Inspect its status before retrying setup/cleanup after interruption; do not blindly
recreate identities or discard preservation evidence. Only stage-tagged disposable
accounts are permitted for browser reads; never edit legitimate users or financial data.

Stage 3 working evidence (not a release): fresh baseline is 377 rows across 38 tables
and five original Auth users; the extra row since the earlier release is legitimate.
Three tagged disposable QA identities exist in the ignored manifest and must be cleaned
up through stage3-ops.mjs only after production verification. Before screenshots passed
54 checks. Final typecheck, lint, all 87 tests and the optimized 68-page build passed.
Isolated browser fixtures passed 18 payment-attention scenarios and 54 bank,
Concierge, appointment and theme-control scenarios, with no backend writes.
The full local matrix audited 152 cases / 10,701 text samples with zero overflow,
browser exceptions or business writes. It found only the shared active-profile avatar
initials at 4.44:1 on Admin/CEO light desktop. ProfileAvatar now uses semantic primary
ink, with two nested-tint regression tests; the 42-case final-build three-role browser
rerun passed 1,954 text samples, nine interactions, zero browser errors and zero writes.
Decorative standalone Client-header dividers are correctly
excluded from text contrast. Production push, both-theme production verification and
ownership-checked QA cleanup are still required.
Source comparison verified style-only edits outside the stylesheet/theme provider;
authentication, financial code, schema, catalogue data, photography and logo are unchanged.
The final-build known-secret scan covered 439 tracked-source/browser files with zero matches;
environment files and temporary QA state are untracked. Theme refinements use one
semantic RGB token system, readable neutral/status palettes, native control schemes,
visible keyboard focus and photo-specific copy colours. No new styling framework.

Cleanup verification: 16 files removed (13 historical reports/notes, two obsolete
audit scripts and one empty file). No non-generated empty project files or dangling
references to the removed files remain. Typecheck, lint and all 78 tests passed.
No production build was needed because runtime source and configuration are unchanged.

Keep this handoff and AGENTS.md: they are required by the working agreement.
Operational and integration documentation remains because it supports safe maintenance.

## Last verified release checkpoint

Verified October 12, before this housekeeping task; not a fresh production inspection:

- Stage 2.1 application: 40d7a82cb92cce09b17fc68bdbf0056f6b24889a.
- Final documentation/main: 69a23c5f9eafcaef391ed5fa635b5f604ae735aa.
- Exact READY production: dpl_8qAZsL8xNDuv6AUmrAYU9WY531Jp.
- Alias: https://tsquare-clothing-cafe.vercel.app, independently matched to that deployment.
- Local main, origin/main and GitHub matched with a clean worktree at release.
- Typecheck, lint, 78 tests and optimized 68-page build passed.
- 18 isolated component scenarios, 44 local and 44 production browser checks passed
  at 390/768/1440 in both themes with Client/Admin/CEO roles. Six final public/auth
  HTTP checks passed on the final documentation deployment.
- Known-private-secret scan: 438 source/browser files, zero matches; private files untracked.
- Stage 2.1 temporary users, memberships, sessions, credentials, screenshots and
  helpers were removed. Do not recreate completed QA fixtures.

The UI changes highlight genuine pending payment evidence and show staff-only
action counts. Exact predicates are in src/lib/payments/attention.ts and
src/lib/staff-attention.ts. Counts use authenticated server queries with existing RLS;
no financial decisions, ledger logic or policies changed. Positive receipt transitions
were tested with isolated fixtures, not decisions on legitimate production receipts.

## Production safety

The latest completed preservation check matched 376 original rows across 38
application/storage tables, five original Auth/password fingerprints, four buckets,
eight Storage objects and policy fingerprints. Zero application tables lacked RLS;
zero application triggers were disabled. These are historical checkpoint figures,
not targets to restore if legitimate activity has since occurred.

- Preserve real bank configuration, payment history, receipts, balances and all
  customer/staff records. Older empty-bank and lower-row-count reports are obsolete.
- Never reset/reseed production, restore an old snapshot or weaken RLS.
- Preserve stable Fit IDs, Saved Looks, immutable revisions, audit history and
  idempotency/version guards. Archive/deactivate instead of deleting business records.
- Use only new versioned migrations; never edit/reapply already-applied migrations.
- QA cleanup must verify exact fixture IDs/tags and ownership first. After an ambiguous
  timeout, check what already completed before retrying any mutation.
- Do not delete ignored local state, old manifests or another account's worktree
  merely because it is outside Git. Check ownership, active processes and recovery needs.
- Never commit environment files, credentials, email links, tokens or service keys.

## Authentication and authorization

Actual inbox confirmation, post-confirmation login and password-recovery callbacks
passed their release gates, including the Stage 1 session-cookie regression.
No existing password was changed. Preserve the working PKCE callback and SMTP settings.

Previously verified production settings: Confirm email ON, Site URL
https://tsquare-clothing-cafe.vercel.app and callback allowlist entry
https://tsquare-clothing-cafe.vercel.app/auth/callback. Recheck live settings before
making configuration claims or changes. Previously autoconfirmed staff identities
still require independent work-identity verification.

Active staff authorization comes from staff_accounts, not editable Auth metadata.
Admin operates the atelier; CEO additionally manages staff and bank configuration.
Inactive staff must not fall back to Client privileges. Session-only cookies can
survive browser session restore; do not claim guaranteed browser-close detection.

## Maintained references

- TCC_OPERATIONS_GUIDE.md: owner setup, daily workflows and optional business decisions.
- TCC_TECHNICAL_HANDOVER.md: environment names, roles, storage boundaries and security notes.
- PHASE5_IMPLEMENTATION_CONTRACT.md, PHASE6_IMPLEMENTATION_CONTRACT.md and
  PHASE7_IMPLEMENTATION_CONTRACT.md: retained implementation invariants and original scope.
- supabase/README.md, supabase/PHASE5_DATABASE.md and supabase/PHASE6_DATABASE.md:
  schema/integration and migration guidance.
- supabase/PHASE6_HTTP_VERIFICATION.md: guarded HTTP-test setup and cleanup limitations.
- supabase/migrations/, supabase/tests/, tests/ and scripts/verify-*: maintained
  migrations and reusable regression tools.
- public/images/styles/CATALOGUE-ASSET-SOURCES.md: retained image provenance.

Historical reports and superseded proposals remain recoverable from Git commit
69a23c5f9eafcaef391ed5fa635b5f604ae735aa. Read a removed file without restoring it
with `git show 69a23c5f9eafcaef391ed5fa635b5f604ae735aa:<repository-relative-path>`.
Do not use historical snapshots as current production truth.

## Local workflow and verification

Read AGENTS.md and this file first; inspect branch, status and commits before edits.
Preserve unrelated changes. Local browser port is 3001:
`npm run dev -- -p 3001`. Avoid concurrent Next dev/build processes writing .next.

Run `npm run typecheck`, `npm run lint` and `npm test` for application changes.
Run `npm run build` before delivery when production behavior changes. Supabase changes
also require migration, preservation, RLS/storage and advisor verification. Do not
run live mutation harnesses without controlled fixtures and explicit scope.

After an authorized push, verify exact Git equality, READY deployment and active
production alias; a successful push alone is not release verification.
For parallel accounts, use separate worktrees and codex/<task> branches, non-overlapping
ownership and reviewed integration. Preserve the existing Worker2 worktrees.

Optional existing hardening and owner choices are recorded in the maintained guides;
they are not authorization to begin another phase. In particular, assess leaked-password
protection availability without silently changing Auth configuration.

