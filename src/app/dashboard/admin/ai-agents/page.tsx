import Link from "next/link";
import type { Metadata } from "next";
import { Bot, CheckCircle2, Clock3, Zap } from "lucide-react";
import { fetchAiFleetOverview } from "@/lib/admin/platform-data";
import { requirePlatformAdmin } from "@/lib/platform-admin";
import { Badge } from "@/components/ui/badge";
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
  title: "AI Agents — CEO Dashboard — ArchonPro",
};

export default async function AdminAiAgentsPage() {
  const { serviceSupabase } = await requirePlatformAdmin();
  const fleet = await fetchAiFleetOverview(serviceSupabase);

  const totalPending = fleet.reduce((sum, row) => sum + row.pendingActions, 0);
  const totalExecuted = fleet.reduce((sum, row) => sum + row.executedToday, 0);
  const lowCredits = fleet.filter((row) => row.creditsRemaining < 100).length;

  return (
    <div className="space-y-6">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
          CEO Dashboard / AI Agents
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-50 sm:text-3xl">
          AI Agent Fleet
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-400">
          Monitor alle AI-agents per klant: goedkeuringen, uitvoeringen, credits en activiteit.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardDescription>Open goedkeuringen</CardDescription>
            <Clock3 size={18} className="text-amber-400" />
          </CardHeader>
          <CardContent>
            <CardTitle className="font-mono text-2xl">{totalPending}</CardTitle>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardDescription>Uitgevoerd vandaag</CardDescription>
            <CheckCircle2 size={18} className="text-emerald-400" />
          </CardHeader>
          <CardContent>
            <CardTitle className="font-mono text-2xl">{totalExecuted}</CardTitle>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardDescription>Lage credits</CardDescription>
            <Zap size={18} className="text-rose-400" />
          </CardHeader>
          <CardContent>
            <CardTitle className="font-mono text-2xl">{lowCredits}</CardTitle>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot size={18} className="text-violet-400" />
            Agent-status per bedrijf
          </CardTitle>
          <CardDescription>
            Nova, Schatter, Facturatie en Opvolger over alle klanten
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bedrijf</TableHead>
                <TableHead className="text-right">Agents</TableHead>
                <TableHead className="text-right">Pending</TableHead>
                <TableHead className="text-right">Vandaag</TableHead>
                <TableHead className="text-right">Credits</TableHead>
                <TableHead>Laatste activiteit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fleet.map((row) => (
                <TableRow key={row.companyId}>
                  <TableCell>
                    <Link
                      href={`/dashboard/admin/companies/${row.companyId}`}
                      className="font-medium text-zinc-100 hover:text-sky-300"
                    >
                      {row.companyName}
                    </Link>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {row.agentsConfigured}
                  </TableCell>
                  <TableCell className="text-right">
                    {row.pendingActions > 0 ? (
                      <Badge variant="warning">{row.pendingActions}</Badge>
                    ) : (
                      <span className="font-mono text-zinc-500">0</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-mono text-zinc-400">
                    {row.executedToday}
                  </TableCell>
                  <TableCell className="text-right font-mono text-zinc-400">
                    {row.creditsRemaining}
                  </TableCell>
                  <TableCell className="text-xs text-zinc-500">
                    {row.lastActivity
                      ? new Date(row.lastActivity).toLocaleString("nl-BE")
                      : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
