import React from 'react';
export default function Link({ href, children, prefetch: _prefetch, ...props }) { return <a href={href} {...props}>{children}</a>; }
const router = { refresh: () => { window.stage21.refreshes++; window.stage21.render(); }, push: href => { window.location.href = href; } };
export const useRouter = () => router;
export const setBankAction = async () => { throw new Error('Unexpected financial action in read-only fixture'); };
export const setPriceAction = setBankAction;
export const issuePaymentAction = setBankAction;
export const cancelPaymentAction = setBankAction;
export const reviewPaymentAction = setBankAction;
export const submitEvidenceAction = setBankAction;
