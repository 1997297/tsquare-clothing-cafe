"use client";

import { ArrowRight, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { BespokeConfiguration, FabricOption } from "@/types/bespoke";
import { getFabricsForCategory } from "@/data/bespoke-data";

interface FabricStepProps {
  config: BespokeConfiguration;
  onSelect: (fabric: FabricOption) => void;
  onContinue: () => void;
  onBack: () => void;
}

export function FabricStep({
  config,
  onSelect,
  onContinue,
  onBack,
}: FabricStepProps) {
  const category = config.garmentCategory ?? "agbada";
  const fabrics = getFabricsForCategory(category);
  const selectedId = config.fabric?.id;

  return (
    <div className="animate-in fade-in duration-300">
      <p className="text-[10px] uppercase font-mono tracking-[0.28em] text-champagne mb-3">
        02 / Fabric
      </p>
      <h1 className="font-display text-3xl sm:text-4xl text-warm-ivory font-normal mb-2">
        Choose Your Fabric.
      </h1>
      <p className="text-sm text-stone-400 font-sans leading-relaxed mb-10">
        Each fabric brings its own character. Select the one that best suits your occasion and personal expression.
      </p>

      <div className="space-y-3 mb-10">
        {fabrics.map((fabric) => {
          const isSelected = selectedId === fabric.id;
          return (
            <button
              key={fabric.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onSelect(fabric)}
              className={cn(
                "w-full text-left p-5 rounded-2xl border transition-all duration-200 group",
                isSelected
                  ? "border-champagne/60 bg-stone-900/60 ring-1 ring-champagne/20"
                  : "border-stone-800 hover:border-stone-700 hover:bg-stone-900/30"
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <p className={cn(
                      "text-sm font-semibold uppercase tracking-wide transition-colors",
                      isSelected ? "text-champagne" : "text-warm-ivory group-hover:text-champagne"
                    )}>
                      {fabric.name}
                    </p>
                    {fabric.weight && (
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-stone-900 border border-stone-700 text-stone-400 uppercase tracking-wider">
                        {fabric.weight}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-stone-400 leading-relaxed">
                    {fabric.description}
                  </p>
                  {fabric.finish && (
                    <p className="text-[10px] text-stone-600 mt-2 uppercase tracking-widest">
                      Finish: {fabric.finish}
                    </p>
                  )}
                </div>

                {/* Selection indicator */}
                <div className={cn(
                  "flex-shrink-0 w-5 h-5 rounded-full border-2 transition-all duration-200 mt-0.5",
                  isSelected
                    ? "border-champagne bg-champagne"
                    : "border-stone-700 bg-transparent"
                )}>
                  {isSelected && (
                    <svg viewBox="0 0 10 10" className="w-full h-full fill-near-black p-0.5">
                      <path d="M1.5 5l2.5 2.5L8.5 2.5" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <p className="text-[10px] text-stone-600 italic mb-6 leading-relaxed">
        These fabrics are representative options. Exact availability and sourcing will be confirmed during your TSquare consultation.
      </p>

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
          disabled={!config.fabric}
          className={cn(
            "flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-8 py-3.5 text-xs uppercase tracking-[0.2em] font-bold rounded-2xl transition-all duration-200",
            config.fabric
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
