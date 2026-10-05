import { getPaymentWorkspace } from "@/lib/server/manual-payments";
import { FinancialCards, PaymentHistory, PaymentActivity } from "./PaymentUI";
import { OrderPaymentForms } from "./PaymentForms";
import { PaymentList } from "./PaymentList";

export async function StaffOrderFinance({ orderId }: { orderId: string }) {
  const workspace = await getPaymentWorkspace(true, orderId);
  const summary = workspace.summary;
  const order = workspace.orders[0];
  if (!order || !summary) return null;
  return <div className="space-y-6"><FinancialCards summary={summary} /><OrderPaymentForms order={order} summary={summary} bank={workspace.bank} /><PaymentList workspace={workspace} staff orderOnly /><PaymentHistory workspace={workspace} /><PaymentActivity workspace={workspace} /></div>;
}
