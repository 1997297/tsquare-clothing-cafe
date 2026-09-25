import "server-only";

import type { TrustedActor } from "./requests";
import { getSupabaseAdminClient } from "./supabase-admin";

export async function createWardrobeFromCompletedOrder(orderId: string, actor: TrustedActor) {
  const { data, error } = await getSupabaseAdminClient().rpc("create_wardrobe_for_completed_order", {
    p_order_id: orderId,
    p_actor_id: actor.id,
    p_actor_type: actor.type,
  });
  if (error) throw error;
  return data;
}
