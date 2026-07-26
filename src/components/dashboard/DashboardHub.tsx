"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
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

import type { CustomAgent } from "@/components/dashboard/agents/config";

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
    label: "AI-agents",
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
  crewPanel?: "agents" | "knowledge" | null;
  companyAgents?: CustomAgent[];
};

export default function DashboardHub({
  mission,
  agentName,
  charts,
  defaultView = "command",
  crewPanel = null,
  companyAgents = [],
}: DashboardHubProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [activeView, setActiveView] = useState<DashboardViewId>(() =>
    defaultView !== "command" ? defaultView : readStoredView(defaultView),
  );
  const [prevDefaultView, setPrevDefaultView] = useState(defaultView);
  if (prevDefaultView !== defaultView) {
    setPrevDefaultView(defaultView);
    setActiveView(defaultView !== "command" ? defaultView : readStoredView(defaultView));
  }
  const [lastUpdated, setLastUpdated] = useState(() => new Date());
  const [updatedLabel, setUpdatedLabel] = useState("zojuist bijgewerkt");

  useEffect(() => {
    const tick = () => setUpdatedLabel(formatLastUpdated(lastUpdated));
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, [lastUpdated]);

  const selectView = useCallback(
    (id: DashboardViewId) => {
      setActiveView(id);
      localStorage.setItem(STORAGE_KEY, id);
      if (pathname === "/dashboard/command-center") {
        const params = new URLSearchParams();
        if (id !== "command") params.set("view", id);
        const qs = params.toString();
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      }
    },
    [pathname, router],
  );

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
    <div className="dashboard-hub dashboard-page flex h-full min-h-0 flex-1 flex-col space-y-3 lg:space-y-0">
      <header
        data-tour="dash-views"
        className="dashboard-hub-header shrink-0 rounded-xl border border-white/[0.08] bg-zinc-900/80 px-3 py-2.5 sm:px-4"
      >
        <div className="flex flex-wrap items-center gap-3">
          <p className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
            Weergave
          </p>

          <div className="min-w-0 flex-1 rounded-2xl border border-white/[0.08] bg-zinc-950/50 p-1">
            <div className="flex gap-1 overflow-x-auto [scrollbar-width:thin]">
              {VIEWS.map((view) => {
                const count = badges[view.id];
                const active = activeView === view.id;
                const Icon = view.icon;

                return (
                  <button
                    key={view.id}
                    type="button"
                    onClick={() => selectView(view.id)}
                    className={`relative flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200 sm:px-3.5 ${
                      active
                        ? "border border-orange-500/55 bg-orange-500/[0.05] text-orange-300"
                        : "border border-transparent text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200"
                    }`}
                  >
                    {active && (
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-orange-400" />
                    )}
                    <Icon
                      size={15}
                      className={active ? "text-orange-400" : "text-zinc-500"}
                    />
                    <span>{view.label}</span>
                    <span
                      className={`text-[10px] tabular-nums ${
                        active ? "text-orange-400/45" : "text-zinc-600"
                      }`}
                    >
                      {view.shortcut}
                    </span>
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
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-2">
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
      </header>

      {activeView === "command" && (
        <div className="dashboard-hub-view min-h-0 flex-1 overflow-y-auto lg:overflow-hidden">
          <CommandCenterView mission={mission} agentName={agentName} />
        </div>
      )}
      {activeView === "opvolging" && (
        <div className="dashboard-hub-view overflow-y-auto lg:overflow-hidden">
          <OpvolgingView mission={mission} agentName={agentName} />
        </div>
      )}
      {activeView === "financien" && (
        <div className="dashboard-hub-view overflow-y-auto lg:overflow-hidden">
          <FinancienView mission={mission} charts={charts} />
        </div>
      )}
      {activeView === "projecten" && (
        <div className="dashboard-hub-view overflow-y-auto lg:overflow-hidden">
          <ProjectenView mission={mission} />
        </div>
      )}
      {activeView === "crew" && (
        <div className="dashboard-hub-view overflow-hidden">
          <AiCrewView
            mission={mission}
            companyAgents={companyAgents}
            initialPanel={crewPanel}
          />
        </div>
      )}
    </div>
  );
}
