"use server";

import { revalidatePath } from "next/cache";
import { APPOINTMENT_PURPOSES, CONCIERGE_CATEGORIES, CONCIERGE_STATUS_LABELS, AtelierInputError,
  atelierInputRecord, atelierInteger, atelierText, atelierUuid, type AtelierInput } from "@/lib/atelier-service";
import { atelierCalendar, isAtelierDate, isAtelierTime } from "@/lib/atelier-time";
import { atelierRpc, AtelierRpcError, requireAtelierActor } from "@/lib/server/atelier-service";
import { toSafeServerError } from "@/lib/server/auth";
import type { AtelierActionResult } from "@/components/atelier/AtelierForm";
import type { AtelierMessage, AtelierThread } from "@/lib/atelier-service";

const errors: Record<string, string> = {
  schedule_conflict: "This time overlaps another confirmed atelier appointment. Choose a different time.",
  stale_version: "This record changed. Refresh and review the latest details before trying again.",
  version_conflict: "This record changed. Refresh and review the latest details before trying again.",
  pending_change_exists: "A change is already awaiting review. Review that request first.",
  conversation_closed: "This conversation is closed or resolved. TCC must reopen it before another reply.",
  idempotency_conflict: "This action changed during a retry. Refresh the record before submitting again.",
  not_found: "This record is unavailable or you do not have access.",
  unauthorized: "This account cannot perform that action.",
  invalid_input: "Check the entered details and try again.",
  invalid_transition: "This action is not available for the current status. Refresh the record.",
  appointment_terminal: "This appointment is already completed or cancelled. Its history is retained.",
  completion_not_available: "Only a confirmed appointment whose start time has passed can be completed.",
  schedule_in_past: "Choose a future appointment start time in Nigeria (WAT).",
  preferred_date_in_past: "Choose today or a future preferred date in Nigeria.",
  context_mismatch: "Choose related records from the same request or order, or leave unrelated selections blank.",
  change_already_reviewed: "This change was already reviewed. Refresh to see the decision.",
  legacy_schedule_requires_review: "An earlier schedule needs staff reconciliation before this slot can be confirmed.",
};

function date(input: AtelierInput, key: string) {
  const value = atelierText(input, key, 10, 10);
  if (!isAtelierDate(value) || value < atelierCalendar().date) throw new AtelierInputError("Choose today or a future date in Nigeria.");
  return value;
}
function schedule(input: AtelierInput, required: boolean) {
  if (!required) {
    if (["scheduleDate", "scheduleTime", "durationMinutes"].some(key => input[key] != null && input[key] !== "")) throw new AtelierInputError("A schedule is not accepted for this action.");
    return { p_schedule_date: null, p_schedule_time: null, p_duration_minutes: null };
  }
  const time = atelierText(input, "scheduleTime", 5, 5);
  if (!isAtelierTime(time)) throw new AtelierInputError("Choose a valid 24-hour Nigerian time.");
  return { p_schedule_date: date(input, "scheduleDate"), p_schedule_time: time, p_duration_minutes: atelierInteger(input, "durationMinutes", 15, 240) };
}
function enumValue(input: AtelierInput, key: string, allowed: readonly string[]) {
  const value = atelierText(input, key, 80, 1);
  if (!allowed.includes(value)) throw new AtelierInputError(`Choose a valid ${key}.`);
  return value;
}

async function run(side: "client" | "staff" | "either", execute: () => Promise<{ appointment?: { id: string }; conversation?: { id: string } }>): Promise<AtelierActionResult> {
  try {
    await requireAtelierActor(side);
    const result = await execute();
    revalidatePath("/account", "layout");
    revalidatePath("/admin", "layout");
    return { success: true, id: result.appointment?.id ?? result.conversation?.id };
  } catch (error) {
    if (error instanceof AtelierInputError) return { success: false, error: error.message };
    if (error instanceof AtelierRpcError) return { success: false, error: errors[error.reason] ?? "The action could not be confirmed. Refresh to check its status, then retry if needed." };
    return { success: false, error: toSafeServerError(error) };
  }
}

export async function createAtelierAppointmentAction(input: unknown) {
  return run("client", async () => {
    const value = atelierInputRecord(input, ["type", "preferredDate", "preferredTime", "orderId", "requestId", "note"]);
    return atelierRpc("create_atelier_appointment", {
      p_type: enumValue(value, "type", Object.keys(APPOINTMENT_PURPOSES)), p_preferred_date: date(value, "preferredDate"),
      p_preferred_time: atelierText(value, "preferredTime", 80, 1), p_order_id: atelierUuid(value, "orderId", true),
      p_bespoke_request_id: atelierUuid(value, "requestId", true), p_note: atelierText(value, "note", 2000) || null,
      p_operation_key: atelierUuid(value, "operationKey"),
    });
  });
}
export async function requestAtelierChangeAction(input: unknown) {
  return run("client", async () => {
    const value = atelierInputRecord(input, ["appointmentId", "changeType", "proposedDate", "proposedTime", "reason", "expectedVersion"]);
    const type = enumValue(value, "changeType", ["reschedule", "cancellation"]);
    if (type === "cancellation" && (value.proposedDate || value.proposedTime)) throw new AtelierInputError("Cancellation must not include a replacement schedule.");
    return atelierRpc("request_atelier_appointment_change", {
      p_appointment_id: atelierUuid(value, "appointmentId"), p_change_type: type,
      p_proposed_date: type === "reschedule" ? date(value, "proposedDate") : null,
      p_proposed_time: type === "reschedule" ? atelierText(value, "proposedTime", 80, 1) : null,
      p_reason: atelierText(value, "reason", 1000) || null, p_expected_version: atelierInteger(value, "expectedVersion", 1),
      p_operation_key: atelierUuid(value, "operationKey"),
    });
  });
}
export async function manageAtelierAppointmentAction(input: unknown) {
  return run("staff", async () => {
    const value = atelierInputRecord(input, ["appointmentId", "action", "scheduleDate", "scheduleTime", "durationMinutes", "reason", "staffNote", "expectedVersion"]);
    const action = enumValue(value, "action", ["confirm", "reschedule", "cancel", "complete"]);
    return atelierRpc("manage_atelier_appointment", {
      p_appointment_id: atelierUuid(value, "appointmentId"), p_action: action,
      ...schedule(value, action === "confirm" || action === "reschedule"),
      p_reason: atelierText(value, "reason", 1000, action === "reschedule" ? 1 : 0) || null,
      p_staff_note: atelierText(value, "staffNote", 2000) || null,
      p_expected_version: atelierInteger(value, "expectedVersion", 1), p_operation_key: atelierUuid(value, "operationKey"),
    });
  });
}
export async function reviewAtelierChangeAction(input: unknown) {
  return run("staff", async () => {
    const value = atelierInputRecord(input, ["changeId", "decision", "scheduleDate", "scheduleTime", "durationMinutes", "reason", "staffNote", "expectedVersion", "expectedChangeVersion"]);
    const decision = enumValue(value, "decision", ["approve", "decline"]);
    // Only reschedule approvals have schedule inputs; the database validates change type.
    return atelierRpc("review_atelier_appointment_change", {
      p_change_request_id: atelierUuid(value, "changeId"), p_decision: decision,
      ...schedule(value, decision === "approve" && Boolean(value.scheduleDate)),
      p_reason: atelierText(value, "reason", 1000, 1),
      p_staff_note: atelierText(value, "staffNote", 2000) || null,
      p_expected_appointment_version: atelierInteger(value, "expectedVersion", 1),
      p_expected_change_version: atelierInteger(value, "expectedChangeVersion", 1), p_operation_key: atelierUuid(value, "operationKey"),
    });
  });
}
export async function addAtelierNoteAction(input: unknown) {
  return run("staff", async () => {
    const value = atelierInputRecord(input, ["appointmentId", "note"]);
    return atelierRpc("add_atelier_appointment_note", { p_appointment_id: atelierUuid(value, "appointmentId"), p_note: atelierText(value, "note", 2000, 1), p_operation_key: atelierUuid(value, "operationKey") });
  });
}
export async function createAtelierConciergeAction(input: unknown) {
  return run("client", async () => {
    const value = atelierInputRecord(input, ["category", "subject", "message", "orderId", "requestId", "appointmentId"]);
    return atelierRpc("create_atelier_concierge_request", {
      p_category: enumValue(value, "category", Object.keys(CONCIERGE_CATEGORIES)), p_subject: atelierText(value, "subject", 160, 3),
      p_message: atelierText(value, "message", 4000, 3), p_order_id: atelierUuid(value, "orderId", true),
      p_bespoke_request_id: atelierUuid(value, "requestId", true), p_appointment_id: atelierUuid(value, "appointmentId", true),
      p_operation_key: atelierUuid(value, "operationKey"),
    });
  });
}
export async function sendAtelierMessageAction(input: unknown) {
  return run("either", async () => {
    const value = atelierInputRecord(input, ["requestId", "message"]);
    return atelierRpc("send_atelier_concierge_message", { p_request_id: atelierUuid(value, "requestId"), p_message: atelierText(value, "message", 4000, 1), p_operation_key: atelierUuid(value, "operationKey") });
  });
}
export async function markAtelierReadAction(input: unknown) {
  return run("either", async () => {
    const value = atelierInputRecord(input, ["requestId", "observedMessageSeq"]);
    return atelierRpc("mark_atelier_concierge_read", { p_request_id: atelierUuid(value, "requestId"), p_observed_message_seq: atelierInteger(value, "observedMessageSeq", 0) });
  });
}
export async function setAtelierConversationStatusAction(input: unknown) {
  return run("staff", async () => {
    const value = atelierInputRecord(input, ["requestId", "status", "expectedVersion"]);
    return atelierRpc("set_atelier_concierge_status", { p_request_id: atelierUuid(value, "requestId"), p_status: enumValue(value, "status", Object.keys(CONCIERGE_STATUS_LABELS)),
      p_expected_version: atelierInteger(value, "expectedVersion", 1), p_operation_key: atelierUuid(value, "operationKey") });
  });
}

export async function loadAtelierMessagesAction(input: unknown): Promise<{ success: true; messages: AtelierMessage[]; observed: number; hasMore: boolean } | { success: false; error: string }> {
  try {
    await requireAtelierActor("either");
    const value = atelierInputRecord(input, ["requestId", "after"]);
    const thread = await atelierRpc<AtelierThread>("get_atelier_concierge_thread", {
      p_request_id: atelierUuid(value, "requestId"), p_after_seq: atelierInteger(value, "after", 0), p_limit: 100,
    });
    // Explicit DTO: never serialize the staff-only attribution projection by accident.
    return { success: true, messages: thread.messages.map(message => ({
      id: message.id, request_id: message.request_id, message_seq: message.message_seq, sender_type: message.sender_type,
      sender_name: message.sender_type === "concierge" ? "TCC Concierge" : "Client", message: message.message, created_at: message.created_at,
    })), observed: thread.observed_message_seq, hasMore: thread.has_more };
  } catch { return { success: false, error: "Messages could not be refreshed. Please try again." }; }
}
