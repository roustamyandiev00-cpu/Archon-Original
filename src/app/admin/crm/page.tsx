import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  Bot,
  Briefcase,
  Building2,
  FileText,
  Receipt,
  ShieldCheck,
  Users,
} from "lucide-react";
import { fetchCrmOverview } from "@/lib/admin/platform-data";
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
  title: "CRM — CEO Dashboard — ArchonPro",
};

export default async function AdminCrmPage() {
  redirect("/admin/companies");

  const { serviceSupabase } = await requirePlatformAdmin();
  const crm = await fetchCrmOverview(serviceSupabase);

  const stats = [
    {
      label: "Klantaccounts",
      value: crm.totalAccounts,
      icon: <Building2 size={18} />,
      tone: "text-sky-400 bg-sky-500/10",
    },
    {
      label: "CRM-contacten",
      value: crm.totalCustomers,
      icon: <Users size={18} />,
      tone: "text-cyan-400 bg-cyan-500/10",
    },
    {
      label: "Open deals",
      value: crm.openDeals,
      icon: <Briefcase size={18} />,
      tone: "text-violet-400 bg-violet-500/10",
    },
    {
      label: "Offertes",
      value: crm.totalOffertes,
      icon: <FileText size={18} />,
      tone: "text-emerald-400 bg-emerald-500/10",
    },
    {
      label: "Achterstallige facturen",
      value: crm.overdueFacturen,
      icon: <Receipt size={18} />,
      tone: "text-rose-400 bg-rose-500/10",
    },
  ];

  const statusLabels = {
    active: "Actief",
    trial: "Proefperiode",
    suspended: "Opgeschort",
  } as const;

  const statusVariants = {
    active: "success",
    trial: "warning",
    suspended: "danger",
  } as const;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 border-b border-white/10 pb-6 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-3xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
            Platformbeheer / Klantaccounts
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl">
            CRM Platformoverzicht
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">
            Beheer klantaccounts en open het juiste bedrijfsdossier voor gebruikers,
            AI-tegoed, betalingen en noodzakelijke supportinformatie.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/ai-tokens"
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.05] px-3 text-sm font-medium text-zinc-200 transition-colors hover:bg-white/[0.08]"
          >
            <Bot size={15} /> AI-tokens
          </Link>
          <Link
            href="/admin/companies"
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-sky-500/40 bg-sky-500/15 px-3 text-sm font-medium text-sky-100 transition-colors hover:bg-sky-500/20"
          >
            Alle bedrijven <ArrowRight size={15} />
          </Link>
        </div>
      </header>

      <section
        aria-label="Verantwoord gegevensgebruik"
        className="flex items-start gap-3 rounded-2xl border border-sky-500/20 bg-sky-500/[0.06] px-4 py-3"
      >
        <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-sky-500/10 text-sky-300">
          <ShieldCheck size={17} />
        </span>
        <div>
          <p className="text-sm font-medium text-zinc-100">Beperkte beheerweergave</p>
          <p className="mt-0.5 max-w-4xl text-xs leading-relaxed text-zinc-400">
            Gebruik accountgegevens alleen voor support, facturatie, veiligheid en
            accountbeheer. Wachtwoorden, sessietokens en API-sleutels worden hier niet
            getoond.
          </p>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardDescription>{stat.label}</CardDescription>
              <span className={`grid h-9 w-9 place-items-center rounded-lg ${stat.tone}`}>
                {stat.icon}
              </span>
            </CardHeader>
            <CardContent>
              <CardTitle className="font-mono text-2xl">{stat.value}</CardTitle>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card>
        <CardHeader className="gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Klantaccounts beheren</CardTitle>
            <CardDescription>
              De 10 recentste accounts — open een dossier voor gericht beheer
            </CardDescription>
          </div>
          <Badge variant="info">{crm.totalAccounts} accounts</Badge>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <Table className="min-w-[980px]">
            <TableHeader>
              <TableRow>
                <TableHead>Bedrijf en eigenaar</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Gebruikers</TableHead>
                <TableHead className="text-right">AI-tegoed</TableHead>
                <TableHead>Laatste activiteit</TableHead>
                <TableHead className="text-right">Beheer</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {crm.accounts.length > 0 ? (
                crm.accounts.map((account) => (
                  <TableRow key={account.companyId}>
                    <TableCell>
                      <p className="font-medium text-zinc-100">{account.companyName}</p>
                      <p className="mt-0.5 text-xs text-zinc-500">
                        {account.ownerName} · {account.ownerEmail}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="violet">{account.plan}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariants[account.status]}>
                        {statusLabels[account.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {account.activeUsers.toLocaleString("nl-BE")}
                    </TableCell>
                    <TableCell className="text-right">
                      <p className="font-mono text-zinc-200">
                        {account.creditsRemaining.toLocaleString("nl-BE")}
                      </p>
                      <p className="text-[11px] text-zinc-500">
                        {account.creditsUsed.toLocaleString("nl-BE")} gebruikt
                      </p>
                    </TableCell>
                    <TableCell className="text-xs text-zinc-500">
                      {new Date(account.lastActivity).toLocaleString("nl-BE")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`/admin/companies/${account.companyId}`}
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-sky-500/30 bg-sky-500/10 px-2.5 text-xs font-medium text-sky-200 transition-colors hover:bg-sky-500/15"
                        aria-label={`Beheer ${account.companyName}`}
                      >
                        Open dossier <ArrowRight size={13} />
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-zinc-500">
                    Er zijn nog geen klantaccounts geregistreerd.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          {crm.totalAccounts > crm.accounts.length ? (
            <div className="flex items-center justify-between gap-3 border-t border-white/10 px-4 py-3 sm:px-6">
              <p className="text-xs text-zinc-500">
                {crm.accounts.length} van {crm.totalAccounts} accounts getoond
              </p>
              <Link
                href="/admin/companies"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-300 hover:text-sky-200"
              >
                Bekijk alle accounts <ArrowRight size={13} />
              </Link>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recente deals</CardTitle>
          <CardDescription>
            Pipeline-activiteit over alle bedrijven — {crm.wonDeals} gewonnen,{" "}
            {crm.openDeals} open
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Deal</TableHead>
                <TableHead>Bedrijf</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead className="text-right">Waarde</TableHead>
                <TableHead>Laatste update</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {crm.recentDeals.length > 0 ? (
                crm.recentDeals.map((deal) => (
                  <TableRow key={deal.id}>
                    <TableCell className="font-medium text-zinc-100">
                      {deal.title}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/admin/companies/${deal.companyId}`}
                        className="text-sky-300 hover:underline"
                      >
                        {deal.companyName}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant="info">{deal.stage}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      €{deal.value.toLocaleString("nl-BE")}
                    </TableCell>
                    <TableCell className="text-xs text-zinc-500">
                      {new Date(deal.updatedAt).toLocaleString("nl-BE")}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-zinc-500">
                    Er is nog geen recente dealactiviteit.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
