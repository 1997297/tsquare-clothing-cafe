"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useAccountData } from "@/lib/account-store";
import { BrandLogo } from "@/components/common/BrandLogo";
import { ProfileAvatar } from "@/components/common/ProfileAvatar";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { NavigationDrawer } from "@/components/common/NavigationDrawer";
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
  CreditCard,
  Sparkles,
  MessageSquare,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/account", label: "Overview", icon: Compass },
  { href: "/account/requests", label: "Requests", icon: FileText },
  { href: "/account/orders", label: "Orders", icon: Package },
  { href: "/account/measurements", label: "Measurements", icon: Ruler },
  { href: "/account/appointments", label: "Appointments", icon: Calendar },
  { href: "/account/payments", label: "Payments", icon: CreditCard },
  { href: "/account/wardrobe", label: "Wardrobe", icon: Sparkles },
  { href: "/account/saved", label: "Saved Looks", icon: Heart },
  { href: "/account/concierge", label: "Concierge", icon: MessageSquare },
  { href: "/account/notifications", label: "Notifications", icon: Bell },
  { href: "/account/profile", label: "Profile", icon: User },
  { href: "/account/settings", label: "Settings", icon: Settings },
];

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, isLoading, signOut } = useAuth();
  const {
    unreadNotificationsCount,
    isLoading: isAccountLoading,
    error: accountError,
    reloadData,
  } = useAccountData();
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => setMobileOpen(false), [pathname]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isLoading && !user && !profile) {
      router.push(`/auth/sign-in?next=${encodeURIComponent(pathname)}`);
    }
  }, [user, profile, isLoading, router, pathname]);

  if (!mounted || isLoading || (user && isAccountLoading)) {
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

  const clientFullName = `${profile?.firstName || "Private"} ${profile?.lastName || "Client"}`;

  const navigation = <nav aria-label="Private Client Navigation" className="space-y-1.5">
    {NAV_ITEMS.map(item => {
      const Icon = item.icon;
      const active = item.href === "/account" ? pathname === "/account" : pathname.startsWith(item.href);
      return <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined}
        className={cn("flex items-center gap-3 rounded-xl border px-3 py-3 text-xs uppercase tracking-wider transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-champagne", active ? "border-champagne/30 bg-champagne/10 text-champagne" : "border-transparent text-stone-400 hover:border-stone-800 hover:bg-stone-900/70 hover:text-warm-ivory")}>
        <Icon className="h-4 w-4 shrink-0" /><span>{item.label}</span>
        {item.href === "/account/notifications" && unreadNotificationsCount > 0 && <span className="ml-auto rounded-full bg-champagne px-2 py-0.5 text-[10px] text-near-black">{unreadNotificationsCount}</span>}
      </Link>;
    })}
  </nav>;

  return (
    <div className="min-h-screen bg-near-black text-warm-ivory selection:bg-champagne selection:text-near-black flex flex-col">
      <meta name="robots" content="noindex, nofollow, noarchive" />
      <meta name="googlebot" content="noindex, nofollow, noarchive" />
      {/* ── Top Concierge Banner ── */}
      <header aria-label="Private client header" className="border-b border-stone-800/80 bg-near-black/95 backdrop-blur-2xl sticky top-0 z-40 shadow-[0_4px_30px_rgba(0,0,0,0.35)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-2">
          {/* Brand Anchor & Boutique Navigation */}
          <div className="flex min-w-0 items-center gap-3 sm:gap-6">
            <button type="button" onClick={() => setMobileOpen(true)} aria-label="Open client navigation" aria-expanded={mobileOpen} aria-controls="client-navigation" className="shrink-0 rounded-xl border border-stone-800 p-2 text-stone-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-champagne lg:hidden"><Menu className="h-5 w-5" /></button>
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
            <ThemeToggle />
            {/* Quick Notification Bell */}
            <Link
              href="/account/notifications"
              className="relative p-2.5 text-stone-400 hover:text-warm-ivory hover:bg-stone-800/40 rounded-xl transition-colors focus:outline-none"
              title="Notifications"
              aria-label={`Notifications (${unreadNotificationsCount} unread)`}
            >
              <Bell className="w-4 h-4" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-champagne text-[9px] font-bold text-near-black ring-2 ring-near-black">
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
              <ProfileAvatar
                profile={profile}
                className="h-9 w-9 transition-colors group-hover:border-champagne"
                priority
              />
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

      </header>
      <NavigationDrawer open={mobileOpen} onClose={() => setMobileOpen(false)} id="client-navigation" title="Client navigation">{navigation}</NavigationDrawer>
      <div className="mx-auto flex w-full max-w-[1600px] flex-1">
        <aside className="sticky top-20 hidden h-[calc(100dvh-5rem)] w-64 shrink-0 overflow-y-auto overscroll-contain border-r border-stone-800/70 p-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] lg:block">{navigation}</aside>
      {/* ── Main Content Area ── */}
      <main id="account-content" className="min-w-0 flex-1 px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        {accountError ? (
          <div className="max-w-xl mx-auto py-20 text-center space-y-4" role="alert">
            <ShieldCheck className="w-9 h-9 text-amber-400 mx-auto" />
            <h1 className="font-display text-2xl">Private account data is unavailable</h1>
            <p className="text-sm text-stone-400">{accountError}</p>
            <button onClick={() => void reloadData()} className="px-5 py-2.5 rounded-xl bg-champagne text-near-black text-xs uppercase tracking-wider font-bold">Try Again</button>
          </div>
        ) : children}
      </main>
      </div>
    </div>
  );
}
