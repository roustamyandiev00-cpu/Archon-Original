import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  Bot,
  Building2,
  Filter,
  ListFilter,
  ScrollText,
} from "lucide-react";
import {
  fetchAiLogOverview,
  parseAiLogFilters,
} from "@/lib/admin/ai-logs";
import { requirePlatformAdmin } from "@/lib/platform-admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata: Metadata = {
  title: "AI-logs — Platformbeheer — ArchonPro",
};

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function formatAction(value: string): string {
  return value.replace(/[_-]+/g, " ");
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("nl-BE", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function AdminAiLogsPage({ searchParams }: PageProps) {
  const filters = parseAiLogFilters(await searchParams);
  const { serviceSupabase } = await requirePlatformAdmin();
  const overview = await fetchAiLogOverview(serviceSupabase, filters);

  const visibleErrors = overview.entries.filter(
    (entry) => entry.errorMessage,
  ).length;
  const visibleAgents = new Set(
    overview.entries.map((entry) => entry.agentName),
  ).size;
  const visibleCompanies = new Set(
    overview.entries.map((entry) => entry.companyId),
  ).size;

  return (
    <div className="space-y-6">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
          AI / Toezicht
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-50 sm:text-3xl">
          AI-logs
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-zinc-400">
          Alleen-lezen overzicht van agentactiviteit over alle bedrijven. Invoer,
          uitvoer en courante geheimen worden niet aan de browser doorgegeven.
        </p>
      </header>

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <SummaryCard
          label="Gevonden"
          value={overview.totalCount}
          detail={overview.totalCount > 200 ? "Laatste 200 zichtbaar" : "Binnen selectie"}
          icon={<ScrollText size={17} aria-hidden="true" />}
        />
        <SummaryCard
          label="Fouten zichtbaar"
          value={visibleErrors}
          detail="In geladen regels"
          icon={<AlertTriangle size={17} aria-hidden="true" />}
          tone="danger"
        />
        <SummaryCard
          label="Agents zichtbaar"
          value={visibleAgents}
          detail="Unieke agents"
          icon={<Bot size={17} aria-hidden="true" />}
          tone="violet"
        />
        <SummaryCard
          label="Bedrijven zichtbaar"
          value={visibleCompanies}
          detail="Binnen selectie"
          icon={<Building2 size={17} aria-hidden="true" />}
          tone="success"
        />
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListFilter size={17} className="text-sky-400" aria-hidden="true" />
            Filters
          </CardTitle>
          <CardDescription>
            Verfijn op bedrijf, agent, resultaat en periode.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <FilterField
              label="Bedrijf"
              name="company"
              defaultValue={filters.companyId?.toString() ?? ""}
            >
              <option value="">Alle bedrijven</option>
              {overview.companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </FilterField>

            <FilterField
              label="Agent"
              name="agent"
              defaultValue={filters.agent ?? ""}
            >
              <option value="">Alle agents</option>
              {overview.agents.map((agent) => (
                <option key={agent} value={agent}>
                  {agent}
                </option>
              ))}
            </FilterField>

            <FilterField
              label="Resultaat"
              name="status"
              defaultValue={filters.status}
            >
              <option value="all">Alles</option>
              <option value="success">Geslaagd</option>
              <option value="error">Fout</option>
            </FilterField>

            <FilterField
              label="Periode"
              name="period"
              defaultValue={filters.period}
            >
              <option value="24h">Laatste 24 uur</option>
              <option value="7d">Laatste 7 dagen</option>
              <option value="30d">Laatste 30 dagen</option>
              <option value="all">Alles</option>
            </FilterField>

            <div className="flex items-end gap-2">
              <Button type="submit" variant="default" className="flex-1 justify-center">
                <Filter size={15} aria-hidden="true" />
                Toepassen
              </Button>
              <Link
                href="/admin/ai-logs"
                className="inline-flex h-9 items-center rounded-lg border border-white/10 px-3 text-sm font-medium text-zinc-400 transition-colors hover:bg-white/[0.06] hover:text-zinc-100"
              >
                Wissen
              </Link>
            </div>

          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Activiteitenlogboek</CardTitle>
          <CardDescription>
            Nieuwste activiteit eerst, maximaal 200 regels per selectie.
          </CardDescription>
        </CardHeader>
        {overview.entries.length === 0 ? (
          <CardContent className="py-14 text-center">
            <span className="mx-auto grid h-11 w-11 place-items-center rounded-2xl bg-white/5 text-zinc-500">
              <ScrollText size={20} aria-hidden="true" />
            </span>
            <p className="mt-4 text-sm font-medium text-zinc-200">
              Geen AI-activiteit gevonden
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Pas de filters aan of controleer later opnieuw.
            </p>
          </CardContent>
        ) : (
          <CardContent className="overflow-x-auto p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-32">Tijdstip</TableHead>
                  <TableHead className="min-w-44">Bedrijf</TableHead>
                  <TableHead className="min-w-32">Agent</TableHead>
                  <TableHead className="min-w-36">Actie</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="min-w-80">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overview.entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="whitespace-nowrap text-xs text-zinc-500">
                      {formatDate(entry.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/admin/companies/${entry.companyId}`}
                        className="font-medium text-zinc-100 transition-colors hover:text-sky-300"
                      >
                        {entry.companyName}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm text-zinc-300">
                      {entry.agentName}
                    </TableCell>
                    <TableCell className="text-xs capitalize text-zinc-400">
                      {formatAction(entry.actionType)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={entry.errorMessage ? "danger" : "success"}>
                        {entry.errorMessage ? "Fout" : "Geslaagd"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm leading-relaxed text-zinc-300">
                        {entry.message}
                      </p>
                      {entry.errorMessage ? (
                        <p className="mt-1 text-xs leading-relaxed text-rose-300/80">
                          {entry.errorMessage}
                        </p>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        )}
      </Card>
    </div>
  );
}

function FilterField({
  label,
  name,
  defaultValue,
  children,
}: {
  label: string;
  name: string;
  defaultValue: string;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-1.5 text-xs font-medium text-zinc-400">
      {label}
      <select
        name={name}
        defaultValue={defaultValue}
        className="h-9 rounded-lg border border-white/10 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none transition-colors focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/15"
      >
        {children}
      </select>
    </label>
  );
}

function SummaryCard({
  label,
  value,
  detail,
  icon,
  tone = "info",
}: {
  label: string;
  value: number;
  detail: string;
  icon: ReactNode;
  tone?: "info" | "danger" | "success" | "violet";
}) {
  const toneClasses = {
    info: "bg-sky-500/10 text-sky-400",
    danger: "bg-rose-500/10 text-rose-400",
    success: "bg-emerald-500/10 text-emerald-400",
    violet: "bg-violet-500/10 text-violet-400",
  };

  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-3 p-4 sm:p-5">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
            {label}
          </p>
          <p className="mt-2 font-mono text-2xl font-semibold text-zinc-50">
            {value.toLocaleString("nl-BE")}
          </p>
          <p className="mt-1 text-xs text-zinc-500">{detail}</p>
        </div>
        <span className={`grid h-9 w-9 place-items-center rounded-xl ${toneClasses[tone]}`}>
          {icon}
        </span>
      </CardContent>
    </Card>
  );
}
