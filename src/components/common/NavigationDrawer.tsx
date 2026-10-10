"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { trapTabKey } from "@/lib/a11y";

export function NavigationDrawer({ open, onClose, id, title, children }: {
  open: boolean; onClose: () => void; id: string; title: string; children: ReactNode;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!open || !dialog) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.showModal();
    closeRef.current?.focus();
    const desktop = window.matchMedia("(min-width: 1024px)");
    const resized = () => { if (desktop.matches) onCloseRef.current(); };
    desktop.addEventListener("change", resized);
    resized();
    return () => {
      desktop.removeEventListener("change", resized);
      dialog.close();
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, [open]);

  return <dialog ref={dialogRef} id={id} aria-labelledby={`${id}-title`} aria-modal="true"
    onCancel={event => { event.preventDefault(); onClose(); }}
    onKeyDown={event => trapTabKey(event.nativeEvent, dialogRef.current)}
    onClick={event => { if (event.target === event.currentTarget) onClose(); }}
    className="fixed inset-y-0 left-0 m-0 h-dvh max-h-none w-[min(22rem,90vw)] max-w-none border-r border-stone-800 bg-near-black p-0 text-warm-ivory backdrop:bg-black/65">
    <div className="flex h-full min-h-0 flex-col pt-[env(safe-area-inset-top)]">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-stone-800 px-4 py-4">
        <h2 id={`${id}-title`} className="font-display text-xl">{title}</h2>
        <button ref={closeRef} type="button" onClick={onClose} aria-label={`Close ${title.toLowerCase()}`} className="rounded-xl border border-stone-700 p-2.5 hover:border-champagne focus-visible:outline focus-visible:outline-2 focus-visible:outline-champagne"><X className="h-5 w-5" /></button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
        onClick={event => { if (event.target instanceof Element && event.target.closest('a[href]')) onClose(); }}>
        {children}
      </div>
    </div>
  </dialog>;
}
