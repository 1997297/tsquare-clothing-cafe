"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, SlidersHorizontal, Check } from "lucide-react";
import { getAllStyles } from "@/data/styles";
import { COLLECTIONS } from "@/data/collections";
import { OCCASIONS } from "@/data/occasions";
import { StyleCard } from "@/components/features/styles/StyleCard";
import { ProductCategory } from "@/types";

export default function CollectionsClient() {
  const searchParams = useSearchParams();
  const initialOccasion = searchParams.get("occasion") || "all";

  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedOccasion, setSelectedOccasion] = useState<string>(initialOccasion);
  const [selectedColor, setSelectedColor] = useState<string>("all");

  useEffect(() => {
    const occ = searchParams.get("occasion");
    if (occ) {
      setSelectedOccasion(occ);
    }
  }, [searchParams]);

  const allStyles = useMemo(() => getAllStyles(), []);

  // Filter styles
  const filteredStyles = useMemo(() => {
    return allStyles.filter((style) => {
      if (selectedCategory !== "all" && style.category !== selectedCategory) {
        return false;
      }
      if (selectedOccasion !== "all" && !style.occasions.includes(selectedOccasion)) {
        return false;
      }
      if (selectedColor !== "all") {
        const hasColor = style.availableColours.some((c) =>
          c.name.toLowerCase().includes(selectedColor.toLowerCase())
        );
        if (!hasColor) return false;
      }
      return true;
    });
  }, [allStyles, selectedCategory, selectedOccasion, selectedColor]);

  const categories = [
    { label: "All Silhouettes", value: "all" },
    { label: "Agbada", value: "agbada" },
    { label: "Senator", value: "senator" },
    { label: "Kaftan", value: "kaftan" },
    { label: "Traditional", value: "traditional" },
    { label: "Bespoke Suiting", value: "bespoke" },
    { label: "Formal Occasion", value: "formal" },
  ];

  const colors = [
    { label: "All Palettes", value: "all" },
    { label: "Black", value: "black" },
    { label: "Ivory", value: "ivory" },
    { label: "Navy", value: "navy" },
    { label: "Espresso", value: "espresso" },
  ];

  return (
    <div className="bg-near-black min-h-screen text-warm-ivory pt-24 sm:pt-32 pb-24 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Editorial Page Header */}
        <div className="border-b border-stone-800 pb-12 mb-12">
          <span className="text-[10px] uppercase font-mono tracking-[0.28em] text-champagne font-semibold block mb-3">
            TCC Atelier Portfolio
          </span>
          <h1 className="font-display text-4xl sm:text-6xl font-normal tracking-tight text-warm-ivory max-w-3xl">
            House Silhouettes & Collections
          </h1>
          <p className="mt-4 text-sm sm:text-base text-stone-400 font-sans font-light max-w-2xl leading-relaxed">
            Every garment in our archive is crafted on bespoke principles. Discover the architecture of Agbada, the linear restraint of Senator wear, and full canvas suiting.
          </p>
        </div>

        {/* 6 Category Hero Cards Navigation with Rounded-2xl */}
        <div className="mb-16">
          <div className="text-[10px] uppercase font-mono tracking-[0.25em] text-stone-500 mb-4 font-semibold">
            Explore By Category Archives
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {COLLECTIONS.map((c) => (
              <Link
                key={c.id}
                href={`/collections/${c.slug}`}
                className="group relative aspect-[3/4] overflow-hidden bg-espresso fine-border rounded-2xl p-3.5 flex flex-col justify-end transition-all shadow-sm"
              >
                <Image
                  src={c.heroImage}
                  alt={c.name}
                  fill
                  sizes="16vw"
                  className="object-cover object-top filter brightness-[0.6] group-hover:scale-105 group-hover:brightness-[0.75] transition-all duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-near-black via-near-black/40 to-transparent" />
                <div className="relative z-10">
                  <h3 className="font-display text-sm text-warm-ivory group-hover:text-champagne transition-colors">
                    {c.name}
                  </h3>
                  <span className="text-[9px] uppercase tracking-widest text-stone-400 font-mono block mt-0.5">
                    View Archive →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Interactive Filters Bar with Rounded-2xl */}
        <div className="bg-stone-950 fine-border rounded-2xl p-6 sm:p-8 mb-12 shadow-sm">
          <div className="flex items-center gap-2 text-[10px] uppercase font-mono tracking-[0.25em] text-champagne font-semibold mb-5">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Curate Your Selection
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Category Filter */}
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-stone-400 mb-2 font-medium">
                Silhouette
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-near-black border border-stone-800 text-warm-ivory text-xs px-4 py-3 rounded-xl focus:outline-none focus:border-champagne"
              >
                {categories.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Occasion Filter */}
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-stone-400 mb-2 font-medium">
                Occasion / Dress Code
              </label>
              <select
                value={selectedOccasion}
                onChange={(e) => setSelectedOccasion(e.target.value)}
                className="w-full bg-near-black border border-stone-800 text-warm-ivory text-xs px-4 py-3 rounded-xl focus:outline-none focus:border-champagne"
              >
                <option value="all">All Occasions</option>
                {OCCASIONS.map((o) => (
                  <option key={o.id} value={o.name}>
                    {o.name} ({o.tagline})
                  </option>
                ))}
              </select>
            </div>

            {/* Palette Filter */}
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-stone-400 mb-2 font-medium">
                Dominant Palette
              </label>
              <select
                value={selectedColor}
                onChange={(e) => setSelectedColor(e.target.value)}
                className="w-full bg-near-black border border-stone-800 text-warm-ivory text-xs px-4 py-3 rounded-xl focus:outline-none focus:border-champagne"
              >
                {colors.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Active Filter Indicators / Clear */}
          {(selectedCategory !== "all" || selectedOccasion !== "all" || selectedColor !== "all") && (
            <div className="mt-5 pt-4 border-t border-stone-900 flex items-center justify-between">
              <span className="text-xs text-stone-400">
                Displaying {filteredStyles.length} curated {filteredStyles.length === 1 ? "look" : "looks"}
              </span>
              <button
                onClick={() => {
                  setSelectedCategory("all");
                  setSelectedOccasion("all");
                  setSelectedColor("all");
                }}
                className="text-[10px] uppercase tracking-widest text-champagne hover:underline"
              >
                Reset All Filters
              </button>
            </div>
          )}
        </div>

        {/* Styles Grid */}
        {filteredStyles.length === 0 ? (
          <div className="py-20 text-center fine-border bg-stone-950 rounded-2xl p-12">
            <h3 className="font-display text-xl text-stone-300">
              No garments matching this specific curation
            </h3>
            <p className="mt-2 text-sm text-stone-500 font-light">
              Try adjusting your occasion or silhouette filter to explore our wider collection.
            </p>
            <button
              onClick={() => {
                setSelectedCategory("all");
                setSelectedOccasion("all");
                setSelectedColor("all");
              }}
              className="mt-6 inline-flex items-center text-xs uppercase tracking-widest text-champagne font-bold"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
            {filteredStyles.map((style) => (
              <StyleCard key={style.id} style={style} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
