"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { FinancialSummary, PaymentWorkspace } from "@/lib/payments/manual";
import { FinancialCards, PaymentHistory, panelClass } from "./PaymentUI";
import { PaymentList } from "./PaymentList";

export function ClientOrderFinance({ orderId, compact = false }: { orderId: string; compact?: boolean }) {
  const [data, setData] = useState<{ workspace: PaymentWorkspace; summary: FinancialSummary } | null>(null);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    let requestNumber = 0;
    async function load() {
      const current = ++requestNumber;
      try {
        const response = await fetch(`/api/payments/orders/${orderId}`, { cache: "no-store", signal: controller.signal });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error);
        if (current === requestNumber) { setData(result); setError(""); }
      } catch { if (!controller.signal.aborted && current === requestNumber) setError("Financial details could not be refreshed. Please try again."); }
    }
    void load();
    window.addEventListener("focus", load);
    window.addEventListener("tcc-payments-updated", load);
    return () => { controller.abort(); window.removeEventListener("focus", load); window.removeEventListener("tcc-payments-updated", load); };
  }, [orderId, retry]);
  if (error) return <section className={panelClass}><p role="alert" className="text-sm text-stone-400">{error}</p><button type="button" onClick={() => setRetry(v => v + 1)} className="mt-3 text-xs text-champagne underline">Retry financial details</button></section>;
  if (!data || data.summary.order_id !== orderId) return <section className={panelClass}><p role="status" className="text-sm text-stone-400">Loading financial details…</p></section>;
  return <div className="space-y-6"><FinancialCards summary={data.summary} />{compact ? <Link className="inline-block text-xs text-champagne underline" href={`/account/orders/${orderId}`}>Payment requests and history for {data.workspace.orders[0]?.order_reference}</Link> : <><PaymentList workspace={data.workspace} staff={false} orderOnly /><PaymentHistory workspace={data.workspace} /></>}</div>;
}
