"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState, useTransition } from "react";
import { Archive, ArrowUpRight, Check, Edit3, Layers3, Plus, Search, X } from "lucide-react";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import type { CatalogueCategoryAdmin, CatalogueColourAdmin, CatalogueFabricAdmin, CatalogueManagementSnapshot, CatalogueStatus } from "@/lib/catalogue-admin";
import { saveCategoryAction, saveColourAction, saveFabricAction, setFitStatusAction } from "./actions";

type Section = "fits" | "categories" | "fabrics" | "colours";
type EditorState =
  | { type: "category"; record: CatalogueCategoryAdmin | null }
  | { type: "fabric"; record: CatalogueFabricAdmin | null }
  | { type: "colour"; record: CatalogueColourAdmin | null }
  | null;

const fieldClass = "w-full rounded-xl border border-stone-700 bg-stone-950 px-3 py-2.5 text-sm text-warm-ivory outline-none focus:border-champagne";

function StatusPill({ status }: { status: CatalogueStatus }) {
  const styles = status === "published" ? "border-emerald-800/60 bg-emerald-950/30 text-emerald-400" : status === "draft" ? "border-amber-800/60 bg-amber-950/25 text-amber-400" : "border-stone-700 bg-stone-900 text-stone-400";
  return <span className={`rounded-full border px-2.5 py-1 text-[9px] font-mono uppercase tracking-[0.16em] ${styles}`}>{status}</span>;
}

function EmptyPanel({ label }: { label: string }) {
  return <div className="rounded-2xl border border-dashed border-stone-800 px-6 py-12 text-center text-sm text-stone-500">No {label} found.</div>;
}

export function CatalogueManager({ snapshot }: { snapshot: CatalogueManagementSnapshot }) {
  const router = useRouter();
  const [section, setSection] = useState<Section>("fits");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [editor, setEditor] = useState<EditorState>(null);
  const [archiveId, setArchiveId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  const visibleFits = useMemo(() => snapshot.fits.filter((fit) => {
    const needle = query.trim().toLowerCase();
    return (!needle || fit.name.toLowerCase().includes(needle) || fit.code.toLowerCase().includes(needle))
      && (category === "all" || fit.categorySlug === category)
      && (status === "all" || fit.status === status);
  }), [snapshot.fits, query, category, status]);

  const metrics = [
    ["Total Fits", snapshot.fits.length],
    ["Published", snapshot.fits.filter((fit) => fit.status === "published").length],
    ["Drafts", snapshot.fits.filter((fit) => fit.status === "draft").length],
    ["Archived", snapshot.fits.filter((fit) => fit.status === "archived").length],
  ];

  const archiveFit = () => {
    if (!archiveId) return;
    startTransition(async () => {
      const result = await setFitStatusAction(archiveId, "archived");
      setArchiveId(null);
      setMessage(result.success ? "Fit archived. Existing references remain intact." : result.error);
      if (result.success) router.refresh();
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-champagne-dark">Catalogue Operations</p>
          <h1 className="mt-3 font-display text-3xl sm:text-4xl">Collections</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-400">Manage TCC Fits, galleries, categories and atelier options from live records.</p>
        </div>
        <Link href="/admin/collections/new" className="inline-flex w-fit items-center gap-2 rounded-xl bg-champagne px-4 py-3 text-xs font-semibold uppercase tracking-wider text-near-black hover:bg-champagne-light"><Plus className="h-4 w-4" />New Fit</Link>
      </div>

      {message && <div role="status" className="flex items-center justify-between rounded-2xl border border-stone-700 bg-stone-950 px-4 py-3 text-sm text-stone-300"><span>{message}</span><button type="button" aria-label="Dismiss message" onClick={() => setMessage("")}><X className="h-4 w-4" /></button></div>}

      <section aria-label="Catalogue totals" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(([label, value]) => <div key={label} className="rounded-2xl border border-stone-800 bg-stone-950/60 p-5"><p className="text-[9px] font-mono uppercase tracking-[0.2em] text-stone-500">{label}</p><p className="mt-3 font-display text-3xl">{value}</p></div>)}
      </section>

      <nav aria-label="Catalogue areas" className="flex gap-2 overflow-x-auto border-b border-stone-800 pb-3">
        {(["fits", "categories", "fabrics", "colours"] as const).map((item) => <button key={item} type="button" onClick={() => setSection(item)} className={`rounded-full px-4 py-2 text-[10px] uppercase tracking-widest ${section === item ? "bg-champagne text-near-black" : "border border-stone-800 text-stone-400 hover:text-white"}`}>{item}</button>)}
      </nav>

      {section === "fits" && <>
        <div className="grid gap-3 md:grid-cols-[1fr_180px_160px]">
          <label className="relative"><span className="sr-only">Search Fits</span><Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-stone-500" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by Fit name or code" className={`${fieldClass} pl-10`} /></label>
          <select aria-label="Filter by category" value={category} onChange={(event) => setCategory(event.target.value)} className={fieldClass}><option value="all">All categories</option>{snapshot.categories.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}</select>
          <select aria-label="Filter by status" value={status} onChange={(event) => setStatus(event.target.value)} className={fieldClass}><option value="all">All statuses</option><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select>
        </div>
        {visibleFits.length === 0 ? <EmptyPanel label="Fits matching these filters" /> : <div className="space-y-3">{visibleFits.map((fit) => (
          <article key={fit.id} className="grid gap-4 rounded-2xl border border-stone-800 bg-stone-950/60 p-4 sm:grid-cols-[80px_1fr_auto] sm:items-center">
            <div className="relative h-24 w-20 overflow-hidden rounded-xl bg-stone-900">{fit.images[0] ? <Image src={fit.images.find((image) => image.isPrimary)?.src ?? fit.images[0].src} alt="" fill sizes="80px" className="object-cover" /> : <div className="flex h-full items-center justify-center"><Layers3 className="h-5 w-5 text-stone-700" /></div>}</div>
            <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="font-display text-xl">{fit.name}</h2><StatusPill status={fit.status} /></div><p className="mt-1 text-xs uppercase tracking-wider text-stone-500">{fit.code} · {fit.categoryName}</p><p className="mt-3 text-xs text-stone-500">{fit.images.length} images · {fit.fabricIds.length} fabrics · {fit.colourIds.length} colours · Updated {new Intl.DateTimeFormat("en-NG", { dateStyle: "medium" }).format(new Date(fit.updatedAt))}</p></div>
            <div className="flex flex-wrap gap-2 sm:justify-end"><Link href={`/admin/collections/${fit.id}/edit`} className="inline-flex items-center gap-1.5 rounded-lg border border-stone-700 px-3 py-2 text-[10px] uppercase tracking-wider text-stone-200"><Edit3 className="h-3.5 w-3.5" />Edit</Link><Link href={`/admin/collections/${fit.id}/preview`} className="inline-flex items-center gap-1.5 rounded-lg border border-stone-700 px-3 py-2 text-[10px] uppercase tracking-wider text-stone-200">Preview<ArrowUpRight className="h-3.5 w-3.5" /></Link>{fit.status !== "archived" && <button type="button" onClick={() => setArchiveId(fit.id)} className="inline-flex items-center gap-1.5 rounded-lg border border-amber-900/70 px-3 py-2 text-[10px] uppercase tracking-wider text-amber-400"><Archive className="h-3.5 w-3.5" />Archive</button>}</div>
          </article>
        ))}</div>}
      </>}

      {section === "categories" && <EntitySection title="Categories" description="Customer-facing collection groupings." onAdd={() => setEditor({ type: "category", record: null })}>{snapshot.categories.length ? snapshot.categories.map((item) => <EntityRow key={item.slug} name={item.name} detail={`${item.fitCount} Fits · /${item.slug}`} active={item.isActive} onEdit={() => setEditor({ type: "category", record: item })} />) : <EmptyPanel label="categories" />}</EntitySection>}
      {section === "fabrics" && <EntitySection title="Fabrics" description="Reusable atelier fabric specifications." onAdd={() => setEditor({ type: "fabric", record: null })}>{snapshot.fabrics.length ? snapshot.fabrics.map((item) => <EntityRow key={item.id} name={item.name} detail={`${item.fitCount} Fits · ${[item.weight, item.finish].filter(Boolean).join(" · ") || "No specification"}`} active={item.isActive} onEdit={() => setEditor({ type: "fabric", record: item })} />) : <EmptyPanel label="fabrics" />}</EntitySection>}
      {section === "colours" && <EntitySection title="Colours" description="Reusable colourways available across Fits." onAdd={() => setEditor({ type: "colour", record: null })}>{snapshot.colours.length ? snapshot.colours.map((item) => <EntityRow key={item.id} name={item.name} detail={`${item.fitCount} Fits · ${item.hex}`} active={item.isActive} swatch={item.hex} onEdit={() => setEditor({ type: "colour", record: item })} />) : <EmptyPanel label="colours" />}</EntitySection>}

      {editor && <EntityEditor editor={editor} close={() => setEditor(null)} onSaved={(text) => { setEditor(null); setMessage(text); router.refresh(); }} />}
      <ConfirmDialog open={Boolean(archiveId)} title="Archive this Fit?" description="It will disappear from the public catalogue but remain available to staff and keep its stable identity for existing Saved Looks." confirmLabel="Archive Fit" busy={pending} onCancel={() => setArchiveId(null)} onConfirm={archiveFit} />
    </div>
  );
}

function EntitySection({ title, description, onAdd, children }: { title: string; description: string; onAdd: () => void; children: React.ReactNode }) {
  return <section><div className="mb-5 flex items-end justify-between gap-4"><div><h2 className="font-display text-2xl">{title}</h2><p className="mt-1 text-sm text-stone-500">{description}</p></div><button type="button" onClick={onAdd} className="inline-flex items-center gap-2 rounded-xl border border-champagne/40 px-4 py-2.5 text-xs uppercase tracking-wider text-champagne"><Plus className="h-4 w-4" />Add</button></div><div className="space-y-3">{children}</div></section>;
}

function EntityRow({ name, detail, active, swatch, onEdit }: { name: string; detail: string; active: boolean; swatch?: string; onEdit: () => void }) {
  return <div className="flex items-center justify-between gap-4 rounded-2xl border border-stone-800 bg-stone-950/60 p-4"><div className="flex min-w-0 items-center gap-3">{swatch && <span className="h-7 w-7 shrink-0 rounded-full border border-stone-600" style={{ backgroundColor: swatch }} />}<div><p className="text-sm text-stone-200">{name}</p><p className="mt-1 truncate text-xs text-stone-500">{detail}</p></div></div><div className="flex items-center gap-3"><span className={`text-[9px] uppercase tracking-wider ${active ? "text-emerald-400" : "text-stone-600"}`}>{active ? "Active" : "Inactive"}</span><button type="button" onClick={onEdit} aria-label={`Edit ${name}`} className="rounded-lg border border-stone-700 p-2 text-stone-300"><Edit3 className="h-4 w-4" /></button></div></div>;
}

function EntityEditor({ editor, close, onSaved }: { editor: NonNullable<EditorState>; close: () => void; onSaved: (message: string) => void }) {
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const record = editor.record;
  const categoryRecord = editor.type === "category" ? editor.record : null;
  const fabricRecord = editor.type === "fabric" ? editor.record : null;
  const colourRecord = editor.type === "colour" ? editor.record : null;
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    startTransition(async () => {
      let result;
      if (editor.type === "category") result = await saveCategoryAction(categoryRecord?.slug ?? null, { name: data.get("name"), tagline: data.get("tagline"), description: data.get("description"), heroImage: data.get("heroImage"), featuredQuote: data.get("featuredQuote"), characteristics: String(data.get("characteristics") ?? "").split("\n"), displayOrder: Number(data.get("displayOrder")), isActive: data.get("isActive") === "on" });
      else if (editor.type === "fabric") result = await saveFabricAction(fabricRecord?.id ?? null, { name: data.get("name"), description: data.get("description"), weight: data.get("weight"), finish: data.get("finish"), isActive: data.get("isActive") === "on" });
      else result = await saveColourAction(colourRecord?.id ?? null, { name: data.get("name"), hex: data.get("hex"), isActive: data.get("isActive") === "on" });
      if (result.success) onSaved(`${editor.type[0].toUpperCase()}${editor.type.slice(1)} saved.`); else setError(result.error);
    });
  };
  return <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm" onMouseDown={close}><div role="dialog" aria-modal="true" aria-label={`Edit ${editor.type}`} onMouseDown={(event) => event.stopPropagation()} className="h-full w-full max-w-xl overflow-y-auto border-l border-stone-800 bg-stone-950 p-6 sm:p-8"><div className="flex items-center justify-between"><div><p className="text-[10px] uppercase tracking-[0.24em] text-champagne">Catalogue option</p><h2 className="mt-2 font-display text-3xl">{record ? "Edit" : "Add"} {editor.type}</h2></div><button type="button" onClick={close} aria-label="Close editor"><X className="h-5 w-5" /></button></div><form onSubmit={submit} className="mt-8 space-y-5"><Field label="Name"><input name="name" required maxLength={120} defaultValue={record?.name ?? ""} className={fieldClass} /></Field>{editor.type === "category" && <><Field label="Tagline"><input name="tagline" required maxLength={160} defaultValue={categoryRecord?.tagline ?? ""} className={fieldClass} /></Field><Field label="Description"><textarea name="description" required rows={5} defaultValue={categoryRecord?.description ?? ""} className={fieldClass} /></Field><Field label="Hero image path or HTTPS URL"><input name="heroImage" required defaultValue={categoryRecord?.heroImage ?? "/images/editorial/hero-editorial.jpg"} className={fieldClass} /></Field><Field label="Featured quote"><textarea name="featuredQuote" required rows={3} defaultValue={categoryRecord?.featuredQuote ?? ""} className={fieldClass} /></Field><Field label="Characteristics (one per line)"><textarea name="characteristics" rows={5} defaultValue={categoryRecord?.characteristics.join("\n") ?? ""} className={fieldClass} /></Field><Field label="Display order"><input name="displayOrder" required type="number" min="0" max="9999" defaultValue={categoryRecord?.displayOrder ?? 0} className={fieldClass} /></Field></>}{editor.type === "fabric" && <><Field label="Description"><textarea name="description" required rows={5} defaultValue={fabricRecord?.description ?? ""} className={fieldClass} /></Field><div className="grid gap-4 sm:grid-cols-2"><Field label="Weight"><input name="weight" defaultValue={fabricRecord?.weight ?? ""} className={fieldClass} /></Field><Field label="Finish"><input name="finish" defaultValue={fabricRecord?.finish ?? ""} className={fieldClass} /></Field></div></>}{editor.type === "colour" && <Field label="HEX colour"><input name="hex" required pattern="#[0-9A-Fa-f]{6}" defaultValue={colourRecord?.hex ?? "#000000"} className={fieldClass} /></Field>}<label className="flex items-center gap-3 text-sm text-stone-300"><input name="isActive" type="checkbox" defaultChecked={record?.isActive ?? true} className="h-4 w-4 accent-[#D4AF77]" />Available for active catalogue use</label>{error && <p role="alert" className="rounded-xl border border-red-900 bg-red-950/30 p-3 text-sm text-red-300">{error}</p>}<button type="submit" disabled={pending} className="inline-flex items-center gap-2 rounded-xl bg-champagne px-5 py-3 text-xs font-semibold uppercase tracking-wider text-near-black disabled:opacity-50"><Check className="h-4 w-4" />{pending ? "Saving…" : "Save changes"}</button></form></div></div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block"><span className="mb-2 block text-[10px] uppercase tracking-[0.18em] text-stone-500">{label}</span>{children}</label>; }
