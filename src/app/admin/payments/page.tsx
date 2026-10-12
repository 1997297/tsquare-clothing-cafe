import { requireStaff } from "@/lib/server/auth";
import { getPaymentWorkspace } from "@/lib/server/manual-payments";
import { BankSettingsForm } from "@/components/payments/PaymentForms";
import { PaymentList } from "@/components/payments/PaymentList";
import { pendingPaymentSubmissions } from "@/lib/payments/attention";

export default async function AdminPaymentsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const params = await searchParams;
  const [actor, workspace] = await Promise.all([requireStaff(), getPaymentWorkspace(true)]);
  const pending = pendingPaymentSubmissions(workspace.requests, workspace.submissions).length;
  const initialStatus = params.status === "pending" ? "pending" : "all";
  return <div className="space-y-7"><header className="border-b border-stone-800 pb-6"><h1 className="font-display text-3xl">Payments</h1><p className="mt-3 text-sm text-stone-400">{pending} submission{pending === 1 ? "" : "s"} awaiting verification. Confirm incoming funds against bank records before marking them paid.</p></header><PaymentList key={initialStatus} workspace={workspace} staff initialStatus={initialStatus} /><BankSettingsForm bank={workspace.bank} ceo={actor.role === "ceo"} /></div>;
}
