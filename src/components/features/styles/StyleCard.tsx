"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";
import { Style } from "@/types";
import { useSavedStyles } from "@/lib/saved-store";
import { cn } from "@/lib/utils";

interface StyleCardProps {
  style: Style;
  priority?: boolean;
  className?: string;
}

export function StyleCard({ style, priority = false, className }: StyleCardProps) {
  const { isSaved, toggle } = useSavedStyles();
  const saved = isSaved(style.id);

  const handleToggleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggle(style.id);
  };

  return (
    <article
      className={cn(
        "group relative flex flex-col bg-transparent transition-all duration-300",
        className
      )}
    >
      {/* Editorial Image Container with Rounded Corners */}
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-espresso/40 shadow-sm">
        <Link
          href={`/styles/${style.slug}`}
          className="block h-full w-full focus:outline-none"
          tabIndex={-1}
        >
          <Image
            src={style.images[0]}
            alt={style.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            priority={priority}
            className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
          />
          {/* Subtle vignette gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-near-black/75 via-transparent to-transparent opacity-50 group-hover:opacity-70 transition-opacity duration-300" />
        </Link>

        {/* Category Badge with Rounded-Full */}
        <div className="absolute top-3.5 left-3.5 z-10">
          <span className="bg-near-black/85 backdrop-blur-md text-warm-ivory text-[9px] uppercase tracking-[0.22em] font-medium px-3 py-1 rounded-full border border-stone-700/60 shadow-sm">
            {style.categoryLabel}
          </span>
        </div>

        {/* Save to Wardrobe Button with Rounded-Full */}
        <button
          onClick={handleToggleSave}
          aria-label={saved ? `Remove ${style.name} from saved` : `Save ${style.name}`}
          className={cn(
            "absolute top-3.5 right-3.5 z-10 flex h-9 w-9 items-center justify-center rounded-full transition-all duration-300 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-champagne shadow-sm",
            saved
              ? "bg-warm-ivory text-near-black shadow-md"
              : "bg-near-black/70 text-warm-ivory hover:bg-near-black hover:text-champagne border border-stone-700/60"
          )}
        >
          <Heart
            className={cn(
              "h-4 w-4 transition-transform duration-200",
              saved ? "fill-near-black scale-110" : "stroke-[1.5]"
            )}
          />
        </button>

        {/* Quick View Link overlay on hover with Rounded-xl */}
        <div className="absolute bottom-3.5 inset-x-3.5 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none group-hover:pointer-events-auto">
          <Link
            href={`/styles/${style.slug}`}
            className="flex w-full items-center justify-center bg-warm-ivory text-near-black text-[10px] uppercase font-bold tracking-[0.22em] py-3 rounded-xl shadow-lg hover:bg-white transition-colors"
          >
            View Style Detail
          </Link>
        </div>
      </div>

      {/* Style Details */}
      <div className="flex flex-col pt-4 pb-2">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-[10px] uppercase font-mono tracking-[0.2em] text-champagne font-semibold">
            {style.code}
          </span>
          {style.leadTimeWeeks && (
            <span className="text-[9px] uppercase tracking-widest text-stone-500 font-mono">
              {style.leadTimeWeeks} Wks Bespoke
            </span>
          )}
        </div>

        <h3 className="mt-1 font-display text-base sm:text-lg font-medium tracking-tight text-warm-ivory group-hover:text-champagne transition-colors duration-200 line-clamp-1">
          <Link href={`/styles/${style.slug}`}>{style.name}</Link>
        </h3>

        <p className="mt-1 text-xs text-stone-400 line-clamp-2 font-sans font-light leading-relaxed">
          {style.description}
        </p>

        {/* Available Color Dots */}
        {style.availableColours && style.availableColours.length > 0 && (
          <div className="mt-3 flex items-center gap-1.5" role="list" aria-label="Available colours">
            {style.availableColours.map((c, i) => (
              <span
                key={i}
                title={c.name}
                role="listitem"
                className="h-3 w-3 rounded-full border border-stone-600/60 shadow-inner"
                style={{ backgroundColor: c.hex }}
              >
                <span className="sr-only">{c.name}</span>
              </span>
            ))}
            <span className="ml-1 text-[9px] uppercase tracking-wider text-stone-500">
              {style.availableColours.length} Palettes
            </span>
          </div>
        )}
      </div>
    </article>
  );
}
