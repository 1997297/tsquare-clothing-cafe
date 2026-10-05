import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const baseline = readFileSync(new URL('../supabase/migrations/20261002074022_phase5_payments.sql', import.meta.url), 'utf8');
const migration = readFileSync(new URL('../supabase/migrations/20261005075136_phase5_transfer_date_lagos.sql', import.meta.url), 'utf8');
const rpc = /create(?: or replace)? function public\.submit_payment_evidence\([\s\S]*?end; \$\$;/;
// Normalize Windows checkout line endings only; preserve all SQL text otherwise.
const oldFunction = baseline.match(rpc)?.[0].replace(/\r\n/g, '\n');
const newFunction = migration.match(rpc)?.[0].replace(/\r\n/g, '\n');

test('replacement preserves the exact RPC except CREATE OR REPLACE and the Lagos upper date bound', () => {
  assert.ok(oldFunction);
  assert.ok(newFunction);
  assert.equal(newFunction, oldFunction
    .replace('create function', 'create or replace function')
    .replace('p_transfer_date>current_date', "p_transfer_date>(now() at time zone 'Africa/Lagos')::date"));
  // Exact equality above includes signature, definer/search_path, actor/replay,
  // lower bound, order/request/receipt locks, accounting and event behavior.
  const remaining = migration.replace(rpc, '').replace(/--[^\n]*/g, '').trim();
  assert.equal(remaining.replace(/\s+/g, ' '), 'begin; commit;');
  // No DROP or GRANT/REVOKE: replacement retains the existing function ACL.
  assert.match(newFunction, /p_transfer_date<date '2000-01-01'/);
});

const lagosDate = instant => new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Africa/Lagos', year: 'numeric', month: '2-digit', day: '2-digit',
}).format(new Date(instant));
const valid = (transfer, today) => transfer !== null && transfer >= '2000-01-01' && transfer <= today;

test('calendar boundary model covers the UTC/Lagos midnight gap and explicit lower bound', () => {
  for (const [instant, today] of [
    ['2026-10-04T22:59:59Z', '2026-10-04'],
    ['2026-10-04T23:00:00Z', '2026-10-05'],
    ['2026-10-04T23:59:59Z', '2026-10-05'],
    ['2026-10-05T00:00:00Z', '2026-10-05'],
    ['2026-12-31T23:00:00Z', '2027-01-01'],
  ]) {
    assert.equal(lagosDate(instant), today);
    assert.equal(valid(today, lagosDate(instant)), true);
    assert.equal(valid('2027-01-02', lagosDate(instant)), false);
    assert.equal(valid('2000-01-01', lagosDate(instant)), true);
    assert.equal(valid('1999-12-31', lagosDate(instant)), false);
    assert.equal(valid(null, lagosDate(instant)), false);
  }
  assert.equal(valid('2026-10-05', '2026-10-04'), false); // Old UTC bound.
  assert.equal(valid('2026-10-05', lagosDate('2026-10-04T23:30:00Z')), true);
});
