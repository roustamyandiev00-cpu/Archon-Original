import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CompanyDetailView from "@/components/dashboard/admin/CompanyDetailView";
import {
  getCompanyDetail,
} from "@/components/dashboard/admin/company-detail-data";
import { getCompaniesManagementData } from "@/components/dashboard/admin/companies-data";

type CompanyDetailPageProps = {
  params: Promise<{ companyId: string }>;
};

export async function generateStaticParams() {
  return getCompaniesManagementData().map((company) => ({
    companyId: company.id,
  }));
}

export async function generateMetadata({
  params,
}: CompanyDetailPageProps): Promise<Metadata> {
  const { companyId } = await params;
  const detail = getCompanyDetail(companyId);

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
  const detail = getCompanyDetail(companyId);

  if (!detail) notFound();

  return <CompanyDetailView detail={detail} />;
}
