"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { attentionBadge, attentionLabel, type StaffAttentionCounts } from "@/lib/staff-attention";

export function OverviewActions({ counts }: { counts: StaffAttentionCounts }) {
  const router = useRouter();
  useEffect(() => {
    // Refresh when returning to this tab or a restored page, not on a timer.
    const visible = () => { if (document.visibilityState === "visible") router.refresh(); };
    const restored = (event: PageTransitionEvent) => { if (event.persisted) router.refresh(); };
    document.addEventListener("visibilitychange", visible);
    window.addEventListener("pageshow", restored);
    return () => { document.removeEventListener("visibilitychange", visible); window.removeEventListener("pageshow", restored); };
  }, [router]);
  const actions = [
    { label: "Add Fit", href: "/admin/collections/new" },
    { label: "Review requests", href: "/admin/requests?status=attention", count: counts.requests, detail: "Submitted, under review, or approved awaiting order conversion" },
    { label: "View orders", href: "/admin/orders?status=attention", count: counts.orders, detail: "Confirm measurements or complete handover of a ready order" },
    { label: "Verify payments", href: "/admin/payments?status=pending", count: counts.payments, detail: "Submitted receipts awaiting verification" },
    { label: "Appointments", href: "/admin/appointments", count: counts.appointments, detail: "Requested visits or changes awaiting review; use Requested and Changes awaiting review filters" },
    { label: "Concierge", href: "/admin/concierge?unread=1", count: counts.concierge, detail: "Conversations with client messages unread by TCC" },
    { label: "Find client", href: "/admin/clients" },
  ];
  return <div className="space-y-3">
    <nav aria-label="Quick actions" className="flex flex-wrap gap-3">
      {actions.map(({ label, href, count, detail }) => {
        const badge = count === undefined ? null : attentionBadge(count);
        return <Link key={href} href={href} prefetch={false} title={detail}
          aria-label={count === undefined ? label : attentionLabel(label, count)}
          className={`relative rounded-xl border border-stone-700 py-3 pl-4 text-xs text-champagne hover:border-champagne focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-champagne ${badge ? "pr-12" : "pr-4"}`}>
          <span>{label}</span>
          {badge && <span aria-hidden="true" className="staff-attention-badge absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold tabular-nums">{badge}</span>}
          {count === null && <span className="mt-1 block text-[10px] text-stone-400">Count unavailable</span>}
        </Link>;
      })}
    </nav>
    <button type="button" onClick={() => router.refresh()} className="text-xs text-champagne underline underline-offset-4 focus-visible:outline-champagne">Refresh counts</button>
  </div>;
}
