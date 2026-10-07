import Link from "next/link";
import { CONCIERGE_CATEGORIES, CONCIERGE_STATUS_LABELS, type AtelierContextOptions } from "@/lib/atelier-service";
import { formatAtelierInstant } from "@/lib/atelier-time";
import { isUuid } from "@/lib/validation";
import { getAtelierContact, getAtelierThread, listAtelierConversations } from "@/lib/server/atelier-service";
import { createAtelierConciergeAction, sendAtelierMessageAction, setAtelierConversationStatusAction } from "@/app/atelier-actions";
import { AtelierField, AtelierForm } from "./AtelierForm";
import { ContextFields, ContextLinks, ServiceEmpty, ServiceHeader } from "./ServiceUI";
import { ConciergeMessages } from "./ConciergeMessages";
import { atelierButton, atelierInput, atelierPanel } from "./styles";

export type ConciergeSearch = { status?: string; unread?: string; before?: string; beforeId?: string; page?: string };

export function NewConciergeForm({ options }: { options: AtelierContextOptions }) {
  return <section className={atelierPanel}><h1 className="mb-3 font-display text-2xl">Private communication with TCC</h1><p className="mb-6 text-sm leading-6 text-stone-400">Speak with the atelier about a visit, a bespoke request, or your order. Formal request changes and payment receipts remain in their dedicated areas.</p>
    <AtelierForm action={createAtelierConciergeAction} label="Send to TCC Concierge" createdHref="/account/concierge">
      <AtelierField label="About"><select name="category" className={atelierInput}>{Object.entries(CONCIERGE_CATEGORIES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></AtelierField>
      <AtelierField label="Subject"><input name="subject" minLength={3} maxLength={160} required className={atelierInput} /></AtelierField>
      <ContextFields options={options} includeAppointment />
      <AtelierField label="Your message"><textarea name="message" rows={6} minLength={3} maxLength={4000} required className={atelierInput} /></AtelierField>
      <p className="text-xs text-stone-500">Up to 4,000 characters. Sent messages are retained and cannot be edited or deleted.</p>
    </AtelierForm></section>;
}

export async function ConciergeListPage({ staff, searchParams }: { staff: boolean; searchParams: Promise<ConciergeSearch> }) {
  const params = await searchParams;
  const status = Object.hasOwn(CONCIERGE_STATUS_LABELS, params.status ?? "") ? params.status : undefined;
  const page = /^\d+$/.test(params.page ?? "") ? Number(params.page) : 0;
  const validCursor = Boolean(params.before && Number.isFinite(Date.parse(params.before)) && params.beforeId && isUuid(params.beforeId));
  const result = await listAtelierConversations(staff, { status, unread: params.unread === "1", page,
    before: validCursor ? params.before : undefined, beforeId: validCursor ? params.beforeId : undefined });
  const base = staff ? "/admin/concierge" : "/account/concierge";
  const last = result.conversations.at(-1);
  const next = new URLSearchParams(staff ? { status: status ?? "", unread: params.unread ?? "", before: last?.last_message_at ?? last?.created_at ?? "", beforeId: last?.id ?? "" } : { page: String(page + 1) });
  return <div className="space-y-7"><ServiceHeader eyebrow="TCC Concierge" title={staff ? "Client conversations" : "Your private Concierge"} description={staff ? "Client messages, shared TCC read state and private atelier replies. Formal request changes stay in the Requests workflow." : "Direct communication with the atelier. Your conversations and replies are private to your account and authorized TCC staff."}>
    {!staff && <Link className={atelierButton} href={`${base}/new`}>Start a conversation</Link>}
  </ServiceHeader>
    {staff && <form method="get" className="flex flex-wrap items-end gap-4"><label className="text-xs text-stone-400">Status<select name="status" defaultValue={status ?? ""} className={atelierInput}><option value="">All conversations</option>{Object.entries(CONCIERGE_STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label className="flex items-center gap-2 py-3 text-xs text-stone-400"><input type="checkbox" name="unread" value="1" defaultChecked={params.unread === "1"} /> Unread by TCC</label><button className={atelierButton}>Filter inbox</button></form>}
    {result.conversations.length ? <div className="grid gap-4">{result.conversations.map(row => <article key={row.id} className={atelierPanel}>
      <div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><p className="font-mono text-[10px] text-champagne">{row.reference_code}</p><h2 className="mt-2 break-words font-display text-xl"><Link href={`${base}/${row.id}`} className="hover:text-champagne">{row.subject}</Link></h2>
        {staff && row.client_name && <p className="mt-2 text-sm text-stone-400">{row.client_name}</p>}</div>
        {Boolean(row.unread_messages) && <span className="rounded-full bg-champagne/10 px-3 py-1 text-xs text-champagne">{row.unread_messages} unread</span>}
      </div><p className="mt-4 line-clamp-2 break-words text-sm text-stone-400 [overflow-wrap:anywhere]">{row.latest_message?.message ?? row.message}</p>
      <p className="mt-3 text-xs text-stone-500">{CONCIERGE_STATUS_LABELS[row.status] ?? row.status} · {formatAtelierInstant(row.last_message_at ?? row.created_at)}</p>
      <div className="mt-5"><ContextLinks staff={staff} order={row.context_order_id} request={row.context_request_id} appointment={row.context_appointment_id} /></div>
      <Link href={`${base}/${row.id}`} className="mt-4 inline-block text-xs text-champagne">Open conversation →</Link>
    </article>)}</div> : <ServiceEmpty>No conversations match this view.</ServiceEmpty>}
    <nav aria-label="Conversation pages" className="flex flex-wrap gap-5 text-sm text-champagne">{(page > 0 || validCursor) && <Link href={base}>Back to newest</Link>}{result.has_more && <Link href={`${base}?${next}`}>Older conversations →</Link>}</nav>
  </div>;
}

export async function ConciergeDetailPage({ id, staff }: { id: string; staff: boolean }) {
  const thread = await getAtelierThread(id, staff);
  const conversation = thread.conversation;
  const contact = staff ? await getAtelierContact(conversation.customer_id) : null;
  const base = staff ? "/admin" : "/account";
  const open = ["open", "in_review", "awaiting_customer"].includes(conversation.status);
  return <div className="mx-auto max-w-4xl space-y-7"><Link href={`${base}/concierge`} className="text-xs text-champagne">← Concierge</Link>
    <ServiceHeader eyebrow={conversation.reference_code} title={conversation.subject} description={`${CONCIERGE_STATUS_LABELS[conversation.status] ?? conversation.status} · Private communication with TCC`} />
    <section className={`${atelierPanel} space-y-5`}>
      {contact && <div><p className="font-display text-xl">{contact.first_name} {contact.last_name}</p><p className="mt-2 break-words text-sm text-stone-400">{contact.email} · {contact.phone || "Phone not recorded"}</p></div>}
      <ContextLinks staff={staff} order={conversation.context_order_id ?? conversation.related_order_id} request={conversation.context_request_id ?? conversation.related_request_id} appointment={conversation.context_appointment_id ?? conversation.related_appointment_id} />
      <ConciergeMessages key={id} requestId={id} initialMessages={thread.messages} initialHasMore={thread.has_more} initialReadSeq={staff ? conversation.staff_read_seq : conversation.client_read_seq} staff={staff} />
    </section>
    <section className={atelierPanel}><h2 className="mb-5 font-display text-xl">{staff ? "Reply as TCC Concierge" : "Your reply"}</h2>
      {open ? <AtelierForm action={sendAtelierMessageAction} values={{ requestId: id }} label={staff ? "Send TCC reply" : "Send reply"} resetOnSuccess>
        <AtelierField label="Message"><textarea name="message" rows={5} maxLength={4000} required className={atelierInput} /></AtelierField>
        <p className="text-xs leading-5 text-stone-500">Sent messages cannot be edited or deleted. Do not share passwords or payment credentials.</p>
      </AtelierForm> : <p className="text-sm text-stone-400">This conversation is {conversation.status}. {staff ? "Reopen it below to reply." : "TCC can reopen it, or you can start a new conversation."}</p>}
    </section>
    {staff && <section className={atelierPanel}><h2 className="mb-5 font-display text-xl">Conversation status</h2><AtelierForm action={setAtelierConversationStatusAction} values={{ requestId: id, expectedVersion: conversation.lock_version }} label="Update conversation" confirmText="Change this conversation's status? Closing or resolving prevents further messages until TCC explicitly reopens it. History is retained.">
      <AtelierField label="Status"><select name="status" defaultValue={conversation.status} className={atelierInput}>{Object.entries(CONCIERGE_STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></AtelierField>
    </AtelierForm></section>}
  </div>;
}
