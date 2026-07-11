export type KpiMetric = {
  id: string;
  label: string;
  value: string;
  change: string;
  positive: boolean;
  icon: "mrr" | "companies" | "users" | "registrations" | "ai-requests" | "ai-cost" | "subscriptions" | "alerts";
  tone: "sky" | "emerald" | "violet" | "amber" | "rose" | "cyan";
};

export type ChartPoint = {
  month: string;
  revenue: number;
  companies: number;
  aiRequests: number;
  aiCost: number;
};

export type PlatformCompany = {
  id: string;
  name: string;
  plan: "Starter" | "Pro" | "Enterprise";
  users: number;
  aiUsage: number;
  revenue: number;
  lastLogin: string;
  status: "active" | "trial" | "past_due" | "churned";
};

export type Payment = {
  id: string;
  company: string;
  amount: number;
  plan: string;
  time: string;
  status: "paid" | "pending" | "failed";
};

export type Registration = {
  id: string;
  company: string;
  contact: string;
  plan: string;
  time: string;
};

export type AiError = {
  id: string;
  company: string;
  agent: string;
  message: string;
  time: string;
  severity: "critical" | "warning";
};

export type SupportTicket = {
  id: string;
  company: string;
  subject: string;
  priority: "low" | "medium" | "high";
  time: string;
  status: "open" | "in_progress" | "resolved";
};

export type SystemService = {
  name: string;
  status: "operational" | "degraded" | "outage";
  latency?: string;
};

export type CeoDashboardData = {
  kpis: KpiMetric[];
  revenueChart: ChartPoint[];
  companyGrowthChart: ChartPoint[];
  aiUsageChart: ChartPoint[];
  companies: PlatformCompany[];
  payments: Payment[];
  registrations: Registration[];
  aiErrors: AiError[];
  supportTickets: SupportTicket[];
  systemStatus: SystemService[];
  syncedAt: string;
};

const months = ["Jan", "Feb", "Mrt", "Apr", "Mei", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dec"];

function chartSeries(): ChartPoint[] {
  return months.map((month, i) => ({
    month,
    revenue: Math.round(28000 + i * 4200 + Math.sin(i * 0.9) * 3200),
    companies: Math.round(68 + i * 5.2 + Math.cos(i * 0.7) * 4),
    aiRequests: Math.round(62000 + i * 8400 + Math.sin(i * 1.1) * 6000),
    aiCost: Math.round(820 + i * 95 + Math.cos(i * 0.8) * 60),
  }));
}

export function getCeoDashboardData(): CeoDashboardData {
  const chart = chartSeries();

  return {
    kpis: [
      {
        id: "mrr",
        label: "Monthly Recurring Revenue",
        value: "€ 48.240",
        change: "+8,4%",
        positive: true,
        icon: "mrr",
        tone: "sky",
      },
      {
        id: "companies",
        label: "Active Companies",
        value: "127",
        change: "+12",
        positive: true,
        icon: "companies",
        tone: "emerald",
      },
      {
        id: "users",
        label: "Active Users",
        value: "842",
        change: "+6,2%",
        positive: true,
        icon: "users",
        tone: "violet",
      },
      {
        id: "registrations",
        label: "New Registrations Today",
        value: "3",
        change: "+2 vs gisteren",
        positive: true,
        icon: "registrations",
        tone: "cyan",
      },
      {
        id: "ai-requests",
        label: "AI Requests Today",
        value: "4.218",
        change: "+18%",
        positive: true,
        icon: "ai-requests",
        tone: "sky",
      },
      {
        id: "ai-cost",
        label: "AI Cost Today",
        value: "€ 127,40",
        change: "+4,1%",
        positive: false,
        icon: "ai-cost",
        tone: "amber",
      },
      {
        id: "subscriptions",
        label: "Active Subscriptions",
        value: "119",
        change: "94% retentie",
        positive: true,
        icon: "subscriptions",
        tone: "emerald",
      },
      {
        id: "alerts",
        label: "Critical Alerts",
        value: "2",
        change: "Actie vereist",
        positive: false,
        icon: "alerts",
        tone: "rose",
      },
    ],
    revenueChart: chart,
    companyGrowthChart: chart,
    aiUsageChart: chart,
    companies: [
      {
        id: "c1",
        name: "Bouwbedrijf De Vlaming",
        plan: "Enterprise",
        users: 18,
        aiUsage: 1240,
        revenue: 890,
        lastLogin: "2026-07-10T08:42:00Z",
        status: "active",
      },
      {
        id: "c2",
        name: "Renovatie Peeters NV",
        plan: "Pro",
        users: 9,
        aiUsage: 680,
        revenue: 349,
        lastLogin: "2026-07-10T07:15:00Z",
        status: "active",
      },
      {
        id: "c3",
        name: "Construct Plus",
        plan: "Pro",
        users: 12,
        aiUsage: 920,
        revenue: 349,
        lastLogin: "2026-07-09T16:30:00Z",
        status: "active",
      },
      {
        id: "c4",
        name: "Dakwerken Janssens",
        plan: "Starter",
        users: 4,
        aiUsage: 210,
        revenue: 149,
        lastLogin: "2026-07-09T11:08:00Z",
        status: "trial",
      },
      {
        id: "c5",
        name: "Geveltechniek Antwerp",
        plan: "Enterprise",
        users: 22,
        aiUsage: 1580,
        revenue: 890,
        lastLogin: "2026-07-10T09:01:00Z",
        status: "active",
      },
      {
        id: "c6",
        name: "Schrijnwerkerij Mertens",
        plan: "Pro",
        users: 6,
        aiUsage: 340,
        revenue: 349,
        lastLogin: "2026-07-08T14:22:00Z",
        status: "past_due",
      },
      {
        id: "c7",
        name: "Woningbouw Groep Limburg",
        plan: "Enterprise",
        users: 31,
        aiUsage: 2100,
        revenue: 890,
        lastLogin: "2026-07-10T06:55:00Z",
        status: "active",
      },
      {
        id: "c8",
        name: "Elektro Install Brugge",
        plan: "Starter",
        users: 3,
        aiUsage: 95,
        revenue: 149,
        lastLogin: "2026-07-07T09:40:00Z",
        status: "churned",
      },
    ],
    payments: [
      {
        id: "p1",
        company: "Geveltechniek Antwerp",
        amount: 890,
        plan: "Enterprise",
        time: "2026-07-10T06:12:00Z",
        status: "paid",
      },
      {
        id: "p2",
        company: "Renovatie Peeters NV",
        amount: 349,
        plan: "Pro",
        time: "2026-07-10T05:48:00Z",
        status: "paid",
      },
      {
        id: "p3",
        company: "Schrijnwerkerij Mertens",
        amount: 349,
        plan: "Pro",
        time: "2026-07-09T22:10:00Z",
        status: "failed",
      },
      {
        id: "p4",
        company: "Dakwerken Janssens",
        amount: 149,
        plan: "Starter",
        time: "2026-07-09T18:30:00Z",
        status: "pending",
      },
    ],
    registrations: [
      {
        id: "r1",
        company: "Totaalprojecten Vlaanderen",
        contact: "Sarah De Cock",
        plan: "Pro",
        time: "2026-07-10T09:24:00Z",
      },
      {
        id: "r2",
        company: "Isolatie Pro Gent",
        contact: "Tom Verbeeck",
        plan: "Starter",
        time: "2026-07-10T07:50:00Z",
      },
      {
        id: "r3",
        company: "Betonbouw Hasselt",
        contact: "Nadia El Amrani",
        plan: "Enterprise",
        time: "2026-07-09T21:15:00Z",
      },
    ],
    aiErrors: [
      {
        id: "e1",
        company: "Construct Plus",
        agent: "Lima",
        message: "OpenAI rate limit exceeded — offerte-generatie mislukt",
        time: "2026-07-10T08:55:00Z",
        severity: "critical",
      },
      {
        id: "e2",
        company: "Bouwbedrijf De Vlaming",
        agent: "Facturatie",
        message: "Peppol endpoint timeout na 30s",
        time: "2026-07-10T07:32:00Z",
        severity: "warning",
      },
      {
        id: "e3",
        company: "Renovatie Peeters NV",
        agent: "Opvolger",
        message: "Geheugen-index corrupt — fallback naar cache",
        time: "2026-07-09T23:18:00Z",
        severity: "warning",
      },
    ],
    supportTickets: [
      {
        id: "t1",
        company: "Woningbouw Groep Limburg",
        subject: "Slack-integratie synchroniseert niet",
        priority: "high",
        time: "2026-07-10T08:10:00Z",
        status: "in_progress",
      },
      {
        id: "t2",
        company: "Dakwerken Janssens",
        subject: "Trial verlengen met 7 dagen",
        priority: "medium",
        time: "2026-07-09T17:45:00Z",
        status: "open",
      },
      {
        id: "t3",
        company: "Elektro Install Brugge",
        subject: "Account heractiveren na churn",
        priority: "low",
        time: "2026-07-08T10:20:00Z",
        status: "resolved",
      },
    ],
    systemStatus: [
      { name: "API Gateway", status: "operational", latency: "42ms" },
      { name: "Supabase Database", status: "operational", latency: "18ms" },
      { name: "AI Agent Runtime", status: "degraded", latency: "890ms" },
      { name: "Peppol Network", status: "operational", latency: "210ms" },
      { name: "Email Delivery", status: "operational", latency: "95ms" },
    ],
    syncedAt: new Date().toISOString(),
  };
}

export function formatEuro(amount: number) {
  return `€ ${amount.toLocaleString("nl-BE")}`;
}

export function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return "Zojuist";
  if (min < 60) return `${min} min geleden`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} u geleden`;
  return `${Math.round(h / 24)} d geleden`;
}

export function formatLogin(iso: string) {
  return new Date(iso).toLocaleString("nl-BE", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function planBadgeVariant(plan: PlatformCompany["plan"]) {
  if (plan === "Enterprise") return "violet" as const;
  if (plan === "Pro") return "info" as const;
  return "default" as const;
}

export function statusBadgeVariant(status: PlatformCompany["status"]) {
  if (status === "active") return "success" as const;
  if (status === "trial") return "info" as const;
  if (status === "past_due") return "warning" as const;
  return "danger" as const;
}

export function statusLabel(status: PlatformCompany["status"]) {
  const map = {
    active: "Actief",
    trial: "Trial",
    past_due: "Achterstallig",
    churned: "Opgezegd",
  };
  return map[status];
}
