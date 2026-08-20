"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  ChevronDown,
  RefreshCw,
  Download,
  Calendar,
  Zap,
  UserPlus,
  FileText,
  BarChart2,
  Share2,
  Bell,
} from "lucide-react";

export default function AdminActionBar() {
  const router = useRouter();

  const [showReportDropdown, setShowReportDropdown] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [selectedDateFilter, setSelectedDateFilter] = useState("Laatste 30 dagen");

  const handleReportClick = (reportType: string) => {
    setShowReportDropdown(false);
    alert(`Rapport genereren: ${reportType} (TODO)`);
  };

  const handleExportClick = (format: string) => {
    setShowExportDropdown(false);
    alert(`Exporteren naar ${format} gestart (TODO)`);
  };

  const handleQuickActionClick = (actionName: string, route?: string) => {
    setShowQuickActions(false);
    if (route) {
      router.push(route);
    } else {
      alert(`Snelactie: ${actionName} (TODO)`);
    }
  };

  const handleRefresh = () => {
    router.refresh();
  };

  // Shared button styles
  const secondaryBtn =
    "inline-flex items-center gap-1.5 rounded-lg border border-zinc-700/70 bg-zinc-800/80 px-3 py-2 text-xs font-medium text-zinc-200 transition-all hover:border-zinc-600 hover:bg-zinc-700/80 hover:text-white focus:outline-none focus:ring-2 focus:ring-[#21B7E8]/40 active:scale-[0.97] select-none whitespace-nowrap";

  const iconBtn =
    "inline-flex items-center justify-center rounded-lg border border-zinc-700/70 bg-zinc-800/80 p-2 text-zinc-400 transition-all hover:border-zinc-600 hover:bg-zinc-700/80 hover:text-white focus:outline-none focus:ring-2 focus:ring-[#21B7E8]/40 active:scale-[0.97]";

  const accentBtn =
    "inline-flex items-center gap-1.5 rounded-lg border border-[#21B7E8]/30 bg-[#21B7E8]/10 px-3 py-2 text-xs font-semibold text-[#21B7E8] transition-all hover:bg-[#21B7E8]/20 hover:border-[#21B7E8]/50 focus:outline-none focus:ring-2 focus:ring-[#21B7E8]/40 active:scale-[0.97] select-none whitespace-nowrap";

  const primaryBtn =
    "inline-flex items-center gap-1.5 rounded-lg bg-[#21B7E8] px-4 py-2 text-xs font-bold text-zinc-950 transition-all hover:bg-[#1fa5d2] active:scale-[0.97] focus:outline-none focus:ring-2 focus:ring-[#21B7E8]/50 select-none whitespace-nowrap shadow-[0_0_16px_rgba(33,183,232,0.25)]";

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between rounded-xl border border-white/[0.06] bg-[#0D0E11] px-4 py-3">
      {/* LEFT: Filters + Tools */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Date Filter */}
        <div className="relative">
          <button
            onClick={() => setShowDateDropdown(!showDateDropdown)}
            onBlur={() => setTimeout(() => setShowDateDropdown(false), 200)}
            className={secondaryBtn}
          >
            <Calendar size={13} className="text-zinc-400 shrink-0" />
            <span>{selectedDateFilter}</span>
            <ChevronDown size={11} className="text-zinc-500 shrink-0" />
          </button>
          {showDateDropdown && (
            <div className="absolute left-0 top-full mt-1.5 z-50 min-w-[160px] rounded-xl border border-white/10 bg-zinc-950 p-1 shadow-2xl">
              {["Vandaag", "Laatste 7 dagen", "Laatste 30 dagen", "Laatste 90 dagen", "Dit jaar"].map((option) => (
                <button
                  key={option}
                  onClick={() => { setSelectedDateFilter(option); setShowDateDropdown(false); }}
                  className="w-full rounded-lg px-3 py-1.5 text-left text-xs text-zinc-400 hover:bg-white/5 hover:text-zinc-100 transition-colors"
                >
                  {option}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Refresh */}
        <button onClick={handleRefresh} title="Verversen" className={iconBtn}>
          <RefreshCw size={13} />
        </button>

        {/* Divider */}
        <span className="hidden h-5 w-px bg-zinc-700/60 sm:block" />

        {/* Export */}
        <div className="relative">
          <button
            onClick={() => setShowExportDropdown(!showExportDropdown)}
            onBlur={() => setTimeout(() => setShowExportDropdown(false), 200)}
            className={secondaryBtn}
          >
            <Download size={13} className="text-zinc-400 shrink-0" />
            <span>Exporteren</span>
            <ChevronDown size={11} className="text-zinc-500 shrink-0" />
          </button>
          {showExportDropdown && (
            <div className="absolute left-0 top-full mt-1.5 z-50 min-w-[160px] rounded-xl border border-white/10 bg-zinc-950 p-1 shadow-2xl">
              <button onClick={() => handleExportClick("CSV")} className="w-full rounded-lg px-3 py-1.5 text-left text-xs text-zinc-400 hover:bg-white/5 hover:text-zinc-100 transition-colors">
                Exporteren als CSV
              </button>
              <button onClick={() => handleExportClick("PDF")} className="w-full rounded-lg px-3 py-1.5 text-left text-xs text-zinc-400 hover:bg-white/5 hover:text-zinc-100 transition-colors">
                Exporteren als PDF
              </button>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="relative">
          <button
            onClick={() => setShowQuickActions(!showQuickActions)}
            onBlur={() => setTimeout(() => setShowQuickActions(false), 200)}
            className={accentBtn}
          >
            <Zap size={13} className="shrink-0" />
            <span>Snelle Acties</span>
            <ChevronDown size={11} className="shrink-0" />
          </button>
          {showQuickActions && (
            <div className="absolute left-0 top-full mt-1.5 z-50 min-w-[210px] rounded-xl border border-white/10 bg-zinc-950 p-1 shadow-2xl">
              {[
                { icon: Plus, label: "Nieuw bedrijf", route: "/admin/companies" },
                { icon: UserPlus, label: "Gebruiker uitnodigen", route: "/admin/crm" },
                { icon: Zap, label: "AI-agent configureren", route: "/admin/ai-agents" },
                { icon: Share2, label: "Credits toewijzen", route: "/admin/ai-tokens" },
                { icon: FileText, label: "Supportticket openen", route: undefined },
                { icon: Bell, label: "Platformmelding sturen", route: undefined },
              ].map(({ icon: Icon, label, route }) => (
                <button
                  key={label}
                  onClick={() => handleQuickActionClick(label, route)}
                  className="w-full rounded-lg px-3 py-2 text-left text-xs text-zinc-300 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2.5"
                >
                  <Icon size={12} className="text-zinc-500 shrink-0" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: Action Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => router.push("/admin/crm")} className={secondaryBtn}>
          <UserPlus size={13} className="text-zinc-400 shrink-0" />
          <span>Gebruiker toevoegen</span>
        </button>

        <button onClick={() => router.push("/admin/ai-agents")} className={secondaryBtn}>
          <Zap size={13} className="text-zinc-400 shrink-0" />
          <span>AI-agent aanmaken</span>
        </button>

        <button onClick={() => alert("Platformmelding sturen (TODO)")} className={secondaryBtn}>
          <Bell size={13} className="text-zinc-400 shrink-0" />
          <span>Platformmelding sturen</span>
        </button>

        {/* Rapport genereren dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowReportDropdown(!showReportDropdown)}
            onBlur={() => setTimeout(() => setShowReportDropdown(false), 200)}
            className={secondaryBtn}
          >
            <BarChart2 size={13} className="text-zinc-400 shrink-0" />
            <span>Rapport genereren</span>
            <ChevronDown size={11} className="text-zinc-500 shrink-0" />
          </button>
          {showReportDropdown && (
            <div className="absolute right-0 top-full mt-1.5 z-50 min-w-[190px] rounded-xl border border-white/10 bg-zinc-950 p-1 shadow-2xl">
              {["Financieel rapport", "AI-verbruiksrapport", "Bedrijvenrapport", "Platformgezondheid"].map((r) => (
                <button
                  key={r}
                  onClick={() => handleReportClick(r)}
                  className="w-full rounded-lg px-3 py-1.5 text-left text-xs text-zinc-400 hover:bg-white/5 hover:text-zinc-100 transition-colors"
                >
                  {r}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Divider */}
        <span className="hidden h-5 w-px bg-zinc-700/60 sm:block" />

        {/* Primary CTA */}
        <button onClick={() => router.push("/admin/companies")} className={primaryBtn}>
          <Plus size={14} />
          <span>Nieuw bedrijf</span>
        </button>
      </div>
    </div>
  );
}
