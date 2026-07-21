"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  Activity,
  Ban,
  Bot,
  Building2,
  CalendarClock,
  CreditCard,
  Database,
  Edit3,
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
  formatCurrency,
  formatDate,
  formatDateTime,
  formatStorage,
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
  FeatureFlag,
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
  { id: "overview", label: "Overview", icon: <Building2 size={14} /> },
  { id: "users", label: "Users", icon: <Users size={14} /> },
  { id: "projects", label: "Projects", icon: <FolderKanban size={14} /> },
  { id: "quotes", label: "Quotes", icon: <FileText size={14} /> },
  { id: "invoices", label: "Invoices", icon: <Receipt size={14} /> },
  { id: "ai", label: "AI Usage", icon: <Bot size={14} /> },
  { id: "billing", label: "Billing", icon: <CreditCard size={14} /> },
  { id: "activity", label: "Activity", icon: <Activity size={14} /> },
  { id: "security", label: "Security", icon: <ShieldCheck size={14} /> },
  { id: "settings", label: "Settings", icon: <KeyRound size={14} /> },
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
} satisfies Record<string, BadgeVariant>;

export default function CompanyDetailView({
  detail,
}: {
  detail: CompanyDetail;
}) {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [viewAsError, setViewAsError] = useState<string | null>(null);
  const [viewAsPending, setViewAsPending] = useState(false);
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

  const headerMetrics = useMemo(
    () => [
      {
        label: "Monthly revenue",
        value: formatCurrency(company.monthlyRevenue),
        icon: <CreditCard size={15} />,
      },
      {
        label: "Active users",
        value: company.activeUsers.toLocaleString("nl-BE"),
        icon: <Users size={15} />,
      },
      {
        label: "AI tokens this month",
        value: formatTokens(company.aiTokensUsed),
        icon: <Bot size={15} />,
      },
      {
        label: "Storage used",
        value: formatStorage(company.storageUsedGb),
        icon: <Database size={15} />,
      },
      {
        label: "Last login",
        value: formatDateTime(company.lastLogin),
        icon: <CalendarClock size={15} />,
      },
      {
        label: "Created date",
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
                  CEO Dashboard / Company Profile
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
                View Billing
              </ActionButton>
              <ActionButton onClick={() => setActiveTab("ai")}>
                <Bot size={15} />
                View AI Usage
              </ActionButton>
              <Button
                type="button"
                variant="danger"
                disabled
                title="Nog niet veilig aangesloten"
              >
                <Ban size={15} />
                Suspend Company
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled
                title="Nog niet aangesloten"
              >
                <Edit3 size={15} />
                Edit Company
              </Button>
            </div>
          </div>
          {viewAsError && (
            <p className="mt-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
              {viewAsError}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 divide-y divide-white/10 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-3 xl:grid-cols-6">
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
        <div role="tablist" aria-label="Company detail sections" className="flex min-w-max gap-1">
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
          label="Revenue"
          value={formatCurrency(company.monthlyRevenue)}
          detail={`${detail.subscriptionStatus.replace("_", " ")} subscription`}
          icon={<CreditCard size={18} />}
        />
        <MetricCard
          label="AI Usage"
          value={formatTokens(company.aiTokensUsed)}
          detail={`${formatCurrency(company.aiCost)} this month`}
          icon={<Bot size={18} />}
        />
        <MetricCard
          label="Active Users"
          value={company.activeUsers.toLocaleString("nl-BE")}
          detail={`${detail.activeSessions} active sessions`}
          icon={<Users size={18} />}
        />
        <MetricCard
          label="Projects"
          value={detail.projectsTotal.toLocaleString("nl-BE")}
          detail={`${detail.projects.filter((project) => project.status === "active").length} active in table`}
          icon={<FolderKanban size={18} />}
        />
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="space-y-6 xl:col-span-7">
          <TimelineCard title="Recent activity timeline" events={detail.activity.slice(0, 5)} />
          <DataCard title="Recent invoices" description="Latest company invoice activity">
            <InvoicesTable invoices={detail.invoices.slice(0, 4)} compact />
          </DataCard>
        </div>
        <div className="space-y-6 xl:col-span-5">
          <DataCard title="Recent quotes" description="Latest commercial documents">
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
    <DataCard title="Users" description="All users attached to this company workspace">
      <Table className="min-w-[920px]">
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Last login</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">AI usage</TableHead>
            <TableHead>Created date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
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
                <Button type="button" variant="ghost" size="sm">Manage</Button>
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
    <DataCard title="Projects" description="Project portfolio visible to the platform admin">
      <ProjectsTable projects={projects} />
    </DataCard>
  );
}

function QuotesTab({ quotes }: { quotes: CompanyQuote[] }) {
  return (
    <DataCard title="Quotes" description="Quote pipeline and document statuses">
      <QuotesTable quotes={quotes} />
    </DataCard>
  );
}

function InvoicesTab({ invoices }: { invoices: CompanyInvoice[] }) {
  return (
    <DataCard title="Invoices" description="Invoice status, due dates and payments">
      <InvoicesTable invoices={invoices} />
    </DataCard>
  );
}

function AiUsageTab({ detail }: { detail: CompanyDetail }) {
  const { company } = detail;
  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Tokens used this month" value={formatTokens(company.aiTokensUsed)} detail="Across all AI agents" icon={<Bot size={18} />} />
        <MetricCard label="AI cost this month" value={formatCurrency(company.aiCost)} detail="Provider blended cost" icon={<CreditCard size={18} />} />
        <MetricCard label="Requests today" value={detail.requestsToday.toLocaleString("nl-BE")} detail="Realtime request volume" icon={<Zap size={18} />} />
        <MetricCard label="Failed requests" value={detail.failedRequests.toLocaleString("nl-BE")} detail="Needs review if elevated" icon={<Activity size={18} />} />
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <Card className="xl:col-span-8">
          <CardHeader>
            <CardTitle>Usage chart</CardTitle>
            <CardDescription>Tokens and cost trend for the current month</CardDescription>
          </CardHeader>
          <CardContent>
            <CompanyAiUsageChart data={detail.aiUsageChart} />
          </CardContent>
        </Card>
        <DataCard title="Provider breakdown" description="OpenAI, Claude and Gemini usage" className="xl:col-span-4">
          <div className="space-y-3">
            {detail.providerBreakdown.map((provider) => (
              <div key={provider.provider} className="rounded-xl border border-white/10 bg-white/[0.025] p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-zinc-100">{provider.provider}</p>
                  <Badge variant="info">{provider.successRate}% success</Badge>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-zinc-500">Tokens</p>
                    <p className="mt-1 font-mono text-zinc-200">{formatTokens(provider.tokens)}</p>
                  </div>
                  <div>
                    <p className="text-zinc-500">Cost</p>
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
  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Current plan" value={planLabels[company.plan]} detail="Configured subscription plan" icon={<CreditCard size={18} />} />
        <MetricCard label="Subscription status" value={detail.subscriptionStatus.replace("_", " ")} detail="Stripe subscription state" icon={<ShieldCheck size={18} />} />
        <MetricCard label="MRR" value={formatCurrency(company.monthlyRevenue)} detail="Monthly recurring revenue" icon={<Activity size={18} />} />
        <MetricCard label="Next invoice date" value={formatDate(detail.nextInvoiceDate)} detail={detail.stripeCustomerId} icon={<CalendarClock size={18} />} />
      </section>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <DataCard title="Payment history" description="Recent subscription payments" className="xl:col-span-8">
          <PaymentsTable payments={detail.paymentHistory} />
        </DataCard>
        <DataCard title="Failed payments" description="Payment failures requiring review" className="xl:col-span-4">
          {detail.failedPayments.length > 0 ? (
            <PaymentsTable payments={detail.failedPayments} compact />
          ) : (
            <EmptyState title="No failed payments" detail="Billing is clean for this account." />
          )}
        </DataCard>
      </div>
    </div>
  );
}

function ActivityTab({ events }: { events: ActivityEvent[] }) {
  return <TimelineCard title="Activity log" events={events} />;
}

function SecurityTab({ detail }: { detail: CompanyDetail }) {
  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Active sessions" value={detail.activeSessions.toLocaleString("nl-BE")} detail="Currently valid sessions" icon={<Activity size={18} />} />
        <MetricCard label="Failed logins" value={detail.failedLogins.toLocaleString("nl-BE")} detail="Last 30 days" icon={<Lock size={18} />} />
        <MetricCard label="2FA status" value={detail.twoFactorStatus} detail="Workspace security policy" icon={<ShieldCheck size={18} />} />
        <MetricCard label="Permission changes" value="3" detail="Recent role and access changes" icon={<KeyRound size={18} />} />
      </section>
      <DataCard title="Audit log" description="Security and permission events">
        <SecurityTable events={detail.auditLog} />
      </DataCard>
    </div>
  );
}

function SettingsTab({ detail }: { detail: CompanyDetail }) {
  const { company, planLimits } = detail;
  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
      <DataCard title="Company profile" description="Core company identity" className="xl:col-span-5">
        <KeyValueList
          items={[
            ["Company name", company.name],
            ["Owner", company.owner],
            ["Owner email", company.ownerEmail],
            ["Domain", company.domain],
            ["Status", statusLabels[company.status]],
          ]}
        />
      </DataCard>
      <DataCard title="Plan limits" description="Usage limits for the current plan" className="xl:col-span-7">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <LimitItem label="Users" value={`${company.activeUsers}/${planLimits.users}`} />
          <LimitItem label="Projects" value={`${detail.projectsTotal}/${planLimits.projects}`} />
          <LimitItem label="AI limits" value={`${formatTokens(company.aiTokensUsed)}/${formatTokens(planLimits.monthlyTokens)}`} />
          <LimitItem label="Storage limits" value={`${formatStorage(company.storageUsedGb)}/${formatStorage(planLimits.storageGb)}`} />
        </div>
      </DataCard>
      <DataCard title="Feature flags" description="Enabled SaaS capabilities" className="xl:col-span-12">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {detail.featureFlags.map((flag) => (
            <FeatureFlagItem key={flag.key} flag={flag} />
          ))}
        </div>
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
          <TableHead>Customer</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Value</TableHead>
          <TableHead>Start date</TableHead>
          <TableHead>Deadline</TableHead>
          <TableHead>Owner</TableHead>
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
          <TableHead>Quote number</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Created date</TableHead>
          <TableHead>Valid until</TableHead>
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
          <TableHead>Invoice number</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Due date</TableHead>
          <TableHead>Paid date</TableHead>
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
              {invoice.paidDate ? formatDate(invoice.paidDate) : "Not paid"}
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
          <TableHead>Date</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          <TableHead>Status</TableHead>
          {!compact && <TableHead>Method</TableHead>}
          <TableHead>Reference</TableHead>
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
          <TableHead>Category</TableHead>
          <TableHead>Detail</TableHead>
          <TableHead>Severity</TableHead>
          <TableHead>Time</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {events.map((event) => (
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
        ))}
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
        <CardDescription>Platform, user, AI, billing and security events</CardDescription>
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
        <CardTitle>System notes</CardTitle>
        <CardDescription>Internal account guidance for admins</CardDescription>
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

function LimitItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.025] p-4">
      <p className="text-xs uppercase tracking-wider text-zinc-500">{label}</p>
      <p className="mt-2 font-mono text-sm font-semibold text-zinc-100">{value}</p>
    </div>
  );
}

function FeatureFlagItem({ flag }: { flag: FeatureFlag }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.025] p-4">
      <p className="text-sm font-medium text-zinc-100">{flag.label}</p>
      <Badge variant={flag.enabled ? "success" : "default"}>
        {flag.enabled ? "Enabled" : "Off"}
      </Badge>
    </div>
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
