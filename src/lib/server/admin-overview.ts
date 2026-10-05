import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";

export interface AdminOverviewMetric {
  label: string;
  value: number | null;
  detail: string;
}

export interface AdminActivityItem {
  id: string;
  entityType: string;
  eventType: string;
  createdAt: string;
}

export interface AdminOverviewData {
  metrics: AdminOverviewMetric[];
  activity: AdminActivityItem[];
  hasQueryError: boolean;
}

export async function getAdminOverviewData(): Promise<AdminOverviewData> {
  const supabase = await createServerSupabaseClient();
  const today = new Date().toISOString().slice(0, 10);

  const [requests, orders, payments, appointments, concierge, activity] = await Promise.all([
    supabase
      .from("bespoke_requests")
      .select("id", { count: "exact", head: true })
      .in("status", ["submitted", "under_review", "needs_clarification", "pricing_ready"]),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .neq("status", "completed"),
    supabase
      .from("payment_submissions")
      .select("id", { count: "exact", head: true })
      .eq("status", "awaiting_verification"),
    supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .in("status", ["requested", "scheduled", "confirmed"])
      .gte("preferred_date", today),
    supabase
      .from("concierge_requests")
      .select("id", { count: "exact", head: true })
      .in("status", ["open", "in_review", "awaiting_customer"]),
    supabase
      .from("lifecycle_events")
      .select("id, entity_type, event_type, created_at")
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  const results = [requests, orders, payments, appointments, concierge, activity];
  const errors = results.flatMap((result) => result.error ? [result.error] : []);
  if (errors.length > 0) {
    console.error(
      "Admin overview query failed",
      errors.map((error) => ({ code: error.code, message: error.message }))
    );
  }

  return {
    metrics: [
      { label: "Pending Requests", value: requests.error ? null : requests.count ?? 0, detail: "Awaiting atelier action" },
      { label: "Active Orders", value: orders.error ? null : orders.count ?? 0, detail: "Not yet completed" },
      { label: "Payments Awaiting Verification", value: payments.error ? null : payments.count ?? 0, detail: "Client evidence requiring staff review" },
      { label: "Appointments", value: appointments.error ? null : appointments.count ?? 0, detail: "Upcoming and active" },
      { label: "Concierge", value: concierge.error ? null : concierge.count ?? 0, detail: "Open conversations" },
    ],
    activity: activity.error
      ? []
      : (activity.data ?? []).map((item) => ({
          id: item.id,
          entityType: item.entity_type,
          eventType: item.event_type,
          createdAt: item.created_at,
        })),
    hasQueryError: errors.length > 0,
  };
}
