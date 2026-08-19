import type { SupabaseClient } from "@supabase/supabase-js";
import {
  scheduleQuoteFollowupEvents,
  scheduleQuoteFollowupForAllTenants,
} from "@/lib/agents/scheduler/quote-followup";
import {
  scheduleInvoiceOverdueEvents,
  scheduleInvoiceOverdueForAllTenants,
} from "@/lib/agents/scheduler/invoice-overdue";
import {
  scheduleWerkpostMatches,
  scheduleWerkpostMatchesForAllTenants,
} from "@/lib/agents/scheduler/werkpost-matching";
import { schedulePrijsHerchecks } from "@/lib/agents/scheduler/prijs-hercheck";

export type AgentSchedulerResult = {
  quoteFollowup: Awaited<ReturnType<typeof scheduleQuoteFollowupEvents>>;
  invoiceOverdue: Awaited<ReturnType<typeof scheduleInvoiceOverdueEvents>>;
  werkpostMatches: Awaited<ReturnType<typeof scheduleWerkpostMatches>>;
  prijsHercheck: Awaited<ReturnType<typeof schedulePrijsHerchecks>>;
};

export async function runAllSchedulersForTenant(
  supabase: SupabaseClient,
  tenantId: number,
  opts?: { autoExecuteUserId?: string | null },
): Promise<AgentSchedulerResult> {
  const [quoteFollowup, invoiceOverdue, werkpostMatches, prijsHercheck] =
    await Promise.all([
      scheduleQuoteFollowupEvents(supabase, tenantId),
      scheduleInvoiceOverdueEvents(supabase, tenantId, opts),
      scheduleWerkpostMatches(supabase, tenantId),
      schedulePrijsHerchecks(supabase, tenantId),
    ]);

  return { quoteFollowup, invoiceOverdue, werkpostMatches, prijsHercheck };
}

export async function runAllSchedulersForAllTenants(
  supabase: SupabaseClient,
): Promise<{
  tenants: number;
  quoteFollowupEmitted: number;
  invoiceOverdueEmitted: number;
  werkpostMatchesEmitted: number;
  prijsHercheckEmitted: number;
  errors: string[];
}> {
  const { data: companies } = await supabase
    .from("bedrijven")
    .select("id")
    .limit(500);

  let quoteFollowupEmitted = 0;
  let invoiceOverdueEmitted = 0;
  let werkpostMatchesEmitted = 0;
  let prijsHercheckEmitted = 0;
  const errors: string[] = [];

  for (const company of companies ?? []) {
    const result = await runAllSchedulersForTenant(supabase, company.id);
    quoteFollowupEmitted += result.quoteFollowup.emitted;
    invoiceOverdueEmitted += result.invoiceOverdue.emitted;
    werkpostMatchesEmitted += result.werkpostMatches.emitted;
    prijsHercheckEmitted += result.prijsHercheck.emitted;
    errors.push(
      ...result.quoteFollowup.errors,
      ...result.invoiceOverdue.errors,
      ...result.werkpostMatches.errors,
      ...result.prijsHercheck.errors,
    );
  }

  return {
    tenants: companies?.length ?? 0,
    quoteFollowupEmitted,
    invoiceOverdueEmitted,
    werkpostMatchesEmitted,
    prijsHercheckEmitted,
    errors,
  };
}

export {
  scheduleQuoteFollowupForAllTenants,
  scheduleInvoiceOverdueForAllTenants,
  scheduleWerkpostMatchesForAllTenants,
};
