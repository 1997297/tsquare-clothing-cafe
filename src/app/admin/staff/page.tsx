import Link from 'next/link';
import { ServiceHeader, ServiceEmpty } from '@/components/atelier/ServiceUI';
import { AtelierForm } from '@/components/atelier/AtelierForm';
import { PeoplePagination, PeopleSection, peopleDate } from '@/components/admin/PeopleUI';
import { StaffOnboarding } from '@/components/admin/StaffOnboarding';
import { atelierPanel } from '@/components/atelier/styles';
import { getStaffDirectory } from '@/lib/server/people';
import { peopleName, peoplePage } from '@/lib/people';
import { manageAdminStaffAction } from './actions';

export default async function AdminStaffPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const page = peoplePage((await searchParams).page);
  const result = await getStaffDirectory(page);
  return <div className="space-y-8"><ServiceHeader eyebrow="CEO authority" title="Staff" description="Manage Admin access while retaining staff attribution and business history. CEO authority is protected and cannot be changed here." />
    <PeopleSection id="onboarding" title="Add an Admin"><StaffOnboarding /></PeopleSection>
    {result.staff.length === 0 ? <ServiceEmpty>No staff records on this page.</ServiceEmpty> : <div className="grid items-start gap-5 xl:grid-cols-2">{result.staff.map(row => <article key={row.user_id} className={atelierPanel}>
      <h2 className="break-words font-display text-xl">{peopleName(row.first_name, row.last_name)}</h2><p className="mt-2 break-all text-sm text-stone-400">{row.email}</p>
      <p className="mt-4 text-sm">{row.role === 'ceo' ? 'CEO · Protected' : 'Admin'} · <span className="capitalize">{row.status}</span></p>
      <p className="mt-2 text-xs text-stone-500">Added {peopleDate(row.created_at)}{row.deactivated_at ? ` · Deactivated ${peopleDate(row.deactivated_at)}` : ''}</p>
      <div className="mt-5">{row.role === 'admin' ? <AtelierForm key={row.lock_version} action={manageAdminStaffAction} label={row.status === 'active' ? 'Deactivate Admin' : 'Reactivate Admin'} values={{ targetId: row.user_id, email: row.email, action: row.status === 'active' ? 'deactivate_admin' : 'activate_admin', expectedVersion: row.lock_version }} confirmText={`${row.status === 'active' ? 'Remove privileged access from' : 'Restore Admin access to'} ${peopleName(row.first_name, row.last_name)} (${row.email})? Existing records and attribution will be retained.`}>
        <p className="text-xs leading-6 text-stone-400">{row.status === 'active' ? 'Deactivation denies new privileged requests, including requests using an existing session. Work already in progress may finish before the change commits.' : 'Reactivation restores the existing Admin role without creating another account.'}</p>
      </AtelierForm> : <p className="text-xs leading-6 text-stone-400">CEO role changes require trusted recovery administration. The database also prevents removing the final active CEO.</p>}</div>
      <Link href={`/admin/staff/${row.user_id}`} className="mt-5 inline-block text-xs text-champagne">Access history →</Link>
    </article>)}</div>}
    <PeoplePagination page={page} total={result.total} href={next => `/admin/staff?page=${next}`} />
  </div>;
}
