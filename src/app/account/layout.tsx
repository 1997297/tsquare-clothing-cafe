"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useAccountData } from "@/lib/account-store";
import { BrandLogo } from "@/components/common/BrandLogo";
import {
  Compass,
  FileText,
  Package,
  Ruler,
  Calendar,
  Heart,
  Bell,
  User,
  Settings,
  LogOut,
  ArrowLeft,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/account", label: "Overview", icon: Compass },
  { href: "/account/requests", label: "Requests", icon: FileText },
  { href: "/account/orders", label: "Orders", icon: Package },
  { href: "/account/measurements", label: "Measurements", icon: Ruler },
  { href: "/account/appointments", label: "Appointments", icon: Calendar },
  { href: "/account/saved", label: "Saved Looks", icon: Heart },
  { href: "/account/notifications", label: "Notifications", icon: Bell },
  { href: "/account/profile", label: "Profile", icon: User },
  { href: "/account/settings", label: "Settings", icon: Settings },
];

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, isLoading, signOut } = useAuth();
  const { unreadNotificationsCount } = useAccountData();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isLoading && !user && !profile) {
      router.push(`/auth/sign-in?next=${encodeURIComponent(pathname)}`);
    }
  }, [user, profile, isLoading, router, pathname]);

  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen bg-near-black flex flex-col items-center justify-center space-y-4">
        <BrandLogo variant="light" size="md" />
        <div className="flex items-center gap-2 text-stone-500 font-mono text-xs uppercase tracking-widest pt-4">
          <Loader2 className="w-4 h-4 animate-spin text-champagne" />
          Opening Private Client Salon...
        </div>
      </div>
    );
  }

  if (!user && !profile) {
    return null; // Will redirect in useEffect
  }

  const clientInitials = `${profile?.firstName?.charAt(0) || "P"}${profile?.lastName?.charAt(0) || "C"}`;
  const clientFullName = `${profile?.firstName || "Private"} ${profile?.lastName || "Client"}`;

  return (
    <div className="min-h-screen bg-near-black text-warm-ivory selection:bg-champagne selection:text-near-black flex flex-col">
      {/* ── Top Concierge Banner ── */}
      <header aria-label="Private client header" className="border-b border-stone-800/80 bg-[#11110F]/95 backdrop-blur-2xl sticky top-0 z-40 shadow-[0_4px_30px_rgba(0,0,0,0.35)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-2">
          {/* Brand Anchor & Boutique Navigation */}
          <div className="flex min-w-0 items-center gap-3 sm:gap-6">
            <Link
              href="/"
              className="flex items-center transition-opacity hover:opacity-85 focus:outline-none"
              title="Return to TSquare Clothing Cafe Boutique"
            >
              <BrandLogo variant="light" size="sm" align="left" asLink={false} />
            </Link>

            <span className="text-stone-800 hidden sm:inline select-none">|</span>

            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-stone-400 hover:text-champagne transition-colors uppercase font-mono tracking-wider"
              title="Browse the Public Boutique"
              aria-label="Return to boutique"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-champagne" />
              <span className="hidden md:inline">Return to Boutique</span>
              <span className="hidden sm:inline md:hidden">Boutique</span>
            </Link>

            <span className="text-stone-800 hidden lg:inline select-none">|</span>

            <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-full bg-champagne/10 border border-champagne/20">
              <ShieldCheck className="w-3.5 h-3.5 text-champagne" />
              <span className="text-[10px] uppercase font-mono tracking-[0.25em] text-champagne font-medium">
                Private Client Concierge
              </span>
            </div>
          </div>

          {/* Client Profile, Notifications & Sign Out */}
          <div className="flex shrink-0 items-center gap-1 sm:gap-4">
            {/* Quick Notification Bell */}
            <Link
              href="/account/notifications"
              className="relative p-2.5 text-stone-400 hover:text-warm-ivory hover:bg-stone-800/40 rounded-xl transition-colors focus:outline-none"
              title="Notifications"
              aria-label={`Notifications (${unreadNotificationsCount} unread)`}
            >
              <Bell className="w-4 h-4" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-champagne text-[9px] font-bold text-near-black ring-2 ring-[#11110F]">
                  {unreadNotificationsCount}
                </span>
              )}
            </Link>

            <div className="h-5 w-px bg-stone-800/80 hidden sm:block" />

            {/* Profile Avatar & Name */}
            <Link
              href="/account/profile"
              className="flex items-center gap-3 text-left group hover:opacity-90 transition-opacity focus:outline-none"
              title="View Client Profile"
            >
              <div className="w-9 h-9 rounded-xl bg-champagne/15 border border-champagne/40 flex items-center justify-center font-display text-xs text-champagne font-bold tracking-wider shadow-inner group-hover:border-champagne transition-colors">
                {clientInitials}
              </div>
              <div className="hidden md:block">
                <p className="max-w-40 truncate text-xs text-warm-ivory font-medium leading-none group-hover:text-champagne transition-colors">
                  {clientFullName}
                </p>
                <p className="text-[9px] text-stone-500 font-mono uppercase tracking-widest mt-1">
                  Verified Client
                </p>
              </div>
            </Link>

            {/* Sign Out Button */}
            <button
              onClick={async () => {
                await signOut();
                router.push("/auth/sign-in");
              }}
              title="Sign Out"
              aria-label="Sign out from private client portal"
              className="p-2.5 text-stone-400 hover:text-warm-ivory hover:bg-stone-800/50 rounded-xl transition-colors focus:outline-none ml-1"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Sub Navigation Tabs ── */}
        <div className="border-t border-stone-800/60 bg-[#0F0F0D]/60 backdrop-blur-md">
          <nav
            aria-label="Private Client Navigation"
            className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-2"
          >
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/account"
                  ? pathname === "/account"
                  : pathname.startsWith(item.href);

              const isNotification = item.href === "/account/notifications";

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs uppercase tracking-widest font-medium transition-all whitespace-nowrap relative shrink-0",
                    isActive
                      ? "bg-stone-900/90 text-champagne border border-stone-700/70 shadow-sm"
                      : "text-stone-400 hover:text-warm-ivory hover:bg-stone-800/40"
                  )}
                >
                  <Icon className={cn("w-3.5 h-3.5", isActive ? "text-champagne" : "text-stone-500")} />
                  <span>{item.label}</span>
                  {isNotification && unreadNotificationsCount > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 rounded-full bg-champagne text-near-black text-[9px] font-bold">
                      {unreadNotificationsCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* ── Main Content Area ── */}
      <main id="account-content" className="flex-1 min-w-0 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {children}
      </main>
    </div>
  );
}
