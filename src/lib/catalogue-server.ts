import "server-only";

import { createClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";
import { COLLECTIONS } from "@/data/collections";
import { STYLES } from "@/data/styles";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Collection, Style } from "@/types";

interface CatalogueImageRow {
  image_path: string | null;
  storage_object_path: string | null;
  alt_text: string;
  object_position: string | null;
  sort_order: number;
  is_primary: boolean;
}

interface CatalogueFabricRow {
  id: string;
  name: string;
  description: string;
  weight: string | null;
  finish: string | null;
  sort_order: number;
}

interface CatalogueColourRow {
  id: string;
  name: string;
  hex: string;
  sort_order: number;
}

interface CatalogueFabricLinkRow {
  sort_order: number;
  catalogue_fabrics: CatalogueFabricRow | null;
}

interface CatalogueColourLinkRow {
  sort_order: number;
  catalogue_colours: CatalogueColourRow | null;
}

interface CatalogueFitRow {
  id: string;
  slug: string;
  code: string;
  name: string;
  category_slug: string;
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
  catalogue_fit_fabrics: CatalogueFabricLinkRow[];
  catalogue_fit_colours: CatalogueColourLinkRow[];
}

interface CatalogueCategoryRow {
  slug: string;
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

async function resolveImageSource(
  supabase: SupabaseClient,
  image: CatalogueImageRow
) {
  if (!image.storage_object_path) return image.image_path ?? "/images/editorial/hero-editorial.jpg";
  const { data, error } = await supabase.storage
    .from("catalogue-media")
    .createSignedUrl(image.storage_object_path, 7200);
  if (error || !data?.signedUrl) {
    console.error("Catalogue media signing failed", { message: error?.message });
    return "/images/editorial/hero-editorial.jpg";
  }
  return data.signedUrl;
}

async function mapFit(
  supabase: SupabaseClient,
  row: CatalogueFitRow,
  categoryName: string
): Promise<Style> {
  const images = [...(row.catalogue_fit_images ?? [])].sort((a, b) => a.sort_order - b.sort_order);
  const imageSources = await Promise.all(images.map((image) => resolveImageSource(supabase, image)));
  const fabrics = [...(row.catalogue_fit_fabrics ?? [])]
    .sort((a, b) => a.sort_order - b.sort_order)
    .flatMap((link) => (link.catalogue_fabrics ? [link.catalogue_fabrics] : []));
  const colours = [...(row.catalogue_fit_colours ?? [])]
    .sort((a, b) => a.sort_order - b.sort_order)
    .flatMap((link) => (link.catalogue_colours ? [link.catalogue_colours] : []));

  return {
    id: row.id,
    slug: row.slug,
    code: row.code,
    name: row.name,
    category: row.category_slug,
    categoryLabel: categoryName,
    description: row.description,
    longDescription: row.long_description ?? undefined,
    images: imageSources,
    gallery: images.map((image, index) => ({
      src: imageSources[index],
      alt: image.alt_text,
      storageObjectPath: image.storage_object_path ?? undefined,
      objectPosition: image.object_position ?? undefined,
      isPrimary: image.is_primary,
    })),
    availableColours: colours.map((colour) => ({ id: colour.id, name: colour.name, hex: colour.hex })),
    availableFabrics: fabrics.map((fabric) => ({
      id: fabric.id,
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
            "id,slug,code,name,category_slug,description,long_description,fabric_information,fit_information,occasions,featured,collection_name,tags,lead_time_weeks,craftsmanship_highlights,catalogue_fit_images(image_path,storage_object_path,alt_text,object_position,sort_order,is_primary),catalogue_fit_fabrics(sort_order,catalogue_fabrics(id,name,description,weight,finish)),catalogue_fit_colours(sort_order,catalogue_colours(id,name,hex))"
          )
          .eq("status", "published")
          .order("display_order"),
        supabase
          .from("catalogue_categories")
          .select("slug,name,tagline,description,hero_image,featured_quote,characteristics")
          .eq("is_active", true)
          .order("display_order"),
      ]);

      if (fitResult.error || categoryResult.error) {
        console.error("Catalogue query failed; using bundled fallback", {
          fits: fitResult.error?.message,
          categories: categoryResult.error?.message,
        });
        return fallbackSnapshot;
      }

      const categories = categoryResult.data?.length
        ? (categoryResult.data as CatalogueCategoryRow[]).map(mapCategory)
        : [];
      const categoryNames = new Map(categories.map((category) => [category.slug, category.name]));
      const styles = await Promise.all(
        (fitResult.data as unknown as CatalogueFitRow[]).map((fit) =>
          mapFit(supabase, fit, categoryNames.get(fit.category_slug) ?? fit.category_slug)
        )
      );

      return {
        styles,
        collections: categoryResult.data?.length
          ? categories
          : [],
        source: "supabase",
      };
    } catch (error) {
      console.error("Catalogue initialization failed; using bundled fallback", error);
      return fallbackSnapshot;
    }
  },
  ["tcc-catalogue-v2"],
  { revalidate: 3600, tags: ["catalogue"] }
);

export async function getCatalogueSnapshot(): Promise<CatalogueSnapshot> {
  return loadCatalogue();
}
