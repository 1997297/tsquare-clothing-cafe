import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
  variant?: "outline" | "champagne" | "dark" | "stone";
}

export function Badge({
  children,
  className,
  variant = "outline",
}: BadgeProps) {
  const variants = {
    outline: "border border-stone-400/40 text-stone-700 bg-transparent",
    champagne: "border border-champagne/40 text-champagne-dark bg-champagne/10",
    dark: "border border-near-black/20 text-warm-ivory bg-near-black",
    stone: "border border-stone-200 text-stone-800 bg-stone-100",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center text-[10px] tracking-[0.2em] uppercase font-semibold px-3 py-1 rounded-full select-none",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
