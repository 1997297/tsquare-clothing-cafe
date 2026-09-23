"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BespokeConfiguration } from "@/types/bespoke";
import { StyleSummary } from "@/components/bespoke/StyleSummary";
import { ConfiguratorProgress } from "@/components/bespoke/ConfiguratorProgress";
import { BrandLogo } from "@/components/common/BrandLogo";

interface ConfiguratorLayoutProps {
  config: BespokeConfiguration;
  children: ReactNode;
  onStepClick?: (step: number) => void;
}

export function ConfiguratorLayout({
  config,
  children,
  onStepClick,
}: ConfiguratorLayoutProps) {
  return (
    <div className="min-h-screen bg-near-black flex flex-col">
      {/* ── Top bar ── */}
      <header className="sticky top-0 z-30 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 border-b border-stone-800/60 bg-[#11110F]/90 backdrop-blur-xl">
        {/* Back */}
        <Link
          href="/styles"
          className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest text-stone-400 hover:text-warm-ivory transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Browse Styles
        </Link>

        {/* Brand */}
        <BrandLogo variant="light" size="sm" align="center" />

        {/* Mobile progress pill */}
        <div className="lg:hidden">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono text-champagne">
              {String(config.currentStep + 1).padStart(2, "0")}
            </span>
            <span className="text-[10px] text-stone-500">/</span>
            <span className="text-[10px] text-stone-500">11</span>
          </div>
        </div>

        {/* Desktop spacer */}
        <div className="hidden lg:block w-24" />
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Desktop Sidebar ── */}
        <aside className="hidden lg:flex flex-col w-80 xl:w-96 border-r border-stone-800/60 bg-[#0E0E0C] overflow-y-auto">
          <div className="p-6 xl:p-8 space-y-8 flex-1">
            {/* Garment summary */}
            <StyleSummary config={config} />

            {/* Progress */}
            <div className="border-t border-stone-800/60 pt-6">
              <p className="text-[10px] uppercase font-mono tracking-[0.25em] text-stone-500 mb-4">
                Your Journey
              </p>
              <ConfiguratorProgress
                currentStep={config.currentStep}
                onStepClick={onStepClick}
              />
            </div>
          </div>
        </aside>

        {/* ── Main Content ── */}
        <main className="flex-1 overflow-y-auto">
          {/* Mobile: compact garment reference strip */}
          <div className="lg:hidden px-4 pt-4 pb-3 border-b border-stone-800/50 bg-[#0E0E0C]">
            <StyleSummary config={config} compact />
          </div>

          {/* Mobile: progress dots */}
          <div className="lg:hidden px-4 py-3 border-b border-stone-800/40">
            <ConfiguratorProgress
              currentStep={config.currentStep}
              compact
              onStepClick={onStepClick}
            />
          </div>

          {/* Step content */}
          <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
