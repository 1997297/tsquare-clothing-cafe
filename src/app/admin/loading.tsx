export default function AdminLoading() {
  return <div role="status" aria-live="polite" className="space-y-5"><p className="text-sm text-stone-400">Loading atelier workspace…</p><div aria-hidden="true" className="grid gap-5 sm:grid-cols-2">{[1, 2, 3, 4].map(key => <div key={key} className="h-36 animate-pulse rounded-3xl border border-stone-800 bg-stone-900/50" />)}</div></div>;
}
