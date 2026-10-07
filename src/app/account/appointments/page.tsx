import { AppointmentListPage } from "@/components/atelier/AppointmentPages";
export const dynamic = "force-dynamic";
export default function ClientAppointmentsPage({ searchParams }: { searchParams: Promise<{ status?: string; page?: string; q?: string }> }) {
  return <AppointmentListPage staff={false} searchParams={searchParams} />;
}
