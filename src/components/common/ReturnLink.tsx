import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReturnLinkProps {
  href: string;
  label?: string;
  className?: string;
}

export function ReturnLink({ href, label = "Back", className }: ReturnLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2 rounded-xl border border-stone-800 px-3.5 py-2 text-[10px] font-mono font-semibold uppercase tracking-[0.2em] text-stone-400 transition-colors hover:border-champagne/50 hover:text-champagne focus:outline-none focus-visible:ring-2 focus-visible:ring-champagne",
        className
      )}
    >
      <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
      <span>{label}</span>
    </Link>
  );
}

