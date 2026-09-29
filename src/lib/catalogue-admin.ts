import type { Style } from "@/types";

export const CATALOGUE_STATUSES = ["draft", "published", "archived"] as const;
export type CatalogueStatus = (typeof CATALOGUE_STATUSES)[number];

export interface CatalogueCategoryAdmin {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  heroImage: string;
  featuredQuote: string;
  characteristics: string[];
  displayOrder: number;
  isActive: boolean;
  fitCount: number;
  updatedAt: string;
}

export interface CatalogueFabricAdmin {
  id: string;
  name: string;
  description: string;
  weight: string;
  finish: string;
  isActive: boolean;
  fitCount: number;
  updatedAt: string;
}

export interface CatalogueColourAdmin {
  id: string;
  name: string;
  hex: string;
  isActive: boolean;
  fitCount: number;
  updatedAt: string;
}

export interface CatalogueImageAdmin {
  id: number;
  fitId: string;
  src: string;
  imagePath: string | null;
  storageObjectPath: string | null;
  altText: string;
  objectPosition: string;
  sortOrder: number;
  isPrimary: boolean;
}

export interface CatalogueFitAdmin {
  id: string;
  slug: string;
  code: string;
  name: string;
  categorySlug: string;
  categoryName: string;
  description: string;
  longDescription: string;
  fabricInformation: string;
  fitInformation: string;
  occasions: string[];
  featured: boolean;
  collectionName: string;
  tags: string[];
  leadTimeWeeks: number | null;
  craftsmanshipHighlights: string[];
  displayOrder: number;
  status: CatalogueStatus;
  createdAt: string;
  updatedAt: string;
  images: CatalogueImageAdmin[];
  fabricIds: string[];
  colourIds: string[];
  style: Style;
}

export interface CatalogueManagementSnapshot {
  fits: CatalogueFitAdmin[];
  categories: CatalogueCategoryAdmin[];
  fabrics: CatalogueFabricAdmin[];
  colours: CatalogueColourAdmin[];
}

export interface FitMutationInput {
  name: string;
  code: string;
  categorySlug: string;
  description: string;
  longDescription: string;
  fabricInformation: string;
  fitInformation: string;
  occasions: string[];
  featured: boolean;
  collectionName: string;
  tags: string[];
  leadTimeWeeks: number | null;
  craftsmanshipHighlights: string[];
  displayOrder: number;
  status: CatalogueStatus;
  fabricIds: string[];
  colourIds: string[];
}

export interface CategoryMutationInput {
  name: string;
  tagline: string;
  description: string;
  heroImage: string;
  featuredQuote: string;
  characteristics: string[];
  displayOrder: number;
  isActive: boolean;
}

export interface FabricMutationInput {
  name: string;
  description: string;
  weight: string;
  finish: string;
  isActive: boolean;
}

export interface ColourMutationInput {
  name: string;
  hex: string;
  isActive: boolean;
}

export type CatalogueActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string };

const IDENTIFIER_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const CODE_PATTERN = /^[A-Z0-9][A-Z0-9 -]{1,39}$/;
const HEX_PATTERN = /^#[0-9A-F]{6}$/;
const CONTROL_CHARACTER_PATTERN = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOnlyKeys(record: Record<string, unknown>, allowed: readonly string[]) {
  const allowlist = new Set(allowed);
  return Object.keys(record).every((key) => allowlist.has(key));
}

function cleanText(value: unknown, maxLength: number, required = true) {
  if (typeof value !== "string") return null;
  const cleaned = value.trim();
  if ((required && cleaned.length === 0) || cleaned.length > maxLength) return null;
  if (CONTROL_CHARACTER_PATTERN.test(cleaned)) return null;
  return cleaned;
}

function cleanStringList(value: unknown, maxItems = 20, itemMaxLength = 100) {
  if (!Array.isArray(value) || value.length > maxItems) return null;
  const cleaned = value.map((item) => cleanText(item, itemMaxLength, false));
  if (cleaned.some((item) => item === null)) return null;
  return Array.from(new Set(cleaned.filter((item): item is string => Boolean(item))));
}

function cleanIdentifierList(value: unknown, maxItems = 100) {
  const cleaned = cleanStringList(value, maxItems, 80);
  if (!cleaned || cleaned.some((item) => !IDENTIFIER_PATTERN.test(item))) return null;
  return cleaned;
}

function cleanInteger(value: unknown, minimum = 0, maximum = 9999) {
  if (typeof value !== "number" || !Number.isInteger(value) || value < minimum || value > maximum) {
    return null;
  }
  return value;
}

export function slugifyCatalogueValue(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
}

export function validateFitMutation(input: unknown): CatalogueActionResult<FitMutationInput> {
  if (!isRecord(input) || !hasOnlyKeys(input, [
    "name", "code", "categorySlug", "description", "longDescription",
    "fabricInformation", "fitInformation", "occasions", "featured",
    "collectionName", "tags", "leadTimeWeeks", "craftsmanshipHighlights",
    "displayOrder", "status", "fabricIds", "colourIds",
  ])) return { success: false, error: "The Fit request contains unsupported fields." };

  const name = cleanText(input.name, 120);
  const code = cleanText(input.code, 40)?.toUpperCase() ?? null;
  const categorySlug = cleanText(input.categorySlug, 72);
  const description = cleanText(input.description, 500);
  const longDescription = cleanText(input.longDescription, 3000, false);
  const fabricInformation = cleanText(input.fabricInformation, 1000);
  const fitInformation = cleanText(input.fitInformation, 1000);
  const collectionName = cleanText(input.collectionName, 120);
  const occasions = cleanStringList(input.occasions);
  const tags = cleanStringList(input.tags);
  const craftsmanshipHighlights = cleanStringList(input.craftsmanshipHighlights);
  const fabricIds = cleanIdentifierList(input.fabricIds);
  const colourIds = cleanIdentifierList(input.colourIds);
  const displayOrder = cleanInteger(input.displayOrder);
  const leadTimeWeeks = input.leadTimeWeeks === null ? null : cleanInteger(input.leadTimeWeeks, 1, 24);

  if (!name || !code || !CODE_PATTERN.test(code) || !categorySlug || !IDENTIFIER_PATTERN.test(categorySlug)) {
    return { success: false, error: "Provide a valid Fit name, code, and category." };
  }
  if (!description || !fabricInformation || !fitInformation || !collectionName) {
    return { success: false, error: "Complete the Fit descriptions and collection information." };
  }
  if (longDescription === null || !occasions || !tags || !craftsmanshipHighlights || !fabricIds || !colourIds) {
    return { success: false, error: "One or more Fit lists contain invalid values." };
  }
  if (displayOrder === null || (input.leadTimeWeeks !== null && leadTimeWeeks === null)) {
    return { success: false, error: "Display order or lead time is outside the allowed range." };
  }
  if (typeof input.featured !== "boolean" || !CATALOGUE_STATUSES.includes(input.status as CatalogueStatus)) {
    return { success: false, error: "Choose a valid Fit status." };
  }

  return {
    success: true,
    data: {
      name, code, categorySlug, description, longDescription, fabricInformation,
      fitInformation, occasions, featured: input.featured, collectionName, tags,
      leadTimeWeeks, craftsmanshipHighlights, displayOrder,
      status: input.status as CatalogueStatus, fabricIds, colourIds,
    },
  };
}

export function validateCategoryMutation(input: unknown): CatalogueActionResult<CategoryMutationInput> {
  if (!isRecord(input) || !hasOnlyKeys(input, [
    "name", "tagline", "description", "heroImage", "featuredQuote",
    "characteristics", "displayOrder", "isActive",
  ])) return { success: false, error: "The category request contains unsupported fields." };

  const name = cleanText(input.name, 80);
  const tagline = cleanText(input.tagline, 160);
  const description = cleanText(input.description, 1200);
  const heroImage = cleanText(input.heroImage, 500);
  const featuredQuote = cleanText(input.featuredQuote, 500);
  const characteristics = cleanStringList(input.characteristics, 12, 160);
  const displayOrder = cleanInteger(input.displayOrder);
  if (!name || !tagline || !description || !heroImage || !featuredQuote || !characteristics || displayOrder === null || typeof input.isActive !== "boolean") {
    return { success: false, error: "Complete all category fields with valid values." };
  }
  if (!(heroImage.startsWith("/images/") || heroImage.startsWith("https://"))) {
    return { success: false, error: "Category imagery must use a local image path or HTTPS URL." };
  }
  return { success: true, data: { name, tagline, description, heroImage, featuredQuote, characteristics, displayOrder, isActive: input.isActive } };
}

export function validateFabricMutation(input: unknown): CatalogueActionResult<FabricMutationInput> {
  if (!isRecord(input) || !hasOnlyKeys(input, ["name", "description", "weight", "finish", "isActive"])) {
    return { success: false, error: "The fabric request contains unsupported fields." };
  }
  const name = cleanText(input.name, 80);
  const description = cleanText(input.description, 600);
  const weight = cleanText(input.weight, 80, false);
  const finish = cleanText(input.finish, 80, false);
  if (!name || !description || weight === null || finish === null || typeof input.isActive !== "boolean") {
    return { success: false, error: "Provide valid fabric details." };
  }
  return { success: true, data: { name, description, weight, finish, isActive: input.isActive } };
}

export function validateColourMutation(input: unknown): CatalogueActionResult<ColourMutationInput> {
  if (!isRecord(input) || !hasOnlyKeys(input, ["name", "hex", "isActive"])) {
    return { success: false, error: "The colour request contains unsupported fields." };
  }
  const name = cleanText(input.name, 80);
  const hex = cleanText(input.hex, 7)?.toUpperCase() ?? null;
  if (!name || !hex || !HEX_PATTERN.test(hex) || typeof input.isActive !== "boolean") {
    return { success: false, error: "Provide a colour name and six-digit HEX reference." };
  }
  return { success: true, data: { name, hex, isActive: input.isActive } };
}

export function isOwnedCatalogueMediaPath(path: string, fitId: string) {
  if (!IDENTIFIER_PATTERN.test(fitId)) return false;
  const escapedFitId = fitId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^${escapedFitId}/[0-9a-f-]{36}\\.(?:jpg|jpeg|png|webp)$`, "i").test(path);
}
