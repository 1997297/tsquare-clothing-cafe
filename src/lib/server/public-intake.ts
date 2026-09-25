import "server-only";

import type { ContactEnquiryInput, PublicFittingInput } from "@/lib/validation";
import { getSupabaseAdminClient } from "./supabase-admin";

export async function createContactEnquiry(input: ContactEnquiryInput) {
  const { data, error } = await getSupabaseAdminClient()
    .from("contact_enquiries")
    .insert(input)
    .select("id")
    .single();
  if (error) throw error;
  return data;
}

export async function createPublicFittingRequest(input: PublicFittingInput, customerId?: string) {
  const { data, error } = await getSupabaseAdminClient()
    .rpc("submit_public_fitting_request", {
      p_customer_id: customerId ?? null,
      p_payload: {
        customer_name: input.customerName,
        email: input.email,
        phone: input.phone,
        appointment_type: input.appointmentType,
        preferred_date: input.date,
        preferred_time: input.time,
        notes: input.notes ?? null,
        style_reference: input.styleReference ?? null,
        is_existing_customer: input.isExistingCustomer,
      },
    });
  if (error) throw error;
  return data as { id: string; appointment_id: string | null };
}
