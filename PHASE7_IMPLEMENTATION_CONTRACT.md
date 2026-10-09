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
- [ ] Final public/client/staff route audit, input stability, auth persistence, invalid
  IDs, error/loading states, themes, accessibility and responsive verification pending.
- [x] Full 32-step synthetic journey passed through localhost against live Supabase;
  38 live HTTP owner/second-client/staff/CEO/private-receipt checks passed. This is
  not yet final production-site verification of the latest code.
- [ ] Complete migration/RLS/storage/definer/secret/dependency review and advisor
  classification pending. Current security baseline: six private deny-all INFO,
  26 guarded-definer notices, pre-existing leaked-password configuration warning.
- [ ] Final static/unit/native SQL/concurrency/build tests; safe synthetic production
  test, exact cleanup, row preservation; exact final Git and deployment pending.
- [ ] Presentation report, owner-information list, CEO/Admin guides and technical handover.

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
- BLOCKER: Supabase mailer_autoconfirm=true allowed the permitted email-test account
  to sign in without verification. Owner asked to enable Confirm email. Added explicit
  same-origin signup callback. Actual email delivery/confirmation remains unverified.
- Six QA identities and the synthetic journey still require exact reviewed cleanup.
  Preserve the ignored secret manifest and all legitimate current financial records.
- Operations/technical guides drafted. Final 17-section rollout report must distinguish
  the Auth blocker from post-approval business information and future enhancements.
