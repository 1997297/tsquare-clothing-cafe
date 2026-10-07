export const APPOINTMENT_PURPOSES = {
  consultation: "Private consultation", measurement: "Measurements", "first-fitting": "Fitting",
  "final-fitting": "Final fitting", "style-consultation": "Style consultation", pickup: "Collection / pickup", other: "Other atelier visit",
} as const;

export const CONCIERGE_CATEGORIES = {
  discuss_order: "Discuss an order", discuss_request: "Discuss a bespoke request",
  fitting_enquiry: "Fitting enquiry", payment_question: "Payment question",
  style_consultation: "Style consultation", general_enquiry: "General atelier enquiry",
} as const;

export const APPOINTMENT_STATUS_LABELS: Record<string, string> = {
  requested: "Requested — awaiting TCC", scheduled: "Scheduled", confirmed: "Confirmed",
  rescheduled: "Rescheduled", cancelled: "Cancelled", completed: "Completed",
};

export const CONCIERGE_STATUS_LABELS: Record<string, string> = {
  open: "Open", in_review: "With TCC", awaiting_customer: "Awaiting your reply", resolved: "Resolved", closed: "Closed",
};

export const APPOINTMENT_COLUMNS = "id,customer_id,order_id,bespoke_request_id,type,preferred_date,preferred_time,confirmed_date,confirmed_time,status,location,notes,created_at,updated_at,lock_version,scheduled_start_at,scheduled_end_at,confirmed_at,last_rescheduled_at,completed_at,cancelled_at,cancelled_actor_type,cancellation_reason";
export const CONCIERGE_COLUMNS = "id,reference_code,customer_id,category,subject,message,related_order_id,related_request_id,related_appointment_id,status,created_at,updated_at,lock_version,last_message_seq,client_read_seq,staff_read_seq,client_read_at,staff_read_at,last_message_at,context_order_id,context_request_id,context_appointment_id";
export const APPOINTMENT_CHANGE_COLUMNS = "id,appointment_id,customer_id,change_type,proposed_date,proposed_time,reason,status,created_at,reviewed_at,lock_version,appointment_version,review_reason";

export interface AtelierAppointment {
  id: string; customer_id: string; order_id: string | null; bespoke_request_id: string | null;
  type: string; preferred_date: string; preferred_time: string; confirmed_date: string | null; confirmed_time: string | null;
  status: string; location: string; notes: string | null; created_at: string; updated_at: string;
  lock_version: number; scheduled_start_at: string | null; scheduled_end_at: string | null;
  confirmed_at: string | null; last_rescheduled_at: string | null; completed_at: string | null;
  cancelled_at: string | null; cancelled_actor_type: string | null; cancellation_reason: string | null;
}
export interface AtelierChange {
  id: string; appointment_id: string; change_type: string; proposed_date: string | null;
  proposed_time: string | null; reason: string | null; status: string; created_at: string;
  reviewed_at: string | null; lock_version: number; review_reason: string | null;
}
export interface AtelierHistory {
  id: string; event_type: string; actor_type: string; created_at: string; metadata: Record<string, unknown>;
}
export interface AtelierAppointmentDetail {
  appointment: AtelierAppointment; changes: AtelierChange[]; history: AtelierHistory[];
  staff_notes?: { id: string; note: string; created_at: string; actor_id: string }[];
  staff_actors?: { event_id: string; actor_id: string; actor_role: string }[];
}
export interface AtelierConversation {
  id: string; reference_code: string; customer_id: string; category: string; subject: string; message: string;
  status: string; created_at: string; updated_at: string; lock_version: number;
  last_message_seq: number; client_read_seq: number; staff_read_seq: number; last_message_at: string | null;
  context_order_id: string | null; context_request_id: string | null; context_appointment_id: string | null;
  related_order_id: string | null; related_request_id: string | null; related_appointment_id: string | null;
  unread_messages?: number; latest_message?: AtelierMessage | null; client_name?: string;
}
export interface AtelierMessage {
  id: string; request_id: string; message_seq: number; sender_type: "customer" | "concierge";
  sender_name?: string; display_label?: string; message: string; created_at: string;
}
export interface AtelierThread {
  conversation: AtelierConversation; messages: AtelierMessage[]; observed_message_seq: number;
  has_more: boolean; unread_messages: number;
}
export interface AtelierCounts {
  pending_appointments: number; today_confirmed_appointments: number;
  unread_concierge_messages: number; unread_concierge_conversations: number;
}
export interface AtelierContextOption { id: string; label: string }
export interface AtelierContextOptions {
  orders: AtelierContextOption[]; requests: AtelierContextOption[]; appointments: AtelierContextOption[];
}

export class AtelierInputError extends Error {}
export type AtelierInput = Record<string, unknown>;

export function atelierInputRecord(input: unknown, allowedKeys: readonly string[]): AtelierInput {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new AtelierInputError("Invalid atelier request.");
  const record = input as AtelierInput;
  const allowed = new Set([...allowedKeys, "operationKey"]);
  if (Object.keys(record).some(key => !allowed.has(key))) throw new AtelierInputError("The request contains unsupported fields.");
  return record;
}

export function atelierText(input: AtelierInput, key: string, maximum: number, minimum = 0) {
  const raw = input[key];
  if (raw != null && typeof raw !== "string") throw new AtelierInputError(`Invalid ${key}.`);
  const text = typeof raw === "string" ? raw.trim() : "";
  if (text.includes("\0") || text.length < minimum || text.length > maximum) {
    throw new AtelierInputError(`Check ${key.replace(/([A-Z])/g, " $1").toLowerCase()} (${minimum}–${maximum} characters).`);
  }
  return text;
}

export function atelierUuid(input: AtelierInput, key: string, optional = false) {
  const value = atelierText(input, key, 36, optional ? 0 : 36);
  if (optional && !value) return null;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
    throw new AtelierInputError("Refresh this record and try again.");
  }
  return value;
}

export function atelierInteger(input: AtelierInput, key: string, minimum: number, maximum = Number.MAX_SAFE_INTEGER) {
  const raw = input[key];
  if (typeof raw !== "number" && (typeof raw !== "string" || !/^\d+$/.test(raw))) {
    throw new AtelierInputError(`Invalid ${key}.`);
  }
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value < minimum || value > maximum) throw new AtelierInputError(`Invalid ${key}.`);
  return value;
}

/** Never make a status/permission decision from presentation labels. */
export function appointmentPurposeLabel(value: string) {
  return Object.hasOwn(APPOINTMENT_PURPOSES, value)
    ? APPOINTMENT_PURPOSES[value as keyof typeof APPOINTMENT_PURPOSES]
    : value.replace(/[-_]/g, " ");
}
