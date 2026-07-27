"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, Shield } from "lucide-react";
import { adminNavGroups } from "@/components/dashboard/admin/admin-nav";
import { cn } from "@/components/ui/utils";

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-full flex-col rounded-2xl border border-white/10 bg-zinc-950/80 p-3 backdrop-blur lg:p-4">
      <div className="mb-3 flex items-start justify-between gap-3 px-2 lg:mb-6 lg:block">
        <div className="flex items-center gap-2 text-sky-400">
          <Shield size={18} aria-hidden="true" />
          <span className="text-xs font-semibold uppercase tracking-[0.14em]">
            CEO Console
          </span>
        </div>
        <p className="mt-2 hidden text-sm text-zinc-400 lg:block">
          Platformbeheer voor bedrijven, AI, toezicht en analyse.
        </p>
      </div>

      <nav
        aria-label="Platformbeheer"
        className="flex gap-3 overflow-x-auto pb-1 lg:block lg:space-y-5 lg:overflow-visible lg:pb-0"
      >
        {adminNavGroups.map((group) => (
          <div key={group.label} className="shrink-0">
            <p className="mb-1 hidden px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-600 lg:block">
              {group.label}
            </p>
            <div className="flex gap-2 lg:block lg:space-y-1">
              {group.items.map((item) => {
                const active =
                  "exact" in item && item.exact
                    ? pathname === item.href
                    : pathname.startsWith(item.href);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-sm transition-colors lg:gap-3",
                      active
                        ? "bg-sky-500/15 text-sky-200"
                        : "text-zinc-400 hover:bg-white/5 hover:text-zinc-100",
                    )}
                  >
                    <Icon size={16} aria-hidden="true" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="mt-3 border-t border-white/10 pt-3 lg:mt-auto lg:pt-4">
        <Link
          href="/dashboard/command-center"
          className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-zinc-500 transition-colors hover:bg-white/5 hover:text-zinc-200 lg:py-2.5"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Terug naar Archon
        </Link>
      </div>
    </aside>
  );
}
