import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CompanyDetailView from "@/components/dashboard/admin/CompanyDetailView";
import { fetchCompanyDetail } from "@/lib/admin/platform-data";
import { requirePlatformAdmin } from "@/lib/platform-admin";

type CompanyDetailPageProps = {
  params: Promise<{ companyId: string }>;
};

export async function generateMetadata({
  params,
}: CompanyDetailPageProps): Promise<Metadata> {
  const { companyId } = await params;
  const id = Number(companyId);
  if (!Number.isFinite(id)) {
    return { title: "Company Detail — ArchonPro" };
  }

  const { serviceSupabase } = await requirePlatformAdmin();
  const detail = await fetchCompanyDetail(serviceSupabase, id);

  return {
    title: detail
      ? `${detail.company.name} — Company Detail — ArchonPro`
      : "Company Detail — ArchonPro",
  };
}

export default async function CompanyDetailPage({
  params,
}: CompanyDetailPageProps) {
  const { companyId } = await params;
  const id = Number(companyId);
  if (!Number.isFinite(id)) notFound();

  const { serviceSupabase } = await requirePlatformAdmin();
  const detail = await fetchCompanyDetail(serviceSupabase, id);
  if (!detail) notFound();

  return <CompanyDetailView detail={detail} />;
}
