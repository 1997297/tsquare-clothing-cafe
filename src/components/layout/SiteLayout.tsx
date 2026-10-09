"use client";

import type { ReactNode } from "react";
import { useSelectedLayoutSegments } from "next/navigation";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";

export function SiteLayout({ children }: { children: ReactNode }) {
  const [section, page] = useSelectedLayoutSegments();
  // Match the rendered route tree, not the requested URL: unmatched URLs render
  // the root not-found tree on the server, even under an /admin/... URL.
  const hasDedicatedLayout =
    section === "account" ||
    section === "admin" ||
    (section === "auth" && page === "access-denied") ||
    (section === "bespoke" && page === "create");

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
