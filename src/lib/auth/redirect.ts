import { sanitizeInternalPath } from "@/lib/validation";

export function getSafeAuthRedirect(value: string | null | undefined): string {
  const path = sanitizeInternalPath(value, "/account");
  if (
    path === "/auth/sign-in" ||
    path === "/auth/create-account" ||
    path === "/auth/continue"
  ) {
    return "/account";
  }
  return path;
}
