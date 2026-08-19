import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

type ServiceSupabase = SupabaseClient<Database>;

export type CeoInsight = {
  id: string;
  severity: "info" | "warning" | "critical";
  category: "crm" | "ai" | "billing" | "growth" | "risk";
  title: string;
  detail: string;
  companyId?: number;
  companyName?: string;
  actionLabel?: string;
  actionHref?: string;
  metric?: string;
};

export async function fetchCeoInsights(
  supabase: ServiceSupabase,
): Promise<CeoInsight[]> {
  const insights: CeoInsight[] = [];

  const [
    { data: companies },
    { data: overdueInvoices },
    { data: pendingActions },
    { data: lowCredits },
    { data: staleCompanies },
    { data: failedAgents },
  ] = await Promise.all([
    supabase
      .from("bedrijven")
      .select("id, naam, created_at, last_activity_at, subscription_status")
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("facturen")
      .select("id, bedrijf_id, nummer, klant, totaal_bedrag, vervaldatum, status")
      .in("status", ["open", "verzonden", "te_laat"])
      .lt("vervaldatum", new Date().toISOString())
      .limit(10),
    supabase
      .from("agent_actions")
      .select("id, company_id, title, agent_name, created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(10),
    supabase
      .from("company_ai_credits")
      .select("company_id, credits_remaining, low_balance_threshold")
      .lt("credits_remaining", 100)
      .limit(10),
    supabase
      .from("bedrijven")
      .select("id, naam, last_activity_at")
      .or(
        `last_activity_at.is.null,last_activity_at.lt.${new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()}`,
      )
      .limit(8),
    supabase
      .from("agent_activity_logs")
      .select("id, company_id, agent_name, message, error_message, created_at")
      .not("error_message", "is", null)
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  const companyNameById = new Map(
    (companies ?? []).map((company) => [company.id, company.naam]),
  );

  for (const invoice of overdueInvoices ?? []) {
    insights.push({
      id: `overdue-${invoice.id}`,
      severity: "warning",
      category: "crm",
      title: "Achterstallige factuur",
      detail: `${invoice.klant ?? "Klant"} — €${Number(invoice.totaal_bedrag ?? 0).toLocaleString("nl-BE")} (${invoice.nummer ?? invoice.id})`,
      companyId: invoice.bedrijf_id ?? undefined,
      companyName:
        invoice.bedrijf_id != null
          ? companyNameById.get(invoice.bedrijf_id)
          : undefined,
      actionLabel: "Bekijk bedrijf",
      actionHref:
        invoice.bedrijf_id != null
          ? `/admin/companies/${invoice.bedrijf_id}`
          : undefined,
      metric: invoice.vervaldatum ?? undefined,
    });
  }

  for (const action of pendingActions ?? []) {
    insights.push({
      id: `pending-${action.id}`,
      severity: "info",
      category: "ai",
      title: "Agent wacht op goedkeuring",
      detail: `${action.agent_name}: ${action.title}`,
      companyId: action.company_id,
      companyName: companyNameById.get(action.company_id),
      actionLabel: "Open bedrijf",
      actionHref: `/admin/companies/${action.company_id}`,
    });
  }

  for (const credit of lowCredits ?? []) {
    insights.push({
      id: `credits-${credit.company_id}`,
      severity: "warning",
      category: "billing",
      title: "Lage AI-credits",
      detail: `Nog ${credit.credits_remaining} credits over`,
      companyId: credit.company_id,
      companyName: companyNameById.get(credit.company_id),
      actionLabel: "Credits bekijken",
      actionHref: `/admin/companies/${credit.company_id}`,
      metric: String(credit.credits_remaining),
    });
  }

  for (const company of staleCompanies ?? []) {
    insights.push({
      id: `stale-${company.id}`,
      severity: "info",
      category: "risk",
      title: "Inactieve klant",
      detail: `${company.naam} — geen activiteit >14 dagen`,
      companyId: company.id,
      companyName: company.naam,
      actionLabel: "Contact opnemen",
      actionHref: `/admin/companies/${company.id}`,
    });
  }

  for (const failure of failedAgents ?? []) {
    insights.push({
      id: `fail-${failure.id}`,
      severity: "critical",
      category: "ai",
      title: "Agent-fout",
      detail: `${failure.agent_name}: ${failure.error_message ?? failure.message ?? "Onbekende fout"}`,
      companyId: failure.company_id,
      companyName: companyNameById.get(failure.company_id),
      actionLabel: "Onderzoeken",
      actionHref: `/admin/ai-agents`,
    });
  }

  const recentSignups = (companies ?? []).filter((company) => {
    if (!company.created_at) return false;
    return Date.now() - new Date(company.created_at).getTime() < 7 * 24 * 60 * 60 * 1000;
  });

  for (const signup of recentSignups) {
    insights.push({
      id: `signup-${signup.id}`,
      severity: "info",
      category: "growth",
      title: "Nieuwe registratie",
      detail: `${signup.naam} is deze week gestart`,
      companyId: signup.id,
      companyName: signup.naam,
      actionLabel: "Onboarding check",
      actionHref: `/admin/companies/${signup.id}`,
    });
  }

  const severityOrder = { critical: 0, warning: 1, info: 2 } as const;
  return insights.sort(
    (a, b) => severityOrder[a.severity] - severityOrder[b.severity],
  );
}
