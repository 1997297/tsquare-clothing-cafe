import Link from "next/link";
import { ArrowUpRight, Clock3, Radio } from "lucide-react";
import { getAdminOverviewData } from "@/lib/server/admin-overview";

function humanize(value: string) {
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default async function AdminOverviewPage() {
  const overview = await getAdminOverviewData();

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-champagne-dark">Atelier Overview</p>
          <h1 className="mt-3 font-display text-3xl sm:text-4xl">Operational Pulse</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-400">
            A live, read-only view of the work currently moving through TSquare Clothing Cafe.
          </p>
        </div>
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-800/40 bg-emerald-950/20 px-3 py-2 text-[10px] uppercase tracking-[0.18em] text-emerald-400">
          <Radio className="h-3.5 w-3.5" />
          Live records only
        </div>
      </div>

      {overview.hasQueryError && (
        <div role="status" className="rounded-2xl border border-amber-800/40 bg-amber-950/20 px-5 py-4 text-sm text-amber-300">
          Some operational summaries could not be loaded. No inferred or placeholder values are shown.
        </div>
      )}

      <section aria-label="Operational summaries" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {overview.metrics.map((metric) => (
          <div key={metric.label} className="rounded-2xl border border-stone-800 bg-stone-950/60 p-5">
            <p className="text-[9px] font-mono uppercase tracking-[0.22em] text-stone-500">{metric.label}</p>
            <p className="mt-5 font-display text-4xl text-warm-ivory">
              {metric.value == null ? "—" : metric.value}
            </p>
            <p className="mt-2 text-xs text-stone-500">
              {metric.value === 0 ? `No ${metric.label.toLowerCase()}` : metric.detail}
            </p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="rounded-3xl border border-stone-800 bg-stone-950/60 p-6 sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[9px] font-mono uppercase tracking-[0.22em] text-champagne-dark">Atelier Journal</p>
              <h2 className="mt-2 font-display text-2xl">Recent Activity</h2>
            </div>
            <Clock3 className="h-5 w-5 text-stone-600" />
          </div>

          {overview.activity.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-dashed border-stone-800 px-5 py-10 text-center text-sm text-stone-500">
              No recent operational activity.
            </div>
          ) : (
            <div className="mt-7 divide-y divide-stone-800/80">
              {overview.activity.map((item) => (
                <div key={item.id} className="flex items-start gap-4 py-4 first:pt-0 last:pb-0">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-champagne" />
                  <div className="min-w-0">
                    <p className="text-sm text-stone-200">{humanize(item.eventType)}</p>
                    <p className="mt-1 text-[10px] uppercase tracking-wider text-stone-600">
                      {humanize(item.entityType)} · {new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.createdAt))}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-stone-800 bg-stone-950/60 p-6 sm:p-8">
          <p className="text-[9px] font-mono uppercase tracking-[0.22em] text-champagne-dark">Catalogue Operations</p>
          <h2 className="mt-2 font-display text-2xl">Collections are live</h2>
          <p className="mt-4 text-sm leading-7 text-stone-400">
            Authorized staff can now manage categories, Fits, galleries, fabrics, colours and publication status without weakening the client-facing catalogue boundary.
          </p>
          <Link
            href="/admin/collections"
            className="mt-7 inline-flex items-center gap-2 text-xs uppercase tracking-widest text-champagne hover:text-champagne-light"
          >
            Manage Collections
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
