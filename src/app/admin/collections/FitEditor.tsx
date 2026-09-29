"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";
import { ArrowLeft, Eye, Loader2, Save } from "lucide-react";
import type { CatalogueCategoryAdmin, CatalogueColourAdmin, CatalogueFabricAdmin, CatalogueFitAdmin, CatalogueStatus, FitMutationInput } from "@/lib/catalogue-admin";
import { createFitAction, updateFitAction } from "./actions";
import { GalleryManager } from "./GalleryManager";

const fieldClass = "w-full rounded-xl border border-stone-700 bg-stone-950 px-3 py-2.5 text-sm text-warm-ivory outline-none focus:border-champagne";

export function FitEditor({ fit, categories, fabrics, colours }: { fit: CatalogueFitAdmin | null; categories: CatalogueCategoryAdmin[]; fabrics: CatalogueFabricAdmin[]; colours: CatalogueColourAdmin[] }) {
  const router = useRouter();
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice(null);
    const data = new FormData(event.currentTarget);
    const lines = (name: string) => String(data.get(name) ?? "").split("\n").map((item) => item.trim()).filter(Boolean);
    const input: FitMutationInput = {
      name: String(data.get("name") ?? ""), code: String(data.get("code") ?? ""), categorySlug: String(data.get("categorySlug") ?? ""),
      description: String(data.get("description") ?? ""), longDescription: String(data.get("longDescription") ?? ""), fabricInformation: String(data.get("fabricInformation") ?? ""), fitInformation: String(data.get("fitInformation") ?? ""),
      occasions: lines("occasions"), featured: data.get("featured") === "on", collectionName: String(data.get("collectionName") ?? ""), tags: lines("tags"),
      leadTimeWeeks: data.get("leadTimeWeeks") ? Number(data.get("leadTimeWeeks")) : null, craftsmanshipHighlights: lines("craftsmanshipHighlights"), displayOrder: Number(data.get("displayOrder")),
      status: String(data.get("status")) as CatalogueStatus, fabricIds: data.getAll("fabricIds").map(String), colourIds: data.getAll("colourIds").map(String),
    };
    startTransition(async () => {
      if (fit) {
        const result = await updateFitAction(fit.id, input);
        if (!result.success) { setNotice({ type: "error", text: result.error }); return; }
        setNotice({ type: "success", text: "Fit details and options saved." });
        router.refresh();
        return;
      }
      const result = await createFitAction(input);
      if (!result.success) { setNotice({ type: "error", text: result.error }); return; }
      router.push(`/admin/collections/${result.data.id}/edit?created=1`);
    });
  };

  return <div className="space-y-8"><div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><Link href="/admin/collections" className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest text-stone-500 hover:text-champagne"><ArrowLeft className="h-3.5 w-3.5" />Collections</Link><h1 className="mt-4 font-display text-3xl sm:text-4xl">{fit ? `Edit ${fit.name}` : "Create a new Fit"}</h1><p className="mt-3 text-sm text-stone-500">{fit ? <>Stable public slug: <span className="font-mono text-stone-300">/{fit.slug}</span></> : "New Fits begin as drafts. Add a gallery before publishing."}</p></div>{fit && <Link href={`/admin/collections/${fit.id}/preview`} className="inline-flex w-fit items-center gap-2 rounded-xl border border-stone-700 px-4 py-2.5 text-xs uppercase tracking-wider"><Eye className="h-4 w-4" />Staff preview</Link>}</div>
    <form onSubmit={submit} className="space-y-7">{!fit && <input type="hidden" name="status" value="draft" />}<section className="rounded-3xl border border-stone-800 bg-stone-950/50 p-5 sm:p-7"><h2 className="font-display text-2xl">Fit details</h2><div className="mt-6 grid gap-5 sm:grid-cols-2"><Field label="Fit name"><input name="name" required maxLength={120} defaultValue={fit?.name ?? ""} className={fieldClass} /></Field><Field label="Fit code"><input name="code" required maxLength={40} defaultValue={fit?.code ?? ""} className={fieldClass} /></Field><Field label="Category"><select name="categorySlug" required defaultValue={fit?.categorySlug ?? ""} className={fieldClass}><option value="" disabled>Select category</option>{categories.map((item) => <option key={item.slug} value={item.slug} disabled={!item.isActive && item.slug !== fit?.categorySlug}>{item.name}{item.isActive ? "" : " (inactive)"}</option>)}</select></Field><Field label="Collection name"><input name="collectionName" required maxLength={120} defaultValue={fit?.collectionName ?? ""} className={fieldClass} /></Field><Field label="Display order"><input name="displayOrder" type="number" min="0" max="9999" required defaultValue={fit?.displayOrder ?? 0} className={fieldClass} /></Field><Field label="Lead time (weeks)"><input name="leadTimeWeeks" type="number" min="1" max="24" defaultValue={fit?.leadTimeWeeks ?? ""} className={fieldClass} /></Field><Field label="Lifecycle"><select name="status" defaultValue={fit?.status ?? "draft"} className={fieldClass} disabled={!fit}><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></Field><label className="flex items-center gap-3 self-end pb-3 text-sm text-stone-300"><input name="featured" type="checkbox" defaultChecked={fit?.featured ?? false} className="h-4 w-4 accent-[#D4AF77]" />Feature this Fit publicly</label></div><div className="mt-5 grid gap-5"><Field label="Short description"><textarea name="description" required rows={3} maxLength={500} defaultValue={fit?.description ?? ""} className={fieldClass} /></Field><Field label="Editorial description"><textarea name="longDescription" rows={5} maxLength={3000} defaultValue={fit?.longDescription ?? ""} className={fieldClass} /></Field><div className="grid gap-5 sm:grid-cols-2"><Field label="Fabric information"><textarea name="fabricInformation" required rows={4} defaultValue={fit?.fabricInformation ?? ""} className={fieldClass} /></Field><Field label="Fit information"><textarea name="fitInformation" required rows={4} defaultValue={fit?.fitInformation ?? ""} className={fieldClass} /></Field></div><div className="grid gap-5 sm:grid-cols-3"><LineField label="Occasions" name="occasions" value={fit?.occasions} /><LineField label="Tags" name="tags" value={fit?.tags} /><LineField label="Craftsmanship highlights" name="craftsmanshipHighlights" value={fit?.craftsmanshipHighlights} /></div></div></section>
      <section className="grid gap-6 lg:grid-cols-2"><OptionSelector title="Fabrics" name="fabricIds" options={fabrics.map((item) => ({ id: item.id, label: item.name, active: item.isActive }))} selected={fit?.fabricIds ?? []} /><OptionSelector title="Colours" name="colourIds" options={colours.map((item) => ({ id: item.id, label: `${item.name} · ${item.hex}`, active: item.isActive }))} selected={fit?.colourIds ?? []} /></section>
      {notice && <p role={notice.type === "error" ? "alert" : "status"} className={`rounded-2xl border p-4 text-sm ${notice.type === "error" ? "border-red-900 bg-red-950/30 text-red-300" : "border-emerald-900 bg-emerald-950/30 text-emerald-300"}`}>{notice.text}</p>}<div className="flex justify-end"><button type="submit" disabled={pending} className="inline-flex min-w-40 items-center justify-center gap-2 rounded-xl bg-champagne px-5 py-3 text-xs font-semibold uppercase tracking-wider text-near-black disabled:opacity-50">{pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{pending ? "Saving…" : fit ? "Save Fit" : "Create draft"}</button></div>
    </form>{fit && <GalleryManager fitId={fit.id} fitName={fit.name} initialImages={fit.images} />}</div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block"><span className="mb-2 block text-[10px] uppercase tracking-[0.18em] text-stone-500">{label}</span>{children}</label>; }
function LineField({ label, name, value = [] }: { label: string; name: string; value?: string[] }) { return <Field label={`${label} (one per line)`}><textarea name={name} rows={5} defaultValue={value.join("\n")} className={fieldClass} /></Field>; }
function OptionSelector({ title, name, options, selected }: { title: string; name: string; options: { id: string; label: string; active: boolean }[]; selected: string[] }) { return <fieldset className="rounded-3xl border border-stone-800 bg-stone-950/50 p-5"><legend className="px-2 font-display text-xl">{title}</legend>{options.length === 0 ? <p className="text-sm text-stone-500">Add {title.toLowerCase()} from the Collections screen first.</p> : <div className="mt-2 grid max-h-72 gap-2 overflow-y-auto">{options.map((item) => <label key={item.id} className={`flex items-center gap-3 rounded-xl border border-stone-800 p-3 text-sm ${item.active || selected.includes(item.id) ? "text-stone-300" : "text-stone-600"}`}><input type="checkbox" name={name} value={item.id} defaultChecked={selected.includes(item.id)} disabled={!item.active && !selected.includes(item.id)} className="h-4 w-4 accent-[#D4AF77]" />{item.label}{!item.active && <span className="ml-auto text-[9px] uppercase">Inactive</span>}</label>)}</div>}</fieldset>; }
