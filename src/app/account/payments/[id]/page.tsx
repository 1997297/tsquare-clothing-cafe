import { notFound, redirect } from "next/navigation";
import { getPaymentRequestWorkspace } from "@/lib/server/manual-payments";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { PaymentDetail } from "@/components/payments/PaymentDetail";
import LegacyPaymentReceipt, { type LegacyReceiptRecord } from "@/components/payments/LegacyPaymentReceipt";
import { requireAuthenticatedCustomer, getAuthenticatedActor } from "@/lib/server/auth";
import { isUuid } from "@/lib/validation";

export default async function AccountPaymentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireAuthenticatedCustomer();
  if (!id || id.length > 160) notFound();
  const data = isUuid(id) ? await getPaymentRequestWorkspace(id, false) : null;
  if (data) return <PaymentDetail {...data} requestId={id} staff={false} />;
  // Preserve bookmarks to the earlier verified-ledger receipt route.
  const client = await createServerSupabaseClient();
  const { data: payment, error } = await client.from("payments").select("id,order_id,amount_minor,internal_reference,type,provider_reference,paid_at,created_at,payment_request_id").eq(isUuid(id) ? "id" : "internal_reference", id).eq("customer_id", user.id).eq("status", "successful").maybeSingle<LegacyReceiptRecord & { order_id: string; payment_request_id: string | null }>();
  if (error) throw error;
  if (!payment) notFound();
  if (payment.payment_request_id) redirect(`/account/payments/${payment.payment_request_id}`);
  const [{ data: order, error: orderError }, actor] = await Promise.all([
    client.from("orders").select("id,order_reference,style_name").eq("id", payment.order_id).eq("customer_id", user.id).maybeSingle(),
    getAuthenticatedActor(),
  ]);
  if (orderError) throw orderError;
  return <LegacyPaymentReceipt payment={payment} order={order} clientName={actor?.displayName ?? "Private client"} />;
}
