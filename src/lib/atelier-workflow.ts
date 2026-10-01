export const REQUEST_WORKFLOW_STATUSES = [
  "submitted",
  "under_review",
  "needs_clarification",
  "confirmed",
  "converted_to_order",
  "declined",
] as const;

export type RequestWorkflowStatus = typeof REQUEST_WORKFLOW_STATUSES[number];

export const REQUEST_STAFF_ACTIONS = [
  "start_review",
  "request_changes",
  "approve",
  "decline",
] as const;

export type RequestStaffAction = typeof REQUEST_STAFF_ACTIONS[number];

export const ORDER_WORKFLOW_STATUSES = [
  "order_confirmed",
  "measurements_confirmed",
  "in_production",
  "finishing",
  "ready",
  "completed",
] as const;

export type OrderWorkflowStatus = typeof ORDER_WORKFLOW_STATUSES[number];

export interface WorkflowEvent {
  id: string;
  entityType: string;
  eventType: string;
  actorType: "customer" | "staff" | "system" | "provider";
  actorId?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export const REQUEST_STATUS_LABELS: Record<RequestWorkflowStatus, string> = {
  submitted: "Pending review",
  under_review: "Under review",
  needs_clarification: "Changes requested",
  confirmed: "Approved",
  converted_to_order: "Converted to order",
  declined: "Declined",
};

export const ORDER_STATUS_LABELS: Record<OrderWorkflowStatus, string> = {
  order_confirmed: "Order confirmed",
  measurements_confirmed: "Measurements confirmed",
  in_production: "In production",
  finishing: "Finishing and inspection",
  ready: "Ready",
  completed: "Completed",
};

const REQUEST_ACTION_TARGETS: Record<RequestStaffAction, RequestWorkflowStatus> = {
  start_review: "under_review",
  request_changes: "needs_clarification",
  approve: "confirmed",
  decline: "declined",
};

const REQUEST_TRANSITIONS: Record<RequestWorkflowStatus, readonly RequestWorkflowStatus[]> = {
  submitted: ["under_review"],
  under_review: ["needs_clarification", "confirmed", "declined"],
  needs_clarification: ["submitted", "declined"],
  confirmed: ["converted_to_order"],
  converted_to_order: [],
  declined: [],
};

const ORDER_TRANSITIONS: Record<OrderWorkflowStatus, readonly OrderWorkflowStatus[]> = {
  order_confirmed: ["measurements_confirmed"],
  measurements_confirmed: ["in_production"],
  in_production: ["finishing"],
  finishing: ["ready"],
  ready: ["completed"],
  completed: [],
};

export function normalizeRequestStatus(status: string): RequestWorkflowStatus {
  if (status === "changes_requested") return "needs_clarification";
  if (status === "approved") return "confirmed";
  return REQUEST_WORKFLOW_STATUSES.includes(status as RequestWorkflowStatus)
    ? status as RequestWorkflowStatus
    : "submitted";
}

export function isRequestTransitionAllowed(
  from: RequestWorkflowStatus,
  to: RequestWorkflowStatus
): boolean {
  return REQUEST_TRANSITIONS[from].includes(to);
}

export function requestActionTarget(action: RequestStaffAction): RequestWorkflowStatus {
  return REQUEST_ACTION_TARGETS[action];
}

export function isOrderTransitionAllowed(
  from: OrderWorkflowStatus,
  to: OrderWorkflowStatus
): boolean {
  return ORDER_TRANSITIONS[from].includes(to);
}

export function nextOrderStatus(status: OrderWorkflowStatus): OrderWorkflowStatus | null {
  return ORDER_TRANSITIONS[status][0] ?? null;
}

export function requestActionNeedsMessage(action: RequestStaffAction): boolean {
  return action === "request_changes" || action === "decline";
}

export function isRequestEligibleForOrder(
  status: string,
  customerId?: string | null,
  approval?: { approvedAt?: string | null; revision?: number | null; approvedRevision?: number | null }
): boolean {
  return normalizeRequestStatus(status) === "confirmed" &&
    Boolean(customerId) &&
    Boolean(approval?.approvedAt) &&
    approval?.revision === approval?.approvedRevision;
}
