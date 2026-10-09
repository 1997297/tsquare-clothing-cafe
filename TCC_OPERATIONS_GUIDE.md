# TCC operations and owner handover

This guide describes the implemented application. Release verification and remaining
work are recorded separately in `PHASE7_ROLLOUT_REPORT.md` and `PROJECT_HANDOFF.md`.

## CEO first use

1. Sign in with the existing CEO account. Open **Profile** and review personal details.
2. Open **Payments** and review the official bank destination. Bank details are
   already configured; do not replace them with placeholders or reset the singleton.
   Changes affect only newly issued requests. Existing requests retain their snapshot.
3. Review **Collections**, including gallery order, cover, fabrics and colours. Keep
   reference imagery until TCC supplies approved replacements; confirm usage rights.
4. Add Admin staff through **Staff**, following the process below.
5. Use Overview to review Requests, payment evidence, appointments and Concierge.
6. Confirm the public contact details, operating hours, social destinations and draft
   legal copy with TCC before accepting them as final business information.

## Add or deactivate an Admin

Release prerequisite: enable Supabase **Confirm email** and pass the real confirmation
test. The October 9 check found automatic confirmation enabled. Until corrected, a
database confirmation timestamp alone does not demonstrate ownership of a work inbox.
The CEO must independently verify the intended staff identity, especially for accounts
created before this setting is corrected. See the technical handover's release gate.

1. The future Admin registers an ordinary account using their own work email and
   completes email verification. There is no public Admin signup or CEO-set password.
2. CEO opens **Staff → Add an Admin**, enters that exact verified email, then checks
   the returned identity carefully before confirming **Grant Admin access**.
3. If the person already has Requests, Orders, Payments, appointments or Concierge
   history as a client, use a separate verified work account. Their client history
   must remain accessible and is not deleted or repurposed.
4. The staff member signs in normally and is routed to operations. Admin has no
   access to Staff management or bank editing.
5. CEO can deactivate/reactivate Admin in Staff. Deactivation denies subsequent
   privileged requests, including those using an existing session. An operation
   already authorized and in progress may finish before deactivation commits.
6. **Access history** records new onboarding/status changes. Earlier SQL-provisioned
   memberships may have no older audit event. Attribution to former staff is retained.

CEO role changes are deliberately not offered in the browser. Trusted recovery
administration remains required, and the database protects the final active CEO.
Never edit Auth user metadata to assign staff authority.

## Admin daily workflow

- **Collections:** create a draft, enter accurate details, choose an active category,
  fabrics and colours, and add approved gallery images. Check cover/order and preview
  before publishing. Archive instead of deleting; stable Fit IDs preserve Saved Looks.
- **Requests:** start review. Request clarification with a useful client message if
  needed. The client resubmits a new revision. Approve the current revision, then
  create its production order. Repeated conversion cannot create another order.
- **Orders:** agree the price with the client and record the reason. Advance production
  stages only when the corresponding work has actually occurred. Completion adds the
  garment to the client's wardrobe; it does not invent a payment or complete a visit.
- **Payments:** issue an amount/purpose from the order. Pending requests reserve that
  amount. The client transfers externally and submits evidence. Independently check
  the bank records before verifying the amount actually received. A receipt or pending
  submission alone never counts as payment. Reject incorrect evidence with a clear
  reason. Do not request PINs, passwords, CVVs or OTPs.
- **Appointments:** a client's preferred slot is not confirmation. Confirm the actual
  Nigeria date, WAT time and duration. Review change requests; the old confirmed slot
  remains authoritative until a change is accepted. Internal notes remain staff-only.
- **Concierge:** read and reply in the existing thread. TCC read state is shared among
  staff; only displayed messages are acknowledged. Refresh/load further messages as
  needed. Formal request changes and payment evidence stay in their dedicated modules.
- **Clients:** search name, email or phone and filter operational activity. The dossier
  links into authoritative modules. Current measurements are reference-only; historical
  request/order snapshots do not change when the client updates their profile.

Do not delete customer/staff accounts with business history as a housekeeping task.
Use proper status controls and preserve requests, receipts, payments and attribution.

## Owner information and optional post-approval work

- Bank configuration and financial activity already exist; review them, do not call
  them missing or clear them.
- No usable official phone/WhatsApp number is present in the public implementation.
  Supply one if it should be published. Contact currently directs visitors to the form.
- The exact street address is not published. Confirm how visit locations should be
  communicated; the current copy asks clients to confirm before travelling.
- Existing public email, social handles and hours are present, but this repository is
  not evidence of ownership or approval. TCC should verify these existing values.
- Review the visibly marked draft privacy/terms pages and provide approved business,
  retention and policy wording. No legal approval is claimed.
- Approve or replace the reference photography and catalogue descriptions. Do not
  imply that all reference garments/images belong to TCC.
- A branded domain and additional genuine staff accounts are owner choices, not
  prerequisites for reviewing the working Vercel presentation site.

## Future possibilities — not implemented requirements

Transactional email/WhatsApp notifications, an online payment gateway, invoices,
delivery tracking, inventory and richer analytics would each need separate approval.
They are not a Phase 8 and are not part of this final-phase implementation.
