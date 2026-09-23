"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";

export function SiteLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const hasDedicatedLayout =
    pathname === "/account" ||
    pathname.startsWith("/account/") ||
    pathname === "/bespoke/create" ||
    pathname.startsWith("/bespoke/create/");

  // These routes own their header and main content landmark.
  if (hasDedicatedLayout) return <>{children}</>;

  return (
    <>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
