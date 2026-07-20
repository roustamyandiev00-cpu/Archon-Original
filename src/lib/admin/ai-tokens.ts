import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

type ServiceSupabase = SupabaseClient<Database>;

type AtomicGrantRow = {
  transaction_id: string;
  credits_before: number;
  credits_after: number;
  applied: boolean;
};

type AtomicGrantRpcClient = {
  rpc: (
    functionName: "ceo_grant_ai_credits",
    parameters: {
      p_company_id: number;
      p_tokens: number;
      p_actor_user_id: string;
      p_idempotency_key: string;
      p_note: string | null;
    },
  ) => PromiseLike<{
    data: AtomicGrantRow[] | null;
    error: { message: string } | null;
  }>;
};

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

export type TokenUsageTrendPoint = {
  date: string;
  tokens: number;
};

export async function fetchCompanyTokenUsage(
  supabase: ServiceSupabase,
): Promise<CompanyTokenUsage[]> {
  const { data: companies, error: companiesError } = await supabase
    .from("bedrijven")
    .select("id, naam, email, created_at, last_activity_at, subscription_status, owner_user_id")
    .order("last_activity_at", { ascending: false, nullsFirst: false });

  if (companiesError) {
    throw new Error(`Bedrijven konden niet worden geladen: ${companiesError.message}`);
  }

  const { data: credits, error: creditsError } = await supabase
    .from("company_ai_credits")
    .select(
      "company_id, credits_remaining, credits_used, total_purchased, total_spent, low_balance_threshold, token_limit",
    );

  if (creditsError) {
    throw new Error(`AI-credits konden niet worden geladen: ${creditsError.message}`);
  }

  const ownerIds = Array.from(
    new Set(
      (companies ?? [])
        .map((company) => company.owner_user_id)
        .filter((id): id is string => Boolean(id)),
    ),
  );
  const { data: profiles, error: profilesError } =
    ownerIds.length > 0
      ? await supabase.from("profiles").select("id, email").in("id", ownerIds)
      : { data: [], error: null };

  if (profilesError) {
    throw new Error(
      `Bedrijfseigenaars konden niet worden geladen: ${profilesError.message}`,
    );
  }

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

export async function fetchTokenUsageTrend(
  supabase: ServiceSupabase,
): Promise<TokenUsageTrendPoint[]> {
  const monthStarts = Array.from({ length: 6 }, (_, index) => {
    const date = new Date();
    date.setUTCDate(1);
    date.setUTCHours(0, 0, 0, 0);
    date.setUTCMonth(date.getUTCMonth() - (5 - index));
    return date;
  });
  const firstMonth = monthStarts[0];
  if (!firstMonth) return [];

  const { data, error } = await supabase
    .from("ai_credit_transactions")
    .select("amount, created_at")
    .gte("created_at", firstMonth.toISOString())
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Tokenhistoriek kon niet worden geladen: ${error.message}`);
  }

  const tokensByMonth = new Map(
    monthStarts.map((date) => [
      `${date.getUTCFullYear()}-${date.getUTCMonth()}`,
      0,
    ]),
  );
  for (const transaction of data ?? []) {
    if (transaction.amount >= 0) continue;
    const createdAt = new Date(transaction.created_at);
    const key = `${createdAt.getUTCFullYear()}-${createdAt.getUTCMonth()}`;
    if (tokensByMonth.has(key)) {
      tokensByMonth.set(key, (tokensByMonth.get(key) ?? 0) + Math.abs(transaction.amount));
    }
  }

  return monthStarts.map((date) => ({
    date: date.toLocaleDateString("nl-BE", {
      month: "short",
      year: "2-digit",
      timeZone: "UTC",
    }),
    tokens:
      tokensByMonth.get(`${date.getUTCFullYear()}-${date.getUTCMonth()}`) ?? 0,
  }));
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
  actorUserId: string,
  idempotencyKey: string,
  note?: string,
): Promise<
  | {
      ok: true;
      applied: boolean;
      transactionId: string;
      creditsBefore: number;
      creditsAfter: number;
    }
  | { ok: false; error: string }
> {
  const rpcClient = supabase as unknown as AtomicGrantRpcClient;
  const { data, error } = await rpcClient.rpc("ceo_grant_ai_credits", {
    p_company_id: companyId,
    p_tokens: tokensToAdd,
    p_actor_user_id: actorUserId,
    p_idempotency_key: idempotencyKey,
    p_note: note ?? null,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  const grant = data?.[0];
  if (!grant) {
    return { ok: false, error: "AI credit grant returned no audit record" };
  }

  return {
    ok: true,
    applied: grant.applied,
    transactionId: grant.transaction_id,
    creditsBefore: grant.credits_before,
    creditsAfter: grant.credits_after,
  };
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
