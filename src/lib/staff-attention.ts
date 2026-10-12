// Shared by authorized server counts and the destination filters. These are
// decisions, not a count of every unfinished production or financial record.
export const REQUEST_ATTENTION_STATUSES = ["submitted", "under_review", "confirmed"];
export const ORDER_ATTENTION_STATUSES = ["order_confirmed", "ready"];

export interface StaffAttentionCounts {
  requests: number | null;
  orders: number | null;
  payments: number | null;
  appointments: number | null;
  concierge: number | null;
}

export function attentionLabel(label: string, count: number | null) {
  if (count === null) return `${label} — attention count unavailable`;
  return `${label} — ${count} ${count === 1 ? "item needs" : "items need"} attention`;
}

export function attentionBadge(count: number | null) {
  return count !== null && count > 0 ? (count > 99 ? "99+" : String(count)) : null;
}
