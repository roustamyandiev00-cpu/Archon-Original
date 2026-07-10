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
  FileSignature,
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
  ArrowLeft,
  ChevronDown,
  Filter,
  PanelRightClose,
  PanelRightOpen,
  Building2,
  Clock,
  Tag,
  UserRound,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { sendMessage, sendAttachments } from "@/app/dashboard/comms/actions";
import {
  createAfspraak,
  updateAfspraakStatus,
  submitCompanyReview,
  type AfspraakInput,
} from "@/app/dashboard/werkposts/samenwerkingen/actions";
import {
  contractNeedsMySignature,
  countContractsAwaitingSignature,
  type SamenwerkingContractRow,
} from "@/lib/werkposts/contracts";
import SamenwerkingContractPanel from "@/components/dashboard/werkposts/SamenwerkingContractPanel";

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

type InboxFilter = "alle" | "actief" | "gesloten";
type ProfileTab = "details" | "bestanden" | "activiteit" | "contract";
type ComposerMode = "reply" | "note";
type ConversationGroup = "Vastgezet" | "Vandaag" | "Gisteren" | "Ouder";

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
    } catch {
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

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatRelativeTime(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Zojuist";
  if (diffMin < 60) return `${diffMin}m`;
  if (isSameDay(date, now)) {
    return date.toLocaleTimeString("nl-NL", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameDay(date, yesterday)) return "Gisteren";
  return date.toLocaleDateString("nl-NL", { day: "numeric", month: "short" });
}

function formatThreadDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function isActiveConversation(s: Samenwerking) {
  if (!s.lastMessageAt) return true;
  const days =
    (Date.now() - new Date(s.lastMessageAt).getTime()) / (1000 * 60 * 60 * 24);
  return days <= 14;
}

function isClosedConversation(s: Samenwerking) {
  if (!s.lastMessageAt) return false;
  const days =
    (Date.now() - new Date(s.lastMessageAt).getTime()) / (1000 * 60 * 60 * 24);
  return days > 30;
}

function getConversationGroup(s: Samenwerking): ConversationGroup {
  if (s.werkpostTitel) return "Vastgezet";
  if (!s.lastMessageAt) return "Ouder";
  const date = new Date(s.lastMessageAt);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameDay(date, now)) return "Vandaag";
  if (isSameDay(date, yesterday)) return "Gisteren";
  return "Ouder";
}

function groupConversations(list: Samenwerking[]) {
  const order: ConversationGroup[] = [
    "Vastgezet",
    "Vandaag",
    "Gisteren",
    "Ouder",
  ];
  const buckets = new Map<ConversationGroup, Samenwerking[]>();
  for (const group of order) buckets.set(group, []);
  for (const item of list) {
    buckets.get(getConversationGroup(item))!.push(item);
  }
  return order
    .map((group) => ({ group, items: buckets.get(group)! }))
    .filter((entry) => entry.items.length > 0);
}

export default function SamenwerkingenClient({
  samenwerkingen,
  afspraken,
  companyId,
  myReviews = [],
  counterpartRatings = {},
  pendingReacties = [],
  initialChannelId,
  contractsByChannel: initialContractsByChannel = {},
  companyNames = {},
}: {
  samenwerkingen: Samenwerking[];
  afspraken: AfspraakRow[];
  companyId: number;
  myReviews?: { target_company_id: number; rating: number; commentaar: string }[];
  counterpartRatings?: Record<number, { avg: number; count: number }>;
  pendingReacties?: PendingReactie[];
  initialChannelId?: string | null;
  contractsByChannel?: Record<string, SamenwerkingContractRow>;
  companyNames?: Record<number, string>;
}) {
  const router = useRouter();
  const resolvedInitial =
    initialChannelId &&
    samenwerkingen.some((s) => s.channelId === initialChannelId)
      ? initialChannelId
      : (samenwerkingen[0]?.channelId ?? null);
  const [selectedId, setSelectedId] = useState<string | null>(resolvedInitial);
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const [contractsByChannel, setContractsByChannel] = useState(
    initialContractsByChannel,
  );
  const [contractModalOpen, setContractModalOpen] = useState(false);

  useEffect(() => {
    if (
      initialChannelId &&
      samenwerkingen.some((s) => s.channelId === initialChannelId)
    ) {
      setSelectedId(initialChannelId);
      setMobileChatOpen(true);
    }
  }, [initialChannelId, samenwerkingen]);
  const [inboxFilter, setInboxFilter] = useState<InboxFilter>("alle");
  const [profileTab, setProfileTab] = useState<ProfileTab>("details");
  const [composerMode, setComposerMode] = useState<ComposerMode>("reply");
  const [showContactPanel, setShowContactPanel] = useState(false);
  const [afsprakenModalOpen, setAfsprakenModalOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
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
  const selectedContract = selectedId
    ? contractsByChannel[selectedId] ?? null
    : null;

  function updateChannelContract(
    channelId: string,
    contract: SamenwerkingContractRow | null,
  ) {
    setContractsByChannel((prev) => {
      const next = { ...prev };
      if (contract) next[channelId] = contract;
      else delete next[channelId];
      return next;
    });
  }

  const contractPartyAName = selectedContract
    ? (companyNames[selectedContract.partyACompanyId] ??
      `Bedrijf #${selectedContract.partyACompanyId}`)
    : (companyNames[companyId] ?? `Bedrijf #${companyId}`);
  const contractPartyBName = selectedContract
    ? (companyNames[selectedContract.partyBCompanyId] ??
      `Bedrijf #${selectedContract.partyBCompanyId}`)
    : (selected?.counterpartNaam ?? "Partner");

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
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

  const filteredSamenwerkingen = useMemo(() => {
    let list = samenwerkingen;
    if (inboxFilter === "actief") {
      list = list.filter(isActiveConversation);
    } else if (inboxFilter === "gesloten") {
      list = list.filter(isClosedConversation);
    }
    const q = searchQuery.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (s) =>
        s.counterpartNaam.toLowerCase().includes(q) ||
        (s.werkpostTitel && s.werkpostTitel.toLowerCase().includes(q)),
    );
  }, [samenwerkingen, searchQuery, inboxFilter]);

  const conversationGroups = useMemo(
    () => groupConversations(filteredSamenwerkingen),
    [filteredSamenwerkingen],
  );

  const inboxCounts = useMemo(
    () => ({
      alle: samenwerkingen.length,
      actief: samenwerkingen.filter(isActiveConversation).length,
      gesloten: samenwerkingen.filter(isClosedConversation).length,
    }),
    [samenwerkingen],
  );

  const pendingSignatureCount = useMemo(
    () => countContractsAwaitingSignature(contractsByChannel, companyId),
    [contractsByChannel, companyId],
  );

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
    <div className="samenwerkingen-chat relative grid h-[min(820px,calc(100dvh-8.5rem))] min-h-[520px] overflow-hidden rounded-xl border border-zinc-800/80 bg-zinc-950 shadow-2xl shadow-black/40 lg:grid-cols-[auto_minmax(0,320px)_minmax(0,1fr)] xl:grid-cols-[auto_minmax(0,320px)_minmax(0,1fr)_280px]">
      {/* 1. Inbox-sidebar (shadcn-stijl) */}
      <aside
        className={`relative hidden shrink-0 flex-col border-r border-zinc-800/80 bg-zinc-900/60 lg:flex ${
          sidebarCollapsed ? "w-[68px]" : "w-[200px]"
        }`}
      >
        <div className="flex items-center gap-2 border-b border-zinc-800/80 px-3 py-3.5">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-to-tr from-sky-500 to-indigo-500 text-zinc-950">
            <Handshake size={16} />
          </div>
          {!sidebarCollapsed && (
            <span className="truncate text-sm font-semibold text-zinc-100">
              Bouwnetwerk
            </span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-3">
          <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            {sidebarCollapsed ? "·" : "Inbox"}
          </p>
          <nav className="space-y-0.5">
            {[
              {
                id: "chats" as const,
                label: "Samenwerkingen",
                icon: MessageCircle,
                badge: samenwerkingen.length,
              },
              {
                id: "reacties" as const,
                label: "Openstaande reacties",
                icon: HardHat,
                badge: pendingReacties.length,
                href: "/dashboard/werkposts",
              },
            ].map((item) => {
              const Icon = item.icon;
              const content = (
                <>
                  <Icon size={16} className="shrink-0" />
                  {!sidebarCollapsed && (
                    <>
                      <span className="flex-1 truncate text-left">{item.label}</span>
                      {item.badge ? (
                        <span className="rounded-full bg-sky-500/15 px-1.5 py-0.5 text-[10px] font-bold text-sky-300">
                          {item.badge}
                        </span>
                      ) : null}
                    </>
                  )}
                </>
              );
              const className = `flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors ${
                item.id === "chats"
                  ? "bg-sky-500/10 text-sky-300"
                  : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
              }`;
              return item.href ? (
                <Link key={item.id} href={item.href} className={className}>
                  {content}
                </Link>
              ) : (
                <button key={item.id} type="button" className={className}>
                  {content}
                </button>
              );
            })}
          </nav>

          {!sidebarCollapsed && (
            <>
              <p className="mb-1.5 mt-5 px-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                Kanalen
              </p>
              <nav className="space-y-0.5">
                {[
                  { label: "Directe chats", count: samenwerkingen.length },
                  {
                    label: "Projectgekoppeld",
                    count: samenwerkingen.filter((s) => s.werkpostId).length,
                  },
                  { label: "Met afspraken", count: afspraken.length },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-sm text-zinc-400 transition-colors hover:bg-white/5 hover:text-zinc-200"
                  >
                    <span className="truncate">{item.label}</span>
                    <span className="text-[10px] font-semibold text-zinc-500">
                      {item.count}
                    </span>
                  </button>
                ))}
              </nav>

              <p className="mb-1.5 mt-5 px-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                Weergaven
              </p>
              <nav className="space-y-0.5">
                <button
                  type="button"
                  onClick={() => setInboxFilter("actief")}
                  className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-sm text-zinc-400 transition-colors hover:bg-white/5 hover:text-zinc-200"
                >
                  <span>Actieve partners</span>
                  <span className="text-[10px] font-semibold text-zinc-500">
                    {inboxCounts.actief}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setInboxFilter("gesloten")}
                  className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-sm text-zinc-400 transition-colors hover:bg-white/5 hover:text-zinc-200"
                >
                  <span>Inactief</span>
                  <span className="text-[10px] font-semibold text-zinc-500">
                    {inboxCounts.gesloten}
                  </span>
                </button>
              </nav>
            </>
          )}
        </div>

        <div className="border-t border-zinc-800/80 p-2" ref={settingsMenuRef}>
          <div className="relative">
            <button
              type="button"
              onClick={() => setSettingsMenuOpen((open) => !open)}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-zinc-400 transition-colors hover:bg-white/5 hover:text-zinc-200"
            >
              <Settings size={16} />
              {!sidebarCollapsed && <span>Instellingen</span>}
            </button>
            {settingsMenuOpen && (
              <div className="absolute bottom-full left-0 z-50 mb-2 w-56 overflow-hidden rounded-xl border border-zinc-700/80 bg-zinc-900 py-1.5 shadow-2xl">
                <Link
                  href="/dashboard/werkposts"
                  onClick={() => setSettingsMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-200 hover:bg-white/5"
                >
                  <HardHat size={14} className="text-sky-400" />
                  Bouwnetwerk beheer
                </Link>
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
          <button
            type="button"
            onClick={() => setSidebarCollapsed((v) => !v)}
            className="mt-1 flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-zinc-500 transition-colors hover:bg-white/5 hover:text-zinc-300"
          >
            {sidebarCollapsed ? (
              <PanelRightOpen size={16} />
            ) : (
              <>
                <PanelRightClose size={16} />
                <span>Inklappen</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* 2. Gesprekkenlijst */}
      <div
        className={`relative flex min-w-0 flex-col border-r border-zinc-800/80 bg-zinc-900/40 ${
          mobileChatOpen ? "hidden lg:flex" : "flex"
        }`}
      >
        <div className="flex items-center justify-between border-b border-zinc-800/80 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <h2 className="text-base font-semibold text-zinc-100">Inbox</h2>
            {pendingSignatureCount > 0 && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-500/25 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                <FileSignature size={10} />
                {pendingSignatureCount} te tekenen
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="grid h-8 w-8 place-items-center rounded-lg text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
              aria-label="Filter"
            >
              <Filter size={15} />
            </button>
            <div className="relative" ref={newChatMenuRef}>
              <button
                type="button"
                title="Nieuw gesprek"
                onClick={() => setNewChatMenuOpen((open) => !open)}
                className="relative grid h-8 w-8 place-items-center rounded-lg text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
              >
                <Plus size={18} />
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
                    className="flex items-center gap-2.5 px-3 py-2 text-sm text-zinc-200 hover:bg-white/5"
                  >
                    <HardHat size={15} className="text-sky-400" />
                    Naar Bouwnetwerk beheer
                  </Link>
                  <Link
                    href="/dashboard/werkposts/nieuw"
                    onClick={() => setNewChatMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm text-zinc-200 hover:bg-white/5"
                  >
                    <Plus size={15} className="text-sky-400" />
                    Nieuwe werkpost plaatsen
                  </Link>
                  {pendingReacties.length > 0 && (
                    <>
                      <div className="my-1.5 h-px bg-white/10" />
                      {pendingReacties.slice(0, 5).map((r) => (
                        <Link
                          key={r.id}
                          href={`/dashboard/werkposts/${r.werkpostId}`}
                          onClick={() => setNewChatMenuOpen(false)}
                          className="block px-3 py-2 hover:bg-white/5"
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
        </div>

        <div className="border-b border-zinc-800/80 px-3 py-2">
          <div className="flex gap-1 rounded-lg bg-zinc-950/60 p-1">
            {(
              [
                ["alle", "Alle"],
                ["actief", "Actief"],
                ["gesloten", "Gesloten"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setInboxFilter(key)}
                className={`flex-1 rounded-md px-2 py-1.5 text-[11px] font-semibold transition-colors ${
                  inboxFilter === key
                    ? "bg-zinc-800 text-zinc-100 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {label}
                <span className="ml-1 text-zinc-600">({inboxCounts[key]})</span>
              </button>
            ))}
          </div>
        </div>

        <div className="px-3 py-2">
          <div className="flex items-center rounded-lg border border-zinc-800/80 bg-zinc-950/50 px-3 py-2">
            <Search size={15} className="mr-2 shrink-0 text-zinc-500" />
            <input
              type="text"
              placeholder="Zoek gesprekken"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-sm text-zinc-100 outline-none placeholder:text-zinc-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {samenwerkingen.length === 0 ? (
            <div className="grid place-items-center px-6 py-10 text-center">
              <div className="max-w-[240px] space-y-4">
                <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl border border-sky-500/20 bg-sky-500/10 text-sky-400">
                  <Handshake size={22} />
                </span>
                <p className="text-sm font-semibold text-zinc-200">Nog geen chats</p>
                <p className="text-xs leading-relaxed text-zinc-500">
                  Accepteer een reactie op een werkpost om te starten.
                </p>
                <SamenwerkingStartActions pendingCount={pendingReacties.length} />
              </div>
            </div>
          ) : filteredSamenwerkingen.length === 0 ? (
            <div className="px-4 py-8 text-center text-xs text-zinc-500">
              Geen gesprekken gevonden
            </div>
          ) : (
            conversationGroups.map(({ group, items }) => (
              <div key={group}>
                <button
                  type="button"
                  className="flex w-full items-center gap-1.5 px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-500"
                >
                  <ChevronDown size={12} />
                  {group}
                </button>
                {items.map((s) => {
                  const active = selectedId === s.channelId;
                  const channelContract = contractsByChannel[s.channelId] ?? null;
                  const needsSignature = contractNeedsMySignature(
                    channelContract,
                    companyId,
                  );
                  return (
                    <button
                      key={s.channelId}
                      onClick={() => {
                        setSelectedId(s.channelId);
                        setLoadedChannelId(null);
                        setMobileChatOpen(true);
                        if (needsSignature) {
                          setProfileTab("contract");
                          setContractModalOpen(true);
                        }
                      }}
                      className={`flex w-full gap-3 border-b border-zinc-800/50 px-4 py-3 text-left transition-colors hover:bg-zinc-800/30 ${
                        active ? "bg-sky-500/5" : ""
                      } ${needsSignature ? "bg-amber-500/[0.04]" : ""}`}
                    >
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr text-xs font-bold text-white ${getAvatarGradient(s.counterpartNaam)}`}
                      >
                        {getInitials(s.counterpartNaam)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <span className="truncate text-sm font-medium text-zinc-100">
                            {s.counterpartNaam}
                          </span>
                          <div className="flex shrink-0 items-center gap-1.5">
                            {needsSignature && (
                              <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-zinc-950">
                                <FileSignature size={9} />
                                Teken
                              </span>
                            )}
                            <span className="text-[10px] text-zinc-500">
                              {formatRelativeTime(s.lastMessageAt)}
                            </span>
                          </div>
                        </div>
                        {s.werkpostTitel && (
                          <p className="mt-0.5 truncate text-xs font-medium text-zinc-300">
                            {s.werkpostTitel}
                          </p>
                        )}
                        <p
                          className={`mt-0.5 line-clamp-2 text-xs ${
                            needsSignature
                              ? "font-medium text-amber-300/90"
                              : "text-zinc-500"
                          }`}
                        >
                          {needsSignature
                            ? "Contract wacht op jouw handtekening"
                            : (s.lastMessagePreview ?? "Start het gesprek…")}
                        </p>
                      </div>
                      {group === "Vastgezet" && !needsSignature && (
                        <Pin size={12} className="mt-1 shrink-0 text-sky-400/80" />
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>

      {/* 3. Berichtenthread */}
      <div
        className={`relative flex min-w-0 flex-col bg-zinc-950 transition-transform duration-300 ease-out ${
          mobileChatOpen ? "flex" : "hidden lg:flex"
        }`}
      >
        {selected ? (
          <>
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-800/80 bg-zinc-900/50 px-3 sm:px-4">
              <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setMobileChatOpen(false)}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-zinc-300 hover:bg-white/5 lg:hidden"
                  aria-label="Terug naar inbox"
                >
                  <ArrowLeft size={18} />
                </button>
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr text-xs font-bold text-white ${getAvatarGradient(selected.counterpartNaam)}`}
                >
                  {getInitials(selected.counterpartNaam)}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-zinc-100">
                    {selected.counterpartNaam}
                  </p>
                  <p className="truncate text-xs text-zinc-500">
                    {selected.werkpostTitel ?? "Bouwnetwerk-partner"}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-1 text-zinc-400">
                <button
                  type="button"
                  onClick={() => setContractModalOpen(true)}
                  className="relative grid h-8 w-8 place-items-center rounded-lg hover:bg-white/5 hover:text-sky-300"
                  title="Contract opstellen"
                >
                  <FileSignature size={16} />
                  {selectedContract &&
                    contractNeedsMySignature(selectedContract, companyId) && (
                      <span className="absolute -right-0.5 -top-0.5 grid h-2.5 w-2.5 rounded-full bg-amber-400 ring-2 ring-zinc-900" />
                    )}
                </button>
                <button
                  type="button"
                  onClick={() => handleSendMockCall("video-oproep")}
                  className="grid h-8 w-8 place-items-center rounded-lg hover:bg-white/5 hover:text-zinc-100"
                  title="Videobellen"
                >
                  <Video size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => handleSendMockCall("spraakoproep")}
                  className="grid h-8 w-8 place-items-center rounded-lg hover:bg-white/5 hover:text-zinc-100"
                  title="Bellen"
                >
                  <Phone size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowContactPanel(true);
                    setProfileTab("details");
                  }}
                  className="grid h-8 w-8 place-items-center rounded-lg hover:bg-white/5 hover:text-zinc-100 xl:hidden"
                  title="Partnerprofiel"
                >
                  <UserRound size={16} />
                </button>
                <div className="relative" ref={moreMenuRef}>
                  <button
                    type="button"
                    onClick={() => setMoreMenuOpen((open) => !open)}
                    className="grid h-8 w-8 place-items-center rounded-lg hover:bg-white/5 hover:text-zinc-100"
                    aria-label="Meer opties"
                  >
                    <MoreVertical size={16} />
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
                          Beoordeel partner
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setMoreMenuOpen(false);
                          setContractModalOpen(true);
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-zinc-200 hover:bg-white/5"
                      >
                        <FileSignature size={14} className="text-sky-400" />
                        Contract
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setMoreMenuOpen(false);
                          setProfileTab("bestanden");
                          setShowContactPanel(true);
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-zinc-200 hover:bg-white/5 xl:hidden"
                      >
                        <FileText size={14} className="text-cyan-400" />
                        Bestanden
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="relative flex min-h-0 flex-1 flex-col">
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
                composerMode={composerMode}
                setComposerMode={setComposerMode}
                counterpartNaam={selected.counterpartNaam}
                threadStartDate={selected.lastMessageAt}
              />
            </div>
          </>
        ) : (
          <EmptyWorkspace
            hasChats={samenwerkingen.length > 0}
            pendingCount={pendingReacties.length}
          />
        )}
      </div>

      {/* 4. Partnerprofiel (desktop) */}
      {selected && (
        <aside className="hidden min-w-0 flex-col border-l border-zinc-800/80 bg-zinc-900/30 xl:flex">
          <PartnerProfilePanel
            selected={selected}
            profileTab={profileTab}
            setProfileTab={setProfileTab}
            documents={documents}
            channelAfspraken={channelAfspraken}
            counterpartRatings={counterpartRatings}
            hasReviewed={hasReviewed}
            onOpenReview={openReview}
            loading={loading}
            uploading={uploading}
            uploadError={uploadError}
            docRef={docRef}
            onFiles={handleFiles}
            onPlanAfspraak={() => setAfsprakenModalOpen(true)}
            companyId={companyId}
            contract={selectedContract}
            contractPartyAName={contractPartyAName}
            contractPartyBName={contractPartyBName}
            onContractChange={(c) =>
              selectedId && updateChannelContract(selectedId, c)
            }
          />
        </aside>
      )}

      {/* Mobiel partnerprofiel */}
      {showContactPanel && selected && (
        <div className="fixed inset-0 z-50 flex justify-end bg-zinc-950/70 backdrop-blur-sm xl:hidden">
          <button
            type="button"
            className="absolute inset-0"
            aria-label="Sluit profiel"
            onClick={() => setShowContactPanel(false)}
          />
          <div className="relative flex h-full w-full max-w-sm flex-col border-l border-zinc-800/80 bg-zinc-900 shadow-2xl">
            <button
              type="button"
              onClick={() => setShowContactPanel(false)}
              className="absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-lg text-zinc-400 hover:bg-white/5"
            >
              <X size={16} />
            </button>
            <PartnerProfilePanel
              selected={selected}
              profileTab={profileTab}
              setProfileTab={setProfileTab}
              documents={documents}
              channelAfspraken={channelAfspraken}
              counterpartRatings={counterpartRatings}
              hasReviewed={hasReviewed}
              onOpenReview={openReview}
              loading={loading}
              uploading={uploading}
              uploadError={uploadError}
              docRef={docRef}
              onFiles={handleFiles}
              onPlanAfspraak={() => {
                setShowContactPanel(false);
                setAfsprakenModalOpen(true);
              }}
              companyId={companyId}
              contract={selectedContract}
              contractPartyAName={contractPartyAName}
              contractPartyBName={contractPartyBName}
              onContractChange={(c) =>
                selectedId && updateChannelContract(selectedId, c)
              }
            />
          </div>
        </div>
      )}

      {/* Afspraken modal */}
      {afsprakenModalOpen && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 p-4 backdrop-blur-sm">
          <div className="relative flex h-[min(640px,90dvh)] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl">
            <button
              type="button"
              onClick={() => setAfsprakenModalOpen(false)}
              className="absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-lg text-zinc-400 hover:bg-white/5"
            >
              <X size={16} />
            </button>
            <AfsprakenPanel
              channelId={selectedId!}
              counterpartId={selected.counterpartId}
              counterpartNaam={selected.counterpartNaam}
              afspraken={channelAfspraken}
            />
          </div>
        </div>
      )}

      {/* Contract modal */}
      {contractModalOpen && selected && selectedId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 p-4 backdrop-blur-sm">
          <div className="relative flex max-h-[min(720px,92dvh)] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl">
            <button
              type="button"
              onClick={() => setContractModalOpen(false)}
              className="absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-lg text-zinc-400 hover:bg-white/5"
            >
              <X size={16} />
            </button>
            <div className="overflow-y-auto p-5 sm:p-6">
              <SamenwerkingContractPanel
                channelId={selectedId}
                companyId={companyId}
                partyAName={contractPartyAName}
                partyBName={contractPartyBName}
                initialContract={selectedContract}
                onContractChange={(c) => updateChannelContract(selectedId, c)}
              />
            </div>
          </div>
        </div>
      )}

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
  hasChats,
  pendingCount,
}: {
  hasChats: boolean;
  pendingCount: number;
}) {
  return (
    <div className="grid flex-1 place-items-center p-6 text-center text-zinc-500">
      <div className="max-w-sm space-y-4">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-xl border border-zinc-800 bg-zinc-900/80 text-sky-400/90">
          <MessageCircle size={32} strokeWidth={1.5} />
        </span>
        <div className="space-y-1.5">
          <h3 className="text-lg font-medium text-zinc-200">Samenwerkingen</h3>
          <p className="text-sm leading-relaxed text-zinc-500">
            {hasChats
              ? "Kies een gesprek in de inbox om te beginnen."
              : "Chat, deel documenten en plan afspraken met partners uit het Bouwnetwerk."}
          </p>
        </div>
        {!hasChats && <SamenwerkingStartActions pendingCount={pendingCount} />}
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
  composerMode,
  setComposerMode,
  counterpartNaam,
  threadStartDate,
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
  composerMode: ComposerMode;
  setComposerMode: (mode: ComposerMode) => void;
  counterpartNaam: string;
  threadStartDate: string | null;
}) {
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

  return (
    <>
      <div className="flex-1 overflow-y-auto bg-zinc-950 px-4 py-4 sm:px-6">
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
          <p className="mt-8 text-center text-sm text-zinc-500">
            Nog geen berichten. Stuur het eerste bericht hieronder.
          </p>
        ) : (
          <div className="space-y-4">
            {threadStartDate && (
              <div className="flex justify-center">
                <span className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 text-[11px] font-medium text-zinc-500">
                  {formatThreadDate(threadStartDate)}
                </span>
              </div>
            )}
            {messages.map((m) => {
              const isMine = m.sender_company_id === companyId;
              const attachments = parseAttachments(m.attachments);
              const rich = parseRichMessage(m.content);
              const senderName = isMine ? "Jij" : counterpartNaam;

              return (
                <div key={m.id} className="group flex gap-3">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${
                      isMine
                        ? "bg-gradient-to-tr from-sky-500 to-cyan-600"
                        : `bg-gradient-to-tr ${getAvatarGradient(counterpartNaam)}`
                    }`}
                  >
                    {getInitials(senderName)}
                  </div>
                  <div className="min-w-0 flex-1 max-w-[85%]">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="text-xs font-semibold text-zinc-200">
                        {senderName}
                      </span>
                      <span className="text-[10px] text-zinc-500">
                        {formatRelativeTime(m.created_at)}
                      </span>
                    </div>
                    <div
                      className={`rounded-lg border px-3 py-2.5 text-sm ${
                        isMine
                          ? "border-sky-500/20 bg-sky-500/5 text-zinc-100"
                          : "border-zinc-800 bg-zinc-900/80 text-zinc-100"
                      }`}
                    >
                      {rich?.replyTo && (
                        <div className="mb-2 rounded-md border-l-2 border-sky-400 bg-zinc-950/40 p-2 text-xs">
                          <p className="font-semibold text-sky-400">
                            {rich.replyTo.sender}
                          </p>
                          <p className="truncate text-zinc-400">
                            {rich.replyTo.content}
                          </p>
                        </div>
                      )}
                      {rich?.callType && (
                        <div className="flex items-center gap-2 text-xs">
                          {rich.callType === "video-oproep" ? (
                            <Video size={14} className="text-sky-400" />
                          ) : (
                            <Phone size={14} className="text-sky-400" />
                          )}
                          <span className="capitalize">{rich.callType}</span>
                          {rich.duration && (
                            <span className="text-zinc-500">· {rich.duration}</span>
                          )}
                        </div>
                      )}
                      {rich?.audioUrl && (
                        <div className="flex items-center gap-2 text-xs text-zinc-300">
                          <Mic size={14} className="text-sky-400" />
                          Spraakbericht {rich.audioDuration ?? ""}
                        </div>
                      )}
                      {attachments.length > 0 && (
                        <div className="mb-2 space-y-2">
                          {attachments.map((att, i) =>
                            att.isImage ? (
                              <a
                                key={`${att.url}-${i}`}
                                href={att.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block overflow-hidden rounded-md border border-zinc-800"
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
                                className="flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-950/50 px-2.5 py-2 text-xs"
                              >
                                <FileText size={14} className="text-sky-400" />
                                <span className="truncate">{att.name}</span>
                              </a>
                            ),
                          )}
                        </div>
                      )}
                      {rich?.text && (
                        <p className="whitespace-pre-wrap leading-relaxed">
                          {rich.text}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setReplyTo(m)}
                      className="mt-1 hidden text-[10px] text-zinc-500 hover:text-sky-400 group-hover:inline-flex"
                    >
                      Antwoorden
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {replyTo && (
        <div className="flex shrink-0 items-center justify-between border-l-2 border-sky-400 bg-zinc-900/80 px-4 py-2 text-xs text-zinc-300">
          <div className="truncate pr-4">
            <span className="block font-semibold text-sky-400">
              Antwoorden op{" "}
              {replyTo.sender_company_id === companyId ? "Jezelf" : counterpartNaam}
            </span>
            <span className="block truncate opacity-80">
              {parseRichMessage(replyTo.content)?.text ||
                replyTo.content ||
                "Bijlage"}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setReplyTo(null)}
            className="shrink-0 text-zinc-400 hover:text-zinc-200"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {(uploadError || sendError) && (
        <p className="border-t border-rose-500/20 bg-rose-500/10 px-4 py-2 text-xs text-rose-400">
          {uploadError ?? sendError}
        </p>
      )}

      <div className="shrink-0 border-t border-zinc-800/80 bg-zinc-900/50">
        <div className="flex gap-4 border-b border-zinc-800/80 px-4">
          {(
            [
              ["reply", "Antwoorden"],
              ["note", "Interne notitie"],
            ] as const
          ).map(([mode, label]) => (
            <button
              key={mode}
              type="button"
              onClick={() => setComposerMode(mode)}
              className={`border-b-2 py-2.5 text-xs font-semibold transition-colors ${
                composerMode === mode
                  ? "border-sky-400 text-zinc-100"
                  : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <form onSubmit={onSend} className="space-y-2 p-3 sm:p-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={
              composerMode === "note"
                ? "Interne notitie (alleen voor jou zichtbaar in toekomstige versie)…"
                : "Typ je antwoord…"
            }
            rows={3}
            className="w-full resize-none rounded-lg border border-zinc-800 bg-zinc-950/70 px-3 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-sky-500/40"
          />
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1">
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
                className="grid h-8 w-8 place-items-center rounded-lg text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                aria-label="Bijlage"
              >
                {uploading ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Paperclip size={15} />
                )}
              </button>
              <div className="relative" ref={emojiPickerRef}>
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker((open) => !open)}
                  className="grid h-8 w-8 place-items-center rounded-lg text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                  aria-label="Emoji"
                >
                  <Smile size={15} />
                </button>
                {showEmojiPicker && (
                  <div className="absolute bottom-full left-0 z-50 mb-2 grid grid-cols-4 gap-1 rounded-lg border border-zinc-700 bg-zinc-900 p-2 shadow-xl">
                    {quickEmojis.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => {
                          setText(text + emoji);
                          setShowEmojiPicker(false);
                        }}
                        className="grid h-8 w-8 place-items-center rounded-md text-lg hover:bg-white/10"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={onSendMockAudio}
                className="grid h-8 w-8 place-items-center rounded-lg text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                title="Spraakbericht"
              >
                <Mic size={15} />
              </button>
            </div>
            <button
              type="submit"
              disabled={sending || !text.trim()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-sky-500 px-4 py-2 text-xs font-bold text-zinc-950 transition-colors hover:bg-sky-400 disabled:opacity-50"
            >
              {sending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Send size={14} />
              )}
              Versturen
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

// ---------------------------------------------------------
// PARTNER PROFILE PANEL (rechterkolom)
// ---------------------------------------------------------

function PartnerProfilePanel({
  selected,
  profileTab,
  setProfileTab,
  documents,
  channelAfspraken,
  counterpartRatings,
  hasReviewed,
  onOpenReview,
  loading,
  uploading,
  uploadError,
  docRef,
  onFiles,
  onPlanAfspraak,
  companyId,
  contract,
  contractPartyAName,
  contractPartyBName,
  onContractChange,
}: {
  selected: Samenwerking;
  profileTab: ProfileTab;
  setProfileTab: (tab: ProfileTab) => void;
  documents: { att: Attachment; at: string | null; mine: boolean }[];
  channelAfspraken: AfspraakRow[];
  counterpartRatings: Record<number, { avg: number; count: number }>;
  hasReviewed: (cid: number) => boolean;
  onOpenReview: (cid: number) => void;
  loading: boolean;
  uploading: boolean;
  uploadError: string | null;
  docRef: React.RefObject<HTMLInputElement | null>;
  onFiles: (list: FileList | null) => void;
  onPlanAfspraak: () => void;
  companyId: number;
  contract: SamenwerkingContractRow | null;
  contractPartyAName: string;
  contractPartyBName: string;
  onContractChange: (contract: SamenwerkingContractRow | null) => void;
}) {
  const rating =
    selected.counterpartId != null
      ? counterpartRatings[selected.counterpartId]
      : undefined;
  const needsSignature = contractNeedsMySignature(contract, companyId);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-zinc-800/80 px-4 py-5 text-center">
        <div
          className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr text-sm font-bold text-white ${getAvatarGradient(selected.counterpartNaam)}`}
        >
          {getInitials(selected.counterpartNaam)}
        </div>
        <h3 className="mt-3 text-sm font-semibold text-zinc-100">
          {selected.counterpartNaam}
        </h3>
        <p className="text-xs text-zinc-500">Bouwnetwerk-partner</p>
        {rating && (
          <p className="mt-2 text-xs text-zinc-400">
            <span className="text-amber-400">★</span> {rating.avg.toFixed(1)} ·{" "}
            {rating.count} beoordeling{rating.count === 1 ? "" : "en"}
          </p>
        )}
      </div>

      <div className="border-b border-zinc-800/80 px-3 py-2">
        <div className="flex gap-1 rounded-lg bg-zinc-950/50 p-1">
          {(
            [
              ["details", "Details"],
              ["contract", "Contract"],
              ["bestanden", "Bestanden"],
              ["activiteit", "Activiteit"],
            ] as const
          ).map(([tab, label]) => (
            <button
              key={tab}
              type="button"
              onClick={() => setProfileTab(tab)}
              className={`flex-1 rounded-md px-2 py-1.5 text-[10px] font-semibold transition-colors ${
                profileTab === tab
                  ? "bg-zinc-800 text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {tab === "contract" && needsSignature ? (
                <span className="inline-flex items-center justify-center gap-1">
                  Contract
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                </span>
              ) : (
                label
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {profileTab === "details" && (
          <div className="space-y-4 text-sm">
            <ProfileField
              icon={Building2}
              label="Bedrijf"
              value={selected.counterpartNaam}
            />
            {selected.werkpostTitel && (
              <ProfileField
                icon={HardHat}
                label="Werkpost"
                value={selected.werkpostTitel}
                href={
                  selected.werkpostId
                    ? `/dashboard/werkposts/${selected.werkpostId}`
                    : undefined
                }
              />
            )}
            <ProfileField
              icon={Clock}
              label="Laatste activiteit"
              value={
                selected.lastMessageAt
                  ? formatDateTime(selected.lastMessageAt)
                  : "Nog geen berichten"
              }
            />
            {selected.counterpartId && (
              <button
                type="button"
                onClick={() => onOpenReview(selected.counterpartId!)}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-zinc-300 hover:bg-white/5"
              >
                <Star size={13} className="text-amber-400" />
                {hasReviewed(selected.counterpartId)
                  ? "Beoordeling bewerken"
                  : "Partner beoordelen"}
              </button>
            )}
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                <Tag size={11} /> Tags
              </p>
              <div className="flex flex-wrap gap-1.5">
                {["Bouwnetwerk", "Partner", selected.werkpostTitel ? "Project" : "Direct"].map(
                  (tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-zinc-800 bg-zinc-950/60 px-2 py-0.5 text-[10px] font-medium text-zinc-400"
                    >
                      {tag}
                    </span>
                  ),
                )}
              </div>
            </div>
          </div>
        )}

        {profileTab === "contract" && (
          <SamenwerkingContractPanel
            channelId={selected.channelId}
            companyId={companyId}
            partyAName={contractPartyAName}
            partyBName={contractPartyBName}
            initialContract={contract}
            onContractChange={onContractChange}
            compact
          />
        )}

        {profileTab === "bestanden" && (
          <div className="space-y-3">
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
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-sky-500 px-3 py-2 text-xs font-bold text-zinc-950 hover:bg-sky-400 disabled:opacity-50"
            >
              {uploading ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Paperclip size={13} />
              )}
              Upload bestand
            </button>
            {uploadError && (
              <p className="text-xs text-rose-400">{uploadError}</p>
            )}
            {loading ? (
              <div className="grid place-items-center py-8 text-zinc-500">
                <Loader2 size={20} className="animate-spin text-sky-400" />
              </div>
            ) : documents.length === 0 ? (
              <p className="py-6 text-center text-xs text-zinc-500">
                Nog geen bestanden gedeeld.
              </p>
            ) : (
              <ul className="space-y-2">
                {documents.slice(0, 12).map(({ att, at, mine }, i) => (
                  <li key={`${att.url}-${i}`}>
                    <a
                      href={att.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/50 px-2.5 py-2 text-xs hover:border-sky-500/20"
                    >
                      {att.isImage ? (
                        <ImageIcon size={14} className="text-sky-400" />
                      ) : (
                        <FileText size={14} className="text-sky-400" />
                      )}
                      <span className="min-w-0 flex-1 truncate text-zinc-200">
                        {att.name}
                      </span>
                      <span className="shrink-0 text-[10px] text-zinc-500">
                        {mine ? "Jij" : "Partner"}
                        {at ? ` · ${formatRelativeTime(at)}` : ""}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {profileTab === "activiteit" && (
          <div className="space-y-3">
            {channelAfspraken.length === 0 ? (
              <p className="py-6 text-center text-xs text-zinc-500">
                Nog geen afspraken gepland.
              </p>
            ) : (
              <ul className="space-y-2">
                {channelAfspraken.map((a) => {
                  const meta =
                    statusMeta[a.status ?? "gepland"] ?? statusMeta.gepland;
                  return (
                    <li
                      key={a.id}
                      className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3"
                    >
                      <p className="text-xs font-semibold text-zinc-100">
                        {a.titel}
                      </p>
                      <p className="mt-1 text-[10px] text-zinc-500">
                        {formatDateTime(a.startTijd)}
                      </p>
                      {a.locatie && (
                        <p className="mt-1 flex items-center gap-1 text-[10px] text-zinc-500">
                          <MapPin size={10} /> {a.locatie}
                        </p>
                      )}
                      <span
                        className={`mt-2 inline-block rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${meta.className}`}
                      >
                        {meta.label}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
            <p className="pt-2 text-[10px] leading-relaxed text-zinc-600">
              Plan nieuwe afspraken rechtstreeks vanuit dit gesprek.
            </p>
            <button
              type="button"
              onClick={onPlanAfspraak}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-xs font-semibold text-sky-300 hover:bg-sky-500/15"
            >
              <CalendarPlus size={13} />
              Nieuwe afspraak
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ProfileField({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: typeof Building2;
  label: string;
  value: string;
  href?: string;
}) {
  const content = (
    <div className="flex items-start gap-2.5">
      <Icon size={14} className="mt-0.5 shrink-0 text-zinc-500" />
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
          {label}
        </p>
        <p className="mt-0.5 truncate text-sm text-zinc-200">{value}</p>
      </div>
    </div>
  );
  if (href) {
    return (
      <Link href={href} className="block transition-colors hover:text-sky-300">
        {content}
      </Link>
    );
  }
  return content;
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
