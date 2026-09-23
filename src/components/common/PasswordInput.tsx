"use client";

import { useId, useState, type ComponentProps } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

type PasswordInputProps = Omit<ComponentProps<"input">, "type"> & {
  visibilityLabel?: string;
};

export function PasswordInput({
  id,
  className,
  disabled,
  visibilityLabel = "password",
  ...props
}: PasswordInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const [isVisible, setIsVisible] = useState(false);
  const toggleLabel = `${isVisible ? "Hide" : "Show"} ${visibilityLabel}`;

  return (
    <div className="relative">
      <input
        {...props}
        id={inputId}
        type={isVisible ? "text" : "password"}
        disabled={disabled}
        className={cn(className, "pr-12")}
      />
      <button
        type="button"
        onClick={() => setIsVisible((visible) => !visible)}
        disabled={disabled}
        aria-label={toggleLabel}
        aria-controls={inputId}
        aria-pressed={isVisible}
        title={toggleLabel}
        className="absolute inset-y-0 right-1 flex w-10 items-center justify-center rounded-lg text-stone-400 transition-colors hover:text-champagne focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-champagne disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isVisible ? <EyeOff aria-hidden="true" className="h-4 w-4" /> : <Eye aria-hidden="true" className="h-4 w-4" />}
      </button>
    </div>
  );
}
