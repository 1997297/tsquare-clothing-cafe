"use client";

import { useState } from "react";
import { ArrowRight, ArrowLeft, ChevronDown, ChevronUp, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { useAccountData } from "@/lib/account-store";
import { BespokeConfiguration, MeasurementSet, MeasurementUnit, MeasurementMethod } from "@/types/bespoke";

interface MeasurementsStepProps {
  config: BespokeConfiguration;
  onMethodSelect: (method: MeasurementMethod) => void;
  onMeasurementsChange: (m: MeasurementSet) => void;
  onUnitChange: (u: MeasurementUnit) => void;
  onConfidenceChange: (v: boolean) => void;
  onContinue: () => void;
  onBack: () => void;
}

type Section = "upper" | "torso" | "lower";

const SECTIONS: { id: Section; label: string; fields: { key: keyof MeasurementSet; label: string; hint: string }[] }[] = [
  {
    id: "upper",
    label: "Upper Body",
    fields: [
      { key: "neck", label: "Neck", hint: "Around the base of your neck where the collar sits." },
      { key: "shoulder", label: "Shoulder", hint: "Straight across from shoulder point to shoulder point." },
      { key: "chest", label: "Chest", hint: "Fullest part of chest, under the arms, horizontal." },
      { key: "sleeveLength", label: "Sleeve Length", hint: "Shoulder point to wrist with arm slightly bent." },
      { key: "bicep", label: "Bicep", hint: "Around the fullest part of the upper arm." },
      { key: "wrist", label: "Wrist", hint: "Around the wrist at the bone." },
    ],
  },
  {
    id: "torso",
    label: "Torso",
    fields: [
      { key: "stomach", label: "Stomach", hint: "Around the stomach at its fullest point." },
      { key: "waist", label: "Waist", hint: "Natural waist, the narrowest point of the torso." },
      { key: "topLength", label: "Top Length", hint: "From the top of the shoulder to your preferred garment hem." },
    ],
  },
  {
    id: "lower",
    label: "Lower Body",
    fields: [
      { key: "trouserWaist", label: "Trouser Waist", hint: "Where you prefer to wear your trousers." },
      { key: "hip", label: "Hip", hint: "Fullest part of the seat, approximately 20cm below the waist." },
      { key: "thigh", label: "Thigh", hint: "Around the fullest part of the upper thigh." },
      { key: "knee", label: "Knee", hint: "Around the knee, standing upright." },
      { key: "trouserLength", label: "Trouser Length", hint: "Inside leg from crotch to ankle bone." },
      { key: "ankle", label: "Ankle", hint: "Around the ankle bone." },
    ],
  },
];

export function MeasurementsStep({
  config,
  onMethodSelect,
  onMeasurementsChange,
  onUnitChange,
  onConfidenceChange,
  onContinue,
  onBack,
}: MeasurementsStepProps) {
  const { user, profile } = useAuth();
  const { currentMeasurement } = useAccountData();
  const [openSection, setOpenSection] = useState<Section>("upper");
  const [errors, setErrors] = useState<Partial<Record<keyof MeasurementSet, string>>>({});

  const { measurementMethod, measurementUnit, measurements, measurementConfidence } = config;

  function handleMeasurementChange(key: keyof MeasurementSet, raw: string) {
    const num = parseFloat(raw);
    const updated = { ...measurements };
    if (raw === "" || isNaN(num)) {
      delete updated[key];
    } else {
      (updated[key] as number) = num;
    }
    // Validate
    if (!isNaN(num) && (num <= 0 || num > 300)) {
      setErrors((prev) => ({ ...prev, [key]: "Enter a valid measurement (1 to 300)" }));
    } else {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
    onMeasurementsChange(updated);
  }

  const hasManualMeasurements =
    Object.values(measurements).some((v) => v !== undefined && v !== null);

  const canContinue =
    measurementMethod === "saved" ||
    measurementMethod === "schedule" ||
    (measurementMethod === "manual" && hasManualMeasurements && Object.keys(errors).length === 0);

  return (
    <div className="animate-in fade-in duration-300">
      <p className="text-[10px] uppercase font-mono tracking-[0.28em] text-champagne mb-3">
        06 / Measurements
      </p>
      <h1 className="font-display text-3xl sm:text-4xl text-warm-ivory font-normal mb-2">
        Your Measurements.
      </h1>
      <p className="text-sm text-stone-400 font-sans leading-relaxed mb-10">
        Precise measurements are the foundation of a perfectly tailored garment. Choose how you would like to proceed.
      </p>

      {/* Method selection */}
      <div className="space-y-3 mb-8">
        {/* Saved Measurements (Live for authenticated clients) */}
        {user || profile ? (
          <button
            type="button"
            onClick={() => {
              onMethodSelect("saved");
              if (currentMeasurement?.measurements) {
                onMeasurementsChange(currentMeasurement.measurements);
                if (currentMeasurement.unit) onUnitChange(currentMeasurement.unit);
              }
            }}
            className={cn(
              "w-full flex items-start gap-4 p-5 rounded-2xl border text-left transition-all duration-200",
              measurementMethod === "saved"
                ? "border-champagne/60 bg-stone-900/60 ring-1 ring-champagne/20"
                : "border-stone-800 hover:border-stone-700 hover:bg-stone-900/30"
            )}
          >
            <div
              className={cn(
                "w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 transition-all",
                measurementMethod === "saved"
                  ? "border-champagne bg-champagne"
                  : "border-stone-600"
              )}
            />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p
                  className={cn(
                    "text-sm font-semibold uppercase tracking-wide mb-1 transition-colors",
                    measurementMethod === "saved" ? "text-champagne" : "text-warm-ivory"
                  )}
                >
                  Use My Saved Measurements
                </p>
                {currentMeasurement && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-stone-800 text-champagne">
                    Version {currentMeasurement.version}
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-400">
                {currentMeasurement
                  ? `Active profile recorded on ${new Date(currentMeasurement.createdAt).toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" })} • ${currentMeasurement.verificationStatus.replace(/_/g, " ")}`
                  : "Load your archived anatomical measurements from your client account."}
              </p>
            </div>
          </button>
        ) : (
          <div className="flex items-start gap-4 p-5 rounded-2xl border border-stone-800/50 bg-stone-900/20 opacity-50 cursor-not-allowed">
            <div className="w-5 h-5 rounded-full border-2 border-stone-700 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-1">
                Use My Saved Measurements
              </p>
              <p className="text-xs text-stone-600">
                Sign in to your TSquare Private Client Account to apply your saved anatomical profile.
              </p>
            </div>
          </div>
        )}

        {/* Manual entry */}
        <button
          onClick={() => onMethodSelect("manual")}
          className={cn(
            "w-full flex items-start gap-4 p-5 rounded-2xl border text-left transition-all duration-200",
            measurementMethod === "manual"
              ? "border-champagne/60 bg-stone-900/60 ring-1 ring-champagne/20"
              : "border-stone-800 hover:border-stone-700 hover:bg-stone-900/30"
          )}
        >
          <div className={cn(
            "w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 transition-all",
            measurementMethod === "manual"
              ? "border-champagne bg-champagne"
              : "border-stone-600"
          )} />
          <div>
            <p className={cn(
              "text-sm font-semibold uppercase tracking-wide mb-1 transition-colors",
              measurementMethod === "manual" ? "text-champagne" : "text-warm-ivory"
            )}>
              Enter My Measurements
            </p>
            <p className="text-xs text-stone-400">
              I know my measurements and will enter them now.
            </p>
          </div>
        </button>

        {/* Schedule */}
        <button
          onClick={() => onMethodSelect("schedule")}
          className={cn(
            "w-full flex items-start gap-4 p-5 rounded-2xl border text-left transition-all duration-200",
            measurementMethod === "schedule"
              ? "border-champagne/60 bg-stone-900/60 ring-1 ring-champagne/20"
              : "border-stone-800 hover:border-stone-700 hover:bg-stone-900/30"
          )}
        >
          <div className={cn(
            "w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 transition-all",
            measurementMethod === "schedule"
              ? "border-champagne bg-champagne"
              : "border-stone-600"
          )} />
          <div>
            <p className={cn(
              "text-sm font-semibold uppercase tracking-wide mb-1 transition-colors",
              measurementMethod === "schedule" ? "text-champagne" : "text-warm-ivory"
            )}>
              Measure Me at TSquare
            </p>
            <p className="text-xs text-stone-400">
              I would like a professional measurement appointment at the atelier.
              You can request a date in a later step.
            </p>
          </div>
        </button>
      </div>

      {/* Manual measurement form */}
      {measurementMethod === "manual" && (
        <div className="mb-8">
          {/* Unit toggle */}
          <div className="flex items-center gap-3 mb-6">
            <p className="text-[10px] uppercase tracking-widest text-stone-500">Unit:</p>
            <div className="flex rounded-xl border border-stone-800 overflow-hidden">
              {(["cm", "inches"] as MeasurementUnit[]).map((u) => (
                <button
                  key={u}
                  onClick={() => onUnitChange(u)}
                  className={cn(
                    "px-4 py-2 text-xs uppercase tracking-widest transition-colors",
                    measurementUnit === u
                      ? "bg-stone-800 text-warm-ivory"
                      : "text-stone-500 hover:text-stone-300"
                  )}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>

          {/* Accordion sections */}
          <div className="space-y-3">
            {SECTIONS.map((section) => (
              <div key={section.id} className="border border-stone-800/60 rounded-2xl overflow-hidden">
                <button
                  onClick={() => setOpenSection(openSection === section.id ? "upper" : section.id)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-stone-900/30 transition-colors"
                >
                  <span className="text-xs uppercase tracking-widest text-warm-ivory font-semibold">
                    {section.label}
                  </span>
                  {openSection === section.id ? (
                    <ChevronUp className="w-4 h-4 text-stone-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-stone-500" />
                  )}
                </button>

                {openSection === section.id && (
                  <div className="px-5 pb-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {section.fields.map((field) => (
                      <div key={field.key}>
                        <label
                          htmlFor={`meas-${field.key}`}
                          className="block text-[10px] uppercase tracking-widest text-stone-500 mb-1"
                        >
                          {field.label}
                        </label>
                        <div className="relative">
                          <input
                            id={`meas-${field.key}`}
                            type="number"
                            min={1}
                            max={300}
                            step={0.5}
                            value={measurements[field.key] ?? ""}
                            onChange={(e) => handleMeasurementChange(field.key, e.target.value)}
                            placeholder="—"
                            className={cn(
                              "w-full bg-[#141412] border rounded-xl text-xs text-warm-ivory placeholder:text-stone-700 px-4 py-3 pr-12 focus:outline-none transition-colors",
                              errors[field.key]
                                ? "border-amber-700/60 focus:border-amber-500"
                                : "border-stone-800 focus:border-champagne/50"
                            )}
                          />
                          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] text-stone-600 uppercase">
                            {measurementUnit}
                          </span>
                        </div>
                        {errors[field.key] ? (
                          <p className="text-[10px] text-amber-500 mt-1">{errors[field.key]}</p>
                        ) : (
                          <p className="text-[10px] text-stone-700 mt-1 leading-tight">{field.hint}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Confidence checkbox */}
          <div className="mt-6 flex items-start gap-3">
            <button
              onClick={() => onConfidenceChange(!measurementConfidence)}
              className={cn(
                "flex-shrink-0 w-5 h-5 rounded border-2 transition-all mt-0.5",
                measurementConfidence
                  ? "border-champagne/60 bg-champagne/20"
                  : "border-stone-700"
              )}
              aria-pressed={measurementConfidence}
              role="checkbox"
              aria-checked={measurementConfidence}
            >
              {measurementConfidence && (
                <svg viewBox="0 0 10 10" className="w-full h-full p-0.5">
                  <path d="M1.5 5l2.5 2.5L8.5 2.5" stroke="#B79A68" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
            <label
              className="text-xs text-stone-400 leading-relaxed cursor-pointer"
              onClick={() => onConfidenceChange(!measurementConfidence)}
            >
              I am not completely sure about some of these measurements.
              <span className="text-stone-600 block mt-0.5 text-[10px]">
                TSquare will follow up to confirm before production begins.
              </span>
            </label>
          </div>
        </div>
      )}

      {/* Schedule notice */}
      {measurementMethod === "schedule" && (
        <div className="mb-8 p-5 bg-stone-900/40 border border-stone-800/60 rounded-2xl">
          <div className="flex gap-3">
            <AlertCircle className="w-4 h-4 text-champagne flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-warm-ivory font-medium mb-1">
                Measurement appointment
              </p>
              <p className="text-xs text-stone-400 leading-relaxed">
                You can request a measurement appointment in the next steps. The TSquare team will confirm a suitable date and time with you directly.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-5 py-3.5 text-xs uppercase tracking-widest text-stone-400 hover:text-warm-ivory border border-stone-800 hover:border-stone-600 rounded-2xl transition-all duration-200"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </button>
        <button
          onClick={onContinue}
          disabled={!canContinue}
          className={cn(
            "flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-8 py-3.5 text-xs uppercase tracking-[0.2em] font-bold rounded-2xl transition-all duration-200",
            canContinue
              ? "bg-champagne text-near-black hover:bg-champagne-light"
              : "bg-stone-900 text-stone-600 cursor-not-allowed"
          )}
        >
          Continue
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
