import type { Metadata } from "next";
import { requirePlatformAdmin } from "@/lib/platform-admin";
import AdminSidebar from "@/components/dashboard/admin/AdminSidebar";

export const metadata: Metadata = {
  title: "Platformbeheer — ArchonPro",
  robots: { index: false, follow: false, nocache: true },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePlatformAdmin();

  return (
    <main className="relative min-h-screen overflow-hidden bg-zinc-950 text-zinc-100">
      <a
        href="#admin-content"
        className="sr-only z-[100] rounded-lg bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-950 focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Naar beheerinhoud
      </a>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.14),transparent_44%),radial-gradient(circle_at_top_right,rgba(139,92,246,0.1),transparent_40%)]"
      />
      <div className="relative mx-auto flex w-full max-w-[1800px] flex-col gap-6 px-4 py-4 sm:px-6 lg:min-h-screen lg:flex-row lg:px-8 lg:py-6">
        <div className="lg:w-64 lg:shrink-0">
          <div className="lg:sticky lg:top-6">
            <AdminSidebar />
          </div>
        </div>
        <section id="admin-content" tabIndex={-1} className="min-w-0 flex-1 pb-10">
          {children}
        </section>
      </div>
    </main>
  );
}
