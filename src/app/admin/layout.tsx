/**
 * Platform-admin root layout — src/app/admin/layout.tsx
 *
 * Bewust NIET overgenomen uit src/app/dashboard/layout.tsx:
 * - getDashboardContext / companyId / tenant-context
 * - AgentChatProvider / AgentChatWidget
 * - AgentNavigationProvider / ProactiveAgentProvider
 * - PendingApprovalsProvider / AgentCompletionsProvider
 * - DashboardSidePanelProvider / DashboardSidePreview
 * - DashboardThemeProvider (geen dependency in admin-componenten)
 * - dashboard-theme.css (scoped op .dashboard-root, niet gebruikt in admin-UI)
 * - Sidebar (tenant-zijbalk)
 * - Topbar (tenant-topbar met tenant-data)
 * - MobileBottomNav / MobileSwipeNav
 * - TrialBanner / PreviewBanner / ImpersonationBanner
 * - DashboardTourProvider / OnboardingSeedClient
 * - AddToHomeScreenPrompt / AgentChatWidget
 *
 * Auth-gate: requirePlatformAdmin() — server-side, redirectt bij ontbreken
 * van platformrechten naar /dashboard/command-center.
 * Tenantrollen geven nooit toegang; companyId wordt hier nooit geladen.
 */

import type { Metadata } from "next";
import { requirePlatformAdmin } from "@/lib/platform-admin";
import AdminLayoutClient from "@/components/dashboard/admin/AdminLayoutClient";

export const metadata: Metadata = {
  title: {
    template: "%s — CEO Console — ArchonPro",
    default: "CEO Console — ArchonPro",
  },
  robots: { index: false, follow: false, nocache: true },
};

export default async function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Auth-gate: redirectt naar /dashboard/command-center bij onvoldoende rechten.
  // Tenantrollen geven geen toegang; platformrechten worden server-side bepaald.
  await requirePlatformAdmin();

  return (
    <div className="min-h-dvh bg-[#08090B] text-zinc-100">
      {/* Skip-link voor toegankelijkheid */}
      <a
        href="#admin-main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-sky-500 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-zinc-950"
      >
        Ga naar inhoud
      </a>

      <AdminLayoutClient>{children}</AdminLayoutClient>
    </div>
  );
}
