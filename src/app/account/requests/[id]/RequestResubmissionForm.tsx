"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { RefreshCcw, Ruler } from "lucide-react";
import { resubmitBespokeRequestAction } from "@/app/account/actions";
import { useWorkflowOperation } from "@/components/atelier/useWorkflowOperation";

export function RequestResubmissionForm({
  requestId,
  expectedVersion,
  initialInstructions,
  onSaved,
}: {
  requestId: string;
  expectedVersion: number;
  initialInstructions: string;
  onSaved: () => Promise<void>;
}) {
  const [response, setResponse] = useState("");
  const [instructions, setInstructions] = useState(initialInstructions);
  const [useCurrentMeasurements, setUseCurrentMeasurements] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const operationKeyFor = useWorkflowOperation();

  function submit() {
    setError(null);
    const input = { requestId, response, specialInstructions: instructions, useCurrentMeasurements, expectedVersion };
    const operationKey = operationKeyFor(input);
    startTransition(async () => {
      try {
      const result = await resubmitBespokeRequestAction({ ...input, operationKey });
      if (!result.ok) { setError(result.error); return; }
      setResponse("");
      await onSaved();
      } catch {
        setError("The response was interrupted. Retry the same response or refresh to check its status.");
      }
    });
  }

  return (
    <div className="space-y-5 border-t border-amber-800/40 pt-5">
      {error && <p role="alert" className="rounded-xl border border-red-800/50 bg-red-950/30 p-3 text-xs text-red-300">{error}</p>}
      <label className="block"><span className="text-[10px] uppercase tracking-wider text-amber-500">Your response to TCC</span><textarea value={response} onChange={(event) => setResponse(event.target.value)} maxLength={2000} rows={4} placeholder="Explain what you clarified or changed." className="mt-2 w-full rounded-2xl border border-amber-800/50 bg-near-black p-4 text-sm text-warm-ivory outline-none focus:border-champagne" /></label>
      <label className="block"><span className="text-[10px] uppercase tracking-wider text-stone-500">Updated special instructions</span><textarea value={instructions} onChange={(event) => setInstructions(event.target.value)} maxLength={2000} rows={3} className="mt-2 w-full rounded-2xl border border-stone-700 bg-near-black p-4 text-sm text-warm-ivory outline-none focus:border-champagne" /></label>
      <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-stone-700 p-4"><input type="checkbox" checked={useCurrentMeasurements} onChange={(event) => setUseCurrentMeasurements(event.target.checked)} className="mt-0.5 accent-champagne" /><span><span className="flex items-center gap-2 text-xs text-stone-200"><Ruler className="h-4 w-4 text-champagne" /> Attach my current measurement profile</span><span className="mt-1 block text-[11px] leading-5 text-stone-500">This replaces only this request revision&apos;s measurement snapshot. Previous revisions remain preserved.</span></span></label>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><Link href="/account/measurements" className="text-xs text-stone-400 underline underline-offset-4 hover:text-champagne">Review measurements first</Link><button type="button" disabled={isPending || response.trim().length < 3} onClick={submit} className="inline-flex items-center justify-center gap-2 rounded-xl bg-champagne px-5 py-3 text-xs font-bold uppercase tracking-wider text-near-black disabled:cursor-not-allowed disabled:opacity-50"><RefreshCcw className="h-4 w-4" />{isPending ? "Resubmitting…" : "Resubmit for review"}</button></div>
    </div>
  );
}
