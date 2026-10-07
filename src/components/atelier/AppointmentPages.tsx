import Link from "next/link";
import { APPOINTMENT_STATUS_LABELS, appointmentPurposeLabel } from "@/lib/atelier-service";
import { formatAtelierInstant } from "@/lib/atelier-time";
import { getAtelierAppointment, getAtelierContact, listAtelierAppointments } from "@/lib/server/atelier-service";
import { AppointmentCard, AppointmentStatus, AtelierTimeline, ContextLinks, ServiceEmpty, ServiceHeader } from "./ServiceUI";
import { ClientAppointmentControls, StaffAppointmentControls } from "./AppointmentForms";
import { atelierButton, atelierInput, atelierPanel } from "./styles";

const filters = { upcoming: "Upcoming confirmed", today: "Today in Nigeria", changes: "Changes awaiting review", ...APPOINTMENT_STATUS_LABELS };

export async function AppointmentListPage({ staff, searchParams }: { staff: boolean; searchParams: Promise<{ status?: string; page?: string; q?: string }> }) {
  const params = await searchParams;
  const status = Object.hasOwn(filters, params.status ?? "") ? params.status! : "all";
  const page = /^\d+$/.test(params.page ?? "") ? Number(params.page) : 0;
  const { rows, customers, hasMore } = await listAtelierAppointments(staff, { status, page });
  const base = staff ? "/admin/appointments" : "/account/appointments";
  const query = (params.q ?? "").trim().toLowerCase().slice(0, 100);
  const filtered = rows.filter(row => !query || `${appointmentPurposeLabel(row.type)} ${customers.get(row.customer_id)?.name ?? ""} ${row.preferred_date} ${row.id}`.toLowerCase().includes(query));
  const pageHref = (next: number) => `${base}?${new URLSearchParams({ status, page: String(next), q: query })}`;
  return <div className="space-y-7"><ServiceHeader eyebrow="Salon diary" title={staff ? "Appointments" : "Private atelier appointments"} description="Requested visits and TCC-confirmed schedules are kept distinct. All appointment times are shown in Nigeria time (WAT).">
    {!staff && <Link href={`${base}/new`} className={atelierButton}>Request a visit</Link>}
  </ServiceHeader>
    <form className="flex flex-wrap items-end gap-3" method="get"><label className="min-w-0 text-xs text-stone-400">Status<select className={atelierInput} name="status" defaultValue={status}><option value="all">All appointments</option>{Object.entries(filters).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label className="min-w-0 grow text-xs text-stone-400">Search this page<input name="q" defaultValue={query} maxLength={100} className={atelierInput} placeholder={staff ? "Client, purpose, requested date" : "Purpose or requested date"} /></label><button className={atelierButton}>Filter</button></form>
    {filtered.length ? <div className="grid gap-5 lg:grid-cols-2">{filtered.map(appointment => <AppointmentCard key={appointment.id} appointment={appointment} staff={staff} clientName={customers.get(appointment.customer_id)?.name} />)}</div> : <ServiceEmpty>{query ? "No matches on this page. Try another term or page." : "There are no appointments in this view."}</ServiceEmpty>}
    <nav aria-label="Appointment pages" className="flex flex-wrap justify-between gap-4 text-sm text-champagne">{page > 0 && <Link href={pageHref(page - 1)}>← Previous page</Link>}{hasMore && <Link href={pageHref(page + 1)}>Next page →</Link>}</nav>
  </div>;
}

export async function AppointmentDetailPage({ id, staff }: { id: string; staff: boolean }) {
  const detail = await getAtelierAppointment(id, staff);
  const appointment = detail.appointment;
  const contact = staff ? await getAtelierContact(appointment.customer_id) : null;
  const base = staff ? "/admin" : "/account";
  return <div className="space-y-7"><Link href={`${base}/appointments`} className="text-xs text-champagne">← Appointments</Link>
    <ServiceHeader eyebrow="Private atelier visit" title={appointmentPurposeLabel(appointment.type)} description="The confirmed schedule is authoritative. Client preferences and change requests do not reserve a new slot."><AppointmentStatus status={appointment.status} /></ServiceHeader>
    <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(300px,0.8fr)]"><div className="min-w-0 space-y-6">
      <section className={`${atelierPanel} space-y-5`}>
        {contact && <div><h2 className="font-display text-xl">{contact.first_name} {contact.last_name}</h2><p className="mt-2 break-words text-sm text-stone-400">{contact.email} · {contact.phone || "Phone not recorded"}</p></div>}
        <div><h2 className="text-xs uppercase tracking-wider text-champagne">{["completed", "cancelled"].includes(appointment.status) ? "Recorded schedule" : "Confirmed schedule"}</h2><p className="mt-2 text-lg">{formatAtelierInstant(appointment.scheduled_start_at)}</p>
          {appointment.scheduled_end_at && <p className="mt-1 text-xs text-stone-500">Until {formatAtelierInstant(appointment.scheduled_end_at)}</p>}
          {!appointment.scheduled_start_at && appointment.confirmed_date && <p className="mt-2 text-sm text-amber-400">Earlier schedule: {appointment.confirmed_date} {appointment.confirmed_time}. TCC must review this legacy schedule.</p>}
        </div>
        <div><p className="text-xs uppercase text-stone-500">Original preference</p><p className="mt-2 text-sm text-stone-300">{appointment.preferred_date} · {appointment.preferred_time}</p></div>
        <p className="text-sm text-stone-400">{appointment.location}</p>
        {appointment.notes && <div><p className="text-xs uppercase text-stone-500">Client note</p><p className="mt-2 whitespace-pre-wrap break-words text-sm text-stone-300">{appointment.notes}</p></div>}
        {appointment.cancelled_at && <p className="whitespace-pre-wrap break-words text-sm text-stone-400">Cancelled by {appointment.cancelled_actor_type === "staff" ? "TCC" : appointment.cancelled_actor_type} · {formatAtelierInstant(appointment.cancelled_at)}{appointment.cancellation_reason ? ` · ${appointment.cancellation_reason}` : ""}</p>}
        {appointment.completed_at && <p className="text-sm text-stone-400">Completed {formatAtelierInstant(appointment.completed_at)}</p>}
        <ContextLinks staff={staff} order={appointment.order_id} request={appointment.bespoke_request_id} />
      </section>
      {detail.changes.length > 0 && <section className={atelierPanel}><h2 className="font-display text-xl">Change requests</h2><ol className="mt-5 space-y-5">{detail.changes.map(change => <li key={change.id} className="border-l border-stone-700 pl-4">
        <p className="text-sm capitalize">{change.change_type} · {change.status.replace(/_/g, " ")}</p><p className="mt-2 text-xs text-stone-500">{formatAtelierInstant(change.created_at)}</p>
        {change.proposed_date && <p className="mt-2 text-sm text-stone-300">Preferred: {change.proposed_date} · {change.proposed_time}</p>}
        {change.reason && <p className="mt-2 whitespace-pre-wrap break-words text-sm text-stone-400">{change.reason}</p>}
        {change.review_reason && <p className="mt-2 whitespace-pre-wrap break-words text-sm text-stone-300">TCC: {change.review_reason}</p>}
        {change.reviewed_at && <p className="mt-2 text-xs text-stone-500">Reviewed {formatAtelierInstant(change.reviewed_at)}</p>}
      </li>)}</ol></section>}
      <AtelierTimeline events={detail.history} />
      {staff && <section className={atelierPanel}><h2 className="font-display text-xl">Internal staff notes</h2><p className="mt-2 text-xs text-stone-500">Staff only. Never included in client messages or notifications.</p>
        {detail.staff_notes?.length ? <ol className="mt-5 space-y-4">{detail.staff_notes.map(note => <li key={note.id}><p className="whitespace-pre-wrap break-words text-sm text-stone-300">{note.note}</p><p className="mt-1 break-all text-xs text-stone-500">{formatAtelierInstant(note.created_at)} · Staff {note.actor_id}</p></li>)}</ol> : <p className="mt-5 text-sm text-stone-500">No staff notes yet.</p>}
      </section>}
    </div><aside className="min-w-0">{staff ? <StaffAppointmentControls appointment={appointment} changes={detail.changes} /> : <ClientAppointmentControls appointment={appointment} pending={detail.changes.some(change => change.status === "pending_review")} />}</aside></div>
  </div>;
}
