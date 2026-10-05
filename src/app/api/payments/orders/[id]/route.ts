import { requireAuthenticatedCustomer } from "@/lib/server/auth";
import { getPaymentWorkspace } from "@/lib/server/manual-payments";
import { isUuid } from "@/lib/validation";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const headers = { "Cache-Control": "private, no-store" };
  try {
    await requireAuthenticatedCustomer();
    const { id } = await params;
    if (!isUuid(id)) return Response.json({ error: "Not found" }, { status: 404, headers });
    const workspace = await getPaymentWorkspace(false, id);
    if (!workspace.orders.length) return Response.json({ error: "Not found" }, { status: 404, headers });
    const summary = workspace.summary;
    if (!summary) throw new Error("FINANCIAL_SUMMARY_UNAVAILABLE");
    return Response.json({ workspace, summary }, { headers });
  } catch {
    return Response.json({ error: "Financial details are temporarily unavailable. Please try again." }, { status: 503, headers });
  }
}
