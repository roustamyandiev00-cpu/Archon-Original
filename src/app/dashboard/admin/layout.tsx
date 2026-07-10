import { requirePlatformAdmin } from "@/lib/platform-admin";
import AdminSidebar from "@/components/dashboard/admin/AdminSidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePlatformAdmin();

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 lg:flex-row">
      <div className="lg:w-64 lg:shrink-0">
        <div className="lg:sticky lg:top-24">
          <AdminSidebar />
        </div>
      </div>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
