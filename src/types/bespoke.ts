import { ProductCategory } from "@/types";

// ─────────────────────────────────────────────
// Primitive option types
// ─────────────────────────────────────────────

export interface FabricOption {
  id: string;
  name: string;
  description: string;
  weight?: string;
  finish?: string;
  categories: ProductCategory[]; // which garment types this fabric suits
}

export interface ColourOption {
  id: string;
  name: string;
  hex: string;
  group?: string; // e.g. "Neutrals", "Earthy Tones"
}

export interface FitOption {
  id: "tailored" | "regular" | "relaxed";
  label: string;
  description: string;
}

export interface OccasionOption {
  id: string;
  label: string;
  icon?: string;
}

export interface AppointmentTypeOption {
  id: string;
  label: string;
  description: string;
}

// ─────────────────────────────────────────────
// Measurement set — all fields optional
// so partial entry is always valid state
// ─────────────────────────────────────────────

export interface MeasurementSet {
  // Upper Body
  neck?: number;
  shoulder?: number;
  chest?: number;
  sleeveLength?: number;
  bicep?: number;
  wrist?: number;
  // Torso
  stomach?: number;
  waist?: number;
  topLength?: number;
  // Lower Body
  trouserWaist?: number;
  hip?: number;
  thigh?: number;
  knee?: number;
  trouserLength?: number;
  ankle?: number;
}

export type MeasurementUnit = "cm" | "inches";

export type MeasurementMethod = "saved" | "manual" | "schedule";

// ─────────────────────────────────────────────
// Reference image (local preview — no server upload yet)
// ─────────────────────────────────────────────

export interface ReferenceImage {
  id: string;          // uuid for removal
  filename: string;
  localUrl: string;    // URL.createObjectURL result
  sizeBytes: number;
}

// ─────────────────────────────────────────────
// Design preferences (dynamic per category)
// ─────────────────────────────────────────────

export interface DesignPreferences {
  // Agbada
  agbadaLength?: "full-floor" | "ankle" | "mid-calf";
  capIncluded?: boolean;
  innerBubaPreference?: string;
  // Senator / Formal
  collarStyle?: string;
  buttonPreference?: string;
  pocketStyle?: string;
  sleevePreference?: string;
  trouserBreak?: "no-break" | "slight-break" | "full-break";
  // Kaftan
  collarHeight?: string;
  // Embroidery (shared)
  embroideryStyle?: string;
  embroideryColour?: string;
  // General
  specialInstructions?: string;
  referenceImages?: ReferenceImage[];
}

// ─────────────────────────────────────────────
// Appointment request
// ─────────────────────────────────────────────

export interface AppointmentRequestData {
  type?: string; // "consultation" | "measurement" | "first-fitting" | "style-consultation" | "none"
  preferredDate?: string;
  preferredTime?: string; // "morning" | "afternoon" | "evening"
  notes?: string;
}

// ─────────────────────────────────────────────
// Customer contact (collected when not authenticated)
// ─────────────────────────────────────────────

export interface ContactInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  preferredContact: "whatsapp" | "phone" | "email" | "";
}

// ─────────────────────────────────────────────
// Working configuration (lives in the store)
// ─────────────────────────────────────────────

export interface BespokeConfiguration {
  // Journey origin
  styleSlug: string;            // "idea" for start-from-scratch path
  styleId?: string;
  styleCode?: string;
  styleName?: string;
  styleImage?: string;
  isIdeaPath: boolean;
  garmentCategory?: ProductCategory;

  // Step 2
  fabric?: FabricOption;

  // Step 3
  colour?: ColourOption;

  // Step 4
  preferences: DesignPreferences;

  // Step 5
  fitPreference?: "tailored" | "regular" | "relaxed";

  // Step 6
  measurementMethod?: MeasurementMethod;
  measurementUnit: MeasurementUnit;
  measurements: MeasurementSet;
  measurementConfidence: boolean; // true = customer is uncertain

  // Step 7
  occasion?: string;
  eventName?: string;
  eventDate?: string;

  // Step 8
  requiredDate?: string;

  // Step 9
  appointment: AppointmentRequestData;

  // Step 10
  contact: ContactInfo;

  // Navigation
  currentStep: number;
}

// ─────────────────────────────────────────────
// Bespoke request status enum
// ─────────────────────────────────────────────

export type BespokeStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "needs_clarification"
  | "pricing_ready"
  | "confirmed"
  | "converted_to_order"
  | "declined";

// ─────────────────────────────────────────────
// Final submission payload
// ─────────────────────────────────────────────

export interface BespokeRequestPayload {
  requestId: string;
  status: BespokeStatus;
  createdAt: string;

  // Garment
  styleId?: string;
  styleCode?: string;
  styleName?: string;
  garmentCategory?: ProductCategory;
  isIdeaPath: boolean;

  // Configuration
  fabric?: FabricOption;
  colour?: ColourOption;
  preferences: DesignPreferences;
  fitPreference?: string;

  // Measurements
  measurementMethod?: MeasurementMethod;
  measurementUnit?: MeasurementUnit;
  measurements?: MeasurementSet;
  measurementConfidence?: boolean;

  // Occasion
  occasion?: string;
  eventName?: string;
  eventDate?: string;
  requiredDate?: string;

  // Appointment
  appointmentRequest?: AppointmentRequestData;

  // Customer
  contact: ContactInfo;
}
