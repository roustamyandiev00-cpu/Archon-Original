"use client";

import Link from "next/link";
import { BrandLockup } from "@/components/BrandLogo";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ChevronDown, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/components/ui/utils";
import {
  groupHasActivePath,
  SIDEBAR_CEO_CONSOLE,
  SIDEBAR_GROUPS,
  SIDEBAR_LOGOUT,
  sidebarItemIsActive,
  type SidebarGroup,
  type SidebarItem,
} from "@/components/dashboard/sidebar-nav";
import { TRIAL_DAYS } from "@/components/dashboard/trial";

const ICON_SIZE = 18;
const ICON_STROKE = 1.75;

function itemIsAvailable(item: SidebarItem) {
  return item.available !== false;
}

export default function Sidebar({
  isPreviewMode = false,
  showCeoConsole = false,
}: {
  isPreviewMode?: boolean;
  showCeoConsole?: boolean;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
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
    if (groupHasActivePath(group, pathname, searchParams)) return true;
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
    const className = cn(
      "dashboard-sidebar-link group relative flex min-h-[42px] items-center gap-2.5 rounded-[9px] px-2.5 text-sm transition-colors duration-150",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-400/40",
      isChild && "min-h-[40px] px-2 text-[13px]",
      !available
        ? "cursor-default text-zinc-600 hover:bg-transparent"
        : active
          ? item.accent === "amber"
            ? "bg-amber-500/10 font-medium text-amber-300"
            : "dashboard-sidebar-link--active bg-[#0c2836] font-medium text-sky-200"
          : item.accent === "amber"
            ? "font-normal text-amber-400 hover:bg-amber-500/10 hover:text-amber-300"
            : parentOfActive
              ? "font-normal text-zinc-300 hover:bg-white/[0.035] hover:text-zinc-100"
              : "font-normal text-zinc-400 hover:bg-white/[0.035] hover:text-zinc-100",
    );

    const tooltip = !available
      ? "Binnenkort beschikbaar"
      : item.label;

    const inner = (
      <>
        {active && available ? (
          <span
            aria-hidden
            className={cn(
              "absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full",
              item.accent === "amber" ? "bg-amber-400/80" : "bg-cyan-400/80",
            )}
          />
        ) : null}
        <item.icon
          size={isChild ? 16 : ICON_SIZE}
          strokeWidth={ICON_STROKE}
          aria-hidden
          className={cn(
            "shrink-0",
            !available
              ? "text-zinc-700"
              : active
                ? "text-cyan-400"
                : parentOfActive
                  ? "text-zinc-400 group-hover:text-zinc-200"
                  : "text-zinc-500 group-hover:text-zinc-300",
          )}
        />
        <span className="min-w-0 flex-1 leading-snug break-words">
          {item.label}
        </span>
        {item.tag ? (
          <span
            className={cn(
              "ml-auto shrink-0 rounded px-1 py-px text-[9px] font-medium uppercase tracking-wide",
              !available
                ? "bg-white/[0.03] text-zinc-600"
                : "bg-white/[0.06] text-zinc-500",
            )}
          >
            {item.tag}
          </span>
        ) : null}
        {item.badge != null ? (
          <span
            className={cn(
              "dashboard-sidebar-badge ml-auto shrink-0 rounded-md px-1 py-px text-[9px] font-medium tabular-nums leading-none",
              !available
                ? "bg-white/[0.03] text-zinc-600"
                : item.badgeTone === "info"
                  ? "bg-sky-500/15 text-sky-400"
                  : item.badgeTone === "warning"
                    ? "bg-amber-500/15 text-amber-400"
                    : "bg-white/[0.06] text-zinc-400",
            )}
          >
            {item.badge}
          </span>
        ) : null}
      </>
    );

    if (!available) {
      return (
        <span
          key={item.href}
          title={tooltip}
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
        title={tooltip}
        aria-current={active ? "page" : undefined}
        className={className}
      >
        {inner}
      </Link>
    );
  }

  const ceoActive = sidebarItemIsActive(
    pathname,
    SIDEBAR_CEO_CONSOLE.href,
    searchParams,
  );

  return (
    <aside
      data-tour="dash-sidebar"
      className="dashboard-sidebar fixed inset-y-0 left-0 z-40 hidden h-dvh w-[220px] flex-col overflow-hidden border-r border-white/[0.06] bg-zinc-950 lg:flex"
    >
      <div className="relative flex h-12 shrink-0 items-center border-b border-white/[0.06] px-3">
        <BrandLockup
          href="/dashboard"
          markSize={32}
          wordmarkSize="sm"
          tagline="Mission view"
        />
      </div>

      <nav
        className="dashboard-sidebar-nav relative min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-2 py-2.5"
        aria-label="Hoofdnavigatie"
      >
        {SIDEBAR_GROUPS.map((group, groupIndex) => {
          const open = isGroupOpen(group);

          return (
            <div
              key={group.title}
              className={
                groupIndex > 0
                  ? "mt-3 border-t border-white/[0.05] pt-3"
                  : undefined
              }
            >
              {group.collapsible ? (
                <button
                  type="button"
                  onClick={() => toggleGroup(group.title)}
                  className="mb-1.5 flex w-full items-center justify-between rounded-[9px] px-2.5 py-1.5 text-left transition-colors hover:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-400/40"
                  aria-expanded={open}
                >
                  <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                    {group.title}
                  </span>
                  <ChevronDown
                    size={14}
                    strokeWidth={ICON_STROKE}
                    className={cn(
                      "shrink-0 text-zinc-600 transition-transform duration-200",
                      open ? "rotate-0" : "-rotate-90",
                    )}
                  />
                </button>
              ) : (
                <p className="mb-1.5 px-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                  {group.title}
                </p>
              )}

              {open ? (
                <div className="flex flex-col gap-0.5">
                  {group.items.map((item) => {
                    const hasChildren =
                      item.children && item.children.length > 0;
                    const childActive = item.children?.some((child) =>
                      sidebarItemIsActive(pathname, child.href, searchParams),
                    );
                    const itemActive = sidebarItemIsActive(
                      pathname,
                      item.href,
                      searchParams,
                    );

                    return (
                      <div key={item.label}>
                        {renderLink(item, itemActive, false, !!childActive)}
                        {hasChildren && (itemActive || childActive) ? (
                          <div className="relative ml-[19px] mt-0.5 flex flex-col gap-0.5 border-l border-white/[0.06] pl-2.5">
                            {item.children!.map((child) =>
                              renderLink(
                                child,
                                sidebarItemIsActive(
                                  pathname,
                                  child.href,
                                  searchParams,
                                ),
                                true,
                              ),
                            )}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
      </nav>

      <div className="relative shrink-0 space-y-0.5 border-t border-white/[0.06] p-2">
        {!isPreviewMode && showCeoConsole ? (
          <Link
            href={SIDEBAR_CEO_CONSOLE.href}
            title={SIDEBAR_CEO_CONSOLE.label}
            className={cn(
              "group mb-0.5 flex min-h-[42px] items-center gap-2.5 rounded-[9px] px-2.5 text-sm transition-colors duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-400/40",
              ceoActive
                ? "bg-violet-500/12 font-medium text-violet-200"
                : "font-normal text-zinc-400 hover:bg-white/[0.035] hover:text-zinc-100",
            )}
          >
            <SIDEBAR_CEO_CONSOLE.icon
              size={ICON_SIZE}
              strokeWidth={ICON_STROKE}
              className={
                ceoActive
                  ? "shrink-0 text-violet-400"
                  : "shrink-0 text-zinc-500 group-hover:text-zinc-300"
              }
            />
            <span className="min-w-0 flex-1 leading-snug break-words">
              {SIDEBAR_CEO_CONSOLE.label}
            </span>
          </Link>
        ) : null}
        {isPreviewMode ? (
          <Link
            href="/register"
            className="group flex min-h-[42px] w-full items-center gap-2.5 rounded-[9px] bg-sky-500/12 px-2.5 text-sm font-medium text-sky-200 transition-colors duration-150 hover:bg-sky-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-400/40"
          >
            <Sparkles
              size={ICON_SIZE}
              strokeWidth={ICON_STROKE}
              className="shrink-0 text-cyan-400"
            />
            <span className="min-w-0 flex-1 leading-snug">
              Start {TRIAL_DAYS} dagen gratis
            </span>
          </Link>
        ) : (
          <button
            type="button"
            onClick={handleLogout}
            title={SIDEBAR_LOGOUT.label}
            className="group flex min-h-[42px] w-full items-center gap-2.5 rounded-[9px] px-2.5 text-sm font-normal text-zinc-400 transition-colors duration-150 hover:bg-white/[0.035] hover:text-rose-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-400/40"
          >
            <SIDEBAR_LOGOUT.icon
              size={ICON_SIZE}
              strokeWidth={ICON_STROKE}
              className="shrink-0 text-zinc-500 group-hover:text-rose-400/90"
            />
            <span className="min-w-0 flex-1 text-left leading-snug">
              {SIDEBAR_LOGOUT.label}
            </span>
          </button>
        )}
      </div>
    </aside>
  );
}
