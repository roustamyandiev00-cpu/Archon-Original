"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode, type TouchEvent } from "react";
import {
  getMobileDetailParent,
  getMobileSwipeTabIndex,
  MOBILE_SWIPE_TABS,
} from "@/components/dashboard/nav-config";

const SWIPE_THRESHOLD = 72;
const MAX_VERTICAL_DRIFT = 96;

export default function MobileSwipeNav({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const [dragX, setDragX] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const tabIndex = getMobileSwipeTabIndex(pathname);
  const detailParent = getMobileDetailParent(pathname);
  const isDetailPage = detailParent !== null;
  const canSwipe = tabIndex >= 0;

  function resetTouch() {
    touchStart.current = null;
    setSwiping(false);
    setDragX(0);
  }

  function handleTouchStart(event: TouchEvent<HTMLDivElement>) {
    if (!canSwipe) return;
    const touch = event.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY };
    setSwiping(true);
    setDragX(0);
  }

  function handleTouchMove(event: TouchEvent<HTMLDivElement>) {
    if (!canSwipe || !touchStart.current) return;
    const touch = event.touches[0];
    const dx = touch.clientX - touchStart.current.x;
    const dy = touch.clientY - touchStart.current.y;
    if (Math.abs(dy) > Math.abs(dx)) return;

    const atStart = tabIndex === 0 && dx > 0 && !isDetailPage;
    const atEnd =
      tabIndex === MOBILE_SWIPE_TABS.length - 1 && dx < 0 && !isDetailPage;
    if (atStart || atEnd) {
      setDragX(dx * 0.18);
      return;
    }
    setDragX(dx * 0.35);
  }

  function handleTouchEnd(event: TouchEvent<HTMLDivElement>) {
    if (!canSwipe || !touchStart.current) {
      resetTouch();
      return;
    }

    const touch = event.changedTouches[0];
    const dx = touch.clientX - touchStart.current.x;
    const dy = touch.clientY - touchStart.current.y;
    touchStart.current = null;
    setSwiping(false);
    setDragX(0);

    if (Math.abs(dy) > MAX_VERTICAL_DRIFT) return;
    if (Math.abs(dx) < SWIPE_THRESHOLD) return;

    if (dx > 0) {
      if (isDetailPage && detailParent) {
        router.push(detailParent);
        return;
      }
      if (tabIndex > 0) {
        router.push(MOBILE_SWIPE_TABS[tabIndex - 1].href);
      }
      return;
    }

    if (dx < 0 && tabIndex < MOBILE_SWIPE_TABS.length - 1) {
      router.push(MOBILE_SWIPE_TABS[tabIndex + 1].href);
    }
  }

  return (
    <div className="lg:contents">
      <div
        className="mobile-swipe-shell lg:contents"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={resetTouch}
      >
        <div
          className="mobile-swipe-content"
          style={{
            transform:
              !reduceMotion && dragX
                ? `translate3d(${dragX}px, 0, 0)`
                : undefined,
            transition:
              reduceMotion || swiping ? "none" : "transform 0.22s ease",
          }}
        >
          {children}
        </div>
      </div>

      {canSwipe && (
        <div className="mt-4 space-y-2 lg:hidden">
          <div
            className="flex items-center justify-center gap-1.5"
            aria-hidden
          >
            {MOBILE_SWIPE_TABS.map((tab, index) => (
              <span
                key={tab.id}
                className={`h-1 rounded-full transition-all duration-300 ${
                  index === tabIndex
                    ? "w-5 bg-sky-400"
                    : "w-1.5 bg-white/15"
                }`}
              />
            ))}
          </div>
          {isDetailPage && (
            <p className="text-center text-[11px] text-zinc-600">
              Swipe rechts voor overzicht · links voor volgende sectie
            </p>
          )}
        </div>
      )}
    </div>
  );
}
