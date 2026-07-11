import type { SupabaseClient } from "@supabase/supabase-js";
import {
  scheduleQuoteFollowupEvents,
  scheduleQuoteFollowupForAllTenants,
} from "@/lib/agents/scheduler/quote-followup";
import {
  scheduleInvoiceOverdueEvents,
  scheduleInvoiceOverdueForAllTenants,
} from "@/lib/agents/scheduler/invoice-overdue";

export type AgentSchedulerResult = {
  quoteFollowup: Awaited<ReturnType<typeof scheduleQuoteFollowupEvents>>;
  invoiceOverdue: Awaited<ReturnType<typeof scheduleInvoiceOverdueEvents>>;
};

export async function runAllSchedulersForTenant(
  supabase: SupabaseClient,
  tenantId: number,
  opts?: { autoExecuteUserId?: string | null },
): Promise<AgentSchedulerResult> {
  const [quoteFollowup, invoiceOverdue] = await Promise.all([
    scheduleQuoteFollowupEvents(supabase, tenantId),
    scheduleInvoiceOverdueEvents(supabase, tenantId, opts),
  ]);

  return { quoteFollowup, invoiceOverdue };
}

export async function runAllSchedulersForAllTenants(
  supabase: SupabaseClient,
): Promise<{
  tenants: number;
  quoteFollowupEmitted: number;
  invoiceOverdueEmitted: number;
  errors: string[];
}> {
  const { data: companies } = await supabase
    .from("bedrijven")
    .select("id")
    .limit(500);

  let quoteFollowupEmitted = 0;
  let invoiceOverdueEmitted = 0;
  const errors: string[] = [];

  for (const company of companies ?? []) {
    const result = await runAllSchedulersForTenant(supabase, company.id);
    quoteFollowupEmitted += result.quoteFollowup.emitted;
    invoiceOverdueEmitted += result.invoiceOverdue.emitted;
    errors.push(
      ...result.quoteFollowup.errors,
      ...result.invoiceOverdue.errors,
    );
  }

  return {
    tenants: companies?.length ?? 0,
    quoteFollowupEmitted,
    invoiceOverdueEmitted,
    errors,
  };
}

export {
  scheduleQuoteFollowupForAllTenants,
  scheduleInvoiceOverdueForAllTenants,
};
