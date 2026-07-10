"use client";

import Link from "next/link";
import { BrandLockup } from "@/components/BrandLogo";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronDown, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  groupHasActivePath,
  SIDEBAR_GROUPS,
  SIDEBAR_LOGOUT,
  SIDEBAR_SETTINGS,
  sidebarItemIsActive,
  type SidebarGroup,
  type SidebarItem,
} from "@/components/dashboard/sidebar-nav";

function itemIsAvailable(item: SidebarItem) {
  return item.available !== false;
}

export default function Sidebar({ isPreviewMode = false }: { isPreviewMode?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  function toggleGroup(title: string) {
    setOpenGroups((prev) => ({ ...prev, [title]: !isGroupOpen(title) }));
  }

  function isGroupOpen(titleOrGroup: string | SidebarGroup) {
    const group =
      typeof titleOrGroup === "string"
        ? SIDEBAR_GROUPS.find((g) => g.title === titleOrGroup)
        : titleOrGroup;
    if (!group || !group.collapsible) return true;
    if (groupHasActivePath(group, pathname)) return true;
    return openGroups[group.title] ?? false;
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  function renderLink(
    item: SidebarItem,
    active: boolean,
    isChild = false,
    parentOfActive = false,
  ) {
    const available = itemIsAvailable(item);
    const className = `group relative flex items-center gap-2.5 rounded-xl py-2 text-sm transition-all duration-200 ${
      isChild ? "px-2 text-[13px]" : "px-2.5"
    } ${
      !available
        ? "cursor-default text-zinc-600 hover:bg-transparent"
        : active
          ? "bg-sky-500/10 text-sky-200"
          : parentOfActive
            ? "text-zinc-300 hover:bg-white/[0.04] hover:text-zinc-100"
            : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-100"
    }`;

    const inner = (
      <>
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
      </>
    );

    if (!available) {
      return (
        <span
          key={item.href}
          title="Binnenkort beschikbaar"
          aria-disabled="true"
          className={className}
        >
          {inner}
        </span>
      );
    }

    return (
      <Link
        key={item.href}
        href={item.href}
        prefetch
        aria-current={active ? "page" : undefined}
        className={className}
      >
        {inner}
      </Link>
    );
  }

  const settingsActive = sidebarItemIsActive(pathname, SIDEBAR_SETTINGS.href);

  return (
    <aside
      data-tour="dash-sidebar"
      className="dashboard-sidebar fixed inset-y-0 left-0 z-40 hidden w-[220px] flex-col border-r border-white/[0.06] bg-zinc-950 lg:flex"
    >
      <div className="relative flex h-14 items-center border-b border-white/[0.06] px-4">
        <BrandLockup
          href="/dashboard"
          markSize={36}
          wordmarkSize="sm"
          tagline="Mission view"
        />
      </div>

      <nav className="relative flex-1 overflow-y-auto px-3 py-4 [scrollbar-color:rgba(255,255,255,0.08)_transparent] [scrollbar-width:thin]">
        {SIDEBAR_GROUPS.map((group, groupIndex) => {
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
                    const childActive = item.children?.some((child) =>
                      sidebarItemIsActive(pathname, child.href),
                    );
                    const itemActive = sidebarItemIsActive(pathname, item.href);

                    return (
                      <div key={item.label}>
                        {renderLink(item, itemActive, false, !!childActive)}
                        {hasChildren && (
                          <div className="relative ml-[18px] mt-0.5 space-y-0.5 border-l border-white/[0.06] pl-3">
                            {item.children!.map((child) =>
                              renderLink(
                                child,
                                sidebarItemIsActive(pathname, child.href),
                                true,
                              ),
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
        {!isPreviewMode && (
          <Link
            href={SIDEBAR_SETTINGS.href}
            className={`group flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm transition-all duration-200 ${
              settingsActive
                ? "bg-sky-500/10 text-sky-200"
                : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-100"
            }`}
          >
            <SIDEBAR_SETTINGS.icon
              size={16}
              strokeWidth={settingsActive ? 2 : 1.75}
              className={
                settingsActive
                  ? "text-sky-400"
                  : "text-zinc-500 transition-colors group-hover:text-zinc-300"
              }
            />
            {SIDEBAR_SETTINGS.label}
          </Link>
        )}
        {isPreviewMode ? (
          <Link
            href="/register"
            className="group flex w-full items-center gap-2.5 rounded-xl bg-sky-500/15 px-2.5 py-2 text-sm font-medium text-sky-200 transition-all duration-200 hover:bg-sky-500/25"
          >
            <Sparkles
              size={16}
              strokeWidth={1.75}
              className="text-sky-400 transition-colors group-hover:text-sky-300"
            />
            Start 7 dagen gratis
          </Link>
        ) : (
          <button
            type="button"
            onClick={handleLogout}
            className="group flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm text-zinc-400 transition-all duration-200 hover:bg-white/[0.04] hover:text-rose-400"
          >
            <SIDEBAR_LOGOUT.icon
              size={16}
              strokeWidth={1.75}
              className="text-zinc-500 transition-colors group-hover:text-rose-400/90"
            />
            {SIDEBAR_LOGOUT.label}
          </button>
        )}
      </div>
    </aside>
  );
}
