"use client";

import { ArrowRight, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { BespokeConfiguration } from "@/types/bespoke";
import { FIT_OPTIONS } from "@/data/bespoke-data";

interface FitStepProps {
  config: BespokeConfiguration;
  onSelect: (fit: "tailored" | "regular" | "relaxed") => void;
  onContinue: () => void;
  onBack: () => void;
}

// Subtle silhouette icons for each fit type
const FitIcon = ({ type }: { type: string }) => {
  if (type === "tailored") {
    return (
      <svg viewBox="0 0 40 60" className="w-10 h-14 fill-current" aria-hidden>
        <rect x="13" y="0" width="14" height="18" rx="4" />
        <path d="M8 18 L13 18 L13 42 L20 42 L27 42 L27 18 L32 18 L36 60 L24 60 L20 50 L16 60 L4 60 Z" />
      </svg>
    );
  }
  if (type === "regular") {
    return (
      <svg viewBox="0 0 44 60" className="w-10 h-14 fill-current" aria-hidden>
        <rect x="14" y="0" width="16" height="18" rx="4" />
        <path d="M6 18 L14 18 L14 42 L22 42 L30 42 L30 18 L38 18 L40 60 L28 60 L22 50 L16 60 L4 60 Z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 52 60" className="w-10 h-14 fill-current" aria-hidden>
      <rect x="16" y="0" width="20" height="18" rx="5" />
      <path d="M2 18 L16 18 L16 42 L26 42 L36 42 L36 18 L50 18 L50 60 L32 60 L26 50 L20 60 L2 60 Z" />
    </svg>
  );
};

export function FitStep({
  config,
  onSelect,
  onContinue,
  onBack,
}: FitStepProps) {
  const selected = config.fitPreference;

  return (
    <div className="animate-in fade-in duration-300">
      <p className="text-[10px] uppercase font-mono tracking-[0.28em] text-champagne mb-3">
        05 / Fit
      </p>
      <h1 className="font-display text-3xl sm:text-4xl text-warm-ivory font-normal mb-2">
        How do you like your clothes to fit?
      </h1>
      <p className="text-sm text-stone-400 font-sans leading-relaxed mb-10">
        Your fit preference shapes the entire silhouette. Our tailors use this as the starting point, refining further at each fitting.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        {FIT_OPTIONS.map((fit) => {
          const isSelected = selected === fit.id;
          return (
            <button
              key={fit.id}
              onClick={() => onSelect(fit.id)}
              className={cn(
                "relative flex flex-col items-center text-center p-6 rounded-2xl border transition-all duration-200 group",
                isSelected
                  ? "border-champagne/60 bg-stone-900/70 ring-1 ring-champagne/20"
                  : "border-stone-800 hover:border-stone-700 hover:bg-stone-900/30"
              )}
            >
              {/* Silhouette icon */}
              <div className={cn(
                "mb-4 transition-colors duration-200",
                isSelected ? "text-champagne" : "text-stone-700 group-hover:text-stone-500"
              )}>
                <FitIcon type={fit.id} />
              </div>

              {/* Label */}
              <p className={cn(
                "text-sm font-semibold uppercase tracking-widest mb-2 transition-colors",
                isSelected ? "text-champagne" : "text-warm-ivory"
              )}>
                {fit.label}
              </p>

              {/* Description */}
              <p className="text-[11px] text-stone-500 leading-relaxed">
                {fit.description}
              </p>

              {/* Selection ring */}
              {isSelected && (
                <div className="absolute top-3 right-3 w-4 h-4 rounded-full bg-champagne flex items-center justify-center">
                  <svg viewBox="0 0 10 10" className="w-2.5 h-2.5">
                    <path d="M1.5 5l2.5 2.5L8.5 2.5" stroke="#11110F" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>

      <p className="text-[10px] text-stone-600 italic mb-8 leading-relaxed">
        This preference guides your pattern — final fit is always refined through progressive fitting appointments.
      </p>

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
          disabled={!config.fitPreference}
          className={cn(
            "flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-8 py-3.5 text-xs uppercase tracking-[0.2em] font-bold rounded-2xl transition-all duration-200",
            config.fitPreference
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
