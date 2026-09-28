import "server-only";

import { redirect } from "next/navigation";
import type { StaffRole } from "@/lib/auth/roles";
import { getAuthenticatedActor, type AuthenticatedActor } from "@/lib/server/auth";

type AuthorizedStaffActor = Omit<AuthenticatedActor, "role" | "staffStatus"> & {
  role: StaffRole;
  staffStatus: "active";
};

export async function requireAdminPageAccess(
  options?: { ceoOnly?: boolean }
): Promise<AuthorizedStaffActor> {
  let actor;

  try {
    actor = await getAuthenticatedActor();
  } catch {
    redirect("/auth/access-denied?reason=service");
  }

  if (!actor) redirect("/auth/sign-in?next=/admin");
  if (actor.staffStatus !== "active" || actor.role === "client") {
    redirect(
      actor.staffStatus === "inactive"
        ? "/auth/access-denied?reason=inactive"
        : "/auth/access-denied"
    );
  }
  if (options?.ceoOnly && actor.role !== "ceo") {
    redirect("/auth/access-denied");
  }

  return actor as AuthorizedStaffActor;
}
