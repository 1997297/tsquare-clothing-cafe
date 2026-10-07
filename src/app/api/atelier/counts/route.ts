import { NextResponse } from "next/server";
import { getAtelierCounts } from "@/lib/server/atelier-service";

export const dynamic = "force-dynamic";
export async function GET() {
  try { return NextResponse.json(await getAtelierCounts(), { headers: { "Cache-Control": "private, no-store" } }); }
  catch { return NextResponse.json({ error: "Atelier counts unavailable" }, { status: 503, headers: { "Cache-Control": "private, no-store" } }); }
}
