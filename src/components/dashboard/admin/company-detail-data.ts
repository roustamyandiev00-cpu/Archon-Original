import {
  getCompaniesManagementData,
  type ManagedCompany,
} from "@/components/dashboard/admin/companies-data";
import type { PlatformBillingInvoice } from "@/lib/admin/platform-billing";

export type CompanyUser = {
  id: string;
  name: string;
  role: string;
  email: string;
  lastLogin: string;
  status: "active" | "invited" | "disabled";
  aiUsage: number;
  createdAt: string;
};

export type CompanyProject = {
  id: string;
  project: string;
  customer: string;
  status: "planning" | "active" | "paused" | "completed";
  value: number;
  startDate: string;
  deadline: string;
  owner: string;
};

export type CompanyQuote = {
  id: string;
  quoteNumber: string;
  customer: string;
  amount: number;
  status: "draft" | "sent" | "accepted" | "expired";
  createdAt: string;
  validUntil: string;
};

export type CompanyInvoice = {
  id: string;
  invoiceNumber: string;
  customer: string;
  amount: number;
  status: "paid" | "open" | "overdue" | "draft";
  dueDate: string;
  paidDate: string | null;
};

export type AiUsagePoint = {
  day: string;
  requests: number;
  tokens: number;
  cost: number;
};

export type ProviderUsage = {
  provider: "OpenAI" | "Claude" | "Gemini";
  tokens: number;
  cost: number;
  successRate: number;
};

export type PaymentRecord = {
  id: string;
  date: string;
  amount: number;
  status: "paid" | "failed" | "scheduled";
  method: string;
  reference: string;
};

export type ActivityEvent = {
  id: string;
  type:
    | "login"
    | "invoice"
    | "quote"
    | "ai"
    | "user"
    | "billing"
    | "security";
  title: string;
  detail: string;
  time: string;
  actor: string;
};

export type SecurityEvent = {
  id: string;
  category: string;
  detail: string;
  severity: "info" | "warning" | "critical";
  time: string;
};

export type SystemNote = {
  id: string;
  title: string;
  body: string;
  tone: "info" | "warning" | "success";
};

export type FeatureFlag = {
  key: string;
  label: string;
  enabled: boolean;
};

export type CompanyDetail = {
  company: ManagedCompany;
  stripeCustomerId: string;
  subscriptionStatus: "active" | "trialing" | "past_due" | "paused";
  /** Intern (§4.4) — alleen platform-admin. */
  risicoStatus: string;
  verificatieStatus: string;
  nextInvoiceDate: string;
  requestsToday: number;
  failedRequests: number;
  projectsTotal: number;
  twoFactorStatus: "enforced" | "partial" | "disabled";
  activeSessions: number;
  failedLogins: number;
  users: CompanyUser[];
  projects: CompanyProject[];
  quotes: CompanyQuote[];
  invoices: CompanyInvoice[];
  aiUsageChart: AiUsagePoint[];
  providerBreakdown: ProviderUsage[];
  paymentHistory: PaymentRecord[];
  platformInvoices: PlatformBillingInvoice[];
  failedPayments: PaymentRecord[];
  activity: ActivityEvent[];
  auditLog: SecurityEvent[];
  systemNotes: SystemNote[];
  featureFlags: FeatureFlag[];
  planLimits: {
    users: number;
    projects: number;
    monthlyTokens: number;
    storageGb: number;
  };
};

const ownerNames = [
  "Milan Verstraeten",
  "Koen De Vlaming",
  "Lotte Peeters",
  "Nadia El Amrani",
  "Bram Janssens",
  "Sarah Van den Broeck",
  "Tom Mertens",
  "Jeroen Claes",
];

const projectTemplates = [
  "Residentiele renovatie",
  "Nieuwbouw werf",
  "Dakisolatie fase 2",
  "Commerciele verbouwing",
  "EPB optimalisatie",
];

function getCompanyOrDefault(companyId: string) {
  const companies = getCompaniesManagementData();
  return (
    companies.find((company) => company.id === companyId) ??
    companies.find((company) => company.id === "archonpro-bv") ??
    companies[0]
  );
}

export function getCompanyDetail(companyId: string): CompanyDetail | null {
  const company = getCompaniesManagementData().find(
    (item) => item.id === companyId,
  );
  if (!company) return null;
  return buildCompanyDetail(company);
}

export function getCompanyDetailPreview(companyId = "archonpro-bv") {
  return buildCompanyDetail(getCompanyOrDefault(companyId));
}

function buildCompanyDetail(company: ManagedCompany): CompanyDetail {
  const enterprise = company.plan === "Enterprise";
  const starter = company.plan === "Starter";
  const active = company.status === "active";
  const seed = company.name.length + company.activeUsers;
  const userCount = Math.min(company.activeUsers, enterprise ? 8 : starter ? 4 : 6);
  const users = buildUsers(company, userCount);
  const projects = buildProjects(company, enterprise ? 6 : starter ? 3 : 5);
  const quotes = buildQuotes(company);
  const invoices = buildInvoices(company);
  const failedPayments = active ? [] : buildFailedPayments(company);

  return {
    company,
    stripeCustomerId: `cus_${company.id.replace(/-/g, "_").slice(0, 18)}`,
    subscriptionStatus:
      company.status === "trial"
        ? "trialing"
        : company.status === "suspended"
          ? "paused"
          : "active",
    risicoStatus: company.risicoStatus ?? "normaal",
    verificatieStatus: company.verificatieStatus ?? "onbevestigd",
    nextInvoiceDate: "2026-08-01T09:00:00Z",
    requestsToday: Math.round(company.aiTokensUsed / 920),
    failedRequests: active ? seed % 9 : 17 + (seed % 8),
    projectsTotal: projects.length + (enterprise ? 18 : starter ? 4 : 11),
    twoFactorStatus: enterprise ? "enforced" : starter ? "partial" : "partial",
    activeSessions: Math.max(2, Math.round(company.activeUsers / 5)),
    failedLogins: active ? seed % 5 : 14,
    users,
    projects,
    quotes,
    invoices,
    aiUsageChart: buildAiUsageChart(company),
    providerBreakdown: buildProviderBreakdown(company),
    paymentHistory: buildPaymentHistory(company),
    platformInvoices: [],
    failedPayments,
    activity: buildActivity(company),
    auditLog: buildAuditLog(company),
    systemNotes: buildSystemNotes(company),
    featureFlags: [
      { key: "ai_followups", label: "AI follow-ups", enabled: true },
      { key: "peppol_invoicing", label: "Peppol invoicing", enabled: !starter },
      { key: "advanced_analytics", label: "Advanced analytics", enabled: !starter },
      { key: "priority_support", label: "Priority support", enabled: enterprise },
      { key: "custom_roles", label: "Custom roles", enabled: enterprise },
    ],
    planLimits: {
      users: enterprise ? 150 : starter ? 10 : 60,
      projects: enterprise ? 500 : starter ? 25 : 160,
      monthlyTokens: enterprise ? 5000000 : starter ? 250000 : 1500000,
      storageGb: enterprise ? 4096 : starter ? 128 : 1024,
    },
  };
}

function buildUsers(company: ManagedCompany, count: number): CompanyUser[] {
  return Array.from({ length: count }, (_, index) => {
    const name = index === 0 ? company.owner : ownerNames[(index + company.name.length) % ownerNames.length];
    const role = index === 0 ? "Owner" : index % 3 === 0 ? "Admin" : index % 2 === 0 ? "Finance" : "Project Manager";
    return {
      id: `${company.id}-user-${index + 1}`,
      name,
      role,
      email:
        index === 0
          ? company.ownerEmail
          : `${name.toLowerCase().replaceAll(" ", ".")}@${company.domain}`,
      lastLogin: `2026-07-${String(10 - (index % 6)).padStart(2, "0")}T0${8 + (index % 2)}:${String(12 + index * 5).padStart(2, "0")}:00Z`,
      status: index === count - 1 && company.status === "suspended" ? "disabled" : index === count - 2 ? "invited" : "active",
      aiUsage: Math.round(company.aiTokensUsed / (count + 1) + index * 3800),
      createdAt: `2026-0${(index % 6) + 1}-1${index % 8}T10:00:00Z`,
    };
  });
}

function buildProjects(company: ManagedCompany, count: number): CompanyProject[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `${company.id}-project-${index + 1}`,
    project: `${projectTemplates[index % projectTemplates.length]} ${index + 1}`,
    customer: ["Familie Peeters", "VME Parkzicht", "Studio Lima", "Gemeente Lier", "Kantoor Veld"][index % 5],
    status: index === 0 ? "active" : index === 1 ? "planning" : index === 2 ? "paused" : index === 3 ? "completed" : "active",
    value: Math.round(company.monthlyRevenue * (8 + index * 2.4)),
    startDate: `2026-0${(index % 6) + 1}-0${(index % 8) + 1}T09:00:00Z`,
    deadline: `2026-${String((index % 6) + 7).padStart(2, "0")}-1${index % 8}T17:00:00Z`,
    owner: index === 0 ? company.owner : ownerNames[(index + 2) % ownerNames.length],
  }));
}

function buildQuotes(company: ManagedCompany): CompanyQuote[] {
  return Array.from({ length: 5 }, (_, index) => ({
    id: `${company.id}-quote-${index + 1}`,
    quoteNumber: `Q-${company.logoInitials}-${2026}${String(index + 18).padStart(3, "0")}`,
    customer: ["Van Hove BV", "Familie Janssens", "Immo Centrum", "De Smet Projects", "VME Rivierzicht"][index],
    amount: Math.round(company.monthlyRevenue * (2.8 + index * 0.9)),
    status: index === 0 ? "sent" : index === 1 ? "accepted" : index === 2 ? "draft" : index === 3 ? "expired" : "sent",
    createdAt: `2026-07-0${index + 3}T11:00:00Z`,
    validUntil: `2026-08-${String(index + 4).padStart(2, "0")}T23:59:00Z`,
  }));
}

function buildInvoices(company: ManagedCompany): CompanyInvoice[] {
  return Array.from({ length: 5 }, (_, index) => ({
    id: `${company.id}-invoice-${index + 1}`,
    invoiceNumber: `INV-${company.logoInitials}-${2026}${String(index + 41).padStart(3, "0")}`,
    customer: ["VME Parkzicht", "Bouwconsult Lier", "Familie Peeters", "Interieur Lima", "Atlas Engineering"][index],
    amount: Math.round(company.monthlyRevenue * (1.6 + index * 0.7)),
    status: index === 0 ? "paid" : index === 1 ? "open" : index === 2 ? "overdue" : index === 3 ? "draft" : "paid",
    dueDate: `2026-07-${String(16 + index * 3).padStart(2, "0")}T12:00:00Z`,
    paidDate: index === 0 || index === 4 ? `2026-07-${String(9 + index).padStart(2, "0")}T15:20:00Z` : null,
  }));
}

function buildAiUsageChart(company: ManagedCompany): AiUsagePoint[] {
  const days = ["1 Jul", "5 Jul", "9 Jul", "13 Jul", "17 Jul", "21 Jul", "25 Jul"];
  return days.map((day, index) => {
    const factor = 0.7 + index * 0.08;
    return {
      day,
      requests: Math.round((company.aiTokensUsed / 1600) * factor),
      tokens: Math.round((company.aiTokensUsed / 12) * factor),
      cost: Number((company.aiCost / 7 * factor).toFixed(2)),
    };
  });
}

function buildProviderBreakdown(company: ManagedCompany): ProviderUsage[] {
  return [
    {
      provider: "OpenAI",
      tokens: Math.round(company.aiTokensUsed * 0.64),
      cost: Number((company.aiCost * 0.68).toFixed(2)),
      successRate: 99.2,
    },
    {
      provider: "Claude",
      tokens: Math.round(company.aiTokensUsed * 0.24),
      cost: Number((company.aiCost * 0.22).toFixed(2)),
      successRate: 98.7,
    },
    {
      provider: "Gemini",
      tokens: Math.round(company.aiTokensUsed * 0.12),
      cost: Number((company.aiCost * 0.1).toFixed(2)),
      successRate: 97.9,
    },
  ];
}

function buildPaymentHistory(company: ManagedCompany): PaymentRecord[] {
  return Array.from({ length: 4 }, (_, index) => ({
    id: `${company.id}-payment-${index + 1}`,
    date: `2026-0${7 - index}-01T09:00:00Z`,
    amount: company.monthlyRevenue,
    status: index === 0 && company.status === "suspended" ? "failed" : "paid",
    method: "Stripe SEPA",
    reference: `stripe_${company.logoInitials.toLowerCase()}_${202607 - index}`,
  }));
}

function buildFailedPayments(company: ManagedCompany): PaymentRecord[] {
  return [
    {
      id: `${company.id}-failed-payment-1`,
      date: "2026-07-01T09:00:00Z",
      amount: company.monthlyRevenue,
      status: "failed",
      method: "Stripe SEPA",
      reference: "insufficient_funds",
    },
  ];
}

function buildActivity(company: ManagedCompany): ActivityEvent[] {
  return [
    {
      id: `${company.id}-activity-login`,
      type: "login",
      title: "Owner signed in",
      detail: `${company.owner} opened the company dashboard`,
      time: company.lastLogin,
      actor: company.owner,
    },
    {
      id: `${company.id}-activity-invoice`,
      type: "invoice",
      title: "Invoice created",
      detail: "Invoice INV-2026-044 was generated from an accepted quote",
      time: "2026-07-10T07:22:00Z",
      actor: "Finance agent",
    },
    {
      id: `${company.id}-activity-quote`,
      type: "quote",
      title: "Quote accepted",
      detail: "Customer approved Q-2026-021 through the portal",
      time: "2026-07-09T15:12:00Z",
      actor: "Customer portal",
    },
    {
      id: `${company.id}-activity-ai`,
      type: "ai",
      title: "AI follow-up drafted",
      detail: "Ela prepared a follow-up email for two open quotes",
      time: "2026-07-09T10:44:00Z",
      actor: "Ela",
    },
    {
      id: `${company.id}-activity-user`,
      type: "user",
      title: "Role changed",
      detail: "Project Manager granted invoice access",
      time: "2026-07-08T12:30:00Z",
      actor: company.owner,
    },
    {
      id: `${company.id}-activity-billing`,
      type: "billing",
      title: "Subscription renewed",
      detail: `${company.plan} plan renewed successfully`,
      time: "2026-07-01T09:00:00Z",
      actor: "Stripe",
    },
  ];
}

function buildAuditLog(company: ManagedCompany): SecurityEvent[] {
  return [
    {
      id: `${company.id}-audit-1`,
      category: "Active sessions",
      detail: "12 active browser sessions across 6 users",
      severity: "info",
      time: "2026-07-10T08:55:00Z",
    },
    {
      id: `${company.id}-audit-2`,
      category: "Failed logins",
      detail: company.status === "suspended" ? "Spike detected from unknown IP range" : "No abnormal pattern detected",
      severity: company.status === "suspended" ? "warning" : "info",
      time: "2026-07-09T22:18:00Z",
    },
    {
      id: `${company.id}-audit-3`,
      category: "Permission changes",
      detail: "Invoice export permission changed for finance role",
      severity: "info",
      time: "2026-07-08T12:30:00Z",
    },
  ];
}

function buildSystemNotes(company: ManagedCompany): SystemNote[] {
  return [
    {
      id: `${company.id}-note-1`,
      title: "Account health",
      body:
        company.status === "active"
          ? "Usage is healthy and subscription is in good standing."
          : "Review billing and support context before reactivation.",
      tone: company.status === "active" ? "success" : "warning",
    },
    {
      id: `${company.id}-note-2`,
      title: "AI governance",
      body: "Monthly token consumption is within the configured plan limit.",
      tone: "info",
    },
    {
      id: `${company.id}-note-3`,
      title: "Storage",
      body: "Storage growth is normal for active project volume.",
      tone: "info",
    },
  ];
}
