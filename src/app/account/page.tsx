"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/auth-context";
import { useAccountData } from "@/lib/account-store";
import { getStyleById } from "@/data/styles";
import {
  Sparkles,
  ArrowRight,
  Package,
  Ruler,
  Calendar,
  Heart,
  Bell,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Scissors,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

const CRAFTSMANSHIP_STAGES = [
  { id: "order_confirmed", label: "Confirmed" },
  { id: "measurements_confirmed", label: "Measurements" },
  { id: "in_production", label: "In Production" },
  { id: "finishing", label: "Finishing" },
  { id: "ready", label: "Ready" },
  { id: "completed", label: "Delivered" },
];

export default function AccountOverviewPage() {
  const { profile } = useAuth();
  const {
    orders,
    requests,
    appointments,
    currentMeasurement,
    notifications,
    data: { savedStyleIds },
  } = useAccountData();

  const [greeting, setGreeting] = useState("Welcome");

  // Hydration-safe time of day greeting
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  const activeOrder = orders.find(
    (o) => o.status !== "completed"
  ) || orders[0];

  const recentRequest = requests[0];
  const upcomingAppointment = appointments.find(
    (a) => a.status === "confirmed" || a.status === "scheduled" || a.status === "requested"
  );
  const unreadNotifications = notifications.filter((n) => !n.isRead);

  // Stage index for progress bar
  const currentStageIndex = activeOrder
    ? CRAFTSMANSHIP_STAGES.findIndex((s) => s.id === activeOrder.status)
    : -1;

  const savedStyles = savedStyleIds
    .map((id) => getStyleById(id))
    .filter((s): s is NonNullable<typeof s> => Boolean(s));

  const clientFirstName = profile?.firstName || "Client";

  return (
    <div className="space-y-10 animate-in fade-in duration-300">
      {/* ── Personalized Greeting Header ── */}
      <div className="border-b border-stone-800/60 pb-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-[10px] uppercase font-mono tracking-[0.3em] text-champagne font-semibold block mb-2">
              Private Client Salon
            </span>
            <h1 className="font-display text-3xl sm:text-4xl text-warm-ivory font-normal">
              {greeting}, {clientFirstName}.
            </h1>
            <p className="mt-2 text-sm text-stone-400 font-light">
              Your TSquare wardrobe is taking shape. Every commission is cut exclusively to your anatomy in our Abeokuta atelier.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/bespoke/create/idea"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-champagne text-near-black text-xs uppercase tracking-widest font-bold hover:bg-champagne-light transition-all shadow-sm shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Start An Idea</span>
            </Link>
            <Link
              href="/collections"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-stone-700 text-stone-300 hover:text-warm-ivory hover:border-stone-500 text-xs uppercase tracking-widest font-semibold transition-all shrink-0"
            >
              <span>Explore Archive</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Section 1: Priority Active Garment Focus ── */}
      {activeOrder ? (
        <div className="p-6 sm:p-8 bg-[#141412] fine-border rounded-3xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-800/60">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="px-2.5 py-0.5 rounded-full bg-champagne/15 text-champagne border border-champagne/30 text-[10px] font-mono uppercase tracking-widest">
                  Active Commission
                </span>
                <span className="text-[10px] font-mono text-stone-500">
                  {activeOrder.orderReference}
                </span>
              </div>
              <h2 className="font-display text-xl sm:text-2xl text-warm-ivory">
                {activeOrder.styleName}
              </h2>
              <p className="text-xs text-stone-400 mt-1">
                {activeOrder.fabricDetails?.name || "Premium Atelier Fabric"} • {activeOrder.colourDetails?.name || "Custom Palette"}
              </p>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-[10px] uppercase font-mono tracking-widest text-stone-500 block">
                Target Completion
              </span>
              <span className="text-sm font-mono text-champagne font-semibold">
                {activeOrder.targetCompletionDate || "Under Atelier Review"}
              </span>
            </div>
          </div>

          {/* Craftsmanship Progress Timeline */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] uppercase font-mono tracking-widest text-stone-400">
                Atelier Craftsmanship Milestones
              </span>
              <span className="text-xs text-stone-400 font-medium capitalize">
                {activeOrder.status.replace(/_/g, " ")}
              </span>
            </div>

            {/* Step Progress Line */}
            <div className="grid grid-cols-6 gap-2">
              {CRAFTSMANSHIP_STAGES.map((stage, idx) => {
                const isPassed = idx <= currentStageIndex;
                const isCurrent = idx === currentStageIndex;

                return (
                  <div key={stage.id} className="space-y-2">
                    <div
                      className={cn(
                        "h-1.5 rounded-full transition-all duration-300",
                        isPassed
                          ? "bg-champagne"
                          : "bg-stone-800"
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

          <div className="pt-2 flex items-center justify-between">
            <p className="text-xs text-stone-400 italic">
              {activeOrder.specialInstructions || "Individually hand-tailored in Abeokuta with zero glued fusing."}
            </p>
            <Link
              href={`/account/orders/${activeOrder.id}`}
              className="inline-flex items-center gap-1.5 text-xs text-champagne hover:text-champagne-light uppercase font-mono tracking-wider font-semibold"
            >
              <span>View Order Spec</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      ) : recentRequest ? (
        <div className="p-6 sm:p-8 bg-[#141412] fine-border rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-0.5 rounded-full bg-champagne/15 text-champagne border border-champagne/30 text-[10px] font-mono uppercase tracking-widest">
              Latest Bespoke Request
            </span>
            <span className="text-xs font-mono text-stone-400">
              {recentRequest.requestId}
            </span>
          </div>

          <h2 className="font-display text-2xl text-warm-ivory">
            {recentRequest.styleName || "Bespoke Sartorial Commission"}
          </h2>

          <p className="text-xs text-stone-400 leading-relaxed">
            Your request is currently {recentRequest.status.replace(/_/g, " ")}. Our master tailors are examining your fabric selection and measurements.
          </p>

          <div className="pt-2">
            <Link
              href={`/account/requests/${recentRequest.requestId}`}
              className="inline-flex items-center gap-1.5 text-xs text-champagne uppercase font-mono tracking-wider font-semibold"
            >
              <span>Inspect Request Details</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="p-8 bg-[#141412] fine-border rounded-3xl text-center space-y-4">
          <Scissors className="w-8 h-8 text-champagne/60 mx-auto" />
          <h2 className="font-display text-2xl text-warm-ivory">
            No Active Orders Yet
          </h2>
          <p className="text-xs text-stone-400 max-w-md mx-auto leading-relaxed">
            Your first TSquare piece begins with a style archetype from our collections or an idea of your own.
          </p>
          <div className="pt-2">
            <Link
              href="/collections"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-champagne text-near-black text-xs uppercase tracking-widest font-bold hover:bg-champagne-light transition-all"
            >
              <span>Explore The Collections</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* ── Section 2: Two-Column Priority Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Measurements Vault Snapshot */}
        <div className="p-6 bg-[#141412] fine-border rounded-3xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-stone-800/60">
            <div className="flex items-center gap-2.5">
              <Ruler className="w-4 h-4 text-champagne" />
              <h3 className="font-display text-base text-warm-ivory">
                Measurement Profile
              </h3>
            </div>
            <Link
              href="/account/measurements"
              className="text-[10px] text-stone-400 hover:text-champagne uppercase font-mono tracking-wider"
            >
              Manage Vault
            </Link>
          </div>

          {currentMeasurement ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-400">Verification Status</span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/40 text-emerald-400 border border-emerald-800/40 text-[10px] uppercase font-mono">
                  <Check className="w-3 h-3" />
                  {currentMeasurement.verificationStatus.replace(/_/g, " ")}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-400">Active Profile Version</span>
                <span className="text-warm-ivory font-mono">
                  Version {currentMeasurement.version} ({currentMeasurement.unit})
                </span>
              </div>

              {/* Sample metrics */}
              <div className="grid grid-cols-3 gap-2 pt-2">
                <div className="p-2.5 rounded-xl bg-stone-900/60 border border-stone-800/50 text-center">
                  <span className="text-[9px] uppercase font-mono text-stone-500 block">Chest</span>
                  <span className="text-xs font-mono font-bold text-warm-ivory">
                    {currentMeasurement.measurements.chest || "—"} {currentMeasurement.unit}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-stone-900/60 border border-stone-800/50 text-center">
                  <span className="text-[9px] uppercase font-mono text-stone-500 block">Shoulder</span>
                  <span className="text-xs font-mono font-bold text-warm-ivory">
                    {currentMeasurement.measurements.shoulder || "—"} {currentMeasurement.unit}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-stone-900/60 border border-stone-800/50 text-center">
                  <span className="text-[9px] uppercase font-mono text-stone-500 block">Top Length</span>
                  <span className="text-xs font-mono font-bold text-warm-ivory">
                    {currentMeasurement.measurements.topLength || "—"} {currentMeasurement.unit}
                  </span>
                </div>
              </div>

              <p className="text-[10px] text-stone-500 italic">
                Saved profile automatically applied to future bespoke requests.
              </p>
            </div>
          ) : (
            <div className="text-center py-6 space-y-3">
              <p className="text-xs text-stone-400">
                Save your 28-point physiological measurements once and use them across all future commissions.
              </p>
              <Link
                href="/account/measurements"
                className="inline-flex items-center gap-1.5 text-xs text-champagne uppercase font-mono tracking-wider font-semibold"
              >
                <span>Create Measurement Profile</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>

        {/* Upcoming Appointment */}
        <div className="p-6 bg-[#141412] fine-border rounded-3xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-stone-800/60">
            <div className="flex items-center gap-2.5">
              <Calendar className="w-4 h-4 text-champagne" />
              <h3 className="font-display text-base text-warm-ivory">
                Atelier Checkpoints
              </h3>
            </div>
            <Link
              href="/account/appointments"
              className="text-[10px] text-stone-400 hover:text-champagne uppercase font-mono tracking-wider"
            >
              All Bookings
            </Link>
          </div>

          {upcomingAppointment ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-warm-ivory uppercase tracking-wider">
                  {upcomingAppointment.type.replace(/-/g, " ")}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-champagne/15 text-champagne border border-champagne/30 text-[10px] font-mono capitalize">
                  {upcomingAppointment.status}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-stone-900/50 border border-stone-800/60 space-y-2">
                <div className="flex items-center gap-2 text-xs text-warm-ivory">
                  <Clock className="w-3.5 h-3.5 text-champagne shrink-0" />
                  <span className="font-mono">
                    {upcomingAppointment.confirmedDate || upcomingAppointment.preferredDate} at{" "}
                    {upcomingAppointment.confirmedTime || upcomingAppointment.preferredTime}
                  </span>
                </div>
                <p className="text-[11px] text-stone-400 pl-5.5">
                  {upcomingAppointment.location}
                </p>
              </div>

              {upcomingAppointment.notes && (
                <p className="text-[11px] text-stone-400 italic">
                  Note: {upcomingAppointment.notes}
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-6 space-y-3">
              <p className="text-xs text-stone-400">
                You have no upcoming atelier visits scheduled. Book a fitting or consultation anytime.
              </p>
              <Link
                href="/book-a-fitting"
                className="inline-flex items-center gap-1.5 text-xs text-champagne uppercase font-mono tracking-wider font-semibold"
              >
                <span>Reserve A Fitting Session</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ── Section 3: Saved Looks Teaser ── */}
      {savedStyles.length > 0 && (
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-champagne" />
              <h3 className="font-display text-lg text-warm-ivory">
                Your Saved Archetypes
              </h3>
            </div>
            <Link
              href="/account/saved"
              className="text-xs text-stone-400 hover:text-champagne uppercase font-mono tracking-wider"
            >
              View All ({savedStyles.length})
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {savedStyles.slice(0, 4).map((style) => (
              <div
                key={style.id}
                className="group relative rounded-2xl overflow-hidden bg-stone-900 border border-stone-800/80 p-3 space-y-2 hover:border-champagne/40 transition-colors"
              >
                <div className="relative aspect-[3/4] w-full rounded-xl overflow-hidden bg-espresso">
                  <Image
                    src={style.images[0]}
                    alt={style.name}
                    fill
                    className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 640px) 50vw, 25vw"
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-mono uppercase text-champagne tracking-wider truncate">
                    {style.code}
                  </p>
                  <p className="text-xs text-warm-ivory font-medium truncate">
                    {style.name}
                  </p>
                </div>
                <Link
                  href={`/bespoke/create/${style.slug}`}
                  className="block w-full py-1.5 text-center text-[10px] uppercase tracking-wider font-bold text-near-black bg-champagne hover:bg-champagne-light rounded-lg transition-colors"
                >
                  Make This Mine
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
