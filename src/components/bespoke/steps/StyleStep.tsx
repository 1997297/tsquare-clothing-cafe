"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Shuffle } from "lucide-react";
import { cn } from "@/lib/utils";
import { BespokeConfiguration } from "@/types/bespoke";
import { Style, ProductCategory } from "@/types";
import { GARMENT_CATEGORIES } from "@/data/bespoke-data";

interface StyleStepProps {
  config: BespokeConfiguration;
  style?: Style; // undefined on idea path
  onContinue: () => void;
  onSelectCategory: (cat: ProductCategory) => void;
}

export function StyleStep({
  config,
  style,
  onContinue,
  onSelectCategory,
}: StyleStepProps) {
  // ── Idea path: category selection ────────────
  if (config.isIdeaPath) {
    return (
      <div className="animate-in fade-in duration-300">
        <p className="text-[10px] uppercase font-mono tracking-[0.28em] text-champagne mb-3">
          01 / Style
        </p>
        <h1 className="font-display text-3xl sm:text-4xl text-warm-ivory font-normal mb-3">
          What would you like us to create?
        </h1>
        <p className="text-sm text-stone-400 font-sans leading-relaxed mb-10">
          Choose the garment type that best represents your vision. Our team will guide the rest.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          {GARMENT_CATEGORIES.map((cat) => {
            const isSelected = config.garmentCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className={cn(
                  "relative overflow-hidden rounded-2xl border text-left transition-all duration-200 group",
                  isSelected
                    ? "border-champagne/60 ring-1 ring-champagne/30"
                    : "border-stone-800 hover:border-stone-600"
                )}
              >
                <div className="relative h-40 w-full bg-espresso">
                  <Image
                    src={cat.image}
                    alt={cat.label}
                    fill
                    className="object-cover object-top group-hover:scale-[1.02] transition-transform duration-500"
                    sizes="(max-width: 640px) 100vw, 50vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-near-black/90 via-near-black/30 to-transparent" />
                  {isSelected && (
                    <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-champagne flex items-center justify-center">
                      <svg viewBox="0 0 10 10" className="w-3 h-3 fill-near-black">
                        <path d="M1.5 5l2.5 2.5L8.5 2.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className={cn(
                    "text-sm font-semibold uppercase tracking-widest mb-1 transition-colors",
                    isSelected ? "text-champagne" : "text-warm-ivory"
                  )}>
                    {cat.label}
                  </p>
                  <p className="text-[11px] text-stone-400 leading-snug line-clamp-2">
                    {cat.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        <button
          onClick={onContinue}
          disabled={!config.garmentCategory}
          className={cn(
            "w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 text-xs uppercase tracking-[0.2em] font-bold rounded-2xl transition-all duration-200",
            config.garmentCategory
              ? "bg-champagne text-near-black hover:bg-champagne-light"
              : "bg-stone-900 text-stone-600 cursor-not-allowed"
          )}
        >
          Continue
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // ── Style path: confirmation ──────────────────
  if (!style) return null;

  return (
    <div className="animate-in fade-in duration-300">
      <p className="text-[10px] uppercase font-mono tracking-[0.28em] text-champagne mb-3">
        01 / Style
      </p>
      <h1 className="font-display text-3xl sm:text-4xl text-warm-ivory font-normal mb-2">
        Make It Yours.
      </h1>
      <p className="text-sm text-stone-400 font-sans leading-relaxed mb-10">
        We&apos;ll use this piece as the foundation and tailor the details around you.
      </p>

      {/* Style card */}
      <div className="flex flex-col sm:flex-row gap-6 p-5 bg-[#141412] border border-stone-800/60 rounded-2xl mb-8">
        {/* Image */}
        <div className="relative w-full sm:w-32 h-48 sm:h-40 rounded-xl overflow-hidden shrink-0 bg-espresso">
          <Image
            src={style.images[0]}
            alt={style.name}
            fill
            className="object-cover object-top"
            sizes="(max-width: 640px) 100vw, 128px"
          />
        </div>

        {/* Info */}
        <div className="flex flex-col justify-between py-1">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-champagne mb-1">
              {style.code}
            </p>
            <h2 className="text-lg font-display text-warm-ivory mb-2 leading-tight">
              {style.name}
            </h2>
            <p className="text-xs text-stone-400 leading-relaxed mb-3">
              {style.description}
            </p>
            <div className="flex flex-wrap gap-1.5">
              <span className="px-2.5 py-1 rounded-full bg-stone-900 text-[10px] text-stone-300 uppercase tracking-wider border border-stone-800">
                {style.categoryLabel}
              </span>
              {style.occasions.slice(0, 2).map((occ) => (
                <span
                  key={occ}
                  className="px-2.5 py-1 rounded-full bg-stone-900/60 text-[10px] text-stone-500 uppercase tracking-wider border border-stone-800/60"
                >
                  {occ}
                </span>
              ))}
            </div>
          </div>

          <Link
            href="/styles"
            className="mt-4 inline-flex items-center gap-1.5 text-[10px] text-stone-500 hover:text-stone-300 uppercase tracking-widest transition-colors"
          >
            <Shuffle className="w-3 h-3" />
            Choose a Different Style
          </Link>
        </div>
      </div>

      {/* Colour preview if available */}
      {style.availableColours.length > 0 && (
        <div className="mb-8 p-4 bg-[#141412] border border-stone-800/60 rounded-xl">
          <p className="text-[10px] uppercase tracking-widest text-stone-500 mb-3">
            Starting Colours Available
          </p>
          <div className="flex flex-wrap gap-2">
            {style.availableColours.map((c) => (
              <div key={c.name} className="flex items-center gap-1.5">
                <span
                  className="w-4 h-4 rounded-full border border-white/20"
                  style={{ background: c.hex }}
                  title={c.name}
                />
                <span className="text-[10px] text-stone-400">{c.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={onContinue}
        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 text-xs uppercase tracking-[0.2em] font-bold rounded-2xl bg-champagne text-near-black hover:bg-champagne-light transition-all duration-200"
      >
        Continue
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
