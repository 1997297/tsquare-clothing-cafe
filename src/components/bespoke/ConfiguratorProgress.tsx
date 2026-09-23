"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

const STEPS = [
  { num: "01", label: "Style" },
  { num: "02", label: "Fabric" },
  { num: "03", label: "Colour" },
  { num: "04", label: "Details" },
  { num: "05", label: "Fit" },
  { num: "06", label: "Measurements" },
  { num: "07", label: "Occasion" },
  { num: "08", label: "Date" },
  { num: "09", label: "Appointment" },
  { num: "10", label: "Contact" },
  { num: "11", label: "Review" },
];

interface ConfiguratorProgressProps {
  currentStep: number;
  onStepClick?: (step: number) => void;
  compact?: boolean; // mobile compact pill mode
}

export function ConfiguratorProgress({
  currentStep,
  onStepClick,
  compact,
}: ConfiguratorProgressProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-mono text-champagne tracking-widest">
          {STEPS[currentStep]?.num}
        </span>
        <span className="text-[10px] text-warm-ivory uppercase tracking-widest">
          {STEPS[currentStep]?.label}
        </span>
        <span className="text-stone-700 text-[10px]">
          / {STEPS.length}
        </span>
        {/* Mini dot track */}
        <div className="flex items-center gap-0.5 ml-1">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1 rounded-full transition-all duration-300",
                i < currentStep
                  ? "bg-champagne w-1.5"
                  : i === currentStep
                  ? "bg-warm-ivory w-2.5"
                  : "bg-stone-800 w-1"
              )}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <nav aria-label="Configuration progress" className="space-y-1">
      {STEPS.map((step, i) => {
        const isCompleted = i < currentStep;
        const isActive = i === currentStep;
        const isClickable = isCompleted && onStepClick;

        return (
          <button
            key={step.num}
            onClick={isClickable ? () => onStepClick(i) : undefined}
            disabled={!isClickable}
            aria-current={isActive ? "step" : undefined}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-all duration-200 group",
              isActive && "bg-stone-900/60",
              isClickable && "hover:bg-stone-900/40 cursor-pointer",
              !isClickable && !isActive && "cursor-default"
            )}
          >
            {/* Step indicator */}
            <div
              className={cn(
                "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-200 border",
                isCompleted
                  ? "bg-champagne border-champagne text-near-black"
                  : isActive
                  ? "border-warm-ivory bg-transparent text-warm-ivory"
                  : "border-stone-800 bg-transparent text-stone-700"
              )}
            >
              {isCompleted ? (
                <Check className="w-3 h-3 stroke-[3]" />
              ) : (
                <span>{step.num}</span>
              )}
            </div>

            {/* Label */}
            <span
              className={cn(
                "text-xs uppercase tracking-widest transition-colors duration-200",
                isCompleted
                  ? "text-stone-400 group-hover:text-champagne"
                  : isActive
                  ? "text-warm-ivory font-semibold"
                  : "text-stone-700"
              )}
            >
              {step.label}
            </span>

            {/* Active line indicator */}
            {isActive && (
              <div className="ml-auto w-1 h-4 rounded-full bg-champagne" />
            )}
          </button>
        );
      })}
    </nav>
  );
}
