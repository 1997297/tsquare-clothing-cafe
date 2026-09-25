import type { OrderPaymentPosition, PaymentRecord } from "@/types";
import type { PaymentProviderAdapter } from "./types";

export function formatNaira(amount: number | undefined | null): string {
  if (amount == null || !Number.isFinite(amount)) return "₦0";
  return `₦${Math.round(amount).toLocaleString("en-NG")}`;
}

export function calculateOrderPaymentPosition(
  totalAmount: number | undefined,
  payments: PaymentRecord[] = []
): OrderPaymentPosition {
  const orderTotal = typeof totalAmount === "number" && totalAmount > 0 ? Math.round(totalAmount) : 0;
  const amountPaid = payments
    .filter((payment) => payment.status === "successful")
    .reduce((sum, payment) => sum + Math.round(payment.amount), 0);
  const outstandingBalance = Math.max(0, orderTotal - amountPaid);
  const percentagePaid = orderTotal > 0 ? Math.min(100, Math.round((amountPaid / orderTotal) * 100)) : 0;
  const hasPending = payments.some((payment) => payment.status === "pending");
  const paymentStatus: OrderPaymentPosition["paymentStatus"] =
    orderTotal === 0
      ? "not_started"
      : amountPaid >= orderTotal
        ? "paid"
        : amountPaid > 0
          ? "partially_paid"
          : hasPending
            ? "pending"
            : "not_started";

  return {
    orderTotal,
    amountPaid,
    outstandingBalance,
    percentagePaid,
    percentageRemaining: 100 - percentagePaid,
    paymentStatus,
  };
}

export function validatePaymentAmount(amount: number, outstandingBalance: number) {
  if (!Number.isFinite(amount) || amount <= 0) {
    return { valid: false, error: "Please specify an amount greater than zero." };
  }
  if (outstandingBalance <= 0) {
    return { valid: false, error: "This bespoke commission has already been settled in full." };
  }
  if (amount > outstandingBalance) {
    return {
      valid: false,
      error: `Payment amount cannot exceed the outstanding balance of ${formatNaira(outstandingBalance)}.`,
    };
  }
  return { valid: true };
}

const unavailableAdapter: PaymentProviderAdapter = {
  name: "paystack",
  isConfigured: false,
  async initiate(_request, internalReference) {
    return {
      success: false,
      internalReference,
      provider: "paystack",
      requiresRedirect: false,
      error: "Online payments are not active yet.",
    };
  },
  async verify(reference) {
    return {
      verified: false,
      status: "failed",
      amount: 0,
      providerReference: reference,
      internalReference: "",
      error: "Online payments are not active yet.",
    };
  },
};

export function getActivePaymentProvider(): PaymentProviderAdapter {
  return unavailableAdapter;
}
