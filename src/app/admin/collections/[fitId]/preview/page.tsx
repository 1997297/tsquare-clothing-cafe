import { notFound } from "next/navigation";
import StyleDetailClient from "@/app/styles/[slug]/StyleDetailClient";
import { getCatalogueManagementSnapshot } from "@/lib/server/catalogue-management";

export default async function FitPreviewPage({ params }: { params: Promise<{ fitId: string }> }) {
  const [{ fitId }, snapshot] = await Promise.all([params, getCatalogueManagementSnapshot()]);
  const fit = snapshot.fits.find((item) => item.id === fitId);
  if (!fit) notFound();
  return <StyleDetailClient style={fit.style} relatedStyles={[]} previewMode={{ status: fit.status, editHref: `/admin/collections/${fit.id}/edit` }} />;
}
