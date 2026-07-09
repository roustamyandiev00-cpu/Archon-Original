"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Bell, Radio, Activity, X } from "lucide-react";
import { BrandLockup } from "@/components/BrandLogo";
import ThemeToggle from "@/components/dashboard/ThemeToggle";
import AgentChatTopbarButton from "@/components/dashboard/agent-chat/AgentChatTopbarButton";
import { usePendingApprovals } from "@/components/dashboard/PendingApprovalsProvider";
import type { TopbarSummary } from "@/components/dashboard/mission-data";

const quickLinks = [
  { label: "Overzicht", href: "/dashboard" },
  { label: "Offertes", href: "/dashboard/offertes" },
  { label: "Facturen", href: "/dashboard/facturen" },
  { label: "Leads / CRM", href: "/dashboard/leads" },
  { label: "Contacten", href: "/dashboard/contacten" },
  { label: "Automatisaties", href: "/dashboard/automatisaties" },
  { label: "Instellingen", href: "/dashboard/instellingen" },
];

function euro(n: number) {
  if (n >= 1000) return `€ ${(n / 1000).toFixed(1)}k`;
  return `€ ${Math.round(n).toLocaleString("nl-BE")}`;
}

export default function Topbar({
  initial,
}: {
  initial: TopbarSummary;
}) {
  const router = useRouter();
  const { items: pendingItems } = usePendingApprovals();
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [query, setQuery] = useState("");
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
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const filtered = quickLinks.filter((l) =>
    l.label.toLowerCase().includes(query.toLowerCase()),
  );

  const liveNotifications = [
    ...pendingItems.slice(0, 6).map((item) => ({
      id: `approval-${item.id}`,
      title: item.title,
      detail: `${item.agent_name} · wacht op goedkeuring`,
      href: item.href,
    })),
    ...initial.notifications.filter((n) => !n.id.startsWith("action-")),
  ].slice(0, 8);

  const notifyCount = liveNotifications.length;

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center border-b border-white/10 bg-zinc-900/85 backdrop-blur-xl lg:left-[220px]">
        <div className="flex w-full items-center gap-4 px-4 sm:px-6">
          <div className="lg:hidden">
            <BrandLockup href="/dashboard" markSize={32} wordmarkSize="sm" />
          </div>

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

            <ThemeToggle />

            <IconButton
              label="Meldingen"
              onClick={() => {
                setNotifyOpen((v) => !v);
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
                      router.push(n.href);
                    }}
                    className="w-full rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-white/5"
                  >
                    <p className="text-sm font-medium text-zinc-100">{n.title}</p>
                    <p className="mt-0.5 text-xs text-zinc-500">{n.detail}</p>
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
            <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
              <Search size={16} className="text-zinc-500" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Zoek een pagina…"
                className="flex-1 bg-transparent text-sm text-zinc-100 outline-none placeholder:text-zinc-500"
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="text-xs text-zinc-500 hover:text-zinc-300"
              >
                Esc
              </button>
            </div>
            <div className="max-h-72 overflow-y-auto p-2">
              {filtered.map((link) => (
                <button
                  key={link.href}
                  type="button"
                  onClick={() => {
                    setSearchOpen(false);
                    router.push(link.href);
                  }}
                  className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm text-zinc-200 transition-colors hover:bg-white/5"
                >
                  {link.label}
                  <ArrowHint />
                </button>
              ))}
            </div>
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
