"use client";

import { useEffect, useRef } from "react";
import { trapTabKey } from "@/lib/a11y";

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
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!open || !dialog) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialog.showModal();
    cancelRef.current?.focus();
    return () => {
      dialog.close();
      previousFocus?.focus();
    };
  }, [open]);

  if (!open) return null;

  return (
    <dialog ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title" tabIndex={-1} onKeyDown={(event) => trapTabKey(event.nativeEvent, dialogRef.current)} className="m-auto w-[calc(100%-2rem)] max-w-md rounded-3xl border border-stone-700 bg-stone-950 p-6 text-warm-ivory shadow-2xl backdrop:bg-black/75 backdrop:backdrop-blur-sm" onCancel={(event) => { event.preventDefault(); if (!busy) onCancel(); }} onClick={(event) => { if (event.target === event.currentTarget && !busy) onCancel(); }}>
      <div>
        <p className="text-[10px] font-mono uppercase tracking-[0.24em] text-amber-400">Please confirm</p>
        <h2 id="confirm-dialog-title" className="mt-3 font-display text-2xl text-warm-ivory">{title}</h2>
        <p className="mt-3 text-sm leading-6 text-stone-400">{description}</p>
        <div className="mt-7 flex justify-end gap-3">
          <button ref={cancelRef} type="button" disabled={busy} onClick={onCancel} className="rounded-xl border border-stone-700 px-4 py-2.5 text-xs uppercase tracking-wider text-stone-300 hover:border-stone-500 disabled:opacity-50">Cancel</button>
          <button type="button" disabled={busy} onClick={onConfirm} className="rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-stone-950 hover:bg-amber-400 disabled:opacity-50">{busy ? "Working…" : confirmLabel}</button>
        </div>
      </div>
    </dialog>
  );
}
