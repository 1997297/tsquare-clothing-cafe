"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAccountData } from "@/lib/account-store";
import {
  Sparkles,
  ArrowRight,
  Filter,
  Calendar,
  Layers,
  ArrowUpRight,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORY_FILTERS = [
  { id: "all", label: "All Garments" },
  { id: "agbada", label: "Agbada" },
  { id: "senator", label: "Senator" },
  { id: "kaftan", label: "Kaftan" },
  { id: "traditional", label: "Traditional" },
  { id: "formal", label: "Formal" },
] as const;

export default function WardrobePage() {
  const { wardrobe } = useAccountData();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  const filteredWardrobe = wardrobe
    .filter((item) => {
      if (selectedCategory === "all") return true;
      return item.category === selectedCategory;
    })
    .sort((a, b) => {
      const dateA = new Date(a.completionDate).getTime();
      const dateB = new Date(b.completionDate).getTime();
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });

  return (
    <div className="space-y-10 animate-in fade-in duration-300">
      {/* ── Page Hero Header ── */}
      <div className="border-b border-stone-800/60 pb-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-champagne" />
              <span className="text-[10px] uppercase font-mono tracking-[0.3em] text-champagne font-semibold block">
                Digital Atelier Archive
              </span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl text-warm-ivory font-normal">
              Your TSquare Wardrobe
            </h1>
            <p className="mt-2 text-sm text-stone-400 font-light max-w-xl leading-relaxed">
              Every piece we have created for you, remembered. An enduring record of your commissioned silhouettes, personal textiles, and master tailored paper patterns.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            <Link
              href="/collections"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-champagne text-near-black text-xs font-mono uppercase tracking-wider font-bold hover:bg-champagne-light transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Commission New Look</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Filter & Sorting Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {CATEGORY_FILTERS.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs uppercase tracking-wider font-mono font-medium transition-colors whitespace-nowrap",
                selectedCategory === cat.id
                  ? "bg-stone-800 text-champagne border border-stone-700 shadow-sm"
                  : "text-stone-400 hover:text-warm-ivory hover:bg-stone-900/60"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Sorting Dropdown */}
        <div className="flex items-center gap-2 text-xs font-mono self-end sm:self-auto">
          <span className="text-stone-500 uppercase text-[10px] tracking-wider">
            Sort by:
          </span>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as "newest" | "oldest")}
            className="bg-stone-900 border border-stone-800 text-warm-ivory rounded-xl px-3 py-1.5 focus:outline-none focus:border-champagne/40"
          >
            <option value="newest">Newest Additions</option>
            <option value="oldest">Earliest Commissions</option>
          </select>
        </div>
      </div>

      {/* ── Wardrobe Garment Grid ── */}
      {filteredWardrobe.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWardrobe.map((item) => (
            <Link
              key={item.id}
              href={`/account/wardrobe/${item.id}`}
              className="group rounded-3xl bg-[#141412] fine-border overflow-hidden hover:border-champagne/40 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                {/* Hero Editorial Photography */}
                <div className="relative aspect-[4/5] w-full overflow-hidden bg-stone-900">
                  <Image
                    src={item.heroImage}
                    alt={item.styleName}
                    fill
                    className="object-cover object-top transition-transform duration-700 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#141412] via-transparent to-transparent opacity-80" />

                  {/* Top Badges */}
                  <div className="absolute top-4 inset-x-4 flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full bg-near-black/70 backdrop-blur-md border border-stone-800 text-[10px] font-mono text-champagne uppercase tracking-wider font-semibold">
                      {item.category}
                    </span>

                    <span className="px-2.5 py-1 rounded-full bg-near-black/70 backdrop-blur-md border border-stone-800 text-[9px] font-mono text-stone-300">
                      {item.styleCode}
                    </span>
                  </div>

                  {/* Occasion Pill */}
                  {item.occasion && (
                    <div className="absolute bottom-4 left-4">
                      <span className="px-3 py-1 rounded-full bg-[#11110F]/90 backdrop-blur-md border border-stone-700/60 text-[10px] text-warm-ivory font-mono">
                        {item.occasion}
                      </span>
                    </div>
                  )}
                </div>

                {/* Garment Details */}
                <div className="p-6 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-display text-xl text-warm-ivory group-hover:text-champagne transition-colors">
                      {item.styleName}
                    </h3>
                    <ArrowUpRight className="w-4 h-4 text-stone-500 group-hover:text-champagne transition-colors shrink-0 mt-1" />
                  </div>

                  <div className="space-y-1.5 text-xs text-stone-400 font-light">
                    <p className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-mono text-stone-500">Fabric:</span>
                      <span className="text-stone-300">{item.fabricSnapshot.name}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-mono text-stone-500">Colour:</span>
                      <span className="text-stone-300">{item.colourSnapshot.name}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="px-6 py-4 border-t border-stone-800/60 bg-stone-900/30 flex items-center justify-between text-[11px] font-mono text-stone-500">
                <span>
                  Finished {new Date(item.completionDate).toLocaleDateString("en-NG", {
                    month: "short",
                    year: "numeric",
                  })}
                </span>
                <span className="text-champagne group-hover:underline">
                  View Archive →
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        /* ── Empty State ── */
        <div className="py-20 px-6 rounded-3xl bg-[#141412] fine-border text-center space-y-6 max-w-2xl mx-auto">
          <div className="w-16 h-16 rounded-full bg-champagne/10 border border-champagne/25 flex items-center justify-center mx-auto text-champagne">
            <Sparkles className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="font-display text-2xl text-warm-ivory">
              Your wardrobe begins with your first TSquare piece
            </h2>
            <p className="text-xs text-stone-400 font-light max-w-md mx-auto leading-relaxed">
              Completed garments will live here, along with the intimate tailoring details, fabric choices, and paper patterns that made each one yours.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/collections"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-champagne text-near-black text-xs uppercase tracking-widest font-bold hover:bg-champagne-light transition-all"
            >
              Explore Collection
            </Link>
            <Link
              href="/bespoke"
              className="w-full sm:w-auto px-6 py-3 rounded-xl border border-stone-700 text-stone-300 hover:text-warm-ivory hover:border-champagne/40 text-xs uppercase tracking-widest font-semibold transition-all"
            >
              Start Bespoke Journey
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
