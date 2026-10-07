"use server";

import type { BespokeRequestPayload } from "@/types/bespoke";
import { revalidatePath } from "next/cache";
import {
  isUuid,
  validateBespokeRequestPayload,
  validateMeasurementVersion,
  validatePaymentInitialization,
} from "@/lib/validation";
import { requireAuthenticatedCustomer, toSafeServerError } from "@/lib/server/auth";
import { createMeasurementVersion } from "@/lib/server/measurements";
import { resubmitBespokeRequest, submitCustomerBespokeRequest } from "@/lib/server/requests";
import { initializeCustomerPayment, PaymentProviderUnavailableError } from "@/lib/server/payments";

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

export async function saveMeasurementProfileAction(input: unknown): Promise<ActionResult<unknown>> {
  const valid = validateMeasurementVersion(input);
  if (!valid.success) return { ok: false, error: valid.error };
  try {
    const user = await requireAuthenticatedCustomer();
    return { ok: true, data: await createMeasurementVersion(user.id, valid.data) };
  } catch (error) {
    return { ok: false, error: toSafeServerError(error) };
  }
}

export async function submitBespokeRequestAction(payload: BespokeRequestPayload): Promise<ActionResult<BespokeRequestPayload>> {
  const valid = validateBespokeRequestPayload(payload);
  if (!valid.success) return { ok: false, error: valid.error };
  try {
    const user = await requireAuthenticatedCustomer();
    const row = await submitCustomerBespokeRequest(user.id, valid.data) as Record<string, unknown>;
    return {
      ok: true,
      data: {
        ...valid.data,
        requestId: String(row.request_reference),
        status: "submitted",
        createdAt: String(row.created_at),
        persistence: "database",
      },
    };
  } catch (error) {
    return { ok: false, error: toSafeServerError(error) };
  }
}

export async function resubmitBespokeRequestAction(input: unknown): Promise<ActionResult<unknown>> {
  const record = (input ?? {}) as Record<string, unknown>;
  const requestId = typeof record.requestId === "string" ? record.requestId : "";
  const response = typeof record.response === "string" ? record.response.trim() : "";
  const specialInstructions = typeof record.specialInstructions === "string"
    ? record.specialInstructions.trim()
    : "";
  const expectedVersion = Number(record.expectedVersion);
  const operationKey = typeof record.operationKey === "string" ? record.operationKey : "";
  const useCurrentMeasurements = record.useCurrentMeasurements === true;
  if (
    !isUuid(requestId) ||
    !isUuid(operationKey) ||
    response.length < 3 ||
    response.length > 2000 ||
    specialInstructions.length > 2000 ||
    !Number.isSafeInteger(expectedVersion) ||
    expectedVersion < 1
  ) {
    return { ok: false, error: "Provide a response of up to 2,000 characters and refresh the request if needed." };
  }

  try {
    await requireAuthenticatedCustomer();
    const data = await resubmitBespokeRequest({
      requestId,
      response,
      expectedVersion,
      operationKey,
      payload: {
        special_instructions: specialInstructions || null,
        ...(useCurrentMeasurements ? { measurements_snapshot: { method: "saved" } } : {}),
      },
    });
    revalidatePath("/account/requests");
    revalidatePath(`/account/requests/${requestId}`);
    revalidatePath("/admin/requests");
    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: toSafeServerError(error) };
  }
}

export async function initializePaymentAction(input: unknown): Promise<ActionResult<unknown>> {
  const valid = validatePaymentInitialization(input);
  if (!valid.success) return { ok: false, error: valid.error };
  try {
    const user = await requireAuthenticatedCustomer();
    return { ok: true, data: await initializeCustomerPayment(user.id, valid.data) };
  } catch (error) {
    if (error instanceof PaymentProviderUnavailableError) return { ok: false, error: error.message };
    return { ok: false, error: toSafeServerError(error) };
  }
}
