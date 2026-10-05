"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { submitEvidenceAction } from "@/app/account/payments/actions";
import { RECEIPT_MAX_BYTES, validateReceiptBytes } from "@/lib/payments/receipt-validation";
import { parseNairaInput, formatMinor } from "@/lib/payments/money";
import { workflowOperation, type WorkflowOperation } from "@/lib/workflow-operation";
import { buttonClass, inputClass, panelClass } from "./PaymentUI";

export function EvidenceForm({ requestId, remaining }: { requestId: string; remaining: number }) {
  const router = useRouter();
  const upload = useRef<{ file: File; key: string; receiptId?: string } | null>(null);
  const operation = useRef<WorkflowOperation | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  async function submit(form: HTMLFormElement) {
    if (busy || done) return;
    setBusy(true); setMessage("");
    try {
      const data = new FormData(form);
      const amount = String(data.get("amount") ?? "");
      const minor = parseNairaInput(amount);
      if (!minor || minor > remaining) throw new Error("The reported amount must be positive and no more than the remaining request amount.");
      if (!file) throw new Error("Choose your transfer receipt.");
      if (file.size > RECEIPT_MAX_BYTES) throw new Error("Receipt must be no larger than 3 MB.");
      validateReceiptBytes(file.name, file.type, new Uint8Array(await file.arrayBuffer()));
      if (upload.current?.file !== file) upload.current = { file, key: crypto.randomUUID() };
      const attempt = upload.current;
      if (!attempt.receiptId) {
        const body = new FormData();
        body.set("requestId", requestId); body.set("uploadKey", attempt.key); body.set("receipt", file);
        const response = await fetch("/api/payments/receipts", { method: "POST", body });
        const result = await response.json();
        if (!response.ok || !result.receiptId) throw new Error(result.error || "Upload could not be confirmed. Retry with the same file.");
        attempt.receiptId = result.receiptId;
      }
      const input = { requestId, amount, transferDate: data.get("transferDate"), transactionReference: data.get("transactionReference"), note: data.get("note"), receiptId: attempt.receiptId };
      operation.current = workflowOperation(operation.current, input, () => crypto.randomUUID());
      const result = await submitEvidenceAction({ ...input, operationKey: operation.current.key });
      if (!result.success) throw new Error(result.error);
      setDone(true); setMessage("Evidence submitted. Awaiting TCC verification; your verified balance is unchanged.");
      router.refresh(); window.dispatchEvent(new Event("tcc-payments-updated"));
    } catch (error) { setMessage(error instanceof Error ? error.message : "Submission could not be confirmed. Refresh to check its status or retry the same details."); }
    finally { setBusy(false); }
  }
  return <section className={panelClass}><h2 className="font-display text-xl">Submit transfer evidence</h2><p className="my-4 text-sm leading-6 text-stone-400">After transferring externally, tell TCC what you sent. Up to {formatMinor(remaining)} remains on this request. Never send your PIN, password, CVV or OTP.</p><form onSubmit={e => { e.preventDefault(); void submit(e.currentTarget); }}><fieldset disabled={busy || done} className="grid min-w-0 gap-4 sm:grid-cols-2"><label className="text-xs text-stone-400">Amount transferred (NGN)<input name="amount" required inputMode="decimal" maxLength={20} placeholder="0.00" className={inputClass} /></label><label className="text-xs text-stone-400">Transfer date<input name="transferDate" type="date" required className={inputClass} /></label><label className="text-xs text-stone-400">Bank transaction / reference number<input name="transactionReference" required minLength={3} maxLength={160} className={inputClass} /></label><label className="text-xs text-stone-400">Receipt (JPEG, PNG, WebP or PDF; up to 3 MB)<input name="receipt" type="file" accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf" required onChange={e => { setFile(e.target.files?.[0] ?? null); upload.current = null; }} className={`${inputClass} file:mr-3 file:rounded file:border-0 file:bg-stone-800 file:px-2 file:py-1 file:text-stone-300`} /></label><label className="text-xs text-stone-400 sm:col-span-2">Note (optional)<textarea name="note" maxLength={2000} className={inputClass} /></label><div className="sm:col-span-2"><button className={buttonClass} type="submit">{busy ? "Submitting evidence…" : "Submit for verification"}</button></div></fieldset></form>{message && <p role={done ? "status" : "alert"} className={`mt-4 text-sm leading-6 ${done ? "text-champagne" : "text-rose-400"}`}>{message}</p>}</section>;
}
