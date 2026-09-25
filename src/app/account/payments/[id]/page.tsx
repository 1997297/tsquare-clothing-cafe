"use client";

import { use } from "react";
import Link from "next/link";
import { useAccountData } from "@/lib/account-store";
import { useAuth } from "@/lib/auth-context";
import { BrandLogo } from "@/components/common/BrandLogo";
import { formatNaira } from "@/lib/payments/service";
import {
  ArrowLeft,
  Printer,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Calendar,
  ExternalLink,
} from "lucide-react";

export default function PaymentReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { payments, orders } = useAccountData();
  const { profile } = useAuth();

  const payment = payments.find((p) => p.id === id || p.internalReference === id);
  const order = payment ? orders.find((o) => o.id === payment.orderId) : null;

  if (!payment || payment.status !== "successful") {
    return (
      <div className="py-20 text-center space-y-4">
        <AlertCircle className="w-8 h-8 text-stone-600 mx-auto" />
        <h2 className="font-display text-2xl text-warm-ivory">Receipt Not Located</h2>
        <p className="text-xs text-stone-400">
          An official receipt is available only for a verified successful payment in your private archive.
        </p>
        <Link
          href="/account/payments"
          className="inline-flex items-center gap-2 text-xs text-champagne uppercase font-mono tracking-widest"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Payments</span>
        </Link>
      </div>
    );
  }

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const clientName = profile
    ? `${profile.firstName} ${profile.lastName}`
    : "Private Client";

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-3xl mx-auto">
      {/* Top Action Bar (Hidden when printing) */}
      <div className="flex items-center justify-between print:hidden">
        <Link
          href="/account/payments"
          className="inline-flex items-center gap-2 text-xs text-stone-400 hover:text-champagne transition-colors uppercase font-mono tracking-wider"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Payments</span>
        </Link>

        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-900 border border-stone-800 hover:border-champagne/40 text-xs font-mono uppercase tracking-wider text-warm-ivory hover:text-champagne transition-colors"
        >
          <Printer className="w-3.5 h-3.5 text-champagne" />
          <span>Print Receipt</span>
        </button>
      </div>

      {/* ── Official Luxury Receipt Card ── */}
      <div className="p-8 sm:p-12 rounded-3xl bg-stone-950 fine-border space-y-8 print:border-none print:p-0 print:bg-white print:text-black">
        {/* Atelier Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 border-b border-stone-800/80 pb-8 print:border-stone-200">
          <div className="space-y-3">
            <BrandLogo variant="light" size="md" align="left" />
            <div className="text-xs text-stone-400 print:text-stone-600 font-light space-y-0.5">
              <p>TSquare Clothing Cafe</p>
              <p>Private Client Concierge & Bespoke Atelier</p>
              <p>Abeokuta, Ogun State, Nigeria</p>
            </div>
          </div>

          <div className="text-left sm:text-right space-y-1">
            <span className="text-[10px] uppercase font-mono tracking-[0.25em] text-champagne font-semibold block">
              Official Payment Voucher
            </span>
            <p className="font-mono text-xs text-warm-ivory print:text-black font-bold">
              {payment.internalReference}
            </p>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/40 border border-emerald-800/50 text-emerald-400 text-[10px] font-mono uppercase mt-2">
              <CheckCircle2 className="w-3 h-3" />
              <span>Verified Settlement</span>
            </div>
          </div>
        </div>

        {/* Amount Hero */}
        <div className="p-6 rounded-2xl bg-near-black border border-stone-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:bg-stone-50 print:border-stone-200">
          <div>
            <span className="text-[10px] uppercase font-mono tracking-widest text-stone-500">
              Amount Received
            </span>
            <p className="font-display text-3xl sm:text-4xl text-champagne print:text-black font-bold mt-1">
              {formatNaira(payment.amount)}
            </p>
          </div>

          <div className="text-left sm:text-right text-xs">
            <span className="text-[10px] uppercase font-mono tracking-widest text-stone-500 block">
              Payment Classification
            </span>
            <p className="font-mono font-semibold text-warm-ivory print:text-black uppercase mt-1">
              {payment.type.replace(/_/g, " ")}
            </p>
          </div>
        </div>

        {/* Voucher Meta Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs border-b border-stone-800/80 pb-8 print:border-stone-200">
          <div className="space-y-4">
            <div>
              <span className="text-[10px] uppercase font-mono text-stone-500 block">
                Private Client
              </span>
              <p className="font-medium text-warm-ivory print:text-black mt-0.5">
                {clientName}
              </p>
              {profile?.email && (
                <p className="text-[11px] text-stone-400 print:text-stone-600 font-mono">
                  {profile.email}
                </p>
              )}
            </div>

            <div>
              <span className="text-[10px] uppercase font-mono text-stone-500 block">
                Commission Reference
              </span>
              <p className="font-mono text-warm-ivory print:text-black mt-0.5">
                {order ? order.orderReference : payment.orderId}
              </p>
              {order && (
                <Link
                  href={`/account/orders/${order.id}`}
                  className="inline-flex items-center gap-1 text-[11px] text-champagne hover:underline print:hidden mt-0.5"
                >
                  <span>{order.styleName}</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              )}
            </div>
          </div>

          <div className="space-y-4 text-left sm:text-right">
            <div>
              <span className="text-[10px] uppercase font-mono text-stone-500 block">
                Settlement Timestamp
              </span>
              <p className="font-mono text-warm-ivory print:text-black mt-0.5">
                {payment.paidAt
                  ? new Date(payment.paidAt).toLocaleDateString("en-NG", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })
                  : new Date(payment.createdAt).toLocaleDateString("en-NG", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
              </p>
            </div>

            <div>
              <span className="text-[10px] uppercase font-mono text-stone-500 block">
                Settlement Channel
              </span>
              <p className="font-mono text-warm-ivory print:text-black uppercase mt-0.5">
                Atelier Concierge Transfer
              </p>
              {payment.providerReference && (
                <p className="text-[10px] text-stone-500 font-mono">
                  Ref: {payment.providerReference}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Authentication Notice */}
        <div className="flex items-start gap-3 text-stone-500 print:text-stone-600 text-[11px] font-light leading-relaxed">
          <ShieldCheck className="w-4 h-4 text-champagne shrink-0 mt-0.5" />
          <p>
            This document confirms the receipt and verification of funds toward your TSquare Clothing Cafe bespoke commission. All materials, artisanal labor, and fittings are recorded against your private client record. For inquiries, quote your reference <span className="font-mono text-warm-ivory print:text-black">{payment.internalReference}</span>.
          </p>
        </div>
      </div>
    </div>
  );
}
