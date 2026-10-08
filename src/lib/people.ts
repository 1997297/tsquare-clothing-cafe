export interface ClientDirectoryRow {
  id: string; first_name: string; last_name: string; email: string; phone: string;
  avatar_url: string | null; created_at: string; request_count: number; order_count: number;
  active_orders: boolean; pending_requests: boolean;
}
export interface StaffDirectoryRow {
  user_id: string; first_name: string | null; last_name: string | null; email: string;
  role: 'admin' | 'ceo'; status: 'active' | 'inactive'; created_at: string;
  invited_at: string | null; deactivated_at: string | null; lock_version: number;
}
export interface AdminCandidate {
  id: string; email: string; first_name: string; last_name: string; existing_staff: boolean;
}
export interface StaffHistoryRow {
  id: string; action: string; previous_status: string | null; resulting_status: string;
  created_at: string; actor_name: string | null;
}
export const CLIENT_ACTIVITY = ['all', 'active_orders', 'pending_requests'] as const;
export function peoplePage(value: unknown) {
  return typeof value === 'string' && /^\d{1,5}$/.test(value) ? Math.min(10000, Number(value)) : 0;
}
export function peopleEmail(value: unknown): string {
  if (typeof value !== 'string') throw new Error('Enter a valid verified account email.');
  const email = value.trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Enter a valid verified account email.');
  return email;
}
export function peopleName(first?: string | null, last?: string | null) {
  return [first, last].filter(Boolean).join(' ').trim() || 'TCC account';
}

export function staffMutationInput(input: unknown) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Invalid staff action.');
  const row = input as Record<string, unknown>;
  const fields = ['targetId', 'email', 'action', 'expectedVersion', 'operationKey'];
  if (Object.keys(row).some(key => !fields.includes(key))) throw new Error('Invalid staff action.');
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (typeof row.targetId !== 'string' || !uuid.test(row.targetId) || typeof row.operationKey !== 'string' || !uuid.test(row.operationKey)) throw new Error('Refresh the staff directory and try again.');
  if (!['add_admin', 'activate_admin', 'deactivate_admin'].includes(String(row.action))) throw new Error('Invalid staff action.');
  if (!['number', 'string'].includes(typeof row.expectedVersion) || !/^\d+$/.test(String(row.expectedVersion))) throw new Error('Refresh the staff directory and try again.');
  const version = Number(row.expectedVersion);
  if (!Number.isSafeInteger(version) || version < (row.action === 'add_admin' ? 0 : 1) || (row.action === 'add_admin' && version !== 0)) throw new Error('Refresh the staff directory and try again.');
  return { targetId: row.targetId, email: peopleEmail(row.email), action: String(row.action), expectedVersion: version, operationKey: row.operationKey };
}
