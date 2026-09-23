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
  Repeat,
  Plus,
  ShieldCheck,
} from "lucide-react";
import { cn, formatOfficeLocation } from "@/lib/utils";

type AppointmentTab = "upcoming" | "requested" | "past";

export default function AccountAppointmentsPage() {
  const {
    appointments,
    requestAppointmentReschedule,
    requestAppointmentCancellation,
  } = useAccountData();

  const [tab, setTab] = useState<AppointmentTab>("upcoming");

  // Modal States
  const [rescheduleAptId, setRescheduleAptId] = useState<string | null>(null);
  const [proposedDate, setProposedDate] = useState("");
  const [proposedTime, setProposedTime] = useState("11:30 AM");
  const [rescheduleReason, setRescheduleReason] = useState("");
  const [isRescheduling, setIsRescheduling] = useState(false);

  const [cancelAptId, setCancelAptId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);

  const upcomingList = appointments.filter(
    (a) => a.status === "confirmed" || a.status === "scheduled"
  );
  const requestedList = appointments.filter((a) => a.status === "requested");
  const pastList = appointments.filter(
    (a) => a.status === "completed" || a.status === "cancelled" || a.status === "rescheduled"
  );

  const displayedList =
    tab === "upcoming" ? upcomingList : tab === "requested" ? requestedList : pastList;

  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleAptId || !proposedDate) return;

    setIsRescheduling(true);
    try {
      await requestAppointmentReschedule(
        rescheduleAptId,
        proposedDate,
        proposedTime,
        rescheduleReason
      );
      setRescheduleAptId(null);
      setProposedDate("");
      setRescheduleReason("");
    } finally {
      setIsRescheduling(false);
    }
  };

  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelAptId) return;

    setIsCancelling(true);
    try {
      await requestAppointmentCancellation(cancelAptId, cancelReason);
      setCancelAptId(null);
      setCancelReason("");
    } finally {
      setIsCancelling(false);
    }
  };

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
            Manage your personal fitting checkpoints, measurements, and consultations at the TSquare Abeokuta atelier.
          </p>
        </div>

        <Link
          href="/book-a-fitting"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-champagne text-near-black text-xs uppercase font-mono tracking-wider font-bold hover:bg-champagne-light transition-all self-start sm:self-auto shadow-md"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Book Fitting Session</span>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-800/40 pb-3 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setTab("upcoming")}
          className={cn(
            "px-4 py-2 rounded-xl text-xs uppercase font-mono tracking-wider transition-colors whitespace-nowrap",
            tab === "upcoming"
              ? "bg-stone-900 text-champagne border border-stone-700 font-semibold"
              : "text-stone-500 hover:text-stone-300"
          )}
        >
          Upcoming Confirmed ({upcomingList.length})
        </button>
        <button
          onClick={() => setTab("requested")}
          className={cn(
            "px-4 py-2 rounded-xl text-xs uppercase font-mono tracking-wider transition-colors whitespace-nowrap",
            tab === "requested"
              ? "bg-stone-900 text-champagne border border-stone-700 font-semibold"
              : "text-stone-500 hover:text-stone-300"
          )}
        >
          Requested Sessions ({requestedList.length})
        </button>
        <button
          onClick={() => setTab("past")}
          className={cn(
            "px-4 py-2 rounded-xl text-xs uppercase font-mono tracking-wider transition-colors whitespace-nowrap",
            tab === "past"
              ? "bg-stone-900 text-champagne border border-stone-700 font-semibold"
              : "text-stone-500 hover:text-stone-300"
          )}
        >
          Archived & Past ({pastList.length})
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
                      {isRequested ? "Booking Requested" : "Confirmed Atelier Reservation"}
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
                      apt.status === "cancelled" && "bg-red-950/40 border-red-800 text-red-400",
                      apt.status === "rescheduled" && "bg-blue-950/40 border-blue-800 text-blue-400"
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
                    <span className="truncate">{formatOfficeLocation(apt.location)}</span>
                  </div>
                </div>

                {apt.notes && (
                  <div className="pt-2 text-xs text-stone-400 italic">
                    Note: &quot;{apt.notes}&quot;
                  </div>
                )}

                {/* Actions for active visits */}
                {tab !== "past" && (
                  <div className="pt-4 border-t border-stone-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <p className="text-[11px] text-stone-500 font-light">
                      Existing confirmed sessions remain authoritative until your proposed adjustment is approved.
                    </p>
                    <div className="flex items-center gap-3 shrink-0">
                      <button
                        onClick={() => setRescheduleAptId(apt.id)}
                        className="px-3.5 py-1.5 rounded-xl border border-stone-800 hover:border-champagne/40 text-xs font-mono uppercase tracking-wider text-warm-ivory hover:text-champagne transition-colors"
                      >
                        Request Reschedule
                      </button>
                      <button
                        onClick={() => setCancelAptId(apt.id)}
                        className="px-3.5 py-1.5 rounded-xl border border-stone-800 hover:border-red-800/40 text-xs font-mono uppercase tracking-wider text-stone-400 hover:text-red-400 transition-colors"
                      >
                        Request Cancellation
                      </button>
                    </div>
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
            {tab === "upcoming"
              ? "No Upcoming Confirmed Visits"
              : tab === "requested"
              ? "No Pending Appointment Requests"
              : "No Archived Past Appointments"}
          </h3>
          <p className="text-xs text-stone-400 max-w-sm mx-auto leading-relaxed">
            {tab === "upcoming"
              ? "Reserve a personal fitting session with our master cutters at the TCC atelier for measurements, canvas checks, or style consultations."
              : tab === "requested"
              ? "Any consultation or fitting requests currently under review by our atelier will appear here."
              : "Completed salon visits and consultation checkpoints will be permanently archived here."}
          </p>
          {tab !== "past" && (
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

      {/* ── Reschedule Request Modal ── */}
      {rescheduleAptId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#141412] border border-stone-800 rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-800/80 pb-4">
              <div>
                <h3 className="font-display text-xl text-warm-ivory">
                  Request Appointment Reschedule
                </h3>
                <p className="text-xs text-stone-400 font-light mt-0.5">
                  Propose your preferred new date and time for concierge confirmation.
                </p>
              </div>
              <button
                onClick={() => setRescheduleAptId(null)}
                className="text-stone-400 hover:text-warm-ivory text-sm font-mono p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRescheduleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="text-[10px] uppercase font-mono text-stone-400 block mb-1.5">
                  New Preferred Date
                </label>
                <input
                  type="date"
                  required
                  value={proposedDate}
                  onChange={(e) => setProposedDate(e.target.value)}
                  className="w-full bg-stone-900/60 border border-stone-800 text-warm-ivory rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-champagne/40 font-mono text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-mono text-stone-400 block mb-1.5">
                  New Preferred Time
                </label>
                <select
                  value={proposedTime}
                  onChange={(e) => setProposedTime(e.target.value)}
                  className="w-full bg-stone-900/60 border border-stone-800 text-warm-ivory rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-champagne/40 font-mono text-xs"
                >
                  <option value="10:00 AM">10:00 AM - Morning Fitting</option>
                  <option value="11:30 AM">11:30 AM - Late Morning</option>
                  <option value="02:00 PM">02:00 PM - Early Afternoon</option>
                  <option value="04:00 PM">04:00 PM - Late Afternoon</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase font-mono text-stone-400 block mb-1.5">
                  Reason for Adjustment
                </label>
                <textarea
                  rows={3}
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                  placeholder="Provide context regarding your scheduling change..."
                  className="w-full bg-stone-900/60 border border-stone-800 text-warm-ivory rounded-xl p-3 focus:outline-none focus:border-champagne/40 placeholder:text-stone-600"
                />
              </div>

              <div className="p-3 rounded-xl bg-stone-900/40 border border-stone-800 text-[11px] text-stone-400 leading-relaxed font-light">
                <ShieldCheck className="w-4 h-4 text-champagne inline mr-1.5" />
                Your current confirmed booking will remain reserved until the atelier confirms the new slot.
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setRescheduleAptId(null)}
                  className="px-4 py-2 rounded-xl border border-stone-800 text-stone-400 hover:text-warm-ivory text-xs uppercase font-mono tracking-wider"
                >
                  Keep Current
                </button>
                <button
                  type="submit"
                  disabled={isRescheduling || !proposedDate}
                  className="px-5 py-2 rounded-xl bg-champagne text-near-black text-xs uppercase font-mono tracking-wider font-bold hover:bg-champagne-light disabled:opacity-50 transition-all"
                >
                  {isRescheduling ? "Transmitting..." : "Submit Proposal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Cancellation Request Modal ── */}
      {cancelAptId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#141412] border border-stone-800 rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-800/80 pb-4">
              <div>
                <h3 className="font-display text-xl text-warm-ivory">
                  Request Appointment Cancellation
                </h3>
                <p className="text-xs text-stone-400 font-light mt-0.5">
                  Notify our concierge of your cancellation request.
                </p>
              </div>
              <button
                onClick={() => setCancelAptId(null)}
                className="text-stone-400 hover:text-warm-ivory text-sm font-mono p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCancelSubmit} className="space-y-4 text-xs">
              <div>
                <label className="text-[10px] uppercase font-mono text-stone-400 block mb-1.5">
                  Reason for Cancellation
                </label>
                <textarea
                  rows={3}
                  required
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Please state why you wish to cancel this appointment session..."
                  className="w-full bg-stone-900/60 border border-stone-800 text-warm-ivory rounded-xl p-3 focus:outline-none focus:border-champagne/40 placeholder:text-stone-600"
                />
              </div>

              <div className="p-3 rounded-xl bg-stone-900/40 border border-stone-800 text-[11px] text-stone-400 leading-relaxed font-light">
                Appointment history is safely preserved in accordance with TCC client care standards.
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setCancelAptId(null)}
                  className="px-4 py-2 rounded-xl border border-stone-800 text-stone-400 hover:text-warm-ivory text-xs uppercase font-mono tracking-wider"
                >
                  Dismiss
                </button>
                <button
                  type="submit"
                  disabled={isCancelling || !cancelReason.trim()}
                  className="px-5 py-2 rounded-xl bg-red-900/80 hover:bg-red-800 text-white text-xs uppercase font-mono tracking-wider font-bold disabled:opacity-50 transition-all"
                >
                  {isCancelling ? "Transmitting..." : "Confirm Cancellation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
