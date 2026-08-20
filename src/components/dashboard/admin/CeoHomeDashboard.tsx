"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Building2,
  Users,
  UserPlus,
  Zap,
  DollarSign,
  CheckSquare,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DemoBadge } from "@/components/dashboard/mission";
import type { CeoDashboardData } from "@/components/dashboard/admin/ceo-demo-data";
import { formatRelative } from "@/components/dashboard/admin/ceo-demo-data";
import { cn } from "@/components/ui/utils";

// Import modular subcomponents
import AdminActionBar from "@/components/dashboard/admin/AdminActionBar";
import OverviewKpiCard from "@/components/dashboard/admin/OverviewKpiCard";
import AttentionRequiredCard from "@/components/dashboard/admin/AttentionRequiredCard";
import RevenueOverviewCard from "@/components/dashboard/admin/RevenueOverviewCard";
import PlatformHealthCard from "@/components/dashboard/admin/PlatformHealthCard";
import AiUsageSummary from "@/components/dashboard/admin/AiUsageSummary";
import TopCompaniesCard from "@/components/dashboard/admin/TopCompaniesCard";
import AgentPerformanceCard from "@/components/dashboard/admin/AgentPerformanceCard";
import RecentActivityFeed from "@/components/dashboard/admin/RecentActivityFeed";

type ViewType = "command-center" | "opvolging" | "financien" | "projecten" | "ai-crew";

export default function CeoHomeDashboard({
  data,
  live = false,
}: {
  data: CeoDashboardData;
  live?: boolean;
}) {
  const [activeView, setActiveView] = useState<ViewType>("command-center");

  // Keyboard navigation shortcuts (1, 2, 3, 4, 5)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA" ||
        document.activeElement?.getAttribute("contenteditable") === "true"
      ) {
        return;
      }

      if (e.key === "1") {
        setActiveView("command-center");
      } else if (e.key === "2") {
        setActiveView("opvolging");
      } else if (e.key === "3") {
        setActiveView("financien");
      } else if (e.key === "4") {
        setActiveView("projecten");
      } else if (e.key === "5") {
        setActiveView("ai-crew");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // KPI Extractors
  const getKpi = (id: string) => data.kpis.find((k) => k.id === id);

  const mrrKpi = getKpi("mrr");
  const companiesKpi = getKpi("companies");
  const usersKpi = getKpi("users");
  const registrationsKpi = getKpi("registrations");

  const aiRequestsKpi = getKpi("ai-requests");
  const aiCostKpi = getKpi("ai-cost");
  const approvalsKpi = getKpi("subscriptions");
  const alertsKpi = getKpi("alerts");

  // Tab configurations matching user screenshot layout
  const viewsConfig = [
    {
      id: "command-center" as const,
      label: "Command Center",
      shortcut: "1",
      badge: undefined,
    },
    {
      id: "opvolging" as const,
      label: "Opvolging",
      shortcut: "2",
      badge: 3, // Highlight open action items (open goedkeuringen)
    },
    {
      id: "financien" as const,
      label: "Financiën",
      shortcut: "3",
      badge: undefined,
    },
    {
      id: "projecten" as const,
      label: "Projecten",
      shortcut: "4",
      badge: undefined,
    },
    {
      id: "ai-crew" as const,
      label: "AI Crew",
      shortcut: "5",
      badge: 1, // Highlight AI issues (AI fouten)
    },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Bovenste actiebalk */}
      <AdminActionBar />

      {/* Slide / View Switcher (Weergave Bar) */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-white/[0.06] bg-[#0D0E11] px-4 py-3">
        {/* Label + Tab group */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 shrink-0">
            Weergave
          </span>
          {/* Visual separator */}
          <span className="hidden h-4 w-px bg-zinc-800 sm:block" />
          <div className="flex flex-wrap gap-1.5">
            {viewsConfig.map((v) => {
              const isActive = activeView === v.id;
              return (
                <button
                  key={v.id}
                  onClick={() => setActiveView(v.id)}
                  className={cn(
                    "relative inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-semibold transition-all duration-150 select-none",
                    isActive
                      ? "border-[#21B7E8]/60 bg-[#21B7E8]/[0.12] text-[#21B7E8] shadow-[0_0_18px_rgba(33,183,232,0.12)]"
                      : "border-zinc-700/60 bg-zinc-800/60 text-zinc-400 hover:border-zinc-600 hover:bg-zinc-700/60 hover:text-zinc-200"
                  )}
                >
                  <span>{v.label}</span>
                  <span className={cn(
                    "rounded px-1.5 py-0.5 font-mono text-[9px] leading-none",
                    isActive ? "bg-[#21B7E8]/20 text-[#21B7E8]" : "bg-zinc-900 text-zinc-600"
                  )}>
                    ⌘{v.shortcut}
                  </span>
                  {v.badge && (
                    <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#F05268] px-1 text-[9px] font-bold text-white leading-none">
                      {v.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sync Status */}
        <div className="flex items-center gap-2.5 shrink-0">
          <span className="hidden text-[10px] font-mono text-zinc-600 sm:inline">
            Sync: {formatRelative(data.syncedAt)}
          </span>
          <button
            onClick={() => window.location.reload()}
            title="Herladen"
            className="inline-flex items-center justify-center rounded-lg border border-zinc-700/60 bg-zinc-800/60 p-2 text-zinc-400 transition-all hover:border-zinc-600 hover:bg-zinc-700/60 hover:text-zinc-200"
          >
            <RefreshCw size={12} />
          </button>
        </div>
      </div>

      {/* ==================== SLIDE 1: COMMAND CENTER ==================== */}
      {activeView === "command-center" && (
        <div className="space-y-6">
          {/* Header */}
          <header className="relative overflow-hidden rounded-3xl border border-white/5 bg-[#252329] px-6 py-6 sm:px-8">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-sky-500/10 blur-3xl"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-28 left-1/4 h-56 w-56 rounded-full bg-violet-500/5 blur-3xl"
            />
            <div className="relative flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                  Platform Command Center
                </p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-50 sm:text-3xl">
                  CEO Dashboard
                </h1>
                <p className="mt-2 max-w-2xl text-xs sm:text-sm leading-relaxed text-zinc-400">
                  Intern overzicht voor ArchonPro — MRR, groei, AI-verbruik en platformgezondheid in één view.
                </p>
                <p className="mt-2 text-xs font-semibold text-[#20D58A] flex items-center gap-1">
                  <span>+8,4% groei ten opzichte van vorige periode</span>
                </p>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <div className="flex items-center gap-2">
                  {live ? (
                    <Badge variant="warning" className="px-2.5 py-0.5 text-[10px] font-semibold">
                      Gedeeltelijk live
                    </Badge>
                  ) : (
                    <DemoBadge />
                  )}
                  <div className="flex items-center gap-1 rounded-full bg-[#20D58A]/10 border border-[#20D58A]/20 px-2 py-0.5 text-[10px] text-[#20D58A] font-medium">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#20D58A]" />
                    <span>Sync OK</span>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Primary Business KPIs */}
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <OverviewKpiCard
              title="Geschatte MRR"
              value={mrrKpi?.value ?? "€2.254"}
              change="+4,8% versus vorige maand"
              positive={true}
              icon={<DollarSign size={18} />}
              tone="sky"
              href="/admin/companies"
              subtitle="Klik opent financiën"
            />
            <OverviewKpiCard
              title="Actieve bedrijven"
              value={companiesKpi?.value ?? "46"}
              change="+4 deze maand"
              positive={true}
              icon={<Building2 size={18} />}
              tone="emerald"
              href="/admin/companies"
              subtitle="Klik opent bedrijven"
            />
            <OverviewKpiCard
              title="Actieve gebruikers"
              value={usersKpi?.value ?? "19"}
              change="16 actief in laatste 7 dagen"
              positive={true}
              icon={<Users size={18} />}
              tone="violet"
              href="/admin/crm"
              subtitle="Klik opent gebruikers"
            />
            <OverviewKpiCard
              title="Nieuwe accounts"
              value={registrationsKpi?.value ?? "4"}
              change="laatste 30 dagen"
              positive={true}
              icon={<UserPlus size={18} />}
              tone="amber"
              href="/admin/crm"
              subtitle="Klik opent recente registraties"
            />
          </section>

          {/* Operational KPIs */}
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <OverviewKpiCard
              title="AI-credits gebruikt"
              value={aiRequestsKpi?.value ?? "0"}
              change={aiRequestsKpi?.change ?? "totaal platform"}
              positive={true}
              icon={<Zap size={18} />}
              tone="cyan"
              href="/admin/ai-tokens"
            />
            <OverviewKpiCard
              title="AI-kosten"
              value={aiCostKpi?.value ?? "€0"}
              change={aiCostKpi?.change ?? "inference + tokens"}
              positive={true}
              icon={<Zap size={18} />}
              tone="sky"
              href="/admin/ai-tokens"
            />
            <OverviewKpiCard
              title="Open goedkeuringen"
              value={approvalsKpi?.value ?? "3"}
              change="3 urgent"
              positive={false}
              icon={<CheckSquare size={18} />}
              tone="violet"
              href="/admin/goedkeuringen"
            />
            <OverviewKpiCard
              title="AI-fouten"
              value={alertsKpi?.value ?? "1"}
              change="1 fout in laatste 24 uur"
              positive={false}
              icon={<AlertTriangle size={18} />}
              tone="rose"
              href="/admin/ai-agents"
            />
          </section>
        </div>
      )}

      {/* ==================== SLIDE 2: OPVOLGING (Attention & Registrations) ==================== */}
      {activeView === "opvolging" && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          <div className="xl:col-span-6">
            <AttentionRequiredCard
              openApprovalsCount={Number(approvalsKpi?.value ?? 3)}
              aiErrorsCount={Number(alertsKpi?.value ?? 1)}
              supportTicketsCount={data.supportTickets?.length ?? 2}
              failedPaymentsCount={data.payments?.filter((p) => p.status === "failed").length ?? 1}
            />
          </div>
          <div className="xl:col-span-6">
            <RecentRegistrationsCard registrations={data.registrations} />
          </div>
        </div>
      )}

      {/* ==================== SLIDE 3: FINANCIËN (Revenue Chart Card) ==================== */}
      {activeView === "financien" && (
        <div className="w-full">
          <RevenueOverviewCard data={data.revenueChart} revenueSource={data.revenueSource} />
        </div>
      )}

      {/* ==================== SLIDE 4: PROJECTEN (Health & Usage cards) ==================== */}
      {activeView === "projecten" && (
        <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
          <PlatformHealthCard systemStatus={data.systemStatus} />
          
          <AiUsageSummary
            tokensUsedTotal={aiRequestsKpi?.value ?? "0"}
            aiCostTotal={aiCostKpi?.value ?? "€0"}
          />
          
          <TopCompaniesCard companies={data.companies} />
          
          <AgentPerformanceCard activeAgentsCount={4} />
        </section>
      )}

      {/* ==================== SLIDE 5: AI CREW (Activity Feed) ==================== */}
      {activeView === "ai-crew" && (
        <div className="w-full">
          <RecentActivityFeed />
        </div>
      )}
    </div>
  );
}

// ==================== IN-FILE SUB-COMPONENTS ====================

function RecentRegistrationsCard({ registrations }: { registrations: CeoDashboardData["registrations"] }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-[#252329] shadow-sm">
      <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-white/[0.03]">
            <UserPlus size={14} className="text-[#21B7E8]" />
          </span>
          <h3 className="text-xs font-semibold text-zinc-100">Recente registraties</h3>
        </div>
        <Link href="/admin/crm" className="text-[10px] font-semibold text-[#21B7E8] hover:underline">
          Bekijk alle
        </Link>
      </div>
      
      <div className="p-0">
        <ul className="divide-y divide-white/5">
          {registrations.map((r, i) => {
            const statuses = ["Nieuw", "Onboarding", "Actief", "Geblokkeerd"] as const;
            const status = statuses[i % statuses.length];
            const statusStyles = {
              Nieuw: "bg-[#21B7E8]/10 text-[#21B7E8] border-[#21B7E8]/20",
              Onboarding: "bg-[#a78bfa]/10 text-[#a78bfa] border-[#a78bfa]/20",
              Actief: "bg-[#20D58A]/10 text-[#20D58A] border-[#20D58A]/20",
              Geblokkeerd: "bg-[#F05268]/10 text-[#F05268] border-[#F05268]/20",
            };

            return (
              <li key={r.id} className="p-4 flex flex-col gap-1 hover:bg-white/[0.01] transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-200 truncate">{r.company}</span>
                  <span className={`border px-1.5 py-0.5 rounded text-[9px] font-semibold ${statusStyles[status]}`}>
                    {status}
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-[10px] text-zinc-500 mt-1">
                  <span>{r.contact}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 rounded bg-zinc-900 border border-white/5 text-zinc-400">
                      {r.plan}
                    </span>
                    <span className="font-mono">{new Date(r.time).toLocaleDateString("nl-BE")}</span>
                  </div>
                </div>
              </li>
            );
          })}
          
          {registrations.length === 0 && (
            <li className="py-6 text-center text-xs text-zinc-500">
              Geen recente registraties gevonden.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
