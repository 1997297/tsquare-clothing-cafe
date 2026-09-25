"use client";

import { ArrowRight, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { BespokeConfiguration, ColourOption } from "@/types/bespoke";
import { COLOURS } from "@/data/bespoke-data";

interface ColourStepProps {
  config: BespokeConfiguration;
  onSelect: (colour: ColourOption) => void;
  onContinue: () => void;
  onBack: () => void;
}

const COLOUR_GROUPS = ["Neutrals", "Warm Tones", "Cool Tones", "Deep Tones"];

export function ColourStep({
  config,
  onSelect,
  onContinue,
  onBack,
}: ColourStepProps) {
  const selectedId = config.colour?.id;

  return (
    <div className="animate-in fade-in duration-300">
      <p className="text-[10px] uppercase font-mono tracking-[0.28em] text-champagne mb-3">
        03 / Colour
      </p>
      <h1 className="font-display text-3xl sm:text-4xl text-warm-ivory font-normal mb-2">
        Set The Tone.
      </h1>
      <p className="text-sm text-stone-400 font-sans leading-relaxed mb-10">
        Colour is the first thing the room notices. Choose the tone that speaks before you speak.
      </p>

      <div className="space-y-8 mb-10">
        {COLOUR_GROUPS.map((group) => {
          const groupColours = COLOURS.filter((c) => c.group === group);
          if (!groupColours.length) return null;
          return (
            <div key={group}>
              <p className="text-[10px] uppercase tracking-[0.25em] text-stone-600 font-mono mb-4">
                {group}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {groupColours.map((colour) => {
                  const isSelected = selectedId === colour.id;
                  const isLight =
                    colour.hex === "#F3EFE7" ||
                    colour.hex === "#C7B9A3" ||
                    colour.hex === "#A79C8C" ||
                    colour.hex === "#DDD7CE";

                  return (
                    <button
                      key={colour.id}
                      type="button"
                      aria-pressed={isSelected}
                      aria-label={`${colour.name} colour`}
                      onClick={() => onSelect(colour)}
                      className={cn(
                        "flex items-center gap-3 p-3.5 rounded-xl border transition-all duration-200 text-left group",
                        isSelected
                          ? "border-champagne/60 bg-stone-900/60 ring-1 ring-champagne/20"
                          : "border-stone-800 hover:border-stone-700 hover:bg-stone-900/30"
                      )}
                    >
                      {/* Swatch */}
                      <div
                        className={cn(
                          "w-8 h-8 rounded-full flex-shrink-0 border transition-all duration-200",
                          isSelected ? "scale-110" : "group-hover:scale-105",
                          isLight ? "border-stone-600" : "border-warm-ivory/10"
                        )}
                        style={{ background: colour.hex }}
                      />
                      {/* Name */}
                      <span className={cn(
                        "text-xs leading-tight transition-colors",
                        isSelected ? "text-champagne font-medium" : "text-stone-300"
                      )}>
                        {colour.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected preview */}
      {config.colour && (
        <div className="flex items-center gap-3 px-4 py-3 mb-8 rounded-xl bg-stone-900/60 border border-stone-800/60">
          <div
            className="w-6 h-6 rounded-full border border-warm-ivory/15 flex-shrink-0"
            style={{ background: config.colour.hex }}
          />
          <div>
            <p className="text-xs text-warm-ivory font-medium">{config.colour.name}</p>
            <p className="text-[10px] text-stone-500">Selected colour</p>
          </div>
        </div>
      )}

      <p className="text-[10px] text-stone-600 italic mb-6 leading-relaxed">
        Colour accuracy may vary between screens. Final colour will be confirmed with physical swatches at your TSquare consultation.
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
          disabled={!config.colour}
          className={cn(
            "flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-8 py-3.5 text-xs uppercase tracking-[0.2em] font-bold rounded-2xl transition-all duration-200",
            config.colour
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
