import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { COLLECTIONS, getCollectionBySlug } from "@/data/collections";
import { getStylesByCategory } from "@/data/styles";
import { StyleCard } from "@/components/features/styles/StyleCard";
import { ProductCategory } from "@/types";

interface CategoryPageProps {
  params: Promise<{
    category: string;
  }>;
}

export async function generateStaticParams() {
  return COLLECTIONS.map((c) => ({
    category: c.slug,
  }));
}

export async function generateMetadata({ params }: CategoryPageProps) {
  const { category } = await params;
  const collection = getCollectionBySlug(category);
  if (!collection) return { title: "Collection Not Found" };

  return {
    title: `${collection.name} Collection | TSquare Clothing Cafe`,
    description: collection.description,
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category } = await params;
  const collection = getCollectionBySlug(category);

  if (!collection) {
    notFound();
  }

  const categoryStyles = getStylesByCategory(collection.slug as ProductCategory);

  return (
    <div className="bg-near-black min-h-screen text-warm-ivory selection:bg-champagne selection:text-near-black font-sans">
      {/* ------------------------------------------------------------- */}
      {/* Editorial Category Hero                                       */}
      {/* ------------------------------------------------------------- */}
      <section className="relative min-h-[60vh] sm:min-h-[70vh] flex items-end justify-start overflow-hidden pt-32 pb-16">
        <div className="absolute inset-0 z-0">
          <Image
            src={collection.heroImage}
            alt={collection.name}
            fill
            priority
            className="object-cover object-top filter brightness-[0.65]"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-near-black via-near-black/50 to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <Link
            href="/collections"
            className="inline-flex items-center text-[10px] uppercase font-mono tracking-[0.25em] text-stone-300 hover:text-champagne transition-colors mb-6 bg-near-black/70 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-stone-800"
          >
            <ArrowLeft className="mr-2 h-3.5 w-3.5" />
            Back To All Collections
          </Link>

          <span className="text-[10px] uppercase font-mono tracking-[0.3em] text-champagne font-semibold block mb-2">
            House Collection
          </span>

          <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-normal tracking-tight text-warm-ivory leading-tight">
            {collection.name}
          </h1>

          <p className="mt-4 text-base sm:text-xl text-stone-200 font-display font-light italic max-w-2xl">
            &ldquo;{collection.featuredQuote}&rdquo;
          </p>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* Narrative & Architectural Characteristics                     */}
      {/* ------------------------------------------------------------- */}
      <section className="border-y border-stone-800/80 bg-stone-950 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-6">
              <span className="text-[9px] uppercase font-mono tracking-[0.25em] text-stone-500 font-semibold block mb-1">
                Sartorial Identity
              </span>
              <p className="text-sm sm:text-base text-stone-300 font-sans font-light leading-relaxed">
                {collection.description}
              </p>
            </div>

            <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-3 border-l-0 lg:border-l border-stone-800 lg:pl-8">
              {collection.characteristics.map((char, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-stone-400">
                  <CheckCircle2 className="h-4 w-4 text-champagne shrink-0 mt-0.5" />
                  <span>{char}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* Styles Listing                                                */}
      {/* ------------------------------------------------------------- */}
      <section className="py-20 sm:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-12 pb-4 border-b border-stone-800/80">
          <div>
            <span className="text-[10px] uppercase font-mono tracking-widest text-champagne font-semibold">
              Archive Catalog
            </span>
            <h2 className="font-display text-2xl text-warm-ivory mt-0.5">
              Curated {collection.name} Pieces
            </h2>
          </div>
          <span className="text-xs text-stone-400 font-mono">
            {categoryStyles.length} {categoryStyles.length === 1 ? "Design" : "Designs"}
          </span>
        </div>

        {categoryStyles.length === 0 ? (
          <div className="py-16 text-center text-stone-400 fine-border rounded-2xl p-8">
            <p>New designs currently being photographed in the atelier.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
            {categoryStyles.map((style) => (
              <StyleCard key={style.id} style={style} />
            ))}
          </div>
        )}

        {/* Bottom Consultation Link with Rounded-3xl */}
        <div className="mt-20 p-8 sm:p-12 bg-stone-950 fine-border rounded-3xl text-center max-w-3xl mx-auto shadow-md">
          <span className="text-[10px] uppercase font-mono tracking-[0.25em] text-champagne font-semibold block mb-2">
            Personal Customization
          </span>
          <h3 className="font-display text-2xl text-warm-ivory">
            Require a custom variant of {collection.name}?
          </h3>
          <p className="mt-3 text-xs sm:text-sm text-stone-400 font-sans font-light leading-relaxed max-w-xl mx-auto">
            Our master tailors can draft a one-of-one silhouette tailored to your exact event date, preferred fabric weight, and embroidery motif.
          </p>
          <div className="mt-6">
            <Link
              href="/book-a-fitting"
              className="inline-flex items-center justify-center bg-champagne text-near-black text-xs uppercase tracking-[0.2em] font-bold px-8 py-3.5 hover:bg-champagne-light transition-colors rounded-xl shadow-sm"
            >
              Book Atelier Consultation
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
