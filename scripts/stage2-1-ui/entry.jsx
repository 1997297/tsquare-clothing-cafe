import React from 'react';
import { createRoot } from 'react-dom/client';
import { OverviewActions } from '../../src/components/admin/OverviewActions';
import { PaymentList } from '../../src/components/payments/PaymentList';
import { PaymentDetail } from '../../src/components/payments/PaymentDetail';
import { RequestManager } from '../../src/app/admin/requests/RequestManager';
import { OrderManager } from '../../src/app/admin/orders/OrderManager';
import { pendingPaymentSubmissions } from '../../src/lib/payments/attention';

const params = new URLSearchParams(location.search), role = params.get('role') || 'admin';
const request = (id, created_at, status = 'active') => ({ id, created_at, status, order_id: 'order', customer_id: 'customer', request_reference: `TCC-PAY-${id}`, purpose: 'deposit', requested_amount_minor: 1000000, bank_snapshot: {bank_name:'Fixture only',account_name:'Fixture',account_number:'0000000000',instructions:'Do not transfer'}, due_date: null });
const submission = (id, request_id, status = 'awaiting_verification') => ({ id, request_id, status, order_id: 'order', customer_id: 'customer', reported_amount_minor: 1000, created_at:'2026-10-12',transfer_date:'2026-10-11',receipt_id:'fixture',transaction_reference:'FIXTURE' });
const first = submission('first', 'pending');
const state = window.stage21 = {
  refreshes: 0,
  workspace: { requests: [request('unpaid', '2026-10-12'), request('pending', '2026-10-10'), request('multiple', '2026-10-09'), request('cancelled', '2026-10-08', 'cancelled')],
    submissions: [first, first, submission('second', 'multiple'), submission('third', 'multiple'), submission('verified', 'unpaid', 'verified'), submission('rejected', 'unpaid', 'rejected'), submission('cancelled', 'cancelled')],
    payments: [], customers: [], orders: [{ id: 'order', order_reference: 'TCC-ORDER-FIXTURE' }], financials: {}, bank: null, events: [] },
  counts: { requests: 2, orders: 0, appointments: 101, concierge: null },
};
const requests = ['submitted', 'under_review', 'confirmed', 'needs_clarification', 'declined', 'converted_to_order'].map((status, i) => ({ id: `request-${i}`, status, requestReference: `REQ-${status}`, createdAt: '2026-10-12' }));
const orders = ['order_confirmed', 'measurements_confirmed', 'in_production', 'finishing', 'ready', 'completed'].map((status, i) => ({ id: `order-${i}`, status, orderReference: `ORDER-${status}`, styleName: 'Fixture', createdAt: '2026-10-12' }));
function App() {
  const requestId=location.pathname.split('/').at(-1);
  if (location.pathname.startsWith('/admin/payments/') && state.workspace.requests.some(r=>r.id===requestId)) return <main className="mx-auto max-w-5xl p-4"><PaymentDetail workspace={{...state.workspace,submissions:[...new Map(state.workspace.submissions.map(s=>[s.id,s])).values()]}} summary={{order_id:'order',total_minor:2000000,verified_minor:0,pending_minor:3000,balance_minor:2000000,fully_paid:false}} requestId={requestId} staff /></main>;
  return <main className="mx-auto max-w-5xl space-y-8 p-4 sm:p-8">
    <h1 className="font-display text-3xl">Stage 2.1 isolated fixtures</h1>
    {role !== 'client' && <OverviewActions counts={{ ...state.counts, payments: pendingPaymentSubmissions(state.workspace.requests, state.workspace.submissions).length }} />}
    <PaymentList workspace={state.workspace} staff={role !== 'client'} initialStatus={params.get('status') === 'pending' ? 'pending' : 'all'} />
    {role !== 'client' && <><RequestManager requests={requests} initialFilter="attention" /><OrderManager orders={orders} initialFilter="attention" /></>}
  </main>;
}
const root = createRoot(document.getElementById('root'));
state.render = () => root.render(<App />);
state.render();
