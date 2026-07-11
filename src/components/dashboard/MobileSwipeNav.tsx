"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
  type TouchEvent,
} from "react";
import {
  getMobileDetailParent,
  getMobileSwipeTabIndex,
  MOBILE_SWIPE_TABS,
} from "@/components/dashboard/nav-config";

const SWIPE_THRESHOLD = 64;
const MAX_VERTICAL_DRIFT = 88;

type SlideDirection = "from-left" | "from-right" | null;

function isInteractiveTarget(target: EventTarget | null) {
  return (
    target instanceof Element &&
    target.closest(
      "a, button, input, textarea, select, label, [role='button'], [role='link'], [data-no-swipe]",
    ) !== null
  );
}

export default function MobileSwipeNav({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const touchStart = useRef<{ x: number; y: number; pointerId?: number } | null>(
    null,
  );
  const prevTabIndex = useRef(-1);
  const [dragX, setDragX] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [slideDirection, setSlideDirection] = useState<SlideDirection>(null);

  const tabIndex = getMobileSwipeTabIndex(pathname);
  const detailParent = getMobileDetailParent(pathname);
  const isDetailPage = detailParent !== null;
  const canSwipe = tabIndex >= 0;

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (tabIndex < 0 || prevTabIndex.current < 0) {
      prevTabIndex.current = tabIndex;
      return;
    }
    if (tabIndex === prevTabIndex.current) return;

    if (!reduceMotion) {
      setSlideDirection(
        tabIndex > prevTabIndex.current ? "from-right" : "from-left",
      );
    }
    prevTabIndex.current = tabIndex;

    const timer = window.setTimeout(() => setSlideDirection(null), 320);
    return () => window.clearTimeout(timer);
  }, [tabIndex, pathname, reduceMotion]);

  function resetTouch() {
    touchStart.current = null;
    setSwiping(false);
    setDragX(0);
  }

  function beginGesture(x: number, y: number, pointerId?: number) {
    if (!canSwipe) return;
    touchStart.current = { x, y, pointerId };
    setSwiping(true);
    setDragX(0);
  }

  function moveGesture(x: number, y: number) {
    if (!canSwipe || !touchStart.current) return;
    const dx = x - touchStart.current.x;
    const dy = y - touchStart.current.y;
    if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 12) return;

    const atStart = tabIndex === 0 && dx > 0 && !isDetailPage;
    const atEnd =
      tabIndex === MOBILE_SWIPE_TABS.length - 1 && dx < 0 && !isDetailPage;
    if (atStart || atEnd) {
      setDragX(dx * 0.22);
      return;
    }
    setDragX(dx * 0.42);
  }

  function endGesture(x: number, y: number) {
    if (!canSwipe || !touchStart.current) {
      resetTouch();
      return;
    }

    const dx = x - touchStart.current.x;
    const dy = y - touchStart.current.y;
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

  function handleTouchStart(event: TouchEvent<HTMLDivElement>) {
    if (isInteractiveTarget(event.target)) return;
    const touch = event.touches[0];
    beginGesture(touch.clientX, touch.clientY);
  }

  function handleTouchMove(event: TouchEvent<HTMLDivElement>) {
    const touch = event.touches[0];
    moveGesture(touch.clientX, touch.clientY);
  }

  function handleTouchEnd(event: TouchEvent<HTMLDivElement>) {
    const touch = event.changedTouches[0];
    endGesture(touch.clientX, touch.clientY);
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType === "touch") return;
    if (isInteractiveTarget(event.target)) return;
    beginGesture(event.clientX, event.clientY, event.pointerId);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType === "touch") return;
    if (touchStart.current?.pointerId !== event.pointerId) return;
    moveGesture(event.clientX, event.clientY);
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType === "touch") return;
    if (touchStart.current?.pointerId !== event.pointerId) return;
    endGesture(event.clientX, event.clientY);
    event.currentTarget.releasePointerCapture(event.pointerId);
  }

  const slideClass =
    slideDirection === "from-right"
      ? "mobile-page-from-right"
      : slideDirection === "from-left"
        ? "mobile-page-from-left"
        : "";

  return (
    <div className="dashboard-swipe-root flex min-h-0 flex-1 flex-col lg:overflow-hidden">
      <div
        className="mobile-swipe-shell flex min-h-0 flex-1 flex-col lg:overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={resetTouch}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={resetTouch}
      >
        {canSwipe && Math.abs(dragX) > 8 && (
          <div className="mobile-swipe-edge-hints" aria-hidden>
            {dragX > 0 && tabIndex > 0 && (
              <span className="mobile-swipe-edge-hint mobile-swipe-edge-hint--left">
                {MOBILE_SWIPE_TABS[tabIndex - 1].label}
              </span>
            )}
            {dragX < 0 && tabIndex < MOBILE_SWIPE_TABS.length - 1 && (
              <span className="mobile-swipe-edge-hint mobile-swipe-edge-hint--right">
                {MOBILE_SWIPE_TABS[tabIndex + 1].label}
              </span>
            )}
          </div>
        )}

        <div
          className={`mobile-swipe-content flex min-h-0 flex-1 flex-col lg:overflow-hidden ${slideClass}`}
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
        <div className="mobile-swipe-dots lg:hidden" aria-hidden>
          {MOBILE_SWIPE_TABS.map((tab, index) => (
            <span
              key={tab.id}
              className={`mobile-swipe-dot ${
                index === tabIndex ? "mobile-swipe-dot--active" : ""
              }`}
            />
          ))}
        </div>
      )}

      {canSwipe && isDetailPage && (
        <p className="mt-2 text-center text-[11px] text-zinc-600 lg:hidden">
          Swipe rechts voor overzicht · links voor volgende sectie
        </p>
      )}
    </div>
  );
}
