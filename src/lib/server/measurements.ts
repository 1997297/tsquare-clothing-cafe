import "server-only";

import { getSupabaseAdminClient } from "./supabase-admin";
import type { MeasurementVersionInput } from "@/lib/validation";

export async function createMeasurementVersion(customerId: string, input: MeasurementVersionInput) {
  const { data, error } = await getSupabaseAdminClient().rpc("create_customer_measurement_version", {
    p_customer_id: customerId,
    p_unit: input.unit,
    p_fit_preference: input.fitPreference ?? null,
    p_measurements: input.measurements,
    p_notes: input.notes ?? null,
  });
  if (error) throw error;
  return data;
}
