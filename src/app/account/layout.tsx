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
      <header className="border-b border-stone-800/80 bg-[#121210]/95 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-stone-400 hover:text-champagne transition-colors uppercase font-mono tracking-wider"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to TCC</span>
            </Link>
            <span className="text-stone-700 hidden sm:inline">|</span>
            <div className="hidden sm:flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-champagne" />
              <span className="text-[10px] uppercase font-mono tracking-[0.25em] text-stone-400">
                Private Client Concierge
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/account/profile"
              className="flex items-center gap-3 text-left group hover:opacity-90 transition-opacity"
            >
              <div className="w-8 h-8 rounded-full bg-champagne/15 border border-champagne/40 flex items-center justify-center font-display text-xs text-champagne font-bold tracking-wider">
                {clientInitials}
              </div>
              <div className="hidden md:block">
                <p className="text-xs text-warm-ivory font-medium leading-none group-hover:text-champagne transition-colors">
                  {clientFullName}
                </p>
                <p className="text-[9px] text-stone-500 font-mono uppercase tracking-widest mt-0.5">
                  Verified Client
                </p>
              </div>
            </Link>

            <button
              onClick={async () => {
                await signOut();
                router.push("/auth/sign-in");
              }}
              title="Sign Out"
              aria-label="Sign out from private client portal"
              className="p-2 text-stone-400 hover:text-warm-ivory hover:bg-stone-800/40 rounded-xl transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Sub Navigation Tabs ── */}
        <nav
          aria-label="Private Client Navigation"
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-1 overflow-x-auto no-scrollbar py-1"
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
                className={cn(
                  "flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs uppercase tracking-widest font-medium transition-all whitespace-nowrap relative shrink-0",
                  isActive
                    ? "bg-stone-900 text-champagne border border-stone-800 shadow-sm"
                    : "text-stone-400 hover:text-warm-ivory hover:bg-stone-900/40"
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
      </header>

      {/* ── Main Content Area ── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {children}
      </main>
    </div>
  );
}
