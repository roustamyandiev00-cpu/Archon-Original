import type { Metadata } from "next";
import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";
import { PreviewBanner, TrialBanner } from "@/components/dashboard/AccessBanners";
import { getDashboardContext } from "@/components/dashboard/context";

export const metadata: Metadata = {
  title: "Dashboard — ArchonPro",
  description: "Mission control voor je offertes, facturen, leads en AI-agents.",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isPreviewMode, trial } = await getDashboardContext();
  const showTrialBanner = !isPreviewMode && trial && trial.active && !trial.isPaid;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <Sidebar isPreviewMode={isPreviewMode} />
      <Topbar />
      {isPreviewMode && <PreviewBanner />}
      {showTrialBanner && <TrialBanner trial={trial} />}
      <main className={`lg:pl-[220px] ${isPreviewMode || showTrialBanner ? "pt-28" : "pt-14"}`}>
        <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6">{children}</div>
      </main>
    </div>
  );
}
