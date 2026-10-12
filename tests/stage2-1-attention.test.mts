import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { pendingPaymentSubmissions, paymentAttentionByRequest, prioritizePaymentRequests } from '../src/lib/payments/attention.ts';
import { attentionBadge, attentionLabel, REQUEST_ATTENTION_STATUSES, ORDER_ATTENTION_STATUSES } from '../src/lib/staff-attention.ts';
import type { PaymentRequest, PaymentSubmission } from '../src/lib/payments/manual.ts';

const request = (id: string, status = 'active', created_at = '2026-10-01') => ({ id, status, created_at, order_id: 'order', customer_id: 'client', requested_amount_minor: 10000 }) as PaymentRequest;
const submission = (id: string, request_id = 'r1', status = 'awaiting_verification') => ({ id, request_id, status, order_id: 'order', customer_id: 'client' }) as PaymentSubmission;
const read = (path: string) => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('only actual pending evidence on the matching active request needs verification', () => {
  const requests = [request('r1'), request('cancelled', 'cancelled')];
  assert.deepEqual(pendingPaymentSubmissions(requests, []), []); // unpaid, no evidence
  const pending = submission('pending');
  assert.deepEqual(pendingPaymentSubmissions(requests, [pending, submission('verified', 'r1', 'verified'), submission('rejected', 'r1', 'rejected'), submission('cancelled', 'cancelled'), submission('superseded', 'r1', 'superseded'), submission('absent', 'absent'), { ...pending, id: 'wrong-owner', customer_id: 'other' }, { ...pending, id: 'wrong-order', order_id: 'other' }]), [pending]);
});

test('deduplicate real submission IDs and group counts per request, not per order balance', () => {
  const one = submission('one'), two = submission('two'), three = submission('three', 'r2');
  const grouped = paymentAttentionByRequest([request('r1'), request('r2')], [one, one, two, three]);
  assert.equal(grouped.get('r1')?.length, 2);
  assert.equal(grouped.get('r2')?.length, 1);
  assert.equal(pendingPaymentSubmissions([request('r1'), request('r2')], [one, one, two, three]).length, 3);
});

test('verification and rejection remove attention on a refreshed snapshot', () => {
  for (const status of ['verified', 'rejected']) {
    assert.equal(paymentAttentionByRequest([request('r1')], [submission('s')]).size, 1);
    assert.equal(paymentAttentionByRequest([request('r1')], [submission('s', 'r1', status)]).size, 0);
  }
});

test('staff priority is pending first then newest; client ordering and source arrays are unchanged', () => {
  const requests = [request('r1'), request('r2', 'active', '2026-10-02'), request('r3', 'active', '2026-10-03')];
  const pending = paymentAttentionByRequest(requests, [submission('s')]);
  assert.deepEqual(prioritizePaymentRequests(requests, pending, true).map(r => r.id), ['r1', 'r3', 'r2']);
  assert.deepEqual(prioritizePaymentRequests(requests, pending, false).map(r => r.id), ['r3', 'r2', 'r1']);
  assert.deepEqual(requests.map(r => r.id), ['r1', 'r2', 'r3']);
});

test('badge zero, failure, single, multiple and capped counts stay distinct and accessible', () => {
  for (const count of [0, null]) assert.equal(attentionBadge(count), null);
  assert.equal(attentionBadge(1), '1'); assert.equal(attentionBadge(99), '99'); assert.equal(attentionBadge(100), '99+');
  assert.match(attentionLabel('Payments', null), /unavailable/);
  assert.match(attentionLabel('Payments', 0), /0 items need attention/);
  assert.match(attentionLabel('Payments', 1), /1 item needs attention/);
  assert.match(attentionLabel('Payments', 102), /102 items need attention/);
});

test('decision states exclude customer replies and in-progress or finished production', () => {
  assert.deepEqual(REQUEST_ATTENTION_STATUSES, ['submitted', 'under_review', 'confirmed']);
  assert.deepEqual(ORDER_ATTENTION_STATUSES, ['order_confirmed', 'ready']);
  for (const state of ['needs_clarification', 'declined', 'converted_to_order']) assert.equal(REQUEST_ATTENTION_STATUSES.includes(state), false);
  for (const state of ['measurements_confirmed', 'in_production', 'finishing', 'completed']) assert.equal(ORDER_ATTENTION_STATUSES.includes(state), false);
});

test('counts use explicit staff authorization, RLS clients, exact counts, existing atelier aggregation and no public endpoint', () => {
  const source = read('src/lib/server/admin-overview.ts');
  assert.ok(source.indexOf('await requireStaff()') < source.indexOf('await createServerSupabaseClient()'));
  assert.match(source, /count: "exact", head: true/);
  assert.match(source, /payment_requests!inner\(status\)/);
  assert.match(source, /\.eq\("payment_requests.status", "active"\)/);
  assert.match(source, /unread_concierge_conversations/);
  assert.doesNotMatch(source, /getSupabaseAdminClient|SERVICE_ROLE|\.update\(|\.insert\(/);
  const migration = read('supabase/migrations/20261006063802_phase6_atelier_expansion.sql');
  assert.match(migration, /a.status='requested' or\s+exists\(select 1 from public.appointment_change_requests c where c.appointment_id=a.id and c.status='pending_review'\)/);
});

test('filters, review anchors and normal action revalidation match the indicators without polling', () => {
  for (const name of ['requests', 'orders']) {
    assert.match(read(`src/app/admin/${name}/page.tsx`), /status === "attention"/);
    assert.match(read(`src/app/admin/${name}/${name === 'orders' ? 'Order' : 'Request'}Manager.tsx`), /ATTENTION_STATUSES.includes/);
    assert.match(read(`src/app/admin/${name}/actions.ts`), /revalidatePath\("\/admin"\)/);
  }
  assert.match(read('src/app/admin/payments/page.tsx'), /status === "pending"/);
  assert.match(read('src/components/payments/PaymentUI.tsx'), /#review-\$\{pending\[0\].id\}/);
  assert.match(read('src/components/payments/PaymentDetail.tsx'), /id=\{`review-\$\{s.id\}`\}/);
  assert.match(read('src/app/account/payments/actions.ts'), /revalidatePath\("\/admin", "layout"\)/);
  const component = read('src/components/admin/OverviewActions.tsx');
  assert.match(component, /visibilitychange/); assert.match(component, /router.refresh/);
  assert.match(component, /Count unavailable/); assert.doesNotMatch(component, /setInterval|setTimeout|fetch\(/);
});
