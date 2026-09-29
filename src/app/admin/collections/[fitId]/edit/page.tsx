import { notFound } from "next/navigation";
import { FitEditor } from "../../FitEditor";
import { getCatalogueManagementSnapshot } from "@/lib/server/catalogue-management";

export default async function EditFitPage({ params }: { params: Promise<{ fitId: string }> }) {
  const [{ fitId }, snapshot] = await Promise.all([params, getCatalogueManagementSnapshot()]);
  const fit = snapshot.fits.find((item) => item.id === fitId);
  if (!fit) notFound();
  return <FitEditor fit={fit} categories={snapshot.categories} fabrics={snapshot.fabrics} colours={snapshot.colours} />;
}
