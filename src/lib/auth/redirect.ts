import { sanitizeInternalPath } from "@/lib/validation";

export function getSafeAuthRedirect(value: string | null | undefined): string {
  return sanitizeInternalPath(value, "/account");
}
