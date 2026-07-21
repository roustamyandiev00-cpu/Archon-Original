import Link from "next/link";
import type { Metadata } from "next";
import { Briefcase, FileText, Receipt, Users } from "lucide-react";
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
  const { serviceSupabase } = await requirePlatformAdmin();
  const crm = await fetchCrmOverview(serviceSupabase);

  const stats = [
    {
      label: "Klanten",
      value: crm.totalCustomers,
      icon: <Users size={18} />,
      tone: "text-sky-400 bg-sky-500/10",
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

  return (
    <div className="space-y-6">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
          CEO Dashboard / CRM
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-50 sm:text-3xl">
          CRM Platform-overzicht
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-400">
          Alle klanten, deals, offertes en openstaande facturen over het hele platform.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
              {crm.recentDeals.map((deal) => (
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
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
