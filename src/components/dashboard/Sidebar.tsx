"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  Gauge,
  Users,
  FileText,
  Receipt,
  Contact,
  Zap,
  Bot,
  MessageCircle,
  BarChart3,
  LineChart,
  List,
  Settings,
  LogOut,
  BrainCircuit,
  Search,
  Clock,
  Rocket,
  HardHat,
  type LucideIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Item = {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
  badgeTone?: "info" | "warning";
};

const groups: { title: string; items: Item[] }[] = [
  {
    title: "Overzicht",
    items: [{ label: "Overzicht", href: "/dashboard", icon: Gauge }],
  },
  {
    title: "Operatie",
    items: [
      { label: "Contacten", href: "/dashboard/contacten", icon: Users },
      { label: "Offertes", href: "/dashboard/offertes", icon: FileText },
      { label: "Facturen", href: "/dashboard/facturen", icon: Receipt, badge: 3, badgeTone: "warning" },
      { label: "Leads / CRM", href: "/dashboard/leads", icon: Contact, badge: 5, badgeTone: "info" },
      { label: "Automatisaties", href: "/dashboard/automatisaties", icon: Zap },
      { label: "Bouwnetwerk", href: "/dashboard/werkposts", icon: HardHat },
    ],
  },
  {
    title: "AI",
    items: [
      { label: "Nova-agents", href: "/dashboard/nova-agents", icon: Bot },
      { label: "Comms", href: "/dashboard/comms", icon: MessageCircle },
      { label: "Geheugen", href: "/dashboard/geheugen", icon: BrainCircuit },
    ],
  },
  {
    title: "Observeer",
    items: [
      { label: "Onderzoek", href: "/dashboard/onderzoek", icon: Search },
      { label: "KPI's", href: "/dashboard/kpi", icon: BarChart3 },
      { label: "Analytics", href: "/dashboard/analytics", icon: LineChart },
      { label: "Activiteit", href: "/dashboard/activiteit", icon: List },
    ],
  },
  {
    title: "Systeem",
    items: [
      { label: "Cron", href: "/dashboard/cron", icon: Clock },
      { label: "Deploy", href: "/dashboard/deploy", icon: Rocket },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[220px] flex-col border-r border-white/10 bg-zinc-900/80 backdrop-blur-xl lg:flex">
      <div className="flex h-14 items-center gap-2.5 px-4">
        <Image
          src="/logo-tile.png"
          alt="ArchonPro logo"
          width={40}
          height={40}
          className="h-10 w-10 rounded-lg"
        />
        <div className="leading-tight">
          <p className="text-sm font-semibold text-zinc-50">ArchonPro</p>
          <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
            Mission view
          </p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-3">
        {groups.map((group) => (
          <div key={group.title} className="mb-5">
            <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
              {group.title}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors ${
                      active
                        ? "bg-sky-500/14 text-sky-300"
                        : "text-zinc-400 hover:bg-white/5 hover:text-zinc-100"
                    }`}
                  >
                    {active && (
                      <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-sky-400" />
                    )}
                    <item.icon size={16} className="shrink-0" />
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.badge != null && (
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums ${
                          item.badgeTone === "info"
                            ? "bg-sky-500/15 text-sky-400"
                            : item.badgeTone === "warning"
                              ? "bg-amber-500/15 text-amber-400"
                              : "bg-white/8 text-zinc-400"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="space-y-0.5 border-t border-white/10 p-3">
        <Link
          href="/dashboard/instellingen"
          className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors ${
            pathname === "/dashboard/instellingen"
              ? "bg-sky-500/14 text-sky-300"
              : "text-zinc-400 hover:bg-white/5 hover:text-zinc-100"
          }`}
        >
          <Settings size={16} />
          Instellingen
        </Link>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-zinc-400 transition-colors hover:bg-white/5 hover:text-rose-400"
        >
          <LogOut size={16} />
          Uitloggen
        </button>
      </div>
    </aside>
  );
}
