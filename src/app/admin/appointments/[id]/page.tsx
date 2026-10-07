import { AppointmentDetailPage } from "@/components/atelier/AppointmentPages";
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  return <AppointmentDetailPage id={(await params).id} staff />;
}
