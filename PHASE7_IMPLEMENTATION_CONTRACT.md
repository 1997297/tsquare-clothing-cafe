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

- [ ] Clients is a placeholder: implement searchable, paginated staff-only directory,
  activity filters, profile/current measurements and linked workflow history.
  Measurements remain read-only; no customer deletion or new suspension model.
- [ ] Staff is a CEO-guarded placeholder: implement directory, verified-existing-
  account onboarding, explicit identity confirmation, Admin activation/deactivation,
  immutable private audit, exact retry semantics and database CEO protection.
  Reuse normal registration/email verification; do not add email infrastructure.
  No public Admin signup, password setting by CEO, arbitrary role input or CEO CRUD.
- [ ] Overview has real data but needs accurate actionable request status grouping
  and practical links to the existing operations modules.
- [ ] Public footer has a dummy WhatsApp destination. Remove the false destination;
  preserve reference fashion imagery. Audit all business/legal copy without inventing facts.
- [ ] Final public/client/staff route audit, input stability, auth persistence, invalid
  IDs, error/loading states, themes, accessibility and responsive verification pending.
- [ ] Full 32-step synthetic journey and second-client backend isolation pending.
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
