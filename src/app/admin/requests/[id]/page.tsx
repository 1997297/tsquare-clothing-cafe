import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { RequestStatusBadge, WorkflowTimeline } from "@/components/atelier/WorkflowUI";
import { getAdminRequest } from "@/lib/server/atelier-workflow";
import { isUuid } from "@/lib/validation";
import { RequestReviewPanel } from "./RequestReviewPanel";

function valueLabel(value: unknown) {
  if (value === null || value === undefined || value === "") return "Not provided";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function DetailGrid({ title, values }: { title: string; values: Record<string, unknown> }) {
  const entries = Object.entries(values).filter(([, value]) => value !== undefined && value !== null && value !== "");
  return (
    <section className="rounded-3xl border border-stone-800 bg-stone-950/60 p-6 sm:p-8">
      <h2 className="text-xs font-mono uppercase tracking-[0.24em] text-champagne">{title}</h2>
      {entries.length === 0 ? <p className="mt-5 text-sm text-stone-500">No information was submitted for this section.</p> : (
        <dl className="mt-5 grid gap-4 sm:grid-cols-2">
          {entries.map(([key, value]) => (
            <div key={key} className="rounded-2xl border border-stone-800 bg-near-black/50 p-4">
              <dt className="text-[9px] uppercase tracking-wider text-stone-600">{key.replace(/([A-Z])/g, " $1").replace(/_/g, " ")}</dt>
              <dd className="mt-1 break-words text-xs leading-5 text-stone-300">{valueLabel(value)}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}

export default async function AdminRequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const request = await getAdminRequest(id);
  if (!request) notFound();
  const measurements = (request.measurementsSnapshot.values ?? request.measurementsSnapshot) as Record<string, unknown>;

  return (
    <div className="space-y-8">
      <Link href="/admin/requests" className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-stone-500 hover:text-champagne"><ArrowLeft className="h-4 w-4" /> Requests</Link>
      <header className="grid gap-6 border-b border-stone-800/70 pb-8 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <div className="flex flex-wrap items-center gap-3"><span className="font-mono text-xs font-bold text-champagne">{request.requestReference}</span><RequestStatusBadge status={request.status} /></div>
          <h1 className="mt-4 font-display text-3xl sm:text-4xl">{request.styleName ?? "Original bespoke idea"}</h1>
          <p className="mt-3 text-sm text-stone-400">Revision {request.revision} · submitted {new Intl.DateTimeFormat("en-NG", { dateStyle: "long", timeStyle: "short" }).format(new Date(request.lastSubmittedAt ?? request.createdAt))}</p>
        </div>
        {request.convertedOrder && <Link href={`/admin/orders/${request.convertedOrder.id}`} className="inline-flex items-center gap-2 rounded-xl border border-stone-700 px-4 py-2.5 text-xs uppercase tracking-wider text-champagne">Open {request.convertedOrder.orderReference}<ExternalLink className="h-4 w-4" /></Link>}
      </header>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-8">
          <section className="overflow-hidden rounded-3xl border border-stone-800 bg-stone-950/60">
            <div className="grid md:grid-cols-[240px_1fr]">
              <div className="relative min-h-64 bg-stone-900">
                {request.styleImage ? <Image src={request.styleImage} alt={request.styleName ?? "Requested Fit"} fill sizes="(max-width: 768px) 100vw, 240px" className="object-cover" unoptimized /> : <div className="grid h-full min-h-64 place-items-center text-xs text-stone-600">No Fit image captured</div>}
              </div>
              <div className="p-6 sm:p-8">
                <p className="text-[9px] uppercase tracking-wider text-stone-600">Client</p>
                <p className="mt-2 font-display text-2xl">{request.customer ? `${request.customer.firstName} ${request.customer.lastName}` : "Profile unavailable"}</p>
                <p className="mt-2 text-sm text-stone-400">{request.customer?.email ?? valueLabel(request.contactInfo.email)}</p>
                <p className="mt-1 text-sm text-stone-400">{request.customer?.phone ?? valueLabel(request.contactInfo.phone)}</p>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <div><span className="text-[9px] uppercase text-stone-600">Fabric</span><p className="mt-1 text-xs">{valueLabel(request.fabric.name)}</p></div>
                  <div><span className="text-[9px] uppercase text-stone-600">Colour</span><p className="mt-1 text-xs">{valueLabel(request.colour.name)}</p></div>
                  <div><span className="text-[9px] uppercase text-stone-600">Fit preference</span><p className="mt-1 text-xs capitalize">{request.fitPreference ?? "Not provided"}</p></div>
                  <div><span className="text-[9px] uppercase text-stone-600">Required date</span><p className="mt-1 text-xs">{request.requiredDate ?? "Not provided"}</p></div>
                </div>
              </div>
            </div>
          </section>

          {request.clientMessage && <section className="rounded-3xl border border-amber-800/50 bg-amber-950/20 p-6"><p className="text-[9px] uppercase tracking-wider text-amber-500">Latest client-facing request</p><p className="mt-3 text-sm leading-6 text-amber-100">{request.clientMessage}</p></section>}
          {request.lastClientResponse && <section className="rounded-3xl border border-blue-800/50 bg-blue-950/20 p-6"><p className="text-[9px] uppercase tracking-wider text-blue-400">Latest client response</p><p className="mt-3 text-sm leading-6 text-blue-100">{request.lastClientResponse}</p></section>}
          <DetailGrid title="Measurements snapshot" values={{
            ...measurements,
            unit: request.measurementsSnapshot.unit ?? "Not recorded - confirm before production",
            method: request.measurementsSnapshot.method,
            verificationStatus: request.measurementsSnapshot.verificationStatus,
          }} />
          <DetailGrid title="Customization choices" values={{ ...request.preferences, specialInstructions: request.specialInstructions }} />
          <DetailGrid title="Occasion and schedule" values={{ occasion: request.occasion, eventName: request.eventName, eventDate: request.eventDate, requiredDate: request.requiredDate, appointment: request.appointmentRequest }} />

          <section className="rounded-3xl border border-stone-800 bg-stone-950/60 p-6 sm:p-8">
            <h2 className="text-xs font-mono uppercase tracking-[0.24em] text-champagne">Client references</h2>
            {request.referenceImages.length === 0 ? <p className="mt-5 text-sm text-stone-500">No reference images were submitted.</p> : (
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {request.referenceImages.map((image) => image.signedUrl ? <a key={image.path} href={image.signedUrl} target="_blank" rel="noreferrer" className="rounded-xl border border-stone-700 p-4 text-xs text-stone-300 hover:border-champagne/50">{image.filename}<ExternalLink className="ml-2 inline h-3.5 w-3.5" /></a> : <span key={image.path} className="rounded-xl border border-stone-800 p-4 text-xs text-stone-500">{image.filename} · unavailable</span>)}
              </div>
            )}
          </section>
          <WorkflowTimeline events={request.timeline} />
        </div>
        <div className="xl:sticky xl:top-28 xl:self-start"><RequestReviewPanel request={request} /></div>
      </div>
    </div>
  );
}
