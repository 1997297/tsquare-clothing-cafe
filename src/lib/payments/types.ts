import { PaymentType } from "@/types";

export interface PaymentInitiationRequest {
  orderId: string;
  customerId: string;
  amount: number;
  type: PaymentType;
  customerEmail: string;
  customerName: string;
  callbackUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface PaymentInitiationResult {
  success: boolean;
  internalReference: string;
  provider: "paystack" | "flutterwave" | "manual_transfer" | "atelier_terminal";
  providerReference?: string;
  checkoutUrl?: string;
  requiresRedirect: boolean;
  instructions?: string;
  error?: string;
}

export interface PaymentVerificationResult {
  verified: boolean;
  status: "successful" | "failed" | "pending";
  amount: number;
  providerReference: string;
  internalReference: string;
  paidAt?: string;
  error?: string;
}

export interface PaymentProviderAdapter {
  name: "paystack" | "flutterwave" | "manual_transfer" | "atelier_terminal";
  isConfigured: boolean;
  initiate(req: PaymentInitiationRequest, internalRef: string): Promise<PaymentInitiationResult>;
  verify(reference: string): Promise<PaymentVerificationResult>;
}
