import { CatalogueManager } from "./CatalogueManager";
import { getCatalogueManagementSnapshot } from "@/lib/server/catalogue-management";

export default async function AdminCollectionsPage() {
  const snapshot = await getCatalogueManagementSnapshot();
  return <CatalogueManager snapshot={snapshot} />;
}
