"use client";

import { useEffect, useState, useCallback } from "react";
import {
  BespokeConfiguration,
  BespokeRequestPayload,
  BespokeStatus,
  MeasurementSet,
  MeasurementUnit,
  DesignPreferences,
  AppointmentRequestData,
  ContactInfo,
  FabricOption,
  ColourOption,
} from "@/types/bespoke";
import { ProductCategory } from "@/types";

// ─────────────────────────────────────────────
// Storage key and event bus
// ─────────────────────────────────────────────

const STORAGE_KEY = "tcc_bespoke_config_v1";
const SUBMISSIONS_KEY = "tcc_bespoke_submissions_v1";
const EVENT_NAME = "tcc:bespoke_config_changed";

// ─────────────────────────────────────────────
// Default empty config
// ─────────────────────────────────────────────

export function getEmptyConfig(
  styleSlug = "",
  isIdeaPath = false
): BespokeConfiguration {
  return {
    draftId: undefined,
    styleSlug,
    isIdeaPath,
    preferences: {},
    measurementUnit: "cm",
    measurements: {},
    measurementConfidence: false,
    appointment: {},
    contact: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      preferredContact: "",
    },
    currentStep: 0,
  };
}

// ─────────────────────────────────────────────
// Raw localStorage helpers
// ─────────────────────────────────────────────

export function getStoredConfig(): BespokeConfiguration | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as BespokeConfiguration) : null;
  } catch {
    return null;
  }
}

function setStoredConfig(config: BespokeConfiguration): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: config }));
  } catch (err) {
    console.error("Error saving bespoke config:", err);
  }
}

function clearStoredConfig(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: null }));
}

// ─────────────────────────────────────────────
// Request ID generator
// ─────────────────────────────────────────────

function generateRequestId(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `TCC-${timestamp}-${random}`;
}

// ─────────────────────────────────────────────
// Submission store (demo — localStorage only)
// ─────────────────────────────────────────────

export function saveSubmission(payload: BespokeRequestPayload): void {
  if (typeof window === "undefined") return;
  try {
    const existing: BespokeRequestPayload[] = JSON.parse(
      localStorage.getItem(SUBMISSIONS_KEY) || "[]"
    );
    existing.unshift(payload);
    localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(existing));
    // Also keep the last submission for the confirmation page
    localStorage.setItem("tcc_last_submission", JSON.stringify(payload));
  } catch (err) {
    console.error("Error saving submission:", err);
  }
}

export function completeSubmission(payload: BespokeRequestPayload): void {
  if (typeof window === "undefined") return;
  if (payload.persistence === "local") saveSubmission(payload);
  else localStorage.setItem("tcc_last_submission", JSON.stringify(payload));
  clearStoredConfig();
}

export function getLastSubmission(): BespokeRequestPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("tcc_last_submission");
    return raw ? (JSON.parse(raw) as BespokeRequestPayload) : null;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────
// Build submission payload from config
// ─────────────────────────────────────────────

export function buildPayload(
  config: BespokeConfiguration
): BespokeRequestPayload {
  return {
    requestId: generateRequestId(),
    status: "submitted" as BespokeStatus,
    createdAt: new Date().toISOString(),
    styleId: config.styleId,
    styleCode: config.styleCode,
    styleName: config.styleName,
    styleImage: config.styleImage,
    garmentCategory: config.garmentCategory,
    isIdeaPath: config.isIdeaPath,
    fabric: config.fabric,
    colour: config.colour,
    preferences: config.preferences,
    fitPreference: config.fitPreference,
    measurementMethod: config.measurementMethod,
    measurementUnit: config.measurementUnit,
    measurements: config.measurements,
    measurementConfidence: config.measurementConfidence,
    occasion: config.occasion,
    eventName: config.eventName,
    eventDate: config.eventDate,
    requiredDate: config.requiredDate,
    appointmentRequest:
      config.appointment.type && config.appointment.type !== "none"
        ? config.appointment
        : undefined,
    contact: config.contact,
  };
}

// ─────────────────────────────────────────────
// React hook — useBespokeConfig
// ─────────────────────────────────────────────

export function useBespokeConfig(
  initialSlug?: string,
  initialIsIdea?: boolean
) {
  const [config, setConfigState] = useState<BespokeConfiguration>(() =>
    getEmptyConfig(initialSlug, initialIsIdea)
  );
  const [isLoaded, setIsLoaded] = useState(false);

  // Hydrate from localStorage on mount
  useEffect(() => {
    const stored = getStoredConfig();
    if (stored && stored.styleSlug === initialSlug) {
      const hydrated = { ...stored, draftId: stored.draftId ?? crypto.randomUUID() };
      setConfigState(hydrated);
      setStoredConfig(hydrated);
    } else if (initialSlug) {
      // New journey for a different style — start fresh
      const fresh = getEmptyConfig(initialSlug, initialIsIdea);
      const hydrated = { ...fresh, draftId: crypto.randomUUID() };
      setConfigState(hydrated);
      setStoredConfig(hydrated);
    }
    setIsLoaded(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listen for cross-tab updates
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<BespokeConfiguration | null>).detail;
      if (detail) setConfigState(detail);
    };
    window.addEventListener(EVENT_NAME, handler);
    return () => window.removeEventListener(EVENT_NAME, handler);
  }, []);

  // ─── Generic field updater ───────────────────

  const update = useCallback(
    <K extends keyof BespokeConfiguration>(
      key: K,
      value: BespokeConfiguration[K]
    ) => {
      setConfigState((prev) => {
        const next = { ...prev, [key]: value };
        setStoredConfig(next);
        return next;
      });
    },
    []
  );

  // ─── Step navigation ─────────────────────────

  const goToStep = useCallback((step: number) => {
    setConfigState((prev) => {
      const next = { ...prev, currentStep: step };
      setStoredConfig(next);
      return next;
    });
  }, []);

  const goNext = useCallback(() => {
    setConfigState((prev) => {
      const next = { ...prev, currentStep: prev.currentStep + 1 };
      setStoredConfig(next);
      return next;
    });
  }, []);

  const goBack = useCallback(() => {
    setConfigState((prev) => {
      const next = { ...prev, currentStep: Math.max(0, prev.currentStep - 1) };
      setStoredConfig(next);
      return next;
    });
  }, []);

  // ─── Typed convenience setters ───────────────

  const setFabric = useCallback(
    (fabric: FabricOption) => update("fabric", fabric),
    [update]
  );
  const setColour = useCallback(
    (colour: ColourOption) => update("colour", colour),
    [update]
  );
  const setFitPreference = useCallback(
    (fit: "tailored" | "regular" | "relaxed") =>
      update("fitPreference", fit),
    [update]
  );
  const setMeasurements = useCallback(
    (measurements: MeasurementSet) => update("measurements", measurements),
    [update]
  );
  const setMeasurementUnit = useCallback(
    (unit: MeasurementUnit) => update("measurementUnit", unit),
    [update]
  );
  const setPreferences = useCallback(
    (prefs: DesignPreferences) => update("preferences", prefs),
    [update]
  );
  const setAppointment = useCallback(
    (appt: AppointmentRequestData) => update("appointment", appt),
    [update]
  );
  const setContact = useCallback(
    (contact: ContactInfo) => update("contact", contact),
    [update]
  );
  const setGarmentCategory = useCallback(
    (cat: ProductCategory) => update("garmentCategory", cat),
    [update]
  );

  // ─── Submission ──────────────────────────────

  const submitRequest = useCallback((): BespokeRequestPayload => {
    return buildPayload(config);
  }, [config]);

  // ─── Reset ───────────────────────────────────

  const reset = useCallback(
    (slug?: string, isIdea?: boolean) => {
      const fresh = getEmptyConfig(slug, isIdea);
      setConfigState(fresh);
      setStoredConfig(fresh);
    },
    []
  );

  return {
    config,
    isLoaded,
    update,
    goToStep,
    goNext,
    goBack,
    setFabric,
    setColour,
    setFitPreference,
    setMeasurements,
    setMeasurementUnit,
    setPreferences,
    setAppointment,
    setContact,
    setGarmentCategory,
    submitRequest,
    reset,
  };
}
