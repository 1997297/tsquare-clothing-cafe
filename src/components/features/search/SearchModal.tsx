"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, X, ArrowRight } from "lucide-react";
import { searchStyles } from "@/data/styles";
import { Style } from "@/types";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Style[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      document.body.style.overflow = "unset";
      setQuery("");
      setResults([]);
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleQueryChange = (val: string) => {
    setQuery(val);
    if (val.trim().length > 0) {
      setResults(searchStyles(val));
    } else {
      setResults([]);
    }
  };

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
  ];

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Search TCC collections"
      className="fixed inset-0 z-50 flex flex-col bg-near-black/95 backdrop-blur-xl animate-in fade-in duration-200"
    >
      {/* Top Bar with Search Input */}
      <div className="border-b border-stone-800/80 px-4 sm:px-8 py-6 max-w-5xl w-full mx-auto flex items-center justify-between gap-4">
        <div className="relative flex-1 flex items-center bg-stone-900/60 border border-stone-800 rounded-2xl px-4 py-2">
          <Search className="h-5 w-5 text-stone-400 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="Search by style code, silhouette, occasion, fabric..."
            className="w-full bg-transparent pr-4 text-base sm:text-xl text-warm-ivory placeholder:text-stone-500 font-sans font-light focus:outline-none tracking-wide"
          />
        </div>

        <button
          onClick={onClose}
          aria-label="Close search"
          className="p-2.5 text-stone-400 hover:text-warm-ivory hover:bg-stone-800/60 rounded-full transition-colors"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      {/* Body / Results */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-8 max-w-5xl w-full mx-auto">
        {/* Quick Suggestion Pills if query is empty */}
        {query.trim().length === 0 && (
          <div className="space-y-6">
            <span className="text-[10px] uppercase font-mono tracking-[0.25em] text-stone-400 font-semibold block">
              Suggested Explorations
            </span>
            <div className="flex flex-wrap gap-2.5">
              {quickTerms.map((term) => (
                <button
                  key={term}
                  onClick={() => handleQueryChange(term)}
                  className="px-4 py-2 border border-stone-800 bg-stone-900/40 text-stone-300 hover:border-champagne hover:text-champagne text-xs uppercase tracking-widest transition-colors font-sans rounded-xl"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Results List */}
        {query.trim().length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-6 pb-2 border-b border-stone-800/60">
              <span className="text-xs uppercase tracking-widest text-stone-400">
                {results.length} {results.length === 1 ? "Piece Found" : "Pieces Found"} for &ldquo;{query}&rdquo;
              </span>
            </div>

            {results.length === 0 ? (
              <div className="py-16 text-center rounded-2xl bg-stone-950 border border-stone-800 p-8">
                <p className="font-display text-xl text-stone-400">
                  No matching garments found
                </p>
                <p className="mt-2 text-sm text-stone-500 font-light">
                  Try searching for &ldquo;Agbada&rdquo;, &ldquo;Senator&rdquo;, &ldquo;Groom&rdquo;, or &ldquo;Wool&rdquo;
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {results.map((style) => (
                  <Link
                    key={style.id}
                    href={`/styles/${style.slug}`}
                    onClick={onClose}
                    className="group flex gap-4 p-3.5 bg-stone-900/30 border border-stone-800 hover:border-stone-700 transition-colors rounded-2xl"
                  >
                    <div className="relative h-24 w-18 shrink-0 overflow-hidden bg-espresso rounded-xl">
                      <Image
                        src={style.images[0]}
                        alt={style.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="flex flex-col justify-center">
                      <span className="text-[9px] uppercase font-mono tracking-widest text-champagne font-semibold">
                        {style.code}
                      </span>
                      <h4 className="font-display text-sm text-warm-ivory group-hover:text-champagne transition-colors mt-0.5 line-clamp-1">
                        {style.name}
                      </h4>
                      <span className="text-[10px] text-stone-400 uppercase tracking-wider mt-1">
                        {style.categoryLabel}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer hint */}
      <div className="border-t border-stone-900 py-3.5 text-center text-[10px] uppercase tracking-widest text-stone-500">
        Press ESC to close • TSquare Clothing Cafe Search
      </div>
    </div>
  );
}
