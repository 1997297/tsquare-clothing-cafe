import { getAdminOrders } from "@/lib/server/atelier-workflow";
import { OrderManager } from "./OrderManager";

export default async function AdminOrdersPage() {
  const orders = await getAdminOrders();
  return <OrderManager orders={orders} />;
}
