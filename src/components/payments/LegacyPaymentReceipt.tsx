"use client";

import Link from "next/link";
import { BrandLogo } from "@/components/common/BrandLogo";
import { ReturnLink } from "@/components/common/ReturnLink";
import { formatMinor } from "@/lib/payments/money";
import { paymentDate, buttonClass, panelClass } from "./PaymentUI";

export interface LegacyReceiptRecord {
  id: string; amount_minor: number; internal_reference: string; type: string;
  provider_reference: string | null; paid_at: string | null; created_at: string;
}
export default function LegacyPaymentReceipt({ payment, order, clientName }: {
  payment: LegacyReceiptRecord;
  order: { id: string; order_reference: string; style_name: string } | null;
  clientName: string;
}) {
  // Exact-ID, owner-authorized server data; never search the capped account store.
  return <div className="mx-auto max-w-3xl space-y-8">
    <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
      <ReturnLink href="/account/payments" label="Back to All Payments" />
      <button onClick={() => window.print()} className={buttonClass}>Print receipt</button>
    </div>
    <section className={panelClass}>
      <div className="flex flex-wrap items-start justify-between gap-6 border-b border-stone-800 pb-7">
        <BrandLogo variant="light" size="md" align="left" />
        <div><p className="text-xs text-champagne">Verified payment voucher</p><p className="mt-2 break-all font-mono text-xs">{payment.internal_reference}</p></div>
      </div>
      <dl className="mt-7 grid gap-6 sm:grid-cols-2">
        <div className="sm:col-span-2"><dt className="text-xs text-stone-400">Amount received</dt><dd className="mt-2 break-words font-display text-3xl text-champagne tabular-nums">{formatMinor(payment.amount_minor)}</dd></div>
        <div><dt className="text-xs text-stone-400">Client</dt><dd className="mt-2 break-words text-sm">{clientName}</dd></div>
        <div><dt className="text-xs text-stone-400">Order</dt><dd className="mt-2 text-sm">{order ? <Link href={`/account/orders/${order.id}`} className="text-champagne underline">{order.order_reference} · {order.style_name}</Link> : "Order archive unavailable"}</dd></div>
        <div><dt className="text-xs text-stone-400">Purpose</dt><dd className="mt-2 text-sm capitalize">{payment.type.replaceAll("_", " ")}</dd></div>
        <div><dt className="text-xs text-stone-400">Payment date</dt><dd className="mt-2 text-sm">{paymentDate(payment.paid_at ?? payment.created_at)}</dd></div>
        {payment.provider_reference && <div className="sm:col-span-2"><dt className="text-xs text-stone-400">Transfer reference</dt><dd className="mt-2 break-all text-sm">{payment.provider_reference}</dd></div>}
      </dl>
      <p className="mt-7 border-t border-stone-800 pt-5 text-xs leading-6 text-stone-400">This voucher records verified funds received for your TSquare Clothing Cafe order. Quote the payment reference when contacting TCC.</p>
    </section>
  </div>;
}
