"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Search,
  Heart,
  User,
  Menu,
  X,
  ChevronDown,
  Calendar,
} from "lucide-react";
import { BrandLogo } from "@/components/common/BrandLogo";
import { SearchModal } from "@/components/features/search/SearchModal";
import { useSavedStyles } from "@/lib/saved-store";
import { useAuth } from "@/lib/auth-context";
import { COLLECTIONS } from "@/data/collections";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollectionsDropdownOpen, setIsCollectionsDropdownOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const pathname = usePathname();
  const { count: savedCount } = useSavedStyles();
  const { user, profile } = useAuth();
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isHomepage = pathname === "/";

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsCollectionsDropdownOpen(false);
  }, [pathname]);

  // Dedicated client portal and bespoke configurator have their own purpose-built concierge headers
  if (pathname.startsWith("/account") || pathname.startsWith("/bespoke/create")) {
    return null;
  }

  return (
    <>
      <header
        className={cn(
          "fixed top-0 inset-x-0 z-40 transition-colors duration-300 transform-gpu",
          "h-20 flex flex-col justify-center border-b",
          isScrolled || !isHomepage || isMobileMenuOpen
            ? "bg-[#11110F]/85 backdrop-blur-2xl backdrop-saturate-150 border-white/[0.08] shadow-[0_4px_30px_rgba(0,0,0,0.35),inset_0_1px_0_0_rgba(255,255,255,0.06)]"
            : "bg-[#11110F]/60 backdrop-blur-xl backdrop-saturate-150 border-white/[0.05] shadow-[0_4px_24px_rgba(0,0,0,0.2),inset_0_1px_0_0_rgba(255,255,255,0.04)]"
        )}
      >
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-6">
          {/* LEFT: Dominant Brand Logo */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              className="lg:hidden p-2 -ml-2 text-warm-ivory hover:text-champagne transition-colors focus:outline-none rounded-lg"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>

            <BrandLogo variant="light" size="md" align="left" />
          </div>

          {/* CENTER: Navigation Links */}
          <nav className="hidden lg:flex items-center gap-8 text-xs uppercase tracking-[0.2em] font-medium text-stone-300">
            {/* Collections with Dropdown */}
            <div
              className="relative group"
              onMouseEnter={() => {
                if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
                setIsCollectionsDropdownOpen(true);
              }}
              onMouseLeave={() => {
                closeTimerRef.current = setTimeout(
                  () => setIsCollectionsDropdownOpen(false),
                  200
                );
              }}
            >
              <Link
                href="/collections"
                className={cn(
                  "inline-flex items-center gap-1.5 hover:text-warm-ivory transition-colors py-2",
                  pathname.startsWith("/collections") && "text-champagne font-semibold"
                )}
              >
                Collections
                <ChevronDown className="h-3.5 w-3.5 transition-transform group-hover:rotate-180" />
              </Link>

              {/* Invisible bridge fills the gap between link and dropdown panel */}
              <div className="absolute top-full left-0 w-full h-2" />

              {/* Collections Dropdown Menu with Rounded Corners */}
              <div
                className={cn(
                  "absolute top-full -left-4 w-64 bg-[#11110F]/85 backdrop-blur-2xl backdrop-saturate-150 border border-white/[0.08] shadow-[0_4px_30px_rgba(0,0,0,0.35),inset_0_1px_0_0_rgba(255,255,255,0.06)] py-3 rounded-2xl transition-all duration-200 z-50 mt-2",
                  isCollectionsDropdownOpen
                    ? "opacity-100 translate-y-0 pointer-events-auto"
                    : "opacity-0 -translate-y-1 pointer-events-none"
                )}
                onMouseEnter={() => {
                  if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
                }}
                onMouseLeave={() => {
                  closeTimerRef.current = setTimeout(
                    () => setIsCollectionsDropdownOpen(false),
                    200
                  );
                }}
              >
                <div className="px-4 py-1.5 text-[9px] uppercase tracking-[0.28em] text-stone-500 border-b border-stone-800/80 mb-1">
                  Signature Silhouettes
                </div>
                {COLLECTIONS.map((c) => (
                  <Link
                    key={c.id}
                    href={`/collections/${c.slug}`}
                    className="block px-4 py-2.5 text-xs text-stone-300 hover:text-champagne hover:bg-stone-900/80 transition-colors uppercase tracking-widest font-normal rounded-lg mx-2"
                  >
                    {c.name}
                  </Link>
                ))}
                <div className="border-t border-stone-800/80 mt-1 pt-1 mx-2">
                  <Link
                    href="/collections"
                    className="block px-4 py-2 text-[10px] text-stone-400 hover:text-warm-ivory uppercase tracking-widest rounded-lg"
                  >
                    View All Collections →
                  </Link>
                </div>
              </div>
            </div>

            <Link
              href="/bespoke"
              className={cn(
                "hover:text-warm-ivory transition-colors py-2",
                pathname === "/bespoke" && "text-champagne font-semibold"
              )}
            >
              Bespoke
            </Link>

            <Link
              href="/story"
              className={cn(
                "hover:text-warm-ivory transition-colors py-2",
                pathname === "/story" && "text-champagne font-semibold"
              )}
            >
              Our Story
            </Link>

            <Link
              href="/craftsmanship"
              className={cn(
                "hover:text-warm-ivory transition-colors py-2",
                pathname === "/craftsmanship" && "text-champagne font-semibold"
              )}
            >
              Craftsmanship
            </Link>
          </nav>

          {/* RIGHT: Utilities & Book Fitting CTA */}
          <div className="flex items-center gap-2.5 sm:gap-4">
            {/* Book A Fitting CTA Button with Rounded Corners */}
            <Link
              href="/book-a-fitting"
              className="hidden xl:inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] font-semibold text-near-black bg-champagne hover:bg-champagne-light px-4 py-2 rounded-xl transition-all shadow-sm"
            >
              <Calendar className="h-3.5 w-3.5" />
              Book Fitting
            </Link>

            {/* Search Button */}
            <button
              onClick={() => setIsSearchOpen(true)}
              aria-label="Search collections"
              className="p-2.5 text-stone-300 hover:text-warm-ivory hover:bg-stone-800/40 rounded-full transition-colors focus:outline-none"
            >
              <Search className="h-4 sm:h-5 w-4 sm:w-5" />
            </button>

            {/* Saved Looks / Wardrobe Wishlist */}
            <Link
              href="/saved"
              aria-label={`Saved looks (${savedCount})`}
              className="relative p-2.5 text-stone-300 hover:text-warm-ivory hover:bg-stone-800/40 rounded-full transition-colors focus:outline-none"
            >
              <Heart className="h-4 sm:h-5 w-4 sm:w-5" />
              {savedCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-champagne text-[9px] font-bold text-near-black">
                  {savedCount}
                </span>
              )}
            </Link>

            {/* Private Client / Account Access */}
            <Link
              href={user || profile ? "/account" : "/auth/sign-in"}
              aria-label={user || profile ? "Private Client Portal" : "Private client sign in"}
              className="relative p-2.5 text-stone-300 hover:text-warm-ivory hover:bg-stone-800/40 rounded-full transition-colors focus:outline-none"
            >
              <User className="h-4 sm:h-5 w-4 sm:w-5" />
              {(user || profile) && (
                <span className="absolute top-1.5 right-1.5 flex h-2 w-2 rounded-full bg-champagne ring-2 ring-near-black" />
              )}
            </Link>
          </div>
        </div>

        {/* Mobile Navigation Drawer with Rounded Touches */}
        {isMobileMenuOpen && (
          <div className="lg:hidden absolute top-full inset-x-0 border-b border-stone-800/80 bg-[#11110F]/95 backdrop-blur-2xl px-6 py-8 space-y-6 animate-in slide-in-from-top-2 duration-300 rounded-b-3xl shadow-2xl">
            <div className="space-y-4">
              <div className="text-[10px] uppercase font-mono tracking-[0.28em] text-stone-500">
                Primary Navigation
              </div>
              <Link
                href="/collections"
                className="block text-lg font-display text-warm-ivory tracking-wide uppercase"
              >
                Collections Overview
              </Link>
              <div className="pl-3 border-l border-stone-800 space-y-2.5 my-2">
                {COLLECTIONS.map((c) => (
                  <Link
                    key={c.id}
                    href={`/collections/${c.slug}`}
                    className="block text-xs uppercase tracking-widest text-stone-400 hover:text-champagne"
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
              <Link
                href="/bespoke"
                className="block text-lg font-display text-warm-ivory tracking-wide uppercase"
              >
                Bespoke Experience
              </Link>
              <Link
                href="/bespoke/process"
                className="block text-sm font-sans text-stone-400 tracking-wider uppercase pl-3 border-l border-stone-800"
              >
                The Bespoke Process
              </Link>
              <Link
                href="/story"
                className="block text-lg font-display text-warm-ivory tracking-wide uppercase"
              >
                Our Story
              </Link>
              <Link
                href="/craftsmanship"
                className="block text-lg font-display text-warm-ivory tracking-wide uppercase"
              >
                Craftsmanship
              </Link>
              <Link
                href="/contact"
                className="block text-lg font-display text-warm-ivory tracking-wide uppercase"
              >
                Contact & Atelier
              </Link>
            </div>

            <div className="pt-6 border-t border-stone-800/80 space-y-3">
              <Link
                href="/book-a-fitting"
                className="flex w-full items-center justify-center bg-champagne text-near-black py-3.5 text-xs font-bold uppercase tracking-[0.22em] rounded-xl shadow-md"
              >
                Book A Fitting Consultation
              </Link>
              <Link
                href={user || profile ? "/account" : "/auth/sign-in"}
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex w-full items-center justify-center border border-stone-700 text-stone-300 py-3.5 text-xs font-semibold uppercase tracking-[0.22em] hover:bg-stone-900 rounded-xl"
              >
                {user || profile ? "Enter Client Portal" : "Private Client Sign In"}
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Global Search Modal */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
