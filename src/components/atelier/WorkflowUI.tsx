import { Clock3 } from "lucide-react";
import {
  ORDER_STATUS_LABELS,
  REQUEST_STATUS_LABELS,
  normalizeRequestStatus,
  type OrderWorkflowStatus,
  type WorkflowEvent,
} from "@/lib/atelier-workflow";
import { cn } from "@/lib/utils";

const STATUS_TONES: Record<string, string> = {
  submitted: "border-stone-600 bg-stone-800/60 text-stone-200",
  under_review: "border-blue-700/60 bg-blue-950/40 text-blue-300",
  needs_clarification: "border-amber-700/60 bg-amber-950/40 text-amber-300",
  confirmed: "border-emerald-700/60 bg-emerald-950/40 text-emerald-300",
  converted_to_order: "border-violet-700/60 bg-violet-950/40 text-violet-300",
  declined: "border-red-800/60 bg-red-950/40 text-red-300",
  order_confirmed: "border-blue-700/60 bg-blue-950/40 text-blue-300",
  measurements_confirmed: "border-cyan-700/60 bg-cyan-950/40 text-cyan-300",
  in_production: "border-amber-700/60 bg-amber-950/40 text-amber-300",
  finishing: "border-violet-700/60 bg-violet-950/40 text-violet-300",
  ready: "border-emerald-700/60 bg-emerald-950/40 text-emerald-300",
  completed: "border-stone-600 bg-stone-800/60 text-stone-200",
};

export function RequestStatusBadge({ status }: { status: string }) {
  const normalized = normalizeRequestStatus(status);
  return (
    <span className={cn("inline-flex rounded-full border px-3 py-1 text-[10px] font-mono font-semibold uppercase tracking-wider", STATUS_TONES[normalized])}>
      {REQUEST_STATUS_LABELS[normalized]}
    </span>
  );
}

export function OrderStatusBadge({ status }: { status: OrderWorkflowStatus }) {
  return (
    <span className={cn("inline-flex rounded-full border px-3 py-1 text-[10px] font-mono font-semibold uppercase tracking-wider", STATUS_TONES[status])}>
      {ORDER_STATUS_LABELS[status]}
    </span>
  );
}

function humanize(value: string) {
  return value.split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}

export function WorkflowTimeline({ events, emptyLabel = "No workflow activity has been recorded yet." }: { events: WorkflowEvent[]; emptyLabel?: string }) {
  return (
    <section className="rounded-3xl border border-stone-800 bg-white/80 p-6 dark:bg-stone-950/60 sm:p-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[9px] font-mono uppercase tracking-[0.24em] text-champagne-dark">Workflow history</p>
          <h2 className="mt-2 font-display text-xl text-stone-950 dark:text-warm-ivory">Commission timeline</h2>
        </div>
        <Clock3 className="h-5 w-5 text-stone-500" />
      </div>
      {events.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-stone-700 p-6 text-center text-xs text-stone-500">{emptyLabel}</p>
      ) : (
        <ol className="mt-6 space-y-0">
          {events.map((event, index) => {
            const publicMessage = typeof event.metadata.message === "string"
              ? event.metadata.message
              : typeof event.metadata.response === "string"
                ? event.metadata.response
                : undefined;
            return (
              <li key={event.id} className="relative grid grid-cols-[18px_1fr] gap-3 pb-6 last:pb-0">
                {index < events.length - 1 && <span className="absolute left-[8px] top-4 h-full w-px bg-stone-800" />}
                <span className="relative mt-1 h-4 w-4 rounded-full border-4 border-white bg-champagne dark:border-stone-950" />
                <div>
                  <p className="text-sm text-stone-900 dark:text-stone-200">{humanize(event.eventType)}</p>
                  <p className="mt-1 text-[10px] uppercase tracking-wider text-stone-500">
                    {event.actorType} · {new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeStyle: "short" }).format(new Date(event.createdAt))}
                  </p>
                  {publicMessage && <p className="mt-2 rounded-xl bg-stone-100 p-3 text-xs leading-5 text-stone-600 dark:bg-stone-900 dark:text-stone-300">{publicMessage}</p>}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
