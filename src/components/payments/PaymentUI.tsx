import Link from "next/link";
import type { FinancialSummary, PaymentRequest, PaymentWorkspace } from "@/lib/payments/manual";
import { paymentPercent, PAYMENT_PURPOSES, requestPosition, requestOrderSummary } from "@/lib/payments/manual";
import { formatMinor } from "@/lib/payments/money";

export const panelClass = "payment-panel rounded-3xl border border-stone-800 bg-stone-950/60 p-5 sm:p-7 min-w-0";
export const inputClass = "mt-2 w-full min-w-0 rounded-xl border border-stone-700 bg-near-black px-3 py-3 text-sm text-warm-ivory focus:outline-none focus:ring-2 focus:ring-champagne/60 disabled:opacity-50";
export const buttonClass = "rounded-xl bg-champagne px-4 py-3 text-xs font-semibold text-near-black disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-champagne";
export function paymentDate(value: string) {
  return new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeZone: "Africa/Lagos" }).format(new Date(value));
}
export function FinancialCards({ summary }: { summary: FinancialSummary }) {
  const percent = paymentPercent(summary.total_minor, summary.verified_minor);
  const balancePercent = summary.total_minor ? (10000 - Math.round(percent * 100)) / 100 : null;
  return <section className={panelClass} aria-label="Order financial summary">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-display text-xl">Financial position</h2><span className="rounded-full border border-champagne/30 px-3 py-1 text-xs text-champagne">{summary.fully_paid ? "Fully paid" : summary.total_minor === null ? "Price not agreed" : `${percent}% verified paid`}</span></div>
    <dl className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">{([
      ["Order total", summary.total_minor], ["Verified paid", summary.verified_minor],
      ["Awaiting verification", summary.pending_minor], ["Order outstanding balance", summary.balance_minor],
    ] as const).map(([label, value]) => <div key={label} className="min-w-0"><dt className="text-xs text-stone-400">{label}</dt><dd className="mt-2 break-words font-display text-xl text-warm-ivory tabular-nums">{formatMinor(value)}</dd></div>)}</dl>
    {summary.total_minor !== null && <><div className="mt-5 h-1.5 overflow-hidden rounded-full bg-stone-800" role="progressbar" aria-label="Verified payment progress" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}><div className="h-full bg-champagne" style={{ width: `${percent}%` }} /></div><p className="mt-2 text-xs text-stone-400">{percent}% paid · {balancePercent}% balance</p></>}
    <p className="mt-4 text-xs leading-5 text-stone-400">Receipts awaiting verification do not reduce your balance. Only funds confirmed by TCC count as paid.</p>
  </section>;
}
export function RequestCard({ request, workspace, staff }: { request: PaymentRequest; workspace: PaymentWorkspace; staff: boolean }) {
  const position = requestPosition(request, workspace.payments, workspace.submissions);
  const financial = requestOrderSummary(request, workspace.financials);
  const order = workspace.orders.find(o => o.id === request.order_id);
  const customer = workspace.customers.find(c => c.id === request.customer_id);
  return <Link href={`/${staff ? "admin" : "account"}/payments/${request.id}`} className="block min-w-0 rounded-2xl border border-stone-800 p-5 transition-colors hover:border-champagne/50 focus-visible:outline-champagne">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="break-all font-mono text-xs text-champagne">{request.request_reference}</p><p className="mt-2 text-sm">{order?.order_reference} · {PAYMENT_PURPOSES[request.purpose]}</p>{staff && customer && <p className="mt-1 break-words text-xs text-stone-400">{customer.first_name} {customer.last_name} · {customer.email}</p>}</div><span className="text-xs text-stone-400">{position.status}</span></div>
    {financial ? <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
      {([['Order total', financial.total_minor], ['Verified paid on order', financial.verified_minor], ['Order outstanding balance', financial.balance_minor]] as const).map(([label, amount]) => <div key={label}><dt className="text-xs text-stone-400">{label}</dt><dd className="mt-1 break-words font-display text-xl tabular-nums">{formatMinor(amount)}</dd></div>)}
    </dl> : <p className="mt-4 text-sm text-amber-400">Order balance unavailable. Refresh before requesting payment.</p>}
    <div className="mt-4 border-t border-stone-800 pt-3 text-xs leading-6 text-stone-400">
      <p>Requested amount: {formatMinor(request.requested_amount_minor)}</p>
      <p>Verified on this request: {formatMinor(position.verified)}</p>
      <p>Request outstanding amount: {formatMinor(position.remaining)}</p>
    </div>
    <p className="mt-2 text-xs text-stone-500">Issued {paymentDate(request.created_at)}{request.due_date ? ` · Due ${paymentDate(request.due_date)}` : ""}</p>
  </Link>;
}
export function PaymentHistory({ workspace, requestId }: { workspace: PaymentWorkspace; requestId?: string }) {
  const submissions = workspace.submissions.filter(s => !requestId || s.request_id === requestId).sort((a, b) => b.created_at.localeCompare(a.created_at));
  const legacy = workspace.payments.filter(p => !p.submission_id && p.status === "successful" && (!requestId || p.payment_request_id === requestId));
  return <section className={panelClass}><h2 className="font-display text-xl">Payment history</h2>
    {submissions.length === 0 && legacy.length === 0 ? <p className="mt-4 text-sm text-stone-400">No payment evidence has been submitted yet.</p> : <ol className="mt-5 space-y-4">{submissions.map(s => {
      const payment = workspace.payments.find(p => p.id === s.payment_id && p.status === "successful");
      return <li key={s.id} className="min-w-0 rounded-2xl border border-stone-800 p-4 text-sm"><div className="flex flex-wrap justify-between gap-2"><span className="font-medium">{s.status === "awaiting_verification" ? "Awaiting verification" : s.status === "verified" ? "Verified" : "Rejected"}</span><span className="text-xs text-stone-400">Submitted {paymentDate(s.created_at)}</span></div><p className="mt-3 break-words">Reported {formatMinor(s.reported_amount_minor)} · Verified {formatMinor(payment?.amount_minor ?? 0)}</p><p className="mt-2 break-all text-xs text-stone-400">Transferred {paymentDate(s.transfer_date)} · Reference: {s.transaction_reference}</p>{s.client_note && <p className="mt-2 whitespace-pre-wrap break-words text-stone-400">Client note: {s.client_note}</p>}{s.rejection_reason && <p className="mt-3 whitespace-pre-wrap break-words text-rose-400">Reason: {s.rejection_reason}</p>}{s.reviewed_at && <p className="mt-2 text-xs text-stone-400">Reviewed by TCC staff · {paymentDate(s.reviewed_at)}</p>}<a href={`/api/payments/receipts/${s.receipt_id}`} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block text-xs text-champagne underline underline-offset-4">Download private receipt</a></li>;
    })}{legacy.map(p => <li key={p.id} className="rounded-2xl border border-stone-800 p-4"><p className="break-words">Verified {formatMinor(p.amount_minor)}</p><p className="mt-2 break-all text-xs text-stone-400">{p.internal_reference} · {paymentDate(p.verified_at ?? p.created_at)}</p></li>)}</ol>}
  </section>;
}

export function PaymentActivity({ workspace }: { workspace: PaymentWorkspace }) {
  if (!workspace.events.length) return null;
  return <section className={panelClass}><h2 className="font-display text-xl">Financial activity</h2><ol className="mt-5 space-y-5">{[...workspace.events].sort((a, b) => b.created_at.localeCompare(a.created_at)).map(event => {
    const metadata = event.metadata;
    const amount = metadata.verified_amount_minor ?? metadata.reported_amount_minor ?? metadata.amount_minor;
    return <li key={event.id} className="min-w-0 border-l border-champagne/40 pl-4"><p className="text-sm capitalize">{event.event_type.replaceAll("_", " ")}</p><p className="mt-1 text-xs text-stone-400">{event.actor_type === "staff" ? "TCC staff" : "Client"} · {new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Lagos" }).format(new Date(event.created_at))}</p>{typeof amount === "number" && <p className="mt-2 break-words text-sm">{formatMinor(amount)}</p>}{event.event_type === "order_price_set" && <p className="mt-2 break-words text-sm">{formatMinor(typeof metadata.before_minor === "number" ? metadata.before_minor : null)} → {formatMinor(typeof metadata.after_minor === "number" ? metadata.after_minor : null)}</p>}{typeof metadata.message === "string" && metadata.message && <p className="mt-2 whitespace-pre-wrap break-words text-sm text-stone-400">{metadata.message}</p>}</li>;
  })}</ol></section>;
}
