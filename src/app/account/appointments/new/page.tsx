import Link from "next/link";
import { NewAppointmentForm } from "@/components/atelier/AppointmentForms";
import { getAtelierContextOptions, requireAtelierPage } from "@/lib/server/atelier-service";
export default async function NewAppointmentPage() {
  await requireAtelierPage(false);
  const options = await getAtelierContextOptions();
  return <div className="mx-auto max-w-3xl space-y-7"><Link href="/account/appointments" className="text-xs text-champagne">← Appointments</Link><NewAppointmentForm options={options} /></div>;
}
