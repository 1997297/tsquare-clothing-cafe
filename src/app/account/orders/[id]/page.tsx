"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAccountData } from "@/lib/account-store";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Package,
  Scissors,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  CreditCard,
  Sparkles,
  Receipt,
  MessageSquare,
  Repeat,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { cn, formatOfficeLocation } from "@/lib/utils";
import {
  formatNaira,
  calculateOrderPaymentPosition,
  validatePaymentAmount,
} from "@/lib/payments/service";
import { PaymentType } from "@/types";

const CRAFTSMANSHIP_STAGES = [
  {
    id: "order_confirmed",
    label: "Order Confirmed",
    desc: "Bespoke commission agreement signed; materials and raw fabrics reserved.",
  },
  {
    id: "measurements_confirmed",
    label: "Measurements Confirmed",
    desc: "Master cutter completes individual paper pattern drafted to 28 anatomical points.",
  },
  {
    id: "in_production",
    label: "In Production",
    desc: "Floating horsehair canvas basted; hand-guided embroidery and assembly underway.",
  },
  {
    id: "finishing",
    label: "Finishing & Inspection",
    desc: "Hand-rolled lapels, buttonholes, lining insertion, and artisanal pressing.",
  },
  {
    id: "ready",
    label: "Ready for Fitting / Collection",
    desc: "Garment prepared for a final fitting appointment at the TCC office.",
  },
  {
    id: "completed",
    label: "Delivered & Archived",
    desc: "Garment collected; permanent pattern archived in your private client digital vault.",
  },
];

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const {
    orders,
    appointments,
    payments,
    wardrobe,
    recordPayment,
    syncCompletedOrderToWardrobe,
  } = useAccountData();

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentChoice, setPaymentChoice] = useState<"full" | "deposit" | "custom">("full");
  const [customAmountStr, setCustomAmountStr] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const order = orders.find((o) => o.id === id);

  if (!order) {
    return (
      <div className="py-16 text-center space-y-4">
        <AlertCircle className="w-8 h-8 text-stone-600 mx-auto" />
        <h2 className="font-display text-2xl text-warm-ivory">Order Record Not Located</h2>
        <p className="text-xs text-stone-400">
          The requested bespoke order could not be located in your private client archives.
        </p>
        <Link
          href="/account/orders"
          className="inline-flex items-center gap-2 text-xs text-champagne uppercase font-mono tracking-widest"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Orders</span>
        </Link>
      </div>
    );
  }

  const currentStageIndex = CRAFTSMANSHIP_STAGES.findIndex(
    (s) => s.id === order.status
  );

  const relatedAppointments = appointments.filter(
    (a) => a.orderId === order.id
  );

  const orderPayments = payments.filter((p) => p.orderId === order.id);
  const pos = calculateOrderPaymentPosition(order.totalAmount, orderPayments);

  const isCompleted = order.status === "completed";
  const existingWardrobeItem = wardrobe.find((w) => w.orderId === order.id);

  const handleMakePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError("");

    let chosenAmount = pos.outstandingBalance;
    let paymentType: PaymentType = "final_payment";

    if (paymentChoice === "full") {
      chosenAmount = pos.outstandingBalance;
      paymentType = pos.amountPaid === 0 ? "full_payment" : "final_payment";
    } else if (paymentChoice === "deposit") {
      chosenAmount = Math.round(pos.outstandingBalance / 2);
      paymentType = pos.amountPaid === 0 ? "deposit" : "installment";
    } else {
      const parsed = parseFloat(customAmountStr.replace(/[^0-9.]/g, ""));
      const validation = validatePaymentAmount(parsed, pos.outstandingBalance);
      if (!validation.valid) {
        setPaymentError(validation.error || "Invalid payment amount");
        return;
      }
      chosenAmount = Math.round(parsed);
      paymentType = pos.amountPaid === 0 ? "deposit" : "installment";
    }

    setIsProcessingPayment(true);
    try {
      await recordPayment({
        orderId: order.id,
        amount: chosenAmount,
        type: paymentType,
        provider: "sandbox",
        metadata: {
          note: `Settlement toward ${order.orderReference}`,
        },
      });

      setShowPaymentModal(false);
      setCustomAmountStr("");
    } catch {
      setPaymentError("A connection error occurred. Please try again.");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleViewWardrobe = async () => {
    if (!existingWardrobeItem) {
      await syncCompletedOrderToWardrobe(order.id);
    }
    router.push("/account/wardrobe");
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <Link
          href="/account/orders"
          className="inline-flex items-center gap-2 text-xs text-stone-400 hover:text-champagne transition-colors uppercase font-mono tracking-wider mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Orders</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800/60 pb-6">
          <div>
            <div className="flex items-center gap-3 mb-1.5">
              <span className="text-xs font-mono font-bold text-champagne tracking-wider">
                {order.orderReference}
              </span>
              <span className="text-stone-600">•</span>
              <span className="text-xs text-stone-400 font-mono">
                Initiated {new Date(order.createdAt).toLocaleDateString("en-NG", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl text-warm-ivory">
              {order.styleName}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/account/concierge"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-stone-800 hover:border-champagne/40 text-xs font-mono uppercase tracking-wider text-warm-ivory hover:text-champagne transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Discuss With Concierge</span>
            </Link>

            <span className="px-3.5 py-1.5 rounded-full text-xs uppercase font-mono tracking-wider font-semibold border bg-stone-900 border-stone-700 text-stone-300">
              {order.status.replace(/_/g, " ")}
            </span>
          </div>
        </div>
      </div>

      {/* ── Order Completed Celebration Banner ── */}
      {isCompleted && (
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#171614] to-[#121210] border border-champagne/40 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-2xl">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-champagne font-display text-lg sm:text-xl">
              <Sparkles className="w-5 h-5 text-champagne" />
              <span>Made for you. Finished by TSquare.</span>
            </div>
            <p className="text-xs text-stone-300 leading-relaxed font-light max-w-xl">
              This bespoke garment has been finalized and archived. Its paper pattern is preserved in your permanent digital wardrobe for future commissions.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleViewWardrobe}
              className="px-5 py-2.5 rounded-xl bg-champagne text-near-black text-xs font-mono uppercase tracking-wider font-bold hover:bg-champagne-light transition-all shadow-md"
            >
              View In My Wardrobe
            </button>
          </div>
        </div>
      )}

      {/* Craftsmanship Progress Bar */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#141412] fine-border space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-[10px] uppercase font-mono tracking-[0.28em] text-champagne font-semibold block mb-1">
              Atelier Milestones
            </span>
            <h2 className="font-display text-xl text-warm-ivory">
              Craftsmanship Progression
            </h2>
          </div>
          {order.targetCompletionDate && (
            <div className="text-left sm:text-right">
              <span className="text-[10px] uppercase font-mono text-stone-500 block">
                Target Completion
              </span>
              <span className="font-mono text-xs text-champagne font-bold">
                {new Date(order.targetCompletionDate).toLocaleDateString("en-NG", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
          )}
        </div>

        {/* Milestone Steps */}
        <div className="relative">
          <div className="hidden sm:block absolute top-1/2 left-0 right-0 h-0.5 bg-stone-800 -translate-y-1/2 z-0" />
          <div
            className="hidden sm:block absolute top-1/2 left-0 h-0.5 bg-champagne -translate-y-1/2 z-0 transition-all duration-500"
            style={{
              width: `${(Math.max(0, currentStageIndex) / (CRAFTSMANSHIP_STAGES.length - 1)) * 100}%`,
            }}
          />

          <div className="grid grid-cols-1 sm:grid-cols-6 gap-4 relative z-10">
            {CRAFTSMANSHIP_STAGES.map((stage, idx) => {
              const isPast = idx < currentStageIndex;
              const isCurrent = idx === currentStageIndex;

              return (
                <div key={stage.id} className="flex sm:flex-col items-center sm:text-center gap-3 sm:gap-2">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs font-bold transition-all shrink-0",
                      isPast && "bg-champagne text-near-black shadow-sm",
                      isCurrent && "bg-near-black border-2 border-champagne text-champagne shadow-[0_0_15px_rgba(183,154,104,0.3)]",
                      !isPast && !isCurrent && "bg-stone-900 border border-stone-800 text-stone-600"
                    )}
                  >
                    {isPast ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                  </div>
                  <div>
                    <p
                      className={cn(
                        "text-xs font-medium uppercase tracking-wider font-mono",
                        isCurrent ? "text-champagne font-bold" : isPast ? "text-warm-ivory" : "text-stone-600"
                      )}
                    >
                      {stage.label}
                    </p>
                    <p className="text-[10px] text-stone-500 hidden sm:block mt-1 line-clamp-2">
                      {stage.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Grid: Specifications & Financial Position */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 Cols): Specifications & Snapshot */}
        <div className="lg:col-span-2 space-y-6">
          {/* Garment Details */}
          <div className="p-6 sm:p-8 rounded-3xl bg-[#141412] fine-border space-y-5">
            <h3 className="text-xs font-mono uppercase tracking-[0.25em] text-champagne font-semibold">
              Bespoke Specifications
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-stone-900/60 border border-stone-800">
                <span className="text-[10px] uppercase font-mono text-stone-500 block mb-1">
                  Fabric & Canvas Construction
                </span>
                <p className="font-medium text-warm-ivory">
                  {order.fabricDetails?.name || "Pure Wool Blend"}
                </p>
                <p className="text-[11px] text-stone-400 mt-1">
                  Full floating natural horsehair canvas
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-stone-900/60 border border-stone-800">
                <span className="text-[10px] uppercase font-mono text-stone-500 block mb-1">
                  Colour & Palette
                </span>
                <p className="font-medium text-warm-ivory">
                  {order.colourDetails?.name || "Midnight Black"}
                </p>
                <p className="text-[11px] text-stone-400 mt-1">
                  Artisanal threadwork
                </p>
              </div>
            </div>

            {order.specialInstructions && (
              <div className="pt-2">
                <span className="text-[10px] uppercase font-mono text-stone-500 block mb-1">
                  Atelier Instruction Note
                </span>
                <p className="text-xs text-stone-300 italic bg-stone-900/40 p-3 rounded-xl border border-stone-800">
                  &quot;{order.specialInstructions}&quot;
                </p>
              </div>
            )}
          </div>

          {/* Measurements Snapshot */}
          <div className="p-6 rounded-3xl bg-[#141412] fine-border space-y-4">
            <h3 className="text-xs font-mono uppercase tracking-[0.25em] text-champagne font-semibold">
              Measurements Snapshot Locked to This Order
            </h3>
            <p className="text-[11px] text-stone-400 font-light">
              This snapshot preserves the physiological dimensions used to construct this specific garment pattern.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              {Object.entries(order.measurementsSnapshot || {}).map(([k, v]) => (
                <div key={k} className="p-2.5 rounded-xl bg-stone-900/60 border border-stone-800 text-center">
                  <span className="text-[9px] uppercase font-mono text-stone-500 block capitalize">
                    {k.replace(/([A-Z])/g, " $1")}
                  </span>
                  <span className="text-xs font-mono font-bold text-warm-ivory">
                    {v} cm
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): Financial Position & Appointments */}
        <div className="space-y-6">
          {/* ── Payment Position Card (Phase 4 Live Component) ── */}
          <div className="p-6 sm:p-7 rounded-3xl bg-[#141412] fine-border space-y-5 text-xs">
            <div className="flex items-center justify-between border-b border-stone-800/80 pb-3">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-[0.25em] text-champagne font-semibold block">
                  Commercial Account
                </span>
                <h3 className="font-display text-base text-warm-ivory font-normal">
                  Payment Position
                </h3>
              </div>
              <CreditCard className="w-4 h-4 text-champagne" />
            </div>

            {/* Position Breakdown */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-stone-400">
                <span>Order Total</span>
                <span className="font-mono text-warm-ivory font-bold text-sm">
                  {formatNaira(pos.orderTotal)}
                </span>
              </div>

              <div className="flex items-center justify-between text-stone-400">
                <span>Paid to Date</span>
                <span className="font-mono text-champagne font-bold text-sm">
                  {formatNaira(pos.amountPaid)}
                </span>
              </div>

              <div className="flex items-center justify-between text-stone-400">
                <span>Outstanding Balance</span>
                <span className="font-mono text-warm-ivory font-bold text-sm">
                  {formatNaira(pos.outstandingBalance)}
                </span>
              </div>
            </div>

            {/* Progress Visualization */}
            <div className="space-y-2 pt-1 border-t border-stone-800/60">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-champagne font-bold">{pos.percentagePaid}% Paid</span>
                <span className="text-stone-500">{pos.percentageRemaining}% Remaining</span>
              </div>
              <div className="w-full h-2 bg-stone-900 rounded-full overflow-hidden p-0.5 border border-stone-800">
                <div
                  className="h-full bg-gradient-to-r from-champagne-dark to-champagne rounded-full transition-all duration-700"
                  style={{ width: `${pos.percentagePaid}%` }}
                />
              </div>
            </div>

            {/* Make Payment Action Button */}
            {pos.outstandingBalance > 0 ? (
              <button
                onClick={() => setShowPaymentModal(true)}
                className="w-full py-3 rounded-xl bg-champagne text-near-black text-xs font-mono uppercase tracking-widest font-bold hover:bg-champagne-light transition-all shadow-md mt-2 flex items-center justify-center gap-2"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Make Payment</span>
              </button>
            ) : (
              <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-center text-emerald-400 font-mono text-[11px] flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Bespoke Commission Settled in Full</span>
              </div>
            )}

            {/* Payment History for this Order */}
            <div className="pt-4 border-t border-stone-800/80 space-y-3">
              <span className="text-[10px] uppercase font-mono text-stone-500 block">
                Transaction History ({orderPayments.length})
              </span>

              {orderPayments.length > 0 ? (
                <div className="space-y-2">
                  {orderPayments.map((p) => (
                    <div
                      key={p.id}
                      className="p-3 rounded-xl bg-stone-900/40 border border-stone-800/80 flex items-center justify-between"
                    >
                      <div className="space-y-0.5">
                        <span className="font-mono text-[11px] text-warm-ivory block capitalize">
                          {p.type.replace(/_/g, " ")}
                        </span>
                        <span className="text-[10px] font-mono text-stone-500">
                          {p.paidAt ? new Date(p.paidAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }) : "Recorded"}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="font-mono text-champagne font-bold text-xs block">
                          {formatNaira(p.amount)}
                        </span>
                        <Link
                          href={`/account/payments/${p.id}`}
                          className="text-[10px] font-mono text-stone-400 hover:text-champagne hover:underline inline-flex items-center gap-1"
                        >
                          <span>Receipt</span>
                          <ChevronRight className="w-2.5 h-2.5" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-stone-500 italic">
                  No verified payments recorded yet for this commission.
                </p>
              )}
            </div>
          </div>

          {/* Linked Appointments */}
          <div className="p-6 rounded-3xl bg-[#141412] fine-border space-y-4 text-xs">
            <h3 className="text-xs font-mono uppercase tracking-[0.25em] text-champagne font-semibold">
              Fitting Checkpoints
            </h3>
            {relatedAppointments.length > 0 ? (
              <div className="space-y-3">
                {relatedAppointments.map((apt) => (
                  <div key={apt.id} className="p-3.5 rounded-2xl bg-stone-900/50 border border-stone-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-warm-ivory uppercase tracking-wider">
                        {apt.type.replace(/-/g, " ")}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-champagne/15 text-champagne text-[9px] font-mono capitalize">
                        {apt.status}
                      </span>
                    </div>
                    <p className="text-stone-400 font-mono text-[11px]">
                      {apt.confirmedDate || apt.preferredDate} at {apt.confirmedTime || apt.preferredTime}
                    </p>
                    <p className="text-[10px] text-stone-500">{formatOfficeLocation(apt.location)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 space-y-2">
                <p className="text-[11px] text-stone-400">
                  No appointments currently linked. Our concierge will schedule your fitting as construction proceeds.
                </p>
                <Link
                  href="/account/appointments"
                  className="inline-flex items-center gap-1.5 text-xs text-champagne uppercase font-mono tracking-wider font-semibold"
                >
                  <span>Request Atelier Visit</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Secure Make Payment Modal ── */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#141412] border border-stone-800 rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-800/80 pb-4">
              <div>
                <h3 className="font-display text-xl text-warm-ivory">
                  Commission Settlement
                </h3>
                <p className="text-xs text-stone-400 font-light mt-0.5">
                  Select payment amount towards {order.orderReference}
                </p>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-stone-400 hover:text-warm-ivory text-sm font-mono p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleMakePayment} className="space-y-5 text-xs">
              {/* Payment Option Selector */}
              <div className="space-y-2.5">
                <label
                  onClick={() => setPaymentChoice("full")}
                  className={cn(
                    "p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all",
                    paymentChoice === "full"
                      ? "bg-stone-900 border-champagne text-champagne"
                      : "bg-stone-900/30 border-stone-800 text-stone-400"
                  )}
                >
                  <div className="space-y-0.5">
                    <p className="font-medium text-warm-ivory">Pay Outstanding Balance</p>
                    <p className="text-[10px] text-stone-500">Settle full remaining balance</p>
                  </div>
                  <span className="font-mono font-bold text-champagne text-sm">
                    {formatNaira(pos.outstandingBalance)}
                  </span>
                </label>

                <label
                  onClick={() => setPaymentChoice("deposit")}
                  className={cn(
                    "p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all",
                    paymentChoice === "deposit"
                      ? "bg-stone-900 border-champagne text-champagne"
                      : "bg-stone-900/30 border-stone-800 text-stone-400"
                  )}
                >
                  <div className="space-y-0.5">
                    <p className="font-medium text-warm-ivory">Pay Milestone Installment (50%)</p>
                    <p className="text-[10px] text-stone-500">Scheduled milestone payment</p>
                  </div>
                  <span className="font-mono font-bold text-champagne text-sm">
                    {formatNaira(Math.round(pos.outstandingBalance / 2))}
                  </span>
                </label>

                <label
                  onClick={() => setPaymentChoice("custom")}
                  className={cn(
                    "p-3.5 rounded-xl border block cursor-pointer transition-all",
                    paymentChoice === "custom"
                      ? "bg-stone-900 border-champagne text-champagne"
                      : "bg-stone-900/30 border-stone-800 text-stone-400"
                  )}
                >
                  <p className="font-medium text-warm-ivory mb-1">Pay Another Amount</p>
                  {paymentChoice === "custom" && (
                    <div className="pt-2">
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 font-mono text-sm">
                          ₦
                        </span>
                        <input
                          type="number"
                          value={customAmountStr}
                          onChange={(e) => setCustomAmountStr(e.target.value)}
                          placeholder="Enter custom amount"
                          className="w-full bg-near-black border border-stone-700 text-warm-ivory pl-8 pr-3.5 py-2 rounded-lg font-mono text-sm focus:outline-none focus:border-champagne"
                        />
                      </div>
                      <p className="text-[10px] text-stone-500 mt-1.5">
                        Maximum permitted: {formatNaira(pos.outstandingBalance)}
                      </p>
                    </div>
                  )}
                </label>
              </div>

              {paymentError && (
                <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-xl text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{paymentError}</span>
                </div>
              )}

              {/* Settlement Protocol Note */}
              <div className="p-3.5 rounded-xl bg-stone-900/40 border border-stone-800 text-[11px] text-stone-400 leading-relaxed font-light">
                <ShieldCheck className="w-4 h-4 text-champagne inline mr-1.5" />
                Payments are securely verified and linked to your authoritative client ledger. Official receipts are immediately archived.
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-stone-800 text-stone-400 hover:text-warm-ivory text-xs uppercase font-mono tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessingPayment}
                  className="px-5 py-2.5 rounded-xl bg-champagne text-near-black text-xs uppercase font-mono tracking-wider font-bold hover:bg-champagne-light disabled:opacity-50 transition-all"
                >
                  {isProcessingPayment ? "Verifying Settlement..." : "Confirm Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
