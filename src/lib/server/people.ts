import 'server-only';
import { notFound } from 'next/navigation';
import { requireAdminPageAccess } from './admin-guards';
import { requireStaff } from './auth';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { isUuid } from '@/lib/validation';
import { peoplePage, type ClientDirectoryRow, type StaffDirectoryRow, type StaffHistoryRow } from '@/lib/people';
import { getOrderFinancials } from './manual-payments';

export async function peopleRpc<T>(name: string, args: Record<string, unknown>, ceoOnly = false): Promise<T> {
  await requireStaff({ ceoOnly });
  const client = await createServerSupabaseClient();
  const { data, error } = await client.rpc(name, args);
  if (error) {
    console.error('People workspace request failed', { name, code: error.code });
    throw new Error('PEOPLE_WORKSPACE_UNAVAILABLE');
  }
  return data as T;
}
export async function getClientDirectory(search: string, activity: string, page: number) {
  await requireAdminPageAccess();
  return peopleRpc<{ clients: ClientDirectoryRow[]; total: number; page: number }>('get_staff_clients', { p_search: search, p_activity: activity, p_page: page });
}
export async function getStaffDirectory(page: number) {
  await requireAdminPageAccess({ ceoOnly: true });
  return peopleRpc<{ staff: StaffDirectoryRow[]; total: number }>('get_ceo_staff', { p_page: page }, true);
}
export async function getStaffHistory(id: string, page: number) {
  await requireAdminPageAccess({ ceoOnly: true });
  if (!isUuid(id)) notFound();
  const client = await createServerSupabaseClient();
  const staff = await client.from('staff_accounts').select('user_id').eq('user_id', id).maybeSingle();
  if (staff.error) throw new Error('STAFF_DIRECTORY_UNAVAILABLE');
  if (!staff.data) notFound();
  return peopleRpc<{ events: StaffHistoryRow[]; total: number }>('get_staff_management_history', { p_target_id: id, p_page: page }, true);
}
export async function getClientDossier(id: string, params: Record<string, string | string[] | undefined>) {
  await requireAdminPageAccess();
  if (!isUuid(id)) notFound();
  const identity = await peopleRpc<{ clients: ClientDirectoryRow[] }>('get_staff_clients', { p_client_id: id });
  const profile = identity.clients[0];
  if (!profile) notFound();
  const client = await createServerSupabaseClient();
  const pages = { requests: peoplePage(params.requests), orders: peoplePage(params.orders), payments: peoplePage(params.payments), appointments: peoplePage(params.appointments), concierge: peoplePage(params.concierge), saved: peoplePage(params.saved) };
  const range = (page: number): [number, number] => [page * 10, page * 10 + 9];
  const [measurements, requests, orders, payments, appointments, concierge, saved] = await Promise.all([
    client.from('measurement_profiles').select('id,version,unit,fit_preference,verification_status,measurements,notes,created_at').eq('customer_id', id).eq('is_current', true).maybeSingle(),
    client.from('bespoke_requests').select('id,request_reference,style_name,status,created_at', { count: 'exact' }).eq('customer_id', id).order('created_at', { ascending: false }).order('id').range(...range(pages.requests)),
    client.from('orders').select('id,order_reference,style_name,status,created_at', { count: 'exact' }).eq('customer_id', id).order('created_at', { ascending: false }).order('id').range(...range(pages.orders)),
    client.from('payments').select('id,order_id,internal_reference,amount_minor,status,created_at', { count: 'exact' }).eq('customer_id', id).order('created_at', { ascending: false }).order('id').range(...range(pages.payments)),
    client.from('appointments').select('id,type,status,preferred_date,preferred_time,scheduled_start_at,created_at', { count: 'exact' }).eq('customer_id', id).order('created_at', { ascending: false }).order('id').range(...range(pages.appointments)),
    client.from('concierge_requests').select('id,subject,status,created_at', { count: 'exact' }).eq('customer_id', id).order('created_at', { ascending: false }).order('id').range(...range(pages.concierge)),
    client.from('saved_styles').select('id,style_id,saved_at', { count: 'exact' }).eq('customer_id', id).order('saved_at', { ascending: false }).order('id').range(...range(pages.saved)),
  ]);
  if ([measurements, requests, orders, payments, appointments, concierge, saved].some(result => result.error)) throw new Error('CLIENT_DOSSIER_UNAVAILABLE');
  const [financials, fits] = await Promise.all([
    Promise.all((orders.data ?? []).map(row => getOrderFinancials(row.id))),
    saved.data?.length ? client.from('catalogue_fits').select('id,name,slug,status').in('id', saved.data.map(row => row.style_id)) : Promise.resolve({ data: [], error: null }),
  ]);
  if (fits.error) throw new Error('SAVED_LOOKS_UNAVAILABLE');
  return { profile, pages, measurements: measurements.data, requests, orders, payments, appointments, concierge, saved,
    financials: new Map(financials.map(row => [row.order_id, row])), fits: new Map((fits.data ?? []).map(row => [row.id, row])) };
}
