import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  alignment?: "left" | "center" | "right";
  theme?: "dark" | "light";
  className?: string;
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  alignment = "center",
  theme = "dark",
  className,
}: SectionHeaderProps) {
  const alignClasses = {
    left: "text-left items-start",
    center: "text-center items-center mx-auto",
    right: "text-right items-end ml-auto",
  };

  const titleColor = theme === "dark" ? "text-warm-ivory" : "text-near-black";
  const eyebrowColor = theme === "dark" ? "text-stone-400" : "text-stone-500";
  const descColor = theme === "dark" ? "text-stone-300" : "text-stone-600";

  return (
    <div
      className={cn(
        "flex flex-col max-w-3xl mb-12 sm:mb-16",
        alignClasses[alignment],
        className
      )}
    >
      {eyebrow && (
        <span
          className={cn(
            "text-[10px] sm:text-xs uppercase tracking-[0.28em] font-semibold mb-3 select-none",
            eyebrowColor
          )}
        >
          {eyebrow}
        </span>
      )}
      <h2
        className={cn(
          "font-display text-2xl sm:text-4xl lg:text-5xl font-normal tracking-tight leading-tight sm:leading-tight",
          titleColor
        )}
      >
        {title}
      </h2>
      {description && (
        <p
          className={cn(
            "mt-4 sm:mt-5 text-sm sm:text-base font-sans font-light leading-relaxed max-w-2xl",
            descColor
          )}
        >
          {description}
        </p>
      )}
    </div>
  );
}
