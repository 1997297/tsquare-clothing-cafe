"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { AtelierCounts } from "@/lib/atelier-service";

export function ClientAtelierSummary() {
  const [counts, setCounts] = useState<AtelierCounts | null>(null);
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let controller: AbortController | null = null;
    const refresh = async () => {
      controller?.abort();
      const current = new AbortController(); controller = current;
      try {
        const response = await fetch("/api/atelier/counts", { cache: "no-store", signal: current.signal });
        if (!response.ok) throw new Error("Unavailable");
        const data: AtelierCounts = await response.json();
        if (!current.signal.aborted) { setCounts(data); setFailed(false); }
      } catch { if (!current.signal.aborted) setFailed(true); }
    };
    void refresh();
    window.addEventListener("tcc-atelier-counts-updated", refresh);
    window.addEventListener("tcc-atelier-updated", refresh);
    return () => { controller?.abort(); window.removeEventListener("tcc-atelier-counts-updated", refresh); window.removeEventListener("tcc-atelier-updated", refresh); };
  }, [retry]);
  return <div className="flex flex-wrap gap-x-6 gap-y-3 text-xs leading-5 text-stone-400">
    <Link href="/account/concierge" className="text-champagne">Concierge{counts && !failed ? ` · ${counts.unread_concierge_messages} unread TCC ${counts.unread_concierge_messages === 1 ? "reply" : "replies"}` : ""} →</Link>
    {counts && !failed && counts.pending_appointments > 0 && <Link href="/account/appointments">{counts.pending_appointments} appointment {counts.pending_appointments === 1 ? "request" : "requests"} awaiting review →</Link>}
    {failed && <button onClick={() => setRetry(value => value + 1)} className="text-stone-500 underline">Service counts unavailable · retry</button>}
  </div>;
}
