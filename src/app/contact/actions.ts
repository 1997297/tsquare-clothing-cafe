"use server";

import { createContactEnquiry } from "@/lib/server/public-intake";
import { toSafeServerError } from "@/lib/server/auth";
import { validateContactEnquiry } from "@/lib/validation";

export async function submitContactEnquiryAction(input: unknown) {
  const valid = validateContactEnquiry(input);
  if (!valid.success) return { ok: false as const, error: valid.error };
  try {
    const enquiry = await createContactEnquiry(valid.data);
    return { ok: true as const, id: enquiry.id as string };
  } catch (error) {
    return { ok: false as const, error: toSafeServerError(error) };
  }
}
