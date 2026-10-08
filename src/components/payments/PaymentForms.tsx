"use client";

import { ClientForm } from "@/components/common/ClientForm";

import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { setBankAction, setPriceAction, issuePaymentAction, cancelPaymentAction, reviewPaymentAction, type PaymentActionResult } from "@/app/account/payments/actions";
import { type BankSettings, type FinancialSummary, type PaymentOrder, type PaymentRequest, type PaymentSubmission, PAYMENT_PURPOSES } from "@/lib/payments/manual";
import { formatMinor } from "@/lib/payments/money";
import { workflowOperation, type WorkflowOperation } from "@/lib/workflow-operation";
import { buttonClass, inputClass, panelClass } from "./PaymentUI";

type Values = Record<string, unknown>;
function Confirm({ description, busy, close, confirm }: { description: string; busy: boolean; close: () => void; confirm: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { const node = dialog.current; node?.showModal(); return () => node?.close(); }, []);
  return <dialog ref={dialog} onCancel={e => { e.preventDefault(); if (!busy) close(); }} aria-labelledby="payment-confirm-title" className="m-auto w-[calc(100%-2rem)] max-w-md rounded-3xl border border-stone-700 bg-stone-950 p-6 text-warm-ivory shadow-2xl backdrop:bg-black/75"><h2 id="payment-confirm-title" className="font-display text-2xl">Confirm financial action</h2><p className="mt-4 whitespace-pre-wrap break-words text-sm leading-6 text-stone-300">{description}</p><div className="mt-6 flex flex-wrap justify-end gap-3"><button type="button" autoFocus disabled={busy} onClick={close} className="rounded-xl border border-stone-700 px-4 py-3 text-sm">Go back</button><button type="button" disabled={busy} onClick={confirm} className={buttonClass}>{busy ? "Saving…" : "Confirm"}</button></div></dialog>;
}
function FinancialForm({ children, values, action, label, describe, disabled = false }: { children: ReactNode; values: Values; action: (input: unknown) => Promise<PaymentActionResult>; label: string; describe: (input: Values) => string; disabled?: boolean }) {
  const router = useRouter();
  const operation = useRef<WorkflowOperation | null>(null);
  const [pending, startTransition] = useTransition();
  const [confirmation, setConfirmation] = useState<Values | null>(null);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  const run = () => {
    if (!confirmation || pending) return;
    const input = confirmation;
    operation.current = workflowOperation(operation.current, input, () => crypto.randomUUID());
    const operationKey = operation.current.key;
    startTransition(async () => {
      try {
        const result = await action({ ...input, operationKey });
        setFailed(!result.success);
        setMessage(result.success ? "Saved. Financial records refreshed." : result.error);
        if (result.success) { router.refresh(); window.dispatchEvent(new Event("tcc-payments-updated")); }
      } catch { setFailed(true); setMessage("We could not confirm the result. Refresh to check the history, or retry the same action."); }
      setConfirmation(null);
    });
  };
  return <><ClientForm onSubmit={e => { e.preventDefault(); if (pending || disabled) return; setMessage(""); setConfirmation({ ...Object.fromEntries(new FormData(e.currentTarget)), ...values }); }} className="space-y-4"><fieldset disabled={pending || disabled} className="min-w-0 space-y-4">{children}<button type="submit" className={buttonClass}>{label}</button></fieldset>{message && <p role={failed ? "alert" : "status"} className={`text-sm leading-6 ${failed ? "text-rose-400" : "text-champagne"}`}>{message}</p>}</ClientForm>{confirmation && <Confirm description={describe(confirmation)} busy={pending} close={() => { if (!pending) setConfirmation(null); }} confirm={run} />}</>;
}
function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="block min-w-0 text-xs text-stone-400">{label}{children}</label>; }
function MoneyInput({ value }: { value?: number | null }) { return <input name="amount" inputMode="decimal" required maxLength={20} placeholder="0.00" defaultValue={value == null ? "" : `${Math.floor(value / 100)}.${String(value % 100).padStart(2, "0")}`} className={inputClass} />; }

export function BankSettingsForm({ bank, ceo }: { bank: BankSettings | null; ceo: boolean }) {
  if (!bank) return <section className={panelClass}><h2 className="font-display text-xl">Official bank details</h2><p className="mt-3 text-sm text-stone-400">Bank configuration is unavailable. Payment requests cannot be issued.</p></section>;
  return <section className={panelClass}><h2 className="font-display text-xl">Official bank details</h2><p className="my-4 text-sm leading-6 text-stone-400">{bank.is_configured ? "New payment requests use these details. Existing requests retain their original bank instructions." : "Setup incomplete. Fields below contain placeholder hints only. The CEO must enter the official details after project approval; no transfers should be made yet."}</p>
    {ceo ? <FinancialForm key={bank.lock_version} values={{ expectedVersion: bank.lock_version }} action={setBankAction} label="Save official bank details" describe={v => `Change the destination for NEW payment requests to ${v.bankName}, ${v.accountName}, account ${v.accountNumber}? Confirm these are TCC's official details. Historical requests will not change.`}><div className="grid gap-4 sm:grid-cols-2"><Field label="Bank name"><input name="bankName" required minLength={2} maxLength={120} defaultValue={bank.bank_name} placeholder="Enter official bank name" className={inputClass} /></Field><Field label="Account name"><input name="accountName" required minLength={2} maxLength={160} defaultValue={bank.account_name} placeholder="Enter TCC account name" className={inputClass} /></Field><Field label="Account number"><input name="accountNumber" required inputMode="numeric" pattern="[0-9]{10}" maxLength={10} defaultValue={bank.account_number} placeholder="Official 10-digit number" className={inputClass} /></Field><Field label="Transfer instructions (optional)"><textarea name="instructions" maxLength={2000} defaultValue={bank.instructions} placeholder="Instructions for the client" className={inputClass} /></Field></div></FinancialForm> : <><dl className="space-y-2 break-words text-sm"><div><dt className="text-stone-500">Bank</dt><dd>{bank.bank_name || "Not configured"}</dd></div><div><dt className="text-stone-500">Account</dt><dd>{bank.account_name || "Not configured"} {bank.account_number}</dd></div></dl><p className="mt-4 text-xs text-stone-400">Only the CEO can change the destination account.</p></>}
  </section>;
}

export function OrderPaymentForms({ order, summary, bank }: { order: PaymentOrder; summary: FinancialSummary; bank: BankSettings | null }) {
  return <section className={panelClass}><h2 className="font-display text-xl">Manage order payments</h2><div className="mt-5 grid gap-8 lg:grid-cols-2">
    <div><h3 className="mb-4 text-sm text-champagne">Agreed order total</h3><FinancialForm key={`price-${order.lock_version}`} values={{ orderId: order.id, expectedVersion: order.lock_version }} action={setPriceAction} label="Set agreed total" describe={v => `Change ${order.order_reference} from ${formatMinor(order.total_amount_minor)} to ₦${v.amount}? Reason: ${v.reason}. Verified payments and outstanding requests remain protected.`}><Field label="Agreed total (NGN)"><MoneyInput value={order.total_amount_minor} /></Field><Field label="Reason / price agreement"><textarea name="reason" required minLength={3} maxLength={2000} className={inputClass} /></Field></FinancialForm></div>
    <div><h3 className="mb-2 text-sm text-champagne">Request payment</h3><p className="mb-4 text-xs leading-6 text-stone-400">Available for a new request: {formatMinor(summary.requestable_minor)}. Existing active requests reserve {formatMinor(summary.reserved_minor)}.</p>{!bank?.is_configured && <p className="mb-4 text-sm text-amber-400">The CEO must configure official bank details first.</p>}<FinancialForm key={`request-${order.lock_version}`} values={{ orderId: order.id, expectedVersion: order.lock_version }} action={issuePaymentAction} disabled={!bank?.is_configured || !summary.requestable_minor} label="Request payment" describe={v => `Issue a ₦${v.amount} ${PAYMENT_PURPOSES[v.purpose as keyof typeof PAYMENT_PURPOSES]} request for ${order.order_reference}? The client will receive the current official bank instructions.`}><Field label="Requested amount (NGN)"><MoneyInput /></Field><Field label="Purpose"><select name="purpose" className={inputClass}>{Object.entries(PAYMENT_PURPOSES).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></Field><Field label="Due date (optional)"><input type="date" name="dueDate" className={inputClass} /></Field><Field label="Client-facing note (optional)"><textarea name="note" maxLength={2000} className={inputClass} /></Field></FinancialForm></div>
  </div></section>;
}
export function CancelRequestForm({ request }: { request: PaymentRequest }) {
  return <details className={panelClass}><summary className="cursor-pointer text-sm text-stone-400">Cancel this unpaid request</summary><div className="mt-4"><FinancialForm values={{ requestId: request.id, expectedVersion: request.lock_version }} action={cancelPaymentAction} label="Cancel payment request" describe={v => `Cancel ${request.request_reference}? Reason: ${v.reason}. History will be preserved.`}><Field label="Client-facing cancellation reason"><textarea name="reason" minLength={3} required maxLength={2000} className={inputClass} /></Field></FinancialForm></div></details>;
}
export function ReviewSubmissionForm({ submission }: { submission: PaymentSubmission }) {
  return <section className={panelClass}><h3 className="font-display text-xl">Review pending evidence</h3><p className="my-4 text-sm leading-6 text-stone-400">Client reported {formatMinor(submission.reported_amount_minor)}. Check TCC’s bank records independently, then enter the amount actually received. The receipt alone is not verification.</p><a href={`/api/payments/receipts/${submission.receipt_id}`} target="_blank" rel="noopener noreferrer" className="mb-5 inline-block text-sm text-champagne underline">Download private receipt</a><div className="grid gap-8 sm:grid-cols-2"><FinancialForm values={{ submissionId: submission.id, decision: "verify" }} action={reviewPaymentAction} label="Verify received funds" describe={v => `Confirm TCC received ₦${v.amount} for transfer ${submission.transaction_reference}? This creates an immutable verified payment and reduces the balance exactly once.`}><Field label="Amount actually received (NGN)"><MoneyInput /></Field><Field label="Review note (optional)"><textarea name="reason" maxLength={2000} className={inputClass} /></Field></FinancialForm><FinancialForm values={{ submissionId: submission.id, decision: "reject" }} action={reviewPaymentAction} label="Reject evidence" describe={v => `Reject this evidence with the client-facing reason: ${v.reason}? No funds will be counted.`}><Field label="Rejection reason (visible to client)"><textarea name="reason" required minLength={3} maxLength={2000} className={inputClass} /></Field></FinancialForm></div></section>;
}
