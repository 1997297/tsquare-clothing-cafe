import "server-only";

import { getSupabaseAdminClient } from "./supabase-admin";

export async function createTrustedNotification(input: {
  customerId: string;
  type: string;
  title: string;
  message: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
}) {
  const { data, error } = await getSupabaseAdminClient()
    .from("notifications")
    .insert({
      customer_id: input.customerId,
      type: input.type,
      title: input.title,
      message: input.message,
      related_entity_type: input.relatedEntityType ?? null,
      related_entity_id: input.relatedEntityId ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}
