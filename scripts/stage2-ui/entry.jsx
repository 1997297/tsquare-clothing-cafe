import React from 'react';
import { createRoot } from 'react-dom/client';
import { BankSettingsForm } from '../../src/components/payments/PaymentForms';
import { PaymentDetail } from '../../src/components/payments/PaymentDetail';
import { ConciergeMessages } from '../../src/components/atelier/ConciergeMessages';
import { AtelierForm, AtelierField } from '../../src/components/atelier/AtelierForm';
import { AppointmentCard, AtelierTimeline, ServiceHeader } from '../../src/components/atelier/ServiceUI';
import { RequestAppointmentSummary } from '../../src/components/atelier/RequestAppointmentSummary';
import { atelierInput } from '../../src/components/atelier/styles';

const params = new URLSearchParams(location.search);
const role = params.get('role') || 'ceo';
const mode = params.get('mode') || 'bank';
const message = (seq, sender = seq % 2 ? 'customer' : 'concierge', text) => ({ id: `message-${seq}`, request_id: 'thread', message_seq: seq, sender_type: sender, sender_name: 'PRIVATE_STAFF_IDENTITY', display_label: 'PRIVATE_STAFF_IDENTITY', message: text || `Message ${seq}: a private atelier conversation. ${seq === 3 ? 'https://example.invalid/' + 'a'.repeat(400) + ' <script>window.unsafe=true</script>' : ''}`, created_at: '2026-10-11T09:00:00Z' });
const bank = { id: true, is_configured: params.get('setup') !== '1', bank_name: 'Fixture Bank — no transfers', account_name: 'TCC Browser Fixture Only', account_number: '0123456789', instructions: 'Test fixture. Do not transfer.', lock_version: 4, updated_at: '2026-10-11T09:00:00Z' };
const state = window.stage2 = { bank, bankCalls: [], failBank: false, loadCalls: 0, readCalls: [], messages: Array.from({ length: 40 }, (_, i) => message(i + 1)), addMessage: (sender, text) => state.messages.push(message(state.messages.length + 1, sender, text)) };
const request = { id: 'request', order_id: 'order', customer_id: 'client', request_reference: 'TCC-PAY-FIXTURE', requested_amount_minor: 10000000, purpose: 'deposit', note: null, due_date: null, bank_snapshot: { ...bank, bank_name: 'Historical Snapshot Bank', account_number: '0012345678' }, status: 'active', lock_version: 1, created_at: '2026-10-11T09:00:00Z', cancelled_reason: null };
const summary = { order_id: 'order', total_minor: 36000000, verified_minor: 26000000, pending_minor: 0, balance_minor: 10000000, reserved_minor: 10000000, requestable_minor: 0, fully_paid: false };
const workspace = { requests: [request], orders: [{ id: 'order', customer_id: 'client', order_reference: 'TCC-ORDER-FIXTURE', style_name: 'Fixture Fit', total_amount_minor: 36000000, lock_version: 1, status: 'order_confirmed' }], payments: [], submissions: [], customers: [], bank, events: [], summary, financials: { order: summary } };
const appointment = { id: 'appointment', type: 'consultation', status: 'requested', preferred_date: '2026-12-12', preferred_time: 'afternoon', scheduled_start_at: null, location: 'TCC office' };

function App() {
  return <main className="mx-auto max-w-5xl space-y-8 p-4 sm:p-8">
    {mode === 'bank' && <><ServiceHeader title="Payments" description="Local fixture — no production data or backend requests." /><BankSettingsForm bank={state.bank} ceo={role === 'ceo'} /></>}
    {mode === 'payment' && <PaymentDetail workspace={workspace} summary={summary} requestId="request" staff={role !== 'client'} />}
    {mode === 'chat' && <><ServiceHeader reference="TCC-CON-FIXTURE" title="Your private Concierge" description="Messages with the atelier" /><section className="atelier-panel rounded-3xl bg-stone-950 p-5 sm:p-7"><ConciergeMessages requestId="thread" initialMessages={state.messages.slice(0, 40)} initialHasMore={false} initialReadSeq={0} staff={role !== 'client'}>
      <section className="border-t border-stone-800 pt-6"><h2 className="mb-5 font-display text-xl">{role === 'client' ? 'Your reply' : 'Reply as TCC Concierge'}</h2><AtelierForm action={async ({ message: text }) => { state.addMessage(role === 'client' ? 'customer' : 'concierge', text); return { success: true }; }} label="Send reply" resetOnSuccess><AtelierField label="Message"><textarea name="message" rows={3} required maxLength={4000} className={atelierInput} /></AtelierField></AtelierForm></section>
    </ConciergeMessages></section></>}
    {mode === 'appointments' && <><ServiceHeader title="Appointments" description="Times are shown in Nigeria time (WAT)." /><AppointmentCard appointment={appointment} /><AppointmentCard appointment={{ ...appointment, status: 'confirmed', scheduled_start_at: '2026-12-13T13:00:00Z' }} /><RequestAppointmentSummary appointment={{ type: 'consultation', preferredDate: '2026-12-12', preferredTime: 'afternoon', notes: 'A client note', staffNote: 'PRIVATE_NOTE_MUST_NOT_RENDER' }} /><AtelierTimeline events={[{ id: 'event', event_type: 'appointment_change_requested', actor_type: 'customer', created_at: '2026-10-11T09:00:00Z', metadata: { change_type: 'reschedule' } }]} /></>}
  </main>;
}
const root = createRoot(document.getElementById('root'));
state.render = () => root.render(<App />);
state.render();
