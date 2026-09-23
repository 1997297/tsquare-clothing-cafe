"use client";

import { ArrowRight, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { BespokeConfiguration } from "@/types/bespoke";
import { OCCASIONS } from "@/data/bespoke-data";

interface OccasionStepProps {
  config: BespokeConfiguration;
  onOccasionSelect: (id: string) => void;
  onEventNameChange: (name: string) => void;
  onEventDateChange: (date: string) => void;
  onContinue: () => void;
  onBack: () => void;
}

export function OccasionStep({
  config,
  onOccasionSelect,
  onEventNameChange,
  onEventDateChange,
  onContinue,
  onBack,
}: OccasionStepProps) {
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="animate-in fade-in duration-300">
      <p className="text-[10px] uppercase font-mono tracking-[0.28em] text-champagne mb-3">
        07 / Occasion
      </p>
      <h1 className="font-display text-3xl sm:text-4xl text-warm-ivory font-normal mb-2">
        What Are We Dressing You For?
      </h1>
      <p className="text-sm text-stone-400 font-sans leading-relaxed mb-10">
        The occasion shapes every choice — from fabric weight to embroidery density.
      </p>

      {/* Occasion grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
        {OCCASIONS.map((occ) => {
          const isSelected = config.occasion === occ.id;
          return (
            <button
              key={occ.id}
              onClick={() => onOccasionSelect(occ.id)}
              className={cn(
                "px-4 py-3.5 rounded-xl border text-left text-xs transition-all duration-200",
                isSelected
                  ? "border-champagne/60 bg-stone-900/70 text-champagne ring-1 ring-champagne/20"
                  : "border-stone-800 text-stone-300 hover:border-stone-700 hover:bg-stone-900/30 hover:text-warm-ivory"
              )}
            >
              {occ.label}
            </button>
          );
        })}
      </div>

      {/* Optional event details */}
      {config.occasion && (
        <div className="space-y-4 mb-8 p-5 bg-[#141412] border border-stone-800/50 rounded-2xl animate-in fade-in duration-200">
          <p className="text-[10px] uppercase tracking-widest text-stone-500 font-mono">
            Event Details (Optional)
          </p>
          <div>
            <label
              htmlFor="event-name"
              className="block text-[10px] uppercase tracking-widest text-stone-500 mb-2"
            >
              Event Name
            </label>
            <input
              id="event-name"
              type="text"
              value={config.eventName ?? ""}
              onChange={(e) => onEventNameChange(e.target.value)}
              placeholder="e.g. The Adeyemi Wedding, Lagos"
              className="w-full bg-near-black border border-stone-800 rounded-xl text-xs text-warm-ivory placeholder:text-stone-700 px-4 py-3 focus:outline-none focus:border-champagne/50"
            />
          </div>
          <div>
            <label
              htmlFor="event-date"
              className="block text-[10px] uppercase tracking-widest text-stone-500 mb-2"
            >
              Event Date
            </label>
            <input
              id="event-date"
              type="date"
              value={config.eventDate ?? ""}
              min={today}
              onChange={(e) => onEventDateChange(e.target.value)}
              className="w-full bg-near-black border border-stone-800 rounded-xl text-xs text-warm-ivory px-4 py-3 focus:outline-none focus:border-champagne/50"
            />
          </div>
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
          disabled={!config.occasion}
          className={cn(
            "flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-8 py-3.5 text-xs uppercase tracking-[0.2em] font-bold rounded-2xl transition-all duration-200",
            config.occasion
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
