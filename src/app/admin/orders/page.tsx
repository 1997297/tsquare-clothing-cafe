import { getAdminOrders } from "@/lib/server/atelier-workflow";
import { OrderManager } from "./OrderManager";

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const initialFilter = (await searchParams).status === "attention" ? "attention" : "all";
  const orders = await getAdminOrders();
  return <OrderManager key={initialFilter} orders={orders} initialFilter={initialFilter} />;
}
