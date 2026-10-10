"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChangeEvent, useEffect, useRef, useState, useTransition } from "react";
import { ArrowLeft, ArrowRight, ImagePlus, Loader2, Save, Star, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import type { CatalogueImageAdmin } from "@/lib/catalogue-admin";
import { uploadCatalogueImage } from "./upload-image";
import { CATALOGUE_IMAGE_EXTENSIONS as IMAGE_EXTENSIONS, CATALOGUE_IMAGE_MAX_BYTES as MAX_IMAGE_BYTES } from "@/lib/catalogue-images";
import { removeFitImageAction, reorderFitImagesAction, updateFitImageAction } from "./actions";


export function GalleryManager({ fitId, fitName, initialImages }: { fitId: string; fitName: string; initialImages: CatalogueImageAdmin[] }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState(initialImages);
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [removeId, setRemoveId] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setImages(initialImages);
  }, [initialImages]);

  const persistOrder = (next: CatalogueImageAdmin[], primaryId: number | null) => {
    setImages(next.map((image, index) => ({ ...image, sortOrder: index, isPrimary: image.id === primaryId })));
    startTransition(async () => {
      const result = await reorderFitImagesAction(fitId, next.map((image) => image.id), primaryId);
      setMessage(result.success ? "Gallery order saved." : result.error);
      if (result.success) router.refresh();
      else setImages(initialImages);
    });
  };

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= images.length) return;
    const next = [...images];
    [next[index], next[target]] = [next[target], next[index]];
    persistOrder(next, next.find((image) => image.isPrimary)?.id ?? next[0]?.id ?? null);
  };

  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!files.length) return;
    const invalid = files.find((file) => !IMAGE_EXTENSIONS[file.type] || file.size > MAX_IMAGE_BYTES);
    if (invalid) {
      setMessage("Choose JPEG, PNG, or WebP images no larger than 8 MB each.");
      return;
    }
    setUploading(true);
    setMessage("");
    let completed = 0;
    try {
      for (const file of files) {
        const path = `${fitId}/${crypto.randomUUID()}.${IMAGE_EXTENSIONS[file.type]}`;
        await uploadCatalogueImage(fitId, fitName, file, path);
        completed += 1;
      }
      setMessage(`${completed} photograph${completed === 1 ? "" : "s"} added.`);
    } catch (error) {
      setMessage(`${completed} added. ${error instanceof Error ? error.message : "Upload could not be confirmed. Refresh the gallery before retrying."}`);
    } finally { setUploading(false); router.refresh(); }
  };

  const remove = () => {
    if (removeId === null) return;
    startTransition(async () => {
      const result = await removeFitImageAction(removeId);
      if (result.success) {
        setImages((current) => current.filter((image) => image.id !== removeId));
        setMessage("Gallery image removed.");
        router.refresh();
      } else setMessage(result.error);
      setRemoveId(null);
    });
  };

  return (
    <section className="rounded-3xl border border-stone-800 bg-stone-950/50 p-5 sm:p-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div><p className="text-[10px] uppercase tracking-[0.2em] text-champagne">Fit Gallery</p><h2 className="mt-2 font-display text-2xl">Exact outfit views</h2><p className="mt-2 max-w-2xl text-xs leading-6 text-stone-500">Every image must show this same Fit. Order is customer-facing; the cover appears on catalogue cards.</p></div>
        <input ref={inputRef} type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={upload} className="sr-only" />
        <button type="button" disabled={uploading} onClick={() => inputRef.current?.click()} className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-champagne/40 px-4 py-2.5 text-xs uppercase tracking-wider text-champagne disabled:opacity-50">{uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}{uploading ? "Uploading…" : "Add images"}</button>
      </div>
      {message && <p role="status" className="mt-4 rounded-xl border border-stone-800 p-3 text-sm text-stone-300">{message}</p>}
      {images.length === 0 ? <div className="mt-6 rounded-2xl border border-dashed border-stone-800 px-5 py-10 text-center text-sm text-stone-500">No gallery images yet. Add at least one before publishing.</div> : <div className="mt-6 grid gap-4 md:grid-cols-2">{images.map((image, index) => <GalleryImage key={image.id} image={image} index={index} total={images.length} busy={pending} onMove={move} onCover={() => persistOrder(images, image.id)} onRemove={() => setRemoveId(image.id)} onSaved={(text) => { setMessage(text); router.refresh(); }} />)}</div>}
      <ConfirmDialog open={removeId !== null} title="Remove this gallery image?" description="The stored media object and its catalogue record will be deleted. Other images will remain in their current order." confirmLabel="Remove image" busy={pending} onCancel={() => setRemoveId(null)} onConfirm={remove} />
    </section>
  );
}

function GalleryImage({ image, index, total, busy, onMove, onCover, onRemove, onSaved }: { image: CatalogueImageAdmin; index: number; total: number; busy: boolean; onMove: (index: number, direction: -1 | 1) => void; onCover: () => void; onRemove: () => void; onSaved: (message: string) => void }) {
  const [alt, setAlt] = useState(image.altText);
  const [position, setPosition] = useState(image.objectPosition);
  const [saving, startSaving] = useTransition();
  return <article className="overflow-hidden rounded-2xl border border-stone-800 bg-near-black"><div className="relative aspect-[4/3] bg-stone-900"><Image src={image.src} alt={image.altText} fill sizes="(max-width: 768px) 100vw, 40vw" className="object-cover" style={{ objectPosition: image.objectPosition }} />{image.isPrimary && <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-champagne px-2.5 py-1 text-[9px] font-semibold uppercase text-near-black"><Star className="h-3 w-3 fill-current" />Cover</span>}</div><div className="space-y-3 p-4"><label className="block text-[9px] uppercase tracking-wider text-stone-500">Alternative text<input value={alt} maxLength={180} onChange={(event) => setAlt(event.target.value)} className="mt-1.5 w-full rounded-lg border border-stone-700 bg-stone-950 px-3 py-2 text-sm text-white" /></label><label className="block text-[9px] uppercase tracking-wider text-stone-500">Image focus<select value={position} onChange={(event) => setPosition(event.target.value)} className="mt-1.5 w-full rounded-lg border border-stone-700 bg-stone-950 px-3 py-2 text-sm text-white"><option value="center">Centre</option><option value="top">Top</option><option value="bottom">Bottom</option><option value="left">Left</option><option value="right">Right</option></select></label><div className="flex flex-wrap gap-2"><button type="button" disabled={busy || index === 0} onClick={() => onMove(index, -1)} aria-label="Move image earlier" className="rounded-lg border border-stone-700 p-2 disabled:opacity-30"><ArrowLeft className="h-4 w-4" /></button><button type="button" disabled={busy || index === total - 1} onClick={() => onMove(index, 1)} aria-label="Move image later" className="rounded-lg border border-stone-700 p-2 disabled:opacity-30"><ArrowRight className="h-4 w-4" /></button>{!image.isPrimary && <button type="button" disabled={busy} onClick={onCover} className="rounded-lg border border-stone-700 px-3 py-2 text-[9px] uppercase tracking-wider">Set cover</button>}<button type="button" disabled={saving} onClick={() => startSaving(async () => { const result = await updateFitImageAction(image.id, alt, position); onSaved(result.success ? "Image details saved." : result.error); })} className="ml-auto rounded-lg border border-stone-700 p-2" aria-label="Save image details"><Save className="h-4 w-4" /></button><button type="button" onClick={onRemove} className="rounded-lg border border-red-900/70 p-2 text-red-400" aria-label="Remove image"><Trash2 className="h-4 w-4" /></button></div></div></article>;
}
