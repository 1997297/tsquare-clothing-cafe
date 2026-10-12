"use client";

import { useState } from "react";
import type { PaymentRequest } from "@/lib/payments/manual";
import { buttonClass } from "./PaymentUI";

/** Render the supplied account verbatim. Payment callers must supply their saved snapshot. */
export function BankAccountCard({ bank, copy = false }: { bank: PaymentRequest["bank_snapshot"]; copy?: boolean }) {
  const [feedback, setFeedback] = useState("");
  const [failed, setFailed] = useState(false);
  const copyNumber = async () => {
    try {
      await navigator.clipboard.writeText(bank.account_number);
      setFailed(false);
      setFeedback("Account number copied.");
    } catch {
      setFailed(true);
      setFeedback("Copy is unavailable. Select and copy the account number above.");
    }
  };
  return <div className="min-w-0 rounded-2xl bg-surface-elevated p-5 sm:p-6">
    <dl className="space-y-5 [overflow-wrap:anywhere]">
      <div><dt className="text-xs text-stone-400">Bank name</dt><dd className="mt-1 text-base text-warm-ivory">{bank.bank_name}</dd></div>
      <div><dt className="text-xs text-stone-400">Account name</dt><dd className="mt-1 text-base text-warm-ivory">{bank.account_name}</dd></div>
      <div><dt className="text-xs text-stone-400">Account number</dt><dd className="mt-2 select-text font-mono text-2xl tracking-wide text-warm-ivory sm:text-3xl">{bank.account_number}</dd></div>
    </dl>
    {copy && <div className="mt-5"><button type="button" className={buttonClass} onClick={() => void copyNumber()}>Copy Account Number</button>
      <p role={failed ? "alert" : "status"} className={`mt-3 text-xs leading-5 ${failed ? "text-rose-400" : "text-stone-300"}`}>{feedback}</p>
    </div>}
  </div>;
}
