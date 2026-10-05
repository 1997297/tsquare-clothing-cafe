import { requireStaff } from "@/lib/server/auth";
import { getPaymentWorkspace } from "@/lib/server/manual-payments";
import { BankSettingsForm } from "@/components/payments/PaymentForms";
import { PaymentList } from "@/components/payments/PaymentList";

export default async function AdminPaymentsPage() {
  const [actor, workspace] = await Promise.all([requireStaff(), getPaymentWorkspace(true)]);
  const pending = workspace.submissions.filter(s => s.status === "awaiting_verification").length;
  return <div className="space-y-7"><header className="border-b border-stone-800 pb-6"><p className="text-xs uppercase tracking-widest text-champagne">Financial control</p><h1 className="mt-3 font-display text-3xl">Payments</h1><p className="mt-3 text-sm text-stone-400">{pending} submission{pending === 1 ? "" : "s"} awaiting verification. Confirm incoming funds against bank records before marking them paid.</p></header><PaymentList workspace={workspace} staff /><BankSettingsForm bank={workspace.bank} ceo={actor.role === "ceo"} /></div>;
}
