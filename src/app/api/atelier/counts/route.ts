import { atelierCountsResponse } from "@/lib/atelier-counts-response";
import { getAtelierCounts } from "@/lib/server/atelier-service";

export const dynamic = "force-dynamic";
export async function GET() {
  return atelierCountsResponse(getAtelierCounts);
}
