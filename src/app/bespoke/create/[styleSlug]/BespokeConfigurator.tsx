"use client";

import { useEffect, useRef } from "react";
import { Style } from "@/types";
import { ProductCategory } from "@/types";
import { completeSubmission, useBespokeConfig } from "@/lib/bespoke-store";
import { useAccountData } from "@/lib/account-store";
import { useAuth } from "@/lib/auth-context";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { ConfiguratorLayout } from "@/components/bespoke/ConfiguratorLayout";
import { StyleStep } from "@/components/bespoke/steps/StyleStep";
import { FabricStep } from "@/components/bespoke/steps/FabricStep";
import { ColourStep } from "@/components/bespoke/steps/ColourStep";
import { DetailsStep } from "@/components/bespoke/steps/DetailsStep";
import { FitStep } from "@/components/bespoke/steps/FitStep";
import { MeasurementsStep } from "@/components/bespoke/steps/MeasurementsStep";
import { OccasionStep } from "@/components/bespoke/steps/OccasionStep";
import { RequiredDateStep } from "@/components/bespoke/steps/RequiredDateStep";
import { AppointmentStep } from "@/components/bespoke/steps/AppointmentStep";
import { ContactStep } from "@/components/bespoke/steps/ContactStep";
import { ReviewStep } from "@/components/bespoke/steps/ReviewStep";

interface BespokeConfiguratorProps {
  styleSlug: string;
  style: Style | null;
  isIdeaPath: boolean;
  inspirationWardrobeId?: string;
}

export function BespokeConfigurator({
  styleSlug,
  style,
  isIdeaPath,
  inspirationWardrobeId,
}: BespokeConfiguratorProps) {
  const {
    config,
    isLoaded,
    update,
    goToStep,
    goNext,
    goBack,
    setFabric,
    setColour,
    setFitPreference,
    setMeasurements,
    setMeasurementUnit,
    setPreferences,
    setAppointment,
    setContact,
    setGarmentCategory,
    submitRequest,
  } = useBespokeConfig(styleSlug, isIdeaPath);
  const { addBespokeRequest, wardrobe } = useAccountData();
  const { user } = useAuth();
  const inspirationApplied = useRef(false);

  const handleBespokeSubmit = async () => {
    const payload = submitRequest();
    const saved = user && isSupabaseConfigured
      ? await addBespokeRequest(payload)
      : { ...payload, persistence: "local" as const };
    completeSubmission(saved);
    return saved;
  };

  // ── Initialize style data into config on first render ────
  // (Only for style path, not idea path)
  useEffect(() => {
    if (!isLoaded) return;
    if (style && !config.styleId) {
      update("styleId", style.id);
      update("styleCode", style.code);
      update("styleName", style.name);
      update("styleImage", style.images[0]);
      update("garmentCategory", style.category);
    }
  }, [config.styleId, isLoaded, style, update]);

  useEffect(() => {
    if (!isLoaded || !inspirationWardrobeId || inspirationApplied.current) return;
    const inspiration = wardrobe.find((item) => item.id === inspirationWardrobeId);
    if (!inspiration) return;
    inspirationApplied.current = true;
    update("garmentCategory", inspiration.category);
    update("fabric", {
      id: `wardrobe-${inspiration.id}`,
      name: inspiration.fabricSnapshot.name,
      description: inspiration.fabricSnapshot.description ?? "Inspired by a completed TSquare garment.",
      finish: inspiration.fabricSnapshot.finish,
      weight: inspiration.fabricSnapshot.weight,
      categories: [inspiration.category],
    });
    update("colour", {
      id: `wardrobe-${inspiration.id}`,
      name: inspiration.colourSnapshot.name,
      hex: inspiration.colourSnapshot.hex,
    });
    update("preferences", {
      ...inspiration.preferencesSnapshot,
      specialInstructions: `Inspired by wardrobe piece ${inspiration.styleCode}. Please confirm all measurements before cutting.`,
    });
  }, [inspirationWardrobeId, isLoaded, update, wardrobe]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-near-black flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-champagne/30 border-t-champagne rounded-full animate-spin mx-auto" />
          <p className="text-xs text-stone-500 uppercase tracking-widest font-mono">
            Preparing your configuration
          </p>
        </div>
      </div>
    );
  }

  const step = config.currentStep;

  function handleStepClick(targetStep: number) {
    if (targetStep < step) goToStep(targetStep);
  }

  function renderStep() {
    switch (step) {
      case 0:
        return (
          <StyleStep
            config={config}
            style={style ?? undefined}
            onContinue={goNext}
            onSelectCategory={(cat: ProductCategory) => {
              setGarmentCategory(cat);
            }}
          />
        );

      case 1:
        return (
          <FabricStep
            config={config}
            onSelect={setFabric}
            onContinue={goNext}
            onBack={goBack}
          />
        );

      case 2:
        return (
          <ColourStep
            config={config}
            onSelect={setColour}
            onContinue={goNext}
            onBack={goBack}
          />
        );

      case 3:
        return (
          <DetailsStep
            config={config}
            onUpdate={setPreferences}
            onContinue={goNext}
            onBack={goBack}
          />
        );

      case 4:
        return (
          <FitStep
            config={config}
            onSelect={setFitPreference}
            onContinue={goNext}
            onBack={goBack}
          />
        );

      case 5:
        return (
          <MeasurementsStep
            config={config}
            onMethodSelect={(m) => update("measurementMethod", m)}
            onMeasurementsChange={setMeasurements}
            onUnitChange={setMeasurementUnit}
            onConfidenceChange={(v) => update("measurementConfidence", v)}
            onContinue={goNext}
            onBack={goBack}
          />
        );

      case 6:
        return (
          <OccasionStep
            config={config}
            onOccasionSelect={(id) => update("occasion", id)}
            onEventNameChange={(name) => update("eventName", name)}
            onEventDateChange={(date) => update("eventDate", date)}
            onContinue={goNext}
            onBack={goBack}
          />
        );

      case 7:
        return (
          <RequiredDateStep
            config={config}
            onDateChange={(date) => update("requiredDate", date)}
            onContinue={goNext}
            onBack={goBack}
          />
        );

      case 8:
        return (
          <AppointmentStep
            config={config}
            onUpdate={setAppointment}
            onContinue={goNext}
            onBack={goBack}
          />
        );

      case 9:
        return (
          <ContactStep
            config={config}
            onUpdate={setContact}
            onContinue={goNext}
            onBack={goBack}
          />
        );

      case 10:
        return (
          <ReviewStep
            config={config}
            onEdit={goToStep}
            onSubmit={handleBespokeSubmit}
            onBack={goBack}
          />
        );

      default:
        return null;
    }
  }

  return (
    <ConfiguratorLayout config={config} onStepClick={handleStepClick}>
      {renderStep()}
    </ConfiguratorLayout>
  );
}
