import type { Metadata } from "next";
import { StaffProfileForm } from "./StaffProfileForm";
import { requireAdminPageAccess } from "@/lib/server/admin-guards";

export const metadata: Metadata = {
  title: "Staff Profile",
};

export default async function AdminProfilePage() {
  const actor = await requireAdminPageAccess();

  if (!actor.profile) {
    return (
      <div className="rounded-3xl border border-amber-800/40 bg-amber-950/20 p-6 text-sm leading-7 text-amber-300 sm:p-8">
        Your staff authorization is active, but the linked personal profile could not be loaded. No changes have been made. Please contact the CEO or TCC support.
      </div>
    );
  }

  return (
    <StaffProfileForm
      profile={{
        userId: actor.user.id,
        firstName: actor.profile.firstName,
        lastName: actor.profile.lastName,
        phone: actor.profile.phone,
        email: actor.user.email ?? "Email unavailable",
        avatarUrl: actor.profile.avatarUrl,
        role: actor.role,
        status: actor.staffStatus,
        createdAt: actor.profile.createdAt,
      }}
    />
  );
}
