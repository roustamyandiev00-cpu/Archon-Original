"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  Briefcase,
  Crosshair,
  RefreshCw,
  Settings,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import type { DashboardHomeProps } from "@/components/dashboard/DashboardHome";
import CommandCenterView from "@/components/dashboard/views/CommandCenterView";
import OpvolgingView from "@/components/dashboard/views/OpvolgingView";
import FinancienView from "@/components/dashboard/views/FinancienView";
import ProjectenView from "@/components/dashboard/views/ProjectenView";
import AiCrewView from "@/components/dashboard/views/AiCrewView";

const STORAGE_KEY = "archon-dashboard-view";

export type DashboardViewId =
  | "command"
  | "opvolging"
  | "financien"
  | "projecten"
  | "crew";

type ViewDef = {
  id: DashboardViewId;
  label: string;
  icon: LucideIcon;
  shortcut: string;
  badge: (mission: DashboardHomeProps["mission"]) => number;
};

const VIEWS: ViewDef[] = [
  {
    id: "command",
    label: "Command Center",
    icon: Crosshair,
    shortcut: "⌘1",
    badge: (m) => m.actionItems.length,
  },
  {
    id: "opvolging",
    label: "Opvolging",
    icon: Activity,
    shortcut: "⌘2",
    badge: (m) => m.tasks.length + m.important.length,
  },
  {
    id: "financien",
    label: "Financiën",
    icon: TrendingUp,
    shortcut: "⌘3",
    badge: (m) => m.overdueFacturenCount,
  },
  {
    id: "projecten",
    label: "Projecten",
    icon: Briefcase,
    shortcut: "⌘4",
    badge: (m) =>
      m.important.filter((t) => t.kind === "offerte").length +
      m.tasks.filter((t) => t.href.includes("project")).length,
  },
  {
    id: "crew",
    label: "AI Crew",
    icon: Users,
    shortcut: "⌘5",
    badge: (m) => m.agents.filter((a) => a.pending > 0).length,
  },
];

function readStoredView(fallback: DashboardViewId): DashboardViewId {
  if (typeof window === "undefined") return fallback;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && VIEWS.some((v) => v.id === stored)) {
    return stored as DashboardViewId;
  }
  return fallback;
}

function formatLastUpdated(date: Date) {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) {
    return `${Math.max(1, seconds)}s geleden bijgewerkt`;
  }
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes} min geleden bijgewerkt`;
  }
  const hours = Math.floor(minutes / 60);
  return `${hours} uur geleden bijgewerkt`;
}

type DashboardHubProps = DashboardHomeProps & {
  defaultView?: DashboardViewId;
};

export default function DashboardHub({
  mission,
  agentName,
  charts,
  defaultView = "command",
}: DashboardHubProps) {
  const [activeView, setActiveView] = useState<DashboardViewId>(defaultView);
  const [lastUpdated, setLastUpdated] = useState(() => new Date());
  const [updatedLabel, setUpdatedLabel] = useState("zojuist bijgewerkt");

  useEffect(() => {
    setActiveView(readStoredView(defaultView));
  }, [defaultView]);

  useEffect(() => {
    const tick = () => setUpdatedLabel(formatLastUpdated(lastUpdated));
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, [lastUpdated]);

  const selectView = useCallback((id: DashboardViewId) => {
    setActiveView(id);
    localStorage.setItem(STORAGE_KEY, id);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey)) return;
      const index = Number(event.key);
      if (index >= 1 && index <= VIEWS.length) {
        event.preventDefault();
        selectView(VIEWS[index - 1]!.id);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectView]);

  const badges = useMemo(
    () => Object.fromEntries(VIEWS.map((v) => [v.id, v.badge(mission)])),
    [mission],
  );

  const refresh = () => setLastUpdated(new Date());

  return (
    <div className="space-y-5">
      <header
        data-tour="dash-views"
        className="rounded-2xl border border-white/[0.08] bg-zinc-900/80 px-4 py-3.5 sm:px-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
            Weergave
          </p>
          <div className="flex items-center gap-2">
            <span className="hidden text-xs text-zinc-500 sm:inline">
              {updatedLabel}
            </span>
            <button
              type="button"
              onClick={refresh}
              className="grid h-8 w-8 place-items-center rounded-lg border border-white/[0.08] text-zinc-500 transition-colors hover:border-white/15 hover:bg-white/[0.04] hover:text-zinc-300"
              aria-label="Vernieuwen"
            >
              <RefreshCw size={14} />
            </button>
            <Link
              href="/dashboard/instellingen"
              className="grid h-8 w-8 place-items-center rounded-lg border border-white/[0.08] text-zinc-500 transition-colors hover:border-white/15 hover:bg-white/[0.04] hover:text-zinc-300"
              aria-label="Instellingen"
            >
              <Settings size={14} />
            </Link>
          </div>
        </div>

        <div className="mt-3 flex gap-1 overflow-x-auto border-b border-white/[0.06] pb-0 [scrollbar-width:thin]">
          {VIEWS.map((view) => {
            const count = badges[view.id];
            const active = activeView === view.id;
            const Icon = view.icon;

            return (
              <button
                key={view.id}
                type="button"
                onClick={() => selectView(view.id)}
                className={`relative flex shrink-0 items-center gap-2 border-b-2 px-3.5 py-2.5 text-sm font-medium transition-colors sm:px-4 ${
                  active
                    ? "-mb-px border-orange-500 text-orange-300"
                    : "border-transparent text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {active && (
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-orange-400" />
                )}
                <Icon
                  size={15}
                  className={active ? "text-orange-400" : "text-zinc-600"}
                />
                <span>{view.label}</span>
                {count > 0 && (
                  <span
                    className={`inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold ${
                      active
                        ? "bg-orange-500/25 text-orange-100"
                        : "bg-white/10 text-zinc-400"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </header>

      {activeView === "command" && (
        <CommandCenterView mission={mission} agentName={agentName} />
      )}
      {activeView === "opvolging" && (
        <OpvolgingView mission={mission} agentName={agentName} />
      )}
      {activeView === "financien" && (
        <FinancienView mission={mission} charts={charts} />
      )}
      {activeView === "projecten" && <ProjectenView mission={mission} />}
      {activeView === "crew" && <AiCrewView mission={mission} />}
    </div>
  );
}
