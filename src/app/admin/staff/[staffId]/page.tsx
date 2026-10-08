import Link from 'next/link';
import { ServiceHeader, ServiceEmpty } from '@/components/atelier/ServiceUI';
import { PeoplePagination } from '@/components/admin/PeopleUI';
import { atelierPanel } from '@/components/atelier/styles';
import { getStaffHistory } from '@/lib/server/people';
import { peoplePage } from '@/lib/people';
import { formatAtelierInstant } from '@/lib/atelier-time';

export default async function StaffHistoryPage({ params, searchParams }: {
  params: Promise<{ staffId: string }>; searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { staffId } = await params;
  const page = peoplePage((await searchParams).page);
  const data = await getStaffHistory(staffId, page);
  return <div className="space-y-8"><Link href="/admin/staff" className="text-xs text-champagne">← Staff directory</Link><ServiceHeader eyebrow="CEO-only record" title="Staff access history" description="Recorded Admin access changes. Earlier SQL-provisioned memberships may not have historical events." />
    {data.events.length ? <ol className={`${atelierPanel} space-y-6`}>{data.events.map(row => <li key={row.id} className="border-l border-champagne/30 pl-4"><h2 className="text-sm capitalize">{row.action.replace(/_/g, ' ')}</h2><p className="mt-2 text-xs text-stone-400">{row.previous_status ?? 'Not staff'} → {row.resulting_status}</p><p className="mt-2 text-xs text-stone-500">{row.actor_name ?? 'CEO'} · {formatAtelierInstant(row.created_at)}</p></li>)}</ol> : <ServiceEmpty>No access changes have been recorded on this page.</ServiceEmpty>}
    <PeoplePagination page={page} total={data.total} href={next => `/admin/staff/${staffId}?page=${next}`} />
  </div>;
}
