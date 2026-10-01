"use server";

import { revalidatePath } from "next/cache";
import {
  ORDER_WORKFLOW_STATUSES,
  type OrderWorkflowStatus,
} from "@/lib/atelier-workflow";
import { requireStaff } from "@/lib/server/auth";
import { transitionOrderStatus } from "@/lib/server/requests";
import { isUuid } from "@/lib/validation";
import type { WorkflowActionResult } from "@/app/admin/requests/actions";

export async function transitionOrderAction(input: unknown): Promise<WorkflowActionResult> {
  const record = (input ?? {}) as Record<string, unknown>;
  const orderId = typeof record.orderId === "string" ? record.orderId : "";
  const status = typeof record.status === "string" ? record.status as OrderWorkflowStatus : "" as OrderWorkflowStatus;
  const message = typeof record.message === "string" ? record.message.trim() : "";
  const expectedVersion = Number(record.expectedVersion);
  const operationKey = typeof record.operationKey === "string" ? record.operationKey : "";
  if (
    !isUuid(orderId) ||
    !isUuid(operationKey) ||
    !ORDER_WORKFLOW_STATUSES.includes(status) ||
    !Number.isSafeInteger(expectedVersion) ||
    expectedVersion < 1 ||
    message.length > 2000
  ) {
    return { success: false, error: "Refresh this order and choose a valid production stage." };
  }
  try {
    await requireStaff();
    await transitionOrderStatus({
      orderId,
      status,
      message: message || undefined,
      expectedVersion,
      operationKey,
    });
    revalidatePath("/admin");
    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${orderId}`);
    revalidatePath("/account/orders");
    return { success: true, data: undefined };
  } catch (error) {
    console.error("Order transition failed", error);
    const messageText = error && typeof error === "object" && "message" in error
      ? String(error.message).toLowerCase() : "";
    return {
      success: false,
      error: messageText.includes("stale") || messageText.includes("version")
        ? "This order changed while it was open. Refresh before trying again."
        : "We could not confirm the update. Refresh to check its status or retry the same action.",
    };
  }
}
