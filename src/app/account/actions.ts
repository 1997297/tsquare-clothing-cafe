"use server";

import type { BespokeRequestPayload } from "@/types/bespoke";
import {
  isUuid,
  validateAppointmentChange,
  validateBespokeRequestPayload,
  validateConciergeRequest,
  validateMeasurementVersion,
  validatePaymentInitialization,
} from "@/lib/validation";
import { requireAuthenticatedCustomer, toSafeServerError } from "@/lib/server/auth";
import { createMeasurementVersion } from "@/lib/server/measurements";
import { submitCustomerBespokeRequest } from "@/lib/server/requests";
import { createAppointmentChange } from "@/lib/server/appointments";
import { addConciergeCustomerMessage, createConciergeThread } from "@/lib/server/concierge";
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

export async function requestAppointmentChangeAction(input: unknown): Promise<ActionResult<unknown>> {
  const valid = validateAppointmentChange(input);
  if (!valid.success) return { ok: false, error: valid.error };
  try {
    const user = await requireAuthenticatedCustomer();
    return { ok: true, data: await createAppointmentChange(user.id, valid.data) };
  } catch (error) {
    return { ok: false, error: toSafeServerError(error) };
  }
}

export async function createConciergeRequestAction(input: unknown): Promise<ActionResult<unknown>> {
  const valid = validateConciergeRequest(input);
  if (!valid.success) return { ok: false, error: valid.error };
  try {
    const user = await requireAuthenticatedCustomer();
    return { ok: true, data: await createConciergeThread(user.id, valid.data) };
  } catch (error) {
    return { ok: false, error: toSafeServerError(error) };
  }
}

export async function addConciergeMessageAction(requestId: string, message: string): Promise<ActionResult<unknown>> {
  if (!isUuid(requestId) || message.trim().length < 1 || message.trim().length > 4000) {
    return { ok: false, error: "Enter a valid message." };
  }
  try {
    const user = await requireAuthenticatedCustomer();
    return { ok: true, data: await addConciergeCustomerMessage(user.id, requestId, message.trim()) };
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
