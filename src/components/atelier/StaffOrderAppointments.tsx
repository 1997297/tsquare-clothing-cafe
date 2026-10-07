import Link from "next/link";
import { listAtelierAppointments } from "@/lib/server/atelier-service";
import { AppointmentCard } from "./ServiceUI";
import { atelierPanel } from "./styles";

export async function StaffOrderAppointments({ orderId }: { orderId: string }) {
  const { rows, hasMore } = await listAtelierAppointments(true, { orderId });
  return <section className={atelierPanel}><h2 className="font-display text-xl">Atelier appointments</h2><p className="mt-2 text-xs text-stone-500">Appointments do not automatically change this order&apos;s production or payment status.</p>
    <div className="mt-5 space-y-4">{rows.map(row => <AppointmentCard key={row.id} appointment={row} staff />)}{rows.length === 0 && <p className="text-sm text-stone-400">No appointment is linked to this order.</p>}</div>
    {hasMore && <Link href="/admin/appointments" className="mt-4 inline-block text-xs text-champagne">View appointment history →</Link>}
  </section>;
}
