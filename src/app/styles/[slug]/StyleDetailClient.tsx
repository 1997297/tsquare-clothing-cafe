"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Heart,
  Calendar,
  Sparkles,
  ShieldCheck,
  Ruler,
  Clock,
  ArrowRight,
  ArrowLeft,
  Check,
} from "lucide-react";
import { Style } from "@/types";
import { Button } from "@/components/common/Button";
import { StyleCard } from "@/components/features/styles/StyleCard";
import { useSavedStyles } from "@/lib/saved-store";
import { cn } from "@/lib/utils";

interface StyleDetailClientProps {
  style: Style;
  relatedStyles: Style[];
}

export default function StyleDetailClient({
  style,
  relatedStyles,
}: StyleDetailClientProps) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const { isSaved, toggle } = useSavedStyles();
  const saved = isSaved(style.id);

  return (
    <div className="bg-near-black min-h-screen text-warm-ivory pt-24 sm:pt-32 pb-24 selection:bg-champagne selection:text-near-black font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-[10px] uppercase font-mono tracking-[0.22em] text-stone-500 mb-8 sm:mb-12">
          <Link href="/collections" className="hover:text-warm-ivory transition-colors">
            Collections
          </Link>
          <span>/</span>
          <Link
            href={`/collections/${style.category}`}
            className="hover:text-warm-ivory transition-colors text-stone-400"
          >
            {style.categoryLabel}
          </Link>
          <span>/</span>
          <span className="text-champagne font-semibold">{style.code}</span>
        </div>

        {/* Top Split: Gallery & Atelier Specs */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Gallery (7 Columns) with Rounded-3xl */}
          <div className="lg:col-span-7 space-y-4">
            {/* Main Featured Photo */}
            <div className="relative aspect-[3/4] w-full overflow-hidden bg-espresso fine-border rounded-3xl shadow-xl">
              <Image
                src={style.images[activeImageIndex] || style.images[0]}
                alt={`${style.name}, view ${activeImageIndex + 1}`}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 60vw"
                className="object-cover object-top transition-all duration-500"
              />
              <div className="absolute top-4 left-4 bg-near-black/85 backdrop-blur-md px-3.5 py-1 text-[10px] uppercase font-mono tracking-[0.25em] text-warm-ivory rounded-full border border-stone-800">
                {style.code}
              </div>
            </div>

            {/* Thumbnail Selectors if multiple images exist */}
            {style.images.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-2">
                {style.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    aria-label={`View photo ${idx + 1}`}
                    className={cn(
                      "relative h-24 w-20 shrink-0 overflow-hidden fine-border rounded-xl transition-all focus:outline-none",
                      activeImageIndex === idx
                        ? "ring-2 ring-champagne border-champagne opacity-100 scale-105"
                        : "opacity-60 hover:opacity-90"
                    )}
                  >
                    <Image
                      src={img}
                      alt={`${style.name} thumbnail ${idx + 1}`}
                      fill
                      className="object-cover object-top"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Style Specifications & Actions (5 Columns) */}
          <div className="lg:col-span-5 space-y-8 sticky top-24">
            {/* Header Identity */}
            <div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-[10px] uppercase font-mono tracking-[0.3em] text-champagne font-semibold">
                  {style.collection}
                </span>
                <span className="text-[10px] uppercase tracking-widest text-stone-500 font-mono">
                  {style.leadTimeWeeks || 3} Weeks Bespoke
                </span>
              </div>

              <h1 className="mt-2 font-display text-3xl sm:text-4xl lg:text-5xl font-normal text-warm-ivory tracking-tight">
                {style.name}
              </h1>

              <div className="mt-2 text-xs font-mono text-stone-400 tracking-widest">
                Code: {style.code}
              </div>
            </div>

            {/* Editorial Overview */}
            <div className="border-t border-b border-stone-800/80 py-6 space-y-4">
              <p className="text-sm sm:text-base text-stone-300 font-sans font-light leading-relaxed">
                {style.longDescription || style.description}
              </p>

              {style.craftsmanshipHighlights && style.craftsmanshipHighlights.length > 0 && (
                <div className="pt-2 space-y-2">
                  <span className="text-[10px] uppercase font-mono tracking-[0.25em] text-stone-400 font-semibold block">
                    Atelier Distinctions
                  </span>
                  <ul className="space-y-1.5">
                    {style.craftsmanshipHighlights.map((hl, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-stone-400">
                        <Check className="h-3.5 w-3.5 text-champagne shrink-0 mt-0.5" />
                        <span>{hl}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Fabric & Fit Specifications with Rounded-2xl */}
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-stone-950 fine-border rounded-2xl space-y-1">
                <span className="text-[10px] uppercase font-mono tracking-[0.25em] text-stone-400 font-semibold block">
                  Fabric Architecture
                </span>
                <p className="text-stone-300 font-light leading-relaxed">
                  {style.fabricInformation}
                </p>
              </div>

              <div className="p-4 bg-stone-950 fine-border rounded-2xl space-y-1">
                <span className="text-[10px] uppercase font-mono tracking-[0.25em] text-stone-400 font-semibold block">
                  Anatomical Cut & Fit
                </span>
                <p className="text-stone-300 font-light leading-relaxed">
                  {style.fitInformation}
                </p>
              </div>
            </div>

            {/* Available Palettes with Rounded-xl */}
            {style.availableColours.length > 0 && (
              <div>
                <span className="text-[10px] uppercase font-mono tracking-[0.25em] text-stone-400 font-semibold block mb-3">
                  Available Colorways
                </span>
                <div className="flex flex-wrap gap-2">
                  {style.availableColours.map((c, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 px-3 py-1.5 bg-stone-900/60 border border-stone-800 text-xs text-stone-300 rounded-xl"
                    >
                      <span
                        className="h-3 w-3 rounded-full border border-stone-600"
                        style={{ backgroundColor: c.hex }}
                      />
                      <span>{c.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommended Occasions with Rounded-full */}
            <div>
              <span className="text-[10px] uppercase font-mono tracking-[0.25em] text-stone-400 font-semibold block mb-3">
                Recommended Occasions
              </span>
              <div className="flex flex-wrap gap-2">
                {style.occasions.map((occ, i) => (
                  <span
                    key={i}
                    className="px-3.5 py-1 border border-stone-800 text-[10px] uppercase tracking-wider text-stone-400 rounded-full"
                  >
                    {occ}
                  </span>
                ))}
              </div>
            </div>

            {/* Primary Action Buttons: MAKE THIS MINE */}
            <div className="pt-4 space-y-3">
              <Button
                href={`/bespoke/create/${style.slug}`}
                variant="champagne"
                size="xl"
                fullWidth
                className="font-bold tracking-[0.25em] rounded-2xl shadow-lg"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                MAKE THIS MINE
              </Button>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => toggle(style.id)}
                  className="text-warm-ivory border-stone-700 hover:bg-stone-900 rounded-xl"
                >
                  <Heart
                    className={cn(
                      "mr-2 h-4 w-4",
                      saved ? "fill-champagne text-champagne" : ""
                    )}
                  />
                  {saved ? "Saved in Wardrobe" : "Save Look"}
                </Button>

                <Button
                  href={`/book-a-fitting?style=${encodeURIComponent(style.code)}`}
                  variant="secondary"
                  size="md"
                  className="bg-stone-800 text-warm-ivory border-stone-700 hover:bg-stone-700 rounded-xl"
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Book Fitting
                </Button>
              </div>

              <p className="text-[10px] text-center text-stone-500 font-mono tracking-widest pt-1">
                Zero Mass Production • Individually Tailored at TCC
              </p>
            </div>
          </div>
        </div>

        {/* Related Styles Section */}
        {relatedStyles.length > 0 && (
          <div className="mt-28 pt-16 border-t border-stone-900">
            <div className="flex items-center justify-between mb-10">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-[0.25em] text-champagne font-semibold">
                  Complementary Looks
                </span>
                <h2 className="font-display text-2xl sm:text-3xl text-warm-ivory mt-1">
                  You May Also Admire
                </h2>
              </div>
              <Link
                href={`/collections/${style.category}`}
                className="text-xs uppercase tracking-widest text-stone-400 hover:text-champagne transition-colors inline-flex items-center"
              >
                View {style.categoryLabel} Archive <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
              {relatedStyles.map((rel) => (
                <StyleCard key={rel.id} style={rel} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
