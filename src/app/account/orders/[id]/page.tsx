"use client";

import { use } from "react";
import Link from "next/link";
import { useAccountData } from "@/lib/account-store";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Package,
  Scissors,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";

const CRAFTSMANSHIP_STAGES = [
  {
    id: "order_confirmed",
    label: "Order Confirmed",
    desc: "Bespoke commission agreement signed; materials and raw fabrics reserved.",
  },
  {
    id: "measurements_confirmed",
    label: "Measurements Confirmed",
    desc: "Master cutter completes individual paper pattern drafted to 28 anatomical points.",
  },
  {
    id: "in_production",
    label: "In Production",
    desc: "Floating horsehair canvas basted; hand-guided embroidery and assembly underway.",
  },
  {
    id: "finishing",
    label: "Finishing & Inspection",
    desc: "Hand-rolled lapels, buttonholes, lining insertion, and artisanal pressing.",
  },
  {
    id: "ready",
    label: "Ready for Fitting / Collection",
    desc: "Garment prepared for final fitting appointment at Abeokuta atelier.",
  },
  {
    id: "completed",
    label: "Delivered & Archived",
    desc: "Garment collected; permanent pattern archived in your private client digital vault.",
  },
];

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { orders, appointments } = useAccountData();

  const order = orders.find((o) => o.id === id);

  if (!order) {
    return (
      <div className="py-16 text-center space-y-4">
        <AlertCircle className="w-8 h-8 text-stone-600 mx-auto" />
        <h2 className="font-display text-2xl text-warm-ivory">Order Record Not Located</h2>
        <p className="text-xs text-stone-400">
          The requested bespoke order could not be located in your private client archives.
        </p>
        <Link
          href="/account/orders"
          className="inline-flex items-center gap-2 text-xs text-champagne uppercase font-mono tracking-widest"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Return to Orders
        </Link>
      </div>
    );
  }

  const currentStageIndex = CRAFTSMANSHIP_STAGES.findIndex(
    (s) => s.id === order.status
  );

  const relatedAppointments = appointments.filter(
    (a) => a.orderId === order.id
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <Link
          href="/account/orders"
          className="inline-flex items-center gap-2 text-xs text-stone-400 hover:text-champagne transition-colors uppercase font-mono tracking-wider mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Orders</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800/60 pb-6">
          <div>
            <div className="flex items-center gap-3 mb-1.5">
              <span className="text-xs font-mono font-bold text-champagne tracking-wider">
                {order.orderReference}
              </span>
              <span className="text-stone-600">•</span>
              <span className="text-xs text-stone-400 font-mono">
                {order.styleCode}
              </span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl text-warm-ivory">
              {order.styleName}
            </h1>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-[10px] uppercase font-mono tracking-widest text-stone-500 block">
              Target Completion
            </span>
            <span className="text-sm font-mono text-champagne font-semibold">
              {order.targetCompletionDate || "Under Atelier Review"}
            </span>
          </div>
        </div>
      </div>

      {/* ── Craftsmanship Milestones Timeline ── */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#141412] fine-border space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-mono uppercase tracking-[0.25em] text-champagne font-semibold">
            Craftsmanship Progress Milestones
          </h3>
          <span className="text-xs text-stone-400 font-mono capitalize">
            Current: {order.status.replace(/_/g, " ")}
          </span>
        </div>

        <div className="space-y-6">
          {CRAFTSMANSHIP_STAGES.map((stage, idx) => {
            const isPassed = idx <= currentStageIndex;
            const isCurrent = idx === currentStageIndex;

            return (
              <div key={stage.id} className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-mono font-bold border transition-colors",
                      isCurrent
                        ? "bg-champagne border-champagne text-near-black ring-4 ring-champagne/20"
                        : isPassed
                        ? "bg-stone-800 border-stone-600 text-champagne"
                        : "border-stone-800 text-stone-700 bg-transparent"
                    )}
                  >
                    {isPassed ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
                  </div>
                  {idx < CRAFTSMANSHIP_STAGES.length - 1 && (
                    <div
                      className={cn(
                        "w-0.5 h-10 my-1 transition-colors",
                        idx < currentStageIndex ? "bg-champagne/60" : "bg-stone-800"
                      )}
                    />
                  )}
                </div>

                <div className="pt-0.5">
                  <h4
                    className={cn(
                      "text-xs font-semibold uppercase tracking-wider font-mono",
                      isCurrent ? "text-champagne font-bold" : isPassed ? "text-warm-ivory" : "text-stone-600"
                    )}
                  >
                    {stage.label}
                  </h4>
                  <p className="text-[11px] text-stone-400 mt-0.5 leading-relaxed font-light">
                    {stage.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Grid: Garment Specs and Linked Appointments */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Specifications */}
        <div className="md:col-span-2 space-y-6">
          <div className="p-6 rounded-3xl bg-[#141412] fine-border space-y-4">
            <h3 className="text-xs font-mono uppercase tracking-[0.25em] text-champagne font-semibold">
              Garment Specifications
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-stone-900/60 border border-stone-800">
                <span className="text-[10px] uppercase font-mono text-stone-500 block mb-1">
                  Fabric & Construction
                </span>
                <p className="font-medium text-warm-ivory">
                  {order.fabricDetails?.name || "Pure Wool Blend"}
                </p>
                <p className="text-[11px] text-stone-400 mt-1">
                  Full floating natural horsehair canvas
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-stone-900/60 border border-stone-800">
                <span className="text-[10px] uppercase font-mono text-stone-500 block mb-1">
                  Colour & Palette
                </span>
                <p className="font-medium text-warm-ivory">
                  {order.colourDetails?.name || "Midnight Black"}
                </p>
                <p className="text-[11px] text-stone-400 mt-1">
                  Artisanal threadwork
                </p>
              </div>
            </div>

            {order.specialInstructions && (
              <div className="pt-2">
                <span className="text-[10px] uppercase font-mono text-stone-500 block mb-1">
                  Atelier Instruction Note
                </span>
                <p className="text-xs text-stone-300 italic bg-stone-900/40 p-3 rounded-xl border border-stone-800">
                  &quot;{order.specialInstructions}&quot;
                </p>
              </div>
            )}
          </div>

          {/* Measurements Snapshot */}
          <div className="p-6 rounded-3xl bg-[#141412] fine-border space-y-4">
            <h3 className="text-xs font-mono uppercase tracking-[0.25em] text-champagne font-semibold">
              Measurements Snapshot Locked to This Order
            </h3>
            <p className="text-[11px] text-stone-400 font-light">
              This snapshot preserves the physiological dimensions used to construct this specific garment pattern.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              {Object.entries(order.measurementsSnapshot || {}).map(([k, v]) => (
                <div key={k} className="p-2.5 rounded-xl bg-stone-900/60 border border-stone-800 text-center">
                  <span className="text-[9px] uppercase font-mono text-stone-500 block capitalize">
                    {k.replace(/([A-Z])/g, " $1")}
                  </span>
                  <span className="text-xs font-mono font-bold text-warm-ivory">
                    {v} cm
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Appointments & Billing Status */}
        <div className="space-y-6">
          {/* Linked Appointments */}
          <div className="p-6 rounded-3xl bg-[#141412] fine-border space-y-4 text-xs">
            <h3 className="text-xs font-mono uppercase tracking-[0.25em] text-champagne font-semibold">
              Fitting Checkpoints
            </h3>
            {relatedAppointments.length > 0 ? (
              <div className="space-y-3">
                {relatedAppointments.map((apt) => (
                  <div key={apt.id} className="p-3.5 rounded-2xl bg-stone-900/50 border border-stone-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-warm-ivory uppercase tracking-wider">
                        {apt.type.replace(/-/g, " ")}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-champagne/15 text-champagne text-[9px] font-mono capitalize">
                        {apt.status}
                      </span>
                    </div>
                    <p className="text-stone-400 font-mono text-[11px]">
                      {apt.confirmedDate || apt.preferredDate} at {apt.confirmedTime || apt.preferredTime}
                    </p>
                    <p className="text-[10px] text-stone-500">{apt.location}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 space-y-2">
                <p className="text-[11px] text-stone-400">
                  No appointments currently linked. Our concierge will schedule your fitting as construction proceeds.
                </p>
                <Link
                  href="/account/appointments"
                  className="inline-flex items-center gap-1.5 text-xs text-champagne uppercase font-mono tracking-wider font-semibold"
                >
                  <span>Request Atelier Visit</span>
                </Link>
              </div>
            )}
          </div>

          {/* Pricing & Billing Area Placeholder (Phase 4 Foundation) */}
          <div className="p-6 rounded-3xl bg-[#141412] fine-border space-y-4 text-xs">
            <h3 className="text-xs font-mono uppercase tracking-[0.25em] text-champagne font-semibold">
              Commission Account
            </h3>
            <div className="p-4 rounded-2xl bg-stone-900/40 border border-stone-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-stone-400">Commission Fee</span>
                <span className="font-mono text-warm-ivory font-bold">
                  {order.totalAmount ? `₦${order.totalAmount.toLocaleString()}` : "Atelier Quote"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-400">Settlement Status</span>
                <span className="text-emerald-400 font-mono text-[10px] uppercase">
                  Verified with Atelier
                </span>
              </div>
            </div>
            <p className="text-[10px] text-stone-500 italic">
              Digital payment tracking, invoice history, and balance settlements will integrate in Phase 4.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
