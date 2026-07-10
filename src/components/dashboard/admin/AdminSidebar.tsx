"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, Shield } from "lucide-react";
import { adminNavItems } from "@/components/dashboard/admin/admin-nav";
import { cn } from "@/components/dashboard/admin/ui/utils";

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-full flex-col rounded-2xl border border-white/10 bg-zinc-950/80 p-4 backdrop-blur">
      <div className="mb-6 px-2">
        <div className="flex items-center gap-2 text-sky-400">
          <Shield size={18} />
          <span className="text-xs font-semibold uppercase tracking-[0.14em]">
            CEO Console
          </span>
        </div>
        <p className="mt-2 text-sm text-zinc-400">
          Platform-breed beheer voor klanten, CRM en AI-agents.
        </p>
      </div>

      <nav className="space-y-1">
        {adminNavItems.map((item) => {
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
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                active
                  ? "bg-sky-500/15 text-sky-200"
                  : "text-zinc-400 hover:bg-white/5 hover:text-zinc-100",
              )}
            >
              <Icon size={16} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-white/10 pt-4">
        <Link
          href="/dashboard/command-center"
          className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-zinc-500 transition-colors hover:bg-white/5 hover:text-zinc-200"
        >
          <ArrowLeft size={16} />
          Terug naar Archon
        </Link>
      </div>
    </aside>
  );
}
