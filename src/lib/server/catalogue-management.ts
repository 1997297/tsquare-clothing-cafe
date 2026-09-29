import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  CatalogueCategoryAdmin,
  CatalogueColourAdmin,
  CatalogueFitAdmin,
  CatalogueImageAdmin,
  CatalogueManagementSnapshot,
  CatalogueFabricAdmin,
  CatalogueStatus,
} from "@/lib/catalogue-admin";
import { requireStaff } from "@/lib/server/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Style } from "@/types";

interface CategoryRow {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  hero_image: string;
  featured_quote: string;
  characteristics: string[];
  display_order: number;
  is_active: boolean;
  updated_at: string;
}

interface FabricRow {
  id: string;
  name: string;
  description: string;
  weight: string | null;
  finish: string | null;
  is_active: boolean;
  updated_at: string;
}

interface ColourRow {
  id: string;
  name: string;
  hex: string;
  is_active: boolean;
  updated_at: string;
}

interface ImageRow {
  id: number;
  fit_id: string;
  image_path: string | null;
  storage_object_path: string | null;
  alt_text: string;
  object_position: string | null;
  sort_order: number;
  is_primary: boolean;
}

interface FabricLinkRow {
  fabric_id: string;
  sort_order: number;
}

interface ColourLinkRow {
  colour_id: string;
  sort_order: number;
}

interface FitRow {
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
  display_order: number;
  status: CatalogueStatus;
  created_at: string;
  updated_at: string;
  catalogue_fit_images: ImageRow[];
  catalogue_fit_fabrics: FabricLinkRow[];
  catalogue_fit_colours: ColourLinkRow[];
}

async function resolveAdminImageSource(supabase: SupabaseClient, image: ImageRow) {
  if (!image.storage_object_path) return image.image_path ?? "/images/editorial/hero-editorial.jpg";
  const { data, error } = await supabase.storage
    .from("catalogue-media")
    .createSignedUrl(image.storage_object_path, 7200);
  if (error || !data?.signedUrl) {
    console.error("Staff catalogue media signing failed", { message: error?.message });
    return "/images/editorial/hero-editorial.jpg";
  }
  return data.signedUrl;
}

async function mapFit(
  supabase: SupabaseClient,
  row: FitRow,
  categoryName: string,
  fabricById: Map<string, FabricRow>,
  colourById: Map<string, ColourRow>
): Promise<CatalogueFitAdmin> {
  const imageRows = [...(row.catalogue_fit_images ?? [])].sort((a, b) => a.sort_order - b.sort_order);
  const imageSources = await Promise.all(imageRows.map((image) => resolveAdminImageSource(supabase, image)));
  const images: CatalogueImageAdmin[] = imageRows.map((image, index) => ({
    id: image.id,
    fitId: image.fit_id,
    src: imageSources[index],
    imagePath: image.image_path,
    storageObjectPath: image.storage_object_path,
    altText: image.alt_text,
    objectPosition: image.object_position ?? "center",
    sortOrder: image.sort_order,
    isPrimary: image.is_primary,
  }));
  const fabricLinks = [...(row.catalogue_fit_fabrics ?? [])].sort((a, b) => a.sort_order - b.sort_order);
  const colourLinks = [...(row.catalogue_fit_colours ?? [])].sort((a, b) => a.sort_order - b.sort_order);
  const fabrics = fabricLinks.flatMap((link) => {
    const fabric = fabricById.get(link.fabric_id);
    return fabric ? [fabric] : [];
  });
  const colours = colourLinks.flatMap((link) => {
    const colour = colourById.get(link.colour_id);
    return colour ? [colour] : [];
  });

  const style: Style = {
    id: row.id,
    slug: row.slug,
    code: row.code,
    name: row.name,
    category: row.category_slug,
    categoryLabel: categoryName,
    description: row.description,
    longDescription: row.long_description ?? undefined,
    images: images.map((image) => image.src),
    gallery: images.map((image) => ({
      src: image.src,
      alt: image.altText,
      objectPosition: image.objectPosition,
      isPrimary: image.isPrimary,
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

  return {
    id: row.id,
    slug: row.slug,
    code: row.code,
    name: row.name,
    categorySlug: row.category_slug,
    categoryName,
    description: row.description,
    longDescription: row.long_description ?? "",
    fabricInformation: row.fabric_information,
    fitInformation: row.fit_information,
    occasions: row.occasions ?? [],
    featured: row.featured,
    collectionName: row.collection_name,
    tags: row.tags ?? [],
    leadTimeWeeks: row.lead_time_weeks,
    craftsmanshipHighlights: row.craftsmanship_highlights ?? [],
    displayOrder: row.display_order,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    images,
    fabricIds: fabricLinks.map((link) => link.fabric_id),
    colourIds: colourLinks.map((link) => link.colour_id),
    style,
  };
}

export async function getCatalogueManagementSnapshot(): Promise<CatalogueManagementSnapshot> {
  await requireStaff();
  const supabase = await createServerSupabaseClient();
  const [fitResult, categoryResult, fabricResult, colourResult] = await Promise.all([
    supabase
      .from("catalogue_fits")
      .select("id,slug,code,name,category_slug,description,long_description,fabric_information,fit_information,occasions,featured,collection_name,tags,lead_time_weeks,craftsmanship_highlights,display_order,status,created_at,updated_at,catalogue_fit_images(id,fit_id,image_path,storage_object_path,alt_text,object_position,sort_order,is_primary),catalogue_fit_fabrics(fabric_id,sort_order),catalogue_fit_colours(colour_id,sort_order)")
      .order("updated_at", { ascending: false }),
    supabase.from("catalogue_categories").select("slug,name,tagline,description,hero_image,featured_quote,characteristics,display_order,is_active,updated_at").order("display_order"),
    supabase.from("catalogue_fabrics").select("id,name,description,weight,finish,is_active,updated_at").order("name"),
    supabase.from("catalogue_colours").select("id,name,hex,is_active,updated_at").order("name"),
  ]);

  const firstError = fitResult.error ?? categoryResult.error ?? fabricResult.error ?? colourResult.error;
  if (firstError) {
    console.error("Catalogue management query failed", { code: firstError.code, message: firstError.message });
    throw new Error("CATALOGUE_MANAGEMENT_UNAVAILABLE");
  }

  const fitRows = (fitResult.data ?? []) as unknown as FitRow[];
  const categoryRows = (categoryResult.data ?? []) as CategoryRow[];
  const fabricRows = (fabricResult.data ?? []) as FabricRow[];
  const colourRows = (colourResult.data ?? []) as ColourRow[];
  const categoryBySlug = new Map(categoryRows.map((category) => [category.slug, category]));
  const fabricById = new Map(fabricRows.map((fabric) => [fabric.id, fabric]));
  const colourById = new Map(colourRows.map((colour) => [colour.id, colour]));

  const fits = await Promise.all(
    fitRows.map((fit) => mapFit(
      supabase,
      fit,
      categoryBySlug.get(fit.category_slug)?.name ?? fit.category_slug,
      fabricById,
      colourById
    ))
  );

  const categoryCounts = new Map<string, number>();
  const fabricCounts = new Map<string, number>();
  const colourCounts = new Map<string, number>();
  for (const fit of fits) {
    categoryCounts.set(fit.categorySlug, (categoryCounts.get(fit.categorySlug) ?? 0) + 1);
    for (const id of fit.fabricIds) fabricCounts.set(id, (fabricCounts.get(id) ?? 0) + 1);
    for (const id of fit.colourIds) colourCounts.set(id, (colourCounts.get(id) ?? 0) + 1);
  }

  const categories: CatalogueCategoryAdmin[] = categoryRows.map((category) => ({
    slug: category.slug,
    name: category.name,
    tagline: category.tagline,
    description: category.description,
    heroImage: category.hero_image,
    featuredQuote: category.featured_quote,
    characteristics: category.characteristics ?? [],
    displayOrder: category.display_order,
    isActive: category.is_active,
    fitCount: categoryCounts.get(category.slug) ?? 0,
    updatedAt: category.updated_at,
  }));
  const fabrics: CatalogueFabricAdmin[] = fabricRows.map((fabric) => ({
    id: fabric.id,
    name: fabric.name,
    description: fabric.description,
    weight: fabric.weight ?? "",
    finish: fabric.finish ?? "",
    isActive: fabric.is_active,
    fitCount: fabricCounts.get(fabric.id) ?? 0,
    updatedAt: fabric.updated_at,
  }));
  const colours: CatalogueColourAdmin[] = colourRows.map((colour) => ({
    id: colour.id,
    name: colour.name,
    hex: colour.hex,
    isActive: colour.is_active,
    fitCount: colourCounts.get(colour.id) ?? 0,
    updatedAt: colour.updated_at,
  }));

  return { fits, categories, fabrics, colours };
}
