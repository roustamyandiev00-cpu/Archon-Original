"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { LayoutGrid } from "lucide-react";
import { LogoMark } from "@/components/BrandLogo";
import MobileMoreSheet from "@/components/dashboard/MobileMoreSheet";
import MobileAgentChatNavButton from "@/components/dashboard/agent-chat/MobileAgentChatNavButton";
import { useAgentChat } from "@/components/dashboard/agent-chat/AgentChatProvider";
import {
  getActiveMobileTabId,
  MOBILE_PRIMARY_TABS,
} from "@/components/dashboard/nav-config";
import { BOUWNETWERK_FALLBACK_USERS } from "@/lib/bouwnetwerk-gate";

type Props = {
  isPreviewMode?: boolean;
  registeredUsers?: number;
};

const subscribeToClient = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

export default function MobileBottomNav({
  isPreviewMode = false,
  registeredUsers = BOUWNETWERK_FALLBACK_USERS,
}: Props) {
  const pathname = usePathname();
  const { view: agentChatView } = useAgentChat();
  const [moreOpen, setMoreOpen] = useState(false);
  const mounted = useSyncExternalStore(
    subscribeToClient,
    clientSnapshot,
    serverSnapshot,
  );
  const activeId = getActiveMobileTabId(pathname);
  const scrollRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const id = window.setTimeout(() => setMoreOpen(false), 0);
    return () => window.clearTimeout(id);
  }, [pathname]);

  useEffect(() => {
    if (!mounted) return;
    const container = scrollRef.current;
    const indicator = indicatorRef.current;
    if (!container || !indicator) return;

    const activeEl = container.querySelector<HTMLElement>(
      '[data-mobile-nav-active="true"]',
    );
    if (!activeEl) return;

    const containerRect = container.getBoundingClientRect();
    const activeRect = activeEl.getBoundingClientRect();
    const left = activeRect.left - containerRect.left + container.scrollLeft;

    indicator.style.width = `${activeRect.width}px`;
    indicator.style.transform = `translateX(${left}px)`;

  }, [activeId, mounted, pathname, agentChatView]);

  return (
    <>
      <nav
        className="mobile-bottom-nav fixed inset-x-0 bottom-0 z-50 border-t border-white/[0.06] bg-zinc-950/92 backdrop-blur-xl lg:hidden"
        aria-label="Mobiele navigatie"
        suppressHydrationWarning
      >
        <div className="relative">
          <span
            ref={indicatorRef}
            className="mobile-bottom-nav-indicator pointer-events-none absolute top-1.5 left-0 h-[calc(100%-0.375rem-env(safe-area-inset-bottom))] rounded-2xl bg-sky-500/10 transition-[transform,width] duration-300 ease-out"
            aria-hidden
          />

          <div
            ref={scrollRef}
            className="relative flex items-stretch gap-0.5 px-1.5 pt-1.5 pb-[calc(0.35rem+env(safe-area-inset-bottom))]"
          >
            {MOBILE_PRIMARY_TABS.map((tab) => {
              const active = mounted && activeId === tab.id;
              return (
                <Link
                  key={tab.id}
                  href={tab.href}
                  prefetch
                  aria-current={active ? "page" : undefined}
                  data-mobile-nav-active={active ? "true" : undefined}
                  data-no-swipe
                  className={`relative z-[1] flex min-w-0 flex-1 flex-col items-center gap-1 rounded-2xl px-1 py-2 text-[10px] font-medium transition-colors ${
                    active
                      ? "text-sky-400"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  <span
                    className={`grid h-8 w-8 place-items-center rounded-xl transition-colors ${
                      active ? "bg-sky-500/12" : "bg-transparent"
                    }`}
                  >
                    {tab.id === "home" ? (
                      <LogoMark size={22} glow={false} className="rounded-lg" />
                    ) : (
                      <tab.icon size={18} strokeWidth={active ? 2.25 : 1.75} />
                    )}
                  </span>
                  <span className="max-w-full truncate">{tab.label}</span>
                </Link>
              );
            })}

            <MobileAgentChatNavButton mounted={mounted} />

            <button
              type="button"
              data-mobile-nav-active={
                mounted && activeId === "more" ? "true" : undefined
              }
              data-no-swipe
              onClick={() => setMoreOpen(true)}
              aria-label="Meer menu"
              aria-expanded={moreOpen}
              aria-controls="mobile-more-sheet"
              className={`relative z-[1] flex min-w-0 flex-1 flex-col items-center gap-1 rounded-2xl px-1 py-2 text-[10px] font-medium transition-colors ${
                mounted && activeId === "more"
                  ? "text-sky-400"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <span
                className={`grid h-8 w-8 place-items-center rounded-xl transition-colors ${
                  mounted && activeId === "more" ? "bg-sky-500/12" : "bg-transparent"
                }`}
              >
                <LayoutGrid
                  size={18}
                  strokeWidth={mounted && activeId === "more" ? 2.25 : 1.75}
                />
              </span>
              <span>Meer</span>
            </button>
          </div>
        </div>
      </nav>

      <MobileMoreSheet
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        isPreviewMode={isPreviewMode}
        registeredUsers={registeredUsers}
      />
    </>
  );
}
