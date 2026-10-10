"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { CreditCard, Loader2 } from "lucide-react";

export function RequestPaymentLink() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return <button type="button" disabled={pending} onClick={() => startTransition(() => router.push("/admin/orders"))}
    className="inline-flex w-fit items-center justify-center rounded-xl bg-champagne px-4 py-3 text-xs font-semibold text-near-black transition-colors hover:bg-champagne-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-champagne disabled:cursor-wait disabled:opacity-50">
    <span className="inline-flex items-center gap-2" aria-live="polite">
    {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
    {pending ? "Opening orders…" : "Request Payment"}
    </span>
  </button>;
}
