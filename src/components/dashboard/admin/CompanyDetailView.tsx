"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  Ban,
  Bot,
  Building2,
  CalendarClock,
  CreditCard,
  ExternalLink,
  FileText,
  FolderKanban,
  KeyRound,
  Lock,
  Receipt,
  ShieldCheck,
  Users,
  Zap,
} from "lucide-react";
import CompanyAiUsageChart from "@/components/dashboard/admin/CompanyAiUsageChart";
import { actAsCompanyAction } from "@/app/admin/impersonation-actions";
import {
  createStripeBillingPortalAction,
  sendPlatformInvoiceAction,
  syncPlatformInvoicesAction,
  updateCompanyStatusAction,
} from "@/app/admin/actions";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatTokens,
  planLabels,
  statusLabels,
  type CompanyLogoTone,
  type CompanyPlan,
  type CompanyStatus,
} from "@/components/dashboard/admin/companies-data";
import type {
  ActivityEvent,
  CompanyDetail,
  CompanyInvoice,
  CompanyProject,
  CompanyQuote,
  CompanyUser,
  PaymentRecord,
  SecurityEvent,
  SystemNote,
} from "@/components/dashboard/admin/company-detail-data";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
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
import { cn } from "@/components/ui/utils";

type TabId =
  | "overview"
  | "users"
  | "projects"
  | "quotes"
  | "invoices"
  | "ai"
  | "billing"
  | "activity"
  | "security"
  | "settings";

const tabs: Array<{ id: TabId; label: string; icon: ReactNode }> = [
  { id: "overview", label: "Overzicht", icon: <Building2 size={14} /> },
  { id: "users", label: "Gebruikers", icon: <Users size={14} /> },
  { id: "projects", label: "Projecten", icon: <FolderKanban size={14} /> },
  { id: "quotes", label: "Offertes", icon: <FileText size={14} /> },
  { id: "invoices", label: "Facturen", icon: <Receipt size={14} /> },
  { id: "ai", label: "AI-gebruik", icon: <Bot size={14} /> },
  { id: "billing", label: "Abonnement", icon: <CreditCard size={14} /> },
  { id: "activity", label: "Activiteit", icon: <Activity size={14} /> },
  { id: "security", label: "Beveiliging", icon: <ShieldCheck size={14} /> },
  { id: "settings", label: "Instellingen", icon: <KeyRound size={14} /> },
];

const logoToneClasses: Record<CompanyLogoTone, string> = {
  sky: "border-sky-400/30 bg-sky-500/10 text-sky-300",
  emerald: "border-emerald-400/30 bg-emerald-500/10 text-emerald-300",
  violet: "border-violet-400/30 bg-violet-500/10 text-violet-300",
  amber: "border-amber-400/30 bg-amber-500/10 text-amber-300",
  rose: "border-rose-400/30 bg-rose-500/10 text-rose-300",
  cyan: "border-cyan-400/30 bg-cyan-500/10 text-cyan-300",
};

const planBadgeVariants: Record<CompanyPlan, BadgeVariant> = {
  Starter: "default",
  Business: "info",
  Enterprise: "violet",
};

const statusBadgeVariants: Record<CompanyStatus, BadgeVariant> = {
  active: "success",
  trial: "warning",
  suspended: "danger",
};

const subscriptionStatusLabels: Record<CompanyDetail["subscriptionStatus"], string> = {
  active: "Actief",
  trialing: "Proefperiode",
  past_due: "Betaling achterstallig",
  paused: "Gepauzeerd",
};

const tableStatusVariants = {
  active: "success",
  invited: "warning",
  disabled: "danger",
  planning: "info",
  paused: "warning",
  completed: "success",
  draft: "default",
  sent: "info",
  accepted: "success",
  expired: "danger",
  paid: "success",
  open: "info",
  overdue: "danger",
  scheduled: "info",
  failed: "danger",
  uncollectible: "danger",
  void: "default",
} satisfies Record<string, BadgeVariant>;

export default function CompanyDetailView({
  detail,
}: {
  detail: CompanyDetail;
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [viewAsError, setViewAsError] = useState<string | null>(null);
  const [viewAsPending, setViewAsPending] = useState(false);
  const [statusPending, setStatusPending] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    tone: "success" | "error" | "warning";
    text: string;
  } | null>(null);
  const { company } = detail;

  async function handleViewAsCompany() {
    setViewAsError(null);
    setViewAsPending(true);
    try {
      await actAsCompanyAction(Number(company.id));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Onbekende fout.";
      if (!message.includes("NEXT_REDIRECT")) {
        setViewAsError(message);
      }
    } finally {
      setViewAsPending(false);
    }
  }

  async function handleCompanyStatus() {
    const nextStatus = company.status === "suspended" ? "active" : "suspended";
    const verb = nextStatus === "suspended" ? "opschorten" : "activeren";
    const confirmed = window.confirm(
      nextStatus === "suspended"
        ? `Bedrijf ${company.name} opschorten? Gebruikers verliezen toegang, maar het Stripe-abonnement wordt niet automatisch stopgezet.`
        : `Bedrijf ${company.name} opnieuw activeren?`,
    );
    if (!confirmed) return;

    setStatusMessage(null);
    setStatusPending(true);
    try {
      const result = await updateCompanyStatusAction({
        companyId: Number(company.id),
        status: nextStatus,
      });

      if (!result.ok) {
        setStatusMessage({ tone: "error", text: result.error });
        return;
      }

      setStatusMessage({
        tone: result.warning ? "warning" : "success",
        text:
          result.warning ??
          `Bedrijf is ${verb === "opschorten" ? "opgeschort" : "geactiveerd"}.`,
      });
      router.refresh();
    } catch {
      setStatusMessage({
        tone: "error",
        text: "De accountstatus kon niet worden gewijzigd.",
      });
    } finally {
      setStatusPending(false);
    }
  }

  const headerMetrics = useMemo(
    () => [
      {
        label: "Pakketwaarde per maand",
        value: formatCurrency(company.monthlyRevenue),
        icon: <CreditCard size={15} />,
      },
      {
        label: "Actieve gebruikers",
        value: company.activeUsers.toLocaleString("nl-BE"),
        icon: <Users size={15} />,
      },
      {
        label: "AI-tokens gebruikt",
        value: formatTokens(company.aiTokensUsed),
        icon: <Bot size={15} />,
      },
      {
        label: "Laatste activiteit",
        value: formatDateTime(company.lastLogin),
        icon: <CalendarClock size={15} />,
      },
      {
        label: "Aangemaakt op",
        value: formatDate(company.createdAt),
        icon: <Building2 size={15} />,
      },
    ],
    [company],
  );

  return (
    <div className="space-y-6">
      <header className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/60">
        <div className="border-b border-white/10 px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start">
              <span
                className={cn(
                  "grid h-16 w-16 shrink-0 place-items-center rounded-2xl border font-mono text-lg font-semibold",
                  logoToneClasses[company.logoTone],
                )}
                aria-hidden
              >
                {company.logoInitials}
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                  CEO Dashboard / Bedrijfsdossier
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl">
                    {company.name}
                  </h1>
                  <Badge variant={planBadgeVariants[company.plan]}>
                    {planLabels[company.plan]}
                  </Badge>
                  <Badge variant={statusBadgeVariants[company.status]}>
                    {statusLabels[company.status]}
                  </Badge>
                  <Badge
                    variant={
                      detail.risicoStatus === "normaal" ? "default" : "warning"
                    }
                  >
                    Risico: {detail.risicoStatus.replaceAll("_", " ")}
                  </Badge>
                  <Badge variant="info">
                    Verificatie: {detail.verificatieStatus.replaceAll("_", " ")}
                  </Badge>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-zinc-400">
                  <span>{company.owner}</span>
                  <span className="font-mono text-xs text-zinc-500">
                    {company.ownerEmail}
                  </span>
                  <span className="font-mono text-xs text-zinc-500">
                    {company.domain}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 xl:justify-end">
              <ActionButton onClick={handleViewAsCompany} disabled={viewAsPending}>
                <ExternalLink size={15} />
                {viewAsPending ? "Bezig..." : "Bekijk als dit bedrijf"}
              </ActionButton>
              <ActionButton onClick={() => setActiveTab("billing")}>
                <CreditCard size={15} />
                Bekijk abonnement
              </ActionButton>
              <ActionButton onClick={() => setActiveTab("ai")}>
                <Bot size={15} />
                Bekijk AI-gebruik
              </ActionButton>
              <Button
                type="button"
                variant={company.status === "suspended" ? "default" : "danger"}
                disabled={statusPending}
                onClick={() => void handleCompanyStatus()}
              >
                <Ban size={15} />
                {statusPending
                  ? "Bezig..."
                  : company.status === "suspended"
                    ? "Bedrijf activeren"
                    : "Bedrijf opschorten"}
              </Button>
            </div>
          </div>
          {viewAsError && (
            <p className="mt-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
              {viewAsError}
            </p>
          )}
          {statusMessage && (
            <p
              role="status"
              className={cn(
                "mt-3 rounded-lg border px-3 py-2 text-sm",
                statusMessage.tone === "success"
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                  : statusMessage.tone === "warning"
                    ? "border-amber-500/30 bg-amber-500/10 text-amber-200"
                    : "border-rose-500/30 bg-rose-500/10 text-rose-300",
              )}
            >
              {statusMessage.text}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 divide-y divide-white/10 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-3 xl:grid-cols-5">
          {headerMetrics.map((metric) => (
            <div key={metric.label} className="px-5 py-4">
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <span className="text-zinc-600">{metric.icon}</span>
                {metric.label}
              </div>
              <p className="mt-1 font-mono text-sm font-semibold text-zinc-100">
                {metric.value}
              </p>
            </div>
          ))}
        </div>
      </header>

      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-zinc-900/50 p-1">
        <div role="tablist" aria-label="Onderdelen bedrijfsdossier" className="flex min-w-max gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-zinc-400 transition-colors hover:bg-white/[0.04] hover:text-zinc-100",
                activeTab === tab.id && "bg-sky-500/10 text-sky-200",
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <section role="tabpanel">
        {activeTab === "overview" && <OverviewTab detail={detail} />}
        {activeTab === "users" && <UsersTab users={detail.users} />}
        {activeTab === "projects" && <ProjectsTab projects={detail.projects} />}
        {activeTab === "quotes" && <QuotesTab quotes={detail.quotes} />}
        {activeTab === "invoices" && <InvoicesTab invoices={detail.invoices} />}
        {activeTab === "ai" && <AiUsageTab detail={detail} />}
        {activeTab === "billing" && <BillingTab detail={detail} />}
        {activeTab === "activity" && <ActivityTab events={detail.activity} />}
        {activeTab === "security" && <SecurityTab detail={detail} />}
        {activeTab === "settings" && <SettingsTab detail={detail} />}
      </section>
    </div>
  );
}

function OverviewTab({ detail }: { detail: CompanyDetail }) {
  const { company } = detail;
  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Pakketwaarde"
          value={formatCurrency(company.monthlyRevenue)}
          detail={`Pakketstatus: ${subscriptionStatusLabels[detail.subscriptionStatus]}`}
          icon={<CreditCard size={18} />}
        />
        <MetricCard
          label="AI-tokens gebruikt"
          value={formatTokens(company.aiTokensUsed)}
          detail={`${formatCurrency(company.aiCost)} geregistreerde kosten`}
          icon={<Bot size={18} />}
        />
        <MetricCard
          label="Actieve gebruikers"
          value={company.activeUsers.toLocaleString("nl-BE")}
          detail="Actieve bedrijfslidmaatschappen"
          icon={<Users size={18} />}
        />
        <MetricCard
          label="Projecten"
          value="—"
          detail="Projectbron nog niet gekoppeld"
          icon={<FolderKanban size={18} />}
        />
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="space-y-6 xl:col-span-7">
          <TimelineCard title="Recente activiteit" events={detail.activity.slice(0, 5)} />
          <DataCard title="Recente facturen" description="Laatste factuuractiviteit van dit bedrijf">
            <InvoicesTable invoices={detail.invoices.slice(0, 4)} compact />
          </DataCard>
        </div>
        <div className="space-y-6 xl:col-span-5">
          <DataCard title="Recente offertes" description="Laatste commerciële documenten">
            <QuotesTable quotes={detail.quotes.slice(0, 4)} compact />
          </DataCard>
          <SystemNotes notes={detail.systemNotes} />
        </div>
      </div>
    </div>
  );
}

function UsersTab({ users }: { users: CompanyUser[] }) {
  return (
    <DataCard title="Gebruikers" description="Alle gebruikers van deze bedrijfsomgeving">
      <Table className="min-w-[920px]">
        <TableHeader>
          <TableRow>
            <TableHead>Gebruiker</TableHead>
            <TableHead>Rol</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Laatste login</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">AI-gebruik</TableHead>
            <TableHead>Aangemaakt op</TableHead>
            <TableHead className="text-right">Acties</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium text-zinc-100">{user.name}</TableCell>
              <TableCell>{user.role}</TableCell>
              <TableCell className="font-mono text-xs text-zinc-500">{user.email}</TableCell>
              <TableCell className="font-mono text-xs text-zinc-500">
                {formatDateTime(user.lastLogin)}
              </TableCell>
              <TableCell>
                <Badge variant={tableStatusVariants[user.status]}>{user.status}</Badge>
              </TableCell>
              <TableCell className="text-right font-mono">
                {formatTokens(user.aiUsage)}
              </TableCell>
              <TableCell className="font-mono text-xs text-zinc-500">
                {formatDate(user.createdAt)}
              </TableCell>
              <TableCell className="text-right">
                <Button type="button" variant="ghost" size="sm">Beheren</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </DataCard>
  );
}

function ProjectsTab({ projects }: { projects: CompanyProject[] }) {
  return (
    <DataCard title="Projecten" description="Projectoverzicht voor de platformbeheerder">
      <ProjectsTable projects={projects} />
    </DataCard>
  );
}

function QuotesTab({ quotes }: { quotes: CompanyQuote[] }) {
  return (
    <DataCard title="Offertes" description="Offertepijplijn en documentstatussen">
      <QuotesTable quotes={quotes} />
    </DataCard>
  );
}

function InvoicesTab({ invoices }: { invoices: CompanyInvoice[] }) {
  return (
    <DataCard title="Facturen" description="Factuurstatussen, vervaldagen en betalingen">
      <InvoicesTable invoices={invoices} />
    </DataCard>
  );
}

function AiUsageTab({ detail }: { detail: CompanyDetail }) {
  const { company } = detail;
  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Tokens gebruikt" value={formatTokens(company.aiTokensUsed)} detail="Volgens de creditregistratie" icon={<Bot size={18} />} />
        <MetricCard label="Geregistreerde AI-kosten" value={formatCurrency(company.aiCost)} detail="Volgens de creditregistratie" icon={<CreditCard size={18} />} />
        <MetricCard label="Recente AI-logregels" value={detail.requestsToday.toLocaleString("nl-BE")} detail="Maximaal 12 recente gebeurtenissen" icon={<Zap size={18} />} />
        <MetricCard label="Fouten in recente logs" value={detail.failedRequests.toLocaleString("nl-BE")} detail="Binnen de geladen AI-gebeurtenissen" icon={<Activity size={18} />} />
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <Card className="xl:col-span-8">
          <CardHeader>
            <CardTitle>Gebruiksgrafiek</CardTitle>
            <CardDescription>Ontwikkeling van tokens en kosten deze maand</CardDescription>
          </CardHeader>
          <CardContent>
            <CompanyAiUsageChart data={detail.aiUsageChart} />
          </CardContent>
        </Card>
        <DataCard title="Verdeling per provider" description="Gebruik van OpenAI, Claude en Gemini" className="xl:col-span-4">
          <div className="space-y-3">
            {detail.providerBreakdown.map((provider) => (
              <div key={provider.provider} className="rounded-xl border border-white/10 bg-white/[0.025] p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-zinc-100">{provider.provider}</p>
                  <Badge variant="info">{provider.successRate}% geslaagd</Badge>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-zinc-500">Tokens</p>
                    <p className="mt-1 font-mono text-zinc-200">{formatTokens(provider.tokens)}</p>
                  </div>
                  <div>
                    <p className="text-zinc-500">Kosten</p>
                    <p className="mt-1 font-mono text-zinc-200">{formatCurrency(provider.cost)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </DataCard>
      </div>
    </div>
  );
}

function BillingTab({ detail }: { detail: CompanyDetail }) {
  const { company } = detail;
  const [sendingInvoiceId, setSendingInvoiceId] = useState<string | null>(null);
  const [syncPending, setSyncPending] = useState(false);
  const [portalPending, setPortalPending] = useState(false);
  const [sendMessage, setSendMessage] = useState<{
    tone: "success" | "error";
    text: string;
  } | null>(null);

  async function handleSendInvoice(stripeInvoiceId: string, recipient: string) {
    const confirmed = window.confirm(
      `Factuurkopie via Stripe versturen naar ${recipient}?`,
    );
    if (!confirmed) return;

    setSendMessage(null);
    setSendingInvoiceId(stripeInvoiceId);
    const result = await sendPlatformInvoiceAction({
      companyId: Number(company.id),
      stripeInvoiceId,
    });
    setSendingInvoiceId(null);

    if (!result.ok) {
      setSendMessage({ tone: "error", text: result.error });
      return;
    }
    setSendMessage({
      tone: "success",
      text: result.testMode
        ? "Testmodus: Stripe registreerde de verzending, maar verstuurde geen echte e-mail."
        : `Factuurkopie verstuurd naar ${result.recipient}.`,
    });
  }

  async function handleSyncInvoices() {
    setSendMessage(null);
    setSyncPending(true);
    const result = await syncPlatformInvoicesAction({
      companyId: Number(company.id),
    });
    setSyncPending(false);

    setSendMessage(
      result.ok
        ? {
            tone: "success",
            text: `${result.synced} Stripe-facturen gesynchroniseerd.`,
          }
        : { tone: "error", text: result.error },
    );
  }

  async function handleOpenBillingPortal() {
    const confirmed = window.confirm(
      `Stripe-abonnementsbeheer openen voor ${company.name}? Wijzigingen in Stripe kunnen onmiddellijk financiële gevolgen hebben.`,
    );
    if (!confirmed) return;

    setSendMessage(null);
    setPortalPending(true);
    try {
      const result = await createStripeBillingPortalAction({
        companyId: Number(company.id),
      });
      if (!result.ok) {
        setSendMessage({ tone: "error", text: result.error });
        return;
      }
      window.location.assign(result.url);
    } catch {
      setSendMessage({
        tone: "error",
        text: "Stripe-abonnementsbeheer kon niet worden geopend.",
      });
    } finally {
      setPortalPending(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Huidig pakket" value={planLabels[company.plan]} detail="Ingesteld abonnementspakket" icon={<CreditCard size={18} />} />
        <MetricCard label="Abonnementsstatus" value={subscriptionStatusLabels[detail.subscriptionStatus]} detail="Status volgens Stripe" icon={<ShieldCheck size={18} />} />
        <MetricCard label="Pakketwaarde per maand" value={formatCurrency(company.monthlyRevenue)} detail="Berekend op basis van het pakket" icon={<Activity size={18} />} />
        <MetricCard label="Volgende factuurdatum" value="—" detail="Nog niet gekoppeld aan Stripe planning" icon={<CalendarClock size={18} />} />
      </section>
      <DataCard
        title="Platformfacturen"
        description="Stripe-facturen voor abonnementen en AI-tokenbetalingen"
      >
        <div className="mx-5 mb-4 flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="default"
            disabled={
              portalPending || syncPending || sendingInvoiceId !== null
            }
            onClick={() => void handleOpenBillingPortal()}
          >
            <ExternalLink size={14} />
            {portalPending ? "Stripe openen..." : "Beheer abonnement in Stripe"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={
              portalPending || syncPending || sendingInvoiceId !== null
            }
            onClick={() => void handleSyncInvoices()}
          >
            {syncPending ? "Synchroniseren..." : "Synchroniseer met Stripe"}
          </Button>
        </div>
        <p className="mx-5 mb-4 text-xs leading-relaxed text-zinc-500">
          Pakketwissels, proratie en betaalmethoden worden uitsluitend in de
          beveiligde Stripe-omgeving beheerd. ArchonPro registreert wie deze
          omgeving opent.
        </p>
        {sendMessage && (
          <p
            role="status"
            className={cn(
              "mx-5 mb-4 rounded-lg border px-3 py-2 text-sm",
              sendMessage.tone === "success"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                : "border-rose-500/30 bg-rose-500/10 text-rose-200",
            )}
          >
            {sendMessage.text}
          </p>
        )}
        {detail.platformInvoices.length > 0 ? (
          <Table className="min-w-[980px]">
            <TableHeader>
              <TableRow>
                <TableHead>Factuur</TableHead>
                <TableHead>Datum</TableHead>
                <TableHead className="text-right">Bedrag</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead className="text-right">Acties</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {detail.platformInvoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-mono text-xs text-zinc-200">
                    {invoice.number ?? invoice.stripeInvoiceId}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-zinc-500">
                    {formatDate(invoice.createdAt)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {new Intl.NumberFormat("nl-BE", {
                      style: "currency",
                      currency: invoice.currency.toUpperCase(),
                    }).format(invoice.amountDue / 100)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={tableStatusVariants[invoice.status]}>
                      {invoice.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-56 truncate text-xs text-zinc-400">
                    {invoice.customerEmail ?? "Geen e-mailadres"}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      {(invoice.invoicePdfUrl || invoice.hostedInvoiceUrl) && (
                        <a
                          href={invoice.invoicePdfUrl ?? invoice.hostedInvoiceUrl ?? "#"}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.06] px-3 text-sm font-medium text-zinc-100 transition-colors hover:bg-white/[0.09]"
                        >
                          <FileText size={14} /> Open
                        </a>
                      )}
                      <Button
                        type="button"
                        variant="default"
                        disabled={
                          invoice.status === "draft" ||
                          !invoice.customerEmail ||
                          sendingInvoiceId !== null
                        }
                        onClick={() =>
                          void handleSendInvoice(
                            invoice.stripeInvoiceId,
                            invoice.customerEmail ?? "",
                          )
                        }
                      >
                        {sendingInvoiceId === invoice.stripeInvoiceId
                          ? "Bezig..."
                          : "Factuur versturen"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="px-5 pb-5">
            <EmptyState
              title="Nog geen Stripe-facturen"
              detail="Nieuwe tokenbetalingen worden automatisch gefactureerd. Abonnementsfacturen verschijnen zodra Stripe ze via de webhook aanlevert."
            />
          </div>
        )}
      </DataCard>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <DataCard title="Betalingshistoriek" description="Recente abonnementsbetalingen" className="xl:col-span-8">
          <PaymentsTable payments={detail.paymentHistory} />
        </DataCard>
        <DataCard title="Mislukte betalingen" description="Betalingen die controle vereisen" className="xl:col-span-4">
          {detail.failedPayments.length > 0 ? (
            <PaymentsTable payments={detail.failedPayments} compact />
          ) : (
            <EmptyState title="Geen mislukte betalingen" detail="Er zijn geen betalingsproblemen voor dit account." />
          )}
        </DataCard>
      </div>
    </div>
  );
}

function ActivityTab({ events }: { events: ActivityEvent[] }) {
  return <TimelineCard title="Activiteitenlogboek" events={events} />;
}

function SecurityTab({ detail }: { detail: CompanyDetail }) {
  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Actieve sessies" value="—" detail="Sessiedata nog niet gekoppeld" icon={<Activity size={18} />} />
        <MetricCard label="Mislukte logins" value="—" detail="Auth-logboeken nog niet gekoppeld" icon={<Lock size={18} />} />
        <MetricCard label="2FA-status" value="—" detail="MFA-bron nog niet gekoppeld" icon={<ShieldCheck size={18} />} />
        <MetricCard label="Auditregels" value={detail.auditLog.length.toLocaleString("nl-BE")} detail="Geladen voor dit bedrijf" icon={<KeyRound size={18} />} />
      </section>
      <DataCard title="Auditlogboek" description="Beveiligings- en rechtengebeurtenissen">
        <SecurityTable events={detail.auditLog} />
      </DataCard>
    </div>
  );
}

function SettingsTab({ detail }: { detail: CompanyDetail }) {
  const { company } = detail;
  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
      <DataCard title="Bedrijfsprofiel" description="Belangrijkste bedrijfsgegevens" className="xl:col-span-5">
        <KeyValueList
          items={[
            ["Bedrijfsnaam", company.name],
            ["Eigenaar", company.owner],
            ["E-mail eigenaar", company.ownerEmail],
            ["Domain", company.domain],
            ["Status", statusLabels[company.status]],
          ]}
        />
      </DataCard>
      <DataCard title="Pakketlimieten" description="Gebruikslimieten van het huidige pakket" className="xl:col-span-7">
        <EmptyState
          title="Pakketlimieten nog niet gekoppeld"
          detail="Toon hier pas limieten zodra het centrale pakketbeheer de bron van waarheid is."
        />
      </DataCard>
      <DataCard title="Functies" description="Beschikbare SaaS-mogelijkheden" className="xl:col-span-12">
        <EmptyState
          title="Functiebeheer nog niet gekoppeld"
          detail="Hardcoded featureflags worden niet als actuele instellingen getoond."
        />
      </DataCard>
    </div>
  );
}

function ProjectsTable({ projects }: { projects: CompanyProject[] }) {
  return (
    <Table className="min-w-[980px]">
      <TableHeader>
        <TableRow>
          <TableHead>Project</TableHead>
          <TableHead>Klant</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Waarde</TableHead>
          <TableHead>Startdatum</TableHead>
          <TableHead>Deadline</TableHead>
          <TableHead>Verantwoordelijke</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {projects.map((project) => (
          <TableRow key={project.id}>
            <TableCell className="font-medium text-zinc-100">{project.project}</TableCell>
            <TableCell>{project.customer}</TableCell>
            <TableCell>
              <Badge variant={tableStatusVariants[project.status]}>{project.status}</Badge>
            </TableCell>
            <TableCell className="text-right font-mono">{formatCurrency(project.value)}</TableCell>
            <TableCell className="font-mono text-xs text-zinc-500">{formatDate(project.startDate)}</TableCell>
            <TableCell className="font-mono text-xs text-zinc-500">{formatDate(project.deadline)}</TableCell>
            <TableCell>{project.owner}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function QuotesTable({ quotes, compact = false }: { quotes: CompanyQuote[]; compact?: boolean }) {
  return (
    <Table className={compact ? "min-w-[720px]" : "min-w-[860px]"}>
      <TableHeader>
        <TableRow>
          <TableHead>Offertenummer</TableHead>
          <TableHead>Klant</TableHead>
          <TableHead className="text-right">Bedrag</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Aangemaakt op</TableHead>
          <TableHead>Geldig tot</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {quotes.map((quote) => (
          <TableRow key={quote.id}>
            <TableCell className="font-mono text-xs text-zinc-200">{quote.quoteNumber}</TableCell>
            <TableCell>{quote.customer}</TableCell>
            <TableCell className="text-right font-mono">{formatCurrency(quote.amount)}</TableCell>
            <TableCell>
              <Badge variant={tableStatusVariants[quote.status]}>{quote.status}</Badge>
            </TableCell>
            <TableCell className="font-mono text-xs text-zinc-500">{formatDate(quote.createdAt)}</TableCell>
            <TableCell className="font-mono text-xs text-zinc-500">{formatDate(quote.validUntil)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function InvoicesTable({ invoices, compact = false }: { invoices: CompanyInvoice[]; compact?: boolean }) {
  return (
    <Table className={compact ? "min-w-[760px]" : "min-w-[900px]"}>
      <TableHeader>
        <TableRow>
          <TableHead>Factuurnummer</TableHead>
          <TableHead>Klant</TableHead>
          <TableHead className="text-right">Bedrag</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Vervaldatum</TableHead>
          <TableHead>Betaaldatum</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.map((invoice) => (
          <TableRow key={invoice.id}>
            <TableCell className="font-mono text-xs text-zinc-200">{invoice.invoiceNumber}</TableCell>
            <TableCell>{invoice.customer}</TableCell>
            <TableCell className="text-right font-mono">{formatCurrency(invoice.amount)}</TableCell>
            <TableCell>
              <Badge variant={tableStatusVariants[invoice.status]}>{invoice.status}</Badge>
            </TableCell>
            <TableCell className="font-mono text-xs text-zinc-500">{formatDate(invoice.dueDate)}</TableCell>
            <TableCell className="font-mono text-xs text-zinc-500">
              {invoice.paidDate ? formatDate(invoice.paidDate) : "Niet betaald"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function PaymentsTable({ payments, compact = false }: { payments: PaymentRecord[]; compact?: boolean }) {
  return (
    <Table className={compact ? "min-w-[520px]" : "min-w-[760px]"}>
      <TableHeader>
        <TableRow>
          <TableHead>Datum</TableHead>
          <TableHead className="text-right">Bedrag</TableHead>
          <TableHead>Status</TableHead>
          {!compact && <TableHead>Methode</TableHead>}
          <TableHead>Referentie</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {payments.map((payment) => (
          <TableRow key={payment.id}>
            <TableCell className="font-mono text-xs text-zinc-500">{formatDate(payment.date)}</TableCell>
            <TableCell className="text-right font-mono">{formatCurrency(payment.amount)}</TableCell>
            <TableCell>
              <Badge variant={tableStatusVariants[payment.status]}>{payment.status}</Badge>
            </TableCell>
            {!compact && <TableCell>{payment.method}</TableCell>}
            <TableCell className="font-mono text-xs text-zinc-500">{payment.reference}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function SecurityTable({ events }: { events: SecurityEvent[] }) {
  return (
    <Table className="min-w-[760px]">
      <TableHeader>
        <TableRow>
          <TableHead>Categorie</TableHead>
          <TableHead>Detail</TableHead>
          <TableHead>Ernst</TableHead>
          <TableHead>Tijdstip</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {events.length > 0 ? (
          events.map((event) => (
            <TableRow key={event.id}>
              <TableCell className="font-medium text-zinc-100">{event.category}</TableCell>
              <TableCell>{event.detail}</TableCell>
              <TableCell>
                <Badge
                  variant={
                    event.severity === "critical"
                      ? "danger"
                      : event.severity === "warning"
                        ? "warning"
                        : "info"
                  }
                >
                  {event.severity}
                </Badge>
              </TableCell>
              <TableCell className="font-mono text-xs text-zinc-500">{formatDateTime(event.time)}</TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={4} className="py-10 text-center text-sm text-zinc-500">
              Nog geen auditregels voor dit bedrijf.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}

function TimelineCard({
  title,
  events,
}: {
  title: string;
  events: ActivityEvent[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>Platform-, gebruikers-, AI-, facturatie- en beveiligingsgebeurtenissen</CardDescription>
      </CardHeader>
      <CardContent>
        <ol className="space-y-4">
          {events.map((event) => (
            <li key={event.id} className="flex gap-3">
              <span className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/[0.03] text-zinc-500">
                {eventIcon(event.type)}
              </span>
              <div className="min-w-0 flex-1 border-b border-white/5 pb-4 last:border-b-0 last:pb-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-zinc-100">{event.title}</p>
                  <span className="font-mono text-[11px] text-zinc-600">
                    {formatDateTime(event.time)}
                  </span>
                </div>
                <p className="mt-1 text-sm text-zinc-400">{event.detail}</p>
                <p className="mt-1 text-xs text-zinc-600">{event.actor}</p>
              </div>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}

function SystemNotes({ notes }: { notes: SystemNote[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Systeemnotities</CardTitle>
        <CardDescription>Interne accountrichtlijnen voor beheerders</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {notes.map((note) => (
          <div key={note.id} className="rounded-xl border border-white/10 bg-white/[0.025] p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-zinc-100">{note.title}</p>
              <Badge
                variant={
                  note.tone === "success"
                    ? "success"
                    : note.tone === "warning"
                      ? "warning"
                      : "info"
                }
              >
                {note.tone}
              </Badge>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">{note.body}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function DataCard({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="px-0 pb-0">{children}</CardContent>
    </Card>
  );
}

function MetricCard({
  label,
  value,
  detail,
  icon,
}: {
  label: string;
  value: string;
  detail: string;
  icon: ReactNode;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
              {label}
            </p>
            <p className="mt-2 font-mono text-2xl font-semibold text-zinc-50">
              {value}
            </p>
            <p className="mt-2 text-xs text-zinc-500">{detail}</p>
          </div>
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sky-500/10 text-sky-400">
            {icon}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function KeyValueList({ items }: { items: Array<[string, string]> }) {
  return (
    <dl className="divide-y divide-white/10">
      {items.map(([label, value]) => (
        <div key={label} className="flex items-start justify-between gap-4 px-5 py-3">
          <dt className="text-sm text-zinc-500">{label}</dt>
          <dd className="max-w-[60%] text-right text-sm text-zinc-200">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function EmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="px-5 py-10 text-center">
      <p className="text-sm font-medium text-zinc-100">{title}</p>
      <p className="mt-1 text-sm text-zinc-500">{detail}</p>
    </div>
  );
}

function ActionButton({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <Button type="button" variant="secondary" onClick={onClick} disabled={disabled}>
      {children}
    </Button>
  );
}


function eventIcon(type: ActivityEvent["type"]) {
  const icons: Record<ActivityEvent["type"], ReactNode> = {
    login: <Activity size={15} />,
    invoice: <Receipt size={15} />,
    quote: <FileText size={15} />,
    ai: <Bot size={15} />,
    user: <Users size={15} />,
    billing: <CreditCard size={15} />,
    security: <ShieldCheck size={15} />,
  };
  return icons[type];
}
