import "server-only";

import { getSupabaseAdminClient } from "./supabase-admin";

export async function createConciergeThread(customerId: string, payload: Record<string, string | undefined>) {
  const { data, error } = await getSupabaseAdminClient().rpc("create_customer_concierge_request", {
    p_customer_id: customerId,
    p_payload: payload,
  });
  if (error) throw error;
  return data;
}

export async function addConciergeCustomerMessage(customerId: string, requestId: string, message: string) {
  const { data, error } = await getSupabaseAdminClient().rpc("add_customer_concierge_message", {
    p_customer_id: customerId,
    p_request_id: requestId,
    p_message: message,
  });
  if (error) throw error;
  return data;
}
