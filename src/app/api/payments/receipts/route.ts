import { createHash } from "node:crypto";
import { requireAuthenticatedCustomer } from "@/lib/server/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/server/supabase-admin";
import { RECEIPT_MAX_BYTES, validateReceiptBytes } from "@/lib/payments/receipt-validation";
import { isUuid } from "@/lib/validation";

export const runtime = "nodejs";
const headers = { "Cache-Control": "private, no-store" };
const fail = (error: string, status = 400) => Response.json({ error }, { status, headers });

export async function POST(request: Request) {
  // Cookie-authenticated upload endpoint; do not accept cross-site form posts.
  if (request.headers.get("origin") !== new URL(request.url).origin) return fail("Invalid request origin.", 403);
  let uploadedPath: string | null = null;
  try {
    const user = await requireAuthenticatedCustomer();
    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.startsWith("multipart/form-data;")) return fail("Choose a receipt file.");
    const limit = RECEIPT_MAX_BYTES + 64 * 1024;
    if (Number(request.headers.get("content-length")) > limit) return fail("Receipt must be no larger than 3 MB.", 413);
    // Bound streamed/chunked bodies too, before allocating multipart contents.
    const reader = request.body?.getReader();
    if (!reader) return fail("Choose a receipt file.");
    const chunks: Uint8Array[] = [];
    let size = 0;
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) { await reader.cancel(); return fail("Receipt must be no larger than 3 MB.", 413); }
      chunks.push(value);
    }
    const body = Buffer.concat(chunks);
    const form = await new Response(body, { headers: { "Content-Type": contentType } }).formData();
    const requestId = form.get("requestId");
    const uploadKey = form.get("uploadKey");
    const file = form.get("receipt");
    if (typeof requestId !== "string" || !isUuid(requestId) || typeof uploadKey !== "string" || !isUuid(uploadKey) || !(file instanceof File)) return fail("Choose a receipt for a valid payment request.");
    const bytes = new Uint8Array(await file.arrayBuffer());
    let extension: string;
    try { extension = validateReceiptBytes(file.name, file.type, bytes); }
    catch (error) { return fail(error instanceof Error ? error.message : "Invalid receipt."); }
    const client = await createServerSupabaseClient();
    const { data: owned, error: ownershipError } = await client.from("payment_requests").select("id,status").eq("id", requestId).eq("customer_id", user.id).maybeSingle();
    if (ownershipError) throw ownershipError;
    if (!owned || owned.status !== "active") return fail("This payment request is not available for receipt submission.", 403);
    const path = `${user.id}/${requestId}/${uploadKey}.${extension}`;
    const digest = createHash("sha256").update(bytes).digest("hex");
    const admin = getSupabaseAdminClient();
    const bucket = admin.storage.from("payment-receipts");
    const { error: uploadError } = await bucket.upload(path, bytes, { contentType: file.type, upsert: false });
    if (uploadError) {
      // Retried uploads reuse their UUID. Never overwrite a prior receipt. Compare
      // actual bytes before allowing registration of a previously uploaded object.
      if (!/already exists|duplicate/i.test(uploadError.message)) throw uploadError;
      const { data: existing, error: downloadError } = await bucket.download(path);
      if (downloadError || !existing || existing.type !== file.type || existing.size !== bytes.length || createHash("sha256").update(new Uint8Array(await existing.arrayBuffer())).digest("hex") !== digest) return fail("This upload attempt already contains a different receipt. Select the file again.", 409);
    }
    uploadedPath = path;
    const { data, error } = await admin.rpc("register_payment_receipt", { p_customer_id: user.id, p_request_id: requestId, p_storage_path: path, p_mime_type: file.type, p_size_bytes: bytes.length, p_sha256: digest });
    if (error) throw error;
    if (!data?.id || !isUuid(data.id)) throw new Error("RECEIPT_REGISTRATION_UNCONFIRMED");
    return Response.json({ receiptId: data.id }, { headers });
  } catch (error) {
    // Do not delete on an ambiguous registration timeout: it may already be used.
    // A retry of the same upload key safely reconciles the same immutable object.
    console.error("Private receipt upload failed", { registeredOrRetryable: Boolean(uploadedPath), code: error && typeof error === "object" && "code" in error ? error.code : "upload_or_auth" });
    if (error instanceof Error && /AUTH_REQUIRED|CUSTOMER_ACCESS_REQUIRED/.test(error.message)) return fail("Sign in with your client account to upload a receipt.", 401);
    return fail("We could not confirm the upload. Retry with the same file; your payment has not been verified.", 503);
  }
}
