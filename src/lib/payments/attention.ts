import type { PaymentRequest, PaymentSubmission } from "./manual";
export const PENDING_PAYMENT_STATUS = "awaiting_verification";

// No amount or balance inference. A cancelled request is not reviewable.
// The database currently enforces one pending submission per request; use IDs
// rather than row counts so repeated joins cannot inflate the indicator.
export function pendingPaymentSubmissions(requests: PaymentRequest[], submissions: PaymentSubmission[]) {
  const active = new Map(requests.filter(request => request.status === "active").map(request => [request.id, request]));
  return [...new Map(submissions.filter(submission => {
    const request = active.get(submission.request_id);
    return submission.status === PENDING_PAYMENT_STATUS && request &&
      submission.order_id === request.order_id && submission.customer_id === request.customer_id;
  }).map(submission => [submission.id, submission])).values()];
}

export function paymentAttentionByRequest(requests: PaymentRequest[], submissions: PaymentSubmission[]) {
  const grouped = new Map<string, PaymentSubmission[]>();
  for (const submission of pendingPaymentSubmissions(requests, submissions)) {
    grouped.set(submission.request_id, [...(grouped.get(submission.request_id) ?? []), submission]);
  }
  return grouped;
}

export function prioritizePaymentRequests(requests: PaymentRequest[], pending: Map<string, PaymentSubmission[]>, staff: boolean) {
  return [...requests].sort((a, b) => (staff ? Number(pending.has(b.id)) - Number(pending.has(a.id)) : 0) ||
    b.created_at.localeCompare(a.created_at) || a.id.localeCompare(b.id));
}
