"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, FilePlus2, MessageSquareWarning, SearchCheck, XCircle } from "lucide-react";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { useWorkflowOperation } from "@/components/atelier/useWorkflowOperation";
import type { AdminRequestRecord } from "@/lib/server/atelier-workflow";
import { convertRequestToOrderAction, transitionRequestAction } from "../actions";

type PendingAction = "start_review" | "request_changes" | "approve" | "decline" | "convert";

const COPY: Record<PendingAction, { title: string; description: string; confirm: string }> = {
  start_review: { title: "Start this review?", description: "The client will see that TCC is actively reviewing the request.", confirm: "Start review" },
  request_changes: { title: "Send this change request?", description: "The client will see your message and can resubmit this same request for review.", confirm: "Request changes" },
  approve: { title: "Approve this request?", description: "This freezes the current request revision as the accepted configuration. It does not create an order or record payment.", confirm: "Approve request" },
  decline: { title: "Decline this request?", description: "The decision is terminal and the client will see the reason supplied below.", confirm: "Decline request" },
  convert: { title: "Create an order?", description: "One production order will be created from the approved snapshot. Repeated attempts will return the same order.", confirm: "Create order" },
};

export function RequestReviewPanel({ request }: { request: AdminRequestRecord }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const operationKeyFor = useWorkflowOperation();

  function ask(action: PendingAction) {
    setError(null);
    if ((action === "request_changes" || action === "decline") && message.trim().length < 3) {
      setError("Write a clear client-facing message before continuing.");
      return;
    }
    setPendingAction(action);
  }

  function confirm() {
    if (!pendingAction) return;
    const action = pendingAction;
    const operationKey = operationKeyFor({ requestId: request.id, action, message, expectedVersion: request.lockVersion });
    startTransition(async () => {
      try {
      const result = action === "convert"
        ? await convertRequestToOrderAction({ requestId: request.id, expectedVersion: request.lockVersion, operationKey })
        : await transitionRequestAction({
            requestId: request.id,
            action,
            message,
            expectedVersion: request.lockVersion,
            operationKey,
          });
      if (!result.success) {
        setError(result.error);
        setPendingAction(null);
        return;
      }
      setMessage("");
      setPendingAction(null);
      router.refresh();
      if (action === "convert" && result.data?.orderId) {
        router.push(`/admin/orders/${result.data.orderId}`);
      }
      } catch {
        setError("The response was interrupted. Retry the same action or refresh to check its status.");
        setPendingAction(null);
      }
    });
  }

  return (
    <section className="rounded-3xl border border-stone-800 bg-stone-950/70 p-6 sm:p-8">
      <p className="text-[9px] font-mono uppercase tracking-[0.24em] text-champagne-dark">Authorized actions</p>
      <h2 className="mt-2 font-display text-2xl">Review decision</h2>
      {error && <p role="alert" className="mt-5 rounded-xl border border-red-800/50 bg-red-950/30 p-3 text-xs text-red-300">{error}</p>}

      {request.status === "submitted" && (
        <button type="button" onClick={() => ask("start_review")} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-champagne px-5 py-3 text-xs font-bold uppercase tracking-wider text-near-black">
          <SearchCheck className="h-4 w-4" /> Start review
        </button>
      )}

      {request.status === "under_review" && (
        <div className="mt-6 space-y-5">
          <label className="block">
            <span className="text-[10px] uppercase tracking-wider text-stone-500">Client-facing message</span>
            <textarea value={message} onChange={(event) => setMessage(event.target.value)} rows={5} maxLength={2000} placeholder="Required for changes requested or decline; optional for approval." className="mt-2 w-full rounded-2xl border border-stone-700 bg-near-black p-4 text-sm leading-6 outline-none focus:border-champagne" />
            <span className="mt-1 block text-right text-[10px] text-stone-600">{message.length}/2000</span>
          </label>
          <div className="grid gap-3 sm:grid-cols-3">
            <button type="button" onClick={() => ask("request_changes")} className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-700/60 px-4 py-3 text-xs uppercase tracking-wider text-amber-300"><MessageSquareWarning className="h-4 w-4" /> Changes</button>
            <button type="button" onClick={() => ask("approve")} className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-700/60 px-4 py-3 text-xs uppercase tracking-wider text-emerald-300"><CheckCircle2 className="h-4 w-4" /> Approve</button>
            <button type="button" onClick={() => ask("decline")} className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-800/60 px-4 py-3 text-xs uppercase tracking-wider text-red-300"><XCircle className="h-4 w-4" /> Decline</button>
          </div>
        </div>
      )}

      {request.status === "needs_clarification" && (
        <div className="mt-6 rounded-2xl border border-amber-800/50 bg-amber-950/20 p-5 text-sm leading-6 text-amber-200">
          Waiting for the client to respond and resubmit revision {request.revision + 1}.
        </div>
      )}

      {request.status === "confirmed" && !request.convertedOrder && (
        <button type="button" onClick={() => ask("convert")} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-champagne px-5 py-3 text-xs font-bold uppercase tracking-wider text-near-black">
          <FilePlus2 className="h-4 w-4" /> Create production order
        </button>
      )}

      {request.convertedOrder && <p className="mt-6 rounded-2xl border border-emerald-800/40 bg-emerald-950/20 p-4 text-sm text-emerald-300">Converted to {request.convertedOrder.orderReference}.</p>}
      {request.status === "declined" && <p className="mt-6 text-sm text-stone-400">This request has been declined and no further workflow actions are available.</p>}

      <ConfirmDialog
        open={pendingAction !== null}
        title={pendingAction ? COPY[pendingAction].title : "Confirm action"}
        description={pendingAction ? COPY[pendingAction].description : ""}
        confirmLabel={pendingAction ? COPY[pendingAction].confirm : "Confirm"}
        busy={isPending}
        onCancel={() => !isPending && setPendingAction(null)}
        onConfirm={confirm}
      />
    </section>
  );
}
