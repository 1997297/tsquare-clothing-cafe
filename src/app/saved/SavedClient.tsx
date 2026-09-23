"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, Trash2, Sparkles, Calendar, ArrowRight } from "lucide-react";
import { useSavedStyles } from "@/lib/saved-store";
import { Button } from "@/components/common/Button";
import { StyleCard } from "@/components/features/styles/StyleCard";

export default function SavedClient() {
  const { savedStyles, count, isLoaded, remove } = useSavedStyles();

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-near-black py-36 text-center text-stone-400">
        Loading saved wardrobe looks...
      </div>
    );
  }

  return (
    <div className="bg-near-black min-h-screen text-warm-ivory pt-28 sm:pt-36 pb-24 selection:bg-champagne selection:text-near-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="border-b border-stone-800/80 pb-8 mb-12 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-[10px] uppercase font-mono tracking-[0.3em] text-champagne font-semibold block mb-2">
              Private Client Consultation Curation
            </span>
            <h1 className="font-display text-4xl sm:text-5xl font-normal tracking-tight text-warm-ivory">
              Saved Looks
            </h1>
          </div>

          <div className="text-xs font-mono text-stone-400 uppercase tracking-widest">
            {count} {count === 1 ? "Piece Saved" : "Pieces Saved"}
          </div>
        </div>

        {/* Phase 1 Architecture Notice */}
        <div className="mb-12 p-4 bg-stone-950 fine-border rounded-2xl text-xs text-stone-400 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-champagne shrink-0" />
            <span>
              Your saved looks are temporarily preserved for this session. When Phase 2 customer accounts launch, your saved looks will automatically synchronize with your permanent digital wardrobe.
            </span>
          </div>
          <Link
            href="/auth/create-account"
            className="text-[10px] uppercase font-mono tracking-widest text-champagne hover:underline shrink-0"
          >
            Create Account →
          </Link>
        </div>

        {/* Content */}
        {savedStyles.length === 0 ? (
          <div className="py-24 text-center fine-border rounded-3xl bg-stone-950 p-12 max-w-2xl mx-auto">
            <Heart className="h-12 w-12 text-stone-600 mx-auto stroke-[1.2]" />
            <h3 className="font-display text-2xl text-warm-ivory mt-4">
              Your saved looks are currently empty
            </h3>
            <p className="mt-2 text-sm text-stone-400 font-light leading-relaxed">
              Explore our Agbada, Senator, and Bespoke collections. Tap the heart icon on any piece to curate your consultation list.
            </p>
            <div className="mt-8">
              <Button href="/collections" variant="champagne" size="lg">
                Explore Collections
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
              {savedStyles.map((style) => (
                <div key={style.id} className="relative group">
                  <StyleCard style={style} />
                  <div className="mt-2 flex items-center justify-between pt-2 border-t border-stone-800/60">
                    <Link
                      href={`/book-a-fitting?style=${encodeURIComponent(style.code)}`}
                      className="text-[10px] uppercase tracking-widest text-champagne hover:underline inline-flex items-center"
                    >
                      <Calendar className="mr-1 h-3 w-3" />
                      Book Fitting For This Look
                    </Link>

                    <button
                      onClick={() => remove(style.id)}
                      className="text-[10px] uppercase font-mono tracking-widest text-stone-500 hover:text-red-400 transition-colors inline-flex items-center gap-1"
                    >
                      <Trash2 className="h-3 w-3" />
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Group Action */}
            <div className="mt-20 p-8 bg-[#151513] fine-border rounded-2xl sm:rounded-3xl text-center max-w-2xl mx-auto">
              <h3 className="font-display text-2xl text-warm-ivory">
                Ready to review these pieces with a master tailor?
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-stone-400 font-light">
                Bring your curated lookbook into a consultation at the TCC office.
              </p>
              <div className="mt-6">
                <Button href="/book-a-fitting" variant="champagne" size="md">
                  Book A Fitting With Saved Looks
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
