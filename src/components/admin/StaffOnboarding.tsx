'use client';

import { useEffect, useRef, useState } from 'react';
import { findAdminCandidateAction, manageAdminStaffAction } from '@/app/admin/staff/actions';
import { AtelierForm } from '@/components/atelier/AtelierForm';
import { atelierButton, atelierInput } from '@/components/atelier/styles';
import { peopleName, type AdminCandidate } from '@/lib/people';

export function StaffOnboarding() {
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const [candidate, setCandidate] = useState<AdminCandidate | null>(null);
  const [error, setError] = useState('');
  useEffect(() => { setReady(true); }, []);
  return <div className="space-y-5">
    <p className="text-sm leading-6 text-stone-400">Ask the staff member to create a normal TCC account and verify their email, then look up that exact email here. Registration alone never grants staff access. Accounts with client business history must use a separate work email.</p>
    <form method="post" onSubmit={async event => {
      event.preventDefault();
      if (!ready || inFlight.current) return;
      inFlight.current = true; setBusy(true); setCandidate(null); setError('');
      const email = new FormData(event.currentTarget).get('email');
      try { const result = await findAdminCandidateAction(email); setCandidate(result.candidate); setError(result.error ?? ''); }
      catch { setError('Staff lookup could not be completed. Please retry.'); }
      finally { setBusy(false); inFlight.current = false; }
    }}>
      <fieldset disabled={!ready || busy} className="flex flex-wrap items-end gap-4">
        <label className="min-w-0 flex-1 text-xs text-stone-400">Verified staff email<input type="email" name="email" required maxLength={254} autoComplete="off" className={atelierInput} onChange={() => { setCandidate(null); setError(''); }} /></label>
        <button type="submit" className={atelierButton}>{busy ? 'Finding account…' : 'Find account'}</button>
      </fieldset>
    </form>
    {error && <p role="alert" className="text-sm text-rose-400">{error}</p>}
    {candidate && <div className="space-y-4 rounded-2xl border border-stone-700 p-5">
      <p className="break-words font-display text-xl">{peopleName(candidate.first_name, candidate.last_name)}</p><p className="break-all text-sm text-stone-400">{candidate.email}</p>
      {candidate.existing_staff ? <p role="status" className="text-sm text-stone-400">Already a staff account. Use its directory controls below.</p> : <AtelierForm key={candidate.id} action={manageAdminStaffAction} label="Grant Admin access" values={{ targetId: candidate.id, email: candidate.email, action: 'add_admin', expectedVersion: 0 }} createdHref="/admin/staff" confirmText={`Grant active Admin access to ${peopleName(candidate.first_name, candidate.last_name)} (${candidate.email})? This person will gain access to client and atelier operations, but not CEO-only staff or bank controls.`}>
        <p className="text-xs leading-6 text-stone-400">Check this identity carefully. This changes their portal from Client to Admin and does not send an invitation or change their password.</p>
      </AtelierForm>}
    </div>}
  </div>;
}
