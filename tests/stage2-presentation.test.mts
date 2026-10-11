import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { appointmentScheduleLabel, appointmentChangeLabel, appointmentChangeStatus, appointmentHistoryLabel, formatAppointmentPreference } from '../src/lib/atelier-presentation.ts';

const read = (path: string) => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('appointment labels never promote a preference or proposal to confirmed', () => {
  for (const status of ['requested', 'confirmed', 'completed', 'cancelled']) assert.equal(appointmentScheduleLabel(status, false), 'Preferred Date & Time');
  assert.equal(appointmentScheduleLabel('confirmed', true), 'Confirmed Date & Time');
  for (const status of ['completed', 'cancelled']) assert.equal(appointmentScheduleLabel(status, true), 'Recorded Date & Time');
  assert.equal(appointmentChangeLabel('reschedule'), 'Reschedule Request');
  assert.equal(appointmentChangeLabel('cancellation'), 'Cancellation Request');
  assert.equal(appointmentChangeStatus('pending_review'), 'Awaiting TCC review');
  assert.equal(appointmentChangeStatus('approved'), 'Approved');
  assert.equal(appointmentHistoryLabel('appointment_change_requested', 'reschedule'), 'Reschedule Request submitted');
  assert.equal(appointmentHistoryLabel('unknown_rpc_name'), 'Appointment updated');
});

test('free-text time preferences stay preferences and clearly identify Nigerian time', () => {
  assert.match(formatAppointmentPreference('2026-12-12', 'afternoon'), /12 Dec 2026 · afternoon \(WAT\)/);
  assert.match(formatAppointmentPreference(null, null), /Date not provided · Time not provided/);
});

test('transfer display is request-snapshot backed, not live singleton backed', () => {
  const detail = read('src/components/payments/PaymentDetail.tsx');
  assert.match(detail, /bank=\{request.bank_snapshot\} copy/);
  assert.doesNotMatch(detail, /workspace.bank|setBankAction/);
  assert.match(detail, /Do not transfer against this cancelled request/);
  assert.match(detail, /Do not repeat the transfer/);
  assert.match(detail, /This request is satisfied/);
  const card = read('src/components/payments/BankAccountCard.tsx');
  assert.match(card, /await navigator.clipboard.writeText\(bank.account_number\)/);
  assert.doesNotMatch(card, /Number\(bank.account_number\)|parseInt/);
});

test('CEO editing retains server authorization, validated writes and optimistic concurrency', () => {
  const actions = read('src/app/account/payments/actions.ts');
  assert.match(actions, /execute\(input, "ceo", "set_payment_bank_details"/);
  assert.match(actions, /p_expected_version: version\(r\)/);
  const form = read('src/components/payments/PaymentForms.tsx');
  assert.match(form, /ceo && editing/);
  assert.match(form, /onCancel=\{closeEditor\}/);
  assert.match(form, /if \(result.success\)[^\n]*onSuccess\?\.\(\)/);
});

test('Concierge keeps contiguous pages, shared read boundary and escaped stable sender bubbles', () => {
  const chat = read('src/components/atelier/ConciergeMessages.tsx');
  assert.match(chat, /message.message_seq !== after \+ index \+ 1/);
  assert.match(chat, /observedMessageSeq: lastSequence/);
  assert.match(chat, /while \(queued.current\)/);
  assert.match(chat, /message.sender_type === "concierge" \? "ml-auto/);
  assert.doesNotMatch(chat, /dangerouslySetInnerHTML|message.sender_name|message.display_label/);
  assert.ok(chat.indexOf('{children}') < chat.indexOf('Refresh messages'));
  assert.match(chat, /if \(followLatest.current\) showLatest\(\)/);
});

test('request appointment preferences no longer serialize the appointment object', () => {
  const page = read('src/app/admin/requests/[id]/page.tsx');
  assert.match(page, /RequestAppointmentSummary appointment=\{request.appointmentRequest\}/);
  assert.doesNotMatch(page, /appointment: request.appointmentRequest/);
  const summary = read('src/components/atelier/RequestAppointmentSummary.tsx');
  assert.doesNotMatch(summary, /JSON.stringify|actor_id|staffNote/);
  assert.match(summary, /not a confirmed booking/);
});

test('shared headers omit decorative labels but preserve conversation references and real headings', () => {
  const service = read('src/components/atelier/ServiceUI.tsx');
  assert.doesNotMatch(service, /eyebrow/);
  assert.match(service, /Reference: \{reference\}/);
  assert.match(service, /<h1/);
  for (const file of ['src/app/page.tsx', 'src/app/account/page.tsx', 'src/app/admin/page.tsx']) assert.match(read(file), /<h1/);
  assert.match(read('src/components/bespoke/steps/AppointmentStep.tsx'), /09 \/ Appointment/);
});
