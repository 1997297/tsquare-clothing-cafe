import Link from 'next/link';
import { ServiceHeader } from '@/components/atelier/ServiceUI';
import { ProfileAvatar } from '@/components/common/ProfileAvatar';
import { PeoplePagination, PeopleRecord, PeopleSection, peopleDate } from '@/components/admin/PeopleUI';
import { getClientDossier } from '@/lib/server/people';
import { peopleName } from '@/lib/people';
import { formatMinor } from '@/lib/payments/money';
import { formatAtelierInstant } from '@/lib/atelier-time';
import { appointmentPurposeLabel } from '@/lib/atelier-service';

export default async function ClientDossierPage({ params, searchParams }: {
  params: Promise<{ clientId: string }>; searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { clientId } = await params;
  const query = await searchParams;
  const data = await getClientDossier(clientId, query);
  const { profile, measurements } = data;
  const pager = (key: keyof typeof data.pages, total: number | null) => <PeoplePagination size={10} page={data.pages[key]} total={total ?? 0} href={page => {
    const next = new URLSearchParams(Object.entries(data.pages).map(([name, value]) => [name, String(name === key ? page : value)]));
    return `/admin/clients/${clientId}?${next}#${key}`;
  }} />;
  const empty = <p className="text-sm text-stone-400">No records on this page.</p>;
  return <div className="space-y-8"><Link href="/admin/clients" className="text-xs text-champagne">← All clients</Link>
    <ServiceHeader eyebrow="Client dossier" title={peopleName(profile.first_name, profile.last_name)} description="Read-only client context. Open the linked operational record to review or take action." />
    <PeopleSection id="profile" title="Profile"><div className="flex flex-wrap items-center gap-5"><ProfileAvatar profile={{ firstName: profile.first_name, lastName: profile.last_name, avatarUrl: profile.avatar_url }} className="h-16 w-16" /><div className="min-w-0 space-y-2 text-sm text-stone-400"><p className="break-all">{profile.email}</p><p>{profile.phone || 'No phone provided'}</p><p>Client since {peopleDate(profile.created_at)}</p></div></div></PeopleSection>
    <PeopleSection id="measurements" title="Current measurements">{measurements ? <>
      <p className="text-xs text-stone-400">Version {measurements.version} · {measurements.unit} · {measurements.verification_status.replace(/_/g, ' ')} · {peopleDate(measurements.created_at)}</p>
      <dl className="grid gap-4 sm:grid-cols-3">{Object.entries(measurements.measurements as Record<string, unknown>).map(([name, value]) => <div key={name}><dt className="text-xs capitalize text-stone-400">{name.replace(/_/g, ' ')}</dt><dd className="mt-1 text-sm">{typeof value === 'number' || typeof value === 'string' ? String(value) : 'Not recorded'} {measurements.unit}</dd></div>)}</dl>
      {measurements.fit_preference && <p className="text-sm capitalize">Fit preference: {measurements.fit_preference}</p>}{measurements.notes && <p className="whitespace-pre-wrap break-words text-sm text-stone-400">{measurements.notes}</p>}
    </> : <p className="text-sm text-stone-400">No measurement profile has been supplied.</p>}<p className="text-xs leading-6 text-stone-500">Reference only. Each request/order retains its own historical measurement snapshot; current profile changes do not replace it.</p></PeopleSection>
    <div className="grid items-start gap-6 xl:grid-cols-2">
      <PeopleSection id="requests" title="Bespoke requests">{data.requests.data?.length ? data.requests.data.map(row => <PeopleRecord key={row.id} href={`/admin/requests/${row.id}`} title={row.request_reference}><p>{row.style_name} · {row.status.replace(/_/g, ' ')}</p><p>{peopleDate(row.created_at)}</p></PeopleRecord>) : empty}{pager('requests', data.requests.count)}</PeopleSection>
      <PeopleSection id="orders" title="Orders & payment position">{data.orders.data?.length ? data.orders.data.map(row => { const money = data.financials.get(row.id); return <PeopleRecord key={row.id} href={`/admin/orders/${row.id}`} title={row.order_reference}><p>{row.style_name} · {row.status.replace(/_/g, ' ')}</p><p>Agreed: {formatMinor(money?.total_minor)} · Verified: {formatMinor(money?.verified_minor)} · Balance: {formatMinor(money?.balance_minor)}</p><p>Pending evidence: {formatMinor(money?.pending_minor)} — not counted as verified.</p></PeopleRecord>; }) : empty}{pager('orders', data.orders.count)}</PeopleSection>
      <PeopleSection id="payments" title="Payment history">{data.payments.data?.length ? data.payments.data.map(row => <PeopleRecord key={row.id} href={`/admin/orders/${row.order_id}`} title={row.internal_reference || 'Order payment'}><p>{formatMinor(row.amount_minor)} · {row.status}</p><p>{peopleDate(row.created_at)} · Open order for authoritative requests, evidence and receipts.</p></PeopleRecord>) : empty}{pager('payments', data.payments.count)}</PeopleSection>
      <PeopleSection id="appointments" title="Appointments">{data.appointments.data?.length ? data.appointments.data.map(row => <PeopleRecord key={row.id} href={`/admin/appointments/${row.id}`} title={appointmentPurposeLabel(row.type)}><p>{row.status} · {row.scheduled_start_at ? formatAtelierInstant(row.scheduled_start_at) : `Preferred: ${row.preferred_date} · ${row.preferred_time}`}</p></PeopleRecord>) : empty}{pager('appointments', data.appointments.count)}</PeopleSection>
      <PeopleSection id="concierge" title="Concierge">{data.concierge.data?.length ? data.concierge.data.map(row => <PeopleRecord key={row.id} href={`/admin/concierge/${row.id}`} title={row.subject}><p>{row.status} · {peopleDate(row.created_at)}</p></PeopleRecord>) : empty}{pager('concierge', data.concierge.count)}</PeopleSection>
      <PeopleSection id="saved" title="Saved Looks">{data.saved.data?.length ? data.saved.data.map(row => { const fit = data.fits.get(row.style_id); return fit ? <PeopleRecord key={row.id} href={`/admin/collections/${encodeURIComponent(fit.id)}/preview`} title={fit.name}><p>{fit.status} · Saved {peopleDate(row.saved_at)}</p></PeopleRecord> : <p key={row.id} className="text-sm text-stone-400">Earlier Fit is no longer available. Saved reference retained.</p>; }) : empty}{pager('saved', data.saved.count)}</PeopleSection>
    </div>
  </div>;
}
