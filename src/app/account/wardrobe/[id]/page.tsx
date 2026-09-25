"use client";

import { use } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAccountData } from "@/lib/account-store";
import { getStyleById } from "@/data/styles";
import {
  ArrowLeft,
  Sparkles,
  Calendar,
  Layers,
  Scissors,
  Repeat,
  Lightbulb,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
} from "lucide-react";

export default function WardrobeItemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { wardrobe, orders } = useAccountData();

  const item = wardrobe.find((w) => w.id === id);
  const originalOrder = item ? orders.find((o) => o.id === item.orderId) : null;

  if (!item) {
    return (
      <div className="py-20 text-center space-y-4">
        <AlertCircle className="w-8 h-8 text-stone-600 mx-auto" />
        <h2 className="font-display text-2xl text-warm-ivory">Garment Archive Not Located</h2>
        <p className="text-xs text-stone-400">
          The requested wardrobe piece could not be found in your private client archives.
        </p>
        <Link
          href="/account/wardrobe"
          className="inline-flex items-center gap-2 text-xs text-champagne uppercase font-mono tracking-widest"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Wardrobe</span>
        </Link>
      </div>
    );
  }

  // "Order Similar" begins a new bespoke journey with pre-filled configuration
  const handleOrderSimilar = () => {
    const style = getStyleById(item.styleId);
    const destination = style ? `/bespoke/create/${style.slug}` : "/bespoke/create/idea";
    router.push(`${destination}?inspiration=${encodeURIComponent(item.id)}&action=order_similar`);
  };

  // "Use As Inspiration" allows selecting this piece as reference material for a custom vision
  const handleUseAsInspiration = () => {
    router.push(`/bespoke/create/idea?reference_wardrobe=${item.id}`);
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-300">
      {/* Back Link */}
      <div>
        <Link
          href="/account/wardrobe"
          className="inline-flex items-center gap-2 text-xs text-stone-400 hover:text-champagne transition-colors uppercase font-mono tracking-wider mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Wardrobe Pieces</span>
        </Link>

        {/* Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800/60 pb-6">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className="text-xs font-mono font-bold text-champagne">
                {item.styleCode}
              </span>
              <span className="text-stone-700">•</span>
              <span className="text-xs text-stone-400 font-mono capitalize">
                {item.category}
              </span>
              <span className="text-stone-700">•</span>
              <span className="text-xs text-stone-500 font-mono">
                Completed {new Date(item.completionDate).toLocaleDateString("en-NG", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl text-warm-ivory">
              {item.styleName}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleOrderSimilar}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-champagne text-near-black text-xs font-mono uppercase tracking-wider font-bold hover:bg-champagne-light transition-all"
            >
              <Repeat className="w-3.5 h-3.5" />
              <span>Order Similar</span>
            </button>

            <button
              onClick={handleUseAsInspiration}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-stone-700 text-stone-300 hover:text-warm-ivory hover:border-champagne/40 text-xs font-mono uppercase tracking-wider font-semibold transition-all"
            >
              <Lightbulb className="w-3.5 h-3.5" />
              <span>Use As Inspiration</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Main Garment Showcase Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Rich Portrait Garment Imagery */}
        <div className="lg:col-span-5 space-y-4">
          <div className="relative aspect-[3/4] w-full rounded-3xl overflow-hidden bg-stone-900 border border-stone-800/80 shadow-2xl">
            <Image
              src={item.heroImage}
              alt={item.styleName}
              fill
              priority
              className="object-cover object-top"
              sizes="(max-width: 1024px) 100vw, 40vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-near-black/70 via-transparent to-transparent" />

            {item.occasion && (
              <div className="absolute bottom-6 left-6">
                <span className="px-4 py-1.5 rounded-full bg-near-black/85 backdrop-blur-md border border-stone-700 text-xs font-mono text-warm-ivory">
                  Occasion: {item.occasion}
                </span>
              </div>
            )}
          </div>

          {/* Archival Authenticity Seal */}
          <div className="p-4 rounded-2xl bg-stone-950 fine-border flex items-center gap-3 text-xs text-stone-400">
            <ShieldCheck className="w-5 h-5 text-champagne shrink-0" />
            <p className="font-light">
              Master paper pattern permanently archived in TSquare Abeokuta atelier vault.
            </p>
          </div>
        </div>

        {/* Right Column: Tailoring Anatomy & Historical Snapshots */}
        <div className="lg:col-span-7 space-y-6">
          {/* Textile & Colour Specifications */}
          <div className="p-6 sm:p-8 rounded-3xl bg-stone-950 fine-border space-y-5">
            <h2 className="text-xs font-mono uppercase tracking-[0.25em] text-champagne font-semibold">
              Textile & Hardware Snapshot
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-stone-900/50 border border-stone-800 space-y-1">
                <span className="text-[10px] uppercase font-mono text-stone-500 block">
                  Original Fabric Choice
                </span>
                <p className="font-medium text-warm-ivory text-sm">
                  {item.fabricSnapshot.name}
                </p>
                {item.fabricSnapshot.finish && (
                  <p className="text-[11px] text-stone-400">
                    Finish: {item.fabricSnapshot.finish}
                  </p>
                )}
                {item.fabricSnapshot.weight && (
                  <p className="text-[11px] text-stone-400">
                    Weight: {item.fabricSnapshot.weight}
                  </p>
                )}
              </div>

              <div className="p-4 rounded-2xl bg-stone-900/50 border border-stone-800 space-y-1">
                <span className="text-[10px] uppercase font-mono text-stone-500 block">
                  Original Palette & Tone
                </span>
                <div className="flex items-center gap-2 pt-0.5">
                  <span
                    className="w-4 h-4 rounded-full border border-stone-700 shrink-0"
                    style={{ backgroundColor: item.colourSnapshot.hex }}
                  />
                  <p className="font-medium text-warm-ivory text-sm">
                    {item.colourSnapshot.name}
                  </p>
                </div>
              </div>
            </div>

            {/* Design Preferences */}
            {item.preferencesSnapshot && Object.keys(item.preferencesSnapshot).length > 0 && (
              <div className="pt-2 border-t border-stone-800/60 space-y-3">
                <span className="text-[10px] uppercase font-mono text-stone-500 block">
                  Handcrafted Design Preferences
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {Object.entries(item.preferencesSnapshot).map(([k, v]) => (
                    <div
                      key={k}
                      className="p-3 rounded-xl bg-stone-900/30 border border-stone-800/60 text-xs"
                    >
                      <span className="text-[9px] uppercase font-mono text-stone-500 block capitalize">
                        {k.replace(/([A-Z])/g, " $1")}
                      </span>
                      <span className="text-stone-300 font-medium">{String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Historical Locked Measurements */}
          <div className="p-6 sm:p-8 rounded-3xl bg-stone-950 fine-border space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xs font-mono uppercase tracking-[0.25em] text-champagne font-semibold">
                  Anatomical Pattern Dimensions Used
                </h2>
                <p className="text-[11px] text-stone-400 font-light mt-0.5">
                  The exact bodily dimensions locked when this bespoke silhouette was drafted.
                </p>
              </div>
              <Scissors className="w-4 h-4 text-stone-500" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              {Object.entries(item.measurementsSnapshot).map(([key, val]) => (
                <div
                  key={key}
                  className="p-3 rounded-xl bg-stone-900/60 border border-stone-800 text-center"
                >
                  <span className="text-[9px] uppercase font-mono text-stone-500 block capitalize">
                    {key.replace(/([A-Z])/g, " $1")}
                  </span>
                  <span className="text-xs font-mono font-bold text-warm-ivory">
                    {val} cm
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Master Tailor Finish Notes & Provenance */}
          <div className="p-6 sm:p-8 rounded-3xl bg-stone-950 fine-border space-y-4">
            <h2 className="text-xs font-mono uppercase tracking-[0.25em] text-champagne font-semibold">
              Craftsmanship Notes & Provenance
            </h2>

            <p className="text-xs text-stone-300 leading-relaxed italic bg-stone-900/40 p-4 rounded-2xl border border-stone-800">
              &quot;{item.craftsmanshipNotes || "Full bespoke floating canvas construction. Hand-rolled lapels and concealed seam stitching."}&quot;
            </p>

            {originalOrder && (
              <div className="flex items-center justify-between text-xs pt-2 border-t border-stone-800/60 text-stone-400">
                <span>Commission Origin:</span>
                <Link
                  href={`/account/orders/${originalOrder.id}`}
                  className="inline-flex items-center gap-1.5 text-champagne hover:underline font-mono"
                >
                  <span>{originalOrder.orderReference}</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
