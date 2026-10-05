"use server";

import { revalidatePath } from "next/cache";
import { requireAuthenticatedCustomer, requireStaff, toSafeServerError } from "@/lib/server/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/validation";
import { parseNairaInput } from "@/lib/payments/money";
import { PAYMENT_PURPOSES } from "@/lib/payments/manual";

export type PaymentActionResult = { success: true } | { success: false; error: string };
type Input = Record<string, unknown>;
class InputError extends Error {}
function text(input: Input, key: string, max = 2000, min = 0) {
  const value = typeof input[key] === "string" ? input[key].trim() : "";
  if (value.length < min || value.length > max) throw new InputError(`Check ${key.replace(/([A-Z])/g, " $1").toLowerCase()} (${min}–${max} characters).`);
  return value;
}
function uuid(input: Input, key: string) {
  const value = text(input, key, 36, 36);
  if (!isUuid(value)) throw new InputError("Refresh this record and try again.");
  return value;
}
function version(input: Input) {
  if (!Number.isSafeInteger(input.expectedVersion) || Number(input.expectedVersion) < 1) throw new InputError("Refresh this record before making changes.");
  return input.expectedVersion as number;
}
function amount(input: Input) {
  let minor: number;
  try { minor = parseNairaInput(text(input, "amount", 20, 1)); }
  catch { throw new InputError("Enter a positive Naira amount, with no commas and at most two decimals."); }
  if (minor <= 0) throw new InputError("Amount must be greater than zero.");
  return minor;
}
function date(input: Input, key: string, required = false) {
  const value = text(input, key, 10, required ? 10 : 0);
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0, 10) !== value) throw new InputError("Enter a valid calendar date.");
  return value;
}
function safeError(error: unknown) {
  if (error instanceof InputError) return error.message;
  const message = error && typeof error === "object" && "message" in error ? String(error.message).toLowerCase() : "";
  if (/stale|version/.test(message)) return "This record changed. Refresh it before continuing.";
  if (message.includes("invalid_bank_details")) return "Enter the official bank name, account name and valid 10-digit number. Placeholder details cannot be used.";
  if (message.includes("price_below_commitments")) return "The price cannot be lower than verified funds plus outstanding payment requests.";
  if (message.includes("invalid_transfer_date")) return "Use a transfer date from 1 January 2000 through today.";
  if (message.includes("submission_already_reviewed")) return "This submission has already been reviewed. Refresh to see the decision.";
  if (/bank|configured/.test(message)) return "The CEO must save valid official bank details before payment can be requested.";
  if (/balance|exceed|reserved|remaining|total below/.test(message)) return "The amount exceeds the available order/request balance or conflicts with existing requests. Refresh and check the totals.";
  if (/duplicate|reference.*used|already.*verif/.test(message)) return "This transfer or submission has already been recorded. Refresh to check its history.";
  if (/pending|awaiting/.test(message)) return "This request already has evidence awaiting review. Wait for TCC's decision.";
  if (/cancel|state|eligible|active request/.test(message)) return "This request is no longer eligible for that action. Refresh to check its status.";
  if (/operation|idempot/.test(message)) return "The retry does not match the original action. Refresh and check the history before continuing.";
  return toSafeServerError(error);
}
async function execute(input: unknown, role: "client" | "staff" | "ceo", rpc: string, parameters: (record: Input) => Input): Promise<PaymentActionResult> {
  try {
    if (role === "client") await requireAuthenticatedCustomer(); else await requireStaff({ ceoOnly: role === "ceo" });
    if (!input || typeof input !== "object" || Array.isArray(input)) throw new InputError("Invalid payment request.");
    const record = input as Input;
    const args = { ...parameters(record), p_operation_key: uuid(record, "operationKey") };
    const client = await createServerSupabaseClient();
    const { error } = await client.rpc(rpc, args);
    if (error) throw error;
    // Invalidate nested financial pages too; existing client order/dashboard readers
    // also reload their uncached financial endpoint when mounted/focused.
    revalidatePath("/account", "layout");
    revalidatePath("/admin", "layout");
    return { success: true };
  } catch (error) {
    console.error("Payment operation failed", { rpc, code: error && typeof error === "object" && "code" in error ? error.code : "validation_or_auth" });
    return { success: false, error: safeError(error) };
  }
}
export async function setBankAction(input: unknown) {
  return execute(input, "ceo", "set_payment_bank_details", r => {
    const accountNumber = text(r, "accountNumber", 10, 10);
    if (!/^\d{10}$/.test(accountNumber) || /^(\d)\1{9}$/.test(accountNumber)) throw new InputError("Enter the official 10-digit account number, not placeholder digits.");
    return { p_bank_name: text(r, "bankName", 120, 2), p_account_name: text(r, "accountName", 160, 2), p_account_number: accountNumber, p_instructions: text(r, "instructions"), p_expected_version: version(r) };
  });
}
export async function setPriceAction(input: unknown) {
  return execute(input, "staff", "set_order_agreed_total", r => ({ p_order_id: uuid(r, "orderId"), p_amount_minor: amount(r), p_reason: text(r, "reason", 2000, 3), p_expected_version: version(r) }));
}
export async function issuePaymentAction(input: unknown) {
  return execute(input, "staff", "issue_payment_request", r => {
    const purpose = text(r, "purpose", 30, 1);
    if (!Object.hasOwn(PAYMENT_PURPOSES, purpose)) throw new InputError("Select a payment purpose.");
    return { p_order_id: uuid(r, "orderId"), p_amount_minor: amount(r), p_purpose: purpose, p_note: text(r, "note"), p_due_date: date(r, "dueDate"), p_expected_version: version(r) };
  });
}
export async function cancelPaymentAction(input: unknown) {
  return execute(input, "staff", "cancel_payment_request", r => ({ p_request_id: uuid(r, "requestId"), p_reason: text(r, "reason", 2000, 3), p_expected_version: version(r) }));
}
export async function submitEvidenceAction(input: unknown) {
  return execute(input, "client", "submit_payment_evidence", r => {
    const transferDate = date(r, "transferDate", true)!;
    if (transferDate > new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Lagos", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date())) throw new InputError("Transfer date cannot be in the future.");
    return { p_request_id: uuid(r, "requestId"), p_reported_amount_minor: amount(r), p_transfer_date: transferDate, p_transaction_reference: text(r, "transactionReference", 160, 3), p_receipt_id: uuid(r, "receiptId"), p_client_note: text(r, "note") };
  });
}
export async function reviewPaymentAction(input: unknown) {
  return execute(input, "staff", "review_payment_submission", r => {
    const decision = text(r, "decision", 6, 6);
    if (decision !== "verify" && decision !== "reject") throw new InputError("Choose verify or reject.");
    return { p_submission_id: uuid(r, "submissionId"), p_decision: decision, p_verified_amount_minor: decision === "verify" ? amount(r) : null, p_reason: text(r, "reason", 2000, decision === "reject" ? 3 : 0) };
  });
}
