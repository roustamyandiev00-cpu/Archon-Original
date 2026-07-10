"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  HardHat,
  HandHelping,
  Handshake,
  MessageCircle,
  Plus,
  Search,
} from "lucide-react";
import ChatClient, {
  type ChannelSummary,
} from "@/components/dashboard/comms/ChatClient";
import type { BouwnetwerkData } from "@/components/dashboard/bouwnetwerk/load-bouwnetwerk-data";
import BouwnetwerkWerkpostsView from "@/components/dashboard/bouwnetwerk/BouwnetwerkWerkpostsView";
import BouwnetwerkHulpverzoekenView from "@/components/dashboard/bouwnetwerk/BouwnetwerkHulpverzoekenView";
import type { WerkpostRow } from "@/lib/werkposts";

const STORAGE_KEY = "archon-bouwnetwerk-view";

export type BouwnetwerkViewId = "chat" | "werkposts" | "hulpverzoeken";

type ChannelFilter = "alles" | "direct" | "groepen" | "projecten";

const VIEWS: { id: BouwnetwerkViewId; label: string }[] = [
  { id: "chat", label: "Chat" },
  { id: "werkposts", label: "Werkposts" },
  { id: "hulpverzoeken", label: "Hulpverzoeken" },
];

function readStoredView(): BouwnetwerkViewId {
  if (typeof window === "undefined") return "chat";
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "chat" || stored === "werkposts" || stored === "hulpverzoeken") {
    return stored;
  }
  return "chat";
}

export default function BouwnetwerkHub({
  companyId,
  preview,
  channels,
  posts,
  hulpverzoeken,
  openHulpverzoeken,
  pendingReacties,
}: BouwnetwerkData & {
  companyId: number | null;
  preview: boolean;
}) {
  const [activeView, setActiveView] = useState<BouwnetwerkViewId>("chat");
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(
    channels[0]?.id ?? null,
  );
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ChannelFilter>("alles");

  useEffect(() => {
    setActiveView(readStoredView());
  }, []);

  useEffect(() => {
    if (!selectedChannelId && channels[0]?.id) {
      setSelectedChannelId(channels[0].id);
    }
  }, [channels, selectedChannelId]);

  const selectView = useCallback((id: BouwnetwerkViewId) => {
    setActiveView(id);
    localStorage.setItem(STORAGE_KEY, id);
  }, []);

  const filteredChannels = useMemo(() => {
    let list = channels;
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (c) =>
          c.counterpartNaam.toLowerCase().includes(q) ||
          (c.werkpostTitel?.toLowerCase().includes(q) ?? false) ||
          (c.name?.toLowerCase().includes(q) ?? false),
      );
    }
    if (filter === "projecten") {
      list = list.filter((c) => Boolean(c.werkpostId));
    } else if (filter === "direct") {
      list = list.filter((c) => !c.werkpostId);
    } else if (filter === "groepen") {
      list = list.filter((c) => Boolean(c.name));
    }
    return list;
  }, [channels, query, filter]);

  const badges: Record<BouwnetwerkViewId, number> = {
    chat: channels.length,
    werkposts: posts.filter((p) => p.status === "open").length,
    hulpverzoeken: hulpverzoeken.length + openHulpverzoeken.length,
  };

  return (
    <div className="flex min-h-[calc(100vh-12rem)] flex-col gap-0 overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/30 lg:flex-row">
      {/* Linker sidebar — kanalen */}
      <aside className="flex w-full shrink-0 flex-col border-b border-white/10 lg:w-[280px] lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3.5">
          <div className="flex items-center gap-2">
            <HardHat size={16} className="text-sky-400" />
            <h2 className="text-sm font-semibold text-zinc-100">BouwNetwerk</h2>
          </div>
          {!preview && (
            <Link
              href="/dashboard/werkposts/nieuw"
              className="grid h-7 w-7 place-items-center rounded-full bg-sky-500/15 text-sky-400 transition-colors hover:bg-sky-500/25"
              aria-label="Nieuw kanaal of werkpost"
            >
              <Plus size={14} />
            </Link>
          )}
        </div>

        <div className="border-b border-white/10 px-3 py-2.5">
          <div className="relative">
            <Search
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Zoek kanalen, berichten…"
              className="w-full rounded-xl border border-white/10 bg-zinc-950/50 py-2 pl-9 pr-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-sky-500/40"
            />
          </div>
        </div>

        <div className="flex gap-1 overflow-x-auto border-b border-white/10 px-3 py-2 scrollbar-thin">
          {(
            [
              ["alles", "Alles"],
              ["direct", "Direct"],
              ["groepen", "Groepen"],
              ["projecten", "Projecten"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setFilter(id)}
              className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
                filter === id
                  ? "bg-white/10 text-zinc-200"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="min-h-[200px] flex-1 overflow-y-auto">
          {filteredChannels.length > 0 ? (
            filteredChannels.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setSelectedChannelId(c.id);
                  selectView("chat");
                }}
                className={`flex w-full flex-col gap-0.5 border-b border-white/5 px-4 py-3 text-left transition-colors hover:bg-white/[0.04] ${
                  selectedChannelId === c.id && activeView === "chat"
                    ? "bg-sky-500/10"
                    : ""
                }`}
              >
                <span className="truncate text-sm font-medium text-zinc-100">
                  {c.counterpartNaam}
                </span>
                {c.werkpostTitel && (
                  <span className="truncate text-xs text-zinc-500">
                    {c.werkpostTitel}
                  </span>
                )}
              </button>
            ))
          ) : (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-zinc-500">Geen kanalen gevonden</p>
              {!preview && (
                <Link
                  href="/dashboard/werkposts/nieuw"
                  className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-sky-500 px-3 py-1.5 text-xs font-semibold text-zinc-950 hover:bg-sky-400"
                >
                  <Plus size={12} />
                  Nieuw kanaal
                </Link>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* Rechter paneel */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
          <div className="flex gap-1 overflow-x-auto">
            {VIEWS.map((view) => {
              const count = badges[view.id];
              const active = activeView === view.id;
              return (
                <button
                  key={view.id}
                  type="button"
                  onClick={() => selectView(view.id)}
                  className={`relative shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    active
                      ? "bg-sky-500/15 text-sky-300"
                      : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                  }`}
                >
                  {view.label}
                  {count > 0 && (
                    <span className="ml-1.5 text-[10px] opacity-70">{count}</span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            {pendingReacties > 0 && (
              <Link
                href="/dashboard/werkposts/samenwerkingen"
                className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-300"
              >
                <Handshake size={12} />
                {pendingReacties} reactie{pendingReacties > 1 ? "s" : ""}
              </Link>
            )}
            <Link
              href="/bouwnetwerk"
              className="text-xs font-medium text-zinc-500 hover:text-zinc-300"
            >
              Publieke feed
            </Link>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {!companyId && !preview ? (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-300">
              Je account is nog niet gekoppeld aan een bedrijf. Rond eerst je
              bedrijfsprofiel af op de{" "}
              <Link href="/bouwnetwerk" className="font-medium underline">
                Bouwnetwerk-pagina
              </Link>
              .
            </div>
          ) : activeView === "chat" && companyId ? (
            <ChatClient
              channels={channels}
              companyId={companyId}
              selectedId={selectedChannelId}
              onSelectChannel={setSelectedChannelId}
              showChannelList={false}
            />
          ) : activeView === "chat" ? (
            <div className="grid min-h-[480px] place-items-center rounded-2xl border border-white/10 bg-zinc-900/50 px-6 text-center">
              <MessageCircle size={32} className="text-sky-400" />
              <p className="mt-3 text-sm text-zinc-500">
                Log in met een bedrijfsprofiel om te chatten
              </p>
            </div>
          ) : activeView === "werkposts" ? (
            <BouwnetwerkWerkpostsView posts={posts as WerkpostRow[]} preview={preview} />
          ) : (
            <BouwnetwerkHulpverzoekenView
              own={hulpverzoeken}
              network={openHulpverzoeken}
            />
          )}
        </div>
      </div>
    </div>
  );
}
