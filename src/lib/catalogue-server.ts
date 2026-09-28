import "server-only";

import { createClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";
import { COLLECTIONS } from "@/data/collections";
import { STYLES } from "@/data/styles";
import type { Collection, ProductCategory, Style } from "@/types";

interface CatalogueImageRow {
  image_path: string;
  alt_text: string;
  object_position: string | null;
  sort_order: number;
  is_primary: boolean;
}

interface CatalogueFabricRow {
  name: string;
  description: string;
  weight: string | null;
  finish: string | null;
  sort_order: number;
}

interface CatalogueColourRow {
  name: string;
  hex: string;
  sort_order: number;
}

interface CatalogueFitRow {
  id: string;
  slug: string;
  code: string;
  name: string;
  category_slug: ProductCategory;
  description: string;
  long_description: string | null;
  fabric_information: string;
  fit_information: string;
  occasions: string[];
  featured: boolean;
  collection_name: string;
  tags: string[];
  lead_time_weeks: number | null;
  craftsmanship_highlights: string[];
  catalogue_fit_images: CatalogueImageRow[];
  catalogue_fit_fabrics: CatalogueFabricRow[];
  catalogue_fit_colours: CatalogueColourRow[];
}

interface CatalogueCategoryRow {
  slug: ProductCategory;
  name: string;
  tagline: string;
  description: string;
  hero_image: string;
  featured_quote: string;
  characteristics: string[];
}

export interface CatalogueSnapshot {
  styles: Style[];
  collections: Collection[];
  source: "supabase" | "fallback";
}

const fallbackSnapshot: CatalogueSnapshot = {
  styles: STYLES,
  collections: COLLECTIONS,
  source: "fallback",
};

function mapFit(row: CatalogueFitRow): Style {
  const images = [...(row.catalogue_fit_images ?? [])].sort(
    (a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order
  );
  const fabrics = [...(row.catalogue_fit_fabrics ?? [])].sort((a, b) => a.sort_order - b.sort_order);
  const colours = [...(row.catalogue_fit_colours ?? [])].sort((a, b) => a.sort_order - b.sort_order);

  return {
    id: row.id,
    slug: row.slug,
    code: row.code,
    name: row.name,
    category: row.category_slug,
    categoryLabel: row.category_slug.charAt(0).toUpperCase() + row.category_slug.slice(1),
    description: row.description,
    longDescription: row.long_description ?? undefined,
    images: images.map((image) => image.image_path),
    gallery: images.map((image) => ({
      src: image.image_path,
      alt: image.alt_text,
      objectPosition: image.object_position ?? undefined,
      isPrimary: image.is_primary,
    })),
    availableColours: colours.map((colour) => ({ name: colour.name, hex: colour.hex })),
    availableFabrics: fabrics.map((fabric) => ({
      name: fabric.name,
      description: fabric.description,
      weight: fabric.weight ?? undefined,
      finish: fabric.finish ?? undefined,
    })),
    fabricInformation: row.fabric_information,
    fitInformation: row.fit_information,
    occasions: row.occasions ?? [],
    featured: row.featured,
    collection: row.collection_name,
    tags: row.tags ?? [],
    leadTimeWeeks: row.lead_time_weeks ?? undefined,
    craftsmanshipHighlights: row.craftsmanship_highlights ?? [],
  };
}

function mapCategory(row: CatalogueCategoryRow): Collection {
  return {
    id: `col-${row.slug}`,
    slug: row.slug,
    name: row.name,
    tagline: row.tagline,
    description: row.description,
    heroImage: row.hero_image,
    featuredQuote: row.featured_quote,
    characteristics: row.characteristics ?? [],
  };
}

const loadCatalogue = unstable_cache(
  async (): Promise<CatalogueSnapshot> => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key || url === "https://your-project-ref.supabase.co") {
      return fallbackSnapshot;
    }

    try {
      const supabase = createClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const [fitResult, categoryResult] = await Promise.all([
        supabase
          .from("catalogue_fits")
          .select(
            "id,slug,code,name,category_slug,description,long_description,fabric_information,fit_information,occasions,featured,collection_name,tags,lead_time_weeks,craftsmanship_highlights,catalogue_fit_images(image_path,alt_text,object_position,sort_order,is_primary),catalogue_fit_fabrics(name,description,weight,finish,sort_order),catalogue_fit_colours(name,hex,sort_order)"
          )
          .eq("is_active", true)
          .order("display_order"),
        supabase
          .from("catalogue_categories")
          .select("slug,name,tagline,description,hero_image,featured_quote,characteristics")
          .eq("is_active", true)
          .order("display_order"),
      ]);

      if (fitResult.error || categoryResult.error || !fitResult.data?.length) {
        console.error("Catalogue query failed; using bundled fallback", {
          fits: fitResult.error?.message,
          categories: categoryResult.error?.message,
        });
        return fallbackSnapshot;
      }

      return {
        styles: (fitResult.data as unknown as CatalogueFitRow[]).map(mapFit),
        collections: categoryResult.data?.length
          ? (categoryResult.data as CatalogueCategoryRow[]).map(mapCategory)
          : COLLECTIONS,
        source: "supabase",
      };
    } catch (error) {
      console.error("Catalogue initialization failed; using bundled fallback", error);
      return fallbackSnapshot;
    }
  },
  ["tcc-catalogue-v1"],
  { revalidate: 3600, tags: ["catalogue"] }
);

export async function getCatalogueSnapshot(): Promise<CatalogueSnapshot> {
  return loadCatalogue();
}
