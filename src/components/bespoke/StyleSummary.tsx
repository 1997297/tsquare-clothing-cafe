"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { BespokeConfiguration } from "@/types/bespoke";

interface StyleSummaryProps {
  config: BespokeConfiguration;
  className?: string;
  compact?: boolean; // mobile compact mode
}

export function StyleSummary({ config, className, compact }: StyleSummaryProps) {
  const {
    styleCode,
    styleName,
    styleImage,
    garmentCategory,
    isIdeaPath,
    fabric,
    colour,
    fitPreference,
  } = config;

  const displayCode = isIdeaPath
    ? "TCC BESPOKE"
    : styleCode ?? "TCC BESPOKE";

  const displayName = isIdeaPath
    ? garmentCategory
      ? garmentCategory.charAt(0).toUpperCase() + garmentCategory.slice(1)
      : "Your Vision"
    : styleName ?? "Your Selection";

  const displayImage =
    styleImage ??
    (garmentCategory ? `/images/styles/${garmentCategory === "formal" ? "formal-evening" : garmentCategory === "bespoke" ? "bespoke-double-breasted" : `${garmentCategory.split("-")[0]}-${garmentCategory === "traditional" ? "chieftain" : garmentCategory === "kaftan" ? "embroidered" : garmentCategory === "senator" ? "executive" : "imperial"}`}.jpg` : null);

  if (compact) {
    return (
      <div className={cn("flex items-center gap-3", className)}>
        {displayImage && (
          <div className="relative w-12 h-14 rounded-lg overflow-hidden shrink-0 bg-espresso">
            <Image
              src={displayImage}
              alt={displayName}
              fill
              className="object-cover object-top"
              sizes="48px"
            />
          </div>
        )}
        <div className="min-w-0">
          <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-champagne truncate">
            {displayCode}
          </p>
          <p className="text-xs text-warm-ivory font-medium truncate">
            {displayName}
          </p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {colour && (
              <span className="inline-flex items-center gap-1 text-[9px] text-stone-400">
                <span
                  className="w-2.5 h-2.5 rounded-full border border-warm-ivory/20 inline-block"
                  style={{ background: colour.hex }}
                />
                {colour.name}
              </span>
            )}
            {fabric && (
              <span className="text-[9px] text-stone-500">
                {fabric.name}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Garment image */}
      {displayImage && (
        <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden bg-espresso">
          <Image
            src={displayImage}
            alt={displayName}
            fill
            className="object-cover object-top"
            sizes="(max-width: 1024px) 0px, 400px"
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-near-black/80 via-transparent to-transparent" />
          {/* Code badge */}
          <div className="absolute bottom-4 left-4 right-4">
            <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-champagne mb-1">
              {displayCode}
            </p>
            <p className="text-sm font-display text-warm-ivory leading-tight">
              {displayName}
            </p>
          </div>
        </div>
      )}

      {/* Selected configuration summary */}
      <div className="space-y-3">
        <p className="text-[10px] uppercase font-mono tracking-[0.25em] text-stone-500">
          Your Configuration
        </p>

        <div className="space-y-2.5">
          {/* Category */}
          {(garmentCategory || !isIdeaPath) && (
            <SummaryRow
              label="Type"
              value={
                isIdeaPath && garmentCategory
                  ? garmentCategory.charAt(0).toUpperCase() + garmentCategory.slice(1)
                  : config.styleCode?.split(" ")[1] ?? "Bespoke"
              }
            />
          )}

          {/* Fabric */}
          <SummaryRow label="Fabric" value={fabric?.name} />

          {/* Colour */}
          {colour ? (
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-widest text-stone-500">Colour</span>
              <span className="flex items-center gap-1.5 text-xs text-stone-300">
                <span
                  className="w-3 h-3 rounded-full border border-warm-ivory/20"
                  style={{ background: colour.hex }}
                />
                {colour.name}
              </span>
            </div>
          ) : (
            <SummaryRow label="Colour" value={undefined} />
          )}

          {/* Fit */}
          <SummaryRow
            label="Fit"
            value={
              fitPreference
                ? fitPreference.charAt(0).toUpperCase() + fitPreference.slice(1)
                : undefined
            }
          />
        </div>
      </div>

      {/* Atelier note */}
      <div className="border-t border-stone-800/60 pt-4">
        <p className="text-[10px] text-stone-600 leading-relaxed">
          No price is set at this stage. Your request will be reviewed by the TSquare team before any pricing is shared.
        </p>
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[10px] uppercase tracking-widest text-stone-500">
        {label}
      </span>
      <span className="text-xs text-stone-300">
        {value ?? (
          <span className="text-stone-700 italic">Not yet selected</span>
        )}
      </span>
    </div>
  );
}
