import Link from "next/link";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  className?: string;
  variant?: "light" | "dark" | "auto";
  size?: "sm" | "md" | "lg" | "xl";
  href?: string;
  asLink?: boolean;
  align?: "left" | "center";
}

export function BrandLogo({
  className,
  variant = "auto",
  size = "md",
  href = "/",
  asLink = true,
  align = "left",
}: BrandLogoProps) {
  const textColorClass =
    variant === "light"
      ? "text-warm-ivory"
      : variant === "dark"
      ? "text-near-black"
      : "text-inherit";

  const subColorClass =
    variant === "light"
      ? "text-stone-300"
      : variant === "dark"
      ? "text-stone-600"
      : "text-stone-400";

  const sizes = {
    sm: {
      mark: "text-xl sm:text-2xl tracking-wider",
      sub: "text-[8px] sm:text-[9px] tracking-[0.22em]",
      spacing: "gap-0.5",
    },
    md: {
      mark: "text-2xl sm:text-3xl tracking-widest font-black",
      sub: "text-[9px] sm:text-[10px] tracking-[0.25em] font-medium",
      spacing: "gap-0.5",
    },
    lg: {
      mark: "text-4xl sm:text-5xl tracking-widest font-black",
      sub: "text-[11px] sm:text-xs tracking-[0.3em] font-medium",
      spacing: "gap-1",
    },
    xl: {
      mark: "text-6xl sm:text-7xl tracking-widest font-black",
      sub: "text-xs sm:text-sm tracking-[0.35em] font-medium",
      spacing: "gap-1.5",
    },
  };

  const content = (
    <div
      className={cn(
        "inline-flex flex-col select-none group transition-opacity duration-300",
        align === "center" ? "items-center text-center" : "items-start text-left",
        sizes[size].spacing,
        className
      )}
    >
      {/* Primary Dominant Identifier */}
      <span
        className={cn(
          "font-bold uppercase leading-none transition-colors duration-300",
          sizes[size].mark,
          textColorClass
        )}
        style={{
          fontFamily:
            "var(--font-clash, 'Clash Display', 'Cabinet Grotesk', -apple-system, sans-serif)",
          letterSpacing: "0.18em",
        }}
      >
        TCC
      </span>

      {/* Supporting Full Brand Identifier directly beneath */}
      <span
        className={cn(
          "uppercase font-medium leading-none whitespace-nowrap transition-colors duration-300",
          sizes[size].sub,
          subColorClass
        )}
        style={{
          letterSpacing: "0.22em",
        }}
      >
        TSquare Clothing Cafe
      </span>
    </div>
  );

  if (asLink) {
    return (
      <Link
        href={href}
        className="inline-block focus:outline-none focus-visible:ring-2 focus-visible:ring-champagne rounded-lg"
        aria-label="TSquare Clothing Cafe Home"
      >
        {content}
      </Link>
    );
  }

  return content;
}
