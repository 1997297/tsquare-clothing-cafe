"use client";

import { useState } from "react";
import Link from "next/link";
import { useAccountData } from "@/lib/account-store";
import {
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function AccountAppointmentsPage() {
  const { appointments } = useAccountData();
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");

  const today = new Date().toISOString().split("T")[0];

  const upcomingAppointments = appointments.filter(
    (a) => a.status !== "completed" && a.status !== "cancelled"
  );
  const pastAppointments = appointments.filter(
    (a) => a.status === "completed" || a.status === "cancelled"
  );

  const displayedList = tab === "upcoming" ? upcomingAppointments : pastAppointments;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800/60 pb-6">
        <div>
          <span className="text-[10px] uppercase font-mono tracking-[0.3em] text-champagne font-semibold block mb-1">
            Salon & Consultations
          </span>
          <h1 className="font-display text-2xl sm:text-3xl text-warm-ivory">
            Atelier Appointments
          </h1>
          <p className="text-xs text-stone-400 mt-1 font-light">
            Manage your personal fitting checkpoints and style consultations at TSquare Clothing Cafe.
          </p>
        </div>

        <Link
          href="/book-a-fitting"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-champagne text-near-black text-xs uppercase tracking-widest font-bold hover:bg-champagne-light transition-all self-start sm:self-auto"
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Book Fitting Session</span>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-800/40 pb-3">
        <button
          onClick={() => setTab("upcoming")}
          className={cn(
            "px-4 py-1.5 rounded-xl text-xs uppercase font-mono tracking-wider transition-colors",
            tab === "upcoming"
              ? "bg-stone-900 text-champagne border border-stone-800 font-semibold"
              : "text-stone-500 hover:text-stone-300"
          )}
        >
          Upcoming & Requested ({upcomingAppointments.length})
        </button>
        <button
          onClick={() => setTab("past")}
          className={cn(
            "px-4 py-1.5 rounded-xl text-xs uppercase font-mono tracking-wider transition-colors",
            tab === "past"
              ? "bg-stone-900 text-champagne border border-stone-800 font-semibold"
              : "text-stone-500 hover:text-stone-300"
          )}
        >
          Archived & Past ({pastAppointments.length})
        </button>
      </div>

      {/* List */}
      {displayedList.length > 0 ? (
        <div className="space-y-4">
          {displayedList.map((apt) => {
            const isConfirmed = apt.status === "confirmed";
            const isRequested = apt.status === "requested";

            return (
              <div
                key={apt.id}
                className="p-6 sm:p-7 rounded-3xl bg-[#141412] fine-border space-y-4 hover:border-stone-700/80 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-800/50">
                  <div>
                    <span className="text-[10px] uppercase font-mono text-champagne tracking-wider block mb-1">
                      {isRequested ? "Booking Requested" : "Atelier Reservation"}
                    </span>
                    <h3 className="font-display text-lg text-warm-ivory capitalize">
                      {apt.type.replace(/-/g, " ")} Session
                    </h3>
                  </div>

                  <span
                    className={cn(
                      "px-3 py-1 rounded-full text-[10px] uppercase font-mono tracking-wider font-semibold border self-start sm:self-auto",
                      isConfirmed && "bg-emerald-950/40 border-emerald-700 text-emerald-400",
                      isRequested && "bg-amber-950/40 border-amber-700 text-amber-400",
                      apt.status === "completed" && "bg-stone-900 border-stone-700 text-stone-400",
                      apt.status === "cancelled" && "bg-red-950/40 border-red-800 text-red-400"
                    )}
                  >
                    {apt.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                  <div className="flex items-center gap-2.5 text-stone-300">
                    <Calendar className="w-4 h-4 text-champagne shrink-0" />
                    <span className="font-mono">
                      {apt.confirmedDate || apt.preferredDate}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 text-stone-300">
                    <Clock className="w-4 h-4 text-champagne shrink-0" />
                    <span className="font-mono">
                      {apt.confirmedTime || apt.preferredTime}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 text-stone-300">
                    <MapPin className="w-4 h-4 text-champagne shrink-0" />
                    <span className="truncate">{apt.location}</span>
                  </div>
                </div>

                {apt.notes && (
                  <div className="pt-2 text-xs text-stone-400 italic">
                    Note: &quot;{apt.notes}&quot;
                  </div>
                )}

                {/* Actions for active requested/scheduled visits */}
                {tab === "upcoming" && (
                  <div className="pt-3 border-t border-stone-800/40 flex items-center justify-between text-xs">
                    <p className="text-[11px] text-stone-500">
                      Need to adjust your timing? Our VIP concierge can reschedule with 24 hours notice.
                    </p>
                    <Link
                      href="/contact"
                      className="text-xs uppercase font-mono text-champagne hover:text-champagne-light tracking-wider font-semibold shrink-0 ml-4"
                    >
                      Request Reschedule
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 bg-[#141412] fine-border rounded-3xl text-center space-y-4">
          <Calendar className="w-8 h-8 text-stone-600 mx-auto" />
          <h3 className="font-display text-xl text-warm-ivory">
            {tab === "upcoming" ? "No Scheduled Visits" : "No Past Appointments"}
          </h3>
          <p className="text-xs text-stone-400 max-w-sm mx-auto leading-relaxed">
            {tab === "upcoming"
              ? "Reserve a personal fitting session with our Abeokuta master cutters for measurements, canvas checks, or style consultations."
              : "Completed salon visits and consultation checkpoints will be archived here."}
          </p>
          {tab === "upcoming" && (
            <div className="pt-2">
              <Link
                href="/book-a-fitting"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-champagne text-near-black text-xs uppercase tracking-widest font-bold hover:bg-champagne-light transition-all"
              >
                <span>Reserve A Fitting Session</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
