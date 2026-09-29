"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath, revalidateTag } from "next/cache";
import {
  CATALOGUE_STATUSES,
  isOwnedCatalogueMediaPath,
  slugifyCatalogueValue,
  validateCategoryMutation,
  validateColourMutation,
  validateFabricMutation,
  validateFitMutation,
  type CatalogueActionResult,
  type CatalogueStatus,
} from "@/lib/catalogue-admin";
import { requireStaff } from "@/lib/server/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const IDENTIFIER_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const IMAGE_POSITIONS = new Set(["center", "top", "bottom", "left", "right"]);

function refreshCatalogue(fitSlug?: string) {
  revalidateTag("catalogue");
  revalidatePath("/admin/collections");
  revalidatePath("/collections");
  if (fitSlug) revalidatePath(`/styles/${fitSlug}`);
}

function safeError(error: { code?: string; message?: string } | null, fallback: string) {
  if (error?.code === "23505") return "That name, code, slug, or display order is already in use.";
  if (error?.code === "23503") return "This item is still referenced by another catalogue record.";
  if (error?.code === "42501") return "This account is not authorized to manage the catalogue.";
  return fallback;
}

async function uniqueSlug(baseValue: string, table: "catalogue_fits" | "catalogue_categories") {
  const supabase = await createServerSupabaseClient();
  const base = slugifyCatalogueValue(baseValue) || `atelier-${randomUUID().slice(0, 8)}`;
  for (let suffix = 1; suffix <= 100; suffix += 1) {
    const candidate = suffix === 1 ? base : `${base}-${suffix}`;
    const { data, error } = await supabase.from(table).select("slug").eq("slug", candidate).maybeSingle();
    if (error) throw error;
    if (!data) return candidate;
  }
  return `${base}-${randomUUID().slice(0, 8)}`;
}

async function validateReferences(
  categorySlug: string,
  fabricIds: string[],
  colourIds: string[]
): Promise<CatalogueActionResult<undefined>> {
  const supabase = await createServerSupabaseClient();
  const [categoryResult, fabricResult, colourResult] = await Promise.all([
    supabase.from("catalogue_categories").select("slug,is_active").eq("slug", categorySlug).maybeSingle(),
    fabricIds.length
      ? supabase.from("catalogue_fabrics").select("id").in("id", fabricIds)
      : Promise.resolve({ data: [], error: null }),
    colourIds.length
      ? supabase.from("catalogue_colours").select("id").in("id", colourIds)
      : Promise.resolve({ data: [], error: null }),
  ]);
  const error = categoryResult.error ?? fabricResult.error ?? colourResult.error;
  if (error) return { success: false, error: safeError(error, "Catalogue references could not be verified.") };
  if (!categoryResult.data) return { success: false, error: "Choose an existing category." };
  if ((fabricResult.data?.length ?? 0) !== fabricIds.length) return { success: false, error: "One or more fabrics no longer exist." };
  if ((colourResult.data?.length ?? 0) !== colourIds.length) return { success: false, error: "One or more colours no longer exist." };
  return { success: true, data: undefined };
}

async function ensurePublishable(
  fitId: string,
  categorySlug: string,
  fabricIds: string[],
  colourIds: string[]
): Promise<CatalogueActionResult<undefined>> {
  if (fabricIds.length === 0 || colourIds.length === 0) {
    return { success: false, error: "A published Fit needs at least one fabric and one colour." };
  }
  const supabase = await createServerSupabaseClient();
  const [imageResult, categoryResult, fabricResult, colourResult] = await Promise.all([
    supabase.from("catalogue_fit_images").select("id", { count: "exact", head: true }).eq("fit_id", fitId),
    supabase.from("catalogue_categories").select("is_active").eq("slug", categorySlug).maybeSingle(),
    supabase.from("catalogue_fabrics").select("id").in("id", fabricIds).eq("is_active", true),
    supabase.from("catalogue_colours").select("id").in("id", colourIds).eq("is_active", true),
  ]);
  const error = imageResult.error ?? categoryResult.error ?? fabricResult.error ?? colourResult.error;
  if (error) return { success: false, error: safeError(error, "Publication requirements could not be verified.") };
  if ((imageResult.count ?? 0) === 0) return { success: false, error: "Add at least one gallery image before publishing." };
  if (!categoryResult.data?.is_active) return { success: false, error: "Activate the selected category before publishing this Fit." };
  if ((fabricResult.data?.length ?? 0) !== fabricIds.length) return { success: false, error: "Every fabric selected for publication must be active." };
  if ((colourResult.data?.length ?? 0) !== colourIds.length) return { success: false, error: "Every colour selected for publication must be active." };
  return { success: true, data: undefined };
}

export async function createFitAction(input: unknown): Promise<CatalogueActionResult<{ id: string }>> {
  await requireStaff();
  const parsed = validateFitMutation(input);
  if (!parsed.success) return parsed;
  const references = await validateReferences(parsed.data.categorySlug, parsed.data.fabricIds, parsed.data.colourIds);
  if (!references.success) return references;

  const supabase = await createServerSupabaseClient();
  const id = `fit-${randomUUID()}`;
  let slug: string;
  try {
    slug = await uniqueSlug(parsed.data.name, "catalogue_fits");
  } catch (error) {
    console.error("Fit slug generation failed", error);
    return { success: false, error: "A unique Fit URL could not be generated." };
  }

  const { error } = await supabase.from("catalogue_fits").insert({
    id,
    slug,
    code: parsed.data.code,
    name: parsed.data.name,
    category_slug: parsed.data.categorySlug,
    description: parsed.data.description,
    long_description: parsed.data.longDescription || null,
    fabric_information: parsed.data.fabricInformation,
    fit_information: parsed.data.fitInformation,
    occasions: parsed.data.occasions,
    featured: parsed.data.featured,
    collection_name: parsed.data.collectionName,
    tags: parsed.data.tags,
    lead_time_weeks: parsed.data.leadTimeWeeks,
    craftsmanship_highlights: parsed.data.craftsmanshipHighlights,
    display_order: parsed.data.displayOrder,
    status: "draft",
  });
  if (error) return { success: false, error: safeError(error, "The Fit could not be created.") };

  const { error: optionError } = await supabase.rpc("replace_catalogue_fit_options", {
    p_fit_id: id,
    p_fabric_ids: parsed.data.fabricIds,
    p_colour_ids: parsed.data.colourIds,
  });
  if (optionError) {
    console.error("New Fit option assignment failed", { code: optionError.code, message: optionError.message });
    return { success: false, error: "The draft was created, but its options could not be assigned. Open it and save again." };
  }

  refreshCatalogue(slug);
  return { success: true, data: { id } };
}

export async function updateFitAction(fitId: string, input: unknown): Promise<CatalogueActionResult<undefined>> {
  await requireStaff();
  if (!IDENTIFIER_PATTERN.test(fitId)) return { success: false, error: "Invalid Fit identifier." };
  const parsed = validateFitMutation(input);
  if (!parsed.success) return parsed;
  const references = await validateReferences(parsed.data.categorySlug, parsed.data.fabricIds, parsed.data.colourIds);
  if (!references.success) return references;
  if (parsed.data.status === "published") {
    const publishable = await ensurePublishable(fitId, parsed.data.categorySlug, parsed.data.fabricIds, parsed.data.colourIds);
    if (!publishable.success) return publishable;
  }

  const supabase = await createServerSupabaseClient();
  const { data: existing, error: existingError } = await supabase
    .from("catalogue_fits")
    .select("slug")
    .eq("id", fitId)
    .maybeSingle();
  if (existingError || !existing) return { success: false, error: safeError(existingError, "Fit not found.") };

  const { error } = await supabase.from("catalogue_fits").update({
    code: parsed.data.code,
    name: parsed.data.name,
    category_slug: parsed.data.categorySlug,
    description: parsed.data.description,
    long_description: parsed.data.longDescription || null,
    fabric_information: parsed.data.fabricInformation,
    fit_information: parsed.data.fitInformation,
    occasions: parsed.data.occasions,
    featured: parsed.data.featured,
    collection_name: parsed.data.collectionName,
    tags: parsed.data.tags,
    lead_time_weeks: parsed.data.leadTimeWeeks,
    craftsmanship_highlights: parsed.data.craftsmanshipHighlights,
    display_order: parsed.data.displayOrder,
    status: parsed.data.status,
  }).eq("id", fitId);
  if (error) return { success: false, error: safeError(error, "The Fit could not be saved.") };

  const { error: optionError } = await supabase.rpc("replace_catalogue_fit_options", {
    p_fit_id: fitId,
    p_fabric_ids: parsed.data.fabricIds,
    p_colour_ids: parsed.data.colourIds,
  });
  if (optionError) return { success: false, error: safeError(optionError, "Fit options could not be saved.") };

  refreshCatalogue(existing.slug);
  return { success: true, data: undefined };
}

export async function setFitStatusAction(fitId: string, status: CatalogueStatus): Promise<CatalogueActionResult<undefined>> {
  await requireStaff();
  if (!IDENTIFIER_PATTERN.test(fitId) || !CATALOGUE_STATUSES.includes(status)) {
    return { success: false, error: "Invalid Fit lifecycle request." };
  }
  const supabase = await createServerSupabaseClient();
  const { data: fit, error: fitError } = await supabase
    .from("catalogue_fits")
    .select("slug,category_slug,catalogue_fit_fabrics(fabric_id),catalogue_fit_colours(colour_id)")
    .eq("id", fitId)
    .maybeSingle();
  if (fitError || !fit) return { success: false, error: safeError(fitError, "Fit not found.") };
  if (status === "published") {
    const fabrics = (fit.catalogue_fit_fabrics ?? []) as { fabric_id: string }[];
    const colours = (fit.catalogue_fit_colours ?? []) as { colour_id: string }[];
    const publishable = await ensurePublishable(fitId, fit.category_slug, fabrics.map((item) => item.fabric_id), colours.map((item) => item.colour_id));
    if (!publishable.success) return publishable;
  }
  const { error } = await supabase.from("catalogue_fits").update({ status }).eq("id", fitId);
  if (error) return { success: false, error: safeError(error, "Fit status could not be changed.") };
  refreshCatalogue(fit.slug);
  return { success: true, data: undefined };
}

export async function saveCategoryAction(slug: string | null, input: unknown): Promise<CatalogueActionResult<{ slug: string }>> {
  await requireStaff();
  if (slug !== null && !IDENTIFIER_PATTERN.test(slug)) return { success: false, error: "Invalid category identifier." };
  const parsed = validateCategoryMutation(input);
  if (!parsed.success) return parsed;
  const supabase = await createServerSupabaseClient();
  if (slug && !parsed.data.isActive) {
    const { count, error } = await supabase.from("catalogue_fits").select("id", { count: "exact", head: true }).eq("category_slug", slug).eq("status", "published");
    if (error) return { success: false, error: safeError(error, "Category usage could not be checked.") };
    if ((count ?? 0) > 0) return { success: false, error: "Archive or move this category’s published Fits before deactivating it." };
  }
  let targetSlug = slug;
  if (!targetSlug) {
    try {
      targetSlug = await uniqueSlug(parsed.data.name, "catalogue_categories");
    } catch (error) {
      console.error("Category slug generation failed", error);
      return { success: false, error: "A unique category URL could not be generated." };
    }
  }
  const values = {
    name: parsed.data.name,
    tagline: parsed.data.tagline,
    description: parsed.data.description,
    hero_image: parsed.data.heroImage,
    featured_quote: parsed.data.featuredQuote,
    characteristics: parsed.data.characteristics,
    display_order: parsed.data.displayOrder,
    is_active: parsed.data.isActive,
  };
  const result = slug
    ? await supabase.from("catalogue_categories").update(values).eq("slug", targetSlug)
    : await supabase.from("catalogue_categories").insert({ slug: targetSlug, ...values });
  if (result.error) return { success: false, error: safeError(result.error, "The category could not be saved.") };
  refreshCatalogue();
  revalidatePath(`/collections/${targetSlug}`);
  return { success: true, data: { slug: targetSlug } };
}

export async function saveFabricAction(id: string | null, input: unknown): Promise<CatalogueActionResult<{ id: string }>> {
  await requireStaff();
  if (id !== null && !IDENTIFIER_PATTERN.test(id)) return { success: false, error: "Invalid fabric identifier." };
  const parsed = validateFabricMutation(input);
  if (!parsed.success) return parsed;
  const supabase = await createServerSupabaseClient();
  if (id && !parsed.data.isActive) {
    const { count, error } = await supabase.from("catalogue_fit_fabrics").select("fit_id,catalogue_fits!inner(status)", { count: "exact", head: true }).eq("fabric_id", id).eq("catalogue_fits.status", "published");
    if (error) return { success: false, error: safeError(error, "Fabric usage could not be checked.") };
    if ((count ?? 0) > 0) return { success: false, error: "Remove this fabric from every published Fit before deactivating it." };
  }
  const targetId = id ?? `fab-${randomUUID()}`;
  const values = {
    name: parsed.data.name,
    description: parsed.data.description,
    weight: parsed.data.weight || null,
    finish: parsed.data.finish || null,
    is_active: parsed.data.isActive,
  };
  const result = id
    ? await supabase.from("catalogue_fabrics").update(values).eq("id", targetId)
    : await supabase.from("catalogue_fabrics").insert({ id: targetId, ...values });
  if (result.error) return { success: false, error: safeError(result.error, "The fabric could not be saved.") };
  refreshCatalogue();
  return { success: true, data: { id: targetId } };
}

export async function saveColourAction(id: string | null, input: unknown): Promise<CatalogueActionResult<{ id: string }>> {
  await requireStaff();
  if (id !== null && !IDENTIFIER_PATTERN.test(id)) return { success: false, error: "Invalid colour identifier." };
  const parsed = validateColourMutation(input);
  if (!parsed.success) return parsed;
  const supabase = await createServerSupabaseClient();
  if (id && !parsed.data.isActive) {
    const { count, error } = await supabase.from("catalogue_fit_colours").select("fit_id,catalogue_fits!inner(status)", { count: "exact", head: true }).eq("colour_id", id).eq("catalogue_fits.status", "published");
    if (error) return { success: false, error: safeError(error, "Colour usage could not be checked.") };
    if ((count ?? 0) > 0) return { success: false, error: "Remove this colour from every published Fit before deactivating it." };
  }
  const targetId = id ?? `clr-${randomUUID()}`;
  const values = { name: parsed.data.name, hex: parsed.data.hex, is_active: parsed.data.isActive };
  const result = id
    ? await supabase.from("catalogue_colours").update(values).eq("id", targetId)
    : await supabase.from("catalogue_colours").insert({ id: targetId, ...values });
  if (result.error) return { success: false, error: safeError(result.error, "The colour could not be saved.") };
  refreshCatalogue();
  return { success: true, data: { id: targetId } };
}

export async function addFitImageAction(input: unknown): Promise<CatalogueActionResult<{ id: number }>> {
  const actor = await requireStaff();
  if (!input || typeof input !== "object" || Array.isArray(input)) return { success: false, error: "Invalid image request." };
  const record = input as Record<string, unknown>;
  if (Object.keys(record).some((key) => !["fitId", "storageObjectPath", "altText"].includes(key))) {
    return { success: false, error: "The image request contains unsupported fields." };
  }
  const fitId = typeof record.fitId === "string" ? record.fitId : "";
  const storageObjectPath = typeof record.storageObjectPath === "string" ? record.storageObjectPath : "";
  const altText = typeof record.altText === "string" ? record.altText.trim() : "";
  if (!isOwnedCatalogueMediaPath(storageObjectPath, fitId) || altText.length < 3 || altText.length > 180) {
    return { success: false, error: "Invalid catalogue image path or alternative text." };
  }
  const supabase = await createServerSupabaseClient();
  const filename = storageObjectPath.slice(storageObjectPath.lastIndexOf("/") + 1);
  const { data: storedObjects, error: storedObjectError } = await supabase.storage
    .from("catalogue-media")
    .list(fitId, { limit: 2, search: filename });
  if (storedObjectError || !storedObjects?.some((object) => object.name === filename)) {
    return { success: false, error: "The uploaded catalogue image could not be verified." };
  }
  const { data: existing, error: existingError } = await supabase
    .from("catalogue_fit_images")
    .select("sort_order,is_primary")
    .eq("fit_id", fitId)
    .order("sort_order", { ascending: false });
  if (existingError) return { success: false, error: safeError(existingError, "Gallery state could not be loaded.") };
  const { data, error } = await supabase.from("catalogue_fit_images").insert({
    fit_id: fitId,
    image_path: null,
    storage_object_path: storageObjectPath,
    alt_text: altText,
    object_position: "center",
    sort_order: (existing?.[0]?.sort_order ?? -1) + 1,
    is_primary: (existing?.length ?? 0) === 0,
    uploaded_by: actor.user.id,
  }).select("id").single();
  if (error || !data) return { success: false, error: safeError(error, "The uploaded image could not be added to the gallery.") };
  refreshCatalogue();
  return { success: true, data: { id: data.id } };
}

export async function updateFitImageAction(imageId: number, altText: string, objectPosition: string): Promise<CatalogueActionResult<undefined>> {
  await requireStaff();
  const cleanAlt = altText.trim();
  const cleanPosition = objectPosition.trim();
  if (!Number.isSafeInteger(imageId) || cleanAlt.length < 3 || cleanAlt.length > 180 || !IMAGE_POSITIONS.has(cleanPosition)) {
    return { success: false, error: "Provide valid gallery image details." };
  }
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("catalogue_fit_images").update({
    alt_text: cleanAlt,
    object_position: cleanPosition || null,
  }).eq("id", imageId);
  if (error) return { success: false, error: safeError(error, "Image details could not be saved.") };
  refreshCatalogue();
  return { success: true, data: undefined };
}

export async function reorderFitImagesAction(fitId: string, imageIds: number[], primaryId: number | null): Promise<CatalogueActionResult<undefined>> {
  await requireStaff();
  if (!IDENTIFIER_PATTERN.test(fitId) || !Array.isArray(imageIds) || imageIds.some((id) => !Number.isSafeInteger(id)) || (primaryId !== null && !Number.isSafeInteger(primaryId))) {
    return { success: false, error: "Invalid gallery ordering request." };
  }
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc("reorder_catalogue_fit_images", {
    p_fit_id: fitId,
    p_image_ids: imageIds,
    p_primary_id: primaryId,
  });
  if (error) return { success: false, error: safeError(error, "Gallery order could not be saved.") };
  refreshCatalogue();
  return { success: true, data: undefined };
}

export async function removeFitImageAction(imageId: number): Promise<CatalogueActionResult<undefined>> {
  await requireStaff();
  if (!Number.isSafeInteger(imageId)) return { success: false, error: "Invalid image identifier." };
  const supabase = await createServerSupabaseClient();
  const { data: image, error: imageError } = await supabase
    .from("catalogue_fit_images")
    .select("id,fit_id,storage_object_path")
    .eq("id", imageId)
    .maybeSingle();
  if (imageError || !image) return { success: false, error: safeError(imageError, "Gallery image not found.") };
  if (image.storage_object_path) {
    const { error: storageError } = await supabase.storage.from("catalogue-media").remove([image.storage_object_path]);
    if (storageError) return { success: false, error: "The stored image could not be removed; the gallery was left unchanged." };
  }
  const { error } = await supabase.from("catalogue_fit_images").delete().eq("id", imageId);
  if (error) return { success: false, error: safeError(error, "The image record could not be removed.") };

  const { data: remaining } = await supabase
    .from("catalogue_fit_images")
    .select("id,is_primary")
    .eq("fit_id", image.fit_id)
    .order("sort_order");
  const ids = (remaining ?? []).map((item) => item.id);
  const primary = (remaining ?? []).find((item) => item.is_primary)?.id ?? ids[0] ?? null;
  const { error: orderError } = await supabase.rpc("reorder_catalogue_fit_images", {
    p_fit_id: image.fit_id,
    p_image_ids: ids,
    p_primary_id: primary,
  });
  if (orderError) console.error("Gallery normalization after delete failed", { code: orderError.code, message: orderError.message });
  refreshCatalogue();
  return { success: true, data: undefined };
}
