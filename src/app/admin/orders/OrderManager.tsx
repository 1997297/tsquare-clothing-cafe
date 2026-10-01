"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, PackageCheck, Search } from "lucide-react";
import { OrderStatusBadge } from "@/components/atelier/WorkflowUI";
import type { AdminOrderRecord } from "@/lib/server/atelier-workflow";
import { ORDER_STATUS_LABELS, ORDER_WORKFLOW_STATUSES, type OrderWorkflowStatus } from "@/lib/atelier-workflow";
import { cn } from "@/lib/utils";

export function OrderManager({ orders }: { orders: AdminOrderRecord[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | OrderWorkflowStatus>("all");
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return orders.filter((order) => {
      if (filter !== "all" && order.status !== filter) return false;
      if (!needle) return true;
      const customer = order.customer ? `${order.customer.firstName} ${order.customer.lastName} ${order.customer.email}` : "";
      return `${order.orderReference} ${order.requestReference ?? ""} ${order.styleName} ${customer}`.toLowerCase().includes(needle);
    });
  }, [filter, orders, query]);

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-5 border-b border-stone-800/70 pb-7 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-champagne-dark">Atelier production</p>
          <h1 className="mt-3 font-display text-3xl sm:text-4xl">Production Orders</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-400">Orders are created only from approved request snapshots. Production stages here are visible to the owning client.</p>
        </div>
        <p className="text-xs text-stone-500">{visible.length} of {orders.length} orders</p>
      </header>
      <div className="space-y-4">
        <label className="flex max-w-xl items-center gap-3 rounded-2xl border border-stone-800 bg-stone-950/60 px-4 py-3"><Search className="h-4 w-4 text-stone-500" /><span className="sr-only">Search orders</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Order, request, client, email or Fit" className="w-full bg-transparent text-sm outline-none placeholder:text-stone-600" /></label>
        <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Order status filters">
          <button type="button" onClick={() => setFilter("all")} className={cn("shrink-0 rounded-xl border px-3.5 py-2 text-[10px] uppercase tracking-wider", filter === "all" ? "border-champagne/40 bg-champagne/10 text-champagne" : "border-stone-800 text-stone-500")}>All</button>
          {ORDER_WORKFLOW_STATUSES.map((status) => <button key={status} type="button" onClick={() => setFilter(status)} className={cn("shrink-0 rounded-xl border px-3.5 py-2 text-[10px] uppercase tracking-wider", filter === status ? "border-champagne/40 bg-champagne/10 text-champagne" : "border-stone-800 text-stone-500")}>{ORDER_STATUS_LABELS[status]}</button>)}
        </div>
      </div>
      {visible.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-stone-800 p-12 text-center"><PackageCheck className="mx-auto h-8 w-8 text-stone-600" /><h2 className="mt-4 font-display text-xl">No matching orders</h2><p className="mt-2 text-sm text-stone-500">An approved request must be deliberately converted before it appears here.</p></div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-stone-800 bg-stone-950/50"><div className="divide-y divide-stone-800/80">{visible.map((order) => (
          <article key={order.id} className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="min-w-0"><div className="flex flex-wrap items-center gap-3"><span className="font-mono text-xs font-semibold text-champagne">{order.orderReference}</span><OrderStatusBadge status={order.status} /></div><h2 className="mt-3 truncate font-display text-xl">{order.styleName}</h2><p className="mt-2 text-xs text-stone-400">{order.customer ? `${order.customer.firstName} ${order.customer.lastName} · ${order.customer.email}` : "Client profile unavailable"}</p><p className="mt-1 text-[10px] uppercase tracking-wider text-stone-600">{order.requestReference ? `Source ${order.requestReference} · ` : ""}{new Intl.DateTimeFormat("en-NG", { dateStyle: "medium" }).format(new Date(order.createdAt))}</p></div>
            <Link href={`/admin/orders/${order.id}`} className="inline-flex items-center justify-center gap-2 rounded-xl border border-stone-700 px-4 py-2.5 text-xs uppercase tracking-wider text-stone-200 hover:border-champagne/50 hover:text-champagne">Open order <ArrowRight className="h-4 w-4" /></Link>
          </article>
        ))}</div></div>
      )}
    </div>
  );
}
