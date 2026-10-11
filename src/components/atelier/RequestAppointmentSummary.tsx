import { appointmentPurposeLabel } from "@/lib/atelier-service";
import { formatAppointmentPreference } from "@/lib/atelier-presentation";
import { atelierPanel } from "./styles";

export function RequestAppointmentSummary({ appointment }: { appointment: Record<string, unknown> | null }) {
  if (!appointment || !appointment.type || appointment.type === "none") return null;
  const text = (key: string) => typeof appointment[key] === "string" ? appointment[key] as string : "";
  return <section className={atelierPanel}><h2 className="font-display text-xl">Appointment preference</h2>
    <dl className="mt-5 space-y-4">
      <div><dt className="text-xs text-stone-400">Purpose</dt><dd className="mt-1 text-sm">{appointmentPurposeLabel(text("type"))}</dd></div>
      <div><dt className="text-xs text-stone-400">Preferred Date &amp; Time</dt><dd className="mt-1 break-words text-sm">{formatAppointmentPreference(text("preferredDate"), text("preferredTime"))}</dd></div>
      {text("notes") && <div><dt className="text-xs text-stone-400">Client note</dt><dd className="mt-1 whitespace-pre-wrap break-words text-sm">{text("notes")}</dd></div>}
    </dl>
    <p className="mt-4 text-xs leading-5 text-stone-400">Requested with this bespoke request, not a confirmed booking. TCC confirms the visit in Appointments.</p>
  </section>;
}
