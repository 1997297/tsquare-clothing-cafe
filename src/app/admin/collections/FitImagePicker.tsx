"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ImagePlus, Star, Trash2 } from "lucide-react";
import { validateCatalogueImage, validateCatalogueImageBytes } from "@/lib/catalogue-images";

export interface PendingFitImage {
  key: string; file: File; preview: string;
}
export function FitImagePicker({ images, onChange, disabled, onCheckingChange }: {
  images: PendingFitImage[]; onChange: (images: PendingFitImage[]) => void; disabled: boolean;
  onCheckingChange: (checking: boolean) => void;
}) {
  const previews = useRef(new Set<string>());
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);
  useEffect(() => { const urls = previews.current; return () => { urls.forEach(url => URL.revokeObjectURL(url)); }; }, []);
  const move = (index: number, destination: number) => {
    const next = [...images];
    const [image] = next.splice(index, 1);
    next.splice(destination, 0, image);
    onChange(next);
  };
  return <section className="rounded-3xl border border-stone-800 bg-stone-950/50 p-5 sm:p-7">
    <h2 className="font-display text-2xl">Fit photographs</h2>
    <p className="mt-2 text-sm text-stone-400">Choose photographs of this Fit. The first image is the cover. JPEG, PNG or WebP, up to 8 MB each. Files upload when you save.</p>
    <label className="mt-5 block rounded-xl border border-dashed border-champagne/50 p-4 text-sm text-champagne">
      <span className="mb-3 flex items-center gap-2"><ImagePlus className="h-5 w-5" />{checking ? "Checking photographs…" : "Add photographs"}</span>
      <input type="file" multiple accept="image/jpeg,image/png,image/webp" disabled={disabled || checking} className="block w-full text-xs file:mr-3 file:rounded-lg file:border-0 file:bg-champagne file:px-3 file:py-2 file:text-near-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-champagne disabled:opacity-50"
        onChange={async event => {
          const files = Array.from(event.target.files ?? []); event.target.value = "";
          setChecking(true); onCheckingChange(true); setError("");
          try {
            for (const file of files) { validateCatalogueImage(file); validateCatalogueImageBytes(file.type, new Uint8Array(await file.arrayBuffer())); }
            onChange([...images, ...files.map(file => { const preview = URL.createObjectURL(file); previews.current.add(preview); return { key: crypto.randomUUID(), file, preview }; })]);
          } catch (error) { setError(error instanceof Error ? error.message : "Photographs could not be read."); }
          finally { setChecking(false); onCheckingChange(false); }
        }} />
    </label>
    {error && <p role="alert" className="mt-3 text-sm text-rose-400">{error}</p>}
    {disabled && <p className="mt-3 text-xs text-stone-400">Photo selection is locked while saving or resuming this draft. Use its gallery editor for further changes.</p>}
    <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{images.map((image, index) => <article key={image.key} className="min-w-0 rounded-xl border border-stone-800 p-3">
      <div className="relative aspect-[4/3]"><Image unoptimized src={image.preview} alt={`Selected Fit photograph ${index + 1}`} fill sizes="(max-width: 640px) 90vw, 30vw" className="rounded-lg object-cover" /></div>
      <p className="mt-2 truncate text-xs text-stone-400">{image.file.name}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" disabled={disabled || checking || index === 0} onClick={() => move(index, index - 1)} aria-label={`Move photograph ${index + 1} earlier`} className="rounded-lg border border-stone-700 p-2 disabled:opacity-30"><ArrowLeft className="h-4 w-4" /></button>
        <button type="button" disabled={disabled || checking || index === images.length - 1} onClick={() => move(index, index + 1)} aria-label={`Move photograph ${index + 1} later`} className="rounded-lg border border-stone-700 p-2 disabled:opacity-30"><ArrowRight className="h-4 w-4" /></button>
        <button type="button" disabled={disabled || checking || index === 0} onClick={() => move(index, 0)} className="inline-flex items-center gap-1 rounded-lg border border-stone-700 px-2 text-xs disabled:opacity-50"><Star className="h-4 w-4" />{index === 0 ? "Cover" : "Set cover"}</button>
        <button type="button" disabled={disabled || checking} onClick={() => { URL.revokeObjectURL(image.preview); previews.current.delete(image.preview); onChange(images.filter(item => item.key !== image.key)); }} aria-label={`Remove photograph ${index + 1}`} className="rounded-lg border border-red-900 p-2 text-rose-400 disabled:opacity-30"><Trash2 className="h-4 w-4" /></button>
      </div>
    </article>)}</div>
  </section>;
}
