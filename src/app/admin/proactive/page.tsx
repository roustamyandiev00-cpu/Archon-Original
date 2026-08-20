import Link from "next/link";
import type { Metadata } from "next";
import { AlertTriangle, Info, Radar } from "lucide-react";
import { fetchCeoInsights } from "@/lib/admin/ceo-insights";
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
  title: "Agentacties — AI Control Center — ArchonPro",
};

const severityVariant = {
  critical: "danger",
  warning: "warning",
  info: "info",
} as const;

const categoryLabel = {
  crm: "Klantaccount",
  ai: "AI Agent",
  billing: "Billing",
  growth: "Groei",
  risk: "Risico",
} as const;

export default async function AdminProactivePage() {
  const { serviceSupabase } = await requirePlatformAdmin();
  const insights = await fetchCeoInsights(serviceSupabase);

  const critical = insights.filter((item) => item.severity === "critical").length;
  const warnings = insights.filter((item) => item.severity === "warning").length;

  return (
    <div className="space-y-6">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
          AI Control Center / Agentacties
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-50 sm:text-3xl">
          Agentacties en signalen
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-400">
          Automatische signalen over klantaccounts, AI-fouten, lage credits,
          inactieve bedrijven en groei.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Totaal signalen</CardDescription>
            <CardTitle className="font-mono text-2xl">{insights.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Kritiek</CardDescription>
            <CardTitle className="font-mono text-2xl text-rose-400">
              {critical}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Waarschuwingen</CardDescription>
            <CardTitle className="font-mono text-2xl text-amber-400">
              {warnings}
            </CardTitle>
          </CardHeader>
        </Card>
      </section>

      <div className="space-y-3">
        {insights.length === 0 ? (
          <Card>
            <CardContent className="flex items-center gap-3 py-8 text-zinc-400">
              <Info size={18} />
              Geen actieve signalen — alles ziet er goed uit.
            </CardContent>
          </Card>
        ) : (
          insights.map((insight) => (
            <Card key={insight.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={severityVariant[insight.severity]}>
                      {insight.severity}
                    </Badge>
                    <Badge>{categoryLabel[insight.category]}</Badge>
                    {insight.companyName ? (
                      <span className="text-xs text-zinc-500">
                        {insight.companyName}
                      </span>
                    ) : null}
                  </div>
                  <CardTitle className="text-base">{insight.title}</CardTitle>
                  <CardDescription>{insight.detail}</CardDescription>
                </div>
                <Radar
                  size={18}
                  className={
                    insight.severity === "critical"
                      ? "text-rose-400"
                      : insight.severity === "warning"
                        ? "text-amber-400"
                        : "text-sky-400"
                  }
                />
              </CardHeader>
              {insight.actionHref ? (
                <CardContent className="pt-0">
                  <Link
                    href={insight.actionHref}
                    className="inline-flex items-center gap-2 text-sm text-sky-300 hover:underline"
                  >
                    <AlertTriangle size={14} />
                    {insight.actionLabel ?? "Bekijken"}
                  </Link>
                </CardContent>
              ) : null}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
