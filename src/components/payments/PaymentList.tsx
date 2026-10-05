"use client";

import { useState } from "react";
import Link from "next/link";
import type { PaymentWorkspace } from "@/lib/payments/manual";
import { requestPosition } from "@/lib/payments/manual";
import { RequestCard, inputClass, panelClass } from "./PaymentUI";

export function PaymentList({ workspace, staff, orderOnly = false }: { workspace: PaymentWorkspace; staff: boolean; orderOnly?: boolean }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const query = search.trim().toLowerCase();
  const requests = workspace.requests.filter(r => {
    const submissions = workspace.submissions.filter(s => s.request_id === r.id);
    const position = requestPosition(r, workspace.payments, submissions);
    if (status === "pending" && !submissions.some(s => s.status === "awaiting_verification")) return false;
    if (status === "verified" && position.verified === 0) return false;
    if (status === "rejected" && !submissions.some(s => s.status === "rejected")) return false;
    if (status === "active" && (r.status !== "active" || position.remaining === 0)) return false;
    if (status === "cancelled" && r.status !== "cancelled") return false;
    const order = workspace.orders.find(o => o.id === r.order_id);
    const client = workspace.customers.find(c => c.id === r.customer_id);
    return `${r.request_reference} ${order?.order_reference ?? ""} ${client?.first_name ?? ""} ${client?.last_name ?? ""} ${client?.email ?? ""}`.toLowerCase().includes(query);
  }).sort((a, b) => b.created_at.localeCompare(a.created_at));
  return <section className={panelClass}><div className="flex flex-wrap items-center justify-between gap-4"><h2 className="font-display text-xl">Payment requests</h2>{staff && !orderOnly && <Link href="/admin/orders" className="text-xs text-champagne underline">Request payment from an order</Link>}</div><div className="my-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px]"><label className="text-xs text-stone-400">Search<input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder={staff ? "Payment reference, order or client" : "Payment or order reference"} className={inputClass} /></label><label className="text-xs text-stone-400">Status<select value={status} onChange={e => setStatus(e.target.value)} className={inputClass}><option value="all">All requests</option><option value="active">Active / outstanding</option><option value="pending">Awaiting verification</option><option value="verified">With verified funds</option><option value="rejected">With rejected evidence</option><option value="cancelled">Cancelled</option></select></label></div>{requests.length ? <div className="grid gap-4 lg:grid-cols-2">{requests.map(r => <RequestCard key={r.id} request={r} workspace={workspace} staff={staff} />)}</div> : <p className="py-5 text-sm text-stone-400">{workspace.requests.length ? "No requests match your search." : "No payment requests yet. An agreed price alone does not request a transfer."}</p>}</section>;
}
