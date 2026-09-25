"use client";

import { useEffect, useRef, useState } from "react";
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
import { useAuth } from "@/lib/auth-context";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";
import { validateReferenceFile } from "@/lib/validation";

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
    <fieldset>
      <legend className="block text-[10px] uppercase tracking-widest text-stone-500 mb-2 font-medium">
        {label}
      </legend>
      <div className="flex flex-wrap gap-2">
        {normalised.map((opt) => (
          <button
            key={opt.id}
            type="button"
            aria-pressed={value === opt.id}
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
    </fieldset>
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
  const localUrls = useRef(new Set<string>());
  const [uploadError, setUploadError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const urls = localUrls.current;
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  function set<K extends keyof DesignPreferences>(key: K, value: DesignPreferences[K]) {
    onUpdate({ ...prefs, [key]: value });
  }

  // ── Reference image upload ────────────────────
  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setUploadError("");
    const files = Array.from(e.target.files ?? []);
    const existing = prefs.referenceImages ?? [];
    if (existing.length + files.length > 6) {
      setUploadError("Maximum 6 reference images allowed.");
      return;
    }
    const invalid = files.map(validateReferenceFile).find((result) => !result.success);
    if (invalid && !invalid.success) {
      setUploadError(invalid.error);
      return;
    }
    setIsUploading(true);
    const newImages: ReferenceImage[] = [];
    try {
      for (const file of files) {
        const id = crypto.randomUUID();
        const localUrl = URL.createObjectURL(file);
        localUrls.current.add(localUrl);
        let storagePath: string | undefined;

        if (user && isSupabaseConfigured) {
          const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
          storagePath = `${user.id}/${config.draftId ?? "draft"}/${id}.${extension}`;
          const { error } = await supabase.storage
            .from("bespoke-references")
            .upload(storagePath, file, { contentType: file.type, upsert: false });
          if (error) {
            URL.revokeObjectURL(localUrl);
            localUrls.current.delete(localUrl);
            throw new Error("A reference image could not be uploaded securely. Please try again.");
          }
        }

        newImages.push({
          id,
          filename: file.name,
          localUrl,
          sizeBytes: file.size,
          mimeType: file.type,
          storagePath,
          uploadStatus: storagePath ? "stored" : "local",
        });
      }
      onUpdate({ ...prefs, referenceImages: [...existing, ...newImages] });
    } catch (error) {
      const storedPaths = newImages.flatMap((image) => image.storagePath ? [image.storagePath] : []);
      if (storedPaths.length > 0) {
        const { error: cleanupError } = await supabase.storage.from("bespoke-references").remove(storedPaths);
        if (cleanupError) console.error("Reference upload cleanup failed", cleanupError);
      }
      newImages.forEach((image) => {
        if (image.localUrl) {
          URL.revokeObjectURL(image.localUrl);
          localUrls.current.delete(image.localUrl);
        }
      });
      setUploadError(error instanceof Error ? error.message : "The upload could not be completed.");
    } finally {
      setIsUploading(false);
    }
    // Reset input so same file can be re-added after removal
    e.target.value = "";
  }

  async function removeImage(id: string) {
    const image = (prefs.referenceImages ?? []).find((item) => item.id === id);
    if (image?.storagePath && user && isSupabaseConfigured) {
      const { error } = await supabase.storage.from("bespoke-references").remove([image.storagePath]);
      if (error) {
        setUploadError("That uploaded reference could not be removed. Please try again.");
        return;
      }
    }
    if (image?.localUrl) {
      URL.revokeObjectURL(image.localUrl);
      localUrls.current.delete(image.localUrl);
    }
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
        These choices define the character of your garment. Select what applies and leave the rest open for discussion with your stylist.
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
            <fieldset>
              <legend className="block text-[10px] uppercase tracking-widest text-stone-500 mb-3 font-medium">
                Cap Included
              </legend>
              <div className="flex gap-3">
                {["Yes, include matching cap", "No cap required"].map((opt) => {
                  const val = opt.startsWith("Yes");
                  const isSelected = prefs.capIncluded === val;
                  return (
                    <button
                      key={opt}
                      type="button"
                      aria-pressed={isSelected}
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
            </fieldset>
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
            placeholder="Tell us anything you would like your stylist to know, such as a specific detail, family motif, occasion detail, or personal note."
            className="w-full bg-stone-950 border border-stone-800 rounded-xl text-xs text-warm-ivory placeholder:text-stone-700 px-4 py-3 focus:outline-none focus:border-champagne/50 resize-none leading-relaxed"
          />
        </div>

        {/* Reference images */}
        <div>
          <h3 className="block text-[10px] uppercase tracking-widest text-stone-500 mb-1 font-medium">
            Add Inspiration
          </h3>
          <p className="text-[11px] text-stone-600 mb-4 leading-relaxed">
            Upload embroidery ideas, fit references, colour swatches, or details. Signed-in uploads are stored privately; guest previews remain in this browser session.
          </p>

          {/* Existing previews */}
          {(prefs.referenceImages ?? []).length > 0 && (
            <div className="flex flex-wrap gap-3 mb-4">
              {prefs.referenceImages!.map((img) => (
                <div
                  key={img.id}
                  className="relative w-20 h-20 rounded-xl overflow-hidden bg-stone-900 border border-stone-800 group"
                >
                  {img.localUrl ? (
                    // Blob URLs are session-local previews and cannot use the Next image optimizer.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={img.localUrl} alt={img.filename} className="w-full h-full object-cover" />
                  ) : (
                    <span className="w-full h-full flex items-center justify-center text-stone-500"><ImageIcon /></span>
                  )}
                  <button
                    type="button"
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
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="inline-flex items-center gap-2.5 px-5 py-3 border border-dashed border-stone-700 hover:border-stone-500 rounded-xl text-xs text-stone-400 hover:text-stone-300 transition-all duration-200"
            >
              <Upload className="w-4 h-4" />
              {isUploading ? "Uploading Securely…" : "Upload Reference Images"}
              <span className="text-stone-700">
                ({(prefs.referenceImages ?? []).length}/6)
              </span>
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
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
            JPEG, PNG or WebP only, up to 10 MB each. Signed-in files use private account storage.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-5 py-3.5 text-xs uppercase tracking-widest text-stone-400 hover:text-warm-ivory border border-stone-800 hover:border-stone-600 rounded-2xl transition-all duration-200"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </button>
        <button
          type="button"
          onClick={onContinue}
          disabled={isUploading}
          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-8 py-3.5 text-xs uppercase tracking-[0.2em] font-bold rounded-2xl bg-champagne text-near-black hover:bg-champagne-light transition-all duration-200"
        >
          Continue
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
