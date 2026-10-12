import type { Metadata } from "next";
import Link from "next/link";
import { LockKeyhole, ArrowLeft } from "lucide-react";
import { BrandLogo } from "@/components/common/BrandLogo";

export const metadata: Metadata = {
  title: "Access Restricted",
  robots: { index: false, follow: false },
};

export default async function AccessDeniedPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;
  const isInactive = reason === "inactive";
  const isServiceIssue = reason === "service";

  const message = isInactive
    ? "This staff account is inactive. Contact the TCC CEO to restore authorized access."
    : isServiceIssue
      ? "We could not verify account authorization right now. Please try again shortly."
      : "This account is not authorized to enter the TCC back office.";

  return (
    <div className="min-h-screen bg-near-black text-warm-ivory flex items-center justify-center px-4 py-20">
      <div className="w-full max-w-lg rounded-3xl border border-stone-800 bg-surface p-8 sm:p-12 text-center shadow-2xl">
        <BrandLogo variant="light" size="md" />
        <div className="mx-auto mt-10 flex h-14 w-14 items-center justify-center rounded-full border border-champagne/30 bg-champagne/10">
          <LockKeyhole className="h-6 w-6 text-champagne" />
        </div>
        <h1 className="mt-6 font-display text-3xl">Access Restricted</h1>
        <p className="mx-auto mt-4 max-w-sm text-sm leading-7 text-stone-400">
          {message}
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          {!isInactive && <Link
            href="/account"
            className="inline-flex items-center justify-center rounded-xl bg-action px-5 py-3 text-xs font-bold uppercase tracking-widest text-on-action"
          >
            Client Area
          </Link>}
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-stone-700 px-5 py-3 text-xs uppercase tracking-widest text-stone-300 hover:text-warm-ivory"
          >
            <ArrowLeft className="h-4 w-4" />
            Return to Boutique
          </Link>
        </div>
      </div>
    </div>
  );
}
