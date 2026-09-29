"use client";

import { useEffect, useRef } from "react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmDialog({ open, title, description, confirmLabel, busy = false, onCancel, onConfirm }: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) cancelRef.current?.focus();
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" role="presentation" onMouseDown={onCancel}>
      <div role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title" className="w-full max-w-md rounded-3xl border border-stone-700 bg-stone-950 p-6 shadow-2xl" onMouseDown={(event) => event.stopPropagation()} onKeyDown={(event) => { if (event.key === "Escape" && !busy) onCancel(); }}>
        <p className="text-[10px] font-mono uppercase tracking-[0.24em] text-amber-400">Please confirm</p>
        <h2 id="confirm-dialog-title" className="mt-3 font-display text-2xl text-warm-ivory">{title}</h2>
        <p className="mt-3 text-sm leading-6 text-stone-400">{description}</p>
        <div className="mt-7 flex justify-end gap-3">
          <button ref={cancelRef} type="button" disabled={busy} onClick={onCancel} className="rounded-xl border border-stone-700 px-4 py-2.5 text-xs uppercase tracking-wider text-stone-300 hover:border-stone-500 disabled:opacity-50">Cancel</button>
          <button type="button" disabled={busy} onClick={onConfirm} className="rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-stone-950 hover:bg-amber-400 disabled:opacity-50">{busy ? "Working…" : confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
