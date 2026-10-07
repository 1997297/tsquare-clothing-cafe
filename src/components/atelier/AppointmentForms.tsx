import { APPOINTMENT_PURPOSES, type AtelierAppointment, type AtelierChange, type AtelierContextOptions } from "@/lib/atelier-service";
import { atelierCalendar, isAtelierTime } from "@/lib/atelier-time";
import { createAtelierAppointmentAction, requestAtelierChangeAction, manageAtelierAppointmentAction, reviewAtelierChangeAction, addAtelierNoteAction } from "@/app/atelier-actions";
import { AtelierField, AtelierForm } from "./AtelierForm";
import { ContextFields } from "./ServiceUI";
import { atelierInput, atelierPanel } from "./styles";

function TextArea({ name, label, maximum, required = false }: { name: string; label: string; maximum: number; required?: boolean }) {
  return <AtelierField label={label}><textarea name={name} rows={3} maxLength={maximum} required={required} className={atelierInput} /></AtelierField>;
}
function ScheduleFields({ appointment, change }: { appointment: AtelierAppointment; change?: AtelierChange }) {
  const current = appointment.scheduled_start_at ? atelierCalendar(appointment.scheduled_start_at) : null;
  const minutes = appointment.scheduled_start_at && appointment.scheduled_end_at
    ? (Date.parse(appointment.scheduled_end_at) - Date.parse(appointment.scheduled_start_at)) / 60_000 : 60;
  const duration = Number.isInteger(minutes) && minutes >= 15 && minutes <= 240 ? minutes : 60;
  const time = change ? (change.proposed_time && isAtelierTime(change.proposed_time) ? change.proposed_time : "") : current?.time ?? "";
  return <><div className="grid gap-4 sm:grid-cols-2">
    <AtelierField label="Confirmed date · Nigeria"><input type="date" name="scheduleDate" min={atelierCalendar().date} max="2099-12-31" defaultValue={change?.proposed_date ?? current?.date ?? appointment.preferred_date} required className={atelierInput} /></AtelierField>
    <AtelierField label="Confirmed time · WAT (UTC+1)"><input type="time" name="scheduleTime" step={60} defaultValue={time} required className={atelierInput} /></AtelierField>
    <AtelierField label="Duration in minutes"><input type="number" name="durationMinutes" defaultValue={duration} min={15} max={240} step={1} required className={atelierInput} /></AtelierField>
  </div><p className="text-xs leading-5 text-stone-500">TCC confirms the actual slot. Overlapping atelier appointments cannot be confirmed.</p></>;
}
export function NewAppointmentForm({ options }: { options: AtelierContextOptions }) {
  return <section className={atelierPanel}><h2 className="mb-5 font-display text-2xl">Request a private atelier visit</h2>
    <AtelierForm action={createAtelierAppointmentAction} label="Send appointment request" createdHref="/account/appointments">
      <AtelierField label="Purpose"><select name="type" required className={atelierInput}>{Object.entries(APPOINTMENT_PURPOSES).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></AtelierField>
      <div className="grid gap-4 sm:grid-cols-2"><AtelierField label="Preferred date · Nigeria"><input type="date" name="preferredDate" min={atelierCalendar().date} max="2099-12-31" required className={atelierInput} /></AtelierField>
        <AtelierField label="Preferred time or time window · WAT"><input name="preferredTime" placeholder="For example, afternoon or 14:00" maxLength={80} required className={atelierInput} /></AtelierField></div>
      <ContextFields options={options} /><TextArea name="note" label="Anything TCC should know? (optional)" maximum={2000} />
      <p className="text-xs leading-5 text-stone-500">This is a request, not a confirmed booking. TCC will confirm your date and time here.</p>
    </AtelierForm>
  </section>;
}
export function ClientAppointmentControls({ appointment, pending }: { appointment: AtelierAppointment; pending: boolean }) {
  if (["cancelled", "completed"].includes(appointment.status)) return null;
  if (pending) return <p className={`${atelierPanel} text-sm text-amber-400`}>Your change request is awaiting TCC review. Any existing confirmed schedule remains in place until TCC accepts a change.</p>;
  const values = { appointmentId: appointment.id, expectedVersion: appointment.lock_version };
  return <section className={`${atelierPanel} space-y-6`}><h2 className="font-display text-xl">Request a change</h2>
    <p className="text-xs leading-5 text-stone-500">TCC reviews changes before replacing or cancelling a confirmed appointment.</p>
    <details><summary className="cursor-pointer text-sm text-champagne">Request another date or time</summary><div className="mt-4">
      <AtelierForm action={requestAtelierChangeAction} values={{ ...values, changeType: "reschedule" }} label="Request reschedule" confirmText="Send this preferred date and time to TCC for review? The existing confirmed schedule will remain unchanged until approved.">
        <AtelierField label="Preferred date · Nigeria"><input type="date" name="proposedDate" min={atelierCalendar().date} max="2099-12-31" required className={atelierInput} /></AtelierField>
        <AtelierField label="Preferred time or time window · WAT"><input name="proposedTime" maxLength={80} required className={atelierInput} /></AtelierField>
        <TextArea name="reason" label="Reason (optional)" maximum={1000} />
      </AtelierForm></div></details>
    <details><summary className="cursor-pointer text-sm text-stone-400">Request cancellation</summary><div className="mt-4">
      <AtelierForm action={requestAtelierChangeAction} values={{ ...values, changeType: "cancellation" }} label="Request cancellation" confirmText="Ask TCC to cancel this appointment? The record and its history will be retained.">
        <TextArea name="reason" label="Reason (optional)" maximum={1000} />
      </AtelierForm></div></details>
  </section>;
}
export function StaffAppointmentControls({ appointment, changes }: { appointment: AtelierAppointment; changes: AtelierChange[] }) {
  const pending = changes.filter(change => change.status === "pending_review");
  const terminal = ["cancelled", "completed"].includes(appointment.status);
  const values = { appointmentId: appointment.id, expectedVersion: appointment.lock_version };
  const action = appointment.status === "requested" ? "confirm" : "reschedule";
  return <div className="space-y-6">
    {pending.map(change => <section className={atelierPanel} key={change.id}><h2 className="font-display text-xl">Review client {change.change_type}</h2>
      <p className="mt-3 whitespace-pre-wrap break-words text-sm text-stone-400">{change.proposed_date} {change.proposed_time}{change.reason ? ` · ${change.reason}` : ""}</p>
      <details className="mt-5"><summary className="cursor-pointer text-sm text-champagne">Approve change</summary><div className="mt-4">
        <AtelierForm action={reviewAtelierChangeAction} label="Approve change" values={{ changeId: change.id, decision: "approve", expectedVersion: appointment.lock_version, expectedChangeVersion: change.lock_version }} confirmText="Approve this client change and notify them? Any selected time becomes the authoritative TCC schedule.">
          {change.change_type === "reschedule" && <ScheduleFields appointment={appointment} change={change} />}
          <TextArea name="reason" label="Decision message to client" maximum={1000} required />
          <TextArea name="staffNote" label="Internal staff note (optional, not shown to client)" maximum={2000} />
        </AtelierForm></div></details>
      <details className="mt-5"><summary className="cursor-pointer text-sm text-stone-400">Decline change</summary><div className="mt-4">
        <AtelierForm action={reviewAtelierChangeAction} label="Decline change" values={{ changeId: change.id, decision: "decline", expectedVersion: appointment.lock_version, expectedChangeVersion: change.lock_version }} confirmText="Decline this change request? The current appointment schedule will remain unchanged.">
          <TextArea name="reason" label="Reason shown to client" maximum={1000} required /><TextArea name="staffNote" label="Internal staff note (optional)" maximum={2000} />
        </AtelierForm></div></details>
    </section>)}
    {!terminal && pending.length === 0 && <section className={`${atelierPanel} space-y-6`}><h2 className="font-display text-xl">Manage appointment</h2>
      <details open={action === "confirm"}><summary className="cursor-pointer text-sm text-champagne">{action === "confirm" ? "Confirm the atelier visit" : "Change the confirmed schedule"}</summary><div className="mt-4">
        <AtelierForm action={manageAtelierAppointmentAction} values={{ ...values, action }} label={action === "confirm" ? "Confirm appointment" : "Confirm new schedule"} confirmText="Confirm the entered date, time and duration in Nigeria (WAT)? TCC will notify the client; this becomes their authoritative appointment schedule.">
          <ScheduleFields appointment={appointment} /><TextArea name="reason" label={action === "reschedule" ? "Reason shown to client" : "Client message (optional)"} maximum={1000} required={action === "reschedule"} /><TextArea name="staffNote" label="Internal staff note (optional)" maximum={2000} />
        </AtelierForm></div></details>
      <details><summary className="cursor-pointer text-sm text-stone-400">Cancel appointment</summary><div className="mt-4">
        <AtelierForm action={manageAtelierAppointmentAction} values={{ ...values, action: "cancel" }} label="Cancel appointment" confirmText="Cancel this appointment and notify the client? Its record and history will remain available.">
          <TextArea name="reason" label="Cancellation reason shown to client (optional)" maximum={1000} /><TextArea name="staffNote" label="Internal staff note (optional)" maximum={2000} />
        </AtelierForm></div></details>
      {appointment.scheduled_start_at && new Date(appointment.scheduled_start_at).getTime() <= Date.now() && <AtelierForm action={manageAtelierAppointmentAction} values={{ ...values, action: "complete" }} label="Mark appointment completed" confirmText="Mark this atelier visit completed? This does not complete the related order or change any payment."><TextArea name="staffNote" label="Completion note (internal, optional)" maximum={2000} /></AtelierForm>}
    </section>}
    <section className={atelierPanel}><h2 className="mb-5 font-display text-xl">Add an internal note</h2><AtelierForm action={addAtelierNoteAction} values={{ appointmentId: appointment.id }} label="Save staff note" resetOnSuccess><TextArea name="note" label="Staff only · not visible to client" maximum={2000} required /></AtelierForm></section>
  </div>;
}
