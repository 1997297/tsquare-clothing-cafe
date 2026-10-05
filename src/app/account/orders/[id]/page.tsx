"use client";

import { use } from "react";
import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { useAccountData } from "@/lib/account-store";
import { cn, formatOfficeLocation } from "@/lib/utils";
import { ReturnLink } from "@/components/common/ReturnLink";
import { WorkflowTimeline } from "@/components/atelier/WorkflowUI";
import { ClientOrderFinance } from "@/components/payments/ClientOrderFinance";

const STAGES = [
  ["order_confirmed", "Order Confirmed"],
  ["measurements_confirmed", "Measurements Confirmed"],
  ["in_production", "In Production"],
  ["finishing", "Finishing & Inspection"],
  ["ready", "Ready"],
  ["completed", "Delivered & Archived"],
] as const;

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { orders, appointments, wardrobe } = useAccountData();
  const order = orders.find((item) => item.id === id);

  if (!order) {
    return (
      <div className="py-16 text-center space-y-4">
        <AlertCircle className="w-8 h-8 text-stone-600 mx-auto" />
        <h1 className="font-display text-2xl text-warm-ivory">Order Record Not Located</h1>
        <p className="text-xs text-stone-400">This order is not present in your private account.</p>
        <ReturnLink href="/account/orders" label="Return to Orders" />
      </div>
    );
  }

  const currentStage = STAGES.findIndex(([stage]) => stage === order.status);
  const relatedAppointments = appointments.filter((appointment) => appointment.orderId === order.id);
  const wardrobeItem = wardrobe.find((item) => item.orderId === order.id);
  const measurementValues = (order.measurementsSnapshot.values ?? order.measurementsSnapshot) as Record<string, unknown>;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <ReturnLink href="/account/orders" label="Back to All Orders" className="mb-4" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800/60 pb-6">
          <div>
            <p className="text-xs font-mono font-bold text-champagne tracking-wider">{order.orderReference}</p>
            <h1 className="font-display text-2xl sm:text-3xl text-warm-ivory">{order.styleName}</h1>
          </div>
          <Link href="/account/concierge" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-stone-700 text-xs uppercase tracking-wider text-stone-300">
            <MessageSquare className="w-3.5 h-3.5" /> Discuss With Concierge
          </Link>
        </div>
      </div>

      {order.status === "completed" && (
        <section className="p-6 rounded-3xl bg-stone-950 border border-champagne/40 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div>
            <h2 className="flex items-center gap-2 text-champagne font-display text-xl"><Sparkles className="w-5 h-5" /> Made for you. Finished by TSquare.</h2>
            <p className="text-xs text-stone-300 mt-2">The wardrobe record is created only by the trusted completion workflow.</p>
          </div>
          {wardrobeItem ? (
            <Link href={`/account/wardrobe/${wardrobeItem.id}`} className="px-5 py-2.5 rounded-xl bg-champagne text-near-black text-xs uppercase tracking-wider font-bold">View In My Wardrobe</Link>
          ) : (
            <span className="px-5 py-2.5 rounded-xl border border-stone-700 text-stone-400 text-xs uppercase tracking-wider">Wardrobe archive processing</span>
          )}
        </section>
      )}

      <section className="p-6 sm:p-8 rounded-3xl bg-stone-950 fine-border space-y-6">
        <div>
          <p className="text-[10px] uppercase font-mono tracking-[0.28em] text-champagne">Atelier Milestones</p>
          <h2 className="font-display text-xl text-warm-ivory">Craftsmanship Progression</h2>
        </div>
        <ol className="grid grid-cols-1 sm:grid-cols-6 gap-4" aria-label="Order progress">
          {STAGES.map(([stage, label], index) => {
            const complete = index < currentStage;
            const active = index === currentStage;
            return (
              <li key={stage} className="flex sm:flex-col items-center gap-3 sm:text-center">
                <span className={cn("w-8 h-8 rounded-full grid place-items-center text-xs font-mono shrink-0", complete && "bg-champagne text-near-black", active && "border-2 border-champagne text-champagne", !complete && !active && "border border-stone-700 text-stone-500")}>
                  {complete ? <CheckCircle2 className="w-4 h-4" /> : index + 1}
                </span>
                <span className={cn("text-[10px] uppercase tracking-wider", active ? "text-champagne" : "text-stone-400")}>{label}</span>
              </li>
            );
          })}
        </ol>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <section className="p-6 rounded-3xl bg-stone-950 fine-border space-y-5">
            <h2 className="text-xs font-mono uppercase tracking-[0.25em] text-champagne">Bespoke Specifications</h2>
            <div className="grid sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-stone-900/60 border border-stone-800"><span className="text-stone-500 block">Fabric</span><span className="text-warm-ivory">{order.fabricDetails?.name ?? "Awaiting atelier record"}</span></div>
              <div className="p-4 rounded-2xl bg-stone-900/60 border border-stone-800"><span className="text-stone-500 block">Colour</span><span className="text-warm-ivory">{order.colourDetails?.name ?? "Awaiting atelier record"}</span></div>
            </div>
          </section>

          <section className="p-6 rounded-3xl bg-stone-950 fine-border space-y-4">
            <h2 className="text-xs font-mono uppercase tracking-[0.25em] text-champagne">Measurements Snapshot Locked to This Order</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Object.entries(measurementValues).map(([key, value]) => (
                <div key={key} className="p-3 rounded-xl bg-stone-900/60 border border-stone-800 text-center">
                  <span className="text-[9px] uppercase text-stone-500 block">{key.replace(/([A-Z])/g, " $1")}</span>
                  <span className="text-xs font-mono text-warm-ivory">{String(value)} {String(order.measurementsSnapshot.unit ?? "cm")}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="p-6 rounded-3xl bg-stone-950 fine-border space-y-4 text-xs">
            <h2 className="uppercase tracking-[0.25em] text-champagne font-mono">Fitting Checkpoints</h2>
            {relatedAppointments.length === 0 && <p className="text-stone-500">No appointments are linked to this order.</p>}
            {relatedAppointments.map((appointment) => (
              <div key={appointment.id} className="p-3 rounded-xl bg-stone-900/50 border border-stone-800">
                <p className="text-warm-ivory capitalize">{appointment.type.replace(/-/g, " ")}</p>
                <p className="text-stone-400">{appointment.confirmedDate ?? appointment.preferredDate} · {appointment.confirmedTime ?? appointment.preferredTime}</p>
                <p className="text-stone-500">{formatOfficeLocation(appointment.location)}</p>
              </div>
            ))}
          </section>
        </div>
      </div>
      <ClientOrderFinance orderId={order.id} />
      <WorkflowTimeline events={order.timeline ?? []} />
    </div>
  );
}
