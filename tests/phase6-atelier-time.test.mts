import test from "node:test";
import assert from "node:assert/strict";
import { atelierCalendar, atelierDayBounds, atelierSchedule, formatAtelierInstant, isAtelierDate, isAtelierTime, schedulesOverlap } from "../src/lib/atelier-time.ts";

test("atelier calendar uses Lagos across UTC midnight and year boundaries", () => {
  assert.deepEqual(atelierCalendar("2026-10-05T23:30:00Z"), { date: "2026-10-06", time: "00:30" });
  assert.deepEqual(atelierCalendar("2026-12-31T23:00:00Z"), { date: "2027-01-01", time: "00:00" });
  assert.deepEqual(atelierCalendar("2026-10-06T09:30:00Z"), { date: "2026-10-06", time: "10:30" });
});

test("atelier input becomes exact timezone-aware timestamps, independent of host zone", () => {
  assert.deepEqual(atelierSchedule("2026-10-06", "00:30", 60), {
    startsAt: "2026-10-05T23:30:00.000Z", endsAt: "2026-10-06T00:30:00.000Z",
  });
  assert.deepEqual(atelierDayBounds("2027-01-01"), {
    startsAt: "2026-12-31T23:00:00.000Z", endsAt: "2027-01-01T23:00:00.000Z",
  });
  assert.match(formatAtelierInstant("2026-12-31T23:30:00Z"), /1 Jan 2027.*12:30.*WAT/);
  assert.equal(formatAtelierInstant(null), "Not confirmed");
});

test("atelier dates, clock times and durations reject normalization or ambiguity", () => {
  assert.equal(isAtelierDate("2028-02-29"), true);
  for (const date of ["2026-02-29", "2026-04-31", "2026-13-01", "06/10/2026", "1999-12-31", "2100-01-01"]) {
    assert.equal(isAtelierDate(date), false, date);
    assert.throws(() => atelierSchedule(date, "10:00", 60));
  }
  for (const time of ["24:00", "09:60", "9:00", "10:00 AM", "10:00:30", ""]) assert.equal(isAtelierTime(time), false);
  for (const duration of [0, 14, 241, 30.5, NaN, Infinity]) assert.throws(() => atelierSchedule("2026-10-06", "10:00", duration));
});

test("overlap detection permits adjacent bookings but rejects intersecting intervals", () => {
  assert.equal(schedulesOverlap("2026-10-06T09:00:00Z", "2026-10-06T10:00:00Z", "2026-10-06T10:00:00Z", "2026-10-06T11:00:00Z"), false);
  assert.equal(schedulesOverlap("2026-10-06T09:00:00Z", "2026-10-06T10:00:00Z", "2026-10-06T10:30:00+01:00", "2026-10-06T11:30:00+01:00"), true);
  assert.throws(() => schedulesOverlap("invalid", "invalid", "invalid", "invalid"));
});
