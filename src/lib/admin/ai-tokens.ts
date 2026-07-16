import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

type ServiceSupabase = SupabaseClient<Database>;

export type CompanyTokenUsage = {
  companyId: number;
  companyName: string;
  ownerEmail: string | null;
  creditsRemaining: number;
  creditsUsed: number;
  totalPurchased: number;
  totalSpent: number;
  lowBalanceThreshold: number | null;
  tokenLimit: number | null;
  isTrialUser: boolean;
  trialExpiresAt: string | null;
  lastActivity: string | null;
  createdAt: string | null;
};

export type TokenUsageSummary = {
  totalCompanies: number;
  totalCreditsUsed: number;
  totalSpent: number;
  averagePerCompany: number;
  lowBalanceCount: number;
  trialUsersCount: number;
};

export async function fetchCompanyTokenUsage(
  supabase: ServiceSupabase,
): Promise<CompanyTokenUsage[]> {
  const { data: companies, error: companiesError } = await supabase
    .from("bedrijven")
    .select("id, naam, email, created_at, last_activity_at, subscription_status, owner_user_id")
    .order("last_activity_at", { ascending: false, nullsFirst: false });

  if (companiesError) {
    console.error("fetchCompanyTokenUsage - companies:", companiesError.message);
    return [];
  }

  const { data: credits, error: creditsError } = await supabase
    .from("company_ai_credits")
    .select(
      "company_id, credits_remaining, credits_used, total_purchased, total_spent, low_balance_threshold, token_limit",
    );

  if (creditsError) {
    console.error("fetchCompanyTokenUsage - credits:", creditsError.message);
  }

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, email");

  const creditsByCompany = new Map(
    (credits ?? []).map((c) => [c.company_id, c]),
  );

  const profileById = new Map(
    (profiles ?? []).map((p) => [p.id, p]),
  );

  return (companies ?? []).map((company) => {
    const credit = creditsByCompany.get(company.id);
    const owner = company.owner_user_id
      ? profileById.get(company.owner_user_id)
      : null;

    const isTrialUser =
      company.subscription_status?.toLowerCase().includes("trial") ?? false;

    const trialExpiresAt = company.created_at
      ? new Date(
          new Date(company.created_at).getTime() + 14 * 24 * 60 * 60 * 1000,
        ).toISOString()
      : null;

    return {
      companyId: company.id,
      companyName: company.naam,
      ownerEmail: owner?.email ?? company.email ?? null,
      creditsRemaining: credit?.credits_remaining ?? 0,
      creditsUsed: credit?.credits_used ?? 0,
      totalPurchased: credit?.total_purchased ?? 0,
      totalSpent: Number(credit?.total_spent ?? 0),
      lowBalanceThreshold: credit?.low_balance_threshold ?? null,
      tokenLimit: credit?.token_limit ?? null,
      isTrialUser,
      trialExpiresAt,
      lastActivity: company.last_activity_at ?? company.created_at,
      createdAt: company.created_at,
    };
  });
}

export function getTokenUsageSummary(
  companies: CompanyTokenUsage[],
): TokenUsageSummary {
  const totalCompanies = companies.length;
  const totalCreditsUsed = companies.reduce((sum, c) => sum + c.creditsUsed, 0);
  const totalSpent = companies.reduce((sum, c) => sum + c.totalSpent, 0);
  const averagePerCompany = totalCompanies > 0 ? totalCreditsUsed / totalCompanies : 0;
  const lowBalanceCount = companies.filter(
    (c) =>
      c.lowBalanceThreshold &&
      c.creditsRemaining < c.lowBalanceThreshold,
  ).length;
  const trialUsersCount = companies.filter((c) => c.isTrialUser).length;

  return {
    totalCompanies,
    totalCreditsUsed,
    totalSpent,
    averagePerCompany: Math.round(averagePerCompany),
    lowBalanceCount,
    trialUsersCount,
  };
}

export async function updateCompanyTokenLimit(
  supabase: ServiceSupabase,
  companyId: number,
  tokenLimit: number | null,
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase
    .from("company_ai_credits")
    .update({ token_limit: tokenLimit })
    .eq("company_id", companyId);

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

export async function grantCompanyTokens(
  supabase: ServiceSupabase,
  companyId: number,
  tokensToAdd: number,
  note?: string,
): Promise<{ ok: boolean; error?: string }> {
  const { data: current } = await supabase
    .from("company_ai_credits")
    .select("credits_remaining, credits_used, total_purchased")
    .eq("company_id", companyId)
    .maybeSingle();

  if (!current) {
    return { ok: false, error: "Company credits record not found" };
  }

  const newRemaining = current.credits_remaining + tokensToAdd;
  const newPurchased = current.total_purchased + tokensToAdd;

  const { error: updateError } = await supabase
    .from("company_ai_credits")
    .update({
      credits_remaining: newRemaining,
      total_purchased: newPurchased,
    })
    .eq("company_id", companyId);

  if (updateError) {
    return { ok: false, error: updateError.message };
  }

  // Log transaction
  await supabase.from("ai_credit_transactions").insert({
    company_id: companyId,
    type: "admin_grant",
    amount: tokensToAdd,
    credits_before: current.credits_remaining,
    credits_after: newRemaining,
    description: note || `Admin granted ${tokensToAdd} tokens`,
  });

  return { ok: true };
}

export async function bulkUpdateTrialLimits(
  supabase: ServiceSupabase,
  tokenLimit: number,
): Promise<{ ok: boolean; updated: number; error?: string }> {
  // Update all companies with trial status
  const { data: companies } = await supabase
    .from("bedrijven")
    .select("id, subscription_status")
    .ilike("subscription_status", "%trial%");

  if (!companies || companies.length === 0) {
    return { ok: true, updated: 0 };
  }

  const companyIds = companies.map((c) => c.id);

  const { error } = await supabase
    .from("company_ai_credits")
    .update({ token_limit: tokenLimit })
    .in("company_id", companyIds);

  if (error) {
    return { ok: false, updated: 0, error: error.message };
  }

  return { ok: true, updated: companyIds.length };
}
