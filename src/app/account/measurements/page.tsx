"use client";

import { useState } from "react";
import { useAccountData } from "@/lib/account-store";
import {
  Ruler,
  CheckCircle2,
  AlertCircle,
  Clock,
  History,
  Pencil,
  Save,
  X,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ReturnLink } from "@/components/common/ReturnLink";

type Section = "upper" | "torso" | "lower";

const ANATOMICAL_SECTIONS = [
  {
    id: "upper" as Section,
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
    id: "torso" as Section,
    label: "Torso",
    fields: [
      { key: "stomach", label: "Stomach", hint: "Around the stomach at its fullest point." },
      { key: "waist", label: "Waist", hint: "Natural waist, the narrowest point of the torso." },
      { key: "topLength", label: "Top Length", hint: "From top of the shoulder to preferred garment hem." },
    ],
  },
  {
    id: "lower" as Section,
    label: "Lower Body",
    fields: [
      { key: "trouserWaist", label: "Trouser Waist", hint: "Where you prefer to wear your trousers." },
      { key: "hip", label: "Hip", hint: "Fullest part of the seat, approximately 20cm below waist." },
      { key: "thigh", label: "Thigh", hint: "Around the fullest part of the upper thigh." },
      { key: "knee", label: "Knee", hint: "Around the knee, standing upright." },
      { key: "trouserLength", label: "Trouser Length", hint: "Inside leg from crotch to ankle bone." },
      { key: "ankle", label: "Ankle", hint: "Around the ankle bone." },
    ],
  },
];

export default function AccountMeasurementsPage() {
  const { currentMeasurement, measurementHistory, saveMeasurementProfile } = useAccountData();

  const [isEditing, setIsEditing] = useState(false);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);
  const [openSection, setOpenSection] = useState<Section>("upper");

  const [formUnit, setFormUnit] = useState<"cm" | "inches">(currentMeasurement?.unit || "cm");
  const [formFit, setFormFit] = useState<"tailored" | "regular" | "relaxed">(
    currentMeasurement?.fitPreference || "tailored"
  );
  const [formMeasurements, setFormMeasurements] = useState<Record<string, number>>(
    currentMeasurement?.measurements || {}
  );
  const [formNotes, setFormNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState("");

  const displayedProfile = selectedHistoryId
    ? measurementHistory.find((m) => m.id === selectedHistoryId) || currentMeasurement
    : currentMeasurement;

  const handleStartEdit = () => {
    setFormUnit(currentMeasurement?.unit || "cm");
    setFormFit(currentMeasurement?.fitPreference || "tailored");
    setFormMeasurements(currentMeasurement?.measurements || {});
    setFormNotes("");
    setIsEditing(true);
    setSaveSuccess(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveError("");
    try {
      await saveMeasurementProfile(formMeasurements, formUnit, formFit, formNotes);
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "The new measurement version could not be saved.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleFieldChange = (key: string, val: string) => {
    const num = parseFloat(val);
    const updated = { ...formMeasurements };
    if (val === "" || isNaN(num)) {
      delete updated[key];
    } else {
      updated[key] = num;
    }
    setFormMeasurements(updated);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <ReturnLink href="/account" label="Return to Dashboard" />
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800/60 pb-6">
        <div>
          <span className="text-[10px] uppercase font-mono tracking-[0.3em] text-champagne font-semibold block mb-1">
            Anatomical Vault
          </span>
          <h1 className="font-display text-2xl sm:text-3xl text-warm-ivory">
            Physiological Measurements
          </h1>
          <p className="text-xs text-stone-400 mt-1 font-light">
            Your individual anatomical geometry. Historical versions are perpetually preserved for bespoke pattern continuity.
          </p>
        </div>

        {!isEditing && (
          <button
            onClick={handleStartEdit}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-champagne text-near-black text-xs uppercase tracking-widest font-bold hover:bg-champagne-light transition-all self-start sm:self-auto"
          >
            <Pencil className="w-3.5 h-3.5" />
            <span>Update Measurements</span>
          </button>
        )}
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800 text-xs text-emerald-300 flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>New measurement version created and activated. Previous versions remain archived in your history.</span>
        </div>
      )}
      {saveError && <p role="alert" className="p-4 rounded-2xl bg-red-950/30 border border-red-800/50 text-xs text-red-300">{saveError}</p>}

      {/* Editing Form */}
      {isEditing ? (
        <form onSubmit={handleSave} className="p-6 sm:p-8 rounded-3xl bg-stone-950 fine-border space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-stone-800">
            <div>
              <h2 className="font-display text-xl text-warm-ivory">
                Draft New Measurement Version
              </h2>
              <p className="text-xs text-stone-400 font-light mt-0.5">
                Saving will generate Version {(currentMeasurement?.version || 1) + 1}. Existing orders and history remain unchanged.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="p-2 text-stone-400 hover:text-warm-ivory rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Unit & Fit Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase font-mono tracking-widest text-stone-400 mb-2">
                Measurement Unit
              </label>
              <div className="flex rounded-xl border border-stone-800 overflow-hidden bg-near-black w-fit">
                {(["cm", "inches"] as const).map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setFormUnit(u)}
                    className={cn(
                      "px-4 py-2 text-xs uppercase font-mono tracking-wider transition-colors",
                      formUnit === u ? "bg-stone-800 text-champagne font-bold" : "text-stone-500 hover:text-stone-300"
                    )}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-mono tracking-widest text-stone-400 mb-2">
                Preferred Fit Archetype
              </label>
              <div className="flex gap-2">
                {(["tailored", "regular", "relaxed"] as const).map((fit) => (
                  <button
                    key={fit}
                    type="button"
                    onClick={() => setFormFit(fit)}
                    className={cn(
                      "px-3.5 py-2 rounded-xl text-xs uppercase font-mono tracking-wider border capitalize transition-colors",
                      formFit === fit
                        ? "border-champagne bg-champagne/10 text-champagne font-semibold"
                        : "border-stone-800 text-stone-400 hover:border-stone-700"
                    )}
                  >
                    {fit}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Accordion Sections for Entering Measurements */}
          <div className="space-y-4">
            {ANATOMICAL_SECTIONS.map((section) => (
              <div key={section.id} className="border border-stone-800/80 rounded-2xl overflow-hidden bg-near-black/60">
                <button
                  type="button"
                  onClick={() => setOpenSection(openSection === section.id ? "upper" : section.id)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-stone-900/30 transition-colors"
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
                  <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 border-t border-stone-800/60">
                    {section.fields.map((field) => (
                      <div key={field.key}>
                        <label className="block text-[10px] uppercase tracking-widest text-stone-400 mb-1">
                          {field.label}
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.5"
                            value={formMeasurements[field.key] ?? ""}
                            onChange={(e) => handleFieldChange(field.key, e.target.value)}
                            placeholder="—"
                            className="w-full bg-stone-950 border border-stone-800 rounded-xl text-xs text-warm-ivory px-3.5 py-2.5 focus:outline-none focus:border-champagne"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-stone-600 uppercase">
                            {formUnit}
                          </span>
                        </div>
                        <p className="text-[10px] text-stone-600 mt-1 leading-tight">{field.hint}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div>
            <label className="block text-[10px] uppercase font-mono tracking-widest text-stone-400 mb-1.5">
              Version Annotation / Tailor Note
            </label>
            <input
              type="text"
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              placeholder="e.g. Taken post-summer wedding fitting in Lagos"
              className="w-full bg-near-black border border-stone-800 rounded-xl text-xs text-warm-ivory px-4 py-2.5 focus:outline-none focus:border-champagne"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-champagne text-near-black text-xs uppercase tracking-widest font-bold hover:bg-champagne-light transition-all"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? "Archiving..." : "Archive as New Version"}</span>
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-6 py-3 rounded-xl border border-stone-700 text-stone-400 hover:text-warm-ivory text-xs uppercase tracking-widest transition-all"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        /* Display Mode: Active Profile and History Selector */
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Profile View (3 cols) */}
          <div className="lg:col-span-3 space-y-6">
            <div className="p-6 sm:p-8 rounded-3xl bg-stone-950 fine-border space-y-6">
              {/* Profile Meta Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-800/60">
                <div>
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <span className="px-2.5 py-0.5 rounded-full bg-champagne/15 text-champagne border border-champagne/30 text-[10px] font-mono uppercase tracking-widest">
                      {displayedProfile?.isCurrent ? "Active Primary Profile" : "Archived Version"}
                    </span>
                    <span className="text-xs font-mono text-stone-500">
                      Version {displayedProfile?.version || 1}
                    </span>
                  </div>
                  <h2 className="font-display text-2xl text-warm-ivory">
                    Recorded Physiological Spec
                  </h2>
                </div>

                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-900 border border-stone-800 text-[10px] font-mono text-stone-300 uppercase">
                    <ShieldCheck className="w-3.5 h-3.5 text-champagne" />
                    {displayedProfile?.verificationStatus.replace(/_/g, " ")}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-stone-900 border border-stone-800 text-[10px] font-mono text-stone-300 uppercase">
                    {displayedProfile?.unit.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Anatomical Sections Grid */}
              <div className="space-y-6">
                {ANATOMICAL_SECTIONS.map((section) => (
                  <div key={section.id} className="space-y-3">
                    <h3 className="text-xs font-mono uppercase tracking-[0.22em] text-champagne font-semibold">
                      {section.label}
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {section.fields.map((f) => {
                        const val = displayedProfile?.measurements[f.key];
                        return (
                          <div
                            key={f.key}
                            className="p-3.5 rounded-2xl bg-stone-900/50 border border-stone-800/80 text-left"
                          >
                            <span className="text-[10px] uppercase font-mono text-stone-500 block">
                              {f.label}
                            </span>
                            <span className="text-sm font-mono font-bold text-warm-ivory mt-0.5 block">
                              {val !== undefined ? `${val} ${displayedProfile?.unit ?? ""}` : "—"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {displayedProfile?.notes && (
                <div className="pt-4 border-t border-stone-800">
                  <span className="text-[10px] uppercase font-mono text-stone-500 block mb-1">
                    Atelier Consultation Annotation
                  </span>
                  <p className="text-xs text-stone-300 italic font-light">
                    &quot;{displayedProfile.notes}&quot;
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* History Sidebar (1 col) */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-stone-800">
              <History className="w-4 h-4 text-champagne" />
              <h3 className="font-display text-base text-warm-ivory">
                Measurement Archive
              </h3>
            </div>

            <p className="text-[11px] text-stone-400 font-light leading-relaxed">
              Every anatomical revision is permanently stored. Past commissions remain tied to the specific version used at order confirmation.
            </p>

            <div className="space-y-2 pt-2">
              {measurementHistory.map((m) => {
                const isSelected =
                  (selectedHistoryId === m.id) ||
                  (!selectedHistoryId && m.isCurrent);

                return (
                  <button
                    key={m.id}
                    onClick={() => setSelectedHistoryId(m.id)}
                    className={cn(
                      "w-full text-left p-3.5 rounded-2xl border transition-colors space-y-1 block",
                      isSelected
                        ? "bg-stone-900 border-champagne/60 text-champagne"
                        : "bg-near-black border-stone-800 text-stone-400 hover:border-stone-700"
                    )}
                  >
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="font-bold">Version {m.version}</span>
                      {m.isCurrent && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-champagne/20 text-champagne">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-stone-500 font-mono">
                      {new Date(m.createdAt).toLocaleDateString("en-NG", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
