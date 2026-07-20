import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type {
  AiError,
  CeoDashboardData,
  ChartPoint,
  KpiMetric,
  Payment,
  PlatformCompany,
  Registration,
  SupportTicket,
  SystemService,
} from "@/components/dashboard/admin/ceo-demo-data";
import type {
  CompaniesStat,
  CompanyLogoTone,
  CompanyPlan,
  CompanyStatus,
  ManagedCompany,
} from "@/components/dashboard/admin/companies-data";
import type {
  ActivityEvent,
  CompanyDetail,
  CompanyInvoice,
  CompanyQuote,
  CompanyUser,
  FeatureFlag,
  SecurityEvent,
} from "@/components/dashboard/admin/company-detail-data";
import { fetchPlatformBillingInvoices } from "@/lib/admin/platform-billing";

type ServiceSupabase = SupabaseClient<Database>;

const PLAN_MRR: Record<string, number> = {
  starter: 49,
  pro: 99,
  business: 99,
  enterprise: 199,
};

const LOGO_TONES: CompanyLogoTone[] = [
  "sky",
  "emerald",
  "violet",
  "amber",
  "rose",
  "cyan",
];

function normalizePlan(plan: string | null): CompanyPlan {
  const value = (plan ?? "starter").toLowerCase();
  if (value.includes("enterprise")) return "Enterprise";
  if (value.includes("business") || value === "pro") return "Business";
  return "Starter";
}

function normalizeStatus(
  status: string | null,
  subscriptionStatus: string | null,
  isActive: boolean | null,
): CompanyStatus {
  if (isActive === false) return "suspended";
  const sub = (subscriptionStatus ?? status ?? "").toLowerCase();
  if (sub.includes("trial")) return "trial";
  if (sub.includes("suspend") || sub.includes("cancel")) return "suspended";
  return "active";
}

function planMrr(plan: string | null): number {
  const key = (plan ?? "starter").toLowerCase();
  return PLAN_MRR[key] ?? PLAN_MRR.starter;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function monthKey(date: string | null): string {
  if (!date) return "onbekend";
  const d = new Date(date);
  return d.toLocaleDateString("nl-BE", { month: "short", year: "2-digit" });
}

function buildGrowthChart(
  companies: Array<{ created_at: string | null }>,
): ChartPoint[] {
  const buckets = new Map<string, number>();
  for (const company of companies) {
    if (!company.created_at) continue;
    const key = monthKey(company.created_at);
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }

  let running = 0;
  return Array.from(buckets.entries())
    .slice(-12)
    .map(([month, added]) => {
      running += added;
      return {
        month,
        revenue: 0,
        companies: running,
        aiRequests: 0,
        aiCost: 0,
      };
    });
}

function buildRevenueChart(
  companies: Array<{ plan: string | null; created_at: string | null }>,
): ChartPoint[] {
  const buckets = new Map<string, number>();
  for (const company of companies) {
    if (!company.created_at) continue;
    const key = monthKey(company.created_at);
    buckets.set(key, (buckets.get(key) ?? 0) + planMrr(company.plan));
  }

  return Array.from(buckets.entries())
    .slice(-12)
    .map(([month, revenue]) => ({
      month,
      revenue,
      companies: 0,
      aiRequests: 0,
      aiCost: 0,
    }));
}

export async function fetchManagedCompanies(
  supabase: ServiceSupabase,
): Promise<ManagedCompany[]> {
  const [
    { data: companies, error: companiesError },
    { data: memberships, error: membershipsError },
    { data: credits, error: creditsError },
    { data: profiles, error: profilesError },
  ] =
    await Promise.all([
      supabase
        .from("bedrijven")
        .select(
          "id, naam, email, plan, status, subscription_status, is_active, created_at, last_activity_at, owner_user_id, risicostatus, verificatiestatus",
        )
        .order("created_at", { ascending: false }),
      supabase
        .from("company_memberships")
        .select("company_id, user_id, is_active")
        .eq("is_active", true),
      supabase.from("company_ai_credits").select("company_id, credits_used, total_spent"),
      supabase.from("profiles").select("id, email, full_name"),
    ]);

  const loadError =
    companiesError ?? membershipsError ?? creditsError ?? profilesError;
  if (loadError) {
    throw new Error(
      `Platformbedrijven konden niet worden geladen: ${loadError.message}`,
    );
  }

  const usersByCompany = new Map<number, number>();
  for (const row of memberships ?? []) {
    usersByCompany.set(
      row.company_id,
      (usersByCompany.get(row.company_id) ?? 0) + 1,
    );
  }

  const creditsByCompany = new Map<number, { used: number; spent: number }>();
  for (const row of credits ?? []) {
    creditsByCompany.set(row.company_id, {
      used: row.credits_used ?? 0,
      spent: Number(row.total_spent ?? 0),
    });
  }

  const profileById = new Map(
    (profiles ?? []).map((profile) => [profile.id, profile]),
  );

  return (companies ?? []).map((company, index) => {
    const owner = company.owner_user_id
      ? profileById.get(company.owner_user_id)
      : null;
    const credit = creditsByCompany.get(company.id);

    return {
      id: String(company.id),
      name: company.naam,
      domain: company.email?.split("@")[1] ?? "—",
      owner: owner?.full_name ?? "Onbekend",
      ownerEmail: owner?.email ?? company.email ?? "—",
      plan: normalizePlan(company.plan),
      activeUsers: usersByCompany.get(company.id) ?? 0,
      aiTokensUsed: credit?.used ?? 0,
      aiCost: credit?.spent ?? 0,
      monthlyRevenue: planMrr(company.plan),
      storageUsedGb: null,
      lastLogin: company.last_activity_at ?? company.created_at ?? new Date().toISOString(),
      status: normalizeStatus(
        company.status,
        company.subscription_status,
        company.is_active,
      ),
      risicoStatus: company.risicostatus ?? "normaal",
      verificatieStatus: company.verificatiestatus ?? "onbevestigd",
      createdAt: company.created_at ?? new Date().toISOString(),
      logoInitials: initials(company.naam),
      logoTone: LOGO_TONES[index % LOGO_TONES.length],
    };
  });
}

export function getCompaniesStats(companies: ManagedCompany[]): CompaniesStat[] {
  const active = companies.filter((c) => c.status === "active").length;
  const trial = companies.filter((c) => c.status === "trial").length;
  const suspended = companies.filter((c) => c.status === "suspended").length;
  const mrr = companies
    .filter((c) => c.status !== "suspended")
    .reduce((sum, c) => sum + c.monthlyRevenue, 0);

  return [
    {
      id: "total" as const,
      label: "Totaal bedrijven",
      value: String(companies.length),
      detail: `${active} actief op het platform`,
    },
    {
      id: "active" as const,
      label: "Actief",
      value: String(active),
      detail: `Geschatte pakketwaarde €${mrr.toLocaleString("nl-BE")}/mnd`,
    },
    {
      id: "trial" as const,
      label: "Proefperiode",
      value: String(trial),
      detail: "Nog in proefperiode",
    },
    {
      id: "suspended" as const,
      label: "Opgeschort",
      value: String(suspended),
      detail: "Geblokkeerde accounts",
    },
  ];
}

export async function fetchCeoDashboardData(
  supabase: ServiceSupabase,
): Promise<CeoDashboardData> {
  const companies = await fetchManagedCompanies(supabase);

  const [
    { count: userCount },
    { data: rawCompanies },
    { data: credits },
    { count: pendingActionCount },
    { data: failedLogs },
    { data: recentCompanies },
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("bedrijven").select("id, plan, created_at, subscription_status"),
    supabase.from("company_ai_credits").select("credits_used, total_spent"),
    supabase
      .from("agent_actions")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("agent_activity_logs")
      .select("id, company_id, agent_name, action_type, created_at, message, error_message")
      .not("error_message", "is", null)
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("bedrijven")
      .select("id, naam, plan, created_at, email, last_activity_at, status, subscription_status, is_active")
      .order("last_activity_at", { ascending: false, nullsFirst: false })
      .limit(8),
  ]);

  const mrr = companies
    .filter((c) => c.status !== "suspended")
    .reduce((sum, c) => sum + c.monthlyRevenue, 0);
  const aiUsed = (credits ?? []).reduce((sum, row) => sum + (row.credits_used ?? 0), 0);
  const aiCost = (credits ?? []).reduce(
    (sum, row) => sum + Number(row.total_spent ?? 0),
    0,
  );
  const registrations30d = (rawCompanies ?? []).filter((row) => {
    if (!row.created_at) return false;
    const created = new Date(row.created_at).getTime();
    return Date.now() - created < 30 * 24 * 60 * 60 * 1000;
  }).length;

  const kpis: KpiMetric[] = [
    {
      id: "mrr",
      label: "Geschatte MRR",
      value: `€${mrr.toLocaleString("nl-BE")}`,
      change: `${companies.length} klanten`,
      positive: true,
      icon: "mrr",
      tone: "sky",
    },
    {
      id: "companies",
      label: "Bedrijven",
      value: String(companies.length),
      change: `+${registrations30d} in 30 dagen`,
      positive: registrations30d > 0,
      icon: "companies",
      tone: "emerald",
    },
    {
      id: "users",
      label: "Gebruikers",
      value: String(userCount ?? 0),
      change: "platform-breed",
      positive: true,
      icon: "users",
      tone: "violet",
    },
    {
      id: "registrations",
      label: "Nieuwe accounts",
      value: String(registrations30d),
      change: "laatste 30 dagen",
      positive: registrations30d > 0,
      icon: "registrations",
      tone: "amber",
    },
    {
      id: "ai-requests",
      label: "AI credits gebruikt",
      value: aiUsed.toLocaleString("nl-BE"),
      change: "totaal platform",
      positive: true,
      icon: "ai-requests",
      tone: "cyan",
    },
    {
      id: "ai-cost",
      label: "AI kosten",
      value: `€${aiCost.toFixed(0)}`,
      change: "geregistreerde providerkosten",
      positive: aiCost < 500,
      icon: "ai-cost",
      tone: "rose",
    },
    {
      id: "subscriptions",
      label: "Open goedkeuringen",
      value: String(pendingActionCount ?? 0),
      change: "agent acties wachtend",
      positive: (pendingActionCount ?? 0) < 10,
      icon: "subscriptions",
      tone: "violet",
    },
    {
      id: "alerts",
      label: "AI fouten",
      value: String((failedLogs ?? []).length),
      change: "recente failures",
      positive: (failedLogs ?? []).length === 0,
      icon: "alerts",
      tone: "rose",
    },
  ];

  const companyNameById = new Map(
    companies.map((company) => [Number(company.id), company.name]),
  );

  const platformCompanies: PlatformCompany[] = (recentCompanies ?? []).map(
    (row) => {
      const managed = companies.find((c) => c.id === String(row.id));
      return {
        id: String(row.id),
        name: row.naam,
        plan: (normalizePlan(row.plan) === "Enterprise"
          ? "Enterprise"
          : normalizePlan(row.plan) === "Business"
            ? "Pro"
            : "Starter") as PlatformCompany["plan"],
        users: managed?.activeUsers ?? 0,
        aiUsage: managed?.aiTokensUsed ?? 0,
        revenue: managed?.monthlyRevenue ?? 0,
        lastLogin: row.last_activity_at ?? row.created_at ?? new Date().toISOString(),
        status:
          normalizeStatus(row.status, row.subscription_status, row.is_active) ===
          "trial"
            ? "trial"
            : normalizeStatus(
                  row.status,
                  row.subscription_status,
                  row.is_active,
                ) === "suspended"
              ? "churned"
              : "active",
      };
    },
  );

  const registrations: Registration[] = (rawCompanies ?? [])
    .slice()
    .sort(
      (a, b) =>
        new Date(b.created_at ?? 0).getTime() -
        new Date(a.created_at ?? 0).getTime(),
    )
    .slice(0, 6)
    .map((row) => ({
      id: String(row.id),
      company: companies.find((c) => c.id === String(row.id))?.name ?? `Bedrijf ${row.id}`,
      contact: companies.find((c) => c.id === String(row.id))?.ownerEmail ?? "—",
      plan: normalizePlan(row.plan),
      time: row.created_at ?? new Date().toISOString(),
    }));

  const aiErrors: AiError[] = (failedLogs ?? []).map((row) => ({
    id: String(row.id),
    company: companyNameById.get(row.company_id) ?? `Bedrijf ${row.company_id}`,
    agent: row.agent_name,
    message: row.message ?? row.action_type,
    time: row.created_at,
    severity: "warning" as const,
  }));

  return {
    kpis,
    revenueChart: buildRevenueChart(rawCompanies ?? []),
    companyGrowthChart: buildGrowthChart(rawCompanies ?? []),
    aiUsageChart: [],
    companies: platformCompanies,
    payments: [] as Payment[],
    registrations,
    aiErrors,
    supportTickets: [] as SupportTicket[],
    systemStatus: [
      { name: "Supabase", status: "unknown" },
      { name: "OpenAI", status: "unknown" },
      { name: "Agent executor", status: "unknown" },
      { name: "Peppol", status: "unknown" },
    ] as SystemService[],
    syncedAt: new Date().toISOString(),
  };
}

export type CrmOverview = {
  totalAccounts: number;
  totalCustomers: number;
  totalDeals: number;
  openDeals: number;
  wonDeals: number;
  totalOffertes: number;
  openFacturen: number;
  overdueFacturen: number;
  accounts: Array<{
    companyId: number;
    companyName: string;
    ownerName: string;
    ownerEmail: string;
    plan: CompanyPlan;
    status: CompanyStatus;
    activeUsers: number;
    creditsRemaining: number;
    creditsUsed: number;
    lastActivity: string;
  }>;
  recentDeals: Array<{
    id: number;
    companyId: number;
    title: string;
    companyName: string;
    stage: string;
    value: number;
    updatedAt: string;
  }>;
};

export async function fetchCrmOverview(
  supabase: ServiceSupabase,
): Promise<CrmOverview> {
  const companies = await fetchManagedCompanies(supabase);
  const companyNameById = new Map(
    companies.map((company) => [Number(company.id), company.name]),
  );

  const [
    { count: customerCount },
    { data: deals },
    { count: offerteCount },
    { data: openInvoices },
    { data: credits },
  ] = await Promise.all([
    supabase.from("customers").select("id", { count: "exact", head: true }),
    supabase
      .from("deals")
      .select("id, titel, stadium, waarde, updated_at, bedrijf_id")
      .order("updated_at", { ascending: false })
      .limit(12),
    supabase.from("offertes").select("id", { count: "exact", head: true }),
    supabase
      .from("facturen")
      .select("id, status, vervaldatum")
      .in("status", ["open", "verzonden", "te_laat"]),
    supabase
      .from("company_ai_credits")
      .select("company_id, credits_remaining, credits_used"),
  ]);

  const creditsByCompany = new Map(
    (credits ?? []).map((credit) => [credit.company_id, credit]),
  );

  const allDeals = deals ?? [];
  const openDeals = allDeals.filter(
    (deal) => !["gewonnen", "won", "verloren", "lost"].includes(
      (deal.stadium ?? "").toLowerCase(),
    ),
  ).length;
  const wonDeals = allDeals.filter((deal) =>
    ["gewonnen", "won"].includes((deal.stadium ?? "").toLowerCase()),
  ).length;

  const now = Date.now();
  const overdueFacturen = (openInvoices ?? []).filter((invoice) => {
    if (!invoice.vervaldatum) return false;
    return new Date(invoice.vervaldatum).getTime() < now;
  }).length;

  return {
    totalAccounts: companies.length,
    totalCustomers: customerCount ?? 0,
    totalDeals: allDeals.length,
    openDeals,
    wonDeals,
    totalOffertes: offerteCount ?? 0,
    openFacturen: openInvoices?.length ?? 0,
    overdueFacturen,
    accounts: companies.slice(0, 10).map((company) => {
      const credit = creditsByCompany.get(Number(company.id));
      return {
        companyId: Number(company.id),
        companyName: company.name,
        ownerName: company.owner,
        ownerEmail: company.ownerEmail,
        plan: company.plan,
        status: company.status,
        activeUsers: company.activeUsers,
        creditsRemaining: credit?.credits_remaining ?? 0,
        creditsUsed: credit?.credits_used ?? company.aiTokensUsed,
        lastActivity: company.lastLogin,
      };
    }),
    recentDeals: allDeals.slice(0, 8).map((deal) => ({
      id: deal.id,
      companyId: deal.bedrijf_id ?? 0,
      title: deal.titel ?? "Deal",
      companyName:
        deal.bedrijf_id != null
          ? companyNameById.get(deal.bedrijf_id) ?? `Bedrijf ${deal.bedrijf_id}`
          : "Onbekend",
      stage: deal.stadium ?? "onbekend",
      value: Number(deal.waarde ?? 0),
      updatedAt: deal.updated_at ?? new Date().toISOString(),
    })),
  };
}

export type AiFleetRow = {
  companyId: number;
  companyName: string;
  agentsConfigured: number;
  pendingActions: number;
  executedToday: number;
  creditsUsed: number;
  creditsRemaining: number;
  lastActivity: string | null;
};

export async function fetchAiFleetOverview(
  supabase: ServiceSupabase,
): Promise<AiFleetRow[]> {
  const companies = await fetchManagedCompanies(supabase);

  const [{ data: bedrijven }, { data: actions }, { data: credits }, { data: logs }] =
    await Promise.all([
      supabase.from("bedrijven").select("id, ai_assistant, last_activity_at"),
      supabase
        .from("agent_actions")
        .select("company_id, status, created_at")
        .in("status", ["pending", "executed"]),
      supabase
        .from("company_ai_credits")
        .select("company_id, credits_used, credits_remaining"),
      supabase
        .from("agent_activity_logs")
        .select("company_id, created_at")
        .gte(
          "created_at",
          new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        ),
    ]);

  const agentsByCompany = new Map<number, number>();
  for (const row of bedrijven ?? []) {
    try {
      const parsed = row.ai_assistant ? JSON.parse(row.ai_assistant) : null;
      const count = Array.isArray(parsed?.agents)
        ? parsed.agents.length
        : parsed?.agents
          ? Object.keys(parsed.agents).length
          : 4;
      agentsByCompany.set(row.id, count);
    } catch {
      agentsByCompany.set(row.id, 4);
    }
  }

  const pendingByCompany = new Map<number, number>();
  const executedTodayByCompany = new Map<number, number>();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  for (const action of actions ?? []) {
    if (action.status === "pending") {
      pendingByCompany.set(
        action.company_id,
        (pendingByCompany.get(action.company_id) ?? 0) + 1,
      );
    }
    if (
      action.status === "executed" &&
      new Date(action.created_at).getTime() >= todayStart.getTime()
    ) {
      executedTodayByCompany.set(
        action.company_id,
        (executedTodayByCompany.get(action.company_id) ?? 0) + 1,
      );
    }
  }

  const creditsByCompany = new Map(
    (credits ?? []).map((row) => [row.company_id, row]),
  );

  const lastLogByCompany = new Map<number, string>();
  for (const log of logs ?? []) {
    const current = lastLogByCompany.get(log.company_id);
    if (!current || new Date(log.created_at) > new Date(current)) {
      lastLogByCompany.set(log.company_id, log.created_at);
    }
  }

  return companies.map((company) => {
    const id = Number(company.id);
    const credit = creditsByCompany.get(id);
    return {
      companyId: id,
      companyName: company.name,
      agentsConfigured: agentsByCompany.get(id) ?? 0,
      pendingActions: pendingByCompany.get(id) ?? 0,
      executedToday: executedTodayByCompany.get(id) ?? 0,
      creditsUsed: credit?.credits_used ?? company.aiTokensUsed,
      creditsRemaining: credit?.credits_remaining ?? 0,
      lastActivity:
        lastLogByCompany.get(id) ??
        bedrijven?.find((row) => row.id === id)?.last_activity_at ??
        null,
    };
  });
}

async function fetchManagedCompany(
  supabase: ServiceSupabase,
  companyId: number,
): Promise<ManagedCompany | null> {
  const { data: company, error: companyError } = await supabase
    .from("bedrijven")
    .select(
      "id, naam, email, plan, status, subscription_status, is_active, created_at, last_activity_at, owner_user_id, risicostatus, verificatiestatus",
    )
    .eq("id", companyId)
    .maybeSingle();

  if (companyError) {
    throw new Error(`Bedrijf kon niet worden geladen: ${companyError.message}`);
  }
  if (!company) return null;

  const [
    { count: activeUsers, error: membershipsError },
    { data: credit, error: creditsError },
    ownerResult,
  ] = await Promise.all([
    supabase
      .from("company_memberships")
      .select("id", { count: "exact", head: true })
      .eq("company_id", companyId)
      .eq("is_active", true),
    supabase
      .from("company_ai_credits")
      .select("credits_used, total_spent")
      .eq("company_id", companyId)
      .maybeSingle(),
    company.owner_user_id
      ? supabase
          .from("profiles")
          .select("email, full_name")
          .eq("id", company.owner_user_id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  const relationError =
    membershipsError ?? creditsError ?? ownerResult.error;
  if (relationError) {
    throw new Error(
      `Bedrijfsrelaties konden niet worden geladen: ${relationError.message}`,
    );
  }

  return {
    id: String(company.id),
    name: company.naam,
    domain: company.email?.split("@")[1] ?? "—",
    owner: ownerResult.data?.full_name ?? "Onbekend",
    ownerEmail: ownerResult.data?.email ?? company.email ?? "—",
    plan: normalizePlan(company.plan),
    activeUsers: activeUsers ?? 0,
    aiTokensUsed: credit?.credits_used ?? 0,
    aiCost: Number(credit?.total_spent ?? 0),
    monthlyRevenue: planMrr(company.plan),
    storageUsedGb: null,
    lastLogin: company.last_activity_at ?? company.created_at ?? "",
    status: normalizeStatus(
      company.status,
      company.subscription_status,
      company.is_active,
    ),
    risicoStatus: company.risicostatus ?? "normaal",
    verificatieStatus: company.verificatiestatus ?? "onbevestigd",
    createdAt: company.created_at ?? "",
    logoInitials: initials(company.naam),
    logoTone: LOGO_TONES[company.id % LOGO_TONES.length] ?? "sky",
  };
}

export async function fetchCompanyDetail(
  supabase: ServiceSupabase,
  companyId: number,
): Promise<CompanyDetail | null> {
  const company = await fetchManagedCompany(supabase, companyId);
  if (!company) return null;

  const [
    { data: memberships, error: membershipsError },
    { data: offertes, error: offertesError },
    { data: facturen, error: facturenError },
    { data: credits, error: creditsError },
    { data: activity, error: activityError },
    { data: bedrijf, error: bedrijfError },
    { data: auditLogs, error: auditLogsError },
    platformInvoices,
  ] = await Promise.all([
    supabase
      .from("company_memberships")
      .select("user_id, role, is_active, joined_at, created_at")
      .eq("company_id", companyId),
    supabase
      .from("offertes")
      .select("id, nummer, klant, bedrag, status, created_at, geldig_tot")
      .eq("bedrijf_id", companyId)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("facturen")
      .select("id, nummer, klant, totaal_bedrag, status, vervaldatum, paid_at")
      .eq("bedrijf_id", companyId)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("company_ai_credits")
      .select("*")
      .eq("company_id", companyId)
      .maybeSingle(),
    supabase
      .from("agent_activity_logs")
      .select("id, agent_name, action_type, message, error_message, created_at")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })
      .limit(12),
    supabase
      .from("bedrijven")
      .select("ai_assistant, subscription_status, risicostatus, verificatiestatus")
      .eq("id", companyId)
      .maybeSingle(),
    supabase
      .from("audit_logs")
      .select("id, event_category, event_type, severity, created_at, metadata")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })
      .limit(50),
    fetchPlatformBillingInvoices(supabase, companyId),
  ]);

  const detailError =
    membershipsError ??
    offertesError ??
    facturenError ??
    creditsError ??
    activityError ??
    bedrijfError ??
    auditLogsError;
  if (detailError) {
    throw new Error(
      `Bedrijfsdossier kon niet volledig worden geladen: ${detailError.message}`,
    );
  }

  const memberIds = Array.from(
    new Set((memberships ?? []).map((membership) => membership.user_id)),
  );
  const { data: profiles, error: profilesError } =
    memberIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, email, full_name")
          .in("id", memberIds)
      : { data: [], error: null };
  if (profilesError) {
    throw new Error(
      `Bedrijfsgebruikers konden niet worden geladen: ${profilesError.message}`,
    );
  }

  const profileById = new Map(
    (profiles ?? []).map((profile) => [profile.id, profile]),
  );

  const users: CompanyUser[] = (memberships ?? []).map((membership) => {
    const profile = profileById.get(membership.user_id);
    return {
      id: membership.user_id,
      name: profile?.full_name ?? "Gebruiker",
      role: membership.role,
      email: profile?.email ?? "—",
      lastLogin: membership.joined_at ?? membership.created_at ?? new Date().toISOString(),
      status: membership.is_active ? "active" : "disabled",
      aiUsage: 0,
      createdAt: membership.created_at ?? new Date().toISOString(),
    };
  });

  const quotes: CompanyQuote[] = (offertes ?? []).map((offerte) => ({
    id: String(offerte.id),
    quoteNumber: offerte.nummer ?? `OFF-${offerte.id}`,
    customer: offerte.klant ?? "—",
    amount: Number(offerte.bedrag ?? 0),
    status: (offerte.status as CompanyQuote["status"]) ?? "draft",
    createdAt: offerte.created_at ?? new Date().toISOString(),
    validUntil: offerte.geldig_tot ?? new Date().toISOString(),
  }));

  const invoices: CompanyInvoice[] = (facturen ?? []).map((factuur) => ({
    id: String(factuur.id),
    invoiceNumber: factuur.nummer ?? `FAC-${factuur.id}`,
    customer: factuur.klant ?? "—",
    amount: Number(factuur.totaal_bedrag ?? 0),
    status: (factuur.status as CompanyInvoice["status"]) ?? "open",
    dueDate: factuur.vervaldatum ?? new Date().toISOString(),
    paidDate: factuur.paid_at,
  }));

  const events: ActivityEvent[] = (activity ?? []).map((row) => ({
    id: String(row.id),
    type: "ai",
    title: row.action_type,
    detail: row.message ?? row.agent_name,
    time: row.created_at,
    actor: row.agent_name,
  }));

  const securityEvents: SecurityEvent[] = (auditLogs ?? []).map((row) => {
    const metadata =
      row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata)
        ? row.metadata
        : null;
    const outcome =
      metadata && typeof metadata.outcome === "string"
        ? metadata.outcome.replaceAll("_", " ")
        : null;

    return {
      id: String(row.id),
      category: row.event_category,
      detail: outcome
        ? `${row.event_type.replaceAll(".", " ")} — ${outcome}`
        : row.event_type.replaceAll(".", " "),
      severity:
        row.severity === "critical" || row.severity === "warning"
          ? row.severity
          : ("info" as const),
      time: row.created_at,
    };
  });

  let featureFlags: FeatureFlag[] = [
    { key: "ai_agents", label: "AI Agents", enabled: true },
    { key: "peppol", label: "Peppol", enabled: true },
    { key: "incasso", label: "Incasso automatisering", enabled: true },
  ];

  try {
    const parsed = bedrijf?.ai_assistant ? JSON.parse(bedrijf.ai_assistant) : null;
    if (parsed?.incasso) {
      featureFlags = featureFlags.map((flag) =>
        flag.key === "incasso"
          ? { ...flag, enabled: Boolean(parsed.incasso.enabled ?? true) }
          : flag,
      );
    }
  } catch {
    // keep defaults
  }

  return {
    company,
    stripeCustomerId: credits?.stripe_customer_id ?? "—",
    subscriptionStatus:
      (bedrijf?.subscription_status as CompanyDetail["subscriptionStatus"]) ??
      "active",
    risicoStatus: bedrijf?.risicostatus ?? company.risicoStatus ?? "normaal",
    verificatieStatus:
      bedrijf?.verificatiestatus ?? company.verificatieStatus ?? "onbevestigd",
    nextInvoiceDate: "",
    requestsToday: activity?.length ?? 0,
    failedRequests: activity?.filter((row) => row.error_message).length ?? 0,
    projectsTotal: 0,
    twoFactorStatus: "partial",
    activeSessions: users.filter((user) => user.status === "active").length,
    failedLogins: 0,
    users,
    projects: [],
    quotes,
    invoices,
    aiUsageChart: [],
    providerBreakdown: [],
    paymentHistory: [],
    platformInvoices,
    failedPayments: [],
    activity: events,
    auditLog: securityEvents,
    systemNotes: [],
    featureFlags,
    planLimits: {
      users: 50,
      projects: 100,
      monthlyTokens: 1_000_000,
      storageGb: 100,
    },
  };
}
