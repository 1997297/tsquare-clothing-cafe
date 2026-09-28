import { AdminModulePlaceholder } from "@/components/admin/AdminModulePlaceholder";
import { requireAdminPageAccess } from "@/lib/server/admin-guards";

export default async function AdminStaffPage() {
  await requireAdminPageAccess({ ceoOnly: true });

  return <AdminModulePlaceholder eyebrow="CEO Authority" title="Staff" description="The CEO-only staff authorization boundary is active. Invitation, activation, role-change and deactivation controls will build on this trusted foundation." nextPhase="Future CEO Staff Management phase" />;
}
