"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Bell,
  Radio,
  Activity,
  X,
  ChevronDown,
  BarChart3,
  LineChart,
} from "lucide-react";
import { LogoMark } from "@/components/BrandLogo";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import ThemeToggle from "@/components/dashboard/ThemeToggle";
import AgentChatTopbarButton from "@/components/dashboard/agent-chat/AgentChatTopbarButton";
import AgentAvatar from "@/components/dashboard/agents/AgentAvatar";
import { useAgentCompletions } from "@/components/dashboard/AgentCompletionsProvider";
import { usePendingApprovals } from "@/components/dashboard/PendingApprovalsProvider";
import TopbarProfileMenu from "@/components/dashboard/TopbarProfileMenu";
import type { TopbarProfile, TopbarSummary } from "@/components/dashboard/mission-data";
import {
  TOPBAR_OBSERVEER_ITEMS,
} from "@/components/dashboard/sidebar-nav";

const quickLinks = [
  { label: "Command Center", href: "/dashboard/command-center" },
  { label: "Offertes", href: "/dashboard/offertes" },
  { label: "Facturen", href: "/dashboard/facturen" },
  { label: "Leads / CRM", href: "/dashboard/leads" },
  { label: "Contacten", href: "/dashboard/contacten" },
  { label: "Automatisaties", href: "/dashboard/automatisaties" },
  { label: "Instellingen", href: "/dashboard/instellingen" },
  ...TOPBAR_OBSERVEER_ITEMS.map((item) => ({
    label: item.label,
    href: item.href,
  })),
];

function euro(n: number) {
  if (n >= 1000) return `€ ${(n / 1000).toFixed(1)}k`;
  return `€ ${Math.round(n).toLocaleString("nl-BE")}`;
}

export default function Topbar({
  initial,
  profile = null,
  isPreviewMode = false,
}: {
  initial: TopbarSummary;
  profile?: TopbarProfile | null;
  isPreviewMode?: boolean;
}) {
  const router = useRouter();
  const { items: pendingItems } = usePendingApprovals();
  const {
    unreadItems: completedItems,
    unreadCount: completedUnreadCount,
    markNotificationsRead,
  } = useAgentCompletions();
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [observeOpen, setObserveOpen] = useState(false);
  const observeRef = useRef<HTMLDivElement>(null);
  const [syncedAgo, setSyncedAgo] = useState("nu");

  useEffect(() => {
    const tick = () => {
      const sec = Math.max(
        1,
        Math.round((Date.now() - new Date(initial.syncedAt).getTime()) / 1000),
      );
      setSyncedAgo(`${sec}s`);
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [initial.syncedAt]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
        setNotifyOpen(false);
        setObserveOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!observeOpen) return;
    function onPointerDown(e: MouseEvent) {
      if (observeRef.current && !observeRef.current.contains(e.target as Node)) {
        setObserveOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [observeOpen]);

  const liveNotifications = [
    ...pendingItems.slice(0, 6).map((item) => ({
      id: `approval-${item.id}`,
      kind: "approval" as const,
      title: item.title,
      detail: `${item.agent_name} · wacht op goedkeuring`,
      agent_name: item.agent_name,
      href: item.href,
    })),
    ...completedItems.slice(0, 6).map((item) => ({
      id: `completed-${item.id}`,
      kind: "completed" as const,
      title: item.title,
      detail: item.detail,
      agent_name: item.agent_name,
      href: item.href,
    })),
    ...initial.notifications.filter((n) => !n.id.startsWith("action-")),
  ].slice(0, 10);

  const notifyCount =
    pendingItems.length + completedUnreadCount + initial.notifications.filter((n) => !n.id.startsWith("action-")).length;

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center border-b border-white/10 bg-zinc-900/85 backdrop-blur-xl lg:left-[220px]">
        <div className="flex w-full items-center gap-4 px-4 sm:px-6">
          <Link
            href="/dashboard/command-center"
            className="inline-flex shrink-0 lg:hidden"
            aria-label="ArchonPro home"
          >
            <LogoMark size={34} glow={false} />
          </Link>

          <div className="hidden items-center gap-5 md:flex">
            <Stat label="Offertes vandaag" value={String(initial.offertesVandaag)} />
            <span className="h-4 w-px bg-white/10" />
            <Stat label="Verzonden" value={String(initial.verzonden)} />
            <span className="h-4 w-px bg-white/10" />
            <Stat label="Pipeline" value={euro(initial.pipeline)} />
          </div>

          <div className="ml-auto flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="Zoeken"
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-zinc-400 transition-colors hover:text-zinc-100"
            >
              <Search size={14} aria-hidden />
              <span className="hidden sm:inline">Zoeken</span>
              <kbd className="hidden rounded bg-white/10 px-1.5 py-0.5 font-mono text-[10px] text-zinc-500 sm:inline">
                ⌘K
              </kbd>
            </button>

            <AgentChatTopbarButton />

            <div className="relative hidden sm:block" ref={observeRef}>
              <button
                type="button"
                onClick={() => {
                  setObserveOpen((v) => !v);
                  setNotifyOpen(false);
                }}
                aria-expanded={observeOpen}
                aria-haspopup="menu"
                className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-zinc-400 transition-colors hover:text-zinc-100"
              >
                Observeer
                <ChevronDown
                  size={12}
                  className={`transition-transform ${observeOpen ? "rotate-180" : ""}`}
                />
              </button>
              {observeOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-[calc(100%+0.35rem)] z-50 w-52 rounded-xl border border-white/10 bg-zinc-950 py-1 shadow-2xl"
                >
                  {TOPBAR_OBSERVEER_ITEMS.map((item) => {
                    const Icon =
                      item.label === "Analytics"
                        ? LineChart
                        : item.label === "KPI's"
                          ? BarChart3
                          : Search;
                    return (
                      <button
                        key={item.href}
                        type="button"
                        role="menuitem"
                        disabled
                        title="Binnenkort beschikbaar"
                        className="flex w-full cursor-not-allowed items-center gap-2.5 px-3 py-2 text-left text-sm text-zinc-500"
                      >
                        <Icon size={14} aria-hidden />
                        {item.label}
                        <span className="ml-auto rounded-full bg-white/5 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-zinc-600">
                          Soon
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <ThemeToggle />

            <IconButton
              label="Meldingen"
              onClick={() => {
                setNotifyOpen((v) => {
                  const next = !v;
                  if (next) markNotificationsRead();
                  return next;
                });
                setSearchOpen(false);
              }}
              active={notifyOpen}
            >
              <Bell size={16} aria-hidden />
              {notifyCount > 0 && (
                <span
                  aria-hidden
                  className="absolute -right-0.5 -top-0.5 grid h-4 w-4 place-items-center rounded-full bg-amber-500 text-[9px] font-bold text-zinc-950"
                >
                  {Math.min(notifyCount, 9)}
                </span>
              )}
            </IconButton>

            <Link
              href="/dashboard/deploy"
              className="relative grid h-8 w-8 place-items-center rounded-lg text-zinc-400 transition-colors hover:bg-white/5 hover:text-zinc-100"
              aria-label="Live status"
            >
              <Radio size={16} aria-hidden />
            </Link>

            <div
              className="ml-1 hidden items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 sm:flex"
              role="status"
              aria-label="Synchronisatiestatus"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              <Activity size={13} className="text-zinc-400" />
              <span className="font-mono text-[11px] text-zinc-400">
                gesync {syncedAgo}
              </span>
            </div>

            <TopbarProfileMenu profile={profile} isPreviewMode={isPreviewMode} />
          </div>
        </div>

        {notifyOpen && (
          <div className="absolute right-4 top-[3.6rem] z-50 w-[min(92vw,22rem)] rounded-2xl border border-white/10 bg-zinc-950 shadow-2xl sm:right-6">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <p className="text-sm font-semibold text-zinc-100">Meldingen</p>
              <button
                type="button"
                onClick={() => setNotifyOpen(false)}
                aria-label="Sluit meldingen"
                className="text-zinc-500 hover:text-zinc-200"
              >
                <X size={16} />
              </button>
            </div>
            <div className="max-h-72 overflow-y-auto p-2">
              {liveNotifications.length === 0 ? (
                <p className="px-2 py-4 text-center text-xs text-zinc-500">
                  Geen nieuwe meldingen.
                </p>
              ) : (
                liveNotifications.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => {
                      setNotifyOpen(false);
                      markNotificationsRead();
                      router.push(n.href);
                    }}
                    className="flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-white/5"
                  >
                    {"agent_name" in n && n.agent_name ? (
                      <AgentAvatar agentName={String(n.agent_name)} size="sm" />
                    ) : null}
                    <span className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-zinc-100">{n.title}</p>
                      <p className="mt-0.5 text-xs text-zinc-500">{n.detail}</p>
                    </span>
                    {"kind" in n && n.kind === "completed" ? (
                      <span className="mt-0.5 shrink-0 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                        Klaar
                      </span>
                    ) : null}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </header>

      {searchOpen && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/60 px-4 pt-24 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Zoeken in dashboard"
            className="w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 shadow-2xl"
          >
            <Command>
              <div className="flex items-center border-b border-zinc-700/45 pr-3">
                <div className="flex-1">
                  <CommandInput placeholder="Zoek een pagina…" />
                </div>
                <button
                  type="button"
                  onClick={() => setSearchOpen(false)}
                  className="text-xs text-zinc-500 hover:text-zinc-300"
                >
                  Esc
                </button>
              </div>
              <CommandList>
                {quickLinks.map((link) => (
                  <CommandItem
                    key={link.href}
                    value={link.label}
                    onSelect={() => {
                      setSearchOpen(false);
                      router.push(link.href);
                    }}
                    className="justify-between"
                  >
                    {link.label}
                    <ArrowHint />
                  </CommandItem>
                ))}
                <CommandEmpty>Geen pagina gevonden.</CommandEmpty>
              </CommandList>
            </Command>
          </div>
        </div>
      )}
    </>
  );
}

function ArrowHint() {
  return <span className="text-xs text-zinc-600">↵</span>;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-[11px] uppercase tracking-wide text-zinc-500">
        {label}
      </span>
      <span className="font-mono text-sm font-semibold text-zinc-100">
        {value}
      </span>
    </div>
  );
}

function IconButton({
  label,
  children,
  onClick,
  active,
}: {
  label: string;
  children: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-expanded={active}
      onClick={onClick}
      className={`relative grid h-8 w-8 place-items-center rounded-lg text-zinc-400 transition-colors hover:bg-white/5 hover:text-zinc-100 ${
        active ? "bg-white/5 text-zinc-100" : ""
      }`}
    >
      {children}
    </button>
  );
}
