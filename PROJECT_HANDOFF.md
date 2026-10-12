# TSquare Clothing Cafe — Project Handoff

Last updated: 2026-10-13 (Africa/Lagos)

## Current scope

Phases 1–7 and post-development corrections Stages 1, 2, 2.1 and 3 are complete.
Stage 3 refined the existing dark/light colour system, contrast, surfaces and visual
usability only. Stop here: no further phase, redesign or corrections backlog is authorized.

One semantic RGB-token system in globals.css and tailwind.config.ts covers page,
surface/elevation/hover, typography, control boundaries/focus, actions and status colours.
Legacy aliases keep established components compatible; there is no second framework.
Photo copy has stable light foregrounds in both modes. Theme persistence, cross-tab
synchronization, native colour schemes and denied-storage handling were verified.

| Token | Light | Dark |
| --- | --- | --- |
| Page | #F4EFE6 | #101113 |
| Surface | #FFFCF7 | #22252A |
| Elevated | #ECE5D9 | #2B2E34 |
| Hover | #E5DBC9 | #353941 |
| Primary text | #171717 | #F5F4F1 |
| Secondary text | #4B4843 | #C3C6CB |
| Muted text | #665F55 | #ADB2BA |
| Decorative border | #D9D0C3 | #464B54 |
| Control border | #887B69 | #808791 |
| Focus | #70522F | #D2BD98 |
| Text accent | #775934 | #C6AF8A |
| Filled action | #A58B62 | #B8A17D |
| Pending surface | #FBE7EB | #44262D |
| Pending text | #9C233D | #FFD0D6 |

Notification bubbles remain #BE123C with white numbers. Complete success/warning/error,
information/progress, hover and photographic tokens remain in globals.css.
Public collections/fit/configurator/auth/content pages, Client/Admin/CEO workspaces,
forms, dialogs, payments, bank cards, Concierge bubbles, timelines, tables and status
states use the shared palette. Routes, actions, labels, fonts and photography are preserved.

The preceding housekeeping commit 6cccf0dd902fb9f0668a65bd1bf3f9cc3ef7aea2 removed
16 files: 13 historical reports/notes, two obsolete audit scripts and one empty file.
It was pushed with Stage 3. Removed historical material remains recoverable from Git.
Do not recreate historical report files; use this compact operational handoff instead.

Keep this handoff and AGENTS.md: they are required by the working agreement.
Operational and integration documentation remains because it supports safe maintenance.

## Last verified release checkpoint

Verified October 13, 2026 (Africa/Lagos):

- Stage 3 application: b6bbefd0352c6224c90a12f407d87fced6421590.
- Exact READY application deployment: dpl_82M1F6BgNkEpr7KoAgCsUs56bLKM.
- Alias: https://tsquare-clothing-cafe.vercel.app, independently matched to that deployment.
- Local main, origin/main and GitHub matched before this handoff-only closure commit.
  It changes documentation only; its exact Git/READY alias and final public smoke
  results are reported in the delivery response.
- Typecheck, lint, 87 tests and optimized 68-page build passed. The deployed build
  also generated all 68 pages with zero catalogue fallback warnings.
- 72 isolated browser scenarios passed: 54 theme/bank/Concierge/appointment and
  18 payment-attention cases. All backend actions were mocked, with zero live writes.
- 54 before checks/screenshots; 152-case local audit across Public/Client/Admin/CEO
  and secondary routes at 390/768/1440 in both themes. Zero overflow, exceptions or
  business writes. Its sole defect was shared active-profile avatar text (two cases,
  4.44:1); semantic primary ink fixed it, with two new nested-tint regression tests.
- Final-build dashboard/profile regression: 42 checks, 1,954 text samples and nine
  interactions passed across all three roles, both themes and all three widths.
- Production: 76 checks, 6,220 text samples and 15 interactions passed, with zero
  contrast failures, overflow, browser exceptions or business writes. Actual
  Client/Admin/CEO login succeeded using disposable QA accounts, not existing passwords.
- Neutral/action/status text passed 4.5:1 tests; control edges and focus passed 3:1
  palette tests. Rendered text was checked with size-aware thresholds. Photo overlays
  and disabled states were visually reviewed; decorative pipes are not text-content
  failures. This is representative Chromium QA, not a formal cross-browser certification.
- Theme toggle/reload persistence, cross-tab metadata synchronization, denied-storage
  operation, navigation drawers, search, inputs, hover/focus/disabled states, statuses,
  dialogs, pending-payment tint/counts and review/refresh behaviour passed.
- AST comparison: 84 style-only source files; only globals.css and the theme provider
  have broader theme-specific changes. Auth, financial logic, schema, catalogue data,
  stable Fit IDs/Saved Looks, original images, logo and font families are unchanged.
- Known-private-secret scan: 439 source/browser files, zero matches; private files untracked.
- Three UUID/email/tag-verified QA accounts were removed after ownership checks.
  Their Auth users, profiles, staff memberships, sessions and refresh tokens all count zero.
  Local QA credentials, screenshots, browser profiles and generated fixtures were removed
  after recording these preservation results. Reusable verification scripts are retained.
- No known remaining Stage 3 blocker or required manual configuration. Do not recreate
  completed QA accounts or begin the next phase without a new user request.

The UI changes highlight genuine pending payment evidence and show staff-only
action counts. Exact predicates are in src/lib/payments/attention.ts and
src/lib/staff-attention.ts. Counts use authenticated server queries with existing RLS;
no financial decisions, ledger logic or policies changed. Positive receipt transitions
were tested with isolated fixtures, not decisions on legitimate production receipts.

## Production safety

The October 13 preservation check matched all 377 original rows across 38
application/storage tables, five original Auth/password fingerprints, four buckets,
eight Storage objects and policy fingerprints. Changed tables: zero. Existing bank
configuration, payments, receipts and business history are unchanged. Zero application
tables lacked RLS; zero application triggers were disabled. These are checkpoint figures,
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

