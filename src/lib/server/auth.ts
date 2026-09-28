import "server-only";

import type { User } from "@supabase/supabase-js";
import type { AppRole, StaffRole, StaffStatus } from "@/lib/auth/roles";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export interface AuthenticatedActor {
  user: User;
  role: AppRole;
  staffStatus: StaffStatus | null;
  displayName: string;
}

interface StaffAccountRow {
  role: StaffRole;
  status: StaffStatus;
}

export async function getAuthenticatedActor(): Promise<AuthenticatedActor | null> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) return null;

  const [{ data: staff, error: staffError }, { data: profile, error: profileError }] =
    await Promise.all([
      supabase
        .from("staff_accounts")
        .select("role, status")
        .eq("user_id", user.id)
        .maybeSingle<StaffAccountRow>(),
      supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("id", user.id)
        .maybeSingle(),
    ]);

  if (staffError) {
    console.error("Staff authorization lookup failed", {
      code: staffError.code,
      message: staffError.message,
    });
    throw new Error("STAFF_AUTHORIZATION_UNAVAILABLE");
  }

  if (profileError) {
    console.error("Authenticated profile lookup failed", {
      code: profileError.code,
      message: profileError.message,
    });
  }

  const profileName = profile
    ? `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim()
    : "";

  return {
    user,
    role: staff?.role ?? "client",
    staffStatus: staff?.status ?? null,
    displayName: profileName || user.email || "TCC Account",
  };
}

export async function requireAuthenticatedCustomer() {
  const actor = await getAuthenticatedActor();
  if (!actor) throw new Error("AUTH_REQUIRED");
  if (actor.role !== "client") throw new Error("CUSTOMER_ACCESS_REQUIRED");
  return actor.user;
}

export async function requireStaff(options?: { ceoOnly?: boolean }) {
  const actor = await getAuthenticatedActor();
  if (!actor) throw new Error("AUTH_REQUIRED");
  if (
    actor.role === "client" ||
    actor.staffStatus !== "active" ||
    (options?.ceoOnly && actor.role !== "ceo")
  ) {
    throw new Error("STAFF_ACCESS_DENIED");
  }
  return actor;
}

export function toSafeServerError(error: unknown): string {
  if (error instanceof Error && error.message === "AUTH_REQUIRED") {
    return "Please sign in again to continue.";
  }
  if (error instanceof Error && error.name === "ServerConfigurationError") {
    return "This service is temporarily unavailable. Please contact TSquare directly.";
  }
  if (
    error instanceof Error &&
    (error.message === "CUSTOMER_ACCESS_REQUIRED" || error.message === "STAFF_ACCESS_DENIED")
  ) {
    return "This account is not authorized for that operation.";
  }
  return "We could not complete that request. Your changes have not been applied; please try again.";
}
