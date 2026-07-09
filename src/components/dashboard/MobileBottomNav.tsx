"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LayoutGrid } from "lucide-react";
import MobileMoreSheet from "@/components/dashboard/MobileMoreSheet";
import {
  getActiveMobileTabId,
  MOBILE_SWIPE_TABS,
} from "@/components/dashboard/nav-config";

type Props = {
  isPreviewMode?: boolean;
};

export default function MobileBottomNav({ isPreviewMode = false }: Props) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const activeId = getActiveMobileTabId(pathname);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  useEffect(() => {
    const el = scrollRef.current?.querySelector<HTMLElement>(
      '[data-mobile-nav-active="true"]',
    );
    el?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [activeId]);

  return (
    <>
      <nav
        className="mobile-bottom-nav fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.06] bg-zinc-950/92 backdrop-blur-xl lg:hidden"
        aria-label="Mobiele navigatie"
      >
        <div
          ref={scrollRef}
          className="flex items-stretch gap-0.5 overflow-x-auto px-2 pt-1.5 pb-[calc(0.35rem+env(safe-area-inset-bottom))] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {MOBILE_SWIPE_TABS.map((tab) => {
            const active = activeId === tab.id;
            return (
              <Link
                key={tab.id}
                href={tab.href}
                prefetch
                aria-current={active ? "page" : undefined}
                data-mobile-nav-active={active ? "true" : undefined}
                className={`flex min-w-[4.1rem] shrink-0 snap-center flex-col items-center gap-1 rounded-2xl px-1 py-2 text-[10px] font-medium transition-colors ${
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
                  <tab.icon size={18} strokeWidth={active ? 2.25 : 1.75} />
                </span>
                <span className="max-w-[4rem] truncate">{tab.label}</span>
              </Link>
            );
          })}

          <button
            type="button"
            data-mobile-nav-active={activeId === "more" ? "true" : undefined}
            onClick={() => setMoreOpen(true)}
            aria-label="Meer menu"
            aria-expanded={moreOpen}
            aria-controls="mobile-more-sheet"
            className={`flex min-w-[4.1rem] shrink-0 snap-center flex-col items-center gap-1 rounded-2xl px-1 py-2 text-[10px] font-medium transition-colors ${
              activeId === "more"
                ? "text-sky-400"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <span
              className={`grid h-8 w-8 place-items-center rounded-xl transition-colors ${
                activeId === "more" ? "bg-sky-500/12" : "bg-transparent"
              }`}
            >
              <LayoutGrid size={18} strokeWidth={activeId === "more" ? 2.25 : 1.75} />
            </span>
            <span>Meer</span>
          </button>
        </div>
      </nav>

      <MobileMoreSheet
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        isPreviewMode={isPreviewMode}
      />
    </>
  );
}
