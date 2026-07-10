"use client";

import { useSyncExternalStore } from "react";
import { Sparkles } from "lucide-react";
import {
  isDashboardTourDone,
  resetDashboardTour,
} from "@/lib/onboarding/storage";
import { useDashboardTour } from "@/components/onboarding/DashboardTourProvider";

const subscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export default function DashboardTourReplayFab() {
  const mounted = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot,
  );
  const { showTour, startTour } = useDashboardTour();

  if (!mounted || !isDashboardTourDone() || showTour) return null;

  return (
    <button
      type="button"
      onClick={() => {
        resetDashboardTour();
        startTour({ replay: true });
      }}
      className="fixed bottom-6 left-6 z-[60] inline-flex items-center gap-2 rounded-full border border-orange-500/35 bg-zinc-950/90 px-4 py-2.5 text-sm font-medium text-orange-300 shadow-lg backdrop-blur-sm transition-all hover:border-orange-400/50 hover:bg-zinc-900/95 hover:text-orange-200"
      aria-label="Rondleiding opnieuw starten"
    >
      <Sparkles size={16} className="text-orange-400" />
      Rondleiding
    </button>
  );
}
