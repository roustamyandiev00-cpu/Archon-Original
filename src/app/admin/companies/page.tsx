import type { Metadata } from "next";
import {
  Ban,
  Building2,
  Clock3,
  ShieldCheck,
} from "lucide-react";
import CompaniesDataTable from "@/components/dashboard/admin/CompaniesDataTable";
import {
  fetchManagedCompanies,
  getCompaniesStats,
} from "@/lib/admin/platform-data";
import { requirePlatformAdmin } from "@/lib/platform-admin";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Companies — CEO Dashboard — ArchonPro",
};

const statIcons = {
  total: <Building2 size={18} />,
  active: <ShieldCheck size={18} />,
  trial: <Clock3 size={18} />,
  suspended: <Ban size={18} />,
} as const;

const statTones = {
  total: "bg-sky-500/10 text-sky-400",
  active: "bg-emerald-500/10 text-emerald-400",
  trial: "bg-amber-500/10 text-amber-400",
  suspended: "bg-rose-500/10 text-rose-400",
} as const;

export default async function CompaniesPage() {
  const { serviceSupabase } = await requirePlatformAdmin();
  const companies = await fetchManagedCompanies(serviceSupabase);
  const stats = getCompaniesStats(companies);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 border-b border-white/10 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
            CEO Dashboard / Companies
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl">
            Companies Management
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">
            Live overzicht van alle klanten, abonnementen, AI-verbruik en status.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="info">CEO module</Badge>
          <Badge variant="success">Live data</Badge>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.id} className="overflow-hidden">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
              <div>
                <CardDescription className="uppercase tracking-wider">
                  {stat.label}
                </CardDescription>
                <CardTitle className="mt-2 font-mono text-2xl">
                  {stat.value}
                </CardTitle>
              </div>
              <span
                className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${statTones[stat.id]}`}
              >
                {statIcons[stat.id]}
              </span>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xs text-zinc-500">{stat.detail}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <CompaniesDataTable companies={companies} />
    </div>
  );
}
