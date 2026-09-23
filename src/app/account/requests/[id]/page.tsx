"use client";

import { use } from "react";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { useAccountData } from "@/lib/account-store";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Sparkles,
  Scissors,
  CheckCircle2,
  AlertCircle,
  FileText,
  User,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function RequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { requests } = useAccountData();

  const request = requests.find((r) => r.requestId === id);

  if (!request) {
    return (
      <div className="py-16 text-center space-y-4">
        <AlertCircle className="w-8 h-8 text-stone-600 mx-auto" />
        <h2 className="font-display text-2xl text-warm-ivory">Request Not Located</h2>
        <p className="text-xs text-stone-400">
          The requested bespoke commission reference could not be found in your archive.
        </p>
        <Link
          href="/account/requests"
          className="inline-flex items-center gap-2 text-xs text-champagne uppercase font-mono tracking-widest"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Return to Requests
        </Link>
      </div>
    );
  }

  const isClarificationNeeded = request.status === "needs_clarification";
  const isPricingReady = request.status === "pricing_ready";

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header & Back Link */}
      <div>
        <Link
          href="/account/requests"
          className="inline-flex items-center gap-2 text-xs text-stone-400 hover:text-champagne transition-colors uppercase font-mono tracking-wider mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Requests</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800/60 pb-6">
          <div>
            <div className="flex items-center gap-3 mb-1.5">
              <span className="text-xs font-mono font-bold text-champagne tracking-wider">
                {request.requestId}
              </span>
              <span className="text-stone-600">•</span>
              <span className="text-xs text-stone-400 font-mono">
                Submitted {new Date(request.createdAt).toLocaleDateString("en-NG", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl text-warm-ivory">
              {request.styleName || "Bespoke Sartorial Request"}
            </h1>
          </div>

          <span
            className={cn(
              "px-3.5 py-1.5 rounded-full text-xs uppercase font-mono tracking-wider font-semibold border self-start sm:self-auto",
              request.status === "submitted" && "bg-stone-900 border-stone-700 text-stone-300",
              request.status === "under_review" && "bg-blue-950/40 border-blue-800/40 text-blue-400",
              request.status === "needs_clarification" && "bg-amber-950/40 border-amber-700 text-amber-400",
              request.status === "pricing_ready" && "bg-champagne/15 border-champagne text-champagne",
              request.status === "confirmed" && "bg-emerald-950/40 border-emerald-700 text-emerald-400",
              request.status === "converted_to_order" && "bg-emerald-950/40 border-emerald-700 text-emerald-400"
            )}
          >
            {request.status.replace(/_/g, " ")}
          </span>
        </div>
      </div>

      {/* ── Contextual Action Callout: Needs Clarification ── */}
      {isClarificationNeeded && (
        <div className="p-6 rounded-3xl bg-amber-950/20 border border-amber-700/60 space-y-3">
          <div className="flex items-center gap-2 text-amber-400 font-display text-lg">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>We Need One More Detail</span>
          </div>
          <p className="text-xs text-stone-300 leading-relaxed">
            Our master cutter has reviewed your sleeve and chest measurements and requests a quick re-check of your shoulder slope before cutting the paper pattern.
          </p>
          <div className="pt-2 flex items-center gap-3">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-champagne text-near-black text-xs font-bold uppercase tracking-wider hover:bg-champagne-light transition-all"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Provide Response to Atelier</span>
            </Link>
          </div>
        </div>
      )}

      {/* ── Contextual Action Callout: Pricing Ready ── */}
      {isPricingReady && (
        <div className="p-6 sm:p-8 rounded-3xl bg-[#171614] border border-champagne/50 space-y-4">
          <div className="flex items-center gap-2 text-champagne font-display text-xl">
            <Sparkles className="w-5 h-5" />
            <span>Atelier Pricing Ready for Review</span>
          </div>
          <p className="text-xs text-stone-300 leading-relaxed">
            Based on your selected fabric, embroidery density, and individual anatomy, the master tailoring fee for this 4-piece ensemble has been finalized.
          </p>
          <div className="p-4 rounded-2xl bg-near-black border border-stone-800 flex items-center justify-between">
            <span className="text-xs uppercase font-mono tracking-widest text-stone-400">
              Quoted Atelier Total
            </span>
            <span className="font-display text-2xl text-champagne font-bold">
              ₦320,000
            </span>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button className="px-6 py-3 rounded-xl bg-champagne text-near-black text-xs uppercase tracking-widest font-bold hover:bg-champagne-light transition-all">
              Accept Quote & Convert to Order
            </button>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center px-6 py-3 rounded-xl border border-stone-700 text-stone-300 hover:text-warm-ivory text-xs uppercase tracking-widest font-semibold transition-all"
            >
              Discuss With TSquare Concierge
            </Link>
          </div>
        </div>
      )}

      {/* Garment Details & Specifications */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Garment Specs */}
        <div className="md:col-span-2 space-y-8">
          {/* Fabric & Colour */}
          <div className="p-6 rounded-3xl bg-[#141412] fine-border space-y-5">
            <h3 className="text-xs font-mono uppercase tracking-[0.25em] text-champagne font-semibold">
              Fabric & Colour Specifications
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-stone-900/60 border border-stone-800">
                <span className="text-[10px] uppercase font-mono text-stone-500 block mb-1">
                  Selected Fabric
                </span>
                <p className="font-medium text-warm-ivory">{request.fabric?.name || "Pending Consultation"}</p>
                {request.fabric?.weight && (
                  <p className="text-[11px] text-stone-400 mt-1">Weight: {request.fabric.weight}</p>
                )}
                {request.fabric?.finish && (
                  <p className="text-[11px] text-stone-400">Finish: {request.fabric.finish}</p>
                )}
              </div>

              <div className="p-4 rounded-2xl bg-stone-900/60 border border-stone-800">
                <span className="text-[10px] uppercase font-mono text-stone-500 block mb-1">
                  Selected Colour
                </span>
                <div className="flex items-center gap-2 mt-1">
                  {request.colour?.hex && (
                    <span
                      className="w-4 h-4 rounded-full border border-white/20 shrink-0"
                      style={{ background: request.colour.hex }}
                    />
                  )}
                  <p className="font-medium text-warm-ivory">{request.colour?.name || "Custom Palette"}</p>
                </div>
                <p className="text-[11px] text-stone-400 mt-1">
                  Fit Archetype: <span className="capitalize text-stone-300">{request.fitPreference || "Tailored"}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Design Preferences */}
          <div className="p-6 rounded-3xl bg-[#141412] fine-border space-y-4">
            <h3 className="text-xs font-mono uppercase tracking-[0.25em] text-champagne font-semibold">
              Tailoring Preferences
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              {request.preferences?.embroideryStyle && (
                <div>
                  <span className="text-[10px] uppercase text-stone-500 block font-mono">Embroidery</span>
                  <span className="text-stone-300">{request.preferences.embroideryStyle}</span>
                </div>
              )}
              {request.preferences?.agbadaLength && (
                <div>
                  <span className="text-[10px] uppercase text-stone-500 block font-mono">Length</span>
                  <span className="text-stone-300 capitalize">{request.preferences.agbadaLength}</span>
                </div>
              )}
              {request.preferences?.capIncluded !== undefined && (
                <div>
                  <span className="text-[10px] uppercase text-stone-500 block font-mono">Matching Cap</span>
                  <span className="text-stone-300">{request.preferences.capIncluded ? "Included" : "Not included"}</span>
                </div>
              )}
              {request.preferences?.collarStyle && (
                <div>
                  <span className="text-[10px] uppercase text-stone-500 block font-mono">Collar</span>
                  <span className="text-stone-300">{request.preferences.collarStyle}</span>
                </div>
              )}
              {request.preferences?.buttonPreference && (
                <div>
                  <span className="text-[10px] uppercase text-stone-500 block font-mono">Buttons</span>
                  <span className="text-stone-300">{request.preferences.buttonPreference}</span>
                </div>
              )}
              {request.preferences?.trouserBreak && (
                <div>
                  <span className="text-[10px] uppercase text-stone-500 block font-mono">Trouser Break</span>
                  <span className="text-stone-300">{request.preferences.trouserBreak}</span>
                </div>
              )}
            </div>

            {request.preferences?.specialInstructions && (
              <div className="pt-3 border-t border-stone-800">
                <span className="text-[10px] uppercase text-stone-500 block font-mono mb-1">
                  Special Instructions
                </span>
                <p className="text-xs text-stone-300 italic bg-stone-900/40 p-3 rounded-xl border border-stone-800">
                  &quot;{request.preferences.specialInstructions}&quot;
                </p>
              </div>
            )}
          </div>

          {/* Measurements Snapshot Used */}
          {request.measurements && Object.keys(request.measurements).length > 0 && (
            <div className="p-6 rounded-3xl bg-[#141412] fine-border space-y-4">
              <h3 className="text-xs font-mono uppercase tracking-[0.25em] text-champagne font-semibold">
                Physiological Measurements Snapshot
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Object.entries(request.measurements).map(([key, val]) => (
                  <div key={key} className="p-2.5 rounded-xl bg-stone-900/60 border border-stone-800 text-center">
                    <span className="text-[9px] uppercase font-mono text-stone-500 block capitalize">
                      {key.replace(/([A-Z])/g, " $1")}
                    </span>
                    <span className="text-xs font-mono font-bold text-warm-ivory">
                      {val} {request.measurementUnit || "cm"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Occasion & Appointments Summary */}
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-[#141412] fine-border space-y-4 text-xs">
            <h3 className="text-xs font-mono uppercase tracking-[0.25em] text-champagne font-semibold">
              Occasion & Schedule
            </h3>
            <div>
              <span className="text-[10px] uppercase font-mono text-stone-500 block">Occasion</span>
              <p className="text-warm-ivory font-medium capitalize mt-0.5">
                {request.occasion ? request.occasion.replace(/-/g, " ") : "Bespoke Wardrobe"}
              </p>
            </div>
            {request.eventName && (
              <div>
                <span className="text-[10px] uppercase font-mono text-stone-500 block">Event Name</span>
                <p className="text-warm-ivory font-medium mt-0.5">{request.eventName}</p>
              </div>
            )}
            {request.requiredDate && (
              <div>
                <span className="text-[10px] uppercase font-mono text-stone-500 block">Required By</span>
                <p className="text-champagne font-mono font-semibold mt-0.5">{request.requiredDate}</p>
              </div>
            )}
          </div>

          {/* Appointment Request Snapshot */}
          {request.appointmentRequest?.type && request.appointmentRequest.type !== "none" && (
            <div className="p-6 rounded-3xl bg-[#141412] fine-border space-y-3 text-xs">
              <h3 className="text-xs font-mono uppercase tracking-[0.25em] text-champagne font-semibold">
                Requested Fitting Visit
              </h3>
              <p className="text-warm-ivory font-medium capitalize">
                {request.appointmentRequest.type.replace(/-/g, " ")}
              </p>
              <p className="text-stone-400 font-mono">
                {request.appointmentRequest.preferredDate} ({request.appointmentRequest.preferredTime})
              </p>
              <p className="text-[11px] text-stone-500">
                TCC office
              </p>
            </div>
          )}

          {/* Atelier Discretion Guarantee */}
          <div className="p-5 rounded-2xl bg-stone-900/30 border border-stone-800 text-center space-y-2">
            <span className="text-[9px] uppercase font-mono text-stone-500 tracking-widest block">
              Atelier Standard
            </span>
            <p className="text-[11px] text-stone-400 font-light leading-relaxed">
              Every bespoke request enters our digital archives. All patterns are individually cut and hand-tailored at TCC.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
