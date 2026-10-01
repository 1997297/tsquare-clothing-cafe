"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { useWorkflowOperation } from "@/components/atelier/useWorkflowOperation";
import { ORDER_STATUS_LABELS, nextOrderStatus } from "@/lib/atelier-workflow";
import type { AdminOrderRecord } from "@/lib/server/atelier-workflow";
import { transitionOrderAction } from "../actions";

export function OrderStageControl({ order }: { order: AdminOrderRecord }) {
  const next = nextOrderStatus(order.status);
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const operationKeyFor = useWorkflowOperation();

  function confirm() {
    if (!next) return;
    const input = { orderId: order.id, status: next, message, expectedVersion: order.lockVersion };
    const operationKey = operationKeyFor(input);
    startTransition(async () => {
      try {
      const result = await transitionOrderAction({ ...input, operationKey });
      if (!result.success) { setError(result.error); setConfirming(false); return; }
      setError(null); setMessage(""); setConfirming(false); router.refresh();
      } catch {
        setError("The response was interrupted. Retry the same action or refresh to check its status.");
        setConfirming(false);
      }
    });
  }

  return (
    <section className="rounded-3xl border border-stone-800 bg-stone-950/70 p-6 sm:p-8">
      <p className="text-[9px] font-mono uppercase tracking-[0.24em] text-champagne-dark">Production control</p>
      <h2 className="mt-2 font-display text-2xl">Advance stage</h2>
      {error && <p role="alert" className="mt-4 rounded-xl border border-red-800/50 bg-red-950/30 p-3 text-xs text-red-300">{error}</p>}
      {next ? (
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-stone-800 p-4 text-xs"><span className="text-stone-400">{ORDER_STATUS_LABELS[order.status]}</span><ArrowRight className="h-4 w-4 text-champagne" /><span className="text-champagne">{ORDER_STATUS_LABELS[next]}</span></div>
          <label className="block"><span className="text-[10px] uppercase tracking-wider text-stone-500">Optional client-visible update</span><textarea value={message} onChange={(event) => setMessage(event.target.value)} maxLength={2000} rows={4} className="mt-2 w-full rounded-2xl border border-stone-700 bg-near-black p-4 text-sm outline-none focus:border-champagne" /></label>
          <button type="button" onClick={() => setConfirming(true)} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-champagne px-5 py-3 text-xs font-bold uppercase tracking-wider text-near-black">Advance to {ORDER_STATUS_LABELS[next]}</button>
        </div>
      ) : <p className="mt-6 flex items-center gap-2 rounded-2xl border border-emerald-800/40 bg-emerald-950/20 p-4 text-sm text-emerald-300"><CheckCircle2 className="h-4 w-4" /> This order has completed its production lifecycle.</p>}
      <ConfirmDialog open={confirming} title={`Move to ${next ? ORDER_STATUS_LABELS[next] : "next stage"}?`} description="This production update will be recorded in the order history and shown to the client." confirmLabel="Update stage" busy={isPending} onCancel={() => !isPending && setConfirming(false)} onConfirm={confirm} />
    </section>
  );
}
