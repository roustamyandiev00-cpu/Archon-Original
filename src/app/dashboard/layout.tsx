import type { Metadata } from "next";
import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";

export const metadata: Metadata = {
  title: "Dashboard — ArchonPro",
  description: "Mission control voor je offertes, facturen, leads en AI-agents.",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <Sidebar />
      <Topbar />
      <main className="pt-14 lg:pl-[220px]">
        <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6">{children}</div>
      </main>
    </div>
  );
}
