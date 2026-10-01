import { getAdminRequests } from "@/lib/server/atelier-workflow";
import { RequestManager } from "./RequestManager";

export default async function AdminRequestsPage() {
  const requests = await getAdminRequests();
  return <RequestManager requests={requests} />;
}
