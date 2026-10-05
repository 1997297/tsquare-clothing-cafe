import { getPaymentWorkspace } from "@/lib/server/manual-payments";
import { PaymentList } from "@/components/payments/PaymentList";
import { PaymentHistory } from "@/components/payments/PaymentUI";

export default async function AccountPaymentsPage() {
  const workspace = await getPaymentWorkspace(false);
  return <div className="space-y-7"><header className="border-b border-stone-800 pb-6"><p className="text-xs uppercase tracking-widest text-champagne">Private client payments</p><h1 className="mt-3 font-display text-3xl">Payments & transfers</h1><p className="mt-3 text-sm leading-6 text-stone-400">View TCC’s payment requests, transfer instructions and your verification history. Uploading a receipt does not mean the payment is verified.</p></header><PaymentList workspace={workspace} staff={false} /><PaymentHistory workspace={workspace} /></div>;
}
