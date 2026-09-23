import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "champagne" | "ghost";
  size?: "sm" | "md" | "lg" | "xl";
  href?: string;
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      href,
      fullWidth = false,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-sans uppercase tracking-[0.18em] text-xs font-semibold rounded-xl transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-champagne focus-visible:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed select-none active:scale-[0.99]";

    const variants = {
      primary:
        "bg-near-black text-warm-ivory hover:bg-espresso border border-stone-800 shadow-sm",
      secondary:
        "bg-warm-ivory text-near-black hover:bg-white border border-stone-300 shadow-sm",
      outline:
        "bg-transparent text-current border border-current hover:bg-near-black/5 dark:hover:bg-warm-ivory/10",
      champagne:
        "bg-champagne text-near-black hover:bg-champagne-light border border-champagne shadow-md font-bold",
      ghost:
        "bg-transparent text-current hover:text-champagne border-transparent hover:bg-stone-500/10",
    };

    const sizes = {
      sm: "h-9 px-4 text-[10px] rounded-lg",
      md: "h-11 px-6 text-xs rounded-xl",
      lg: "h-14 px-8 text-xs tracking-[0.22em] rounded-xl",
      xl: "h-16 px-10 text-sm tracking-[0.25em] rounded-2xl",
    };

    const combinedClasses = cn(
      baseStyles,
      variants[variant],
      sizes[size],
      fullWidth && "w-full",
      className
    );

    if (href) {
      return (
        <Link href={href} className={combinedClasses}>
          {children}
        </Link>
      );
    }

    return (
      <button
        ref={ref}
        className={combinedClasses}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
