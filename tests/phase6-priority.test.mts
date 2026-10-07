import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error node directly strips the repository TypeScript source.
import { nextAtelierAppointment } from "../src/lib/atelier-priority.ts";

const appointment = (id: string, status: string, start?: string) => ({ id, status, scheduledStartAt: start,
  preferredDate: "2026-10-08", createdAt: "2026-10-06T10:00:00Z" });

test("dashboard prefers the next accepted appointment, including rescheduled, without mutating records", () => {
  const records = [appointment("later", "confirmed", "2026-10-10T10:00:00Z"), appointment("pending", "requested"),
    appointment("next", "rescheduled", "2026-10-09T10:00:00Z"), appointment("past", "completed", "2026-10-07T10:00:00Z")];
  const original = JSON.stringify(records);
  assert.equal(nextAtelierAppointment(records, Date.parse("2026-10-08T10:00:00Z"))?.id, "next");
  assert.equal(JSON.stringify(records), original);
});
test("dashboard omits expired accepted visits and terminal history, then falls back to requests", () => {
  const records = [appointment("expired", "confirmed", "2026-10-01T10:00:00Z"), appointment("cancelled", "cancelled"), appointment("request", "requested")];
  assert.equal(nextAtelierAppointment(records, Date.parse("2026-10-08T10:00:00Z"))?.id, "request");
  assert.equal(nextAtelierAppointment(records.slice(0, 2), Date.parse("2026-10-08T10:00:00Z")), undefined);
});
