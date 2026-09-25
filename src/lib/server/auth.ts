import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function requireAuthenticatedCustomer() {
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error("AUTH_REQUIRED");
  return user;
}

export function toSafeServerError(error: unknown): string {
  if (error instanceof Error && error.message === "AUTH_REQUIRED") {
    return "Please sign in again to continue.";
  }
  if (error instanceof Error && error.name === "ServerConfigurationError") {
    return "This service is temporarily unavailable. Please contact TSquare directly.";
  }
  return "We could not complete that request. Your changes have not been applied; please try again.";
}
