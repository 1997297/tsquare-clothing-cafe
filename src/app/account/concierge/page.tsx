"use client";

import { useState } from "react";
import Link from "next/link";
import { useAccountData } from "@/lib/account-store";
import { useAuth } from "@/lib/auth-context";
import { ConciergeCategory } from "@/types";
import {
  MessageSquare,
  Send,
  Sparkles,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  CreditCard,
  Scissors,
  Calendar,
  Layers,
  Phone,
  ArrowRight,
  ShieldCheck,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORIES: {
  id: ConciergeCategory;
  label: string;
  desc: string;
  icon: any;
}[] = [
  {
    id: "discuss_order",
    label: "Discuss an Order",
    desc: "Inquiries regarding production milestones, fabric needlework, or finishing timeline.",
    icon: Scissors,
  },
  {
    id: "discuss_request",
    label: "Discuss a Bespoke Request",
    desc: "Consult on quoted pricing, custom embellishments, or design clarifications.",
    icon: Layers,
  },
  {
    id: "fitting_enquiry",
    label: "Ask About a Fitting",
    desc: "Consult regarding VIP salon sessions, dates, measurements, or garment balance.",
    icon: Calendar,
  },
  {
    id: "payment_question",
    label: "Payment Question",
    desc: "Inquire about settlement receipts, bank transfers, or milestone disbursements.",
    icon: CreditCard,
  },
  {
    id: "style_consultation",
    label: "Style Consultation",
    desc: "Discuss upcoming wedding dates, traditional attire etiquette, or silhouettes.",
    icon: Sparkles,
  },
  {
    id: "general_enquiry",
    label: "General Atelier Enquiry",
    desc: "Any other question for our master tailor and private client concierge.",
    icon: HelpCircle,
  },
];

export default function ConciergePage() {
  const { profile } = useAuth();
  const {
    conciergeRequests,
    conciergeMessages,
    orders,
    requests,
    createConciergeRequest,
    addConciergeMessage,
  } = useAccountData();

  const [activeRequestId, setActiveRequestId] = useState<string>(
    conciergeRequests[0]?.id || ""
  );
  const [showNewModal, setShowNewModal] = useState(false);

  // Form State
  const [selectedCategory, setSelectedCategory] = useState<ConciergeCategory>("discuss_order");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [relatedOrderId, setRelatedOrderId] = useState("");
  const [relatedRequestId, setRelatedRequestId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reply State
  const [replyText, setReplyText] = useState("");
  const [isReplying, setIsReplying] = useState(false);

  const activeRequest = conciergeRequests.find((r) => r.id === activeRequestId);
  const activeMessages = conciergeMessages.filter((m) => m.requestId === activeRequestId);

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;

    setIsSubmitting(true);
    try {
      const newReq = await createConciergeRequest({
        category: selectedCategory,
        subject: subject.trim(),
        message: message.trim(),
        relatedOrderId: relatedOrderId || undefined,
        relatedRequestId: relatedRequestId || undefined,
      });

      setShowNewModal(false);
      setSubject("");
      setMessage("");
      setRelatedOrderId("");
      setRelatedRequestId("");
      setActiveRequestId(newReq.id);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !activeRequestId) return;

    setIsReplying(true);
    try {
      await addConciergeMessage(activeRequestId, replyText.trim());
      setReplyText("");
    } finally {
      setIsReplying(false);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-300">
      {/* ── Page Header ── */}
      <div className="border-b border-stone-800/60 pb-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-4 h-4 text-champagne" />
              <span className="text-[10px] uppercase font-mono tracking-[0.3em] text-champagne font-semibold block">
                Private Client Relations
              </span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl text-warm-ivory font-normal">
              Your TSquare Concierge
            </h1>
            <p className="mt-2 text-sm text-stone-400 font-light max-w-xl leading-relaxed">
              Need to discuss a garment, fitting, payment or upcoming occasion? We are here to help. Enjoy dedicated dialogue with our Abeokuta atelier directors.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            <button
              onClick={() => setShowNewModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-champagne text-near-black text-xs font-mono uppercase tracking-wider font-bold hover:bg-champagne-light transition-all shadow-md"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>New Concierge Inquiry</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Main Concierge Interface ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Active Inquiries List */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs uppercase font-mono tracking-widest text-stone-400 font-semibold">
              Conversations ({conciergeRequests.length})
            </span>
          </div>

          {conciergeRequests.length > 0 ? (
            <div className="space-y-2.5">
              {conciergeRequests.map((req) => {
                const isSelected = req.id === activeRequestId;
                const catDef = CATEGORIES.find((c) => c.id === req.category);
                const Icon = catDef?.icon || MessageSquare;

                return (
                  <button
                    key={req.id}
                    onClick={() => setActiveRequestId(req.id)}
                    className={cn(
                      "w-full text-left p-4 rounded-2xl border transition-all duration-200 block space-y-2",
                      isSelected
                        ? "bg-[#181816] border-champagne/50 shadow-md"
                        : "bg-[#141412] border-stone-800/80 hover:border-stone-700 hover:bg-stone-900/40"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[10px] text-champagne font-bold">
                        {req.referenceCode}
                      </span>
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-[9px] font-mono uppercase",
                          req.status === "open" && "bg-blue-950/40 text-blue-400 border border-blue-800/40",
                          req.status === "in_review" && "bg-amber-950/40 text-amber-400 border border-amber-800/40",
                          req.status === "resolved" && "bg-emerald-950/40 text-emerald-400 border border-emerald-800/40",
                          req.status === "closed" && "bg-stone-900 text-stone-500 border border-stone-800"
                        )}
                      >
                        {req.status.replace(/_/g, " ")}
                      </span>
                    </div>

                    <p className="font-medium text-xs text-warm-ivory line-clamp-1">
                      {req.subject}
                    </p>

                    <div className="flex items-center gap-1.5 text-[10px] text-stone-500 font-mono">
                      <Icon className="w-3 h-3 text-stone-400" />
                      <span>{catDef?.label || "General"}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center bg-[#141412] rounded-3xl fine-border space-y-3">
              <MessageSquare className="w-6 h-6 text-stone-600 mx-auto" />
              <p className="text-xs text-stone-400 font-light">
                No active concierge conversations.
              </p>
              <button
                onClick={() => setShowNewModal(true)}
                className="text-xs text-champagne font-mono uppercase tracking-wider hover:underline"
              >
                Start an inquiry →
              </button>
            </div>
          )}

          {/* Official Atelier Contact Information */}
          <div className="p-5 rounded-3xl bg-[#121210] border border-stone-800/80 space-y-3 text-xs">
            <div className="flex items-center gap-2 text-warm-ivory font-display">
              <ShieldCheck className="w-4 h-4 text-champagne" />
              <span>Direct Client Care</span>
            </div>
            <p className="text-[11px] text-stone-400 font-light leading-relaxed">
              Every message is reviewed by our creative directors. Preferred Contact Method on your profile:{" "}
              <span className="font-mono text-champagne capitalize">
                {profile?.preferredContact || "WhatsApp"}
              </span>.
            </p>
          </div>
        </div>

        {/* Right: Active Conversation Thread View */}
        <div className="lg:col-span-8">
          {activeRequest ? (
            <div className="rounded-3xl bg-[#141412] fine-border overflow-hidden flex flex-col min-h-[580px]">
              {/* Thread Header */}
              <div className="p-6 border-b border-stone-800/80 bg-[#121210] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold text-champagne">
                      {activeRequest.referenceCode}
                    </span>
                    <span className="text-stone-700">•</span>
                    <span className="text-[11px] font-mono text-stone-400 capitalize">
                      {CATEGORIES.find((c) => c.id === activeRequest.category)?.label}
                    </span>
                  </div>
                  <h2 className="font-display text-lg text-warm-ivory">
                    {activeRequest.subject}
                  </h2>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="text-stone-500 font-mono text-[10px]">Status:</span>
                  <span className="px-3 py-1 rounded-full bg-stone-900 border border-stone-800 text-champagne font-mono text-[10px] uppercase font-semibold">
                    {activeRequest.status.replace(/_/g, " ")}
                  </span>
                </div>
              </div>

              {/* Messages Body */}
              <div className="flex-1 p-6 space-y-4 overflow-y-auto max-h-[420px]">
                {activeMessages.map((msg) => {
                  const isClient = msg.senderType === "customer";

                  return (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex flex-col max-w-[85%]",
                        isClient ? "ml-auto items-end" : "mr-auto items-start"
                      )}
                    >
                      <div className="flex items-center gap-2 mb-1 text-[10px] font-mono text-stone-500">
                        <span>{msg.senderName}</span>
                        <span>•</span>
                        <span>
                          {new Date(msg.createdAt).toLocaleTimeString("en-NG", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      <div
                        className={cn(
                          "p-4 rounded-2xl text-xs leading-relaxed",
                          isClient
                            ? "bg-champagne/15 text-warm-ivory border border-champagne/30 rounded-tr-sm"
                            : "bg-[#181816] text-stone-200 border border-stone-800 rounded-tl-sm"
                        )}
                      >
                        {msg.message}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Thread Reply Input Form */}
              <form
                onSubmit={handleSendReply}
                className="p-4 border-t border-stone-800/80 bg-[#121210] flex items-center gap-3"
              >
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Respond to your atelier concierge..."
                  className="flex-1 bg-stone-900/60 border border-stone-800 text-warm-ivory text-xs rounded-xl px-4 py-3 focus:outline-none focus:border-champagne/40 placeholder:text-stone-600"
                />
                <button
                  type="submit"
                  disabled={!replyText.trim() || isReplying}
                  className="px-4 py-3 rounded-xl bg-champagne text-near-black font-mono text-xs uppercase font-bold hover:bg-champagne-light disabled:opacity-50 transition-colors flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Send</span>
                </button>
              </form>
            </div>
          ) : (
            <div className="rounded-3xl bg-[#141412] fine-border p-12 text-center space-y-4">
              <Sparkles className="w-8 h-8 text-champagne mx-auto" />
              <h3 className="font-display text-xl text-warm-ivory">
                Select an inquiry to view dialogue
              </h3>
              <p className="text-xs text-stone-400 max-w-md mx-auto">
                Or begin a new concierge conversation for questions regarding your garments, fittings, or upcoming appointments.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── New Concierge Request Modal ── */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#141412] border border-stone-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-800/80 pb-4">
              <div>
                <h3 className="font-display text-xl text-warm-ivory">
                  New Concierge Inquiry
                </h3>
                <p className="text-xs text-stone-400 font-light mt-0.5">
                  Select a category to route your message to the appropriate specialist.
                </p>
              </div>
              <button
                onClick={() => setShowNewModal(false)}
                className="text-stone-400 hover:text-warm-ivory text-sm font-mono p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRequest} className="space-y-4 text-xs">
              {/* Category Picker */}
              <div>
                <label className="text-[10px] uppercase font-mono text-stone-400 block mb-1.5">
                  Inquiry Focus
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedCategory(c.id)}
                      className={cn(
                        "p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all",
                        selectedCategory === c.id
                          ? "bg-stone-900 border-champagne text-champagne"
                          : "bg-stone-900/30 border-stone-800 text-stone-400 hover:text-stone-300"
                      )}
                    >
                      <c.icon className="w-3.5 h-3.5 shrink-0" />
                      <span className="font-mono text-[11px] truncate">{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="text-[10px] uppercase font-mono text-stone-400 block mb-1.5">
                  Subject Summary
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Inquire about neckline embroidery density"
                  className="w-full bg-stone-900/60 border border-stone-800 text-warm-ivory rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-champagne/40"
                />
              </div>

              {/* Optional Order Linking */}
              {orders.length > 0 && (
                <div>
                  <label className="text-[10px] uppercase font-mono text-stone-400 block mb-1.5">
                    Link to Active Commission (Optional)
                  </label>
                  <select
                    value={relatedOrderId}
                    onChange={(e) => setRelatedOrderId(e.target.value)}
                    className="w-full bg-stone-900/60 border border-stone-800 text-warm-ivory rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-champagne/40 font-mono text-xs"
                  >
                    <option value="">No specific commission</option>
                    {orders.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.orderReference} - {o.styleName}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Message */}
              <div>
                <label className="text-[10px] uppercase font-mono text-stone-400 block mb-1.5">
                  Detailed Message
                </label>
                <textarea
                  rows={4}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Provide your specific questions, fitting dates, or garment details..."
                  className="w-full bg-stone-900/60 border border-stone-800 text-warm-ivory rounded-xl p-3.5 focus:outline-none focus:border-champagne/40 placeholder:text-stone-600"
                />
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-stone-800 text-stone-400 hover:text-warm-ivory text-xs uppercase font-mono tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !subject.trim() || !message.trim()}
                  className="px-5 py-2.5 rounded-xl bg-champagne text-near-black text-xs uppercase font-mono tracking-wider font-bold hover:bg-champagne-light disabled:opacity-50 transition-all"
                >
                  {isSubmitting ? "Transmitting..." : "Submit Inquiry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
