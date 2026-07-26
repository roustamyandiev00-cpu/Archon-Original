"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, Shield, ChevronDown } from "lucide-react";
import { adminNavSections } from "@/components/dashboard/admin/admin-nav";
import { cn } from "@/components/ui/utils";

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-[calc(100vh-3rem)] w-full flex-col rounded-2xl border border-white/10 bg-[#0B0C0F] p-4">
      {/* Brand Block */}
      <div className="mb-6 px-2">
        <div className="flex items-center gap-2 text-[#21B7E8]">
          <Shield size={18} />
          <span className="text-xs font-semibold uppercase tracking-[0.14em]">
            CEO Console
          </span>
        </div>
        <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
          Platform-breed beheer voor klanten, CRM en AI-agents.
        </p>
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin scrollbar-thumb-white/5 scrollbar-track-transparent">
        {adminNavSections.map((section) => (
          <div key={section.title} className="space-y-1">
            <h3 className="px-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              {section.title}
            </h3>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const active =
                  "exact" in item && item.exact
                    ? pathname === item.href
                    : pathname.startsWith(item.href);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-all duration-200",
                      active
                        ? "bg-[#21B7E8]/15 text-[#21B7E8] font-medium"
                        : "text-zinc-400 hover:bg-white/5 hover:text-zinc-100"
                    )}
                  >
                    {active && (
                      <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-[#21B7E8]" />
                    )}
                    <Icon
                      size={16}
                      className={cn("shrink-0", active ? "text-[#21B7E8]" : "text-zinc-400")}
                    />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
            {/* Subtiele separator tussen secties */}
            <div className="h-px bg-white/5 my-2 mx-3 last:hidden" />
          </div>
        ))}
      </nav>

      {/* Footer & Admin Profile */}
      <div className="mt-auto space-y-3 pt-4 border-t border-white/10">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-zinc-500 transition-colors hover:bg-white/5 hover:text-zinc-200"
        >
          <ArrowLeft size={14} />
          Naar ArchonPro-website
        </Link>

        {/* Compact Admin Profile Zone */}
        <div className="flex items-center gap-3 rounded-xl p-2 bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors cursor-pointer">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-500/10 text-violet-400 font-semibold text-xs border border-violet-500/20">
            AD
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-zinc-200">Alex Admin</p>
            <p className="truncate text-[10px] text-zinc-500 font-medium">Platform Admin</p>
          </div>
          <ChevronDown size={14} className="text-zinc-500 shrink-0" />
        </div>
      </div>
    </aside>
  );
}
