"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CalendarDays,
  ChevronRight,
  ClipboardList,
  CreditCard,
  Crown,
  GalleryVerticalEnd,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareText,
  PackageCheck,
  ShieldCheck,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { BrandLogo } from "@/components/common/BrandLogo";
import { ProfileAvatar } from "@/components/common/ProfileAvatar";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { useAuth } from "@/lib/auth-context";
import { getRoleLabel, type StaffRole } from "@/lib/auth/roles";
import { cn } from "@/lib/utils";

const OPERATIONAL_NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/collections", label: "Collections", icon: GalleryVerticalEnd },
  { href: "/admin/requests", label: "Requests", icon: ClipboardList },
  { href: "/admin/orders", label: "Orders", icon: PackageCheck },
  { href: "/admin/payments", label: "Payments", icon: CreditCard },
  { href: "/admin/appointments", label: "Appointments", icon: CalendarDays },
  { href: "/admin/concierge", label: "Concierge", icon: MessageSquareText },
  { href: "/admin/clients", label: "Clients", icon: Users },
];

interface AdminShellProps {
  children: ReactNode;
  conciergeUnread?: number | null;
  identity: {
    displayName: string;
    email: string;
    role: StaffRole;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };
}

export function AdminShell({ children, identity, conciergeUnread }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigation = identity.role === "ceo"
    ? [...OPERATIONAL_NAV, { href: "/admin/staff", label: "Staff", icon: ShieldCheck }]
    : OPERATIONAL_NAV;
  const avatarIdentity = {
    firstName: identity.firstName,
    lastName: identity.lastName,
    avatarUrl: identity.avatarUrl,
  };
  const profileActive = pathname === "/admin/profile";

  useEffect(() => setMobileOpen(false), [pathname]);

  const nav = (
    <nav aria-label="Atelier operations" className="space-y-1.5">
      {navigation.map((item) => {
        const Icon = item.icon;
        const active = item.href === "/admin"
          ? pathname === "/admin"
          : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs uppercase tracking-[0.16em] transition-colors",
              active
                ? "border border-champagne/30 bg-champagne/10 text-champagne"
                : "border border-transparent text-stone-400 hover:border-stone-800 hover:bg-stone-900/70 hover:text-warm-ivory"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span>{item.label}</span>
            {item.href === "/admin/concierge" && conciergeUnread != null && conciergeUnread > 0 && <span aria-label={`${conciergeUnread} messages unread by TCC`} className="rounded-full bg-champagne/15 px-2 py-0.5 text-[10px] text-champagne">{conciergeUnread > 99 ? "99+" : conciergeUnread}</span>}
            <ChevronRight className={cn("ml-auto h-3.5 w-3.5", active ? "opacity-100" : "opacity-0 group-hover:opacity-70")} />
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-near-black text-warm-ivory selection:bg-champagne selection:text-near-black">
      <header className="sticky top-0 z-40 border-b border-stone-800/80 bg-near-black/95 backdrop-blur-2xl">
        <div className="flex h-16 items-center gap-3 px-4 sm:h-20 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            className="rounded-xl border border-stone-800 p-2.5 text-stone-300 lg:hidden"
            aria-label={mobileOpen ? "Close operations navigation" : "Open operations navigation"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <Link href="/admin" className="min-w-0 shrink-0">
            <BrandLogo variant="light" size="sm" align="left" asLink={false} />
          </Link>
          <div className="hidden h-6 w-px bg-stone-800 sm:block" />
          <div className="hidden min-w-0 sm:block">
            <p className="text-[9px] font-mono uppercase tracking-[0.28em] text-champagne-dark">Private Atelier</p>
            <p className="truncate text-xs text-stone-400">Operations Control Room</p>
          </div>

          <div className="ml-auto flex items-center gap-2 sm:gap-4">
            <ThemeToggle />
            <div className="hidden h-6 w-px bg-stone-800 sm:block" />
            <Link
              href="/admin/profile"
              aria-label="Open staff profile"
              aria-current={profileActive ? "page" : undefined}
              title="Open staff profile"
              className={cn(
                "group flex min-w-0 items-center gap-3 rounded-xl p-1 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-champagne",
                profileActive ? "bg-champagne/10" : "hover:bg-stone-900/70"
              )}
            >
              <div className="hidden min-w-0 text-right md:block">
                <p className="max-w-48 truncate text-xs font-medium text-warm-ivory">{identity.displayName}</p>
                <p className="mt-1 text-[9px] font-mono uppercase tracking-[0.2em] text-champagne-dark">
                  {getRoleLabel(identity.role)}
                </p>
              </div>
              <ProfileAvatar
                profile={avatarIdentity}
                className="h-9 w-9 rounded-full text-[10px] transition-colors group-hover:border-champagne"
                priority
              />
            </Link>
            <button
              type="button"
              onClick={async () => {
                await signOut();
                router.replace("/auth/sign-in");
              }}
              className="rounded-xl p-2.5 text-stone-400 transition-colors hover:bg-stone-900 hover:text-warm-ivory"
              title="Sign out"
              aria-label="Sign out of TCC operations"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 top-16 z-30 bg-near-black/95 px-4 py-6 backdrop-blur-2xl sm:top-20 lg:hidden">
          <Link
            href="/admin/profile"
            aria-current={profileActive ? "page" : undefined}
            className={cn(
              "mb-6 flex items-center gap-4 rounded-2xl border bg-stone-950/60 p-4 transition-colors",
              profileActive ? "border-champagne/40" : "border-stone-800 hover:border-stone-700"
            )}
          >
            <ProfileAvatar profile={avatarIdentity} className="h-12 w-12 rounded-xl" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{identity.displayName}</p>
              <p className="mt-1 truncate text-xs text-stone-500">{identity.email}</p>
              <p className="mt-2 text-[9px] font-mono uppercase tracking-[0.2em] text-champagne-dark">
                {getRoleLabel(identity.role)}
              </p>
            </div>
            <span className="text-[9px] font-mono uppercase tracking-widest text-champagne">Profile</span>
          </Link>
          {nav}
        </div>
      )}

      <div className="mx-auto flex w-full max-w-[1600px]">
        <aside className="sticky top-20 hidden h-[calc(100vh-5rem)] w-72 shrink-0 border-r border-stone-800/70 px-5 py-8 lg:flex lg:flex-col">
          <div className="mb-7 px-3">
            <div className="flex items-center gap-2 text-champagne">
              {identity.role === "ceo" ? <Crown className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
              <span className="text-[10px] font-mono uppercase tracking-[0.24em] text-champagne-dark">Authorized Staff</span>
            </div>
            <p className="mt-3 text-xs leading-5 text-stone-500">
              Live operational records. Access is logged and controlled by TCC authorization policy.
            </p>
          </div>
          {nav}
          <div className="mt-auto space-y-2">
            <Link
              href="/admin/profile"
              aria-current={profileActive ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl border px-4 py-3 text-[10px] uppercase tracking-[0.2em] transition-colors",
                profileActive
                  ? "border-champagne/40 bg-champagne/10 text-champagne"
                  : "border-stone-800 text-stone-500 hover:text-warm-ivory"
              )}
            >
              <UserRound className="h-4 w-4" />
              Staff Profile
            </Link>
            <Link
              href="/"
              className="block rounded-xl border border-stone-800 px-4 py-3 text-center text-[10px] uppercase tracking-[0.2em] text-stone-500 hover:text-warm-ivory"
            >
              Return to Boutique
            </Link>
          </div>
        </aside>

        <main id="admin-content" className="min-w-0 flex-1 px-4 py-8 sm:px-6 sm:py-10 lg:px-10 xl:px-14">
          {children}
        </main>
      </div>
    </div>
  );
}
