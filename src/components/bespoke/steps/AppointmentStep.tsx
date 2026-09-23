"use client";

import { ArrowRight, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { BespokeConfiguration, AppointmentRequestData } from "@/types/bespoke";
import { APPOINTMENT_TYPES } from "@/data/bespoke-data";

interface AppointmentStepProps {
  config: BespokeConfiguration;
  onUpdate: (appt: AppointmentRequestData) => void;
  onContinue: () => void;
  onBack: () => void;
}

const TIME_OPTIONS = [
  { id: "morning", label: "Morning", sub: "9:00 AM to 12:00 PM" },
  { id: "afternoon", label: "Afternoon", sub: "12:00 PM to 4:00 PM" },
  { id: "evening", label: "Evening", sub: "4:00 PM to 6:00 PM" },
];

export function AppointmentStep({
  config,
  onUpdate,
  onContinue,
  onBack,
}: AppointmentStepProps) {
  const appt = config.appointment;
  const today = new Date().toISOString().split("T")[0];

  function set<K extends keyof AppointmentRequestData>(
    key: K,
    value: AppointmentRequestData[K]
  ) {
    onUpdate({ ...appt, [key]: value });
  }

  const needsDetails = appt.type && appt.type !== "none";

  return (
    <div className="animate-in fade-in duration-300">
      <p className="text-[10px] uppercase font-mono tracking-[0.28em] text-champagne mb-3">
        09 / Appointment
      </p>
      <h1 className="font-display text-3xl sm:text-4xl text-warm-ivory font-normal mb-2">
        Would you like to visit us?
      </h1>
      <p className="text-sm text-stone-400 font-sans leading-relaxed mb-10">
        An atelier visit is always the finest way to begin. Choose the type of visit that suits your needs — or proceed without one for now.
      </p>

      {/* Appointment type selection */}
      <div className="space-y-3 mb-8">
        {APPOINTMENT_TYPES.map((type) => {
          const isSelected = appt.type === type.id;
          return (
            <button
              key={type.id}
              onClick={() => onUpdate({ ...appt, type: type.id })}
              className={cn(
                "w-full flex items-start gap-4 p-5 rounded-2xl border text-left transition-all duration-200",
                isSelected
                  ? "border-champagne/60 bg-stone-900/60 ring-1 ring-champagne/20"
                  : "border-stone-800 hover:border-stone-700 hover:bg-stone-900/30"
              )}
            >
              <div className={cn(
                "w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 transition-all",
                isSelected ? "border-champagne bg-champagne" : "border-stone-600"
              )} />
              <div>
                <p className={cn(
                  "text-sm font-semibold uppercase tracking-wide mb-0.5 transition-colors",
                  isSelected ? "text-champagne" : "text-warm-ivory"
                )}>
                  {type.label}
                </p>
                <p className="text-xs text-stone-400 leading-relaxed">
                  {type.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Appointment details (when a type is selected that isn't "none") */}
      {needsDetails && (
        <div className="mb-8 p-5 bg-[#141412] border border-stone-800/50 rounded-2xl space-y-5 animate-in fade-in duration-200">
          <p className="text-[10px] uppercase tracking-widest text-stone-500 font-mono">
            Preferred Appointment Details
          </p>

          {/* Date */}
          <div>
            <label
              htmlFor="appt-date"
              className="block text-[10px] uppercase tracking-widest text-stone-500 mb-2"
            >
              Preferred Date
            </label>
            <input
              id="appt-date"
              type="date"
              value={appt.preferredDate ?? ""}
              min={today}
              onChange={(e) => set("preferredDate", e.target.value)}
              className="w-full sm:w-64 bg-near-black border border-stone-800 rounded-xl text-xs text-warm-ivory px-4 py-3 focus:outline-none focus:border-champagne/50"
            />
          </div>

          {/* Time */}
          <div>
            <p className="text-[10px] uppercase tracking-widest text-stone-500 mb-3">
              Preferred Time
            </p>
            <div className="flex flex-wrap gap-2">
              {TIME_OPTIONS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => set("preferredTime", t.id)}
                  className={cn(
                    "flex flex-col items-start px-4 py-3 rounded-xl border text-left transition-all duration-150",
                    appt.preferredTime === t.id
                      ? "border-champagne/60 bg-stone-900/80 text-champagne"
                      : "border-stone-800 text-stone-400 hover:border-stone-700 hover:text-stone-300"
                  )}
                >
                  <span className="text-xs font-semibold uppercase tracking-wide">{t.label}</span>
                  <span className="text-[10px] mt-0.5 opacity-70">{t.sub}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label
              htmlFor="appt-notes"
              className="block text-[10px] uppercase tracking-widest text-stone-500 mb-2"
            >
              Notes (Optional)
            </label>
            <textarea
              id="appt-notes"
              rows={3}
              value={appt.notes ?? ""}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Any additional context for the team — e.g. travelling from out of town, specific questions to prepare."
              className="w-full bg-near-black border border-stone-800 rounded-xl text-xs text-warm-ivory placeholder:text-stone-700 px-4 py-3 focus:outline-none focus:border-champagne/50 resize-none leading-relaxed"
            />
          </div>

          <p className="text-[10px] text-stone-600 leading-relaxed italic">
            This is an appointment request, not a confirmed booking. The TSquare team will contact you to finalise the date and time.
          </p>
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-5 py-3.5 text-xs uppercase tracking-widest text-stone-400 hover:text-warm-ivory border border-stone-800 hover:border-stone-600 rounded-2xl transition-all duration-200"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </button>
        <button
          onClick={onContinue}
          disabled={!appt.type}
          className={cn(
            "flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-8 py-3.5 text-xs uppercase tracking-[0.2em] font-bold rounded-2xl transition-all duration-200",
            appt.type
              ? "bg-champagne text-near-black hover:bg-champagne-light"
              : "bg-stone-900 text-stone-600 cursor-not-allowed"
          )}
        >
          Continue
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
