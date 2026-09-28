export type StaffRole = "admin" | "ceo";
export type AppRole = "client" | StaffRole;
export type StaffStatus = "active" | "inactive";

export interface StaffAuthorization {
  role: StaffRole;
  status: StaffStatus;
}

export function isStaffRole(role: AppRole): role is StaffRole {
  return role === "admin" || role === "ceo";
}

export function getRoleLabel(role: AppRole): string {
  if (role === "ceo") return "CEO / Super Admin";
  if (role === "admin") return "Admin";
  return "Client";
}

export function getPostAuthDestination(
  requestedPath: string,
  role: AppRole,
  staffStatus: StaffStatus | null
): string {
  if (isStaffRole(role)) {
    if (staffStatus !== "active") return "/auth/access-denied?reason=inactive";
    return requestedPath.startsWith("/admin") ? requestedPath : "/admin";
  }

  if (requestedPath.startsWith("/admin")) {
    return "/auth/access-denied";
  }

  return requestedPath;
}
