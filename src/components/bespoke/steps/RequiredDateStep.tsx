"use client";

import { ArrowRight, ArrowLeft, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { BespokeConfiguration } from "@/types/bespoke";

interface RequiredDateStepProps {
  config: BespokeConfiguration;
  onDateChange: (date: string) => void;
  onContinue: () => void;
  onBack: () => void;
}

export function RequiredDateStep({
  config,
  onDateChange,
  onContinue,
  onBack,
}: RequiredDateStepProps) {
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const threeWeeksOut = new Date(today);
  threeWeeksOut.setDate(today.getDate() + 21);

  const selectedDate = config.requiredDate ? new Date(config.requiredDate) : null;
  const isUrgent = selectedDate !== null && selectedDate <= threeWeeksOut && selectedDate > today;
  const isPast = selectedDate !== null && selectedDate <= today;

  return (
    <div className="animate-in fade-in duration-300">
      <p className="text-[10px] uppercase font-mono tracking-[0.28em] text-champagne mb-3">
        08 / Date
      </p>
      <h1 className="font-display text-3xl sm:text-4xl text-warm-ivory font-normal mb-2">
        When do you need it?
      </h1>
      <p className="text-sm text-stone-400 font-sans leading-relaxed mb-10">
        Let us know your preferred completion date. All dates are subject to confirmation by the TSquare team based on current atelier capacity.
      </p>

      <div className="mb-6">
        <label
          htmlFor="required-date"
          className="block text-[10px] uppercase tracking-widest text-stone-500 mb-2"
        >
          Required By
        </label>
        <input
          id="required-date"
          type="date"
          value={config.requiredDate ?? ""}
          min={todayStr}
          onChange={(e) => onDateChange(e.target.value)}
          className={cn(
            "w-full sm:w-72 bg-stone-950 border rounded-xl text-sm text-warm-ivory px-4 py-3.5 focus:outline-none transition-colors",
            isPast
              ? "border-amber-700/60 focus:border-amber-500"
              : "border-stone-800 focus:border-champagne/50"
          )}
        />
        {isPast && (
          <p className="text-[11px] text-amber-500 mt-2">
            Please select a future date.
          </p>
        )}
      </div>

      {/* Advisory for close dates */}
      {isUrgent && !isPast && (
        <div className="flex gap-3 p-4 bg-stone-900/50 border border-stone-700/60 rounded-xl mb-8 animate-in fade-in duration-200">
          <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-stone-400 leading-relaxed">
            This date may require special confirmation from the TSquare team. We will review your request and reach out promptly to discuss the timeline.
          </p>
        </div>
      )}

      {/* Lead time note */}
      <div className="mb-10 p-5 bg-stone-950 border border-stone-800/50 rounded-xl">
        <p className="text-[10px] uppercase tracking-widest text-stone-600 mb-2 font-mono">
          Typical Atelier Lead Times
        </p>
        <div className="space-y-1.5 text-xs text-stone-500">
          <div className="flex justify-between">
            <span>Senator and Kaftan</span>
            <span className="text-stone-400">2 to 3 weeks</span>
          </div>
          <div className="flex justify-between">
            <span>Agbada and Traditional</span>
            <span className="text-stone-400">3 to 4 weeks</span>
          </div>
          <div className="flex justify-between">
            <span>Full Bespoke Suiting</span>
            <span className="text-stone-400">4 to 6 weeks</span>
          </div>
        </div>
        <p className="text-[10px] text-stone-700 mt-3 leading-relaxed">
          These are indicative ranges. Your actual timeline will be confirmed by TSquare after reviewing your request.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-5 py-3.5 text-xs uppercase tracking-widest text-stone-400 hover:text-warm-ivory border border-stone-800 hover:border-stone-600 rounded-2xl transition-all duration-200"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </button>
        <button
          type="button"
          onClick={onContinue}
          disabled={!config.requiredDate || isPast}
          className={cn(
            "flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-8 py-3.5 text-xs uppercase tracking-[0.2em] font-bold rounded-2xl transition-all duration-200",
            config.requiredDate && !isPast
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
