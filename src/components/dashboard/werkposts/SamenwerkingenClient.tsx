"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Send,
  Loader2,
  Handshake,
  HardHat,
  Paperclip,
  FileText,
  MessageCircle,
  CalendarPlus,
  CalendarDays,
  MapPin,
  Download,
  Check,
  X,
  ImageIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { sendMessage, sendAttachments } from "@/app/dashboard/comms/actions";
import {
  createAfspraak,
  updateAfspraakStatus,
  type AfspraakInput,
} from "@/app/dashboard/werkposts/samenwerkingen/actions";

type Attachment = {
  url: string;
  name: string;
  mime?: string;
  size?: number;
  isImage?: boolean;
};

export type Samenwerking = {
  channelId: string;
  counterpartId: number | null;
  counterpartNaam: string;
  werkpostTitel: string | null;
  lastMessageAt: string | null;
};

export type AfspraakRow = {
  id: number;
  channelId: string | null;
  titel: string;
  beschrijving: string | null;
  locatie: string | null;
  startTijd: string | null;
  eindTijd: string | null;
  status: string | null;
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

type Tab = "chat" | "documenten" | "afspraken";

const inputClass =
  "w-full rounded-xl border border-white/10 bg-zinc-900/70 px-3 py-2.5 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-500 focus:border-sky-500/60";
const labelClass = "mb-1.5 block text-xs font-medium text-zinc-300";

function parseAttachments(value: unknown): Attachment[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (a): a is Attachment =>
      Boolean(a) && typeof a === "object" && "url" in (a as object),
  );
}

function formatBytes(bytes?: number): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDateTime(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleString("nl-NL", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const statusMeta: Record<string, { label: string; className: string }> = {
  gepland: { label: "Gepland", className: "bg-sky-500/10 text-sky-300" },
  bevestigd: {
    label: "Bevestigd",
    className: "bg-emerald-500/10 text-emerald-300",
  },
  geannuleerd: { label: "Geannuleerd", className: "bg-rose-500/10 text-rose-300" },
  afgerond: { label: "Afgerond", className: "bg-zinc-500/15 text-zinc-300" },
};

function downloadIcs(a: AfspraakRow, organisator: string) {
  if (!a.startTijd) return;
  const toUtc = (iso: string) =>
    new Date(iso).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const end =
    a.eindTijd ??
    new Date(new Date(a.startTijd).getTime() + 60 * 60 * 1000).toISOString();
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ArchonPro//Bouwnetwerk//NL",
    "BEGIN:VEVENT",
    `UID:archonpro-afspraak-${a.id}@archonpro`,
    `DTSTAMP:${toUtc(new Date().toISOString())}`,
    `DTSTART:${toUtc(a.startTijd)}`,
    `DTEND:${toUtc(end)}`,
    `SUMMARY:${a.titel}`,
    a.locatie ? `LOCATION:${a.locatie}` : "",
    a.beschrijving
      ? `DESCRIPTION:${a.beschrijving.replace(/\n/g, "\\n")} (via ${organisator})`
      : `DESCRIPTION:Afspraak via ArchonPro Bouwnetwerk (${organisator})`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);
  const blob = new Blob([lines.join("\r\n")], { type: "text/calendar" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `afspraak-${a.id}.ics`;
  link.click();
  URL.revokeObjectURL(url);
}

export default function SamenwerkingenClient({
  samenwerkingen,
  afspraken,
  companyId,
}: {
  samenwerkingen: Samenwerking[];
  afspraken: AfspraakRow[];
  companyId: number;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(
    samenwerkingen[0]?.channelId ?? null,
  );
  const [tab, setTab] = useState<Tab>("chat");
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [loadedChannelId, setLoadedChannelId] = useState<string | null>(null);
  const loading = selectedId !== null && loadedChannelId !== selectedId;

  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const docRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const selected = samenwerkingen.find((s) => s.channelId === selectedId);

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
      .channel(`samenwerking_messages:${selectedId}`)
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
    if (tab === "chat") bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, tab]);

  const documents = useMemo(() => {
    const items: { att: Attachment; at: string | null; mine: boolean }[] = [];
    for (const m of messages) {
      for (const att of parseAttachments(m.attachments)) {
        items.push({
          att,
          at: m.created_at,
          mine: m.sender_company_id === companyId,
        });
      }
    }
    return items.reverse();
  }, [messages, companyId]);

  const channelAfspraken = useMemo(
    () =>
      afspraken.filter((a) => a.channelId === selectedId),
    [afspraken, selectedId],
  );

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId || !text.trim()) return;
    setSending(true);
    const res = await sendMessage(selectedId, text);
    setSending(false);
    if (!("error" in res && res.error)) setText("");
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
    if (docRef.current) docRef.current.value = "";
    if ("error" in res && res.error) setUploadError(res.error);
    else setText("");
  }

  if (samenwerkingen.length === 0) {
    return (
      <div className="grid place-items-center rounded-2xl border border-dashed border-white/10 bg-zinc-900/40 px-6 py-16 text-center">
        <div className="max-w-md space-y-2">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-sky-500/10 text-sky-400">
            <Handshake size={22} />
          </span>
          <h3 className="text-base font-semibold text-zinc-100">
            Nog geen samenwerkingen
          </h3>
          <p className="text-sm text-zinc-500">
            Zodra je een reactie op een werkpost accepteert in{" "}
            <span className="text-zinc-300">Bouwnetwerk</span>, verschijnt hier de
            gedeelde werkruimte met die partner: chat, documenten en afspraken.
          </p>
        </div>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: typeof MessageCircle }[] = [
    { id: "chat", label: "Chat", icon: MessageCircle },
    { id: "documenten", label: "Documenten", icon: FileText },
    { id: "afspraken", label: "Afspraken", icon: CalendarDays },
  ];

  return (
    <div className="grid grid-cols-1 overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/50 lg:grid-cols-[260px_1fr]">
      {/* Lijst met samenwerkingen */}
      <div className="border-b border-white/10 lg:border-b-0 lg:border-r">
        <div className="border-b border-white/10 px-4 py-3">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
            Partners
          </h2>
        </div>
        <div className="max-h-[200px] overflow-y-auto lg:max-h-[560px]">
          {samenwerkingen.map((s) => (
            <button
              key={s.channelId}
              onClick={() => setSelectedId(s.channelId)}
              className={`flex w-full flex-col gap-0.5 border-b border-white/5 px-4 py-3 text-left transition-colors last:border-0 hover:bg-white/[0.04] ${
                selectedId === s.channelId ? "bg-white/[0.06]" : ""
              }`}
            >
              <span className="truncate text-sm font-medium text-zinc-100">
                {s.counterpartNaam}
              </span>
              {s.werkpostTitel && (
                <span className="flex items-center gap-1 truncate text-xs text-zinc-500">
                  <HardHat size={11} /> {s.werkpostTitel}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Werkruimte */}
      <div className="flex min-h-[520px] flex-col">
        {selected && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-3">
            <div>
              <p className="text-sm font-medium text-zinc-100">
                {selected.counterpartNaam}
              </p>
              {selected.werkpostTitel && (
                <p className="text-xs text-zinc-500">{selected.werkpostTitel}</p>
              )}
            </div>
            <div className="flex items-center gap-1 rounded-full border border-white/10 bg-zinc-950/40 p-1">
              {tabs.map((t) => {
                const Icon = t.icon;
                const active = tab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                      active
                        ? "bg-sky-500 text-zinc-950"
                        : "text-zinc-400 hover:text-zinc-100"
                    }`}
                  >
                    <Icon size={13} /> {t.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {tab === "chat" && (
          <ChatPanel
            loading={loading}
            messages={messages}
            companyId={companyId}
            text={text}
            setText={setText}
            sending={sending}
            uploading={uploading}
            uploadError={uploadError}
            fileRef={fileRef}
            bottomRef={bottomRef}
            onSend={handleSend}
            onFiles={handleFiles}
          />
        )}

        {tab === "documenten" && (
          <DocumentsPanel
            loading={loading}
            documents={documents}
            uploading={uploading}
            uploadError={uploadError}
            docRef={docRef}
            onFiles={handleFiles}
          />
        )}

        {tab === "afspraken" && selected && selectedId && (
          <AfsprakenPanel
            channelId={selectedId}
            counterpartId={selected.counterpartId}
            counterpartNaam={selected.counterpartNaam}
            afspraken={channelAfspraken}
          />
        )}
      </div>
    </div>
  );
}

function ChatPanel({
  loading,
  messages,
  companyId,
  text,
  setText,
  sending,
  uploading,
  uploadError,
  fileRef,
  bottomRef,
  onSend,
  onFiles,
}: {
  loading: boolean;
  messages: MessageRow[];
  companyId: number;
  text: string;
  setText: (v: string) => void;
  sending: boolean;
  uploading: boolean;
  uploadError: string | null;
  fileRef: React.RefObject<HTMLInputElement | null>;
  bottomRef: React.RefObject<HTMLDivElement | null>;
  onSend: (e: React.FormEvent) => void;
  onFiles: (list: FileList | null) => void;
}) {
  return (
    <>
      <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
        {loading ? (
          <div className="grid h-full place-items-center text-zinc-500">
            <Loader2 size={18} className="animate-spin" />
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
                  {m.content && <p className="whitespace-pre-wrap">{m.content}</p>}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {uploadError && (
        <p className="border-t border-white/10 px-4 py-2 text-xs text-rose-400">
          {uploadError}
        </p>
      )}
      <form
        onSubmit={onSend}
        className="flex items-center gap-2 border-t border-white/10 px-4 py-3"
      >
        <input
          ref={fileRef}
          type="file"
          multiple
          accept="image/*,application/pdf"
          className="hidden"
          onChange={(e) => onFiles(e.target.files)}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
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
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-sky-500 text-zinc-950 transition-colors hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {sending ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <Send size={15} />
          )}
        </button>
      </form>
    </>
  );
}

function DocumentsPanel({
  loading,
  documents,
  uploading,
  uploadError,
  docRef,
  onFiles,
}: {
  loading: boolean;
  documents: { att: Attachment; at: string | null; mine: boolean }[];
  uploading: boolean;
  uploadError: string | null;
  docRef: React.RefObject<HTMLInputElement | null>;
  onFiles: (list: FileList | null) => void;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-3">
        <p className="text-xs text-zinc-500">
          Alle bestanden die jullie via de chat delen, op één plek.
        </p>
        <input
          ref={docRef}
          type="file"
          multiple
          accept="image/*,application/pdf"
          className="hidden"
          onChange={(e) => onFiles(e.target.files)}
        />
        <button
          type="button"
          onClick={() => docRef.current?.click()}
          disabled={uploading}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-sky-500 px-3.5 py-2 text-xs font-medium text-zinc-950 transition-colors hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {uploading ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Paperclip size={14} />
          )}
          Document sturen
        </button>
      </div>

      {uploadError && (
        <p className="border-b border-white/10 px-5 py-2 text-xs text-rose-400">
          {uploadError}
        </p>
      )}

      <div className="flex-1 overflow-y-auto p-5">
        {loading ? (
          <div className="grid h-full place-items-center text-zinc-500">
            <Loader2 size={18} className="animate-spin" />
          </div>
        ) : documents.length === 0 ? (
          <div className="grid h-full place-items-center text-center text-sm text-zinc-500">
            <div className="space-y-1">
              <FileText size={22} className="mx-auto text-zinc-600" />
              <p>Nog geen documenten gedeeld.</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {documents.map(({ att, at, mine }, i) => (
              <a
                key={`${att.url}-${i}`}
                href={att.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-zinc-950/40 px-3 py-2.5 transition-colors hover:border-sky-500/40 hover:bg-white/[0.03]"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-sky-500/10 text-sky-400">
                  {att.isImage ? <ImageIcon size={16} /> : <FileText size={16} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-zinc-100">
                    {att.name}
                  </span>
                  <span className="block text-[11px] text-zinc-500">
                    {mine ? "Door jou" : "Ontvangen"}
                    {att.size ? ` · ${formatBytes(att.size)}` : ""}
                    {at ? ` · ${formatDateTime(at)}` : ""}
                  </span>
                </span>
                <Download size={15} className="shrink-0 text-zinc-500" />
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AfsprakenPanel({
  channelId,
  counterpartId,
  counterpartNaam,
  afspraken,
}: {
  channelId: string;
  counterpartId: number | null;
  counterpartNaam: string;
  afspraken: AfspraakRow[];
}) {
  const [titel, setTitel] = useState("");
  const [datum, setDatum] = useState("");
  const [startTijd, setStartTijd] = useState("");
  const [eindTijd, setEindTijd] = useState("");
  const [locatie, setLocatie] = useState("");
  const [beschrijving, setBeschrijving] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(false);
    setSaving(true);
    const payload: AfspraakInput = {
      channelId,
      counterpartId,
      counterpartNaam,
      titel,
      datum,
      startTijd,
      eindTijd: eindTijd || undefined,
      locatie: locatie || undefined,
      beschrijving: beschrijving || undefined,
    };
    const res = await createAfspraak(payload);
    setSaving(false);
    if ("error" in res && res.error) {
      setError(res.error);
      return;
    }
    setOk(true);
    setTitel("");
    setDatum("");
    setStartTijd("");
    setEindTijd("");
    setLocatie("");
    setBeschrijving("");
  }

  async function setStatus(id: number, status: "bevestigd" | "geannuleerd") {
    await updateAfspraakStatus(id, status);
  }

  return (
    <div className="grid flex-1 grid-cols-1 gap-0 overflow-hidden xl:grid-cols-[1fr_320px]">
      {/* Lijst */}
      <div className="order-2 flex-1 overflow-y-auto p-5 xl:order-1">
        {afspraken.length === 0 ? (
          <div className="grid h-full min-h-[160px] place-items-center text-center text-sm text-zinc-500">
            <div className="space-y-1">
              <CalendarDays size={22} className="mx-auto text-zinc-600" />
              <p>Nog geen afspraken met {counterpartNaam}.</p>
            </div>
          </div>
        ) : (
          <ul className="space-y-2.5">
            {afspraken.map((a) => {
              const meta = statusMeta[a.status ?? "gepland"] ?? statusMeta.gepland;
              return (
                <li
                  key={a.id}
                  className="rounded-xl border border-white/10 bg-zinc-950/40 p-3.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-zinc-100">
                        {a.titel}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-xs text-zinc-400">
                        <CalendarDays size={12} />
                        {formatDateTime(a.startTijd)}
                        {a.eindTijd
                          ? ` – ${new Date(a.eindTijd).toLocaleTimeString(
                              "nl-NL",
                              { hour: "2-digit", minute: "2-digit" },
                            )}`
                          : ""}
                      </p>
                      {a.locatie && (
                        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-zinc-500">
                          <MapPin size={12} /> {a.locatie}
                        </p>
                      )}
                      {a.beschrijving && (
                        <p className="mt-1 whitespace-pre-wrap text-xs text-zinc-400">
                          {a.beschrijving}
                        </p>
                      )}
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${meta.className}`}
                    >
                      {meta.label}
                    </span>
                  </div>
                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                    <button
                      onClick={() => downloadIcs(a, counterpartNaam)}
                      className="inline-flex items-center gap-1 rounded-full border border-white/10 px-2.5 py-1 text-[11px] font-medium text-zinc-300 transition-colors hover:bg-white/5"
                    >
                      <Download size={11} /> Agenda (.ics)
                    </button>
                    {a.status !== "bevestigd" && a.status !== "geannuleerd" && (
                      <button
                        onClick={() => setStatus(a.id, "bevestigd")}
                        className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 px-2.5 py-1 text-[11px] font-medium text-emerald-300 transition-colors hover:bg-emerald-500/10"
                      >
                        <Check size={11} /> Bevestigen
                      </button>
                    )}
                    {a.status !== "geannuleerd" && (
                      <button
                        onClick={() => setStatus(a.id, "geannuleerd")}
                        className="inline-flex items-center gap-1 rounded-full border border-rose-500/30 px-2.5 py-1 text-[11px] font-medium text-rose-300 transition-colors hover:bg-rose-500/10"
                      >
                        <X size={11} /> Annuleren
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Nieuwe afspraak */}
      <form
        onSubmit={submit}
        className="order-1 space-y-3 border-b border-white/10 bg-zinc-950/30 p-5 xl:order-2 xl:border-b-0 xl:border-l"
      >
        <p className="flex items-center gap-1.5 text-sm font-medium text-zinc-100">
          <CalendarPlus size={15} className="text-sky-400" /> Nieuwe afspraak
        </p>
        <div>
          <label className={labelClass}>Titel</label>
          <input
            value={titel}
            onChange={(e) => setTitel(e.target.value)}
            placeholder="Bijv. Bezichtiging werf"
            className={inputClass}
            required
          />
        </div>
        <div>
          <label className={labelClass}>Datum</label>
          <input
            type="date"
            value={datum}
            onChange={(e) => setDatum(e.target.value)}
            className={inputClass}
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={labelClass}>Start</label>
            <input
              type="time"
              value={startTijd}
              onChange={(e) => setStartTijd(e.target.value)}
              className={inputClass}
              required
            />
          </div>
          <div>
            <label className={labelClass}>Einde</label>
            <input
              type="time"
              value={eindTijd}
              onChange={(e) => setEindTijd(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
        <div>
          <label className={labelClass}>Locatie</label>
          <input
            value={locatie}
            onChange={(e) => setLocatie(e.target.value)}
            placeholder="Adres of link"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Notitie</label>
          <textarea
            value={beschrijving}
            onChange={(e) => setBeschrijving(e.target.value)}
            rows={2}
            placeholder="Optionele details…"
            className={inputClass}
          />
        </div>

        {error && <p className="text-xs text-rose-400">{error}</p>}
        {ok && (
          <p className="text-xs text-emerald-400">
            Afspraak toegevoegd aan je agenda en gedeeld in de chat.
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-sky-500 px-4 py-2.5 text-sm font-medium text-zinc-950 transition-colors hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <CalendarPlus size={15} />
          )}
          In agenda plaatsen
        </button>
      </form>
    </div>
  );
}
