import "server-only";

import { getSupabaseAdminClient } from "./supabase-admin";

export async function createAppointmentChange(customerId: string, input: {
  appointmentId: string;
  changeType: "reschedule" | "cancellation";
  proposedDate?: string;
  proposedTime?: string;
  reason?: string;
}) {
  const { data, error } = await getSupabaseAdminClient().rpc("request_appointment_change", {
    p_customer_id: customerId,
    p_appointment_id: input.appointmentId,
    p_change_type: input.changeType,
    p_proposed_date: input.proposedDate ?? null,
    p_proposed_time: input.proposedTime ?? null,
    p_reason: input.reason ?? null,
  });
  if (error) throw error;
  return data;
}
