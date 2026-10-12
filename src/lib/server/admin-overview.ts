import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getAtelierCounts } from "@/lib/server/atelier-service";
import { requireStaff } from "@/lib/server/auth";
import { ORDER_ATTENTION_STATUSES, REQUEST_ATTENTION_STATUSES, type StaffAttentionCounts } from "@/lib/staff-attention";
import { PENDING_PAYMENT_STATUS } from "@/lib/payments/attention";

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
  attention: StaffAttentionCounts;
}

export async function getAdminOverviewData(): Promise<AdminOverviewData> {
  await requireStaff();
  const supabase = await createServerSupabaseClient();
  const [requests, orders, actionOrders, payments, atelier, activity] = await Promise.all([
    supabase
      .from("bespoke_requests")
      .select("id", { count: "exact", head: true })
      .in("status", REQUEST_ATTENTION_STATUSES),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .neq("status", "completed"),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .in("status", ORDER_ATTENTION_STATUSES),
    supabase
      .from("payment_submissions")
      .select("id,payment_requests!inner(status)", { count: "exact", head: true })
      .eq("status", PENDING_PAYMENT_STATUS)
      .eq("payment_requests.status", "active"),
    getAtelierCounts().catch(() => null),
    supabase
      .from("lifecycle_events")
      .select("id, entity_type, event_type, created_at")
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  const results = [requests, orders, actionOrders, payments, activity];
  const errors = results.flatMap((result) => result.error ? [result.error] : []);
  if (errors.length > 0) {
    console.error(
      "Admin overview query failed",
      errors.map((error) => ({ code: error.code }))
    );
  }

  return {
    attention: {
      requests: requests.error ? null : requests.count,
      orders: actionOrders.error ? null : actionOrders.count,
      payments: payments.error ? null : payments.count,
      appointments: atelier?.pending_appointments ?? null,
      concierge: atelier?.unread_concierge_conversations ?? null,
    },
    metrics: [
      { label: "Pending Requests", value: requests.error ? null : requests.count, detail: "Awaiting review or approved order conversion" },
      { label: "Active Orders", value: orders.error ? null : orders.count ?? 0, detail: "Not yet completed" },
      { label: "Payments Awaiting Verification", value: payments.error ? null : payments.count, detail: "Client evidence requiring staff review" },
      { label: "Pending Appointments", value: atelier?.pending_appointments ?? null, detail: "New visits and changes awaiting review" },
      { label: "Today's Appointments", value: atelier?.today_confirmed_appointments ?? null, detail: "Confirmed schedules in Nigeria time" },
      { label: "Unread Concierge Messages", value: atelier?.unread_concierge_messages ?? null, detail: "Client messages not yet read by TCC" },
    ],
    activity: activity.error
      ? []
      : (activity.data ?? []).map((item) => ({
          id: item.id,
          entityType: item.entity_type,
          eventType: item.event_type,
          createdAt: item.created_at,
        })),
    hasQueryError: errors.length > 0 || !atelier,
  };
}
