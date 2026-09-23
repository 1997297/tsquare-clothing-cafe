import { ProductCategory } from "@/types";
import {
  FabricOption,
  ColourOption,
  FitOption,
  OccasionOption,
  AppointmentTypeOption,
} from "@/types/bespoke";

// ─────────────────────────────────────────────
// FABRICS — filtered by garment category
// ─────────────────────────────────────────────

export const FABRICS: FabricOption[] = [
  {
    id: "premium-wool-blend",
    name: "Premium Wool Blend",
    description: "A refined mid-weight wool blend offering structure, breathability, and a clean drape suited to formal and ceremonial wear.",
    weight: "Mid-weight",
    finish: "Matte",
    categories: ["agbada", "senator", "bespoke", "formal"],
  },
  {
    id: "textured-cotton",
    name: "Textured Cotton",
    description: "Breathable premium cotton with a subtle woven texture. Ideal for everyday luxury and daywear in the West African climate.",
    weight: "Lightweight",
    finish: "Natural",
    categories: ["senator", "kaftan", "traditional"],
  },
  {
    id: "luxury-cashmere-blend",
    name: "Luxury Cashmere Blend",
    description: "A distinguished cashmere-wool blend with exceptional softness and a natural sheen. Reserved for the most elevated commissions.",
    weight: "Lightweight-Mid",
    finish: "Subtle sheen",
    categories: ["agbada", "bespoke", "formal"],
  },
  {
    id: "jacquard",
    name: "Jacquard",
    description: "Intricately patterned woven fabric with raised motifs woven directly into the structure. Adds depth and visual interest without applied embellishment.",
    weight: "Mid-weight",
    finish: "Textured",
    categories: ["agbada", "senator", "kaftan", "traditional"],
  },
  {
    id: "premium-guinea-brocade",
    name: "Premium Guinea Brocade",
    description: "The quintessential West African ceremonial fabric. Rich, lustrous, and unmistakably authoritative. Hand-selected for vibrance and structural integrity.",
    weight: "Heavyweight",
    finish: "Lustrous",
    categories: ["agbada", "kaftan", "traditional"],
  },
  {
    id: "fine-senator-fabric",
    name: "Fine Senator Fabric",
    description: "A crisp, refined cotton-poly blend specifically engineered for the clean lines and sharp silhouettes of Nigerian Senator styles.",
    weight: "Lightweight",
    finish: "Crisp",
    categories: ["senator"],
  },
  {
    id: "aso-oke-heritage",
    name: "Aso-Oke Heritage Weave",
    description: "Authentic hand-loomed Yoruba Aso-Oke strip cloth sourced from veteran artisan weavers. Each piece carries the irreplaceable character of the hand.",
    weight: "Mid-heavyweight",
    finish: "Hand-woven texture",
    categories: ["agbada", "traditional"],
  },
  {
    id: "irish-linen",
    name: "Irish Linen",
    description: "Cool, structured, and increasingly refined with each wear. Perfect for relaxed luxury Kaftans and casual formal occasions.",
    weight: "Lightweight",
    finish: "Natural",
    categories: ["kaftan", "senator"],
  },
  {
    id: "silk-cotton-shantung",
    name: "Silk-Cotton Shantung",
    description: "Luminous silk-cotton blend with organic slubs and a soft brushed hand feel. Catches evening light with rare elegance.",
    weight: "Lightweight",
    finish: "Luminous",
    categories: ["kaftan", "formal"],
  },
  {
    id: "barathea-wool",
    name: "British Barathea Wool",
    description: "A dense, fine twill-weave wool traditional to tuxedos and evening dress. Produces the characteristic matte finish of black-tie tailoring.",
    weight: "Heavyweight",
    finish: "Matte",
    categories: ["bespoke", "formal"],
  },
];

export function getFabricsForCategory(category: ProductCategory): FabricOption[] {
  return FABRICS.filter((f) => f.categories.includes(category));
}

// ─────────────────────────────────────────────
// COLOURS
// ─────────────────────────────────────────────

export const COLOURS: ColourOption[] = [
  { id: "midnight-black", name: "Midnight Black", hex: "#11110F", group: "Neutrals" },
  { id: "warm-ivory", name: "Warm Ivory", hex: "#F3EFE7", group: "Neutrals" },
  { id: "charcoal", name: "Charcoal", hex: "#22252A", group: "Neutrals" },
  { id: "stone", name: "Stone", hex: "#A79C8C", group: "Neutrals" },
  { id: "champagne", name: "Champagne", hex: "#B79A68", group: "Warm Tones" },
  { id: "espresso", name: "Espresso", hex: "#30251F", group: "Warm Tones" },
  { id: "deep-camel", name: "Deep Camel", hex: "#9E7B56", group: "Warm Tones" },
  { id: "terracotta", name: "Terracotta", hex: "#8A4732", group: "Warm Tones" },
  { id: "deep-navy", name: "Deep Navy", hex: "#131C2E", group: "Cool Tones" },
  { id: "midnight-navy", name: "Midnight Navy", hex: "#182238", group: "Cool Tones" },
  { id: "forest", name: "Forest", hex: "#16382C", group: "Cool Tones" },
  { id: "smoked-sage", name: "Smoked Sage", hex: "#7C887A", group: "Cool Tones" },
  { id: "wine", name: "Wine", hex: "#3B1820", group: "Deep Tones" },
  { id: "indigo", name: "Indigo", hex: "#1D2D44", group: "Deep Tones" },
  { id: "bottle-green", name: "Bottle Green", hex: "#142820", group: "Deep Tones" },
  { id: "royal-emerald", name: "Royal Emerald", hex: "#16382C", group: "Deep Tones" },
];

// ─────────────────────────────────────────────
// FIT OPTIONS
// ─────────────────────────────────────────────

export const FIT_OPTIONS: FitOption[] = [
  {
    id: "tailored",
    label: "Tailored",
    description: "Closer, structured silhouette. Precise chest suppression and clean shoulder line. The most architectural option.",
  },
  {
    id: "regular",
    label: "Regular",
    description: "Balanced comfort and structure. Room to breathe without sacrificing shape. The most versatile choice.",
  },
  {
    id: "relaxed",
    label: "Relaxed",
    description: "More room and fluidity throughout. Easy movement, generous drape. Ideal for ceremonial and traditional pieces.",
  },
];

// ─────────────────────────────────────────────
// OCCASIONS
// ─────────────────────────────────────────────

export const OCCASIONS: OccasionOption[] = [
  { id: "wedding", label: "Wedding" },
  { id: "traditional-wedding", label: "Traditional Wedding" },
  { id: "groom", label: "Groom" },
  { id: "wedding-guest", label: "Wedding Guest" },
  { id: "birthday", label: "Birthday" },
  { id: "corporate", label: "Corporate" },
  { id: "evening", label: "Evening Event" },
  { id: "everyday-luxury", label: "Everyday Luxury" },
  { id: "cultural-festival", label: "Cultural Festival" },
  { id: "black-tie", label: "Black Tie" },
  { id: "other", label: "Other" },
];

// ─────────────────────────────────────────────
// APPOINTMENT TYPES
// ─────────────────────────────────────────────

export const APPOINTMENT_TYPES: AppointmentTypeOption[] = [
  {
    id: "consultation",
    label: "Style Consultation",
    description: "Meet with our atelier team to discuss your vision, fabrics, and design direction.",
  },
  {
    id: "measurement",
    label: "Measurement Session",
    description: "A dedicated session where our tailors take all required body measurements.",
  },
  {
    id: "first-fitting",
    label: "First Fitting",
    description: "Try the initial canvas in raw cloth to assess proportion and silhouette.",
  },
  {
    id: "style-consultation",
    label: "Combined Style and Measurement",
    description: "A comprehensive first visit covering both style direction and measurement capture.",
  },
  {
    id: "none",
    label: "No Appointment Yet",
    description: "Submit the request first. The TSquare team will reach out to arrange a convenient time.",
  },
];

// ─────────────────────────────────────────────
// GARMENT CATEGORIES (for "Start From An Idea")
// ─────────────────────────────────────────────

export interface GarmentCategoryOption {
  id: ProductCategory;
  label: string;
  description: string;
  image: string;
}

export const GARMENT_CATEGORIES: GarmentCategoryOption[] = [
  {
    id: "agbada",
    label: "Agbada",
    description: "The commanding Yoruba ceremonial ensemble. Grand draped outer robe, inner buba, and tailored sokoto.",
    image: "/images/styles/agbada-imperial.jpg",
  },
  {
    id: "senator",
    label: "Senator",
    description: "The refined modern Nigerian two-piece. Clean lines, structured collar, and sharp tailored trousers.",
    image: "/images/styles/senator-executive.jpg",
  },
  {
    id: "kaftan",
    label: "Kaftan",
    description: "Flowing elegance for everyday luxury and intimate occasions. Relaxed silhouette with elevated detail.",
    image: "/images/styles/kaftan-embroidered.jpg",
  },
  {
    id: "traditional",
    label: "Traditional",
    description: "Rooted in heritage craft, with Aso-Oke, damask, and hand-guided embroidery in authentic cultural garments.",
    image: "/images/styles/traditional-chieftain.jpg",
  },
  {
    id: "formal",
    label: "Suit and Formal",
    description: "Contemporary tailored suiting. Single or double breasted, evening black tie, dinner jacket.",
    image: "/images/styles/formal-evening.jpg",
  },
  {
    id: "bespoke",
    label: "Fully Bespoke",
    description: "No existing template. Our team will work directly with your ideas from the first consultation.",
    image: "/images/styles/bespoke-double-breasted.jpg",
  },
];

// ─────────────────────────────────────────────
// DESIGN PREFERENCE OPTIONS — per category
// ─────────────────────────────────────────────

export const EMBROIDERY_STYLES = [
  "None",
  "Minimal (border only)",
  "Traditional geometric",
  "Dense chest coverage",
  "Custom motif (describe below)",
];

export const COLLAR_STYLES_SENATOR = [
  "Mandarin (round, standing)",
  "Mandarin (squared)",
  "V-neck open",
  "Standard shirt collar",
];

export const COLLAR_STYLES_KAFTAN = [
  "High stand collar",
  "Low stand collar",
  "V-neck open",
  "Round crew",
];

export const BUTTON_PREFERENCES = [
  "Horn buttons (natural)",
  "Fabric-covered buttons",
  "Metal buttons (antique gold)",
  "Metal buttons (silver/chrome)",
  "Concealed fasteners only",
];

export const POCKET_STYLES = [
  "Welt pockets (concealed)",
  "Patch pockets",
  "Flap pockets",
  "No exterior pockets",
];

export const SLEEVE_PREFERENCES = [
  "Full length",
  "Three-quarter length",
  "Short sleeve",
];

export const TROUSER_BREAK_OPTIONS = [
  { id: "no-break", label: "No Break (modern, cropped)" },
  { id: "slight-break", label: "Slight Break (contemporary)" },
  { id: "full-break", label: "Full Break (classic)" },
];

export const AGBADA_LENGTH_OPTIONS = [
  { id: "full-floor", label: "Full Floor Length (regal)" },
  { id: "ankle", label: "Ankle Length (versatile)" },
  { id: "mid-calf", label: "Mid Calf (modern)" },
];
