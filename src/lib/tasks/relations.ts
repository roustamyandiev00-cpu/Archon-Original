import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database.types";
import type { ParsedTaskInput } from "@/lib/tasks/validation";

type Client = SupabaseClient<Database>;

/** Valideert relationele FK's tegen dezelfde company_id. Deny cross-tenant links. */
export async function assertTaskRelations(
  supabase: Client,
  companyId: number,
  input: Partial<
    Pick<
      ParsedTaskInput,
      | "contactId"
      | "dealId"
      | "offerteId"
      | "factuurId"
      | "projectId"
      | "afspraakId"
      | "parentTaskId"
    >
  >,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (input.contactId) {
    const { data } = await supabase
      .from("customers")
      .select("id")
      .eq("id", input.contactId)
      .eq("company_id", companyId)
      .maybeSingle();
    if (!data) return { ok: false, error: "Contact behoort niet tot dit bedrijf." };
  }

  if (input.dealId) {
    const { data } = await supabase
      .from("deals")
      .select("id")
      .eq("id", input.dealId)
      .eq("bedrijf_id", companyId)
      .maybeSingle();
    if (!data) return { ok: false, error: "Deal behoort niet tot dit bedrijf." };
  }

  if (input.offerteId) {
    const { data } = await supabase
      .from("offertes")
      .select("id")
      .eq("id", input.offerteId)
      .eq("bedrijf_id", companyId)
      .maybeSingle();
    if (!data) return { ok: false, error: "Offerte behoort niet tot dit bedrijf." };
  }

  if (input.factuurId) {
    const { data } = await supabase
      .from("facturen")
      .select("id")
      .eq("id", input.factuurId)
      .eq("bedrijf_id", companyId)
      .maybeSingle();
    if (!data) return { ok: false, error: "Factuur behoort niet tot dit bedrijf." };
  }

  if (input.projectId) {
    const { data } = await supabase
      .from("projecten")
      .select("id, bedrijf_id")
      .eq("id", String(input.projectId))
      .maybeSingle();
    if (!data || data.bedrijf_id !== companyId) {
      return { ok: false, error: "Project behoort niet tot dit bedrijf." };
    }
  }

  if (input.afspraakId) {
    const { data } = await supabase
      .from("afspraken")
      .select("id")
      .eq("id", input.afspraakId)
      .eq("bedrijf_id", companyId)
      .maybeSingle();
    if (!data) return { ok: false, error: "Afspraak behoort niet tot dit bedrijf." };
  }

  if (input.parentTaskId) {
    const { data } = await supabase
      .from("tasks")
      .select("id")
      .eq("id", input.parentTaskId)
      .eq("company_id", companyId)
      .is("deleted_at", null)
      .maybeSingle();
    if (!data) return { ok: false, error: "Bovenliggende taak niet gevonden." };
  }

  return { ok: true };
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type AssigneeMembershipResult =
  | { ok: true; userId: string | null }
  | { ok: false; error: string };

/**
 * Valideert dat een toe te wijzen gebruiker een actief lid is van exact
 * `companyId`. Cross-tenant-, inactive- en niet-bestaande memberships worden
 * geweigerd. Een lege userId (unassign) is toegestaan.
 */
export async function assertAssigneeMembership(
  supabase: Client,
  companyId: number,
  userId: string | null,
): Promise<AssigneeMembershipResult> {
  if (!userId) return { ok: true, userId: null };

  const target = userId.trim();
  if (!UUID_RE.test(target)) {
    return { ok: false, error: "Ongeldige gebruiker." };
  }

  const { data: members, error } = await supabase.rpc("team_list_members", {
    p_company_id: companyId,
  });
  if (error) return { ok: false, error: error.message };

  const member = (members ?? []).find(
    (m) => m.user_id.toLowerCase() === target.toLowerCase(),
  );
  if (!member || member.is_active !== true) {
    return { ok: false, error: "Gebruiker is geen actief lid van dit bedrijf." };
  }

  return { ok: true, userId: member.user_id };
}

export async function writeTaskActivity(
  supabase: Client,
  input: {
    companyId: number;
    taskId: number;
    actorId?: string | null;
    eventType: string;
    metadata?: Record<string, unknown>;
  },
): Promise<void> {
  await supabase.from("task_activity_logs").insert({
    company_id: input.companyId,
    task_id: input.taskId,
    actor_id: input.actorId ?? null,
    event_type: input.eventType,
    metadata: (input.metadata ?? {}) as Json,
  });
}
