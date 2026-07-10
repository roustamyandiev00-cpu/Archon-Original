import type { ReactNode } from "react";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Bot,
  Building2,
  CreditCard,
  DollarSign,
  Headphones,
  Server,
  Sparkles,
  TrendingUp,
  UserPlus,
  Users,
  Zap,
} from "lucide-react";
import {
  AiUsageChart,
  CompanyGrowthChart,
  RevenueChart,
} from "@/components/dashboard/admin/CeoCharts";
import {
  formatEuro,
  formatLogin,
  formatRelative,
  planBadgeVariant,
  statusBadgeVariant,
  statusLabel,
  type KpiMetric,
} from "@/components/dashboard/admin/ceo-demo-data";
import { Badge } from "@/components/dashboard/admin/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/dashboard/admin/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/dashboard/admin/ui/table";
import { DemoBadge } from "@/components/dashboard/mission";
import type { CeoDashboardData } from "@/components/dashboard/admin/ceo-demo-data";

const kpiIcons: Record<KpiMetric["icon"], ReactNode> = {
  mrr: <DollarSign size={18} />,
  companies: <Building2 size={18} />,
  users: <Users size={18} />,
  registrations: <UserPlus size={18} />,
  "ai-requests": <Bot size={18} />,
  "ai-cost": <Sparkles size={18} />,
  subscriptions: <CreditCard size={18} />,
  alerts: <AlertTriangle size={18} />,
};

const kpiTone: Record<KpiMetric["tone"], string> = {
  sky: "bg-sky-500/10 text-sky-400",
  emerald: "bg-emerald-500/10 text-emerald-400",
  violet: "bg-violet-500/10 text-violet-400",
  amber: "bg-amber-500/10 text-amber-400",
  rose: "bg-rose-500/10 text-rose-400",
  cyan: "bg-cyan-500/10 text-cyan-400",
};

export default function CeoHomeDashboard({
  data,
  live = false,
}: {
  data: CeoDashboardData;
  live?: boolean;
}) {

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="relative overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/50 px-6 py-7 sm:px-8">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-sky-500/15 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-28 left-1/4 h-56 w-56 rounded-full bg-violet-500/10 blur-3xl"
        />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
              Platform Command Center
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl">
              CEO Dashboard
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400 sm:text-base">
              Intern overzicht voor ArchonPro — MRR, groei, AI-verbruik en
              platformgezondheid in één view.
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            {live ? (
              <Badge variant="success">Live data</Badge>
            ) : (
              <DemoBadge />
            )}
            <span className="text-xs text-zinc-500">
              Laatste sync{" "}
              <span className="font-mono text-zinc-400">
                {formatRelative(data.syncedAt)}
              </span>
            </span>
          </div>
        </div>
      </header>

      {/* KPI strip — 8 cards */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {data.kpis.map((kpi) => (
          <KpiCard key={kpi.id} kpi={kpi} />
        ))}
      </section>

      {/* Main grid: charts + table | sidebar widgets */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="space-y-6 xl:col-span-8">
          <ChartCard
            title="Revenue"
            description="Maandelijks terugkerende omzet (MRR) — laatste 12 maanden"
            icon={<TrendingUp size={16} className="text-sky-400" />}
          >
            <RevenueChart data={data.revenueChart} />
          </ChartCard>

          <ChartCard
            title="Company Growth"
            description="Actieve bouwbedrijven op het platform per maand"
            icon={<Building2 size={16} className="text-emerald-400" />}
          >
            <CompanyGrowthChart data={data.companyGrowthChart} />
          </ChartCard>

          <ChartCard
            title="AI Usage"
            description="AI-verzoeken en inference-kosten over het platform"
            icon={<Zap size={16} className="text-violet-400" />}
          >
            <AiUsageChart data={data.aiUsageChart} />
          </ChartCard>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Recent Companies</CardTitle>
                <CardDescription>
                  Laatst actieve klanten op het ArchonPro-platform
                </CardDescription>
              </div>
              <Badge variant="info">{data.companies.length} totaal</Badge>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead className="text-right">Users</TableHead>
                    <TableHead className="text-right">AI Usage</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.companies.map((company) => (
                    <TableRow key={company.id}>
                      <TableCell className="font-medium text-zinc-100">
                        {company.name}
                      </TableCell>
                      <TableCell>
                        <Badge variant={planBadgeVariant(company.plan)}>
                          {company.plan}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-zinc-400">
                        {company.users}
                      </TableCell>
                      <TableCell className="text-right font-mono text-zinc-400">
                        {company.aiUsage.toLocaleString("nl-BE")}
                      </TableCell>
                      <TableCell className="text-right font-mono text-zinc-300">
                        {formatEuro(company.revenue)}/m
                      </TableCell>
                      <TableCell className="font-mono text-xs text-zinc-500">
                        {formatLogin(company.lastLogin)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusBadgeVariant(company.status)}>
                          {statusLabel(company.status)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-4 xl:col-span-4">
          <WidgetCard
            title="Latest Payments"
            icon={<CreditCard size={16} className="text-emerald-400" />}
          >
            <ul className="divide-y divide-white/5">
              {data.payments.map((p) => (
                <li
                  key={p.id}
                  className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-zinc-200">
                      {p.company}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {p.plan} · {formatRelative(p.time)}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="font-mono text-sm text-zinc-100">
                      {formatEuro(p.amount)}
                    </span>
                    <Badge
                      variant={
                        p.status === "paid"
                          ? "success"
                          : p.status === "pending"
                            ? "warning"
                            : "danger"
                      }
                    >
                      {p.status}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          </WidgetCard>

          <WidgetCard
            title="Latest Registrations"
            icon={<UserPlus size={16} className="text-sky-400" />}
          >
            <ul className="divide-y divide-white/5">
              {data.registrations.map((r) => (
                <li key={r.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-zinc-200">
                        {r.company}
                      </p>
                      <p className="text-xs text-zinc-500">{r.contact}</p>
                    </div>
                    <Badge variant={planBadgeVariant(r.plan as "Starter" | "Pro" | "Enterprise")}>
                      {r.plan}
                    </Badge>
                  </div>
                  <p className="mt-1 text-[11px] text-zinc-600">
                    {formatRelative(r.time)}
                  </p>
                </li>
              ))}
            </ul>
          </WidgetCard>

          <WidgetCard
            title="Latest AI Errors"
            icon={<Bot size={16} className="text-rose-400" />}
            badge={
              <Badge variant="danger">
                {data.aiErrors.filter((e) => e.severity === "critical").length} critical
              </Badge>
            }
          >
            <ul className="divide-y divide-white/5">
              {data.aiErrors.map((e) => (
                <li key={e.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-start gap-2">
                    <Badge
                      variant={e.severity === "critical" ? "danger" : "warning"}
                    >
                      {e.severity}
                    </Badge>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-zinc-300">
                        {e.company} · {e.agent}
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-xs text-zinc-500">
                        {e.message}
                      </p>
                      <p className="mt-1 text-[10px] text-zinc-600">
                        {formatRelative(e.time)}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </WidgetCard>

          <WidgetCard
            title="Latest Support Tickets"
            icon={<Headphones size={16} className="text-violet-400" />}
          >
            <ul className="divide-y divide-white/5">
              {data.supportTickets.map((t) => (
                <li key={t.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-zinc-200">
                        {t.subject}
                      </p>
                      <p className="text-xs text-zinc-500">{t.company}</p>
                    </div>
                    <Badge
                      variant={
                        t.priority === "high"
                          ? "danger"
                          : t.priority === "medium"
                            ? "warning"
                            : "default"
                      }
                    >
                      {t.priority}
                    </Badge>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between">
                    <Badge
                      variant={
                        t.status === "resolved"
                          ? "success"
                          : t.status === "in_progress"
                            ? "info"
                            : "warning"
                      }
                    >
                      {t.status.replace("_", " ")}
                    </Badge>
                    <span className="text-[10px] text-zinc-600">
                      {formatRelative(t.time)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </WidgetCard>

          <WidgetCard
            title="System Status"
            icon={<Server size={16} className="text-cyan-400" />}
          >
            <ul className="space-y-2">
              {data.systemStatus.map((service) => (
                <li
                  key={service.name}
                  className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2.5"
                >
                  <span className="text-sm text-zinc-300">{service.name}</span>
                  <div className="flex items-center gap-2">
                    {service.latency && (
                      <span className="font-mono text-[10px] text-zinc-600">
                        {service.latency}
                      </span>
                    )}
                    <Badge
                      variant={
                        service.status === "operational"
                          ? "success"
                          : service.status === "degraded"
                            ? "warning"
                            : "danger"
                      }
                    >
                      {service.status}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          </WidgetCard>
        </aside>
      </div>
    </div>
  );
}

function KpiCard({ kpi }: { kpi: KpiMetric }) {
  return (
    <Card className="group overflow-hidden transition-colors hover:border-white/15">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
              {kpi.label}
            </p>
            <p className="mt-2 font-mono text-2xl font-semibold tracking-tight text-zinc-50 sm:text-[1.65rem]">
              {kpi.value}
            </p>
            <div className="mt-2 flex items-center gap-1.5 text-xs">
              <span
                className={`inline-flex items-center gap-0.5 font-medium ${
                  kpi.positive ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {kpi.positive ? (
                  <ArrowUpRight size={13} />
                ) : (
                  <ArrowDownRight size={13} />
                )}
                {kpi.change}
              </span>
            </div>
          </div>
          <span
            className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${kpiTone[kpi.tone]}`}
          >
            {kpiIcons[kpi.icon]}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function ChartCard({
  title,
  description,
  icon,
  children,
}: {
  title: string;
  description: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start gap-3 space-y-0">
        <span className="mt-0.5 grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-white/[0.03]">
          {icon}
        </span>
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function WidgetCard({
  title,
  icon,
  badge,
  children,
}: {
  title: string;
  icon: ReactNode;
  badge?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 py-3.5">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-white/[0.03]">
            {icon}
          </span>
          <CardTitle className="text-[13px]">{title}</CardTitle>
        </div>
        {badge}
      </CardHeader>
      <CardContent className="pt-0">{children}</CardContent>
    </Card>
  );
}
