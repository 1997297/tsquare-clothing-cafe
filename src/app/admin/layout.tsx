import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdminPageAccess } from "@/lib/server/admin-guards";

export const metadata: Metadata = {
  title: "Atelier Operations",
  robots: { index: false, follow: false, nocache: true },
};

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const actor = await requireAdminPageAccess();

  return (
    <AdminShell
      identity={{
        displayName: actor.displayName,
        email: actor.user.email ?? "Authorized TCC account",
        role: actor.role,
<<<<<<< HEAD
        firstName: actor.profile?.firstName ?? "",
        lastName: actor.profile?.lastName ?? "",
        avatarUrl: actor.profile?.avatarUrl ?? null,
=======
>>>>>>> d7d91596d3a24c0239ae1e79836274394842a7eb
      }}
    >
      {children}
    </AdminShell>
  );
}
