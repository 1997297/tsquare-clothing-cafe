import { AppointmentListPage } from "@/components/atelier/AppointmentPages";

export default function AdminAppointmentsPage({ searchParams }: { searchParams: Promise<{ status?: string; page?: string; q?: string }> }) {
  return <AppointmentListPage staff searchParams={searchParams} />;
}
