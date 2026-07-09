"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
  Handshake,
  Plug,
  ChevronDown,
  type LucideIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Item = {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
  badgeTone?: "info" | "warning";
  available?: boolean;
  children?: Item[];
};

type NavGroup = {
  title: string;
  items: Item[];
  collapsible?: boolean;
};

const groups: NavGroup[] = [
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
      {
        label: "Bouwnetwerk",
        href: "/dashboard/werkposts",
        icon: HardHat,
        children: [
          {
            label: "Samenwerkingen",
            href: "/dashboard/werkposts/samenwerkingen",
            icon: Handshake,
          },
        ],
      },
    ],
  },
  {
    title: "AI",
    items: [
      { label: "Nova-agents", href: "/dashboard/nova-agents", icon: Bot, available: false },
      { label: "Comms", href: "/dashboard/comms", icon: MessageCircle, available: false },
      { label: "Geheugen", href: "/dashboard/geheugen", icon: BrainCircuit, available: false },
    ],
  },
  {
    title: "Observeer",
    collapsible: true,
    items: [
      { label: "Onderzoek", href: "/dashboard/onderzoek", icon: Search, available: false },
      { label: "KPI's", href: "/dashboard/kpi", icon: BarChart3, available: false },
      { label: "Analytics", href: "/dashboard/analytics", icon: LineChart, available: false },
      { label: "Activiteit", href: "/dashboard/activiteit", icon: List, available: false },
    ],
  },
  {
    title: "Systeem",
    collapsible: true,
    items: [
      { label: "Integraties", href: "/dashboard/integraties", icon: Plug, available: false },
      { label: "Cron", href: "/dashboard/cron", icon: Clock, available: false },
      { label: "Deploy", href: "/dashboard/deploy", icon: Rocket, available: false },
    ],
  },
];

function groupHasActivePath(group: NavGroup, pathname: string) {
  return group.items.some(
    (item) =>
      pathname === item.href ||
      item.children?.some((child) => pathname === child.href),
  );
}

function itemIsAvailable(item: Item) {
  return item.available !== false;
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setOpenGroups((prev) => {
      const next = { ...prev };
      for (const group of groups) {
        if (group.collapsible && groupHasActivePath(group, pathname)) {
          next[group.title] = true;
        }
      }
      return next;
    });
  }, [pathname]);

  function toggleGroup(title: string) {
    setOpenGroups((prev) => ({ ...prev, [title]: !prev[title] }));
  }

  function isGroupOpen(group: NavGroup) {
    if (!group.collapsible) return true;
    return openGroups[group.title] ?? false;
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  function renderLink(
    item: Item,
    active: boolean,
    isChild = false,
    parentOfActive = false,
  ) {
    const available = itemIsAvailable(item);

    return (
      <Link
        key={item.href}
        href={item.href}
        aria-disabled={!available}
        className={`group relative flex items-center gap-2.5 rounded-xl py-2 text-sm transition-all duration-200 ${
          isChild ? "px-2 text-[13px]" : "px-2.5"
        } ${
          !available
            ? "cursor-default text-zinc-600 hover:bg-transparent"
            : active
              ? "bg-sky-500/10 text-sky-200"
              : parentOfActive
                ? "text-zinc-300 hover:bg-white/[0.04] hover:text-zinc-100"
                : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-100"
        }`}
      >
        {active && available && (
          <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-sky-500/70" />
        )}
        <item.icon
          size={isChild ? 15 : 16}
          strokeWidth={active && available ? 2 : 1.75}
          className={`shrink-0 transition-colors duration-200 ${
            !available
              ? "text-zinc-700"
              : active
                ? "text-sky-400"
                : parentOfActive
                  ? "text-zinc-400 group-hover:text-zinc-200"
                  : "text-zinc-500 group-hover:text-zinc-300"
          }`}
        />
        <span className="flex-1 truncate">{item.label}</span>
        {item.badge != null && (
          <span
            className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums ${
              !available
                ? "bg-white/[0.03] text-zinc-600"
                : item.badgeTone === "info"
                  ? "bg-sky-500/10 text-sky-400"
                  : item.badgeTone === "warning"
                    ? "bg-amber-500/10 text-amber-400"
                    : "bg-white/[0.06] text-zinc-400"
            }`}
          >
            {item.badge}
          </span>
        )}
      </Link>
    );
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[220px] flex-col border-r border-white/[0.06] bg-zinc-950 lg:flex">
      <div className="relative flex h-14 items-center gap-2.5 border-b border-white/[0.06] px-4">
        <div className="rounded-lg ring-1 ring-white/[0.06]">
          <Image
            src="/logo-tile.png"
            alt="ArchonPro logo"
            width={40}
            height={40}
            className="h-10 w-10 rounded-lg"
          />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold tracking-tight text-zinc-50">
            ArchonPro
          </p>
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-500">
            Mission view
          </p>
        </div>
      </div>

      <nav className="relative flex-1 overflow-y-auto px-3 py-4 [scrollbar-color:rgba(255,255,255,0.08)_transparent] [scrollbar-width:thin]">
        {groups.map((group, groupIndex) => {
          const open = isGroupOpen(group);

          return (
            <div
              key={group.title}
              className={groupIndex > 0 ? "mt-6 border-t border-white/[0.04] pt-5" : ""}
            >
              {group.collapsible ? (
                <button
                  type="button"
                  onClick={() => toggleGroup(group.title)}
                  className="mb-2 flex w-full items-center justify-between rounded-lg px-2 py-1 text-left transition-colors hover:bg-white/[0.03]"
                  aria-expanded={open}
                >
                  <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
                    {group.title}
                  </span>
                  <ChevronDown
                    size={14}
                    className={`shrink-0 text-zinc-600 transition-transform duration-200 ${
                      open ? "rotate-0" : "-rotate-90"
                    }`}
                  />
                </button>
              ) : (
                <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
                  {group.title}
                </p>
              )}

              {open && (
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const hasChildren = item.children && item.children.length > 0;
                    const childActive = item.children?.some(
                      (child) => pathname === child.href,
                    );
                    return (
                      <div key={item.label}>
                        {renderLink(item, pathname === item.href, false, !!childActive)}
                        {hasChildren && (
                          <div className="relative ml-[18px] mt-0.5 space-y-0.5 border-l border-white/[0.06] pl-3">
                            {item.children!.map((child) =>
                              renderLink(child, pathname === child.href, true),
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="relative space-y-0.5 border-t border-white/[0.06] p-3">
        <Link
          href="/dashboard/instellingen"
          className={`group flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm transition-all duration-200 ${
            pathname === "/dashboard/instellingen"
              ? "bg-sky-500/10 text-sky-200"
              : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-100"
          }`}
        >
          <Settings
            size={16}
            strokeWidth={pathname === "/dashboard/instellingen" ? 2 : 1.75}
            className={
              pathname === "/dashboard/instellingen"
                ? "text-sky-400"
                : "text-zinc-500 transition-colors group-hover:text-zinc-300"
            }
          />
          Instellingen
        </Link>
        <button
          onClick={handleLogout}
          className="group flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm text-zinc-400 transition-all duration-200 hover:bg-white/[0.04] hover:text-rose-400"
        >
          <LogOut
            size={16}
            strokeWidth={1.75}
            className="text-zinc-500 transition-colors group-hover:text-rose-400/90"
          />
          Uitloggen
        </button>
      </div>
    </aside>
  );
}
