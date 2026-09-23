"use client";

import { useState } from "react";
import Link from "next/link";
import { useAccountData } from "@/lib/account-store";
import { Package, ArrowRight, Clock, Scissors, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const CRAFTSMANSHIP_STAGES = [
  { id: "order_confirmed", label: "Confirmed" },
  { id: "measurements_confirmed", label: "Measurements" },
  { id: "in_production", label: "In Production" },
  { id: "finishing", label: "Finishing" },
  { id: "ready", label: "Ready" },
  { id: "completed", label: "Delivered" },
];

export default function AccountOrdersPage() {
  const { orders } = useAccountData();
  const [tab, setTab] = useState<"active" | "completed">("active");

  const activeOrders = orders.filter((o) => o.status !== "completed");
  const completedOrders = orders.filter((o) => o.status === "completed");
  const displayedOrders = tab === "active" ? activeOrders : completedOrders;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800/60 pb-6">
        <div>
          <span className="text-[10px] uppercase font-mono tracking-[0.3em] text-champagne font-semibold block mb-1">
            Production & Commissions
          </span>
          <h1 className="font-display text-2xl sm:text-3xl text-warm-ivory">
            Active Orders & Progress
          </h1>
          <p className="text-xs text-stone-400 mt-1 font-light">
            Monitor the craftsmanship progress of your confirmed bespoke garments at TCC.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-2 border border-stone-800 p-1 rounded-xl bg-stone-900/60 self-start sm:self-auto">
          <button
            onClick={() => setTab("active")}
            className={cn(
              "px-4 py-1.5 rounded-lg text-xs uppercase font-mono tracking-wider font-semibold transition-colors",
              tab === "active"
                ? "bg-champagne text-near-black shadow-sm"
                : "text-stone-400 hover:text-warm-ivory"
            )}
          >
            Active ({activeOrders.length})
          </button>
          <button
            onClick={() => setTab("completed")}
            className={cn(
              "px-4 py-1.5 rounded-lg text-xs uppercase font-mono tracking-wider font-semibold transition-colors",
              tab === "completed"
                ? "bg-champagne text-near-black shadow-sm"
                : "text-stone-400 hover:text-warm-ivory"
            )}
          >
            Delivered ({completedOrders.length})
          </button>
        </div>
      </div>

      {/* Orders List */}
      {displayedOrders.length > 0 ? (
        <div className="space-y-6">
          {displayedOrders.map((order) => {
            const currentStageIndex = CRAFTSMANSHIP_STAGES.findIndex(
              (s) => s.id === order.status
            );

            return (
              <div
                key={order.id}
                className="p-6 sm:p-8 rounded-3xl bg-[#141412] fine-border space-y-6 hover:border-stone-700/80 transition-colors"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-stone-800/60">
                  <div>
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <span className="text-xs font-mono font-bold text-champagne tracking-wider">
                        {order.orderReference}
                      </span>
                      <span className="text-stone-600">•</span>
                      <span className="text-xs text-stone-400 font-mono">
                        {order.styleCode}
                      </span>
                    </div>
                    <h2 className="font-display text-xl text-warm-ivory">
                      {order.styleName}
                    </h2>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="text-[10px] uppercase font-mono tracking-widest text-stone-500 block">
                      Target Completion
                    </span>
                    <span className="text-xs font-mono text-champagne font-semibold">
                      {order.targetCompletionDate || "Atelier Verification"}
                    </span>
                  </div>
                </div>

                {/* Editorial Progress Bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[10px] uppercase font-mono tracking-widest text-stone-400">
                      Craftsmanship Milestone
                    </span>
                    <span className="text-xs font-mono font-semibold text-champagne capitalize">
                      {order.status.replace(/_/g, " ")}
                    </span>
                  </div>

                  <div className="grid grid-cols-6 gap-2 pt-1">
                    {CRAFTSMANSHIP_STAGES.map((stage, idx) => {
                      const isPassed = idx <= currentStageIndex;
                      const isCurrent = idx === currentStageIndex;

                      return (
                        <div key={stage.id} className="space-y-1.5">
                          <div
                            className={cn(
                              "h-1.5 rounded-full transition-all duration-300",
                              isPassed ? "bg-champagne" : "bg-stone-800"
                            )}
                          />
                          <p
                            className={cn(
                              "text-[9px] uppercase tracking-wider hidden sm:block truncate",
                              isCurrent
                                ? "text-champagne font-bold"
                                : isPassed
                                ? "text-stone-300"
                                : "text-stone-600"
                            )}
                          >
                            {stage.label}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Footer specs & CTA */}
                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-stone-800/40">
                  <p className="text-xs text-stone-400">
                    Fabric: <span className="text-stone-300">{order.fabricDetails?.name || "Pure Wool & Silk"}</span> • Palette:{" "}
                    <span className="text-stone-300">{order.colourDetails?.name || "Midnight Black"}</span>
                  </p>

                  <Link
                    href={`/account/orders/${order.id}`}
                    className="inline-flex items-center gap-2 text-xs uppercase font-mono tracking-wider font-semibold text-champagne hover:text-champagne-light shrink-0"
                  >
                    <span>Inspect Order Spec & Schedule</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 bg-[#141412] fine-border rounded-3xl text-center space-y-4">
          <Package className="w-8 h-8 text-stone-600 mx-auto" />
          <h3 className="font-display text-xl text-warm-ivory">
            {tab === "active" ? "No Active Orders Under Tailoring" : "No Completed Garments Yet"}
          </h3>
          <p className="text-xs text-stone-400 max-w-sm mx-auto leading-relaxed">
            {tab === "active"
              ? "When a bespoke request is confirmed by our master tailors, its production milestones will appear here."
              : "Garments that have finished fitting and been collected or delivered will be archived here."}
          </p>
          {tab === "active" && (
            <div className="pt-2">
              <Link
                href="/collections"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-champagne text-near-black text-xs uppercase tracking-widest font-bold hover:bg-champagne-light transition-all"
              >
                <span>Browse The Collections</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
