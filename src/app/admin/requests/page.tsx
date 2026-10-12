import { getAdminRequests } from "@/lib/server/atelier-workflow";
import { RequestManager } from "./RequestManager";

export default async function AdminRequestsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const initialFilter = (await searchParams).status === "attention" ? "attention" : "all";
  const requests = await getAdminRequests();
  return <RequestManager key={initialFilter} requests={requests} initialFilter={initialFilter} />;
}
