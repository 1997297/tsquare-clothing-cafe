import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAuthenticatedCustomer, requireStaff } from "@/lib/server/auth";
import type { BankSettings, FinancialSummary, PaymentWorkspace } from "@/lib/payments/manual";
import { readStablePaymentSnapshot } from "@/lib/payments/snapshot";

// Page through every matching row: PostgREST's response cap must never silently
// turn a partial payment history into an incorrect remaining balance.
async function readAll<T>(query: (start: number, end: number) => PromiseLike<{ data: unknown[] | null; error: unknown }>): Promise<T[]> {
  const rows: T[] = [];
  for (let start = 0; ; start += 500) {
    const result = await query(start, start + 499);
    if (result.error) throw result.error;
    const batch = (result.data ?? []) as T[];
    rows.push(...batch);
    if (batch.length < 500) return rows;
    if (rows.length >= 10000) throw new Error("PAYMENT_HISTORY_TOO_LARGE");
  }
}

export async function getPaymentWorkspace(staff: boolean, orderId?: string): Promise<PaymentWorkspace> {
  if (staff) await requireStaff(); else await requireAuthenticatedCustomer();
  const client = await createServerSupabaseClient();
  const orderQuery = () => {
    const q = client.from("orders").select("id,customer_id,order_reference,style_name,total_amount_minor,lock_version,status").order("id");
    return orderId ? q.eq("id", orderId) : q;
  };
  const requestQuery = () => {
    const q = client.from("payment_requests").select("*").order("id");
    return orderId ? q.eq("order_id", orderId) : q;
  };
  const submissionQuery = () => {
    const q = client.from("payment_submissions").select("*").order("id");
    return orderId ? q.eq("order_id", orderId) : q;
  };
  const paymentQuery = () => {
    const q = client.from("payments").select("id,order_id,customer_id,amount_minor,payment_request_id,submission_id,internal_reference,status,verified_at,created_at").order("id");
    return orderId ? q.eq("order_id", orderId) : q;
  };
  const { orders, data } = await readStablePaymentSnapshot(
    () => readAll<PaymentWorkspace["orders"][number]>((a, b) => orderQuery().range(a, b)),
    async (before) => {
      const [requests, submissions, payments, bankResult, customers, events, summary] = await Promise.all([
        readAll<PaymentWorkspace["requests"][number]>((a, b) => requestQuery().range(a, b)),
        readAll<PaymentWorkspace["submissions"][number]>((a, b) => submissionQuery().range(a, b)),
        readAll<PaymentWorkspace["payments"][number]>((a, b) => paymentQuery().range(a, b)),
        staff ? client.from("payment_bank_settings").select("id,bank_name,account_name,account_number,instructions,is_configured,lock_version,updated_at").eq("id", true).maybeSingle<BankSettings>() : Promise.resolve({ data: null, error: null }),
        staff ? readAll<PaymentWorkspace["customers"][number]>((a, b) => client.from("profiles").select("id,first_name,last_name,email").order("id").range(a, b)) : Promise.resolve([]),
        orderId ? readAll<PaymentWorkspace["events"][number]>((a, b) => client.from("lifecycle_events").select("id,entity_id,event_type,actor_type,metadata,created_at").eq("entity_type", "order").eq("entity_id", orderId).in("event_type", ["order_price_set", "payment_request_issued", "payment_request_cancelled", "payment_evidence_submitted", "payment_evidence_rejected", "payment_verified"]).order("id").range(a, b)) : Promise.resolve([]),
        orderId && before.length ? getOrderFinancials(orderId) : Promise.resolve(null),
      ]);
      if (bankResult.error) throw bankResult.error;
      return { requests, submissions, payments, customers, bank: bankResult.data, events, summary };
    },
  );
  for (const submission of data.submissions) {
    if (submission.status === "verified" && !data.payments.some(payment =>
      payment.id === submission.payment_id && payment.status === "successful" &&
      payment.submission_id === submission.id && payment.payment_request_id === submission.request_id &&
      payment.order_id === submission.order_id && payment.amount_minor > 0)) {
      throw new Error("INCOMPLETE_VERIFIED_PAYMENT_HISTORY");
    }
  }
  return { orders, ...data };
}

export async function getOrderFinancials(orderId: string): Promise<FinancialSummary> {
  // RPC itself authorizes ownership/active staff; callers also apply their route guard.
  const client = await createServerSupabaseClient();
  const { data, error } = await client.rpc("get_order_financials", { p_order_id: orderId });
  if (error) throw error;
  if (!data || data.order_id !== orderId) throw new Error("FINANCIAL_SUMMARY_UNAVAILABLE");
  for (const key of ["total_minor", "verified_minor", "pending_minor", "balance_minor", "reserved_minor", "requestable_minor"]) {
    if (data[key] !== null && (!Number.isSafeInteger(data[key]) || data[key] < 0)) throw new Error("INVALID_FINANCIAL_SUMMARY");
  }
  return data as FinancialSummary;
}

export async function getPaymentRequestWorkspace(id: string, staff: boolean) {
  if (staff) await requireStaff(); else await requireAuthenticatedCustomer();
  const client = await createServerSupabaseClient();
  const { data, error } = await client.from("payment_requests").select("order_id").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const workspace = await getPaymentWorkspace(staff, data.order_id);
  if (!workspace.summary) throw new Error("FINANCIAL_SUMMARY_UNAVAILABLE");
  return { workspace, summary: workspace.summary };
}
