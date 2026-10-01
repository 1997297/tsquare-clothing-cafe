import "server-only";

import type { BespokeRequestPayload, ReferenceImage } from "@/types/bespoke";
import type { OrderWorkflowStatus, RequestStaffAction } from "@/lib/atelier-workflow";
import { createServerSupabaseClient } from "@/lib/supabase/server";

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
  const supabase = await createServerSupabaseClient();
  // The RPC resolves and freezes saved measurements on the first successful call.
  // A retry sends the same intent, even if the current profile changes meanwhile.
  const measurementSnapshot = payload.measurementMethod === "saved"
    ? { method: "saved" }
    : {
        values: payload.measurements ?? {},
        unit: payload.measurementUnit ?? "cm",
        method: payload.measurementMethod ?? "schedule",
      };

  const referenceImages = durableReferences(payload.preferences.referenceImages, customerId);
  const preferences = { ...payload.preferences };
  delete preferences.referenceImages;

  if (!payload.submissionKey) throw new Error("A submission key is required.");
  const { data, error } = await supabase.rpc("submit_bespoke_request", {
    p_submission_key: payload.submissionKey,
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

export async function transitionBespokeRequest(input: {
  requestId: string;
  action: RequestStaffAction;
  message?: string;
  expectedVersion: number;
  operationKey: string;
}) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("transition_bespoke_request", {
    p_request_id: input.requestId,
    p_action: input.action,
    p_message: input.message ?? null,
    p_expected_version: input.expectedVersion,
    p_operation_key: input.operationKey,
  });
  if (error) throw error;
  return data;
}
export async function resubmitBespokeRequest(input: {
  requestId: string;
  response: string;
  payload: Record<string, unknown>;
  expectedVersion: number;
  operationKey: string;
}) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("resubmit_bespoke_request", {
    p_request_id: input.requestId,
    p_payload: input.payload,
    p_response: input.response,
    p_expected_version: input.expectedVersion,
    p_operation_key: input.operationKey,
  });
  if (error) throw error;
  return data;
}
export async function convertBespokeRequestToOrder(input: {
  requestId: string;
  expectedVersion: number;
  operationKey: string;
}) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("convert_bespoke_request_to_order", {
    p_request_id: input.requestId,
    p_expected_version: input.expectedVersion,
    p_operation_key: input.operationKey,
  });
  if (error) throw error;
  return data;
}

export async function transitionOrderStatus(input: {
  orderId: string;
  status: OrderWorkflowStatus;
  message?: string;
  expectedVersion: number;
  operationKey: string;
}) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("transition_order_status", {
    p_order_id: input.orderId,
    p_status: input.status,
    p_message: input.message ?? null,
    p_expected_version: input.expectedVersion,
    p_operation_key: input.operationKey,
  });
  if (error) throw error;
  return data;
}
