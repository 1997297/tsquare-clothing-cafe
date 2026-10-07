import { ConciergeDetailPage } from "@/components/atelier/ConciergePages";
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  return <ConciergeDetailPage id={(await params).id} staff />;
}
