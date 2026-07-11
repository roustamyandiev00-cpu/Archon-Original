"use client";

import type { ReactNode } from "react";

/** Vaste mobiele content — geen swipe/slide tussen tabs (alleen bottom nav). */
export default function MobileSwipeNav({ children }: { children: ReactNode }) {
  return (
    <div className="dashboard-swipe-root flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="mobile-swipe-shell flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="mobile-swipe-content flex min-h-0 flex-1 flex-col overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}
