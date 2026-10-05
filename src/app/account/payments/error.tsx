"use client";

export default function PaymentError({ reset }: { reset: () => void }) {
  return <section className="rounded-3xl border border-stone-800 p-7"><h2 className="font-display text-xl">Payments temporarily unavailable</h2><p className="my-4 text-sm text-stone-400">We could not load your payment records. No financial action has been taken. Please retry or contact TCC.</p><button onClick={reset} className="text-sm text-champagne underline">Try again</button></section>;
}
