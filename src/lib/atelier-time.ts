/** All atelier calendar inputs and display use Nigerian time, never the browser zone. */
export const ATELIER_TIME_ZONE = "Africa/Lagos";

const calendar = new Intl.DateTimeFormat("en-CA", {
  timeZone: ATELIER_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit",
  hour: "2-digit", minute: "2-digit", hourCycle: "h23",
});

export function atelierCalendar(instant: Date | string = new Date()) {
  const date = typeof instant === "string" ? new Date(instant) : instant;
  if (!Number.isFinite(date.getTime())) throw new Error("Invalid appointment timestamp.");
  const parts = Object.fromEntries(calendar.formatToParts(date).map(part => [part.type, part.value]));
  return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}` };
}

export function isAtelierDate(value: string) {
  if (!/^20\d{2}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function isAtelierTime(value: string) {
  return /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value);
}

export function atelierSchedule(date: string, time: string, durationMinutes: number) {
  if (!isAtelierDate(date) || !isAtelierTime(time)) {
    throw new Error("Enter a valid appointment date and 24-hour time.");
  }
  if (!Number.isInteger(durationMinutes) || durationMinutes < 15 || durationMinutes > 240) {
    throw new Error("Appointment duration must be between 15 and 240 minutes.");
  }
  // Africa/Lagos observes UTC+01:00 throughout the supported 2000–2099 range.
  // Round-trip through the named zone to fail closed if zone rules ever differ.
  const start = new Date(`${date}T${time}:00+01:00`);
  const check = atelierCalendar(start);
  if (check.date !== date || check.time !== time) throw new Error("Invalid atelier local time.");
  return {
    startsAt: start.toISOString(),
    endsAt: new Date(start.getTime() + durationMinutes * 60_000).toISOString(),
  };
}

export function formatAtelierInstant(value: string | null | undefined) {
  if (!value) return "Not confirmed";
  const instant = new Date(value);
  if (!Number.isFinite(instant.getTime())) return "Schedule needs review";
  return new Intl.DateTimeFormat("en-NG", {
    timeZone: ATELIER_TIME_ZONE, day: "numeric", month: "short", year: "numeric",
    hour: "numeric", minute: "2-digit", hour12: true,
  }).format(instant) + " WAT";
}

export function atelierDayBounds(date: string) {
  if (!isAtelierDate(date)) throw new Error("Invalid atelier calendar date.");
  const start = atelierSchedule(date, "00:00", 60).startsAt;
  return { startsAt: start, endsAt: new Date(Date.parse(start) + 86_400_000).toISOString() };
}

export function schedulesOverlap(startA: string, endA: string, startB: string, endB: string) {
  const values = [startA, endA, startB, endB].map(Date.parse);
  if (!values.every(Number.isFinite) || values[0] >= values[1] || values[2] >= values[3]) {
    throw new Error("Invalid appointment interval.");
  }
  // Half-open intervals allow back-to-back appointments without a false conflict.
  return values[0] < values[3] && values[2] < values[1];
}
