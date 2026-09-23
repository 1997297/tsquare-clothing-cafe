"use client";

import { useState } from "react";
import Link from "next/link";
import { useAccountData } from "@/lib/account-store";
import {
  CreditCard,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  ShieldCheck,
  ChevronRight,
  Receipt,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatNaira, calculateOrderPaymentPosition } from "@/lib/payments/service";

const FILTER_OPTIONS = ["all", "deposit", "installment", "final_payment"] as const;

export default function AccountPaymentsPage() {
  const { orders, payments } = useAccountData();
  const [filter, setFilter] = useState<typeof FILTER_OPTIONS[number]>("all");

  // Aggregate financial metrics
  const totalCommitted = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const totalSettled = payments
    .filter((p) => p.status === "successful")
    .reduce((sum, p) => sum + p.amount, 0);
  const totalOutstanding = Math.max(0, totalCommitted - totalSettled);

  // Filtered payments
  const filteredPayments = payments.filter((p) => {
    if (filter === "all") return true;
    return p.type === filter;
  });

  return (
    <div className="space-y-10 animate-in fade-in duration-300">
      {/* ── Page Header ── */}
      <div className="border-b border-stone-800/60 pb-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-[10px] uppercase font-mono tracking-[0.3em] text-champagne font-semibold block mb-1">
              Private Client Settlements
            </span>
            <h1 className="font-display text-2xl sm:text-3xl text-warm-ivory font-normal">
              Payments & Financial Position
            </h1>
            <p className="mt-1 text-xs text-stone-400 font-light max-w-xl">
              Monitor your bespoke commission accounts, verified deposits, milestone installments, and payment receipts.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto px-3.5 py-1.5 rounded-full bg-champagne/10 border border-champagne/25 text-champagne text-[11px] font-mono">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Authoritative Atelier Ledger</span>
          </div>
        </div>
      </div>

      {/* ── Financial Position Overview Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Committed */}
        <div className="p-6 rounded-3xl bg-[#141412] fine-border space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono tracking-widest text-stone-500">
              Total Commission Value
            </span>
            <CreditCard className="w-4 h-4 text-stone-500" />
          </div>
          <p className="font-display text-2xl sm:text-3xl text-warm-ivory font-bold">
            {formatNaira(totalCommitted)}
          </p>
          <p className="text-[11px] text-stone-500 font-light">
            Across {orders.length} bespoke commissions
          </p>
        </div>

        {/* Total Settled */}
        <div className="p-6 rounded-3xl bg-[#141412] fine-border space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono tracking-widest text-champagne">
              Total Settled
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="font-display text-2xl sm:text-3xl text-champagne font-bold">
            {formatNaira(totalSettled)}
          </p>
          <p className="text-[11px] text-stone-500 font-light">
            {totalCommitted > 0
              ? `${Math.round((totalSettled / totalCommitted) * 100)}% of commitments fulfilled`
              : "No commitments currently recorded"}
          </p>
        </div>

        {/* Total Outstanding */}
        <div className="p-6 rounded-3xl bg-[#141412] fine-border space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono tracking-widest text-stone-400">
              Outstanding Balance
            </span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <p className="font-display text-2xl sm:text-3xl text-warm-ivory font-bold">
            {formatNaira(totalOutstanding)}
          </p>
          <p className="text-[11px] text-stone-500 font-light">
            Due across upcoming fitting milestones
          </p>
        </div>
      </div>

      {/* ── Active Commissions Payment Positions ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg sm:text-xl text-warm-ivory">
            Active Commission Positions
          </h2>
          <span className="text-xs text-stone-500 font-mono">
            {orders.length} {orders.length === 1 ? "Commission" : "Commissions"}
          </span>
        </div>

        <div className="space-y-4">
          {orders.map((order) => {
            const orderPayments = payments.filter((p) => p.orderId === order.id);
            const pos = calculateOrderPaymentPosition(order.totalAmount, orderPayments);

            return (
              <div
                key={order.id}
                className="p-6 sm:p-8 rounded-3xl bg-[#141412] fine-border space-y-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800/60 pb-5">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono font-bold text-champagne">
                        {order.orderReference}
                      </span>
                      <span className="text-stone-700">•</span>
                      <span className="text-[11px] text-stone-400 font-mono capitalize">
                        {order.status.replace(/_/g, " ")}
                      </span>
                    </div>
                    <h3 className="font-display text-lg text-warm-ivory">
                      {order.styleName}
                    </h3>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider font-semibold border",
                        pos.paymentStatus === "paid" &&
                          "bg-emerald-950/40 text-emerald-400 border-emerald-800/50",
                        pos.paymentStatus === "partially_paid" &&
                          "bg-champagne/15 text-champagne border-champagne/40",
                        pos.paymentStatus === "pending" &&
                          "bg-amber-950/40 text-amber-400 border-amber-800/50",
                        pos.paymentStatus === "not_started" &&
                          "bg-stone-900 text-stone-400 border-stone-700"
                      )}
                    >
                      {pos.paymentStatus === "paid"
                        ? "Settled in Full"
                        : pos.paymentStatus === "partially_paid"
                        ? "Partially Settled"
                        : pos.paymentStatus === "pending"
                        ? "Payment Pending"
                        : "Not Started"}
                    </span>

                    <Link
                      href={`/account/orders/${order.id}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-stone-800 hover:border-champagne/40 text-xs font-mono uppercase tracking-wider text-warm-ivory hover:text-champagne transition-colors"
                    >
                      <span>View Order</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>

                {/* Progress Bar & Breakdown */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
                  <div className="sm:col-span-2 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-stone-400 font-mono text-[11px]">
                        Payment Position
                      </span>
                      <span className="font-mono text-champagne font-bold text-xs">
                        {pos.percentagePaid}% Paid • {pos.percentageRemaining}% Remaining
                      </span>
                    </div>

                    <div className="w-full h-2.5 bg-stone-900 rounded-full overflow-hidden p-0.5 border border-stone-800">
                      <div
                        className="h-full bg-gradient-to-r from-champagne-dark via-champagne to-champagne-light rounded-full transition-all duration-700"
                        style={{ width: `${pos.percentagePaid}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-mono text-stone-500 pt-0.5">
                      <span>Paid: {formatNaira(pos.amountPaid)}</span>
                      <span>Balance: {formatNaira(pos.outstandingBalance)}</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-stone-900/40 border border-stone-800/80 text-right space-y-1">
                    <span className="text-[10px] uppercase font-mono text-stone-500 block">
                      Commission Value
                    </span>
                    <p className="font-display text-xl text-warm-ivory font-bold">
                      {formatNaira(pos.orderTotal)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Transaction History Ledger ── */}
      <div className="space-y-6 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800/60 pb-4">
          <div>
            <h2 className="font-display text-lg sm:text-xl text-warm-ivory">
              Payment Transaction Ledger
            </h2>
            <p className="text-xs text-stone-500 font-light">
              Detailed chronological record of verified transfers and settlement receipts.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {FILTER_OPTIONS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs uppercase tracking-wider font-mono font-medium transition-colors capitalize whitespace-nowrap",
                  filter === f
                    ? "bg-stone-800 text-champagne border border-stone-700"
                    : "text-stone-400 hover:text-warm-ivory hover:bg-stone-900"
                )}
              >
                {f.replace(/_/g, " ")}
              </button>
            ))}
          </div>
        </div>

        {filteredPayments.length > 0 ? (
          <div className="space-y-3">
            {filteredPayments.map((payment) => (
              <div
                key={payment.id}
                className="p-5 rounded-2xl bg-[#141412] fine-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-stone-700 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-champagne/10 border border-champagne/25 flex items-center justify-center shrink-0 mt-0.5 text-champagne">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-warm-ivory">
                        {payment.internalReference}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-stone-900 text-stone-400 text-[10px] font-mono uppercase">
                        {payment.type.replace(/_/g, " ")}
                      </span>
                    </div>
                    <p className="text-xs text-stone-400">
                      Order Reference:{" "}
                      <Link
                        href={`/account/orders/${payment.orderId}`}
                        className="text-champagne hover:underline font-mono"
                      >
                        {orders.find((o) => o.id === payment.orderId)?.orderReference || payment.orderId}
                      </Link>
                    </p>
                    <p className="text-[11px] font-mono text-stone-500">
                      {payment.paidAt
                        ? new Date(payment.paidAt).toLocaleDateString("en-NG", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : new Date(payment.createdAt).toLocaleDateString("en-NG", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-800">
                  <div className="text-left sm:text-right">
                    <p className="font-display text-lg text-champagne font-bold">
                      {formatNaira(payment.amount)}
                    </p>
                    <span className="text-[10px] font-mono uppercase text-emerald-400 font-semibold">
                      {payment.status === "successful" ? "Verified" : payment.status}
                    </span>
                  </div>

                  <Link
                    href={`/account/payments/${payment.id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-800 hover:border-champagne/40 text-xs font-mono uppercase tracking-wider text-warm-ivory hover:text-champagne transition-colors"
                  >
                    <span>Receipt</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-[#141412] rounded-3xl fine-border space-y-3">
            <CreditCard className="w-8 h-8 text-stone-600 mx-auto" />
            <h3 className="font-display text-lg text-warm-ivory">
              No Payment Records in this Category
            </h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              Payments recorded for your bespoke commissions will appear here chronologically.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
