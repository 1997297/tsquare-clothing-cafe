import type { CustomerAppointment } from "@/types";

/** Choose the nearest accepted visit, then a pending request; never an old terminal visit. */
export function nextAtelierAppointment(appointments: CustomerAppointment[], now = Date.now()) {
  const accepted = appointments.filter(appointment => ["confirmed", "scheduled", "rescheduled"].includes(appointment.status)
    && appointment.scheduledStartAt && Date.parse(appointment.scheduledEndAt ?? appointment.scheduledStartAt) >= now)
    .sort((left, right) => Date.parse(left.scheduledStartAt!) - Date.parse(right.scheduledStartAt!));
  return accepted[0] ?? appointments.filter(appointment => appointment.status === "requested")
    .sort((left, right) => left.preferredDate.localeCompare(right.preferredDate) || left.createdAt.localeCompare(right.createdAt))[0];
}
