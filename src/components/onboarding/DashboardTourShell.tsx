"use client";

import { Suspense } from "react";
import { DashboardTourProvider } from "@/components/onboarding/DashboardTourProvider";
import NovaDashboardTour from "@/components/onboarding/NovaDashboardTour";
import DashboardTourReplayFab from "@/components/onboarding/DashboardTourReplayFab";

/** Tour UI moet binnen AgentChatProvider staan (NovaVoiceAsk → useAgentChat). */
export function DashboardTourUi() {
  return (
    <>
      <Suspense>
        <NovaDashboardTour />
      </Suspense>
      <DashboardTourReplayFab />
    </>
  );
}

export { DashboardTourProvider };
