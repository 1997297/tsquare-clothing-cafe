import "server-only";

import { getSupabaseAdminClient } from "./supabase-admin";

export interface PaymentProvider {
  readonly name: string;
  readonly isConfigured: boolean;
  initializePayment(input: { orderId: string; amountMinor: number; email: string }): Promise<{
    checkoutUrl: string;
    providerReference: string;
  }>;
  verifyPayment(providerReference: string): Promise<unknown>;
  handleWebhook(payload: unknown, signature: string | null): Promise<unknown>;
  normalizeProviderEvent(payload: unknown): unknown;
}

export class PaymentProviderUnavailableError extends Error {
  constructor() {
    super("Online payment is not currently active. Please contact TSquare for settlement options.");
    this.name = "PaymentProviderUnavailableError";
  }
}

export const unavailablePaymentProvider: PaymentProvider = {
  name: "unconfigured",
  isConfigured: false,
  async initializePayment() { throw new PaymentProviderUnavailableError(); },
  async verifyPayment() { throw new PaymentProviderUnavailableError(); },
  async handleWebhook() { throw new PaymentProviderUnavailableError(); },
  normalizeProviderEvent() { throw new PaymentProviderUnavailableError(); },
};

export async function initializeCustomerPayment(customerId: string, input: { orderId: string; amountMinor: number }) {
  const admin = getSupabaseAdminClient();
  const { data: order, error } = await admin
    .from("orders")
    .select("id, customer_id, total_amount_minor")
    .eq("id", input.orderId)
    .eq("customer_id", customerId)
    .single();
  if (error || !order) throw new Error("Order not found");
  const totalMinor = Number(order.total_amount_minor);
  if (!Number.isSafeInteger(totalMinor) || totalMinor <= 0) {
    throw new Error("Order total is unavailable");
  }
  const { data: successfulPayments, error: paymentError } = await admin
    .from("payments")
    .select("amount_minor")
    .eq("order_id", order.id)
    .eq("status", "successful");
  if (paymentError) throw paymentError;
  const paidMinor = (successfulPayments ?? []).reduce(
    (sum, payment) => sum + Number(payment.amount_minor),
    0
  );
  const outstandingMinor = totalMinor - paidMinor;
  if (input.amountMinor > outstandingMinor) throw new Error("Payment amount exceeds the outstanding balance");
  if (!unavailablePaymentProvider.isConfigured) throw new PaymentProviderUnavailableError();
  return unavailablePaymentProvider.initializePayment({ orderId: order.id, amountMinor: input.amountMinor, email: "" });
}
