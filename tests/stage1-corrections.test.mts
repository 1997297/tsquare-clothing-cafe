import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { sessionCookieOptions, isProjectAuthCookie } from '../src/lib/auth/session-cookies.ts';
import { validateCatalogueImage, validateCatalogueImageBytes, CATALOGUE_IMAGE_MAX_BYTES } from '../src/lib/catalogue-images.ts';
import { requestPosition, requestOrderSummary, type PaymentRequest, type FinancialSummary, type VerifiedPayment, type PaymentSubmission } from '../src/lib/payments/manual.ts';

test('session cookies strip SDK persistence but preserve cross-tab cookie scope and callback SameSite', () => {
  const original = { maxAge: 34560000, expires: new Date('2030-01-01'), path: '/', sameSite: 'lax' as const, httpOnly: false };
  const options = sessionCookieOptions(original, true, 'not-a-real-token');
  assert.equal(options.maxAge, undefined); assert.equal(options.expires, undefined);
  assert.equal(options.secure, true); assert.equal(options.sameSite, 'lax'); assert.equal(options.path, '/');
  assert.equal(options.httpOnly, false); assert.equal(original.maxAge, 34560000);
  assert.equal(sessionCookieOptions(original, false, 'localhost-session').secure, false);
});
test('sign-out and chunk cleanup remain real deletions, not empty session cookies', () => {
  for (const options of [{ maxAge: 0 }, { maxAge: -1 }, {}]) {
    const deletion = sessionCookieOptions(options, true, '');
    assert.equal(deletion.maxAge, 0); assert.equal(deletion.expires?.getTime(), 0);
  }
});
test('cookie migration only touches this project including PKCE and chunked tokens', () => {
  const url = 'https://project-ref.supabase.co';
  for (const suffix of ['', '.0', '.12', '-code-verifier', '-code-verifier.0', '-user', '-flows-code-verifier', '-flows-code-verifier.0', '-flow-Abc_1234-code-verifier', '-flow-Abc_1234-code-verifier.1']) assert.ok(isProjectAuthCookie(`sb-project-ref-auth-token${suffix}`, url));
  for (const name of ['theme', 'sb-other-auth-token', 'sb-project-ref-auth-token-other', 'sb-project-ref-auth-token.invalid', 'sb-project-ref-auth-token.01', 'sb-project-ref-auth-token-flow-short-code-verifier', 'sb-other-auth-token-flow-Abc_1234-code-verifier', `sb-project-ref-auth-token-flow-${'x'.repeat(65)}-code-verifier`]) assert.equal(isProjectAuthCookie(name, url), false);
});
test('callback selects the supplied PKCE flow without exposing callback secrets in diagnostics', () => {
  const source = readFileSync(new URL('../src/app/auth/callback/route.ts', import.meta.url), 'utf8');
  assert.match(source, /searchParams\.get\("sb_flow_id"\)/);
  assert.match(source, /exchangeCodeForSession\(code, flowId !== null \? \{ flowId \} : undefined\)/);
  assert.match(source, /reason: "exchange_failed"/);
  assert.doesNotMatch(source, /console\.(warn|error)\([^;]*(requestUrl|request\.url|error\.message|error\.stack)/s);
});

const request = { id: 'request-deposit', order_id: 'order-1', requested_amount_minor: 26000000, status: 'active' } as PaymentRequest;
const payment = { id: 'payment-1', payment_request_id: request.id, order_id: request.order_id, amount_minor: 26000000, status: 'successful' } as VerifiedPayment;
const summary = { order_id: request.order_id, total_minor: 36000000, verified_minor: 26000000, balance_minor: 10000000, pending_minor: 0, reserved_minor: 0, requestable_minor: 10000000, fully_paid: false } satisfies FinancialSummary;
test('reported 360000 / 260000 case keeps 100000 order balance separate from a satisfied request', () => {
  assert.equal(requestPosition(request, [payment], []).remaining, 0);
  assert.equal(requestOrderSummary(request, { [summary.order_id]: summary })?.balance_minor, 10000000);
});
test('multiple requests use one order ledger summary; pending/rejected funds do not pay requests', () => {
  const balanceRequest = { ...request, id: 'request-balance', requested_amount_minor: 10000000 };
  const pending = { request_id: balanceRequest.id, reported_amount_minor: 10000000, status: 'awaiting_verification' } as PaymentSubmission;
  const rejected = { ...pending, status: 'rejected' } as PaymentSubmission;
  for (const evidence of [pending, rejected]) {
    assert.equal(requestPosition(balanceRequest, [payment], [evidence]).remaining, 10000000);
    assert.equal(requestOrderSummary(balanceRequest, { [summary.order_id]: summary })?.balance_minor, 10000000);
  }
  assert.equal(requestPosition(balanceRequest, [payment, { ...payment, payment_request_id: balanceRequest.id, amount_minor: 4000000 }], []).remaining, 6000000);
  const fullyPaid = { ...summary, verified_minor: 36000000, balance_minor: 0, fully_paid: true };
  assert.equal(requestOrderSummary(balanceRequest, { [summary.order_id]: fullyPaid })?.balance_minor, 0);
  assert.equal(requestPosition(balanceRequest, [payment, { ...payment, payment_request_id: balanceRequest.id, amount_minor: 10000000 }], []).remaining, 0);
});
test('missing/wrong-order summaries never fabricate a zero order balance', () => {
  assert.equal(requestOrderSummary(request, {}), null);
  assert.equal(requestOrderSummary(request, { [request.order_id]: { ...summary, order_id: 'different' } }), null);
});
test('payment cards load the authorized RPC inside the stable snapshot, not a second client calculation', () => {
  const read = (path: string) => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
  const source = read('src/lib/server/manual-payments.ts');
  assert.match(source, /readStablePaymentSnapshot/); assert.match(source, /map\(getOrderFinancials\)/);
  assert.match(source, /rpc\("get_order_financials"/);
  const cards = read('src/components/payments/PaymentUI.tsx');
  assert.match(cards, /Order outstanding balance/); assert.match(cards, /Request outstanding amount/);
});
test('catalogue image policy rejects empty, oversized, PDF and mismatched image bytes', () => {
  assert.doesNotThrow(() => validateCatalogueImage({ type: 'image/jpeg', size: CATALOGUE_IMAGE_MAX_BYTES }));
  for (const file of [{ type: 'image/jpeg', size: 0 }, { type: 'image/png', size: CATALOGUE_IMAGE_MAX_BYTES + 1 }, { type: 'application/pdf', size: 100 }]) assert.throws(() => validateCatalogueImage(file));
  const png = new Uint8Array([137,80,78,71,13,10,26,10,0,0,0,0]);
  assert.doesNotThrow(() => validateCatalogueImageBytes('image/png', png));
  assert.throws(() => validateCatalogueImageBytes('image/jpeg', png));
});
test('creation stages photos before validated publication and retains a draft recovery path', () => {
  const source = readFileSync(new URL('../src/app/admin/collections/FitEditor.tsx', import.meta.url), 'utf8');
  assert.match(source, /FitImagePicker/); assert.doesNotMatch(source, /disabled=\{!fit\}/);
  assert.ok(source.indexOf('uploadCatalogueImage(targetId') < source.indexOf('setFitStatusAction(targetId'));
  assert.match(source, /creationKey\.current \?\?= crypto\.randomUUID/);
  assert.match(source, /Open its gallery editor/);
});
test('both roles use bounded scrollable navigation and native modal mobile focus boundary', () => {
  for (const path of ['src/components/admin/AdminShell.tsx','src/app/account/layout.tsx']) {
    const source = readFileSync(new URL('../' + path, import.meta.url), 'utf8');
    assert.match(source, /100dvh-5rem/); assert.match(source, /overflow-y-auto/);
    assert.match(source, /NavigationDrawer/); assert.match(source, /aria-current/);
    assert.doesNotMatch(source, /overflow-x-auto/);
  }
  const drawer = readFileSync(new URL('../src/components/common/NavigationDrawer.tsx', import.meta.url), 'utf8');
  assert.match(drawer, /showModal\(\)/); assert.match(drawer, /previous\?\.focus/);
  assert.match(drawer, /onCancel/); assert.match(drawer, /safe-area-inset-bottom/);
});
