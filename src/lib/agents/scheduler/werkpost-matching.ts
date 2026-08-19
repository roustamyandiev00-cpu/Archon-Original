import type { SupabaseClient } from "@supabase/supabase-js";
import { evaluatePolicy } from "@/lib/agents/policy";
import { proposeAgentAction } from "@/lib/agents/propose";
import { untyped } from "@/lib/integraties";

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function overlaps(a: string[], b: string) {
  const hay = normalize(b);
  return a.some((x) => {
    const n = normalize(x);
    return n && (hay.includes(n) || n.includes(hay));
  });
}

/**
 * Fase 2 matching: voorstellen (pending agent_actions), geen auto-send.
 */
export async function scheduleWerkpostMatches(
  supabase: SupabaseClient,
  companyId: number,
): Promise<{ emitted: number; errors: string[] }> {
  const errors: string[] = [];
  let emitted = 0;

  const { data: settings } = await untyped(supabase)
    .from("onderaannemer_agent_settings")
    .select("*")
    .eq("company_id", companyId)
    .eq("enabled", true)
    .eq("beschikbaar", true)
    .maybeSingle();

  if (!settings) return { emitted: 0, errors };

  const policy = evaluatePolicy({
    agentId: "Nova",
    actionType: "propose_werkpost_match",
    tenantId: companyId,
    isExternal: false,
  });
  if (!policy.allowed) {
    return { emitted: 0, errors: [policy.reason ?? "policy denied"] };
  }

  const { data: posts } = await supabase
    .from("werkposts")
    .select(
      "id, titel, regio, aard_van_werk, type, status, company_id, tarief_per_uur, pipeline_status",
    )
    .eq("status", "open")
    .eq("zichtbaarheid", "publiek")
    .neq("company_id", companyId)
    .order("created_at", { ascending: false })
    .limit(40);

  const regioFilter = (settings.regio as string[]) ?? [];
  const typeFilter = (settings.type_werk as string[]) ?? [];
  const minTarief = settings.minimum_uurtarief
    ? Number(settings.minimum_uurtarief)
    : null;

  const { data: pendingMatches } = await supabase
    .from("agent_actions")
    .select("id, payload_json, title")
    .eq("company_id", companyId)
    .eq("action_type", "propose_werkpost_match")
    .in("status", ["pending", "approved"])
    .limit(100);

  const already = new Set<string>();
  for (const row of pendingMatches ?? []) {
    const pj = row.payload_json as { werkpostId?: string } | null;
    if (pj?.werkpostId) already.add(pj.werkpostId);
    const m = String(row.title ?? "").match(/\(([a-f0-9]{8})\)/i);
    if (m) already.add(m[1]);
  }

  for (const post of posts ?? []) {
    if (regioFilter.length > 0 && !overlaps(regioFilter, post.regio ?? "")) {
      continue;
    }
    if (
      typeFilter.length > 0 &&
      !overlaps(typeFilter, post.aard_van_werk ?? "")
    ) {
      continue;
    }
    if (
      minTarief != null &&
      post.tarief_per_uur != null &&
      Number(post.tarief_per_uur) < minTarief
    ) {
      continue;
    }

    if (already.has(post.id) || already.has(post.id.slice(0, 8))) continue;

    const draftMessage =
      `Hallo, wij zagen jullie opdracht «${post.titel}» in ${post.regio}. ` +
      `Wij hebben ervaring met ${post.aard_van_werk} en zijn beschikbaar. ` +
      `Kunnen we kort afstemmen?`;

    const proposed = await proposeAgentAction({
      supabase,
      companyId,
      agentName: "Nova",
      actionType: "propose_werkpost_match",
      title: `Match: ${post.titel} (${post.id.slice(0, 8)})`,
      reason: `Regio ${post.regio} · ${post.aard_van_werk}`,
      payload: {
        companyId,
        werkpostId: post.id,
        werkpostTitel: post.titel,
        regio: post.regio,
        aardVanWerk: post.aard_van_werk,
        draftMessage,
      },
      targetEntityType: "werkpost",
      targetRoute: `/bouwnetwerk`,
      requiresApproval: true,
      confidence: 0.7,
    });

    if ("error" in proposed && proposed.error) {
      errors.push(proposed.error);
      continue;
    }

    if (!post.pipeline_status) {
      await supabase
        .from("werkposts")
        .update({ pipeline_status: "gevonden" })
        .eq("id", post.id)
        .is("pipeline_status", null);
    }

    emitted += 1;
    if (emitted >= (settings.max_berichten_per_dag ?? 5)) break;
  }

  return { emitted, errors };
}

export async function scheduleWerkpostMatchesForAllTenants(
  supabase: SupabaseClient,
): Promise<{ emitted: number; errors: string[] }> {
  const { data: settingsRows } = await untyped(supabase)
    .from("onderaannemer_agent_settings")
    .select("company_id")
    .eq("enabled", true);

  let emitted = 0;
  const errors: string[] = [];
  for (const row of settingsRows ?? []) {
    const result = await scheduleWerkpostMatches(supabase, row.company_id);
    emitted += result.emitted;
    errors.push(...result.errors);
  }
  return { emitted, errors };
}
