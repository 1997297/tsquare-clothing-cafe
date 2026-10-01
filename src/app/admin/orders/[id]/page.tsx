import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { OrderStatusBadge, WorkflowTimeline } from "@/components/atelier/WorkflowUI";
import { getAdminOrder } from "@/lib/server/atelier-workflow";
import { isUuid } from "@/lib/validation";
import { OrderStageControl } from "./OrderStageControl";

function RecordGrid({ title, values }: { title: string; values: Record<string, unknown> }) {
  const entries = Object.entries(values).filter(([, value]) => value !== null && value !== undefined && value !== "");
  return <section className="rounded-3xl border border-stone-800 bg-stone-950/60 p-6 sm:p-8"><h2 className="text-xs font-mono uppercase tracking-[0.24em] text-champagne">{title}</h2>{entries.length === 0 ? <p className="mt-5 text-sm text-stone-500">No values were recorded.</p> : <dl className="mt-5 grid gap-4 sm:grid-cols-2">{entries.map(([key, value]) => <div key={key} className="rounded-2xl border border-stone-800 bg-near-black/50 p-4"><dt className="text-[9px] uppercase tracking-wider text-stone-600">{key.replace(/([A-Z])/g, " $1").replace(/_/g, " ")}</dt><dd className="mt-1 break-words text-xs leading-5 text-stone-300">{typeof value === "object" ? JSON.stringify(value) : String(value)}</dd></div>)}</dl>}</section>;
}

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const order = await getAdminOrder(id);
  if (!order) notFound();
  const measurements = (order.measurementsSnapshot.values ?? order.measurementsSnapshot) as Record<string, unknown>;

  return <div className="space-y-8">
    <Link href="/admin/orders" className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-stone-500 hover:text-champagne"><ArrowLeft className="h-4 w-4" /> Orders</Link>
    <header className="grid gap-6 border-b border-stone-800/70 pb-8 lg:grid-cols-[1fr_auto] lg:items-end"><div><div className="flex flex-wrap items-center gap-3"><span className="font-mono text-xs font-bold text-champagne">{order.orderReference}</span><OrderStatusBadge status={order.status} /></div><h1 className="mt-4 font-display text-3xl sm:text-4xl">{order.styleName}</h1><p className="mt-3 text-sm text-stone-400">Created {new Intl.DateTimeFormat("en-NG", { dateStyle: "long", timeStyle: "short" }).format(new Date(order.createdAt))}</p></div>{order.bespokeRequestId && <Link href={`/admin/requests/${order.bespokeRequestId}`} className="inline-flex items-center gap-2 rounded-xl border border-stone-700 px-4 py-2.5 text-xs uppercase tracking-wider text-champagne">Open {order.requestReference ?? "source request"}<ExternalLink className="h-4 w-4" /></Link>}</header>
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px]"><div className="space-y-8">
      <section className="overflow-hidden rounded-3xl border border-stone-800 bg-stone-950/60"><div className="grid md:grid-cols-[240px_1fr]"><div className="relative min-h-64 bg-stone-900">{order.styleImage ? <Image src={order.styleImage} alt={order.styleName} fill sizes="(max-width: 768px) 100vw, 240px" className="object-cover" unoptimized /> : <div className="grid h-full min-h-64 place-items-center text-xs text-stone-600">No Fit image captured</div>}</div><div className="p-6 sm:p-8"><p className="text-[9px] uppercase tracking-wider text-stone-600">Client</p><p className="mt-2 font-display text-2xl">{order.customer ? `${order.customer.firstName} ${order.customer.lastName}` : "Profile unavailable"}</p><p className="mt-2 text-sm text-stone-400">{order.customer?.email ?? "Contact unavailable"}</p><div className="mt-6 grid gap-3 sm:grid-cols-2"><div><span className="text-[9px] uppercase text-stone-600">Fabric</span><p className="mt-1 text-xs">{String(order.fabricDetails.name ?? "Not recorded")}</p></div><div><span className="text-[9px] uppercase text-stone-600">Colour</span><p className="mt-1 text-xs">{String(order.colourDetails.name ?? "Not recorded")}</p></div><div><span className="text-[9px] uppercase text-stone-600">Target completion</span><p className="mt-1 text-xs">{order.targetCompletionDate ?? "Not set"}</p></div><div><span className="text-[9px] uppercase text-stone-600">Last stage update</span><p className="mt-1 text-xs">{order.productionStageUpdatedAt ? new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeStyle: "short" }).format(new Date(order.productionStageUpdatedAt)) : "Not recorded"}</p></div></div></div></div></section>
      <RecordGrid title="Approved measurements snapshot" values={{
        ...measurements,
        unit: order.measurementsSnapshot.unit ?? "Not recorded - confirm before production",
        method: order.measurementsSnapshot.method,
        verificationStatus: order.measurementsSnapshot.verificationStatus,
      }} />
      <RecordGrid title="Approved customization" values={{ ...order.preferences, specialInstructions: order.specialInstructions }} />
      <WorkflowTimeline events={order.timeline} />
    </div><div className="xl:sticky xl:top-28 xl:self-start"><OrderStageControl order={order} /></div></div>
  </div>;
}
