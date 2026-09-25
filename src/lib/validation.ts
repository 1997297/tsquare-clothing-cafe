import type {
  BespokeRequestPayload,
  ColourOption,
  DesignPreferences,
  FabricOption,
  ReferenceImage,
} from "@/types/bespoke";
import type { ProductCategory } from "@/types";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+?[0-9][0-9\s()-]{7,19}$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const APPROVED_REFERENCE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const MAX_REFERENCE_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_REFERENCE_IMAGE_COUNT = 6;

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

export function isSafeInternalPath(value: unknown): value is string {
  if (typeof value !== "string" || !value.startsWith("/")) return false;
  if (value.startsWith("//") || value.includes("\\") || /[\u0000-\u001F]/.test(value)) {
    return false;
  }
  try {
    const parsed = new URL(value, "https://tcc.invalid");
    return parsed.origin === "https://tcc.invalid" && parsed.pathname.startsWith("/");
  } catch {
    return false;
  }
}

export function sanitizeInternalPath(value: unknown, fallback = "/account"): string {
  return isSafeInternalPath(value) ? value : fallback;
}

function cleanText(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function isValidDate(value: string): boolean {
  if (!ISO_DATE_PATTERN.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

export interface ContactEnquiryInput {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

export function validateContactEnquiry(input: unknown): ValidationResult<ContactEnquiryInput> {
  const record = (input ?? {}) as Record<string, unknown>;
  const data: ContactEnquiryInput = {
    name: cleanText(record.name, 120),
    email: cleanText(record.email, 254).toLowerCase(),
    phone: cleanText(record.phone, 30) || undefined,
    subject: cleanText(record.subject, 160),
    message: cleanText(record.message, 4000),
  };
  if (data.name.length < 2) return { success: false, error: "Please enter your full name." };
  if (!EMAIL_PATTERN.test(data.email)) return { success: false, error: "Please enter a valid email address." };
  if (data.phone && !PHONE_PATTERN.test(data.phone)) return { success: false, error: "Please enter a valid phone number." };
  if (data.subject.length < 3) return { success: false, error: "Please enter an enquiry subject." };
  if (data.message.length < 10) return { success: false, error: "Please provide a little more detail." };
  return { success: true, data };
}

export interface PublicFittingInput {
  customerName: string;
  email: string;
  phone: string;
  appointmentType: string;
  date: string;
  time: string;
  isExistingCustomer: boolean;
  styleReference?: string;
  notes?: string;
}

const APPOINTMENT_TYPES = new Set([
  "consultation",
  "measurement",
  "first-fitting",
  "final-fitting",
  "pickup",
]);

export function validatePublicFitting(input: unknown): ValidationResult<PublicFittingInput> {
  const record = (input ?? {}) as Record<string, unknown>;
  const data: PublicFittingInput = {
    customerName: cleanText(record.customerName, 120),
    email: cleanText(record.email, 254).toLowerCase(),
    phone: cleanText(record.phone, 30),
    appointmentType: cleanText(record.appointmentType, 40),
    date: cleanText(record.date, 10),
    time: cleanText(record.time, 40),
    isExistingCustomer: record.isExistingCustomer === true,
    styleReference: cleanText(record.styleReference, 120) || undefined,
    notes: cleanText(record.notes, 2000) || undefined,
  };
  if (data.customerName.length < 2) return { success: false, error: "Please enter your full name." };
  if (!EMAIL_PATTERN.test(data.email)) return { success: false, error: "Please enter a valid email address." };
  if (!PHONE_PATTERN.test(data.phone)) return { success: false, error: "Please enter a valid phone number." };
  if (!APPOINTMENT_TYPES.has(data.appointmentType)) return { success: false, error: "Please select a valid appointment type." };
  if (!isValidDate(data.date)) return { success: false, error: "Please select a valid preferred date." };
  if (!data.time) return { success: false, error: "Please select a preferred time." };
  return { success: true, data };
}

export interface MeasurementVersionInput {
  measurements: Record<string, number>;
  unit: "cm" | "inches";
  fitPreference?: "tailored" | "regular" | "relaxed";
  notes?: string;
}

export function validateMeasurementVersion(input: unknown): ValidationResult<MeasurementVersionInput> {
  const record = (input ?? {}) as Record<string, unknown>;
  const values = (record.measurements ?? {}) as Record<string, unknown>;
  const measurements: Record<string, number> = {};
  for (const [key, value] of Object.entries(values)) {
    if (typeof value !== "number" || !Number.isFinite(value) || value <= 0 || value > 300) {
      return { success: false, error: `Invalid measurement value for ${key}.` };
    }
    measurements[key] = value;
  }
  if (Object.keys(measurements).length === 0) return { success: false, error: "Enter at least one measurement." };
  if (record.unit !== "cm" && record.unit !== "inches") return { success: false, error: "Select a valid measurement unit." };
  const fit = record.fitPreference;
  if (fit !== undefined && fit !== "tailored" && fit !== "regular" && fit !== "relaxed") {
    return { success: false, error: "Select a valid fit preference." };
  }
  return {
    success: true,
    data: {
      measurements,
      unit: record.unit,
      fitPreference: fit,
      notes: cleanText(record.notes, 500) || undefined,
    },
  };
}

export function validateAppointmentChange(input: unknown): ValidationResult<{
  appointmentId: string;
  changeType: "reschedule" | "cancellation";
  proposedDate?: string;
  proposedTime?: string;
  reason?: string;
}> {
  const record = (input ?? {}) as Record<string, unknown>;
  if (!isUuid(record.appointmentId)) return { success: false, error: "Appointment not found." };
  if (record.changeType !== "reschedule" && record.changeType !== "cancellation") {
    return { success: false, error: "Invalid appointment change type." };
  }
  const proposedDate = cleanText(record.proposedDate, 10) || undefined;
  const proposedTime = cleanText(record.proposedTime, 40) || undefined;
  if (record.changeType === "reschedule" && (!proposedDate || !isValidDate(proposedDate) || !proposedTime)) {
    return { success: false, error: "Select a valid proposed date and time." };
  }
  return {
    success: true,
    data: {
      appointmentId: record.appointmentId,
      changeType: record.changeType,
      proposedDate,
      proposedTime,
      reason: cleanText(record.reason, 1000) || undefined,
    },
  };
}

export function validateConciergeRequest(input: unknown): ValidationResult<Record<string, string | undefined>> {
  const record = (input ?? {}) as Record<string, unknown>;
  const categories = new Set([
    "discuss_order", "discuss_request", "fitting_enquiry",
    "payment_question", "style_consultation", "general_enquiry",
  ]);
  const category = cleanText(record.category, 40);
  const subject = cleanText(record.subject, 160);
  const message = cleanText(record.message, 4000);
  if (!categories.has(category)) return { success: false, error: "Select a valid concierge category." };
  if (subject.length < 3) return { success: false, error: "Please enter a subject." };
  if (message.length < 3) return { success: false, error: "Please enter a message." };
  return {
    success: true,
    data: {
      category,
      subject,
      message,
      related_request_id: cleanText(record.relatedRequestId, 120) || undefined,
      related_order_id: cleanText(record.relatedOrderId, 120) || undefined,
      related_appointment_id: cleanText(record.relatedAppointmentId, 120) || undefined,
    },
  };
}

export function validateReferenceFile(file: { type: string; size: number }): ValidationResult<true> {
  if (!APPROVED_REFERENCE_MIME_TYPES.includes(file.type as typeof APPROVED_REFERENCE_MIME_TYPES[number])) {
    return { success: false, error: "Only JPEG, PNG and WebP images are supported." };
  }
  if (!Number.isFinite(file.size) || file.size <= 0 || file.size > MAX_REFERENCE_IMAGE_BYTES) {
    return { success: false, error: "Each image must be smaller than 10 MB." };
  }
  return { success: true, data: true };
}

export function validatePaymentInitialization(input: unknown): ValidationResult<{ orderId: string; amountMinor: number }> {
  const record = (input ?? {}) as Record<string, unknown>;
  if (!isUuid(record.orderId)) return { success: false, error: "Order not found." };
  if (!Number.isSafeInteger(record.amountMinor) || (record.amountMinor as number) <= 0) {
    return { success: false, error: "Enter a valid payment amount." };
  }
  return { success: true, data: { orderId: record.orderId, amountMinor: record.amountMinor as number } };
}

export function validateBespokeRequestPayload(input: unknown): ValidationResult<BespokeRequestPayload> {
  const record = (input ?? {}) as Record<string, unknown>;
  const contact = (record.contact ?? {}) as Record<string, unknown>;
  const firstName = cleanText(contact.firstName, 80);
  const lastName = cleanText(contact.lastName, 80);
  const email = cleanText(contact.email, 254).toLowerCase();
  const phone = cleanText(contact.phone, 30);
  const preferredContact = cleanText(contact.preferredContact, 20);
  const rawPreferences = (record.preferences ?? {}) as Record<string, unknown>;
  const rawReferences = Array.isArray(rawPreferences.referenceImages)
    ? rawPreferences.referenceImages
    : [];
  if (!firstName || !lastName) return { success: false, error: "Please provide your full name." };
  if (!EMAIL_PATTERN.test(email)) return { success: false, error: "Please provide a valid email address." };
  if (!PHONE_PATTERN.test(phone)) return { success: false, error: "Please provide a valid phone number." };
  if (!["whatsapp", "phone", "email"].includes(preferredContact)) {
    return { success: false, error: "Please select a valid contact method." };
  }

  const categories = new Set<ProductCategory>([
    "agbada", "senator", "kaftan", "traditional", "bespoke", "formal",
  ]);
  const garmentCategory = cleanText(record.garmentCategory, 40) as ProductCategory;
  if (!categories.has(garmentCategory)) {
    return { success: false, error: "Please select a valid garment category." };
  }
  const isIdeaPath = record.isIdeaPath === true;
  const styleId = cleanText(record.styleId, 120) || undefined;
  if (!isIdeaPath && !styleId) return { success: false, error: "Please select a valid style." };

  const rawFabric = (record.fabric ?? {}) as Record<string, unknown>;
  const fabricCategories = Array.isArray(rawFabric.categories)
    ? rawFabric.categories.filter((value): value is ProductCategory =>
        typeof value === "string" && categories.has(value as ProductCategory)
      )
    : [];
  const fabric: FabricOption = {
    id: cleanText(rawFabric.id, 120),
    name: cleanText(rawFabric.name, 160),
    description: cleanText(rawFabric.description, 1000),
    weight: cleanText(rawFabric.weight, 80) || undefined,
    finish: cleanText(rawFabric.finish, 80) || undefined,
    categories: fabricCategories,
  };
  if (!fabric.id || !fabric.name || !fabric.description || fabric.categories.length === 0) {
    return { success: false, error: "Please select a valid fabric." };
  }

  const rawColour = (record.colour ?? {}) as Record<string, unknown>;
  const colour: ColourOption = {
    id: cleanText(rawColour.id, 120),
    name: cleanText(rawColour.name, 120),
    hex: cleanText(rawColour.hex, 20),
    group: cleanText(rawColour.group, 80) || undefined,
  };
  if (!colour.id || !colour.name || !/^#[0-9a-f]{6}$/i.test(colour.hex)) {
    return { success: false, error: "Please select a valid colour." };
  }

  const measurementMethod = record.measurementMethod;
  if (measurementMethod !== "saved" && measurementMethod !== "manual" && measurementMethod !== "schedule") {
    return { success: false, error: "Please select a measurement method." };
  }
  let measurements = (record.measurements ?? {}) as Record<string, number>;
  let measurementUnit = record.measurementUnit === "inches" ? "inches" as const : "cm" as const;
  if (measurementMethod === "manual") {
    const measured = validateMeasurementVersion({
      measurements: record.measurements,
      unit: record.measurementUnit,
      fitPreference: record.fitPreference,
    });
    if (!measured.success) return { success: false, error: measured.error };
    measurements = measured.data.measurements;
    measurementUnit = measured.data.unit;
  }

  const fitPreference = cleanText(record.fitPreference, 20);
  if (fitPreference && !["tailored", "regular", "relaxed"].includes(fitPreference)) {
    return { success: false, error: "Please select a valid fit preference." };
  }
  if (!fitPreference) return { success: false, error: "Please select a fit preference." };

  if (rawReferences.length > MAX_REFERENCE_IMAGE_COUNT) {
    return { success: false, error: "A maximum of six reference images is allowed." };
  }
  const referenceImages: ReferenceImage[] = [];
  for (const rawReference of rawReferences) {
    const reference = (rawReference ?? {}) as Record<string, unknown>;
    const mimeType = cleanText(reference.mimeType, 100);
    const sizeBytes = typeof reference.sizeBytes === "number" ? reference.sizeBytes : Number.NaN;
    const fileValidation = validateReferenceFile({ type: mimeType, size: sizeBytes });
    if (!fileValidation.success) return { success: false, error: fileValidation.error };
    const storagePath = cleanText(reference.storagePath, 500);
    if (!storagePath || storagePath.includes("..") || storagePath.startsWith("/") || storagePath.includes("\\")) {
      return { success: false, error: "Every submitted reference image must be securely uploaded first." };
    }
    const filename = cleanText(reference.filename, 255);
    if (!filename) return { success: false, error: "A reference image filename is missing." };
    const referenceId = cleanText(reference.id, 120);
    if (!isUuid(referenceId)) return { success: false, error: "A reference image identifier is invalid." };
    referenceImages.push({
      id: referenceId,
      filename,
      sizeBytes,
      mimeType,
      storagePath,
      uploadStatus: "stored",
    });
  }

  const requiredDate = cleanText(record.requiredDate, 10);
  if (!requiredDate || !isValidDate(requiredDate)) {
    return { success: false, error: "Please provide a valid required date." };
  }
  if (requiredDate < new Date().toISOString().slice(0, 10)) {
    return { success: false, error: "The required date cannot be in the past." };
  }
  const eventDate = cleanText(record.eventDate, 10) || undefined;
  if (eventDate && !isValidDate(eventDate)) return { success: false, error: "Please provide a valid event date." };

  const rawAppointment = record.appointmentRequest as Record<string, unknown> | undefined;
  let appointmentRequest: BespokeRequestPayload["appointmentRequest"];
  if (rawAppointment) {
    const type = cleanText(rawAppointment.type, 40);
    const allowedTypes = new Set(["consultation", "measurement", "first-fitting", "style-consultation"]);
    const preferredDate = cleanText(rawAppointment.preferredDate, 10);
    const preferredTime = cleanText(rawAppointment.preferredTime, 20);
    if (!allowedTypes.has(type)) return { success: false, error: "Please select a valid appointment type." };
    if (!isValidDate(preferredDate) || preferredDate < new Date().toISOString().slice(0, 10)) {
      return { success: false, error: "Please select a valid future appointment date." };
    }
    if (!["morning", "afternoon", "evening"].includes(preferredTime)) {
      return { success: false, error: "Please select a valid appointment time." };
    }
    appointmentRequest = {
      type,
      preferredDate,
      preferredTime,
      notes: cleanText(rawAppointment.notes, 1000) || undefined,
    };
  }

  const cleanPreference = (key: keyof DesignPreferences, maxLength = 160) =>
    cleanText(rawPreferences[key], maxLength) || undefined;
  const preferences: DesignPreferences = {
    agbadaLength: cleanPreference("agbadaLength") as DesignPreferences["agbadaLength"],
    capIncluded: typeof rawPreferences.capIncluded === "boolean" ? rawPreferences.capIncluded : undefined,
    innerBubaPreference: cleanPreference("innerBubaPreference"),
    collarStyle: cleanPreference("collarStyle"),
    buttonPreference: cleanPreference("buttonPreference"),
    pocketStyle: cleanPreference("pocketStyle"),
    sleevePreference: cleanPreference("sleevePreference"),
    trouserBreak: cleanPreference("trouserBreak") as DesignPreferences["trouserBreak"],
    collarHeight: cleanPreference("collarHeight"),
    embroideryStyle: cleanPreference("embroideryStyle"),
    embroideryColour: cleanPreference("embroideryColour"),
    specialInstructions: cleanPreference("specialInstructions", 2000),
    referenceImages,
  };

  return {
    success: true,
    data: {
      requestId: cleanText(record.requestId, 120),
      status: "submitted",
      createdAt: new Date().toISOString(),
      styleId,
      styleCode: cleanText(record.styleCode, 120) || undefined,
      styleName: cleanText(record.styleName, 160) || undefined,
      styleImage: cleanText(record.styleImage, 500) || undefined,
      garmentCategory,
      isIdeaPath,
      fabric,
      colour,
      preferences,
      fitPreference,
      measurementMethod,
      measurementUnit,
      measurements,
      measurementConfidence: record.measurementConfidence === true,
      occasion: cleanText(record.occasion, 120) || undefined,
      eventName: cleanText(record.eventName, 160) || undefined,
      eventDate,
      requiredDate,
      appointmentRequest,
      contact: {
        firstName,
        lastName,
        email,
        phone,
        preferredContact: preferredContact as BespokeRequestPayload["contact"]["preferredContact"],
      },
    },
  };
}
