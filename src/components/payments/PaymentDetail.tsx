import Link from "next/link";
import type { FinancialSummary, PaymentWorkspace } from "@/lib/payments/manual";
import { PAYMENT_PURPOSES, requestPosition } from "@/lib/payments/manual";
import { formatMinor } from "@/lib/payments/money";
import { FinancialCards, PaymentHistory, PaymentActivity, panelClass, paymentDate } from "./PaymentUI";
import { CancelRequestForm, ReviewSubmissionForm } from "./PaymentForms";
import { EvidenceForm } from "./EvidenceForm";
import { BankAccountCard } from "./BankAccountCard";

export function PaymentDetail({ workspace, summary, requestId, staff }: { workspace: PaymentWorkspace; summary: FinancialSummary; requestId: string; staff: boolean }) {
  const request = workspace.requests.find(r => r.id === requestId)!;
  const order = workspace.orders.find(o => o.id === request.order_id)!;
  const client = workspace.customers.find(c => c.id === request.customer_id);
  const position = requestPosition(request, workspace.payments, workspace.submissions);
  const submissions = workspace.submissions.filter(s => s.request_id === requestId);
  const root = staff ? "/admin" : "/account";
  return <div className="space-y-6"><Link href={`${root}/payments`} className="text-xs text-champagne underline">Back to payments</Link><header className="border-b border-stone-800 pb-6"><p className="break-all font-mono text-xs text-champagne">{request.request_reference}</p><h1 className="mt-3 font-display text-3xl">{PAYMENT_PURPOSES[request.purpose]} request</h1><Link href={`${root}/orders/${order.id}`} className="mt-3 inline-block text-sm text-stone-400 underline">{order.order_reference} · {order.style_name}</Link>{client && <p className="mt-3 break-words text-sm text-stone-400">{client.first_name} {client.last_name} · {client.email}</p>}</header><FinancialCards summary={summary} />
    <div className="grid min-w-0 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <section className={panelClass}><div className="flex flex-wrap justify-between gap-3"><h2 className="font-display text-xl">Payment request</h2><span className="text-xs text-champagne">{position.status}</span></div>
        <dl className="mt-5 grid gap-5 sm:grid-cols-2"><div><dt className="text-xs text-stone-400">Requested amount</dt><dd className="mt-2 break-words font-display text-2xl">{formatMinor(request.requested_amount_minor)}</dd></div><div><dt className="text-xs text-stone-400">Remaining on this request</dt><dd className="mt-2 break-words font-display text-2xl">{formatMinor(position.remaining)}</dd></div><div className="sm:col-span-2"><dt className="text-xs text-stone-400">Dates</dt><dd className="mt-2 text-sm">Issued {paymentDate(request.created_at)}{request.due_date ? ` · Due ${paymentDate(request.due_date)}` : ""}</dd></div></dl>
        {request.note && <p className="mt-4 whitespace-pre-wrap break-words text-sm text-stone-300">{request.note}</p>}
      </section>
      <section className={panelClass} aria-label="Transfer To"><h2 className="mb-5 font-display text-xl">Transfer To</h2>
        <BankAccountCard key={`${request.id}-${request.bank_snapshot.account_number}`} bank={request.bank_snapshot} copy />
        {request.bank_snapshot.instructions && <p className="mt-5 whitespace-pre-wrap break-words text-sm text-stone-300">{request.bank_snapshot.instructions}</p>}
        <p className="mt-5 whitespace-pre-wrap break-words text-sm leading-6 text-stone-400">{request.status === "cancelled" ? `Do not transfer against this cancelled request. ${request.cancelled_reason ?? ""}` : position.remaining === 0 ? "This request is satisfied. Do not transfer further funds against it." : position.pending > 0 ? "Your evidence is awaiting review. Do not repeat the transfer while TCC verifies it." : `Quote ${request.request_reference} in your bank transfer narration, then submit your receipt below for TCC to verify.`}</p>
        <p className="mt-3 text-xs leading-5 text-stone-400">Bank details saved when this request was issued. Only funds verified by TCC count as paid.</p>
      </section>
    </div>
    {!staff && request.status === "active" && position.remaining > 0 && position.pending === 0 && <EvidenceForm requestId={request.id} remaining={position.remaining} />}
    <PaymentHistory workspace={workspace} requestId={staff ? undefined : request.id} />
    <PaymentActivity workspace={workspace} />
    {staff && submissions.filter(s => s.status === "awaiting_verification").map(s => <ReviewSubmissionForm key={s.id} submission={s} />)}
    {staff && request.status === "active" && position.verified === 0 && position.pending === 0 && <CancelRequestForm request={request} />}
  </div>;
}
