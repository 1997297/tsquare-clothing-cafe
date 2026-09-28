import Link from "next/link";
import { ArrowLeft, LockKeyhole } from "lucide-react";

interface AdminModulePlaceholderProps {
  eyebrow: string;
  title: string;
  description: string;
  nextPhase: string;
}

export function AdminModulePlaceholder({
  eyebrow,
  title,
  description,
  nextPhase,
}: AdminModulePlaceholderProps) {
  return (
    <div className="mx-auto max-w-4xl">
      <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-champagne-dark">{eyebrow}</p>
      <h1 className="mt-3 font-display text-3xl sm:text-4xl">{title}</h1>
      <p className="mt-4 max-w-2xl text-sm leading-7 text-stone-400">{description}</p>

      <section className="mt-10 rounded-3xl border border-stone-800 bg-stone-950/60 p-7 sm:p-10">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-champagne/30 bg-champagne/10">
          <LockKeyhole className="h-5 w-5 text-champagne" />
        </div>
        <h2 className="mt-6 font-display text-2xl">Authorization foundation ready</h2>
        <p className="mt-3 max-w-xl text-sm leading-7 text-stone-400">
          This route is protected for authorized atelier staff. Operational tools and records have intentionally not been fabricated in Phase 2.
        </p>
        <p className="mt-5 text-[10px] font-mono uppercase tracking-[0.22em] text-stone-500">
          Scheduled implementation: {nextPhase}
        </p>
        <Link
          href="/admin"
          className="mt-8 inline-flex items-center gap-2 rounded-xl border border-stone-700 px-4 py-2.5 text-xs uppercase tracking-widest text-stone-300 hover:text-warm-ivory"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Overview
        </Link>
      </section>
    </div>
  );
}
