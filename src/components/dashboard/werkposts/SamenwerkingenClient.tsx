"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  Phone,
  Video,
  MoreVertical,
  Pin,
  Smile,
  Mic,
  Search,
  Plus,
  Star,
  Settings,
  CornerUpLeft,
  ArrowLeft,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { sendMessage, sendAttachments } from "@/app/dashboard/comms/actions";
import {
  createAfspraak,
  updateAfspraakStatus,
  submitCompanyReview,
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
  werkpostId: string | null;
  werkpostTitel: string | null;
  lastMessageAt: string | null;
  lastMessagePreview?: string | null;
};

export type PendingReactie = {
  id: string;
  werkpostId: string;
  werkpostTitel: string;
  companyNaam: string;
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

type RichMessage = {
  replyTo?: {
    sender: string;
    content: string;
  };
  callType?: "spraakoproep" | "video-oproep";
  duration?: string;
  audioUrl?: string;
  audioDuration?: string;
  text?: string;
};

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

function parseRichMessage(content: string | null): RichMessage | null {
  if (!content) return null;
  if (content.startsWith("{") && content.endsWith("}")) {
    try {
      return JSON.parse(content) as RichMessage;
    } catch (e) {
      // Return plain text on parse error
    }
  }
  return { text: content };
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

function formatTimeOnly(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("nl-NL", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

const statusMeta: Record<string, { label: string; className: string }> = {
  gepland: { label: "Gepland", className: "bg-sky-500/10 text-sky-300" },
  bevestigd: {
    label: "Bevestigd",
    className: "bg-cyan-500/10 text-cyan-300",
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

// Double checkmark helper
const DoubleCheck = ({ read }: { read: boolean }) => (
  <span className="flex items-center -space-x-1.5 select-none ml-1">
    <Check size={13} className={read ? "text-sky-400" : "text-zinc-500"} />
    <Check size={13} className={read ? "text-sky-400" : "text-zinc-500"} />
  </span>
);

function getAvatarGradient(name: string) {
  const gradients = [
    "from-sky-500 to-cyan-600",
    "from-indigo-500 to-violet-600",
    "from-violet-500 to-fuchsia-600",
    "from-cyan-500 to-blue-600",
    "from-sky-500 to-indigo-600",
  ];
  let sum = 0;
  for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
  return gradients[sum % gradients.length];
}

export default function SamenwerkingenClient({
  samenwerkingen,
  afspraken,
  companyId,
  myReviews = [],
  counterpartRatings = {},
  pendingReacties = [],
}: {
  samenwerkingen: Samenwerking[];
  afspraken: AfspraakRow[];
  companyId: number;
  myReviews?: { target_company_id: number; rating: number; commentaar: string }[];
  counterpartRatings?: Record<number, { avg: number; count: number }>;
  pendingReacties?: PendingReactie[];
}) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(
    samenwerkingen[0]?.channelId ?? null,
  );
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("chat");
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [loadedChannelId, setLoadedChannelId] = useState<string | null>(null);
  const loading = selectedId !== null && loadedChannelId !== selectedId;

  const [text, setText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [replyTo, setReplyTo] = useState<MessageRow | null>(null);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const docRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Review states
  const [isPendingReview, startReviewTransition] = useTransition();
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [newChatMenuOpen, setNewChatMenuOpen] = useState(false);
  const [settingsMenuOpen, setSettingsMenuOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const newChatMenuRef = useRef<HTMLDivElement>(null);
  const settingsMenuRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  const selected = samenwerkingen.find((s) => s.channelId === selectedId);

  const hasReviewed = (cid: number) => {
    return myReviews.some((r) => r.target_company_id === cid);
  };

  const openReview = (cid: number) => {
    const existing = myReviews.find((r) => r.target_company_id === cid);
    setReviewRating(existing ? existing.rating : 5);
    setReviewComment(existing ? existing.commentaar : "");
    setReviewError(null);
    setReviewModalOpen(true);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || !selected.counterpartId) return;
    setReviewError(null);
    
    startReviewTransition(async () => {
      const res = await submitCompanyReview(
        selected.counterpartId!,
        reviewRating,
        reviewComment
      );
      if ("error" in res && res.error) {
        setReviewError(res.error);
      } else {
        setReviewModalOpen(false);
        router.refresh();
      }
    });
  };

  useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      const target = e.target as Node;
      if (newChatMenuRef.current && !newChatMenuRef.current.contains(target)) {
        setNewChatMenuOpen(false);
      }
      if (settingsMenuRef.current && !settingsMenuRef.current.contains(target)) {
        setSettingsMenuOpen(false);
      }
      if (moreMenuRef.current && !moreMenuRef.current.contains(target)) {
        setMoreMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

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

  // Filtered partner list based on search
  const filteredSamenwerkingen = useMemo(() => {
    if (!searchQuery.trim()) return samenwerkingen;
    const q = searchQuery.toLowerCase();
    return samenwerkingen.filter((s) =>
      s.counterpartNaam.toLowerCase().includes(q) ||
      (s.werkpostTitel && s.werkpostTitel.toLowerCase().includes(q))
    );
  }, [samenwerkingen, searchQuery]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId || !text.trim()) return;
    setSendError(null);
    setSending(true);

    let finalContent = text.trim();
    if (replyTo) {
      finalContent = JSON.stringify({
        replyTo: {
          sender: replyTo.sender_company_id === companyId ? "Jezelf" : selected?.counterpartNaam || "Partner",
          content: parseRichMessage(replyTo.content)?.text || replyTo.content || "Bijlage",
        },
        text: text.trim(),
      });
    }

    const res = await sendMessage(selectedId, finalContent);
    setSending(false);
    if ("error" in res && res.error) {
      setSendError(res.error);
      return;
    }
    setText("");
    setReplyTo(null);
    router.refresh();
  }

  async function handleSendMockAudio() {
    if (!selectedId) return;
    setSendError(null);
    setSending(true);
    const audioContent = JSON.stringify({
      audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
      audioDuration: "0:07",
    });
    const res = await sendMessage(selectedId, audioContent);
    setSending(false);
    if ("error" in res && res.error) setSendError(res.error);
  }

  async function handleSendMockCall(type: "spraakoproep" | "video-oproep") {
    if (!selectedId) return;
    setSendError(null);
    setSending(true);
    const callContent = JSON.stringify({
      callType: type,
      duration: "3 min",
    });
    const res = await sendMessage(selectedId, callContent);
    setSending(false);
    if ("error" in res && res.error) setSendError(res.error);
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
    else {
      setText("");
      router.refresh();
    }
  }

  return (
    <div className="samenwerkingen-chat relative flex h-[min(820px,calc(100dvh-8.5rem))] min-h-[520px] overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-950 shadow-2xl shadow-black/40">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-sky-500/[0.07] via-indigo-500/[0.04] to-transparent" />
      
      {/* 1. Left Narrow Navigation Bar (~60px) */}
      <div className="relative hidden w-[60px] flex-col items-center justify-between border-r border-zinc-800/80 bg-zinc-900/70 py-4 backdrop-blur sm:flex shrink-0">
        <div className="flex flex-col items-center gap-5 w-full">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-500 text-zinc-950 shadow-md">
            <Handshake size={20} />
          </div>
          
          <div className="h-[1px] w-8 bg-white/10 my-1" />

          {/* Navigation Tabs */}
          <button
            onClick={() => {
              setTab("chat");
              setMobileChatOpen(false);
            }}
            title="Chats"
            className={`relative flex h-11 w-11 items-center justify-center rounded-xl transition-all ${
              tab === "chat"
                ? "bg-sky-500/15 text-sky-400"
                : "text-zinc-500 hover:bg-white/5 hover:text-zinc-200"
            }`}
          >
            <MessageCircle size={20} />
            {tab === "chat" && (
              <span className="absolute left-0 top-3 h-5 w-[3px] rounded-r-full bg-sky-400" />
            )}
            {samenwerkingen.length > 0 && (
              <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-sky-500 px-1 text-[9px] font-bold text-zinc-950">
                {Math.min(samenwerkingen.length, 9)}
              </span>
            )}
          </button>

          <button
            onClick={() => setTab("documenten")}
            title="Documenten"
            className={`relative flex h-11 w-11 items-center justify-center rounded-xl transition-all ${
              tab === "documenten"
                ? "bg-sky-500/15 text-sky-400"
                : "text-zinc-500 hover:bg-white/5 hover:text-zinc-200"
            }`}
          >
            <FileText size={20} />
            {tab === "documenten" && (
              <span className="absolute left-0 top-3 h-5 w-[3px] rounded-r-full bg-sky-400" />
            )}
          </button>

          <button
            onClick={() => setTab("afspraken")}
            title="Afspraken"
            className={`relative flex h-11 w-11 items-center justify-center rounded-xl transition-all ${
              tab === "afspraken"
                ? "bg-sky-500/15 text-sky-400"
                : "text-zinc-500 hover:bg-white/5 hover:text-zinc-200"
            }`}
          >
            <CalendarDays size={20} />
            {tab === "afspraken" && (
              <span className="absolute left-0 top-3 h-5 w-[3px] rounded-r-full bg-sky-400" />
            )}
          </button>
        </div>

        <div className="flex flex-col items-center gap-4 w-full" ref={settingsMenuRef}>
          {selected?.counterpartId && (
            <button
              onClick={() => openReview(selected.counterpartId!)}
              title={hasReviewed(selected.counterpartId!) ? "Beoordeling bewerken" : "Beoordeel partner"}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-amber-400 hover:bg-white/5 transition-all"
            >
              <Star size={18} fill={hasReviewed(selected.counterpartId!) ? "currentColor" : "none"} />
            </button>
          )}
          <div className="relative">
            <button
              type="button"
              title="Instellingen"
              onClick={() => setSettingsMenuOpen((open) => !open)}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-zinc-500 hover:bg-white/5 hover:text-zinc-300 transition-all"
            >
              <Settings size={18} />
            </button>
            {settingsMenuOpen && (
              <div className="absolute bottom-0 left-full z-50 ml-2 w-56 overflow-hidden rounded-xl border border-zinc-700/80 bg-zinc-900 py-1.5 shadow-2xl">
                <Link
                  href="/dashboard/werkposts"
                  onClick={() => setSettingsMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-200 hover:bg-white/5"
                >
                  <HardHat size={14} className="text-sky-400" />
                  Bouwnetwerk beheer
                </Link>
                {selected?.werkpostId && (
                  <Link
                    href={`/dashboard/werkposts/${selected.werkpostId}`}
                    onClick={() => setSettingsMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-200 hover:bg-white/5"
                  >
                    <FileText size={14} className="text-cyan-400" />
                    Gekoppelde werkpost
                  </Link>
                )}
                <Link
                  href="/bouwnetwerk"
                  onClick={() => setSettingsMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-200 hover:bg-white/5"
                >
                  <Handshake size={14} className="text-violet-400" />
                  Publieke feed
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Middle Panel: Partners / Chats list (~300px) */}
      <div
        className={`relative flex w-full flex-col border-r border-zinc-800/80 bg-zinc-900/50 sm:w-[340px] shrink-0 ${
          mobileChatOpen ? "hidden md:flex" : "flex"
        }`}
      >
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4">
          <h2 className="text-lg font-semibold tracking-tight text-zinc-100">Chats</h2>
          <div className="relative" ref={newChatMenuRef}>
            <button
              type="button"
              title="Nieuw gesprek"
              onClick={() => setNewChatMenuOpen((open) => !open)}
              className="relative grid h-9 w-9 place-items-center rounded-full text-zinc-400 transition-colors hover:bg-white/5 hover:text-zinc-200"
            >
              <Plus size={20} />
              {pendingReacties.length > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-sky-500 px-1 text-[9px] font-bold text-zinc-950">
                  {Math.min(pendingReacties.length, 9)}
                </span>
              )}
            </button>

            {newChatMenuOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-xl border border-zinc-700/80 bg-zinc-900 py-1.5 shadow-2xl">
                <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                  Start een samenwerking
                </p>
                <Link
                  href="/dashboard/werkposts"
                  onClick={() => setNewChatMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-sm text-zinc-200 transition-colors hover:bg-white/5"
                >
                  <HardHat size={15} className="text-sky-400" />
                  Naar Bouwnetwerk beheer
                </Link>
                <Link
                  href="/dashboard/werkposts/nieuw"
                  onClick={() => setNewChatMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-sm text-zinc-200 transition-colors hover:bg-white/5"
                >
                  <Plus size={15} className="text-sky-400" />
                  Nieuwe werkpost plaatsen
                </Link>
                <Link
                  href="/bouwnetwerk"
                  onClick={() => setNewChatMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-sm text-zinc-200 transition-colors hover:bg-white/5"
                >
                  <Handshake size={15} className="text-violet-400" />
                  Publieke feed bekijken
                </Link>
                {pendingReacties.length > 0 && (
                  <>
                    <div className="my-1.5 h-px bg-white/10" />
                    <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-amber-400/90">
                      {pendingReacties.length} openstaande reactie
                      {pendingReacties.length === 1 ? "" : "s"}
                    </p>
                    {pendingReacties.slice(0, 5).map((r) => (
                      <Link
                        key={r.id}
                        href={`/dashboard/werkposts/${r.werkpostId}`}
                        onClick={() => setNewChatMenuOpen(false)}
                        className="block px-3 py-2 transition-colors hover:bg-white/5"
                      >
                        <span className="block truncate text-sm font-medium text-zinc-100">
                          {r.companyNaam}
                        </span>
                        <span className="block truncate text-[11px] text-zinc-500">
                          {r.werkpostTitel}
                        </span>
                      </Link>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="px-3 pb-3">
          <div className="relative flex items-center rounded-xl border border-zinc-800/80 bg-zinc-950/60 px-3 py-2 text-zinc-300">
            <Search size={16} className="text-zinc-400 mr-2 shrink-0" />
            <input
              type="text"
              placeholder="Zoek"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-sm text-zinc-100 outline-none placeholder:text-zinc-500"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="text-zinc-500 hover:text-zinc-300">
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* List items */}
        <div className="flex-1 overflow-y-auto">
          {samenwerkingen.length === 0 ? (
            <div className="grid place-items-center px-6 py-10 text-center">
              <div className="max-w-[240px] space-y-4">
                <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl border border-sky-500/20 bg-sky-500/10 text-sky-400">
                  <Handshake size={22} />
                </span>
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-zinc-200">
                    Nog geen chats
                  </p>
                  <p className="text-xs leading-relaxed text-zinc-500">
                    Accepteer een reactie op een werkpost in Bouwnetwerk — je
                    gesprekken met partners verschijnen hier.
                  </p>
                </div>
                <SamenwerkingStartActions pendingCount={pendingReacties.length} />
              </div>
            </div>
          ) : filteredSamenwerkingen.length === 0 ? (
            <div className="px-4 py-8 text-center text-xs text-zinc-500">
              Geen partners gevonden
            </div>
          ) : (
            filteredSamenwerkingen.map((s) => {
              const active = selectedId === s.channelId;
              const initials = s.counterpartNaam
                .split(" ")
                .map((w) => w[0])
                .join("")
                .slice(0, 2)
                .toUpperCase();
              
              return (
                <button
                  key={s.channelId}
                  onClick={() => {
                    setSelectedId(s.channelId);
                    setLoadedChannelId(null);
                    setTab("chat");
                    setMobileChatOpen(true);
                  }}
                  className={`flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-zinc-800/40 ${
                    active ? "border-l-2 border-sky-500 bg-sky-500/5" : "border-l-2 border-transparent"
                  }`}
                >
                  {/* Circular Avatar */}
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr ${getAvatarGradient(s.counterpartNaam)} text-sm font-bold text-white shadow-sm`}>
                    {initials}
                  </div>

                  <div className="min-w-0 flex-1 border-b border-white/[0.04] pb-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-[15px] font-medium text-zinc-100">
                        {s.counterpartNaam}
                      </span>
                      {s.lastMessageAt && (
                        <span className="text-[11px] text-sky-400/80 shrink-0">
                          {formatTimeOnly(s.lastMessageAt)}
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 flex items-center gap-1">
                      {s.lastMessagePreview ? (
                        <span className="truncate text-[13px] text-zinc-500">
                          {s.lastMessagePreview}
                        </span>
                      ) : s.werkpostTitel ? (
                        <span className="flex items-center gap-1 truncate text-[13px] text-zinc-500">
                          <HardHat size={12} className="shrink-0" /> {s.werkpostTitel}
                        </span>
                      ) : (
                        <span className="truncate text-[13px] text-zinc-600">
                          Start het gesprek…
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* 3. Right Panel: Workspace */}
      <div
        className={`relative flex flex-1 flex-col bg-zinc-950 min-w-0 ${
          mobileChatOpen ? "flex" : "hidden md:flex"
        }`}
      >
        {selected ? (
          <>
            {/* Header */}
            <div className="flex h-[60px] items-center justify-between border-b border-zinc-800/80 bg-zinc-900/70 px-3 py-2 backdrop-blur sm:px-4 shrink-0">
              <div className="flex items-center gap-2 min-w-0 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setMobileChatOpen(false)}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-zinc-300 hover:bg-white/5 md:hidden"
                  aria-label="Terug naar chats"
                >
                  <ArrowLeft size={18} />
                </button>
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr ${getAvatarGradient(selected.counterpartNaam)} text-xs font-bold text-white`}>
                  {selected.counterpartNaam.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-sm font-semibold text-zinc-100">
                      {selected.counterpartNaam}
                    </p>
                    {selected.counterpartId && counterpartRatings[selected.counterpartId] && (
                      <span className="inline-flex items-center gap-0.5 rounded bg-zinc-950 border border-white/5 px-1.5 py-0.5 text-[9px] font-bold text-zinc-400">
                        <span className="text-amber-400">★</span>
                        <span className="text-zinc-300">{counterpartRatings[selected.counterpartId].avg.toFixed(1)}</span>
                      </span>
                    )}
                  </div>
                  <p className="truncate text-[10px] text-zinc-500">Bouwnetwerk-partner</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3.5 text-zinc-300 shrink-0">
                {tab === "chat" && (
                  <>
                    <button
                      onClick={() => handleSendMockCall("video-oproep")}
                      title="Videobellen (Mock)"
                      className="p-1.5 rounded-full hover:bg-white/5 text-zinc-300 hover:text-zinc-100 transition-colors"
                    >
                      <Video size={18} />
                    </button>
                    <button
                      onClick={() => handleSendMockCall("spraakoproep")}
                      title="Bellen (Mock)"
                      className="p-1.5 rounded-full hover:bg-white/5 text-zinc-300 hover:text-zinc-100 transition-colors"
                    >
                      <Phone size={16} />
                    </button>
                  </>
                )}
                
                {selected.counterpartId && (
                  <button
                    onClick={() => openReview(selected.counterpartId!)}
                    className="hidden lg:inline-flex items-center gap-1 rounded-full border border-white/10 bg-zinc-950/40 px-2.5 py-1 text-[11px] font-semibold text-zinc-300 hover:bg-white/5 transition-colors"
                  >
                    ★ {hasReviewed(selected.counterpartId!) ? "Beoordeling bewerken" : "Beoordeel partner"}
                  </button>
                )}

                {/* Mobile Tab Switcher */}
                <div className="flex items-center gap-1 rounded-full border border-white/5 bg-zinc-950/40 p-0.5 sm:hidden">
                  {(["chat", "documenten", "afspraken"] as Tab[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTab(t)}
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize transition-colors ${
                        tab === t ? "bg-sky-500 text-zinc-950" : "text-zinc-400"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                <div className="relative" ref={moreMenuRef}>
                  <button
                    type="button"
                    onClick={() => setMoreMenuOpen((open) => !open)}
                    className="p-1.5 rounded-full hover:bg-white/5 text-zinc-300 hover:text-zinc-100 transition-colors"
                    aria-label="Meer opties"
                  >
                    <MoreVertical size={18} />
                  </button>
                  {moreMenuOpen && (
                    <div className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-xl border border-zinc-700/80 bg-zinc-900 py-1.5 shadow-2xl">
                      {selected.werkpostId && (
                        <Link
                          href={`/dashboard/werkposts/${selected.werkpostId}`}
                          onClick={() => setMoreMenuOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-200 hover:bg-white/5"
                        >
                          <HardHat size={14} className="text-sky-400" />
                          Naar werkpost
                        </Link>
                      )}
                      {selected.counterpartId && (
                        <button
                          type="button"
                          onClick={() => {
                            setMoreMenuOpen(false);
                            openReview(selected.counterpartId!);
                          }}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-zinc-200 hover:bg-white/5"
                        >
                          <Star size={14} className="text-amber-400" />
                          {hasReviewed(selected.counterpartId!) ? "Beoordeling bewerken" : "Beoordeel partner"}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setMoreMenuOpen(false);
                          setTab("documenten");
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-zinc-200 hover:bg-white/5"
                      >
                        <FileText size={14} className="text-cyan-400" />
                        Documenten
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setMoreMenuOpen(false);
                          setTab("afspraken");
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-zinc-200 hover:bg-white/5"
                      >
                        <CalendarDays size={14} className="text-sky-400" />
                        Afspraken
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Matched Werkpost Pin Banner */}
            {selected.werkpostTitel && tab === "chat" && (
              <div className="flex items-center gap-2 border-b border-zinc-800/60 bg-zinc-900/40 px-4 py-2.5 text-xs text-zinc-300 shrink-0">
                <Pin size={12} className="text-sky-400 shrink-0" />
                {selected.werkpostId ? (
                  <Link
                    href={`/dashboard/werkposts/${selected.werkpostId}`}
                    className="truncate transition-colors hover:text-sky-300"
                  >
                    <span className="text-zinc-500">Gekoppeld · </span>
                    {selected.werkpostTitel}
                  </Link>
                ) : (
                  <span className="truncate">
                    <span className="text-zinc-500">Vastgezet · </span>
                    {selected.werkpostTitel}
                  </span>
                )}
              </div>
            )}

            {/* Tab Views */}
            <div className="flex-1 min-h-0 relative flex flex-col">
              {tab === "chat" && (
                <ChatPanel
                  loading={loading}
                  messages={messages}
                  companyId={companyId}
                  text={text}
                  setText={setText}
                  replyTo={replyTo}
                  setReplyTo={setReplyTo}
                  sending={sending}
                  uploading={uploading}
                  uploadError={uploadError}
                  sendError={sendError}
                  fileRef={fileRef}
                  bottomRef={bottomRef}
                  onSend={handleSend}
                  onFiles={handleFiles}
                  onSendMockAudio={handleSendMockAudio}
                  onSendMockCall={handleSendMockCall}
                  counterpartNaam={selected.counterpartNaam}
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

              {tab === "afspraken" && (
                <AfsprakenPanel
                  channelId={selectedId!}
                  counterpartId={selected.counterpartId}
                  counterpartNaam={selected.counterpartNaam}
                  afspraken={channelAfspraken}
                />
              )}
            </div>
          </>
        ) : (
          <EmptyWorkspace
            tab={tab}
            hasChats={samenwerkingen.length > 0}
            pendingCount={pendingReacties.length}
          />
        )}
      </div>

      {/* Review Modal */}
      {reviewModalOpen && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-900 p-6 shadow-2xl relative">
            <button
              onClick={() => setReviewModalOpen(false)}
              className="absolute right-4 top-4 text-zinc-500 hover:text-zinc-300"
            >
              <X size={18} />
            </button>
            
            <h3 className="text-lg font-bold text-zinc-50">
              Beoordeel {selected.counterpartNaam}
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Hoe verliep de samenwerking, de communicatie en de betrouwbaarheid?
            </p>
            
            <form onSubmit={handleReviewSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                  Aantal sterren
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="text-2xl transition-transform hover:scale-110 focus:outline-none"
                    >
                      <span className={star <= reviewRating ? "text-amber-400" : "text-zinc-700"}>
                        ★
                      </span>
                    </button>
                  ))}
                  <span className="text-sm font-semibold text-zinc-300 ml-2">
                    {reviewRating} van 5
                  </span>
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Toelichting / Ervaring
                </label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  rows={4}
                  placeholder="Schrijf hier je ervaring met dit bedrijf..."
                  className="w-full rounded-xl border border-white/10 bg-zinc-950/50 px-3.5 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/10 resize-none"
                  required
                />
              </div>

              {reviewError && (
                <p className="text-xs text-rose-400 bg-rose-500/5 border border-rose-500/10 rounded-xl px-3 py-2">
                  {reviewError}
                </p>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewModalOpen(false)}
                  className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                >
                  Annuleren
                </button>
                <button
                  type="submit"
                  disabled={isPendingReview}
                  className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-5 py-2 text-xs font-bold text-zinc-950 hover:bg-sky-400 disabled:opacity-60"
                >
                  {isPendingReview ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : null}
                  Beoordeling opslaan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function SamenwerkingStartActions({ pendingCount }: { pendingCount: number }) {
  return (
    <div className="flex flex-col gap-2">
      <Link
        href="/dashboard/werkposts"
        className="inline-flex items-center justify-center gap-1.5 rounded-full bg-sky-500 px-4 py-2 text-xs font-bold text-zinc-950 transition-colors hover:bg-sky-400 hover:shadow-[0_0_16px_rgba(14,165,233,0.25)]"
      >
        <HardHat size={13} />
        Naar Bouwnetwerk
      </Link>
      {pendingCount > 0 ? (
        <Link
          href="/dashboard/werkposts"
          className="inline-flex items-center justify-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs font-semibold text-amber-300 transition-colors hover:bg-amber-500/15"
        >
          {pendingCount} reactie{pendingCount === 1 ? "" : "s"} beheren
        </Link>
      ) : (
        <Link
          href="/bouwnetwerk"
          className="inline-flex items-center justify-center gap-1.5 rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-zinc-300 transition-colors hover:bg-white/5"
        >
          Publieke feed bekijken
        </Link>
      )}
    </div>
  );
}

function EmptyWorkspace({
  tab,
  hasChats,
  pendingCount,
}: {
  tab: Tab;
  hasChats: boolean;
  pendingCount: number;
}) {
  const tabCopy: Record<Tab, { title: string; body: string; icon: typeof MessageCircle }> = {
    chat: {
      title: "Samenwerkingen",
      body: hasChats
        ? "Kies een chat links om te beginnen met praten."
        : "Chat, deel documenten en plan afspraken met partners uit het Bouwnetwerk. Accepteer een reactie op een werkpost om te starten.",
      icon: MessageCircle,
    },
    documenten: {
      title: "Documenten",
      body: hasChats
        ? "Selecteer een gesprek om gedeelde bestanden te bekijken."
        : "Zodra je een samenwerking start, kun je hier documenten en foto's delen.",
      icon: FileText,
    },
    afspraken: {
      title: "Afspraken",
      body: hasChats
        ? "Selecteer een gesprek om afspraken te plannen met je partner."
        : "Plan afspraken zodra je een reactie hebt geaccepteerd en een chat is gestart.",
      icon: CalendarDays,
    },
  };

  const copy = tabCopy[tab];
  const Icon = copy.icon;

  return (
    <div className="grid flex-1 place-items-center border-b-4 border-sky-500/30 p-6 text-center text-zinc-500">
      <div className="max-w-sm space-y-4">
        <span className="mx-auto grid h-20 w-20 place-items-center rounded-2xl border border-zinc-800 bg-zinc-900/80 text-sky-400/90">
          <Icon size={tab === "chat" ? 40 : 34} strokeWidth={1.5} />
        </span>
        <div className="space-y-1.5">
          <h3 className="text-xl font-light text-zinc-200">{copy.title}</h3>
          <p className="text-sm leading-relaxed text-zinc-500">{copy.body}</p>
        </div>
        {!hasChats && <SamenwerkingStartActions pendingCount={pendingCount} />}
        <p className="flex items-center justify-center gap-1.5 text-xs text-zinc-600">
          <MessageCircle size={13} />
          Berichten worden veilig opgeslagen in je werkruimte
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------
// CHAT PANEL
// ---------------------------------------------------------

function ChatPanel({
  loading,
  messages,
  companyId,
  text,
  setText,
  replyTo,
  setReplyTo,
  sending,
  uploading,
  uploadError,
  sendError,
  fileRef,
  bottomRef,
  onSend,
  onFiles,
  onSendMockAudio,
  onSendMockCall,
  counterpartNaam,
}: {
  loading: boolean;
  messages: MessageRow[];
  companyId: number;
  text: string;
  setText: (v: string) => void;
  replyTo: MessageRow | null;
  setReplyTo: (m: MessageRow | null) => void;
  sending: boolean;
  uploading: boolean;
  uploadError: string | null;
  sendError: string | null;
  fileRef: React.RefObject<HTMLInputElement | null>;
  bottomRef: React.RefObject<HTMLDivElement | null>;
  onSend: (e: React.FormEvent) => void;
  onFiles: (list: FileList | null) => void;
  onSendMockAudio: () => void;
  onSendMockCall: (type: "spraakoproep" | "video-oproep") => void;
  counterpartNaam: string;
}) {
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const quickEmojis = ["👍", "✅", "🙏", "📎", "🏗️", "📅", "💬", "🔧"];

  useEffect(() => {
    if (!showEmojiPicker) return;
    function onPointerDown(e: MouseEvent) {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(e.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [showEmojiPicker]);

  const mineBubble =
    "rounded-2xl rounded-br-md border border-sky-500/25 bg-gradient-to-br from-sky-500/20 via-sky-500/10 to-indigo-500/10 text-zinc-100 shadow-[0_8px_24px_-12px_rgba(14,165,233,0.35)]";
  const theirBubble =
    "rounded-2xl rounded-bl-md border border-zinc-700/70 bg-zinc-800/80 text-zinc-100";

  return (
    <>
      {/* Messages Feed */}
      <div className="relative flex-1 space-y-3 overflow-y-auto bg-zinc-950 px-5 py-5 scrollbar-thin scrollbar-thumb-zinc-800">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(14,165,233,0.06),transparent_55%)]" />
        <div className="relative">
        {loading ? (
          <div
            role="status"
            aria-live="polite"
            className="grid h-full place-items-center text-zinc-500"
          >
            <Loader2 size={24} className="animate-spin text-sky-400" aria-hidden />
            <span className="sr-only">Berichten laden</span>
          </div>
        ) : messages.length === 0 ? (
          <p className="text-center text-sm text-zinc-500 mt-8">
            Nog geen berichten. Stuur het eerste bericht hieronder.
          </p>
        ) : (
          messages.map((m) => {
            const isMine = m.sender_company_id === companyId;
            const attachments = parseAttachments(m.attachments);
            const rich = parseRichMessage(m.content);

            if (rich?.callType) {
              const isVideo = rich.callType === "video-oproep";
              return (
                <div key={m.id} className={`mb-3 flex ${isMine ? "justify-end" : "justify-start"}`}>
                  <div className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm ${isMine ? mineBubble : theirBubble}`}>
                    <span className="grid h-8 w-8 place-items-center rounded-xl bg-sky-500/15 text-sky-400">
                      {isVideo ? <Video size={15} /> : <Phone size={15} />}
                    </span>
                    <div>
                      <p className="font-semibold text-xs capitalize">{rich.callType}</p>
                      <p className="text-[10px] text-zinc-400">{rich.duration} · {formatTimeOnly(m.created_at)}</p>
                    </div>
                  </div>
                </div>
              );
            }

            if (rich?.audioUrl) {
              return (
                <div key={m.id} className={`mb-3 flex ${isMine ? "justify-end" : "justify-start"}`}>
                  <div className={`flex min-w-[285px] items-center gap-3 rounded-2xl p-3.5 ${isMine ? mineBubble : theirBubble}`}>
                    <button className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-zinc-950/40 text-sky-400 hover:bg-zinc-950/60">
                      <svg className="ml-0.5 h-4 w-4 fill-current" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </button>
                    <div className="flex flex-1 flex-col">
                      <div className="flex h-8 select-none items-end gap-0.5">
                        {[4, 10, 16, 8, 12, 22, 14, 8, 18, 12, 16, 6, 10, 14, 20, 12, 8, 16, 12, 6, 8, 14, 10, 4].map((h, idx) => (
                          <span
                            key={idx}
                            className="w-[3px] rounded-full bg-sky-400/50"
                            style={{ height: `${h}px` }}
                          />
                        ))}
                      </div>
                      <div className="mt-1.5 flex items-center justify-between text-[9px] text-zinc-400">
                        <span>{rich.audioDuration || "0:07"}</span>
                        <span className="flex items-center">
                          {formatTimeOnly(m.created_at)}
                          {isMine && <DoubleCheck read={true} />}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={m.id}
                className={`group mb-3 flex ${isMine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`relative max-w-[72%] px-3.5 py-2.5 text-sm ${
                    isMine ? mineBubble : theirBubble
                  }`}
                >
                  {rich?.replyTo && (
                    <div className="mb-2 rounded-xl border-l-2 border-sky-400 bg-zinc-950/30 p-2 text-xs">
                      <p className="font-semibold text-sky-400">{rich.replyTo.sender}</p>
                      <p className="truncate text-zinc-300 opacity-90">{rich.replyTo.content}</p>
                    </div>
                  )}

                  {attachments.length > 0 && (
                    <div className="mb-1.5 space-y-2">
                      {attachments.map((att, i) =>
                        att.isImage ? (
                          <a
                            key={`${att.url}-${i}`}
                            href={att.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block overflow-hidden rounded-xl border border-white/5 bg-black/10"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={att.url}
                              alt={att.name}
                              loading="lazy"
                              className="max-h-48 w-full object-cover transition-transform duration-200 hover:scale-[1.02]"
                            />
                          </a>
                        ) : (
                          <a
                            key={`${att.url}-${i}`}
                            href={att.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 rounded-xl border border-white/5 bg-black/10 px-2.5 py-2 text-xs font-medium text-zinc-100"
                          >
                            <FileText size={15} className="text-sky-400" />
                            <span className="flex-1 truncate">{att.name}</span>
                            <Download size={14} className="opacity-60 hover:opacity-100" />
                          </a>
                        ),
                      )}
                    </div>
                  )}

                  <div>
                    {rich?.text && <p className="whitespace-pre-wrap pr-8 leading-relaxed">{rich.text}</p>}
                    <span className="absolute bottom-1.5 right-2.5 flex select-none items-center text-[10px] text-zinc-400">
                      {formatTimeOnly(m.created_at)}
                      {isMine && <DoubleCheck read={true} />}
                    </span>
                  </div>

                  <button
                    onClick={() => setReplyTo(m)}
                    title="Antwoorden"
                    className="absolute right-[-30px] top-1/2 z-10 hidden h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-zinc-400 shadow-md hover:text-zinc-100 group-hover:flex"
                  >
                    <CornerUpLeft size={12} />
                  </button>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
        </div>
      </div>

      {/* Reply Preview Banner */}
      {replyTo && (
        <div className="flex shrink-0 items-center justify-between border-l-2 border-sky-400 bg-zinc-900/80 px-5 py-2 text-xs text-zinc-300">
          <div className="truncate pr-4">
            <span className="block font-semibold text-sky-400">Antwoorden op {replyTo.sender_company_id === companyId ? "Jezelf" : counterpartNaam}</span>
            <span className="truncate block opacity-80">{parseRichMessage(replyTo.content)?.text || replyTo.content || "Bijlage"}</span>
          </div>
          <button onClick={() => setReplyTo(null)} className="text-zinc-400 hover:text-zinc-200 shrink-0">
            <X size={15} />
          </button>
        </div>
      )}

      {/* Errors */}
      {(uploadError || sendError) && (
        <p className="bg-rose-500/10 border-t border-rose-500/20 px-5 py-2 text-xs text-rose-400">
          {uploadError ?? sendError}
        </p>
      )}

      {/* Chat Footer Input */}
      <div className="relative flex shrink-0 items-center gap-3 border-t border-zinc-800/80 bg-zinc-900/70 px-4 py-3 backdrop-blur">
        
        {/* Attachment menu */}
        <div className="relative">
          {showAttachMenu && (
            <div className="absolute bottom-[52px] left-0 z-50 flex min-w-[170px] animate-in fade-in slide-in-from-bottom-2 flex-col gap-2 rounded-2xl border border-zinc-700/80 bg-zinc-900 p-2.5 shadow-2xl duration-150">
              <button
                type="button"
                onClick={() => {
                  setShowAttachMenu(false);
                  fileRef.current?.click();
                }}
                className="flex items-center gap-2.5 w-full rounded-lg px-3 py-2 text-left text-xs font-semibold text-zinc-200 hover:bg-white/5 transition-colors"
              >
                <span className="grid h-7 w-7 place-items-center rounded-full bg-violet-600/30 text-violet-400">
                  <FileText size={14} />
                </span>
                Document
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAttachMenu(false);
                  fileRef.current?.click();
                }}
                className="flex items-center gap-2.5 w-full rounded-lg px-3 py-2 text-left text-xs font-semibold text-zinc-200 hover:bg-white/5 transition-colors"
              >
                <span className="grid h-7 w-7 place-items-center rounded-full bg-teal-600/30 text-teal-400">
                  <ImageIcon size={14} />
                </span>
                Foto of Video
              </button>
              
              <div className="h-[1px] bg-white/10 my-1" />

              <button
                type="button"
                onClick={() => {
                  setShowAttachMenu(false);
                  onSendMockAudio();
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-semibold text-sky-300 hover:bg-white/5 transition-colors"
              >
                <span className="grid h-7 w-7 place-items-center rounded-full bg-sky-600/20 text-sky-400">
                  <Mic size={14} />
                </span>
                Stuur Spraakbericht
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAttachMenu(false);
                  onSendMockCall("spraakoproep");
                }}
                className="flex items-center gap-2.5 w-full rounded-lg px-3 py-2 text-left text-xs font-semibold text-zinc-200 hover:bg-white/5 transition-colors"
              >
                <span className="grid h-7 w-7 place-items-center rounded-full bg-blue-600/30 text-blue-400">
                  <Phone size={14} />
                </span>
                Spraakoproep log
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowAttachMenu(!showAttachMenu)}
            disabled={uploading}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-zinc-300 hover:bg-white/5 hover:text-white transition-all disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 size={18} className="animate-spin text-sky-400" />
            ) : (
              <Plus size={20} className={`transition-transform duration-200 ${showAttachMenu ? "rotate-[45deg] text-sky-400" : ""}`} />
            )}
          </button>
        </div>

        {/* Real hidden file inputs */}
        <input
          ref={fileRef}
          type="file"
          multiple
          accept="image/*,application/pdf"
          className="hidden"
          onChange={(e) => {
            onFiles(e.target.files);
            setShowAttachMenu(false);
          }}
        />

        {/* Emoji Button */}
        <div className="relative" ref={emojiPickerRef}>
          <button
            type="button"
            onClick={() => setShowEmojiPicker((open) => !open)}
            className={`grid h-10 w-10 shrink-0 place-items-center rounded-full transition-colors ${
              showEmojiPicker
                ? "bg-sky-500/15 text-sky-400"
                : "text-zinc-300 hover:bg-white/5 hover:text-white"
            }`}
            aria-label="Emoji toevoegen"
          >
            <Smile size={20} />
          </button>
          {showEmojiPicker && (
            <div className="absolute bottom-[52px] left-0 z-50 grid grid-cols-4 gap-1 rounded-xl border border-zinc-700/80 bg-zinc-900 p-2 shadow-2xl">
              {quickEmojis.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    setText(text + emoji);
                    setShowEmojiPicker(false);
                  }}
                  className="grid h-9 w-9 place-items-center rounded-lg text-lg transition-colors hover:bg-white/10"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Message Input Form */}
        <form onSubmit={onSend} className="flex-1 flex items-center gap-3">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Typ een bericht"
            className="flex-1 rounded-full border border-zinc-700/80 bg-zinc-950/70 px-4 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-sky-500/40 focus:ring-1 focus:ring-sky-500/20"
          />

          {/* Send or Mic button */}
          {text.trim() ? (
            <button
              type="submit"
              disabled={sending}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-sky-500 text-zinc-950 shadow-[0_0_16px_rgba(14,165,233,0.25)] transition-colors hover:bg-sky-400"
            >
              {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          ) : (
            <button
              type="button"
              onClick={onSendMockAudio}
              title="Stuur spraakbericht (Mock)"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-sky-500 text-zinc-950 shadow-[0_0_16px_rgba(14,165,233,0.25)] transition-colors hover:bg-sky-400"
            >
              <Mic size={18} />
            </button>
          )}
        </form>
      </div>
    </>
  );
}

// ---------------------------------------------------------
// DOCUMENTS PANEL
// ---------------------------------------------------------

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
    <div className="flex h-full flex-1 flex-col bg-zinc-950">
      <div className="flex items-center justify-between gap-3 border-b border-zinc-800/80 bg-zinc-900/70 px-6 py-4">
        <div>
          <h3 className="text-sm font-bold text-zinc-100">Documenten & Media</h3>
          <p className="text-[10px] text-zinc-400 mt-0.5">
            Alle gedeelde bestanden in dit gesprek.
          </p>
        </div>
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
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-sky-500 px-4 py-2 text-xs font-bold text-zinc-950 transition-colors hover:bg-sky-400 disabled:opacity-50"
        >
          {uploading ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <Paperclip size={13} />
          )}
          Bestand uploaden
        </button>
      </div>

      {uploadError && (
        <p className="bg-rose-500/10 border-b border-rose-500/20 px-6 py-2.5 text-xs text-rose-400">
          {uploadError}
        </p>
      )}

      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="grid h-full place-items-center text-zinc-500">
            <Loader2 size={24} className="animate-spin text-sky-400" />
          </div>
        ) : documents.length === 0 ? (
          <div className="grid h-full place-items-center text-center text-sm text-zinc-500">
            <div className="space-y-3">
              <FileText size={32} className="mx-auto text-zinc-700" />
              <p>Nog geen documenten gedeeld in dit gesprek.</p>
              <button
                type="button"
                onClick={() => docRef.current?.click()}
                disabled={uploading}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-zinc-300 transition-colors hover:bg-white/5 disabled:opacity-50"
              >
                <Paperclip size={13} />
                Eerste bestand uploaden
              </button>
            </div>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {documents.map(({ att, at, mine }, i) => (
              <a
                key={`${att.url}-${i}`}
                href={att.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 rounded-xl border border-zinc-800/80 bg-zinc-900/50 px-4 py-3 transition-all hover:border-sky-500/20 hover:bg-zinc-800/50"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-sky-500/10 text-sky-400 transition-transform group-hover:scale-105">
                  {att.isImage ? <ImageIcon size={16} /> : <FileText size={16} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-zinc-100 transition-colors group-hover:text-sky-300">
                    {att.name}
                  </span>
                  <span className="block text-[10px] text-zinc-400 mt-0.5">
                    {mine ? "Jij" : "Partner"}
                    {att.size ? ` · ${formatBytes(att.size)}` : ""}
                    {at ? ` · ${formatDateTime(at)}` : ""}
                  </span>
                </span>
                <Download size={15} className="shrink-0 text-zinc-400 transition-colors group-hover:text-sky-400" />
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------
// AFSPRAKEN PANEL
// ---------------------------------------------------------

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
  const router = useRouter();
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
    router.refresh();
  }

  async function setStatus(id: number, status: "bevestigd" | "geannuleerd") {
    await updateAfspraakStatus(id, status);
    router.refresh();
  }

  return (
    <div className="grid h-full flex-1 grid-cols-1 gap-0 overflow-hidden bg-zinc-950 xl:grid-cols-[1fr_320px]">
      {/* List */}
      <div className="order-2 flex-1 overflow-y-auto p-6 xl:order-1 scrollbar-thin">
        <h3 className="text-sm font-bold text-zinc-100 mb-4 flex items-center gap-2">
          <CalendarDays size={16} className="text-sky-400" /> Agenda
        </h3>
        
        {afspraken.length === 0 ? (
          <div className="grid h-[200px] place-items-center text-center text-sm text-zinc-500">
            <div className="space-y-2">
              <CalendarDays size={32} className="mx-auto text-zinc-700" />
              <p>Nog geen afspraken met {counterpartNaam}.</p>
            </div>
          </div>
        ) : (
          <ul className="space-y-3.5">
            {afspraken.map((a) => {
              const meta = statusMeta[a.status ?? "gepland"] ?? statusMeta.gepland;
              return (
                <li
                  key={a.id}
                  className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4 transition-colors hover:border-sky-500/15"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-zinc-100">
                        {a.titel}
                      </p>
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-zinc-400">
                        <CalendarDays size={12} className="text-zinc-500" />
                        {formatDateTime(a.startTijd)}
                        {a.eindTijd
                          ? ` – ${new Date(a.eindTijd).toLocaleTimeString(
                              "nl-NL",
                              { hour: "2-digit", minute: "2-digit" },
                            )}`
                          : ""}
                      </p>
                      {a.locatie && (
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-zinc-500">
                          <MapPin size={12} /> {a.locatie}
                        </p>
                      )}
                      {a.beschrijving && (
                        <p className="mt-2.5 whitespace-pre-wrap text-xs text-zinc-400 leading-relaxed">
                          {a.beschrijving}
                        </p>
                      )}
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${meta.className}`}
                    >
                      {meta.label}
                    </span>
                  </div>
                  <div className="mt-3.5 flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => downloadIcs(a, counterpartNaam)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-zinc-950/20 px-3 py-1.5 text-[11px] font-semibold text-zinc-300 transition-colors hover:bg-white/5"
                    >
                      <Download size={11} /> Agenda (.ics)
                    </button>
                    {a.status !== "bevestigd" && a.status !== "geannuleerd" && (
                      <button
                        onClick={() => setStatus(a.id, "bevestigd")}
                        className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/5 px-3 py-1.5 text-[11px] font-bold text-cyan-400 transition-all hover:bg-cyan-500/15"
                      >
                        <Check size={11} /> Bevestigen
                      </button>
                    )}
                    {a.status !== "geannuleerd" && (
                      <button
                        onClick={() => setStatus(a.id, "geannuleerd")}
                        className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/20 bg-rose-500/5 px-3 py-1.5 text-[11px] font-bold text-rose-400 transition-all hover:bg-rose-500/15"
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

      {/* Book New */}
      <form
        onSubmit={submit}
        className="order-1 space-y-3.5 border-b border-zinc-800/80 bg-zinc-900/50 p-6 scrollbar-thin overflow-y-auto xl:order-2 xl:border-b-0 xl:border-l xl:border-zinc-800/80"
      >
        <p className="flex items-center gap-2 border-b border-zinc-800/80 pb-2 text-sm font-bold text-zinc-50">
          <CalendarPlus size={16} className="text-sky-400" /> Nieuwe afspraak
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
            rows={3}
            placeholder="Optionele details…"
            className={inputClass}
          />
        </div>

        {error && <p className="text-xs text-rose-400 bg-rose-500/5 px-3 py-2 rounded-xl border border-rose-500/10">{error}</p>}
        {ok && (
          <p className="rounded-xl border border-cyan-500/10 bg-cyan-500/5 px-3 py-2 text-xs text-cyan-400">
            Afspraak toegevoegd en gedeeld in de chat.
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-sky-500 px-4 py-2.5 text-xs font-bold text-zinc-950 transition-colors hover:bg-sky-400 disabled:opacity-50"
        >
          {saving ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <CalendarPlus size={13} />
          )}
          In agenda plaatsen
        </button>
      </form>
    </div>
  );
}
