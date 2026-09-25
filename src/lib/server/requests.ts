import "server-only";

import type { BespokeRequestPayload, ReferenceImage } from "@/types/bespoke";
import { getSupabaseAdminClient } from "./supabase-admin";

function durableReferences(images: ReferenceImage[] | undefined, customerId: string) {
  return (images ?? []).map((image) => {
    if (!image.storagePath || !image.storagePath.startsWith(`${customerId}/`)) {
      throw new Error("Invalid reference image ownership");
    }
    return {
      path: image.storagePath,
      filename: image.filename,
      sizeBytes: image.sizeBytes,
      mimeType: image.mimeType,
    };
  });
}

export async function submitCustomerBespokeRequest(customerId: string, payload: BespokeRequestPayload) {
  const admin = getSupabaseAdminClient();
  let measurementSnapshot: Record<string, unknown>;

  if (payload.measurementMethod === "saved") {
    const { data: current, error } = await admin
      .from("measurement_profiles")
      .select("id, version, unit, fit_preference, verification_status, measurements")
      .eq("customer_id", customerId)
      .eq("is_current", true)
      .single();
    if (error || !current) throw new Error("A current measurement profile is required.");
    measurementSnapshot = {
      values: current.measurements,
      unit: current.unit,
      method: "saved",
      sourceMeasurementId: current.id,
      sourceVersion: current.version,
      verificationStatus: current.verification_status,
      fitPreference: payload.fitPreference ?? current.fit_preference,
      snapshottedAt: new Date().toISOString(),
    };
  } else {
    measurementSnapshot = {
      values: payload.measurements ?? {},
      unit: payload.measurementUnit ?? "cm",
      method: payload.measurementMethod ?? "schedule",
      sourceMeasurementId: null,
      sourceVersion: null,
      verificationStatus: payload.measurementMethod === "manual" ? "customer_entered" : "needs_confirmation",
      fitPreference: payload.fitPreference ?? null,
      snapshottedAt: new Date().toISOString(),
    };
  }

  const referenceImages = durableReferences(payload.preferences.referenceImages, customerId);
  const preferences = { ...payload.preferences };
  delete preferences.referenceImages;

  const { data, error } = await admin.rpc("submit_bespoke_request", {
    p_customer_id: customerId,
    p_payload: {
      style_id: payload.styleId,
      style_code: payload.styleCode,
      style_name: payload.styleName,
      style_image: payload.styleImage,
      garment_category: payload.garmentCategory,
      is_idea_path: payload.isIdeaPath,
      fabric: payload.fabric,
      colour: payload.colour,
      preferences,
      fit_preference: payload.fitPreference,
      measurements_snapshot: measurementSnapshot,
      measurement_confidence: payload.measurementConfidence,
      occasion: payload.occasion,
      event_name: payload.eventName,
      event_date: payload.eventDate,
      required_date: payload.requiredDate,
      appointment_request: payload.appointmentRequest,
      reference_images: referenceImages,
      special_instructions: payload.preferences.specialInstructions,
      contact_info: payload.contact,
    },
  });
  if (error) throw error;
  return data;
}

export interface TrustedActor {
  id: string;
  type: "staff" | "system";
}

export async function convertBespokeRequestToOrder(requestId: string, actor: TrustedActor) {
  const { data, error } = await getSupabaseAdminClient().rpc("convert_bespoke_request_to_order", {
    p_request_id: requestId,
    p_actor_id: actor.id,
    p_actor_type: actor.type,
  });
  if (error) throw error;
  return data;
}
