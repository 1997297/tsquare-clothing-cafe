import { supabase } from "@/lib/supabase/client";

export const PROFILE_AVATAR_BUCKET = "profile-avatars";

export function getProfileAvatarUrl(reference?: string) {
  if (!reference) return undefined;
  if (/^https?:\/\//i.test(reference)) return reference;
  return supabase.storage.from(PROFILE_AVATAR_BUCKET).getPublicUrl(reference).data.publicUrl;
}

