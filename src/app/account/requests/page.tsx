"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAccountData } from "@/lib/account-store";
import { FileText, ArrowRight, Clock, Sparkles, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_FILTERS = ["all", "active", "completed"] as const;

export default function AccountRequestsPage() {
  const { requests } = useAccountData();
  const [filter, setFilter] = useState<typeof STATUS_FILTERS[number]>("all");

  const filteredRequests = requests.filter((r) => {
    if (filter === "all") return true;
    if (filter === "active") {
      return (
        r.status === "submitted" ||
        r.status === "under_review" ||
        r.status === "needs_clarification" ||
        r.status === "pricing_ready"
      );
    }
    if (filter === "completed") {
      return r.status === "confirmed" || r.status === "converted_to_order" || r.status === "declined";
    }
    return true;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800/60 pb-6">
        <div>
          <span className="text-[10px] uppercase font-mono tracking-[0.3em] text-champagne font-semibold block mb-1">
            Bespoke Portfolio
          </span>
          <h1 className="font-display text-2xl sm:text-3xl text-warm-ivory">
            Your Bespoke Requests
          </h1>
          <p className="text-xs text-stone-400 mt-1 font-light">
            Every sartorial commission submitted to the TSquare atelier in Abeokuta.
          </p>
        </div>

        <Link
          href="/bespoke/create/idea"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-champagne text-near-black text-xs uppercase tracking-widest font-bold hover:bg-champagne-light transition-all self-start sm:self-auto"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>New Commission</span>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-800/40 pb-3">
        <Filter className="w-3.5 h-3.5 text-stone-500 mr-2" />
        {STATUS_FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs uppercase tracking-wider font-mono transition-colors",
              filter === f
                ? "bg-stone-900 text-champagne border border-stone-800 font-semibold"
                : "text-stone-500 hover:text-stone-300"
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Requests List */}
      {filteredRequests.length > 0 ? (
        <div className="space-y-4">
          {filteredRequests.map((request) => {
            const isClarificationNeeded = request.status === "needs_clarification";
            const isPricingReady = request.status === "pricing_ready";

            return (
              <div
                key={request.requestId}
                className={cn(
                  "p-6 rounded-3xl bg-[#141412] fine-border transition-all duration-200 space-y-4",
                  isClarificationNeeded && "border-amber-600/50 bg-amber-950/10",
                  isPricingReady && "border-champagne/50 bg-champagne/5"
                )}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-800/50">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold text-champagne tracking-wider">
                      {request.requestId}
                    </span>
                    <span className="text-stone-600">•</span>
                    <span className="text-xs text-stone-400 font-mono">
                      {new Date(request.createdAt).toLocaleDateString("en-NG", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "px-3 py-1 rounded-full text-[10px] uppercase font-mono tracking-wider font-semibold border",
                        request.status === "submitted" && "bg-stone-900 border-stone-700 text-stone-300",
                        request.status === "under_review" && "bg-blue-950/40 border-blue-800/40 text-blue-400",
                        request.status === "needs_clarification" && "bg-amber-950/40 border-amber-700 text-amber-400",
                        request.status === "pricing_ready" && "bg-champagne/15 border-champagne text-champagne",
                        request.status === "confirmed" && "bg-emerald-950/40 border-emerald-700 text-emerald-400",
                        request.status === "converted_to_order" && "bg-emerald-950/40 border-emerald-700 text-emerald-400",
                        request.status === "declined" && "bg-red-950/40 border-red-800 text-red-400"
                      )}
                    >
                      {request.status.replace(/_/g, " ")}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="font-display text-lg text-warm-ivory">
                      {request.styleName || (request.garmentCategory ? request.garmentCategory.toUpperCase() : "Bespoke Garment")}
                    </h3>
                    <p className="text-xs text-stone-400">
                      Fabric: <span className="text-stone-300">{request.fabric?.name || "Pending Consultation"}</span> • Colour:{" "}
                      <span className="text-stone-300">{request.colour?.name || "Custom"}</span> • Fit:{" "}
                      <span className="text-stone-300 capitalize">{request.fitPreference || "Tailored"}</span>
                    </p>
                    {request.requiredDate && (
                      <p className="text-[11px] text-stone-500 font-mono">
                        Target Date: {request.requiredDate}
                      </p>
                    )}
                  </div>

                  <Link
                    href={`/account/requests/${request.requestId}`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-stone-700 hover:border-champagne text-xs uppercase tracking-wider text-warm-ivory font-mono transition-colors shrink-0"
                  >
                    <span>View Request Spec</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {/* Contextual Action Notices */}
                {isClarificationNeeded && (
                  <div className="pt-2 text-xs text-amber-300 flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Action Required: TSquare master tailors have requested a measurement clarification.</span>
                  </div>
                )}

                {isPricingReady && (
                  <div className="pt-2 text-xs text-champagne flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Pricing Quoted: Your atelier quote is ready for your review and approval.</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 bg-[#141412] fine-border rounded-3xl text-center space-y-4">
          <FileText className="w-8 h-8 text-stone-600 mx-auto" />
          <h3 className="font-display text-xl text-warm-ivory">
            No Bespoke Requests Found
          </h3>
          <p className="text-xs text-stone-400 max-w-sm mx-auto leading-relaxed">
            You currently have no requests matching this filter. Explore our collections and select Make This Mine to begin.
          </p>
          <div className="pt-2">
            <Link
              href="/collections"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-champagne text-near-black text-xs uppercase tracking-widest font-bold hover:bg-champagne-light transition-all"
            >
              <span>Browse Styles</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
