import { notFound } from "next/navigation";
import { getPaymentRequestWorkspace } from "@/lib/server/manual-payments";
import { PaymentDetail } from "@/components/payments/PaymentDetail";
import { isUuid } from "@/lib/validation";

export default async function AdminPaymentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const data = await getPaymentRequestWorkspace(id, true);
  if (!data) notFound();
  return <PaymentDetail {...data} requestId={id} staff />;
}
