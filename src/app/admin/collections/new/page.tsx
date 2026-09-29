import { FitEditor } from "../FitEditor";
import { getCatalogueManagementSnapshot } from "@/lib/server/catalogue-management";

export default async function NewFitPage() {
  const { categories, fabrics, colours } = await getCatalogueManagementSnapshot();
  return <FitEditor fit={null} categories={categories} fabrics={fabrics} colours={colours} />;
}
