"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { X, Check, ArrowRight } from "lucide-react";
import { Style } from "@/types";
import { Button } from "@/components/common/Button";
import { useSavedStyles } from "@/lib/saved-store";

interface MakeThisMineModalProps {
  style: Style;
  isOpen: boolean;
  onClose: () => void;
}

export function MakeThisMineModal({ style, isOpen, onClose }: MakeThisMineModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const { isSaved, toggle } = useSavedStyles();
  const saved = isSaved(style.id);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="bespoke-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-near-black/85 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
      />

      {/* Modal Dialog Content with Rounded-3xl */}
      <div
        ref={modalRef}
        className="relative z-10 w-full max-w-2xl bg-stone-950 border border-stone-800 shadow-2xl p-6 sm:p-10 text-warm-ivory rounded-3xl animate-in zoom-in-95 duration-200 my-8"
      >
        {/* Close Button with Rounded-full */}
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-5 right-5 p-2.5 text-stone-400 hover:text-warm-ivory hover:bg-stone-800/80 rounded-full transition-colors focus:outline-none"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Brand Eyebrow */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] uppercase font-mono tracking-[0.25em] text-champagne font-semibold">
            Bespoke Commission
          </span>
          <span className="text-stone-600">•</span>
          <span className="text-[10px] uppercase font-mono tracking-widest text-stone-400">
            {style.code}
          </span>
        </div>

        <h2
          id="bespoke-modal-title"
          className="font-display text-2xl sm:text-3xl font-medium tracking-tight text-warm-ivory"
        >
          Make This Mine: {style.name}
        </h2>

        <p className="mt-3 text-sm text-stone-300 font-sans font-light leading-relaxed">
          At TSquare Clothing Cafe, garments are never mass-produced. Each piece begins with personal consultation, bespoke measurements, and master tailoring at TCC.
        </p>

        {/* The 4-Step Bespoke Journey Preview with Rounded-2xl cards */}
        <div className="mt-8 border-t border-b border-stone-800/80 py-6 space-y-4">
          <div className="text-[11px] uppercase tracking-[0.2em] font-semibold text-stone-400 mb-2">
            The Commission Pathway
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-4 bg-stone-900/40 border border-stone-800/60 rounded-2xl">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center bg-champagne/10 border border-champagne/30 text-champagne text-xs font-bold font-mono rounded-lg">
                01
              </span>
              <div>
                <h4 className="text-xs font-semibold text-warm-ivory tracking-wide uppercase">
                  Style Archetype Selected
                </h4>
                <p className="text-[11px] text-stone-400 mt-0.5">
                  Locked to {style.code} ({style.categoryLabel})
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-stone-900/40 border border-stone-800/60 rounded-2xl">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center bg-stone-800 border border-stone-700 text-stone-300 text-xs font-bold font-mono rounded-lg">
                02
              </span>
              <div>
                <h4 className="text-xs font-semibold text-warm-ivory tracking-wide uppercase">
                  Measurement & Posture
                </h4>
                <p className="text-[11px] text-stone-400 mt-0.5">
                  In-person at the TCC office or guided digital profile
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-stone-900/40 border border-stone-800/60 rounded-2xl">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center bg-stone-800 border border-stone-700 text-stone-300 text-xs font-bold font-mono rounded-lg">
                03
              </span>
              <div>
                <h4 className="text-xs font-semibold text-warm-ivory tracking-wide uppercase">
                  Fabric & Custom Details
                </h4>
                <p className="text-[11px] text-stone-400 mt-0.5">
                  Threadwork density, lining, collar curvature
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-stone-900/40 border border-stone-800/60 rounded-2xl">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center bg-stone-800 border border-stone-700 text-stone-300 text-xs font-bold font-mono rounded-lg">
                04
              </span>
              <div>
                <h4 className="text-xs font-semibold text-warm-ivory tracking-wide uppercase">
                  Artisanal Production
                </h4>
                <p className="text-[11px] text-stone-400 mt-0.5">
                  {style.leadTimeWeeks || 3} weeks hand tailoring + fittings
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <Button
            href={`/bespoke/create/${style.slug}`}
            variant="champagne"
            size="lg"
            className="flex-1"
            onClick={onClose}
          >
            <ArrowRight className="mr-2 h-4 w-4" />
            Begin Configuration
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={() => {
              toggle(style.id);
            }}
            className="sm:w-auto text-warm-ivory border-stone-700 hover:bg-stone-800"
          >
            {saved ? (
              <>
                <Check className="mr-2 h-4 w-4 text-champagne" />
                Saved In Wardrobe
              </>
            ) : (
              "Save For Later"
            )}
          </Button>
        </div>

        <div className="mt-4 text-center">
          <Link
            href="/bespoke/process"
            onClick={onClose}
            className="inline-flex items-center text-xs text-stone-400 hover:text-champagne transition-colors uppercase tracking-[0.18em]"
          >
            Read Our Full Bespoke Process
            <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
