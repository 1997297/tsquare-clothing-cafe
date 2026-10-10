import type { PaymentType } from "@/types";

export const PAYMENT_PURPOSES: Record<PaymentType, string> = {
  deposit: "Deposit", installment: "Instalment", final_payment: "Balance",
  full_payment: "Full payment", adjustment: "Additional payment",
};
export interface BankDetails {
  bank_name: string; account_name: string; account_number: string; instructions: string;
}
export interface BankSettings extends BankDetails {
  id: boolean; is_configured: boolean; lock_version: number; updated_at: string;
}
export interface FinancialSummary {
  order_id: string; total_minor: number | null; verified_minor: number;
  pending_minor: number; balance_minor: number | null; reserved_minor: number;
  requestable_minor: number | null; fully_paid: boolean;
}
export interface PaymentOrder {
  id: string; customer_id: string; order_reference: string; style_name: string;
  total_amount_minor: number | null; lock_version: number; status: string;
}
export interface PaymentRequest {
  id: string; order_id: string; customer_id: string; request_reference: string;
  requested_amount_minor: number; purpose: PaymentType; note: string | null;
  due_date: string | null; bank_snapshot: BankDetails; status: "active" | "cancelled";
  lock_version: number; created_at: string; cancelled_reason: string | null;
}
export interface PaymentSubmission {
  id: string; request_id: string; order_id: string; customer_id: string;
  reported_amount_minor: number; transfer_date: string; transaction_reference: string;
  receipt_id: string; client_note: string | null;
  status: "awaiting_verification" | "verified" | "rejected";
  reviewed_by: string | null; reviewed_at: string | null;
  rejection_reason: string | null; payment_id: string | null; created_at: string;
}
export interface VerifiedPayment {
  id: string; order_id: string; customer_id: string; amount_minor: number;
  payment_request_id: string | null; submission_id: string | null;
  internal_reference: string; status: string; verified_at: string | null; created_at: string;
}
export interface PaymentEvent {
  id: string; entity_id: string; event_type: string; actor_type: string;
  metadata: Record<string, unknown>; created_at: string;
}
export interface PaymentWorkspace {
  orders: PaymentOrder[]; requests: PaymentRequest[]; submissions: PaymentSubmission[];
  payments: VerifiedPayment[]; customers: { id: string; first_name: string; last_name: string; email: string }[];
  bank: BankSettings | null; events: PaymentEvent[];
  summary: FinancialSummary | null;
  financials: Record<string, FinancialSummary>;
}
export function requestOrderSummary(request: PaymentRequest, financials: Record<string, FinancialSummary>) {
  const summary = financials[request.order_id];
  return summary?.order_id === request.order_id ? summary : null;
}
export function requestPosition(request: PaymentRequest, payments: VerifiedPayment[], submissions: PaymentSubmission[]) {
  const verified = payments.filter(p => p.payment_request_id === request.id && p.status === "successful")
    .reduce((sum, p) => sum + p.amount_minor, 0);
  const pending = submissions.filter(s => s.request_id === request.id && s.status === "awaiting_verification")
    .reduce((sum, s) => sum + s.reported_amount_minor, 0);
  const remaining = request.requested_amount_minor - verified;
  const status = request.status === "cancelled" ? "Cancelled" : remaining === 0 ? "Satisfied"
    : pending > 0 ? "Awaiting verification" : verified > 0 ? "Partially satisfied" : "Awaiting transfer";
  return { verified, pending, remaining, status };
}
export function paymentPercent(total: number | null, verified: number) {
  // Floor to hundredths: a near-complete balance must never display 100% paid.
  if (!total || total <= 0) return 0;
  return Number((BigInt(verified) * BigInt(10000)) / BigInt(total)) / 100;
}
