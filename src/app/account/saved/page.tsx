"use client";

import Link from "next/link";
import Image from "next/image";
import { useSavedStyles } from "@/lib/saved-store";
import { getStyleById } from "@/data/styles";
import { Heart, Trash2, ArrowRight, Sparkles, Loader2 } from "lucide-react";
import { ReturnLink } from "@/components/common/ReturnLink";

export default function AccountSavedPage() {
  const { savedIds, toggle, error, isLoaded } = useSavedStyles();

  const savedStyles = savedIds
    .map((id) => getStyleById(id))
    .filter((s): s is NonNullable<typeof s> => Boolean(s));

  if (!isLoaded) {
    return (
      <div className="space-y-8 animate-in fade-in duration-300">
        <ReturnLink href="/account" label="Return to Dashboard" />
        <div className="flex min-h-64 items-center justify-center rounded-3xl bg-stone-950 fine-border text-xs uppercase tracking-widest text-stone-400">
          <Loader2 className="mr-2 h-4 w-4 animate-spin text-champagne" />
          Loading Saved Looks...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <ReturnLink href="/account" label="Return to Dashboard" />
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800/60 pb-6">
        <div>
          <span className="text-[10px] uppercase font-mono tracking-[0.3em] text-champagne font-semibold block mb-1">
            Permanent Wardrobe Wishlist
          </span>
          <h1 className="font-display text-2xl sm:text-3xl text-warm-ivory">
            Your Saved Archetypes
          </h1>
          <p className="text-xs text-stone-400 mt-1 font-light">
            Silhouettes and garments curated for your consideration and future bespoke requests.
          </p>
        </div>

        <Link
          href="/collections"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-stone-700 hover:border-champagne text-xs uppercase tracking-wider text-warm-ivory font-mono transition-colors self-start sm:self-auto"
        >
          <span>Explore More Styles</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {error && <p role="alert" className="p-4 rounded-2xl bg-red-950/30 border border-red-800/50 text-xs text-red-300">{error}</p>}

      {/* Grid */}
      {savedStyles.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {savedStyles.map((style) => (
            <div
              key={style.id}
              className="group rounded-3xl bg-stone-950 fine-border p-4 space-y-4 hover:border-champagne/40 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden bg-espresso">
                  <Image
                    src={style.images[0]}
                    alt={style.name}
                    fill
                    className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  <button
                    onClick={() => toggle(style.id)}
                    aria-label={`Remove ${style.name} from saved wardrobe`}
                    className="absolute top-3 right-3 p-2 rounded-full bg-near-black/70 backdrop-blur-md text-stone-400 hover:text-red-400 hover:bg-near-black transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <div className="flex items-center justify-between text-[10px] font-mono uppercase text-champagne mb-1">
                    <span>{style.code}</span>
                    <span className="text-stone-500">{style.categoryLabel}</span>
                  </div>
                  <h3 className="font-display text-base text-warm-ivory font-medium">
                    {style.name}
                  </h3>
                  <p className="text-xs text-stone-400 font-light line-clamp-2 mt-1">
                    {style.description}
                  </p>
                </div>
              </div>

              <div className="pt-2 grid grid-cols-2 gap-2">
                <Link
                  href={`/styles/${style.slug}`}
                  className="py-2.5 text-center text-xs uppercase tracking-wider font-mono text-stone-300 hover:text-warm-ivory border border-stone-800 hover:border-stone-600 rounded-xl transition-colors"
                >
                  View Look
                </Link>
                <Link
                  href={`/bespoke/create/${style.slug}`}
                  className="inline-flex items-center justify-center gap-1.5 py-2.5 text-center text-xs uppercase tracking-wider font-bold text-near-black bg-champagne hover:bg-champagne-light rounded-xl transition-colors shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Make Mine</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 bg-stone-950 fine-border rounded-3xl text-center space-y-4">
          <Heart className="w-8 h-8 text-stone-600 mx-auto" />
          <h3 className="font-display text-xl text-warm-ivory">
            Your Wishlist Is Empty
          </h3>
          <p className="text-xs text-stone-400 max-w-sm mx-auto leading-relaxed">
            As you browse our seasonal silhouettes, save pieces that resonate with your personal style to compare details and commission later.
          </p>
          <div className="pt-2">
            <Link
              href="/collections"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-champagne text-near-black text-xs uppercase tracking-widest font-bold hover:bg-champagne-light transition-all"
            >
              <span>Explore The Collections</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
