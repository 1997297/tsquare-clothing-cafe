"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Search, SlidersHorizontal, ArrowRight } from "lucide-react";
import { searchStyles, getAllStyles } from "@/data/styles";
import { StyleCard } from "@/components/features/styles/StyleCard";
import { Style } from "@/types";

export default function SearchClient() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<Style[]>([]);

  useEffect(() => {
    if (query.trim().length > 0) {
      setResults(searchStyles(query));
    } else {
      setResults(getAllStyles().slice(0, 6));
    }
  }, [query]);

  const quickTerms = [
    "Agbada",
    "Senator",
    "Kaftan",
    "Traditional",
    "Bespoke",
    "Groom",
    "Wedding",
    "Black",
    "Ivory",
    "Silk",
  ];

  return (
    <div className="bg-near-black min-h-screen text-warm-ivory pt-28 sm:pt-36 pb-24 selection:bg-champagne selection:text-near-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Search Header */}
        <div className="max-w-3xl mx-auto text-center mb-12">
          <span className="text-[10px] uppercase font-mono tracking-[0.3em] text-champagne font-semibold block mb-3">
            Atelier Archive Discovery
          </span>
          <h1 className="font-display text-4xl sm:text-5xl font-normal tracking-tight text-warm-ivory">
            Search The Collection
          </h1>
          <p className="mt-3 text-sm text-stone-400 font-sans font-light">
            Locate garments by code, category, occasion, or fabric architecture.
          </p>

          {/* Search Input Box */}
          <div className="mt-8 relative flex items-center bg-stone-950 fine-border p-2">
            <Search className="h-5 w-5 text-stone-400 ml-3" />
            <label htmlFor="collection-search" className="sr-only">Search the collection</label>
            <input
              type="text"
              id="collection-search"
              name="query"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by code (e.g. TSQ AGBADA 024), silhouette, groom, black..."
              className="w-full bg-transparent px-4 py-3 text-sm sm:text-base text-warm-ivory placeholder:text-stone-500 focus:outline-none font-sans"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="text-xs uppercase font-mono tracking-wider text-stone-400 hover:text-warm-ivory mr-3"
              >
                Clear
              </button>
            )}
          </div>

          {/* Quick Filter Tags */}
          <div className="mt-6 flex flex-wrap justify-center items-center gap-2">
            <span className="text-[10px] uppercase font-mono tracking-widest text-stone-500 mr-1">
              Suggestions:
            </span>
            {quickTerms.map((term) => (
              <button
                key={term}
                onClick={() => setQuery(term)}
                className={`px-3 py-1 text-xs uppercase tracking-wider transition-colors border ${
                  query.toLowerCase() === term.toLowerCase()
                    ? "border-champagne bg-champagne/10 text-champagne"
                    : "border-stone-800 text-stone-400 hover:border-stone-700 hover:text-stone-300"
                }`}
              >
                {term}
              </button>
            ))}
          </div>
        </div>

        {/* Results Presentation */}
        <div className="pt-8 border-t border-stone-800/80">
          <div className="flex items-center justify-between mb-8">
            <span className="text-xs uppercase tracking-widest text-stone-400">
              {query.trim().length > 0
                ? `${results.length} ${results.length === 1 ? "Piece Found" : "Pieces Found"} for "${query}"`
                : "Curated Archive Suggestions"}
            </span>

            {query.trim().length > 0 && results.length > 0 && (
              <button
                onClick={() => setQuery("")}
                className="text-[10px] uppercase font-mono tracking-widest text-champagne hover:underline"
              >
                Reset Search
              </button>
            )}
          </div>

          {results.length === 0 ? (
            <div className="py-20 text-center fine-border bg-stone-950 p-12">
              <h3 className="font-display text-2xl text-stone-300">
                No garments found matching &ldquo;{query}&rdquo;
              </h3>
              <p className="mt-3 text-sm text-stone-500 font-light max-w-md mx-auto">
                Try searching by broader terms such as &ldquo;Agbada&rdquo;, &ldquo;Senator&rdquo;, &ldquo;Wedding&rdquo;, or &ldquo;Wool&rdquo;.
              </p>
              <button
                onClick={() => setQuery("")}
                className="mt-6 inline-flex items-center text-xs uppercase tracking-widest text-champagne font-bold"
              >
                View Curated Recommendations
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
              {results.map((style) => (
                <StyleCard key={style.id} style={style} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
