# Phase 7 implementation and verification checklist

Started 2026-10-08 (Africa/Lagos). This is the final phase, not a new product area.

## Entry checkpoint verified before implementation

- Read PROJECT_HANDOFF.md, PHASE6_ROLLOUT_REPORT.md and the complete Phase 7 brief.
- Clean main, HEAD and origin/main equal GitHub main:
  `76bbb53318cff0ac541dc5354e42fa4bfdcc7712`.
- Production alias resolves to READY `dpl_FK3c3Fc7dtRtecTF5rt1CpbZDKsQ`, exact SHA.
- All 15 repository migrations are present in production history. All public/private
  tables have RLS. Four intended storage buckets retain their existing visibility.
- Fresh non-secret row fingerprints captured for 37 application/private/storage
  tables in ignored `supabase/.temp/phase7-baseline.json`. Four existing Auth users.
- Bank settings are CONFIGURED. Legitimate payment request, evidence, receipt and
  payment rows exist. Do not reset these to the historical Phase 5 baseline.

## Audit findings and implementation decisions

- [x] Replaced Clients placeholder with searchable, paginated staff-only directory,
  activity filters, profile/current measurements and linked workflow history.
  Measurements remain read-only; no customer deletion or new suspension model.
- [x] Replaced CEO-guarded Staff placeholder with directory, verified-existing-
  account onboarding, explicit identity confirmation, Admin activation/deactivation,
  immutable private audit, exact retry semantics and database CEO protection.
  Reuse normal registration/email verification; do not add email infrastructure.
  No public Admin signup, password setting by CEO, arbitrary role input or CEO CRUD.
- [x] Overview uses accurate actionable request status grouping
  and practical links to the existing operations modules.
- [x] Removed the public footer's dummy WhatsApp destination;
  preserve reference fashion imagery. Audit all business/legal copy without inventing facts.
- [x] Public/client/staff route matrix, input stability, existing-session auth,
  invalid IDs, themes, modal accessibility and responsive production checks passed.
- [x] Live Confirm email ON, Site URL/allowlist, actual email delivery, inbox
  confirmation/callback, pre-confirmation denial, post-confirmation password login
  and recovery-email/callback verified October 9 after the owner's setting change.
- [x] Full 32-step synthetic journey passed through localhost against live Supabase;
  38 live HTTP owner/second-client/staff/CEO/private-receipt checks passed. This is
  followed by the repaired production matrix and completed-workflow recheck.
- [x] Migration/RLS/storage/definer/secret/dependency review and advisors classified.
  Final: seven private deny-all INFO, 31 guarded-definer WARN, 14 unused-index INFO,
  existing leaked-password warning. The separate mandatory Confirm-email gate passed.
- [x] Static/unit/native SQL/concurrency/build tests, production matrix/recheck,
  exact QA cleanup and original-row/object preservation passed.
- [x] Application and email-test checkpoints verified equal to GitHub main and exact
  READY production deployments. Final docs-only commit equality/clean/READY is checked
  after this file's commit and recorded in the delivery message before release sign-off.
- [x] Seventeen-section report, owner-information list, CEO/Admin guides and handover.

## Release gates and boundaries

No production database writes until the additive migration and synthetic tests are
reviewed and locally verified. No real user credentials or bank details in tools,
Git or reports. Keep receipts private, stable Fit IDs and Saved Looks unchanged.
Use port 3001. Only exact tagged synthetic fixtures may be deleted after verification.
Do not restore old snapshots over legitimate concurrent activity.

Final reporting must separately identify actual blockers, owner configuration after
approval, intentional accepted findings and unimplemented future enhancements.
No Phase 8, payment gateway, email/SMS/WhatsApp infrastructure or speculative modules.
Do not declare complete until the full workflow, security, clean/pushed Git and exact
READY production deployment gates pass.

## October 9 continuation

- Migration 16 applied, original 326 rows across 37 tables preserved. Native replay:
  377 SQL assertions, seven staff concurrency/replay cases, eight Phase 4 races and
  23 Phase 6 checks passed. No existing RLS/storage policy weakened.
- Typecheck, lint and 52 tests pass with the latest changes. Latest optimized build
  passed with 68 pages. The repaired 151-check local matrix and keyboard checks pass.
- Fixed owned request UUID links and the dossier's saved_styles.saved_at query;
  improved shared confirmation dialog, removed false contact placeholders/promises,
  patched compatible vulnerable dependencies. Production dependency audit is clear.
- 151-check browser matrix passed layout/access checks but exposed one Admin root-404
  hydration exception. SiteLayout now follows rendered route segments; clean rerun passed.
- RESOLVED BLOCKER: Supabase mailer_autoconfirm=true initially allowed a temporary
  account to sign in without verification. Owner enabled Confirm email; live settings,
  pre-confirmation login/session denial and both actual-email callbacks now pass.
  Confirmation recorded at 16:40:37 UTC; fresh password login/SSR/API also passed.
  Recovery email sent 16:41:38 UTC and its callback displayed the reset form; no password
  was changed. Existing Client/Admin/CEO access was explicitly user-verified.
- Six QA identities and their sessions/business fixtures were exactly cleaned after a
  rollback rehearsal; 15 immutable guards restored, original records/storage preserved.
  A fifth legitimate Auth/profile account created during testing was retained.
- Operations/technical guides and the 17-section report distinguish the resolved Auth gate
  from post-approval business information and future enhancements. Application repairs
  are on main at 5ed69195fb06e227cb8e9ff2c226c25292f85e31 and production READY
  dpl_EqyPVXKxR8a1prv7ossWHJexXayu; all 151 deployed matrix checks passed.
- Final email tests ran on READY dpl_3J2RrL5Q27Tv32Hrz9CzdjHHRkgA at docs-only
  97de604fa048771c5d257557f9ffa91e621fd519, with unchanged application code. Both
  isolated email-test accounts were session-revoked/deleted; zero identities/profiles/
  sessions/refresh tokens remain. All 38 tables/327 legitimate rows and five existing
  passwords are unchanged. All four local email-test files were removed. No backlog work.
