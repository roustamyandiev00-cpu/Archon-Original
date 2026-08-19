import type { SupabaseClient } from "@supabase/supabase-js";
import { findStaleBouwmateriaalPrijzen } from "@/lib/bouwmaterialen/prijzen";
import { writeAuditEntry } from "@/lib/agents/audit";

/**
 * Automatische prijs-hercheck: telt verouderde prijzen en logt een audit-signaal.
 * Geen auto-update van prijzen (mens/agent moet hercontroleren).
 */
export async function schedulePrijsHerchecks(
  supabase: SupabaseClient,
  tenantId: number,
): Promise<{ emitted: number; errors: string[]; staleCount: number }> {
  try {
    const staleCount = await findStaleBouwmateriaalPrijzen(supabase, 14);
    if (staleCount > 0) {
      await writeAuditEntry(supabase, {
        tenantId,
        correlationId: `prijs-hercheck-${new Date().toISOString().slice(0, 10)}`,
        actorType: "system",
        action: "materiaal.prijs_stale",
        entityType: "bouwmateriaal_prijzen",
        entityId: 0,
        metadata: { staleCount, olderThanDays: 14 },
      });
    }
    return { emitted: staleCount > 0 ? 1 : 0, errors: [], staleCount };
  } catch (e) {
    return {
      emitted: 0,
      errors: [e instanceof Error ? e.message : "prijs-hercheck mislukt"],
      staleCount: 0,
    };
  }
}
