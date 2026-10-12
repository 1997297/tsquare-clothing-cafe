"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { loadAtelierMessagesAction, markAtelierReadAction } from "@/app/atelier-actions";
import type { AtelierMessage } from "@/lib/atelier-service";
import { formatAtelierInstant } from "@/lib/atelier-time";
import { atelierButton } from "./styles";

export function ConciergeMessages({ requestId, initialMessages, initialHasMore, initialReadSeq, staff, children }: {
  requestId: string; initialMessages: AtelierMessage[]; initialHasMore: boolean; initialReadSeq: number; staff: boolean; children?: ReactNode;
}) {
  const router = useRouter();
  const [messages, setMessages] = useState(initialMessages);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [readError, setReadError] = useState("");
  const [readRetry, setReadRetry] = useState(0);
  const loading = useRef(false);
  const queued = useRef(false);
  const loadedMessages = useRef(initialMessages);
  const readThrough = useRef(initialReadSeq);
  const lastSequence = messages.at(-1)?.message_seq ?? 0;
  const viewport = useRef<HTMLDivElement>(null);
  const followLatest = useRef(true);
  const [newMessages, setNewMessages] = useState(false);

  const showLatest = () => {
    const node = viewport.current;
    if (node) node.scrollTop = node.scrollHeight;
    followLatest.current = true;
    setNewMessages(false);
  };

  useEffect(() => {
    // Appending a page must not pull someone away from the history they are reading.
    if (followLatest.current) showLatest();
    else setNewMessages(true);
  }, [lastSequence]);

  const load = useCallback(async () => {
    if (loading.current) { queued.current = true; return; }
    loading.current = true; setBusy(true); setError("");
    try {
      do {
        queued.current = false;
        const after = loadedMessages.current.at(-1)?.message_seq ?? 0;
        const result = await loadAtelierMessagesAction({ requestId, after });
        if (!result.success) { setError(result.error); return; }
        // Only append a contiguous prefix. Never acknowledge a skipped page.
        if (result.messages.some((message, index) => message.message_seq !== after + index + 1)) {
          setError("Message history changed unexpectedly. Reload this conversation."); return;
        }
        loadedMessages.current = [...loadedMessages.current, ...result.messages];
        setMessages(loadedMessages.current); setHasMore(result.hasMore);
        // A send completed while this snapshot was in flight: fetch again from the
        // actual loaded boundary. Never lose that refresh or skip undisplayed rows.
      } while (queued.current);
      router.refresh();
    } catch { setError("Messages could not be refreshed. Please try again."); }
    finally { loading.current = false; setBusy(false); }
  }, [requestId, router]);

  useEffect(() => {
    const refresh = () => { void load(); };
    window.addEventListener("tcc-atelier-updated", refresh);
    return () => window.removeEventListener("tcc-atelier-updated", refresh);
  }, [load]);

  useEffect(() => {
    if (!lastSequence || lastSequence <= readThrough.current) return;
    let active = true;
    // This effect runs after the prefix is committed to the DOM, not during GET/render.
    void markAtelierReadAction({ requestId, observedMessageSeq: lastSequence }).then(result => {
      if (!active) return;
      if (result.success) {
        readThrough.current = lastSequence; setReadError(""); router.refresh();
        window.dispatchEvent(new Event("tcc-atelier-counts-updated"));
      } else setReadError("Read status could not be saved. Your messages are still available.");
    }).catch(() => { if (active) setReadError("Read status could not be saved. Please retry."); });
    return () => { active = false; };
  }, [lastSequence, requestId, readRetry, router]);

  return <div className="space-y-5">
    <div ref={viewport} role="region" aria-label="Conversation history" tabIndex={0} className="max-h-[32rem] min-w-0 overflow-y-auto overscroll-contain rounded-xl p-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-champagne" onScroll={() => {
      const node = viewport.current;
      if (!node) return;
      followLatest.current = node.scrollHeight - node.scrollTop - node.clientHeight < 64;
      if (followLatest.current) setNewMessages(false);
    }}>
      <ol aria-label="Conversation messages" className="space-y-4">{messages.map(message => <li key={message.id} data-sender={message.sender_type} className={`w-fit min-w-0 max-w-[92%] rounded-2xl px-4 py-3 sm:max-w-[85%] sm:px-5 ${message.sender_type === "concierge" ? "ml-auto rounded-br-sm bg-champagne/25" : "mr-auto rounded-bl-sm bg-surface-elevated"}`}>
        <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-1"><span className="text-xs font-semibold text-warm-ivory">{message.sender_type === "concierge" ? "TCC Concierge" : staff ? "Client" : "You"}</span><time dateTime={message.created_at} className="text-[11px] text-stone-400">{formatAtelierInstant(message.created_at)}</time></div>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-stone-300 [overflow-wrap:anywhere]">{message.message}</p>
      </li>)}</ol>
    </div>
    {messages.length === 0 && <p className="text-sm text-stone-500">No messages recorded yet.</p>}
    {newMessages && <div role="status"><button type="button" onClick={showLatest} className="rounded-lg px-3 py-2 text-sm text-champagne underline focus-visible:outline-champagne">New messages below — view latest</button></div>}
    {children}
    {error && <p role="alert" className="text-sm text-rose-400">{error}</p>}
    {readError && <p role="alert" className="text-sm text-amber-400">{readError} <button onClick={() => setReadRetry(value => value + 1)} className="underline">Retry read status</button></p>}
    <button type="button" className={atelierButton} disabled={busy} onClick={() => void load()}>{busy ? "Loading…" : hasMore ? "Load next messages" : "Refresh messages"}</button>
    {hasMore && <p className="text-xs text-stone-500">More messages are available. Undisplayed messages remain unread.</p>}
    <p className="text-xs text-stone-500">{staff ? "Opening displayed messages marks them read by TCC, shared across active staff." : "Only displayed messages are marked read. Use refresh to check for new replies."}</p>
  </div>;
}
