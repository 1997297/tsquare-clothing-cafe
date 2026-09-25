"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createPublicFittingRequest } from "@/lib/server/public-intake";
import { toSafeServerError } from "@/lib/server/auth";
import { validatePublicFitting } from "@/lib/validation";

export async function submitPublicFittingAction(input: unknown) {
  const valid = validatePublicFitting(input);
  if (!valid.success) return { ok: false as const, error: valid.error };
  try {
    let customerId: string | undefined;
    try {
      const supabase = await createServerSupabaseClient();
      const { data } = await supabase.auth.getUser();
      customerId = data.user?.id;
    } catch {
      customerId = undefined;
    }
    const request = await createPublicFittingRequest(valid.data, customerId);
    return {
      ok: true as const,
      id: request.id,
      appointmentId: request.appointment_id,
    };
  } catch (error) {
    return { ok: false as const, error: toSafeServerError(error) };
  }
}
