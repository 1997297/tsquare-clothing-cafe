"use server";

import { revalidatePath } from "next/cache";
import { requireStaff, toSafeServerError } from "@/lib/server/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  isOwnedProfileAvatarReference,
  validateStaffProfileUpdate,
} from "@/lib/validation";

export type StaffProfileActionResult =
  | { ok: true }
  | { ok: false; error: string };

export async function updateStaffProfileAction(
  input: unknown
): Promise<StaffProfileActionResult> {
  const valid = validateStaffProfileUpdate(input);
  if (!valid.success) return { ok: false, error: valid.error };

  try {
    const actor = await requireStaff();
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("profiles")
      .update({
        first_name: valid.data.firstName,
        last_name: valid.data.lastName,
        phone: valid.data.phone,
        updated_at: new Date().toISOString(),
      })
      .eq("id", actor.user.id)
      .select("id")
      .single();

    if (error || !data) {
      console.error("Staff profile update failed", {
        code: error?.code,
        message: error?.message,
      });
      throw new Error("STAFF_PROFILE_UPDATE_FAILED");
    }

    revalidatePath("/admin", "layout");
    revalidatePath("/admin/profile");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: toSafeServerError(error) };
  }
}

export async function updateStaffAvatarAction(
  reference: unknown
): Promise<StaffProfileActionResult> {
  try {
    const actor = await requireStaff();
    if (!isOwnedProfileAvatarReference(reference, actor.user.id)) {
      return { ok: false, error: "The uploaded profile picture reference is invalid." };
    }

    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("profiles")
      .update({
        avatar_url: reference,
        updated_at: new Date().toISOString(),
      })
      .eq("id", actor.user.id)
      .select("id")
      .single();

    if (error || !data) {
      console.error("Staff avatar reference update failed", {
        code: error?.code,
        message: error?.message,
      });
      throw new Error("STAFF_AVATAR_UPDATE_FAILED");
    }

    revalidatePath("/admin", "layout");
    revalidatePath("/admin/profile");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: toSafeServerError(error) };
  }
}
