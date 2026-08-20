"use server";

import { revalidatePath } from "next/cache";
import { requireWriteAccess } from "@/components/dashboard/context";
import { untyped } from "@/lib/integraties";
import { refreshBetrouwbaarheidsscore } from "@/lib/bouwnetwerk/betrouwbaarheid";

export type ConnectieStatus =
  | "favoriet"
  | "eerder_samengewerkt"
  | "vaste_partner";

export async function upsertBedrijfConnectie(input: {
  connectieBedrijfId: number;
  status: ConnectieStatus;
  notities?: string | null;
}) {
  const access = await requireWriteAccess();
  if ("error" in access) return { error: access.error };
  const { supabase, companyId } = access;

  if (input.connectieBedrijfId === companyId) {
    return { error: "Je kunt je eigen bedrijf niet als partner toevoegen." };
  }

  const { error } = await untyped(supabase).from("bedrijf_connecties").upsert(
    {
      bedrijf_id: companyId,
      connectie_bedrijf_id: input.connectieBedrijfId,
      status: input.status,
      notities: input.notities?.trim() || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "bedrijf_id,connectie_bedrijf_id" },
  );

  if (error) return { error: error.message };

  revalidatePath("/dashboard/werkposts/samenwerkingen");
  revalidatePath("/dashboard/bouwnetwerk/partners");
  return { ok: true as const };
}

export async function deleteBedrijfConnectie(connectieId: string) {
  const access = await requireWriteAccess();
  if ("error" in access) return { error: access.error };
  const { supabase, companyId } = access;

  const { error } = await untyped(supabase)
    .from("bedrijf_connecties")
    .delete()
    .eq("id", connectieId)
    .eq("bedrijf_id", companyId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/werkposts/samenwerkingen");
  revalidatePath("/dashboard/bouwnetwerk/partners");
  return { ok: true as const };
}

export async function saveOnderaannemerAgentSettings(input: {
  enabled: boolean;
  regio: string[];
  typeWerk: string[];
  beschikbaar?: boolean;
  minimumUurtarief?: number | null;
  maxBerichtenPerDag?: number;
}) {
  const access = await requireWriteAccess();
  if ("error" in access) return { error: access.error };
  const { supabase, companyId } = access;

  const { error } = await untyped(supabase)
    .from("onderaannemer_agent_settings")
    .upsert(
      {
        company_id: companyId,
        enabled: input.enabled,
        regio: input.regio,
        type_werk: input.typeWerk,
        beschikbaar: input.beschikbaar ?? true,
        minimum_uurtarief: input.minimumUurtarief ?? null,
        max_berichten_per_dag: input.maxBerichtenPerDag ?? 5,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "company_id" },
    );

  if (error) return { error: error.message };

  revalidatePath("/dashboard/bouwnetwerk/partners");
  return { ok: true as const };
}

export async function refreshOwnBetrouwbaarheidsscore() {
  const access = await requireWriteAccess();
  if ("error" in access) return { error: access.error };
  const { supabase, companyId } = access;
  const score = await refreshBetrouwbaarheidsscore(supabase, companyId);
  revalidatePath("/dashboard/instellingen");
  return { ok: true as const, score };
}
