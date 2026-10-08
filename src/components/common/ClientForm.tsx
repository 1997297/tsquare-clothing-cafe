"use client";

import { useEffect, useRef, useState, type ComponentPropsWithoutRef, type FormEvent } from "react";

type Props = Omit<ComponentPropsWithoutRef<"form">, "method" | "action" | "onSubmit"> & {
  onSubmit: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
};

/** JS-only forms must never fall back to putting private fields in a GET URL. */
export function ClientForm({ onSubmit, children, ...props }: Props) {
  const [ready, setReady] = useState(false);
  const submitting = useRef(false);
  useEffect(() => { setReady(true); }, []);

  return <>
    <form {...props} method="post" inert={!ready} onSubmit={async event => {
      event.preventDefault();
      if (!ready || submitting.current) return;
      submitting.current = true;
      try { await onSubmit(event); }
      finally { submitting.current = false; }
    }}>{children}</form>
    <noscript><p className="mt-3 text-sm text-stone-400">Enable JavaScript to use this secure form.</p></noscript>
  </>;
}
