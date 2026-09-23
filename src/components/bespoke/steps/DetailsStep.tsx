"use client";

import { useRef, useState } from "react";
import { ArrowRight, ArrowLeft, Upload, X, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { BespokeConfiguration, DesignPreferences, ReferenceImage } from "@/types/bespoke";
import {
  EMBROIDERY_STYLES,
  COLLAR_STYLES_SENATOR,
  COLLAR_STYLES_KAFTAN,
  BUTTON_PREFERENCES,
  POCKET_STYLES,
  SLEEVE_PREFERENCES,
  TROUSER_BREAK_OPTIONS,
  AGBADA_LENGTH_OPTIONS,
} from "@/data/bespoke-data";

interface DetailsStepProps {
  config: BespokeConfiguration;
  onUpdate: (prefs: DesignPreferences) => void;
  onContinue: () => void;
  onBack: () => void;
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value?: string;
  options: string[] | { id: string; label: string }[];
  onChange: (v: string) => void;
}) {
  const normalised = options.map((o) =>
    typeof o === "string" ? { id: o, label: o } : o
  );
  return (
    <div>
      <label className="block text-[10px] uppercase tracking-widest text-stone-500 mb-2 font-medium">
        {label}
      </label>
      <div className="flex flex-wrap gap-2">
        {normalised.map((opt) => (
          <button
            key={opt.id}
            onClick={() => onChange(opt.id)}
            className={cn(
              "px-3.5 py-2 rounded-xl text-xs border transition-all duration-150",
              value === opt.id
                ? "border-champagne/60 bg-stone-900/80 text-champagne"
                : "border-stone-800 text-stone-400 hover:border-stone-700 hover:text-stone-300"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function DetailsStep({
  config,
  onUpdate,
  onContinue,
  onBack,
}: DetailsStepProps) {
  const category = config.garmentCategory ?? "senator";
  const prefs = config.preferences;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState("");

  function set<K extends keyof DesignPreferences>(key: K, value: DesignPreferences[K]) {
    onUpdate({ ...prefs, [key]: value });
  }

  // ── Reference image upload ────────────────────
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setUploadError("");
    const files = Array.from(e.target.files ?? []);
    const existing = prefs.referenceImages ?? [];
    if (existing.length + files.length > 6) {
      setUploadError("Maximum 6 reference images allowed.");
      return;
    }
    const tooBig = files.find((f) => f.size > 10 * 1024 * 1024);
    if (tooBig) {
      setUploadError("Each image must be under 10 MB.");
      return;
    }
    const newImages: ReferenceImage[] = files.map((f) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      filename: f.name,
      localUrl: URL.createObjectURL(f),
      sizeBytes: f.size,
    }));
    onUpdate({ ...prefs, referenceImages: [...existing, ...newImages] });
    // Reset input so same file can be re-added after removal
    e.target.value = "";
  }

  function removeImage(id: string) {
    const updated = (prefs.referenceImages ?? []).filter((img) => img.id !== id);
    onUpdate({ ...prefs, referenceImages: updated });
  }

  return (
    <div className="animate-in fade-in duration-300">
      <p className="text-[10px] uppercase font-mono tracking-[0.28em] text-champagne mb-3">
        04 / Details
      </p>
      <h1 className="font-display text-3xl sm:text-4xl text-warm-ivory font-normal mb-2">
        Down To The Detail.
      </h1>
      <p className="text-sm text-stone-400 font-sans leading-relaxed mb-10">
        These choices define the character of your garment. Select what applies — leave the rest open for discussion with your stylist.
      </p>

      <div className="space-y-8 mb-10">
        {/* Embroidery — agbada, kaftan, traditional */}
        {["agbada", "kaftan", "traditional"].includes(category) && (
          <SelectField
            label="Embroidery Style"
            value={prefs.embroideryStyle}
            options={EMBROIDERY_STYLES}
            onChange={(v) => set("embroideryStyle", v)}
          />
        )}

        {/* Agbada specific */}
        {category === "agbada" && (
          <>
            <SelectField
              label="Agbada Length"
              value={prefs.agbadaLength}
              options={AGBADA_LENGTH_OPTIONS}
              onChange={(v) => set("agbadaLength", v as DesignPreferences["agbadaLength"])}
            />
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-stone-500 mb-3 font-medium">
                Cap Included
              </label>
              <div className="flex gap-3">
                {["Yes, include matching cap", "No cap required"].map((opt) => {
                  const val = opt.startsWith("Yes");
                  const isSelected = prefs.capIncluded === val;
                  return (
                    <button
                      key={opt}
                      onClick={() => set("capIncluded", val)}
                      className={cn(
                        "px-4 py-2 rounded-xl text-xs border transition-all duration-150",
                        isSelected
                          ? "border-champagne/60 bg-stone-900/80 text-champagne"
                          : "border-stone-800 text-stone-400 hover:border-stone-700"
                      )}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* Senator / Formal */}
        {["senator", "formal", "bespoke"].includes(category) && (
          <>
            <SelectField
              label="Collar Style"
              value={prefs.collarStyle}
              options={COLLAR_STYLES_SENATOR}
              onChange={(v) => set("collarStyle", v)}
            />
            <SelectField
              label="Button Preference"
              value={prefs.buttonPreference}
              options={BUTTON_PREFERENCES}
              onChange={(v) => set("buttonPreference", v)}
            />
            <SelectField
              label="Pocket Style"
              value={prefs.pocketStyle}
              options={POCKET_STYLES}
              onChange={(v) => set("pocketStyle", v)}
            />
            <SelectField
              label="Trouser Break"
              value={prefs.trouserBreak}
              options={TROUSER_BREAK_OPTIONS}
              onChange={(v) => set("trouserBreak", v as DesignPreferences["trouserBreak"])}
            />
          </>
        )}

        {/* Kaftan */}
        {category === "kaftan" && (
          <>
            <SelectField
              label="Collar Style"
              value={prefs.collarStyle}
              options={COLLAR_STYLES_KAFTAN}
              onChange={(v) => set("collarStyle", v)}
            />
            <SelectField
              label="Sleeve Length"
              value={prefs.sleevePreference}
              options={SLEEVE_PREFERENCES}
              onChange={(v) => set("sleevePreference", v)}
            />
          </>
        )}

        {/* Special instructions */}
        <div>
          <label
            htmlFor="special-instructions"
            className="block text-[10px] uppercase tracking-widest text-stone-500 mb-2 font-medium"
          >
            Special Instructions
          </label>
          <textarea
            id="special-instructions"
            rows={4}
            value={prefs.specialInstructions ?? ""}
            onChange={(e) => set("specialInstructions", e.target.value)}
            placeholder="Tell us anything you would like your stylist to know — a specific detail, family motif, occasion detail, or personal note."
            className="w-full bg-[#141412] border border-stone-800 rounded-xl text-xs text-warm-ivory placeholder:text-stone-700 px-4 py-3 focus:outline-none focus:border-champagne/50 resize-none leading-relaxed"
          />
        </div>

        {/* Reference images */}
        <div>
          <label className="block text-[10px] uppercase tracking-widest text-stone-500 mb-1 font-medium">
            Add Inspiration
          </label>
          <p className="text-[11px] text-stone-600 mb-4 leading-relaxed">
            Upload images that inspire you — embroidery ideas, fit references, colour swatches, details. These are saved locally for your session only.
          </p>

          {/* Existing previews */}
          {(prefs.referenceImages ?? []).length > 0 && (
            <div className="flex flex-wrap gap-3 mb-4">
              {prefs.referenceImages!.map((img) => (
                <div
                  key={img.id}
                  className="relative w-20 h-20 rounded-xl overflow-hidden bg-stone-900 border border-stone-800 group"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.localUrl}
                    alt={img.filename}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => removeImage(img.id)}
                    className="absolute inset-0 bg-near-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    aria-label={`Remove ${img.filename}`}
                  >
                    <X className="w-4 h-4 text-warm-ivory" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Upload button */}
          {(prefs.referenceImages ?? []).length < 6 && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2.5 px-5 py-3 border border-dashed border-stone-700 hover:border-stone-500 rounded-xl text-xs text-stone-400 hover:text-stone-300 transition-all duration-200"
            >
              <Upload className="w-4 h-4" />
              Upload Reference Images
              <span className="text-stone-700">
                ({(prefs.referenceImages ?? []).length}/6)
              </span>
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            aria-label="Upload reference images"
            onChange={handleFileChange}
          />
          {uploadError && (
            <p className="mt-2 text-[11px] text-amber-500">{uploadError}</p>
          )}
          <p className="mt-2 text-[10px] text-stone-700 flex items-center gap-1.5">
            <ImageIcon className="w-3 h-3" />
            Images are stored in your browser only and are not transmitted until your request is reviewed by TSquare.
          </p>
        </div>
      </div>

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
          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-8 py-3.5 text-xs uppercase tracking-[0.2em] font-bold rounded-2xl bg-champagne text-near-black hover:bg-champagne-light transition-all duration-200"
        >
          Continue
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
