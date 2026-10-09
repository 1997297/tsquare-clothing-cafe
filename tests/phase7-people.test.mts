import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { peopleEmail, peoplePage, staffMutationInput } from '../src/lib/people.ts';
import { findOwnedRequest } from '../src/lib/atelier-workflow.ts';

const valid = { targetId: 'ba166ba5-558a-4c80-aeac-8baee3ce73c2', email: ' STAFF@example.invalid ', action: 'add_admin', expectedVersion: 0, operationKey: '2ab02f73-52b7-42fa-b587-68437c84c18e' };
test('public shell follows the rendered route tree, including root not-found', () => {
  const source = readFileSync(new URL('../src/components/layout/SiteLayout.tsx', import.meta.url), 'utf8');
  assert.match(source, /useSelectedLayoutSegments\(\)/);
  assert.doesNotMatch(source, /usePathname|window\.location/);
  for (const section of ['account', 'admin', 'auth', 'bespoke']) assert.ok(source.includes(`section === "${section}"`));
});
test('signup confirmation explicitly returns to the existing same-origin PKCE callback', () => {
  const source = readFileSync(new URL('../src/lib/auth-context.tsx', import.meta.url), 'utf8');
  assert.ok(source.includes('emailRedirectTo: `${window.location.origin}/auth/callback?next=/account`'));
  const callback = readFileSync(new URL('../src/app/auth/callback/route.ts', import.meta.url), 'utf8');
  assert.match(callback, /exchangeCodeForSession\(code\)/);
  assert.match(callback, /getSafeAuthRedirect\(requestUrl.searchParams.get\("next"\)\)/);
});
test('catalogue dialogs trap keyboard focus, restore the trigger and guard busy dismissal', () => {
  for (const path of ['src/components/admin/ConfirmDialog.tsx', 'src/app/admin/collections/CatalogueManager.tsx']) {
    const source = readFileSync(new URL('../' + path, import.meta.url), 'utf8');
    assert.match(source, /dialog.showModal\(\)/);
    assert.match(source, /previousFocus\?\.focus\(\)/);
    assert.match(source, /trapTabKey\(event.nativeEvent, dialogRef.current\)/);
    assert.match(source, /event.preventDefault\(\); if \(!(busy|pending)\)/);
  }
});
test('client request links resolve UUID and readable reference only within owned records', () => {
  const request = { requestId: 'TCC-REQ-TEST', databaseId: valid.targetId };
  assert.equal(findOwnedRequest([request], request.requestId), request);
  assert.equal(findOwnedRequest([request], request.databaseId), request);
  assert.equal(findOwnedRequest([request], 'another-client-record'), undefined);
  assert.equal(findOwnedRequest([], request.databaseId), undefined);
  assert.equal(findOwnedRequest([{ requestId: 'LOCAL-REFERENCE' }], 'LOCAL-REFERENCE')?.requestId, 'LOCAL-REFERENCE');
});
test('people pagination is bounded and literal email lookup is normalized', () => {
  assert.equal(peopleEmail(valid.email), 'staff@example.invalid');
  for (const value of [null, [], 'staff', 'staff@example.invalid\nBcc: someone']) assert.throws(() => peopleEmail(value));
  for (const value of [null, [], '-1', 'Infinity', '1e2', '999999']) assert.equal(peoplePage(value), 0);
  assert.equal(peoplePage('10001'), 10000);
  assert.equal(peoplePage('12'), 12);
});
test('client dossier queries the preserved Saved Look timestamp', () => {
  const source = readFileSync(new URL('../src/lib/server/people.ts', import.meta.url), 'utf8');
  assert.match(source, /from\('saved_styles'\)\.select\('id,style_id,saved_at'/);
  assert.match(source, /order\('saved_at', \{ ascending: false \}\)/);
  const page = readFileSync(new URL('../src/app/admin/clients/[clientId]/page.tsx', import.meta.url), 'utf8');
  assert.match(page, /Saved \{peopleDate\(row.saved_at\)\}/);
});
test('staff actions reject forged authority and unexpected fields', () => {
  assert.equal(staffMutationInput(valid).email, 'staff@example.invalid');
  for (const field of ['role', 'status', 'actorId', 'invitedBy', 'user_metadata', 'password', '__proto__']) {
    assert.throws(() => staffMutationInput(JSON.parse(JSON.stringify(valid).slice(0, -1) + `,"${field}":"ceo"}`)), field);
  }
  for (const action of ['ceo', 'promote_ceo', 'delete', 'inactive']) assert.throws(() => staffMutationInput({ ...valid, action }));
});
test('staff versions and IDs reject stale-shaped or malformed mutations', () => {
  for (const expectedVersion of [null, false, -1, '1e2', ' ', 1.5, Number.MAX_SAFE_INTEGER + 1, 1]) assert.throws(() => staffMutationInput({ ...valid, expectedVersion }));
  for (const key of ['targetId', 'operationKey']) assert.throws(() => staffMutationInput({ ...valid, [key]: 'invalid' }));
  assert.throws(() => staffMutationInput({ ...valid, action: 'deactivate_admin', expectedVersion: 0 }));
  assert.equal(staffMutationInput({ ...valid, action: 'deactivate_admin', expectedVersion: '2' }).expectedVersion, 2);
});
test('people actions keep session guards and never import service credentials', () => {
  const source = readFileSync(new URL('../src/app/admin/staff/actions.ts', import.meta.url), 'utf8');
  assert.equal((source.match(/await requireStaff\(\{ ceoOnly: true \}\)/g) ?? []).length, 2);
  assert.doesNotMatch(source, /supabase-admin|SUPABASE_SECRET|SERVICE_ROLE/);
  const onboarding = readFileSync(new URL('../src/components/admin/StaffOnboarding.tsx', import.meta.url), 'utf8');
  assert.match(onboarding, /method="post"/);
  assert.match(onboarding, /disabled=\{!ready \|\| busy\}/);
  assert.match(onboarding, /if \(!ready \|\| inFlight.current\) return/);
});

test('JS-only private forms use the hydration-safe POST boundary', () => {
  const source = readFileSync(new URL('../src/components/common/ClientForm.tsx', import.meta.url), 'utf8');
  assert.match(source, /method="post" inert=\{!ready\}/);
  assert.match(source, /useState\(false\)/);
  assert.match(source, /event.preventDefault\(\)/);
  assert.match(source, /if \(!ready \|\| submitting.current\) return/);
  assert.match(source, /finally \{ submitting.current = false; \}/);
  for (const path of ["src/app/auth/sign-in/page.tsx","src/app/auth/create-account/page.tsx","src/app/auth/forgot-password/page.tsx","src/app/auth/reset-password/page.tsx","src/app/account/profile/page.tsx","src/app/account/measurements/page.tsx","src/app/account/settings/page.tsx","src/app/admin/profile/StaffProfileForm.tsx","src/app/admin/collections/FitEditor.tsx","src/app/admin/collections/CatalogueManager.tsx","src/components/payments/PaymentForms.tsx","src/components/payments/EvidenceForm.tsx","src/app/contact/ContactClient.tsx","src/app/book-a-fitting/BookFittingClient.tsx"]) {
    const form = readFileSync(new URL('../' + path, import.meta.url), 'utf8');
    assert.match(form, /<ClientForm onSubmit=/, path);
    assert.doesNotMatch(form, /<form\b/, path);
  }
});

test('measurement selection and account controls remain truthful and labelled', () => {
  const source = readFileSync(new URL('../src/components/bespoke/steps/MeasurementsStep.tsx', import.meta.url), 'utf8');
  assert.match(source, /measurementMethod === "saved" && !!currentMeasurement/);
  assert.match(source, /disabled=\{!currentMeasurement\}/);
  const profile = readFileSync(new URL('../src/app/account/profile/page.tsx', import.meta.url), 'utf8');
  for (const field of ['first-name', 'last-name', 'email', 'phone']) {
    assert.ok(profile.includes(`htmlFor="profile-${field}"`));
    assert.ok(profile.includes(`id="profile-${field}"`));
  }
  const measurements = readFileSync(new URL('../src/app/account/measurements/page.tsx', import.meta.url), 'utf8');
  assert.ok(measurements.includes('htmlFor={`measurement-${field.key}`}'));
  assert.ok(measurements.includes('Math.max(0, ...measurementHistory.map(item => item.version)) + 1'));
});
