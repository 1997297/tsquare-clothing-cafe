import { getAuthenticatedActor } from "@/lib/server/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/validation";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const headers = { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" };
  try {
    const actor = await getAuthenticatedActor();
    if (!actor || (actor.role !== "client" && actor.staffStatus !== "active")) return new Response("Not authorized", { status: 401, headers });
    const { id } = await params;
    if (!isUuid(id)) return new Response("Not found", { status: 404, headers });
    const client = await createServerSupabaseClient();
    // RLS checks both receipt metadata and Storage object access using this user.
    // Never sign with service-role credentials.
    const { data, error } = await client.from("payment_receipts").select("storage_path").eq("id", id).maybeSingle();
    if (error) throw error;
    if (!data) return new Response("Not found", { status: 404, headers });
    const { data: signed, error: signError } = await client.storage.from("payment-receipts").createSignedUrl(data.storage_path, 60, { download: true });
    if (signError || !signed?.signedUrl) throw signError ?? new Error("SIGNING_FAILED");
    return new Response(null, { status: 303, headers: { ...headers, Location: signed.signedUrl } });
  } catch {
    return new Response("Receipt is temporarily unavailable. Please try again.", { status: 503, headers });
  }
}
