import "server-only";

import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { getAuthenticatedActor, requireAuthenticatedCustomer, requireStaff } from "@/lib/server/auth";
import { requireAdminPageAccess } from "@/lib/server/admin-guards";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/validation";
import { atelierCalendar, atelierDayBounds } from "@/lib/atelier-time";
import { APPOINTMENT_COLUMNS, CONCIERGE_COLUMNS, appointmentPurposeLabel,
  type AtelierAppointment, type AtelierAppointmentDetail, type AtelierContextOptions,
  type AtelierConversation, type AtelierCounts, type AtelierThread } from "@/lib/atelier-service";

export async function requireAtelierActor(side: "client" | "staff" | "either") {
  if (side === "client") return requireAuthenticatedCustomer();
  if (side === "staff") return requireStaff();
  const actor = await getAuthenticatedActor();
  if (!actor) throw new Error("AUTH_REQUIRED");
  if (actor.role !== "client" && actor.staffStatus !== "active") throw new Error("STAFF_ACCESS_DENIED");
  return actor;
}

export async function requireAtelierPage(staff: boolean) {
  if (staff) return requireAdminPageAccess();
  const actor = await getAuthenticatedActor();
  if (!actor) redirect("/auth/sign-in?next=/account");
  if (actor.role !== "client") redirect("/auth/access-denied");
  return actor;
}

export class AtelierRpcError extends Error {
  constructor(readonly code: string, readonly reason: string) { super("Atelier service request failed"); }
}

export async function atelierRpc<T>(name: string, args: Record<string, unknown> = {}): Promise<T> {
  const client = await createServerSupabaseClient();
  const { data, error } = await client.rpc(name, args);
  if (error) {
    // Never log input bodies, contacts, notes, tokens or database details.
    console.error("Atelier RPC failed", { name, code: error.code });
    throw new AtelierRpcError(error.code, error.message);
  }
  if (data == null) throw new Error("ATELIER_EMPTY_RESULT");
  return data as T;
}

export const getAtelierCounts = cache(async () => {
  await requireAtelierActor("either");
  return atelierRpc<AtelierCounts>("get_atelier_service_counts");
});

export async function getAtelierAppointment(id: string, staff: boolean) {
  await requireAtelierPage(staff);
  if (!isUuid(id)) notFound();
  let detail: AtelierAppointmentDetail;
  try { detail = await atelierRpc<AtelierAppointmentDetail>("get_atelier_appointment_detail", { p_appointment_id: id }); }
  catch (error) { if (error instanceof AtelierRpcError && error.reason === "not_found") notFound(); throw error; }
  if (!detail.appointment) notFound();
  return detail;
}

export async function listAtelierAppointments(staff: boolean, options: { status?: string; page?: number; orderId?: string } = {}) {
  await requireAtelierPage(staff);
  const client = await createServerSupabaseClient();
  const page = Math.max(0, Math.min(10000, options.page ?? 0));
  let query = client.from("appointments").select(options.status === "changes" ? `${APPOINTMENT_COLUMNS},appointment_change_requests!inner(status)` : APPOINTMENT_COLUMNS, { count: "exact" });
  if (options.status === "changes") query = query.eq("appointment_change_requests.status", "pending_review");
  else if (options.status === "today") {
    const bounds = atelierDayBounds(atelierCalendar().date);
    query = query.in("status", ["confirmed", "scheduled", "rescheduled"]).gte("scheduled_start_at", bounds.startsAt).lt("scheduled_start_at", bounds.endsAt);
  } else if (options.status === "upcoming") query = query.in("status", ["confirmed", "scheduled", "rescheduled"]).gte("scheduled_end_at", new Date().toISOString());
  else if (options.status && options.status !== "all") query = query.eq("status", options.status);
  if (options.orderId) query = query.eq("order_id", options.orderId);
  const scheduled = options.status === "today" || options.status === "upcoming";
  const result = await query.order(scheduled ? "scheduled_start_at" : "created_at", { ascending: scheduled }).order("id", { ascending: false }).range(page * 30, page * 30 + 29);
  if (result.error) throw new Error("ATELIER_LIST_UNAVAILABLE");
  const rows = (result.data ?? []) as unknown as AtelierAppointment[];
  const customers = new Map<string, { name: string; email: string; phone: string }>();
  if (staff && rows.length) {
    const profiles = await client.from("profiles").select("id,first_name,last_name,email,phone").in("id", [...new Set(rows.map(row => row.customer_id))]);
    if (profiles.error) throw new Error("ATELIER_CLIENTS_UNAVAILABLE");
    for (const row of profiles.data ?? []) customers.set(row.id, { name: `${row.first_name} ${row.last_name}`.trim(), email: row.email, phone: row.phone });
  }
  return { rows, customers, hasMore: (result.count ?? 0) > (page + 1) * 30, page };
}

export async function getAtelierContact(customerId: string) {
  await requireStaff();
  const client = await createServerSupabaseClient();
  const { data, error } = await client.from("profiles").select("first_name,last_name,email,phone").eq("id", customerId).maybeSingle();
  if (error) throw new Error("ATELIER_CLIENT_UNAVAILABLE");
  return data;
}

export async function getAtelierContextOptions(): Promise<AtelierContextOptions> {
  const user = await requireAuthenticatedCustomer();
  const client = await createServerSupabaseClient();
  const [orders, requests, appointments] = await Promise.all([
    client.from("orders").select("id,order_reference,style_name").eq("customer_id", user.id).order("created_at", { ascending: false }).limit(100),
    client.from("bespoke_requests").select("id,request_reference,style_name").eq("customer_id", user.id).order("created_at", { ascending: false }).limit(100),
    client.from("appointments").select("id,type,preferred_date").eq("customer_id", user.id).order("created_at", { ascending: false }).limit(100),
  ]);
  if ([orders, requests, appointments].some(result => result.error)) throw new Error("ATELIER_CONTEXT_UNAVAILABLE");
  return {
    orders: (orders.data ?? []).map(row => ({ id: row.id, label: `${row.order_reference} · ${row.style_name}` })),
    requests: (requests.data ?? []).map(row => ({ id: row.id, label: `${row.request_reference} · ${row.style_name}` })),
    appointments: (appointments.data ?? []).map(row => ({ id: row.id, label: `${appointmentPurposeLabel(row.type)} · ${row.preferred_date}` })),
  };
}

export async function getAtelierThread(id: string, staff: boolean, through = 100): Promise<AtelierThread> {
  await requireAtelierPage(staff);
  if (!isUuid(id)) notFound();
  // Fetch a contiguous prefix. Acknowledgment must never skip undisplayed messages.
  let snapshot: AtelierThread;
  try { snapshot = await atelierRpc<AtelierThread>("get_atelier_concierge_thread", { p_request_id: id, p_after_seq: 0, p_limit: 100 }); }
  catch (error) { if (error instanceof AtelierRpcError && error.reason === "not_found") notFound(); throw error; }
  if (!snapshot.conversation) notFound();
  const target = Math.min(1000, Math.max(100, through));
  while (snapshot.has_more && snapshot.messages.length < target) {
    const page = await atelierRpc<AtelierThread>("get_atelier_concierge_thread", {
      p_request_id: id, p_after_seq: snapshot.observed_message_seq, p_limit: 100,
    });
    if (page.observed_message_seq <= snapshot.observed_message_seq) throw new Error("ATELIER_CURSOR_STALLED");
    snapshot = { ...page, messages: [...snapshot.messages, ...page.messages] };
  }
  return snapshot;
}

export async function listAtelierConversations(staff: boolean, options: { status?: string; unread?: boolean; before?: string; beforeId?: string; page?: number } = {}) {
  await requireAtelierPage(staff);
  if (staff) return atelierRpc<{ conversations: AtelierConversation[]; has_more: boolean }>("get_atelier_concierge_inbox", {
    p_status: options.status || null, p_unread_only: Boolean(options.unread), p_before_activity_at: options.before || null,
    p_before_request_id: options.beforeId || null, p_limit: 30,
  });
  const client = await createServerSupabaseClient();
  const page = Math.max(0, Math.min(10000, options.page ?? 0));
  const result = await client.from("concierge_requests").select(CONCIERGE_COLUMNS, { count: "exact" })
    .order("last_message_at", { ascending: false, nullsFirst: false }).order("id", { ascending: false }).range(page * 30, page * 30 + 29);
  if (result.error) throw new Error("CONCIERGE_LIST_UNAVAILABLE");
  const conversations = (result.data ?? []) as unknown as AtelierConversation[];
  // Exact unread counts without downloading every message body. Bounded to one list page.
  const counts = await Promise.all(conversations.map(row => client.from("concierge_messages").select("id", { count: "exact", head: true })
    .eq("request_id", row.id).eq("sender_type", "concierge").gt("message_seq", row.client_read_seq)));
  if (counts.some(result => result.error)) throw new Error("CONCIERGE_UNREAD_UNAVAILABLE");
  return { conversations: conversations.map((row, index) => ({ ...row, unread_messages: counts[index].count ?? 0 })), has_more: (result.count ?? 0) > (page + 1) * 30 };
}
