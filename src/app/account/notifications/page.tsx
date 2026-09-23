"use client";

import Link from "next/link";
import { useAccountData } from "@/lib/account-store";
import {
  Bell,
  CheckCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  Package,
  Calendar,
  AlertCircle,
  ArrowRight,
  CreditCard,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function AccountNotificationsPage() {
  const {
    notifications,
    unreadNotificationsCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
  } = useAccountData();

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800/60 pb-6">
        <div>
          <span className="text-[10px] uppercase font-mono tracking-[0.3em] text-champagne font-semibold block mb-1">
            Dispatch Center
          </span>
          <h1 className="font-display text-2xl sm:text-3xl text-warm-ivory">
            Atelier Dispatches & Alerts
          </h1>
          <p className="text-xs text-stone-400 mt-1 font-light">
            Real-time milestones, fitting scheduling updates, payment confirmations, and tailoring notifications from TCC.
          </p>
        </div>

        {unreadNotificationsCount > 0 && (
          <button
            onClick={() => markAllNotificationsAsRead()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-stone-800 hover:border-champagne text-xs uppercase font-mono tracking-wider text-stone-300 hover:text-champagne transition-colors self-start sm:self-auto"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Mark All as Read</span>
          </button>
        )}
      </div>

      {/* Notifications List */}
      {notifications.length > 0 ? (
        <div className="space-y-3">
          {notifications.map((notif) => {
            const isUnread = !notif.isRead;

            let targetUrl = "/account";
            if (notif.relatedEntityType === "request" && notif.relatedEntityId) {
              targetUrl = `/account/requests/${notif.relatedEntityId}`;
            } else if (notif.relatedEntityType === "order" && notif.relatedEntityId) {
              targetUrl = `/account/orders/${notif.relatedEntityId}`;
            } else if (notif.relatedEntityType === "appointment") {
              targetUrl = "/account/appointments";
            } else if (notif.relatedEntityType === "payment") {
              targetUrl = notif.relatedEntityId ? `/account/payments/${notif.relatedEntityId}` : "/account/payments";
            } else if (notif.relatedEntityType === "wardrobe") {
              targetUrl = notif.relatedEntityId ? `/account/wardrobe/${notif.relatedEntityId}` : "/account/wardrobe";
            } else if (notif.relatedEntityType === "concierge") {
              targetUrl = "/account/concierge";
            }

            return (
              <div
                key={notif.id}
                onClick={() => {
                  if (isUnread) markNotificationAsRead(notif.id);
                }}
                className={cn(
                  "p-5 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4",
                  isUnread
                    ? "bg-[#161614] border-champagne/40 shadow-sm"
                    : "bg-[#141412] border-stone-800/60 opacity-80 hover:opacity-100"
                )}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border mt-0.5",
                      isUnread
                        ? "bg-champagne/15 border-champagne/40 text-champagne"
                        : "bg-stone-900 border-stone-800 text-stone-500"
                    )}
                  >
                    {notif.type.includes("payment") ? (
                      <CreditCard className="w-4 h-4" />
                    ) : notif.type.includes("wardrobe") ? (
                      <Sparkles className="w-4 h-4" />
                    ) : notif.type.includes("concierge") ? (
                      <MessageSquare className="w-4 h-4" />
                    ) : notif.type.includes("order") || notif.type.includes("production") ? (
                      <Package className="w-4 h-4" />
                    ) : notif.type.includes("appointment") ? (
                      <Calendar className="w-4 h-4" />
                    ) : notif.type.includes("pricing") ? (
                      <Sparkles className="w-4 h-4" />
                    ) : (
                      <Bell className="w-4 h-4" />
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3
                        className={cn(
                          "text-xs font-semibold uppercase tracking-wider font-mono",
                          isUnread ? "text-warm-ivory" : "text-stone-300"
                        )}
                      >
                        {notif.title}
                      </h3>
                      {isUnread && (
                        <span className="w-1.5 h-1.5 rounded-full bg-champagne" />
                      )}
                    </div>
                    <p className="text-xs text-stone-400 font-light leading-relaxed">
                      {notif.message}
                    </p>
                    <span className="text-[10px] text-stone-500 font-mono block pt-1">
                      {new Date(notif.createdAt).toLocaleDateString("en-NG", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>

                {notif.relatedEntityId && (
                  <Link
                    href={targetUrl}
                    className="inline-flex items-center gap-1.5 text-xs uppercase font-mono text-champagne hover:text-champagne-light tracking-wider font-semibold shrink-0 self-end sm:self-center"
                  >
                    <span>View Detail</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 bg-[#141412] fine-border rounded-3xl text-center space-y-4">
          <Bell className="w-8 h-8 text-stone-600 mx-auto" />
          <h3 className="font-display text-xl text-warm-ivory">
            All Caught Up
          </h3>
          <p className="text-xs text-stone-400 max-w-sm mx-auto leading-relaxed">
            There are currently no active alerts for your profile. Key tailoring milestones and appointment confirmations will appear here.
          </p>
        </div>
      )}
    </div>
  );
}
