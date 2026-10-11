/** Presentation only: never infer a confirmed booking from a client's preference. */
export function appointmentScheduleLabel(status: string, confirmed: boolean) {
  if (!confirmed) return "Preferred Date & Time";
  return ["cancelled", "completed"].includes(status) ? "Recorded Date & Time" : "Confirmed Date & Time";
}

export function appointmentChangeLabel(type: string) {
  return type === "reschedule" ? "Reschedule Request" : type === "cancellation" ? "Cancellation Request" : "Appointment Change Request";
}

export function appointmentChangeStatus(status: string) {
  return ({ pending_review: "Awaiting TCC review", approved: "Approved", declined: "Declined" } as Record<string, string>)[status] ?? "Status unavailable";
}

export function appointmentHistoryLabel(event: string, changeType?: unknown) {
  const labels: Record<string, string> = {
    appointment_requested: "Appointment requested",
    appointment_confirmed: "Date & time confirmed",
    appointment_rescheduled: "New date & time confirmed",
    appointment_cancelled: "Appointment cancelled",
    appointment_completed: "Appointment completed",
    appointment_change_requested: `${appointmentChangeLabel(String(changeType ?? ""))} submitted`,
    appointment_change_approved: `${appointmentChangeLabel(String(changeType ?? ""))} approved`,
    appointment_change_declined: `${appointmentChangeLabel(String(changeType ?? ""))} declined`,
  };
  return labels[event] ?? "Appointment updated";
}

export function formatAppointmentPreference(date: string | null | undefined, time: string | null | undefined) {
  const instant = /^\d{4}-\d{2}-\d{2}$/.test(date ?? "") ? new Date(`${date}T12:00:00+01:00`) : null;
  const day = instant && Number.isFinite(instant.getTime())
    ? new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "short", year: "numeric", timeZone: "Africa/Lagos" }).format(instant)
    : date || "Date not provided";
  return `${day} · ${time || "Time not provided"} (WAT)`;
}
