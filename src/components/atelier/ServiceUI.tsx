import Link from "next/link";
import type { ReactNode } from "react";
import { APPOINTMENT_STATUS_LABELS, appointmentPurposeLabel, type AtelierAppointment, type AtelierContextOptions, type AtelierHistory } from "@/lib/atelier-service";
import { formatAtelierInstant } from "@/lib/atelier-time";
import { isUuid } from "@/lib/validation";
import { AtelierField } from "./AtelierForm";
import { atelierInput, atelierPanel } from "./styles";

export function ServiceHeader({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children?: ReactNode }) {
  return <header className="flex flex-wrap items-end justify-between gap-5 border-b border-stone-800/70 pb-8">
    <div className="min-w-0"><p className="text-[10px] uppercase tracking-[0.24em] text-champagne">{eyebrow}</p>
      <h1 className="mt-3 break-words font-display text-3xl sm:text-4xl">{title}</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-400">{description}</p></div>{children}
  </header>;
}
export function ServiceEmpty({ children }: { children: ReactNode }) {
  return <p className={`${atelierPanel} text-sm leading-6 text-stone-400`}>{children}</p>;
}
export function AppointmentStatus({ status }: { status: string }) {
  return <span className="inline-flex rounded-full border border-champagne/25 bg-champagne/5 px-3 py-1 text-[10px] uppercase tracking-wider text-champagne">{APPOINTMENT_STATUS_LABELS[status] ?? status}</span>;
}
export function AppointmentCard({ appointment, staff = false, clientName }: { appointment: AtelierAppointment; staff?: boolean; clientName?: string }) {
  const base = staff ? "/admin" : "/account";
  const terminal = ["cancelled", "completed"].includes(appointment.status);
  return <article className={atelierPanel}>
    <div className="flex flex-wrap items-start justify-between gap-3"><div>
      <h2 className="font-display text-xl"><Link href={`${base}/appointments/${appointment.id}`} className="hover:text-champagne">{appointmentPurposeLabel(appointment.type)}</Link></h2>
      {clientName && <p className="mt-2 text-sm text-stone-400">{clientName}</p>}
    </div><AppointmentStatus status={appointment.status} /></div>
    <p className="mt-5 text-sm text-stone-300">{appointment.scheduled_start_at ? formatAtelierInstant(appointment.scheduled_start_at) : `Preferred: ${appointment.preferred_date} · ${appointment.preferred_time}`}</p>
    <p className="mt-2 text-xs text-stone-500">{appointment.scheduled_start_at ? (terminal ? "Recorded schedule · Nigeria" : "TCC-confirmed schedule · Nigeria") : (terminal ? "No confirmed schedule was recorded" : "Awaiting a confirmed time from TCC")}</p>
    <div className="mt-5 flex flex-wrap gap-4 text-xs text-champagne"><Link href={`${base}/appointments/${appointment.id}`}>Open appointment →</Link>
      {appointment.order_id && <Link href={`${base}/orders/${appointment.order_id}`}>Related order</Link>}
      {appointment.bespoke_request_id && <Link href={`${base}/requests/${appointment.bespoke_request_id}`}>Related request</Link>}
    </div>
  </article>;
}
export function ContextFields({ options, includeAppointment = false }: { options: AtelierContextOptions; includeAppointment?: boolean }) {
  const groups = [ { name: "orderId", label: "Related order (optional)", values: options.orders },
    { name: "requestId", label: "Related bespoke request (optional)", values: options.requests },
    ...(includeAppointment ? [{ name: "appointmentId", label: "Related appointment (optional)", values: options.appointments }] : []), ];
  return <details className="rounded-xl border border-stone-800 p-4"><summary className="cursor-pointer text-xs text-champagne">Add order or request context (optional)</summary>
    <p className="mt-3 text-xs leading-5 text-stone-500">Your latest 100 records are available. Choose matching records, or leave these blank for a general enquiry.</p>
    <div className="mt-4 grid gap-4 sm:grid-cols-2">{groups.map(group => <AtelierField key={group.name} label={group.label}>
      <select name={group.name} className={atelierInput} defaultValue=""><option value="">None</option>{group.values.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}</select>
    </AtelierField>)}</div>
  </details>;
}
export function ContextLinks({ staff, order, request, appointment }: { staff: boolean; order?: string | null; request?: string | null; appointment?: string | null }) {
  const base = staff ? "/admin" : "/account";
  const links = [["orders", order, "Related order"], ["requests", request, "Related bespoke request"], ["appointments", appointment, "Related appointment"]];
  return <div className="flex flex-wrap gap-4 text-xs text-champagne">{links.map(([path, id, label]) => id && isUuid(id) ? <Link key={path} href={`${base}/${path}/${id}`}>{label} →</Link> : null)}</div>;
}
export function AtelierTimeline({ events }: { events: AtelierHistory[] }) {
  return <section className={atelierPanel}><h2 className="font-display text-xl">Appointment history</h2>
    {events.length === 0 ? <p className="mt-4 text-sm text-stone-500">No detailed events were recorded for this earlier appointment.</p> :
      <ol className="mt-5 space-y-5">{events.map(event => <li key={event.id} className="border-l border-champagne/30 pl-4">
        <p className="text-sm capitalize">{event.event_type.replace(/[_:]/g, " ")}</p>
        <p className="mt-1 text-xs text-stone-500">{event.actor_type === "staff" ? "TCC" : "Client"} · {formatAtelierInstant(event.created_at)}</p>
        {typeof event.metadata?.reason === "string" && <p className="mt-2 whitespace-pre-wrap break-words text-sm text-stone-400">{event.metadata.reason}</p>}
        {typeof event.metadata?.previous_start_at === "string" && <p className="mt-2 text-xs text-stone-500">Previous: {formatAtelierInstant(event.metadata.previous_start_at)}</p>}
        {typeof event.metadata?.start_at === "string" && <p className="mt-2 text-sm text-stone-300">Recorded schedule: {formatAtelierInstant(event.metadata.start_at)}</p>}
      </li>)}</ol>}
  </section>;
}
