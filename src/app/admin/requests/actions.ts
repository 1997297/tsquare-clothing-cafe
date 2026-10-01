"use server";

import { revalidatePath } from "next/cache";
import {
  REQUEST_STAFF_ACTIONS,
  requestActionNeedsMessage,
  type RequestStaffAction,
} from "@/lib/atelier-workflow";
import { requireStaff } from "@/lib/server/auth";
import {
  convertBespokeRequestToOrder,
  transitionBespokeRequest,
} from "@/lib/server/requests";
import { isUuid } from "@/lib/validation";

export type WorkflowActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string };

function safeWorkflowError(error: unknown) {
  const message = error && typeof error === "object" && "message" in error
    ? String(error.message).toLowerCase() : "";
  if (message.includes("stale") || message.includes("version")) {
    return "This request changed while you were reviewing it. Refresh before acting again.";
  }
  if (message.includes("transition") || message.includes("state")) {
    return "That action is no longer valid for the request's current state.";
  }
  if (message.includes("authorized") || message.includes("staff")) {
    return "Your staff authorization could not be verified.";
  }
  return "We could not confirm the update. Refresh to check its status or retry the same action.";
}

function refreshRequestRoutes(requestId: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/requests");
  revalidatePath(`/admin/requests/${requestId}`);
  revalidatePath("/account/requests");
}

export async function transitionRequestAction(input: unknown): Promise<WorkflowActionResult> {
  const record = (input ?? {}) as Record<string, unknown>;
  const requestId = typeof record.requestId === "string" ? record.requestId : "";
  const action = typeof record.action === "string" ? record.action as RequestStaffAction : "" as RequestStaffAction;
  const message = typeof record.message === "string" ? record.message.trim() : "";
  const expectedVersion = Number(record.expectedVersion);
  const operationKey = typeof record.operationKey === "string" ? record.operationKey : "";
  if (
    !isUuid(requestId) ||
    !isUuid(operationKey) ||
    !REQUEST_STAFF_ACTIONS.includes(action) ||
    !Number.isSafeInteger(expectedVersion) ||
    expectedVersion < 1
  ) {
    return { success: false, error: "Refresh this request and try the action again." };
  }
  if (message.length > 2000 || (requestActionNeedsMessage(action) && message.length < 3)) {
    return {
      success: false,
      error: requestActionNeedsMessage(action)
        ? "Explain the requested change or decline reason."
        : "Staff messages must be 2,000 characters or fewer.",
    };
  }
  try {
    await requireStaff();
    await transitionBespokeRequest({
      requestId,
      action,
      message: message || undefined,
      expectedVersion,
      operationKey,
    });
    refreshRequestRoutes(requestId);
    return { success: true, data: undefined };
  } catch (error) {
    console.error("Request transition failed", error);
    return { success: false, error: safeWorkflowError(error) };
  }
}

export async function convertRequestToOrderAction(input: unknown): Promise<WorkflowActionResult<{ orderId?: string }>> {
  const record = (input ?? {}) as Record<string, unknown>;
  const requestId = typeof record.requestId === "string" ? record.requestId : "";
  const expectedVersion = Number(record.expectedVersion);
  const operationKey = typeof record.operationKey === "string" ? record.operationKey : "";
  if (!isUuid(requestId) || !isUuid(operationKey) || !Number.isSafeInteger(expectedVersion) || expectedVersion < 1) {
    return { success: false, error: "Refresh this approved request before creating its order." };
  }
  try {
    await requireStaff();
    const result = await convertBespokeRequestToOrder({
      requestId,
      expectedVersion,
      operationKey,
    }) as { id?: string } | null;
    refreshRequestRoutes(requestId);
    revalidatePath("/admin/orders");
    revalidatePath("/account/orders");
    return { success: true, data: { orderId: result?.id } };
  } catch (error) {
    console.error("Request conversion failed", error);
    return { success: false, error: safeWorkflowError(error) };
  }
}
