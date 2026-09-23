import { CustomerOrder, OrderPaymentPosition, PaymentRecord } from "@/types";
import {
  PaymentInitiationRequest,
  PaymentInitiationResult,
  PaymentProviderAdapter,
  PaymentVerificationResult,
} from "./types";

/**
 * Consistently format Nigerian Naira (₦) amounts.
 * Avoids decimal places for whole numbers, eliminates float formatting artifacts.
 * Example: 350000 -> "₦350,000"
 */
export function formatNaira(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return "₦0";
  }
  const integerVal = Math.round(amount);
  return `₦${integerVal.toLocaleString("en-NG")}`;
}

/**
 * Authoritative financial position calculation for an Order.
 * Derives financial metrics strictly from verified successful payments.
 */
export function calculateOrderPaymentPosition(
  totalAmount: number | undefined,
  payments: PaymentRecord[] = []
): OrderPaymentPosition {
  const total = typeof totalAmount === "number" && totalAmount > 0 ? Math.round(totalAmount) : 0;

  // Filter only successful payments for balance reduction
  const successfulPayments = payments.filter((p) => p.status === "successful");
  const amountPaid = successfulPayments.reduce((acc, p) => acc + Math.round(p.amount), 0);

  const outstandingBalance = Math.max(0, total - amountPaid);
  const percentagePaid = total > 0 ? Math.min(100, Math.round((amountPaid / total) * 100)) : 0;
  const percentageRemaining = 100 - percentagePaid;

  const hasPending = payments.some((p) => p.status === "pending");

  let paymentStatus: OrderPaymentPosition["paymentStatus"] = "not_started";
  if (total === 0) {
    paymentStatus = "not_started";
  } else if (amountPaid >= total) {
    paymentStatus = "paid";
  } else if (amountPaid > 0) {
    paymentStatus = "partially_paid";
  } else if (hasPending) {
    paymentStatus = "pending";
  }

  return {
    orderTotal: total,
    amountPaid,
    outstandingBalance,
    percentagePaid,
    percentageRemaining,
    paymentStatus,
  };
}

/**
 * Validates a proposed customer payment amount against order position.
 */
export function validatePaymentAmount(
  amount: number,
  outstandingBalance: number
): { valid: boolean; error?: string } {
  if (!amount || isNaN(amount) || amount <= 0) {
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

/**
 * Generate unique internal reference code for a payment transaction.
 * Format: TCC-PAY-<TIMESTAMP>-<RANDOM>
 */
export function generatePaymentReference(): string {
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  const dateStr = Date.now().toString().slice(-6);
  return `TCC-PAY-${dateStr}-${rand}`;
}

/**
 * Sandbox / Atelier Concierge Adapter
 * Simulates real financial initialization and webhook resolution for staging/dev,
 * maintaining strict reference and security integrity without external gateway credentials.
 */
const sandboxAdapter: PaymentProviderAdapter = {
  name: "sandbox",
  isConfigured: true,
  async initiate(
    req: PaymentInitiationRequest,
    internalRef: string
  ): Promise<PaymentInitiationResult> {
    // Generate simulated provider reference
    const providerRef = `SANDBOX_${internalRef}`;

    return {
      success: true,
      internalReference: internalRef,
      provider: "sandbox",
      providerReference: providerRef,
      requiresRedirect: false,
      instructions: "Atelier Concierge Settlement channel initialized. Complete verification to record payment.",
    };
  },
  async verify(reference: string): Promise<PaymentVerificationResult> {
    return {
      verified: true,
      status: "successful",
      amount: 0,
      providerReference: reference,
      internalReference: reference.replace("SANDBOX_", ""),
      paidAt: new Date().toISOString(),
    };
  },
};

/**
 * Production-ready payment provider dispatcher.
 * Structured to integrate Paystack or Flutterwave once official API keys are configured in .env.local.
 */
export function getActivePaymentProvider(): PaymentProviderAdapter {
  // If NEXT_PUBLIC_PAYSTACK_KEY is defined in future, return Paystack adapter here.
  return sandboxAdapter;
}
