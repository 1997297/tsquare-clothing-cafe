import React from 'react';

export default function Link({ href, children, ...props }) { return <a href={href} {...props}>{children}</a>; }
const router = { refresh: () => window.stage2.render(), push: () => { throw new Error('Unexpected navigation'); } };
export const useRouter = () => router;
export async function setBankAction(input) {
  const state = window.stage2;
  state.bankCalls.push(input);
  await new Promise(resolve => setTimeout(resolve, 100));
  if (state.failBank) return { success: false, error: 'Test persistence failure. No bank details saved.' };
  state.bank = { ...state.bank, is_configured: true, bank_name: input.bankName, account_name: input.accountName, account_number: input.accountNumber, instructions: input.instructions, lock_version: state.bank.lock_version + 1 };
  return { success: true };
}
export const setPriceAction = async () => { throw new Error('Unexpected financial write'); };
export const issuePaymentAction = setPriceAction;
export const cancelPaymentAction = setPriceAction;
export const reviewPaymentAction = setPriceAction;
export const submitEvidenceAction = setPriceAction;
export async function loadAtelierMessagesAction({ after }) {
  const state = window.stage2;
  state.loadCalls++;
  const snapshot = state.messages.filter(message => message.message_seq > after).slice(0, 50);
  if (state.holdLoad) await new Promise(resolve => { state.releaseLoad = resolve; });
  if (state.failLoad) return { success: false, error: 'Test message refresh failure.' };
  return { success: true, messages: snapshot, hasMore: state.messages.length > after + snapshot.length };
}
export async function markAtelierReadAction({ observedMessageSeq }) {
  window.stage2.readCalls.push(observedMessageSeq);
  if (window.stage2.failRead) return { success: false };
  return { success: true };
}
