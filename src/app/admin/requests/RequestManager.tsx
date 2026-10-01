"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, ClipboardList, Search } from "lucide-react";
import { RequestStatusBadge } from "@/components/atelier/WorkflowUI";
import type { AdminRequestRecord } from "@/lib/server/atelier-workflow";
import { REQUEST_STATUS_LABELS, type RequestWorkflowStatus } from "@/lib/atelier-workflow";
import { cn } from "@/lib/utils";

const FILTERS: Array<{ value: "all" | RequestWorkflowStatus; label: string }> = [
  { value: "all", label: "All" },
  { value: "submitted", label: "Pending" },
  { value: "under_review", label: "In review" },
  { value: "needs_clarification", label: "Changes" },
  { value: "confirmed", label: "Approved" },
  { value: "declined", label: "Declined" },
  { value: "converted_to_order", label: "Converted" },
];

export function RequestManager({ requests }: { requests: AdminRequestRecord[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["value"]>("all");
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return requests.filter((request) => {
      if (filter !== "all" && request.status !== filter) return false;
      if (!needle) return true;
      const customer = request.customer
        ? `${request.customer.firstName} ${request.customer.lastName} ${request.customer.email}`
        : "";
      return `${request.requestReference} ${request.styleName ?? ""} ${customer}`.toLowerCase().includes(needle);
    });
  }, [filter, query, requests]);

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-5 border-b border-stone-800/70 pb-7 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-champagne-dark">Commission intake</p>
          <h1 className="mt-3 font-display text-3xl sm:text-4xl">Client Requests</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-400">Review real Make This Mine submissions, request precise changes, record decisions, and create orders only after approval.</p>
        </div>
        <p className="text-xs text-stone-500">{visible.length} of {requests.length} requests</p>
      </header>

      <div className="grid gap-4 xl:grid-cols-[minmax(260px,0.7fr)_1.3fr]">
        <label className="flex items-center gap-3 rounded-2xl border border-stone-800 bg-stone-950/60 px-4 py-3">
          <Search className="h-4 w-4 text-stone-500" />
          <span className="sr-only">Search requests</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Reference, client, email or Fit" className="w-full bg-transparent text-sm text-warm-ivory outline-none placeholder:text-stone-600" />
        </label>
        <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Request status filters">
          {FILTERS.map((item) => (
            <button key={item.value} type="button" onClick={() => setFilter(item.value)} className={cn("shrink-0 rounded-xl border px-3.5 py-2 text-[10px] uppercase tracking-wider", filter === item.value ? "border-champagne/40 bg-champagne/10 text-champagne" : "border-stone-800 text-stone-500 hover:text-stone-300")}>{item.label}</button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-stone-800 p-12 text-center">
          <ClipboardList className="mx-auto h-8 w-8 text-stone-600" />
          <h2 className="mt-4 font-display text-xl">No matching requests</h2>
          <p className="mt-2 text-sm text-stone-500">New client submissions will appear here automatically.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-stone-800 bg-stone-950/50">
          <div className="divide-y divide-stone-800/80">
            {visible.map((request) => (
              <article key={request.id} className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[1fr_auto] lg:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-mono text-xs font-semibold text-champagne">{request.requestReference}</span>
                    <RequestStatusBadge status={request.status} />
                  </div>
                  <h2 className="mt-3 truncate font-display text-xl">{request.styleName ?? "Original bespoke idea"}</h2>
                  <p className="mt-2 text-xs text-stone-400">
                    {request.customer ? `${request.customer.firstName} ${request.customer.lastName} · ${request.customer.email}` : "Client profile unavailable"}
                  </p>
                  <p className="mt-1 text-[10px] uppercase tracking-wider text-stone-600">
                    {REQUEST_STATUS_LABELS[request.status]} · Submitted {new Intl.DateTimeFormat("en-NG", { dateStyle: "medium" }).format(new Date(request.submittedAt ?? request.createdAt))}
                  </p>
                </div>
                <Link href={`/admin/requests/${request.id}`} className="inline-flex items-center justify-center gap-2 rounded-xl border border-stone-700 px-4 py-2.5 text-xs uppercase tracking-wider text-stone-200 hover:border-champagne/50 hover:text-champagne">
                  Review <ArrowRight className="h-4 w-4" />
                </Link>
              </article>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
