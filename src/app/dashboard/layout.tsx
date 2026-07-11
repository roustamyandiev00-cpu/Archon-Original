import type { Metadata } from "next";
import "@/components/dashboard/dashboard-theme.css";
import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";
import MobileBottomNav from "@/components/dashboard/MobileBottomNav";
import MobileSwipeNav from "@/components/dashboard/MobileSwipeNav";
import DashboardThemeProvider from "@/components/dashboard/DashboardThemeProvider";
import { AgentChatProvider } from "@/components/dashboard/agent-chat/AgentChatProvider";
import AgentChatWidget from "@/components/dashboard/agent-chat/AgentChatWidget";
import { AgentNavigationProvider } from "@/components/dashboard/agent-navigation/AgentNavigationProvider";
import { ProactiveAgentProvider } from "@/components/dashboard/ProactiveAgentProvider";
import { PendingApprovalsProvider } from "@/components/dashboard/PendingApprovalsProvider";
import { AgentCompletionsProvider } from "@/components/dashboard/AgentCompletionsProvider";
import {
  ImpersonationBanner,
  PreviewBanner,
  TrialBanner,
} from "@/components/dashboard/AccessBanners";
import DashboardSidePreview from "@/components/dashboard/DashboardSidePreview";
import {
  DashboardMain,
  DashboardSidePanel,
  DashboardSidePanelProvider,
} from "@/components/dashboard/DashboardSidePanel";
import { getDashboardContext } from "@/components/dashboard/context";
import { loadTopbarProfile, loadTopbarSummary } from "@/components/dashboard/mission-data";
import { loadCompanyAgents } from "@/components/dashboard/agents/storage";
import { DEFAULT_AGENT_NAME, loadUserAgentName } from "@/lib/agents/userAi";
import { isPlatformAdmin } from "@/lib/platform-admin";
import {
  DashboardTourProvider,
  DashboardTourUi,
} from "@/components/onboarding/DashboardTourShell";
import AddToHomeScreenPrompt from "@/components/AddToHomeScreenPrompt";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...buildPageMetadata({
    title: "Dashboard — ArchonPro",
    description: "Mission control voor je offertes, facturen, leads en AI-agents.",
    path: "/dashboard",
    noIndex: true,
  }),
  robots: { index: false, follow: false, nocache: true },
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await getDashboardContext();
  const { isPreviewMode, trial, supabase, companyId, user, impersonating, impersonatedCompanyName } = ctx;
  const showTrialBanner =
    !isPreviewMode && !impersonating && trial && trial.active && !trial.isPaid;
  const showImpersonationBanner = impersonating && Boolean(impersonatedCompanyName);
  const showSidePreview = Boolean(user) && !isPreviewMode && !impersonating;
  const showExtraBanner = isPreviewMode || showTrialBanner || showImpersonationBanner;
  const topbarOffset = showExtraBanner ? "top-28" : "top-14";
  const mainTop = showExtraBanner ? "pt-28" : "pt-14";
  const topbarSummary = await loadTopbarSummary(supabase, companyId);
  const topbarProfile = await loadTopbarProfile(supabase, user);
  const companyAgents = await loadCompanyAgents(supabase, companyId);
  const userAgentName = user
    ? await loadUserAgentName(supabase, user.id)
    : DEFAULT_AGENT_NAME;
  const showCeoConsole = user
    ? await isPlatformAdmin(user.id, user.email)
    : false;

  return (
    <DashboardThemeProvider>
      <AgentChatProvider
        companyId={companyId}
        userAgentName={userAgentName}
        initialCompanyAgents={companyAgents}
      >
      <DashboardTourProvider>
      <AgentNavigationProvider>
      <ProactiveAgentProvider enabled={!isPreviewMode && Boolean(companyId)}>
      <PendingApprovalsProvider
        companyId={companyId}
        enabled={!isPreviewMode && Boolean(companyId)}
      >
      <AgentCompletionsProvider
        companyId={companyId}
        enabled={!isPreviewMode && Boolean(companyId)}
      >
      <DashboardSidePanelProvider enabled={showSidePreview}>
      <a
        href="#dashboard-main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-sky-500 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-zinc-950"
      >
        Ga naar inhoud
      </a>
      <Sidebar isPreviewMode={isPreviewMode} showCeoConsole={showCeoConsole} />
      <Topbar
        initial={topbarSummary}
        profile={topbarProfile}
        isPreviewMode={isPreviewMode}
      />
      {isPreviewMode && <PreviewBanner />}
      {showTrialBanner && <TrialBanner trial={trial} />}
      {showImpersonationBanner && (
        <ImpersonationBanner companyName={impersonatedCompanyName!} />
      )}
      <DashboardMain
        id="dashboard-main"
        tabIndex={-1}
        showSidePanel={showSidePreview}
        className={`dashboard-main lg:pl-[220px] pb-[calc(5.25rem+env(safe-area-inset-bottom))] lg:pb-0 ${mainTop}`}
      >
        <div className="dashboard-main-body mx-auto flex h-full w-full max-w-[1800px] flex-col px-4 py-3 sm:px-5 lg:px-6 lg:py-3">
          <MobileSwipeNav>{children}</MobileSwipeNav>
        </div>
      </DashboardMain>
      {showSidePreview && (
        <DashboardSidePanel topbarOffset={topbarOffset}>
          <DashboardSidePreview
            supabase={supabase}
            companyId={companyId}
            userId={user?.id ?? null}
            isPreview={isPreviewMode}
          />
        </DashboardSidePanel>
      )}
      <MobileBottomNav isPreviewMode={isPreviewMode} />
      <AddToHomeScreenPrompt />
      <AgentChatWidget />
      <DashboardTourUi />
      </DashboardSidePanelProvider>
      </AgentCompletionsProvider>
      </PendingApprovalsProvider>
      </ProactiveAgentProvider>
      </AgentNavigationProvider>
      </DashboardTourProvider>
      </AgentChatProvider>
    </DashboardThemeProvider>
  );
}
