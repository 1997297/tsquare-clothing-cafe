"use client";

export default function AdminRequestsError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div className="rounded-3xl border border-red-900/50 bg-red-950/20 p-8 text-center"><p className="text-[10px] font-mono uppercase tracking-[0.24em] text-red-400">Requests unavailable</p><h1 className="mt-3 font-display text-2xl">The commission queue could not be loaded.</h1><p className="mt-3 text-sm text-stone-400">No request data was changed. Try the secure query again.</p><button type="button" onClick={reset} className="mt-6 rounded-xl border border-stone-700 px-5 py-2.5 text-xs uppercase tracking-wider text-stone-200 hover:border-champagne">Try again</button></div>;
}
