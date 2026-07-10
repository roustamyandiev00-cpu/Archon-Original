"use client";

import { useEffect, useRef, useState } from "react";
import {
  Send,
  Loader2,
  MessageCircle,
  HardHat,
  Paperclip,
  FileText,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { sendMessage, sendAttachments } from "@/app/dashboard/comms/actions";

type Attachment = {
  url: string;
  name: string;
  mime?: string;
  size?: number;
  isImage?: boolean;
};

export type ChannelSummary = {
  id: string;
  name: string | null;
  werkpostId: string | null;
  werkpostTitel: string | null;
  lastMessageAt: string | null;
  counterpartNaam: string;
};

type MessageRow = {
  id: string;
  channel_id: string | null;
  sender_company_id: number | null;
  content: string | null;
  type: string | null;
  attachments: unknown;
  created_at: string | null;
};

function parseAttachments(value: unknown): Attachment[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (a): a is Attachment =>
      Boolean(a) && typeof a === "object" && "url" in (a as object),
  );
}

export default function ChatClient({
  channels,
  companyId,
  selectedId: controlledSelectedId,
  onSelectChannel,
  showChannelList = true,
}: {
  channels: ChannelSummary[];
  companyId: number;
  selectedId?: string | null;
  onSelectChannel?: (id: string) => void;
  /** Verberg de ingebouwde kanalenlijst (bv. bij Bouwnetwerk-hub met externe sidebar). */
  showChannelList?: boolean;
}) {
  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(
    channels[0]?.id ?? null,
  );
  const selectedId = controlledSelectedId ?? internalSelectedId;
  const setSelectedId = (id: string) => {
    onSelectChannel?.(id);
    if (controlledSelectedId === undefined) setInternalSelectedId(id);
  };
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [loadedChannelId, setLoadedChannelId] = useState<string | null>(null);
  const loading = selectedId !== null && loadedChannelId !== selectedId;
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!selectedId) return;
    const supabase = createClient();
    let cancelled = false;

    supabase
      .from("bouwnetwerk_messages")
      .select(
        "id, channel_id, sender_company_id, content, type, attachments, created_at",
      )
      .eq("channel_id", selectedId)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (!cancelled) {
          setMessages((data ?? []) as MessageRow[]);
          setLoadedChannelId(selectedId);
        }
      });

    const channel = supabase
      .channel(`bouwnetwerk_messages:${selectedId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "bouwnetwerk_messages",
          filter: `channel_id=eq.${selectedId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as MessageRow]);
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [selectedId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId || !text.trim()) return;
    setSendError(null);
    setSending(true);
    const res = await sendMessage(selectedId, text);
    setSending(false);
    if ("error" in res && res.error) {
      setSendError(res.error);
      return;
    }
    setText("");
  }

  async function handleFiles(list: FileList | null) {
    if (!selectedId || !list || list.length === 0) return;
    setUploadError(null);
    setUploading(true);
    const fd = new FormData();
    for (const file of Array.from(list)) fd.append("files", file);
    if (text.trim()) fd.append("content", text.trim());
    const res = await sendAttachments(selectedId, fd);
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
    if ("error" in res && res.error) {
      setUploadError(res.error);
    } else {
      setText("");
    }
  }

  const selected = channels.find((c) => c.id === selectedId);

  const emptyChannels = (
    <div className="grid place-items-center rounded-2xl border border-dashed border-white/10 bg-zinc-900/40 px-6 py-16 text-center">
      <div className="max-w-md space-y-2">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-sky-500/10 text-sky-400">
          <MessageCircle size={22} />
        </span>
        <h3 className="text-base font-semibold text-zinc-100">
          Nog geen gesprekken
        </h3>
        <p className="text-sm text-zinc-500">
          Zodra je een reactie op een werkpost accepteert in{" "}
          <span className="text-zinc-300">Bouwnetwerk</span>, verschijnt de
          chat met die tegenpartij hier.
        </p>
      </div>
    </div>
  );

  if (channels.length === 0) {
    return emptyChannels;
  }

  const chatPane = (
    <div className={`flex min-h-[420px] flex-col ${showChannelList ? "" : "h-full min-h-[480px] rounded-2xl border border-white/10 bg-zinc-900/50"}`}>
        {selected && (
          <div className="border-b border-white/10 px-5 py-3">
            <p className="text-sm font-medium text-zinc-100">
              {selected.counterpartNaam}
            </p>
            {selected.werkpostTitel && (
              <p className="text-xs text-zinc-500">{selected.werkpostTitel}</p>
            )}
          </div>
        )}

        <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {loading ? (
            <div
              role="status"
              aria-live="polite"
              className="grid h-full place-items-center text-zinc-500"
            >
              <Loader2 size={18} className="animate-spin" aria-hidden />
              <span className="sr-only">Berichten laden</span>
            </div>
          ) : messages.length === 0 ? (
            <p className="text-sm text-zinc-500">
              Nog geen berichten. Stuur het eerste bericht hieronder.
            </p>
          ) : (
            messages.map((m) => {
              const isMine = m.sender_company_id === companyId;
              const attachments = parseAttachments(m.attachments);
              return (
                <div
                  key={m.id}
                  className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[75%] space-y-2 rounded-2xl px-3.5 py-2 text-sm ${
                      isMine
                        ? "bg-sky-500 text-zinc-950"
                        : "bg-white/[0.06] text-zinc-100"
                    }`}
                  >
                    {attachments.length > 0 && (
                      <div className="space-y-2">
                        {attachments.map((att, i) =>
                          att.isImage ? (
                            <a
                              key={`${att.url}-${i}`}
                              href={att.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block overflow-hidden rounded-lg"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={att.url}
                                alt={att.name}
                                loading="lazy"
                                className="max-h-48 w-full object-cover"
                              />
                            </a>
                          ) : (
                            <a
                              key={`${att.url}-${i}`}
                              href={att.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium ${
                                isMine
                                  ? "bg-zinc-950/15 text-zinc-900"
                                  : "bg-white/[0.06] text-zinc-100"
                              }`}
                            >
                              <FileText size={14} />
                              <span className="truncate">{att.name}</span>
                            </a>
                          ),
                        )}
                      </div>
                    )}
                    {m.content && <p>{m.content}</p>}
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {(uploadError || sendError) && (
          <p className="border-t border-white/10 px-4 py-2 text-xs text-rose-400">
            {uploadError ?? sendError}
          </p>
        )}
        <form
          onSubmit={handleSend}
          className="flex items-center gap-2 border-t border-white/10 px-4 py-3"
        >
          <input
            ref={fileRef}
            type="file"
            multiple
            accept="image/*,application/pdf"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading || !selectedId}
            aria-label="Bijlage toevoegen"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/10 text-zinc-300 transition-colors hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {uploading ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Paperclip size={15} />
            )}
          </button>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Typ een bericht…"
            className="flex-1 rounded-xl border border-white/10 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-500 focus:border-sky-500/60"
          />
          <button
            type="submit"
            disabled={sending || !text.trim()}
            aria-label="Bericht versturen"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-sky-500 text-zinc-950 transition-colors hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {sending ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Send size={15} />
            )}
          </button>
        </form>
      </div>
  );

  if (!showChannelList) {
    if (!selectedId) {
      return (
        <div className="grid h-full min-h-[480px] place-items-center rounded-2xl border border-white/10 bg-zinc-900/50 px-6 text-center">
          <div className="max-w-md space-y-3">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-sky-500/10 text-sky-400">
              <MessageCircle size={26} />
            </span>
            <h3 className="text-lg font-semibold text-zinc-100">
              Welkom bij BouwNetwerk
            </h3>
            <p className="text-sm text-zinc-500">
              Selecteer een kanaal om te beginnen met chatten
            </p>
          </div>
        </div>
      );
    }
    return chatPane;
  }

  return (
    <div className="grid grid-cols-1 overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/50 sm:grid-cols-[260px_1fr]">
      <div className="border-b border-white/10 sm:border-b-0 sm:border-r">
        <div className="border-b border-white/10 px-4 py-3">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
            Gesprekken
          </h2>
        </div>
        <div className="max-h-[420px] overflow-y-auto">
          {channels.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedId(c.id)}
              className={`flex w-full flex-col gap-0.5 border-b border-white/5 px-4 py-3 text-left transition-colors last:border-0 hover:bg-white/[0.04] ${
                selectedId === c.id ? "bg-white/[0.06]" : ""
              }`}
            >
              <span className="truncate text-sm font-medium text-zinc-100">
                {c.counterpartNaam}
              </span>
              {c.werkpostTitel && (
                <span className="flex items-center gap-1 truncate text-xs text-zinc-500">
                  <HardHat size={11} /> {c.werkpostTitel}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
      {chatPane}
    </div>
  );
}
