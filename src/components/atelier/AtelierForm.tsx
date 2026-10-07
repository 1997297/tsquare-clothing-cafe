"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { workflowOperation, type WorkflowOperation } from "@/lib/workflow-operation";
import { atelierButton } from "./styles";

export type AtelierActionResult = { success: true; id?: string } | { success: false; error: string };

export function AtelierField({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block min-w-0 text-xs text-stone-400">{label}{children}</label>;
}

function Confirmation({ text, busy, close, confirm }: { text: string; busy: boolean; close: () => void; confirm: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);
  return <dialog ref={dialog} aria-labelledby={titleId} onCancel={event => { event.preventDefault(); if (!busy) close(); }} className="atelier-panel m-auto w-[calc(100%-2rem)] max-w-md rounded-3xl border border-stone-700 bg-stone-950 p-6 text-warm-ivory shadow-2xl backdrop:bg-black/75">
    <h2 id={titleId} className="font-display text-2xl">Confirm atelier action</h2>
    <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-6 text-stone-300">{text}</p>
    <div className="mt-6 flex flex-wrap justify-end gap-3">
      <button type="button" autoFocus disabled={busy} onClick={close} className="rounded-xl border border-stone-700 px-4 py-3 text-sm">Go back</button>
      <button type="button" disabled={busy} onClick={confirm} className={atelierButton}>{busy ? "Saving…" : "Confirm"}</button>
    </div>
  </dialog>;
}

export function AtelierForm({ children, action, label, values = {}, confirmText, createdHref, resetOnSuccess = false, disabled = false }: {
  children: ReactNode;
  action: (input: unknown) => Promise<AtelierActionResult>;
  label: string;
  values?: Record<string, unknown>;
  confirmText?: string;
  createdHref?: string;
  resetOnSuccess?: boolean;
  disabled?: boolean;
}) {
  const router = useRouter();
  const form = useRef<HTMLFormElement>(null);
  const operation = useRef<WorkflowOperation | null>(null);
  const inFlight = useRef(false);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pendingValues, setPendingValues] = useState<Record<string, unknown> | null>(null);
  const [result, setResult] = useState<AtelierActionResult | null>(null);

  // Server-rendered forms must never submit private text through the browser's
  // default GET behavior before their authenticated action handler is hydrated.
  useEffect(() => { setReady(true); }, []);

  const run = async (input: Record<string, unknown>) => {
    if (!ready || inFlight.current || disabled) return;
    inFlight.current = true;
    setBusy(true);
    setResult(null);
    operation.current = workflowOperation(operation.current, input, () => crypto.randomUUID());
    try {
      const outcome = await action({ ...input, operationKey: operation.current.key });
      setResult(outcome);
      if (outcome.success) {
        operation.current = null;
        if (resetOnSuccess) form.current?.reset();
        window.dispatchEvent(new Event("tcc-atelier-updated"));
        if (createdHref && outcome.id) router.push(`${createdHref}/${encodeURIComponent(outcome.id)}`);
        else router.refresh();
      }
    } catch {
      setResult({ success: false, error: "We could not confirm the result. Refresh to check the history, or retry the same action." });
    } finally {
      inFlight.current = false;
      setBusy(false);
      setPendingValues(null);
    }
  };

  return <>
    <form ref={form} method="post" className="space-y-4" onSubmit={event => {
      event.preventDefault();
      if (!ready || inFlight.current || disabled) return;
      const input = { ...Object.fromEntries(new FormData(event.currentTarget)), ...values };
      if (confirmText) setPendingValues(input); else void run(input);
    }}>
      <fieldset disabled={!ready || busy || disabled} className="min-w-0 space-y-4">
        {children}
        <button type="submit" className={atelierButton}>{busy ? "Saving…" : label}</button>
      </fieldset>
      {result && <p role={result.success ? "status" : "alert"} className={`break-words text-sm leading-6 ${result.success ? "text-champagne" : "text-rose-400"}`}>
        {result.success ? "Saved. Your atelier workspace has been refreshed." : result.error}
      </p>}
    </form>
    {pendingValues && confirmText && <Confirmation text={[confirmText,
      pendingValues.scheduleDate ? `Date: ${pendingValues.scheduleDate}\nTime: ${pendingValues.scheduleTime} WAT\nDuration: ${pendingValues.durationMinutes} minutes` : "",
      pendingValues.proposedDate ? `Preferred: ${pendingValues.proposedDate} · ${pendingValues.proposedTime} WAT` : "",
    ].filter(Boolean).join("\n\n")} busy={busy} close={() => { if (!busy) setPendingValues(null); }} confirm={() => void run(pendingValues)} />}
  </>;
}
