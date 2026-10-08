import Link from 'next/link';
import { ServiceHeader, ServiceEmpty } from '@/components/atelier/ServiceUI';
import { atelierInput, atelierButton, atelierPanel } from '@/components/atelier/styles';
import { ProfileAvatar } from '@/components/common/ProfileAvatar';
import { PeoplePagination, peopleDate } from '@/components/admin/PeopleUI';
import { getClientDirectory } from '@/lib/server/people';
import { CLIENT_ACTIVITY, peopleName, peoplePage } from '@/lib/people';

export default async function AdminClientsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const search = typeof params.q === 'string' ? params.q.trim().slice(0, 120) : '';
  const activity = typeof params.activity === 'string' && CLIENT_ACTIVITY.includes(params.activity as typeof CLIENT_ACTIVITY[number]) ? params.activity : 'all';
  const page = peoplePage(params.page);
  const result = await getClientDirectory(search, activity, page);
  const href = (next: number) => `/admin/clients?${new URLSearchParams({ q: search, activity, page: String(next) })}`;
  return <div className="space-y-8"><ServiceHeader eyebrow="Client relationships" title="Clients" description="Find a registered client and open their profile, current measurements and linked atelier history." />
    <form className={`${atelierPanel} grid items-end gap-4 sm:grid-cols-[1fr_1fr_auto]`} method="get">
      <label className="text-xs text-stone-400">Name, email or phone<input className={atelierInput} name="q" type="search" maxLength={120} defaultValue={search} /></label>
      <label className="text-xs text-stone-400">Activity<select name="activity" className={atelierInput} defaultValue={activity}><option value="all">All clients</option><option value="active_orders">With active orders</option><option value="pending_requests">With requests awaiting review</option></select></label>
      <button className={atelierButton} type="submit">Search clients</button>
    </form>
    <p className="text-xs text-stone-400">{result.total} matching clients. Staff accounts are managed separately by the CEO.</p>
    {result.clients.length === 0 ? <ServiceEmpty>No clients match this search. Try another name or clear the activity filter.</ServiceEmpty> : <div className="grid gap-5 xl:grid-cols-2">{result.clients.map(row => <article key={row.id} className={atelierPanel}>
      <div className="flex items-center gap-4"><ProfileAvatar profile={{ firstName: row.first_name, lastName: row.last_name, avatarUrl: row.avatar_url }} /><div className="min-w-0"><h2 className="break-words font-display text-xl"><Link href={`/admin/clients/${row.id}`} className="hover:text-champagne">{peopleName(row.first_name, row.last_name)}</Link></h2><p className="mt-1 break-all text-xs text-stone-400">{row.email}</p></div></div>
      <p className="mt-4 text-sm text-stone-400">{row.phone || 'No phone provided'}</p><p className="mt-2 text-xs text-stone-500">Joined {peopleDate(row.created_at)}</p>
      <p className="mt-4 text-sm">{row.request_count} requests · {row.order_count} orders</p>
      <p className="mt-2 text-xs text-stone-400">{[row.pending_requests && 'Awaiting request review', row.active_orders && 'Active order'].filter(Boolean).join(' · ') || 'No current request review or active order'}</p>
      <Link href={`/admin/clients/${row.id}`} className="mt-5 inline-block text-xs text-champagne">Open client dossier →</Link>
    </article>)}</div>}
    <PeoplePagination page={page} total={result.total} href={href} />
  </div>;
}
