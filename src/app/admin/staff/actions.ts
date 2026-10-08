'use server';

import { revalidatePath } from 'next/cache';
import { requireStaff, toSafeServerError } from '@/lib/server/auth';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { peopleEmail, staffMutationInput, type AdminCandidate } from '@/lib/people';
import type { AtelierActionResult } from '@/components/atelier/AtelierForm';

export async function findAdminCandidateAction(input: unknown): Promise<{ candidate: AdminCandidate | null; error?: string }> {
  try {
    await requireStaff({ ceoOnly: true });
    let email: string;
    try { email = peopleEmail(input); } catch { return { candidate: null, error: 'Enter a valid verified account email.' }; }
    const client = await createServerSupabaseClient();
    const { data, error } = await client.rpc('find_admin_candidate', { p_email: email });
    if (error) return { candidate: null, error: 'Staff lookup is unavailable. Please retry.' };
    return { candidate: data as AdminCandidate | null, ...(!data ? { error: 'No eligible verified account found. Ask this person to register and verify their email first.' } : {}) };
  } catch (error) { return { candidate: null, error: toSafeServerError(error) }; }
}

const STAFF_ERRORS: Record<string, string> = {
  unauthorized: 'Only the active CEO can manage Admin access.',
  invalid_input: 'Refresh the staff directory and check the selected account.',
  verified_account_required: 'The verified account no longer matches. Look up the exact email again.',
  already_staff: 'This person already has a staff account. Refresh the directory.',
  ceo_protected: 'CEO access cannot be changed here.',
  stale_version: 'This account has changed since the page loaded. Refresh before continuing.',
  status_unchanged: 'This account already has the requested status. Refresh the directory.',
  idempotency_conflict: 'This action key was already used for another change. Refresh and review the staff status.',
  client_history_present: 'This account has client business history. Ask the staff member to register and verify a separate work account; their client history will remain intact.',
  not_found: 'This staff account is no longer available. Refresh the directory.',
};
export async function manageAdminStaffAction(input: unknown): Promise<AtelierActionResult> {
  try {
    await requireStaff({ ceoOnly: true });
    let values: ReturnType<typeof staffMutationInput>;
    try { values = staffMutationInput(input); } catch { return { success: false, error: 'Check the staff action and refresh if the account has changed.' }; }
    const client = await createServerSupabaseClient();
    const { data, error } = await client.rpc('manage_admin_staff', {
      p_target_id: values.targetId, p_email: values.email, p_action: values.action,
      p_expected_version: values.expectedVersion, p_operation_key: values.operationKey,
    });
    if (error) {
      console.error('Staff change failed', { code: error.code });
      return { success: false, error: STAFF_ERRORS[error.message] ?? 'We could not confirm this change. Refresh to check the staff status before retrying.' };
    }
    revalidatePath('/admin/staff', 'layout');
    revalidatePath('/admin/clients', 'layout');
    return { success: true, id: String(data) };
  } catch (error) { return { success: false, error: toSafeServerError(error) }; }
}
