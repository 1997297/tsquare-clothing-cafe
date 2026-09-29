"use client";

export default function CatalogueManagementError({ reset }: { reset: () => void }) {
  return (
    <div className="mx-auto max-w-3xl rounded-3xl border border-red-900/60 bg-red-950/20 p-8">
      <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-red-400">Catalogue unavailable</p>
      <h1 className="mt-3 font-display text-3xl">Collection records could not be loaded</h1>
      <p className="mt-4 text-sm leading-7 text-stone-400">No placeholder records are being shown. Retry after checking the catalogue database connection.</p>
      <button type="button" onClick={reset} className="mt-7 rounded-xl border border-stone-700 px-4 py-2.5 text-xs uppercase tracking-widest text-stone-200 hover:border-stone-500">Try again</button>
    </div>
  );
}
