import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

type ServiceSupabase = SupabaseClient<Database>;

export type AiLogPeriod = "24h" | "7d" | "30d" | "all";
export type AiLogStatus = "all" | "success" | "error";

export type AiLogFilters = {
  companyId: number | null;
  agent: string | null;
  status: AiLogStatus;
  period: AiLogPeriod;
};

export type AiLogEntry = {
  id: number;
  companyId: number;
  companyName: string;
  agentName: string;
  actionType: string;
  message: string;
  errorMessage: string | null;
  createdAt: string;
};

export type AiLogOverview = {
  entries: AiLogEntry[];
  totalCount: number;
  companies: Array<{ id: number; name: string }>;
  agents: string[];
};

type SearchParams = Record<string, string | string[] | undefined>;

const LOG_LIMIT = 200;
const PERIODS = new Set<AiLogPeriod>(["24h", "7d", "30d", "all"]);
const STATUSES = new Set<AiLogStatus>(["all", "success", "error"]);

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function parseAiLogFilters(params: SearchParams): AiLogFilters {
  const rawCompanyId = firstValue(params.company)?.trim();
  const parsedCompanyId = rawCompanyId ? Number(rawCompanyId) : Number.NaN;
  const rawAgent = firstValue(params.agent)?.trim().slice(0, 80) || null;
  const rawStatus = firstValue(params.status);
  const rawPeriod = firstValue(params.period);

  return {
    companyId:
      Number.isSafeInteger(parsedCompanyId) && parsedCompanyId > 0
        ? parsedCompanyId
        : null,
    agent: rawAgent,
    status: STATUSES.has(rawStatus as AiLogStatus)
      ? (rawStatus as AiLogStatus)
      : "all",
    period: PERIODS.has(rawPeriod as AiLogPeriod)
      ? (rawPeriod as AiLogPeriod)
      : "7d",
  };
}

export function redactLogText(value: string | null): string | null {
  if (!value) return null;

  const sanitized = value
    .replace(/\bBearer\s+[A-Za-z0-9._~+/=-]+/gi, "Bearer [verborgen]")
    .replace(/\bsk-[A-Za-z0-9_-]{12,}\b/g, "[verborgen]")
    .replace(
      /(api[_-]?key\s*[=:]\s*["']?)[^\s,"']+/gi,
      "$1[verborgen]",
    )
    .replace(/\s+/g, " ")
    .trim();

  if (sanitized.length <= 320) return sanitized;
  return `${sanitized.slice(0, 317)}…`;
}

function periodStart(period: AiLogPeriod, now: Date): string | null {
  const hours = period === "24h" ? 24 : period === "7d" ? 24 * 7 : 24 * 30;
  return period === "all"
    ? null
    : new Date(now.getTime() - hours * 60 * 60 * 1000).toISOString();
}

export async function fetchAiLogOverview(
  supabase: ServiceSupabase,
  filters: AiLogFilters,
  now = new Date(),
): Promise<AiLogOverview> {
  let logsQuery = supabase
    .from("agent_activity_logs")
    .select(
      "id, company_id, agent_name, action_type, message, error_message, created_at",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .limit(LOG_LIMIT);

  if (filters.companyId) {
    logsQuery = logsQuery.eq("company_id", filters.companyId);
  }
  if (filters.agent) {
    logsQuery = logsQuery.eq("agent_name", filters.agent);
  }
  if (filters.status === "error") {
    logsQuery = logsQuery.not("error_message", "is", null);
  } else if (filters.status === "success") {
    logsQuery = logsQuery.is("error_message", null);
  }

  const start = periodStart(filters.period, now);
  if (start) {
    logsQuery = logsQuery.gte("created_at", start);
  }

  const [logsResult, companiesResult, agentsResult] = await Promise.all([
    logsQuery,
    supabase.from("bedrijven").select("id, naam").order("naam"),
    supabase
      .from("agent_activity_logs")
      .select("agent_name")
      .order("created_at", { ascending: false })
      .limit(1000),
  ]);

  if (logsResult.error || companiesResult.error || agentsResult.error) {
    console.error("fetchAiLogOverview:", {
      logs: logsResult.error?.message,
      companies: companiesResult.error?.message,
      agents: agentsResult.error?.message,
    });
    throw new Error("AI-logs konden niet veilig worden geladen.");
  }

  const companies = (companiesResult.data ?? []).map((company) => ({
    id: company.id,
    name: company.naam,
  }));
  const companyNames = new Map(
    companies.map((company) => [company.id, company.name]),
  );
  const agents = Array.from(
    new Set(
      (agentsResult.data ?? [])
        .map((row) => row.agent_name.trim())
        .filter(Boolean),
    ),
  ).sort((left, right) => left.localeCompare(right, "nl-BE"));

  return {
    entries: (logsResult.data ?? []).map((row) => ({
      id: row.id,
      companyId: row.company_id,
      companyName: companyNames.get(row.company_id) ?? `Bedrijf #${row.company_id}`,
      agentName: row.agent_name,
      actionType: row.action_type,
      message: redactLogText(row.message) ?? "Geen beschrijving",
      errorMessage: redactLogText(row.error_message),
      createdAt: row.created_at,
    })),
    totalCount: logsResult.count ?? 0,
    companies,
    agents,
  };
}
