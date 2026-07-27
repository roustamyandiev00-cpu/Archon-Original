"use client";

import { usePathname } from "next/navigation";
import { Search, Bell, HelpCircle, Server, Settings } from "lucide-react";

export default function AdminTopbar() {
  const pathname = usePathname();

  const getBreadcrumbLabel = (path: string) => {
    if (path === "/admin") return "Overzicht";
    if (path.startsWith("/admin/companies")) return "Bedrijven";
    if (path.startsWith("/admin/crm")) return "Gebruikers";
    if (path.startsWith("/admin/rapportages")) return "Rapportages";
    if (path.startsWith("/admin/geschillen")) return "Geschillen";
    if (path.startsWith("/admin/ai-agents")) return "AI Agents";
    if (path.startsWith("/admin/ai-tokens")) return "AI Tokens";
    if (path.startsWith("/admin/proactive")) return "Proactief";
    return "Overzicht";
  };

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-white/5 pb-4 mb-6">
      {/* Left side: Breadcrumb & Search */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-500">
          <span>Admin</span>
          <span>/</span>
          <span className="text-[#21B7E8] font-semibold">
            {getBreadcrumbLabel(pathname)}
          </span>
        </div>

        {/* Search Field */}
        <div className="relative w-full max-w-xs sm:w-64">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Zoek bedrijven, gebruikers of agents..."
            className="w-full rounded-xl border border-white/10 bg-zinc-900/50 py-1.5 pl-9 pr-12 text-xs text-zinc-200 placeholder-zinc-500 outline-none transition-colors focus:border-[#21B7E8]/50 focus:bg-zinc-900"
          />
          <kbd className="absolute right-2 top-1/2 -translate-y-1/2 hidden sm:inline-flex h-5 select-none items-center gap-0.5 rounded border border-white/10 bg-zinc-800 px-1.5 font-mono text-[9px] font-medium text-zinc-500 opacity-100">
            <span>⌘</span>K
          </kbd>
        </div>
      </div>

      {/* Right side: Status indicator & Actions */}
      <div className="flex items-center justify-between gap-4 md:justify-end">
        {/* Status Indicator */}
        <div className="flex items-center gap-1.5 rounded-full border border-[#20D58A]/10 bg-[#20D58A]/5 px-2.5 py-1 text-xs text-[#20D58A] font-medium">
          <span className="h-1.5 w-1.5 rounded-full bg-[#20D58A] animate-pulse" />
          <span>Systemen operationeel</span>
        </div>

        {/* Icon Buttons */}
        <div className="flex items-center gap-1">
          <button
            aria-label="Systeemstatus"
            className="rounded-xl p-2 text-zinc-400 hover:bg-white/5 hover:text-zinc-200 transition-colors focus:outline-none focus:ring-1 focus:ring-[#21B7E8]"
          >
            <Server size={16} />
          </button>
          <button
            aria-label="Help"
            className="rounded-xl p-2 text-zinc-400 hover:bg-white/5 hover:text-zinc-200 transition-colors focus:outline-none focus:ring-1 focus:ring-[#21B7E8]"
          >
            <HelpCircle size={16} />
          </button>
          <button
            aria-label="Meldingen"
            className="relative rounded-xl p-2 text-zinc-400 hover:bg-white/5 hover:text-zinc-200 transition-colors focus:outline-none focus:ring-1 focus:ring-[#21B7E8]"
          >
            <Bell size={16} />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#F05268]" />
          </button>
          <button
            aria-label="Instellingen"
            className="rounded-xl p-2 text-zinc-400 hover:bg-white/5 hover:text-zinc-200 transition-colors focus:outline-none focus:ring-1 focus:ring-[#21B7E8]"
          >
            <Settings size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
