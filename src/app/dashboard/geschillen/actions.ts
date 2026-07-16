"use server";

import { revalidatePath } from "next/cache";
import { requireWriteAccess } from "@/components/dashboard/context";
import { requirePlatformAdmin } from "@/lib/platform-admin";
import { untyped } from "@/lib/integraties";
import { proposeAgentAction } from "@/lib/agents/propose";
import { evaluatePolicy } from "@/lib/agents/policy";

export async function createGeschil(input: {
  titel: string;
  beschrijving: string;
  tegenpartijCompanyId?: number | null;
  werkpostId?: string | null;
  channelId?: string | null;
  samenwerkingContractId?: string | null;
}) {
  const access = await requireWriteAccess();
  if ("error" in access) return { error: access.error };
  const { supabase, companyId } = access;

  const titel = input.titel.trim();
  const beschrijving = input.beschrijving.trim();
  if (titel.length < 3) return { error: "Geef een duidelijke titel." };
  if (beschrijving.length < 20) {
    return { error: "Beschrijf het probleem (min. 20 tekens)." };
  }

  const { data, error } = await untyped(supabase)
    .from("geschillen")
    .insert({
      melder_company_id: companyId,
      tegenpartij_company_id: input.tegenpartijCompanyId ?? null,
      werkpost_id: input.werkpostId ?? null,
      channel_id: input.channelId ?? null,
      samenwerking_contract_id: input.samenwerkingContractId ?? null,
      titel,
      beschrijving,
      status: "ingediend",
    })
    .select("id")
    .maybeSingle();

  if (error) return { error: error.message };

  // Neutrale AI-samenvatting als voorstel (geen oordeel)
  const samenvatting =
    `Samenvatting (concept, geen oordeel):\n` +
    `Melder (bedrijf ${companyId}) meldt: «${titel}».\n` +
    `${beschrijving.slice(0, 600)}` +
    (input.tegenpartijCompanyId
      ? `\nTegenpartij: bedrijf ${input.tegenpartijCompanyId}.`
      : "");

  const policy = evaluatePolicy({
    agentId: "Nova",
    actionType: "propose_geschil_samenvatting",
    tenantId: companyId,
    isExternal: false,
  });

  if (policy.allowed && data?.id) {
    const proposed = await proposeAgentAction({
      supabase,
      companyId,
      agentName: "Nova",
      actionType: "propose_geschil_samenvatting",
      title: `Geschil-samenvatting: ${titel.slice(0, 50)}`,
      reason: "Neutrale samenvatting ter review door beheerder",
      payload: {
        geschilId: data.id,
        samenvatting,
      },
      targetRoute: `/dashboard/admin/geschillen`,
      requiresApproval: true,
    });

    if (!("error" in proposed) && proposed.id) {
      await untyped(supabase)
        .from("geschillen")
        .update({
          ai_samenvatting: samenvatting,
          agent_action_id: proposed.id,
          status: "samenvatting_klaar",
          updated_at: new Date().toISOString(),
        })
        .eq("id", data.id);
    }
  }

  revalidatePath("/dashboard/geschillen");
  revalidatePath("/dashboard/admin/geschillen");
  return { ok: true as const, id: data?.id as string };
}

export async function submitGeschilVerklaring(input: {
  geschilId: string;
  verklaring: string;
  asMelder: boolean;
}) {
  const access = await requireWriteAccess();
  if ("error" in access) return { error: access.error };
  const { supabase, companyId } = access;

  const text = input.verklaring.trim();
  if (text.length < 10) return { error: "Schrijf een korte verklaring." };

  const { data: g } = await untyped(supabase)
    .from("geschillen")
    .select("*")
    .eq("id", input.geschilId)
    .maybeSingle();

  if (!g) return { error: "Geschil niet gevonden." };

  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
    status: "verklaringen",
  };

  if (input.asMelder) {
    if (g.melder_company_id !== companyId) {
      return { error: "Alleen de melder mag deze verklaring indienen." };
    }
    patch.melder_verklaring = text;
  } else {
    if (g.tegenpartij_company_id !== companyId) {
      return { error: "Alleen de tegenpartij mag deze verklaring indienen." };
    }
    patch.tegenpartij_verklaring = text;
  }

  const { error } = await untyped(supabase)
    .from("geschillen")
    .update(patch)
    .eq("id", input.geschilId);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/geschillen");
  revalidatePath("/dashboard/admin/geschillen");
  return { ok: true as const };
}

export async function fileGeschilBezwaar(input: {
  geschilId: string;
  reden: string;
}) {
  const access = await requireWriteAccess();
  if ("error" in access) return { error: access.error };
  const { supabase, companyId } = access;

  const { data: g } = await untyped(supabase)
    .from("geschillen")
    .select("melder_company_id, tegenpartij_company_id, status")
    .eq("id", input.geschilId)
    .maybeSingle();

  if (!g || g.status !== "beslist") {
    return { error: "Bezwaar kan alleen na een beslissing." };
  }
  if (
    g.melder_company_id !== companyId &&
    g.tegenpartij_company_id !== companyId
  ) {
    return { error: "Geen partij bij dit geschil." };
  }

  const { error } = await untyped(supabase)
    .from("geschillen")
    .update({
      status: "in_bezwaar",
      bezwaar_reden: input.reden.trim(),
      bezwaar_op: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.geschilId);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/geschillen");
  revalidatePath("/dashboard/admin/geschillen");
  return { ok: true as const };
}

export async function decideGeschil(input: {
  geschilId: string;
  motivatie: string;
  afsluiten?: boolean;
}) {
  const { serviceSupabase, user } = await requirePlatformAdmin();
  const motivatie = input.motivatie.trim();
  if (motivatie.length < 10) {
    return { ok: false as const, error: "Motivatie is verplicht." };
  }

  const { error } = await untyped(serviceSupabase)
    .from("geschillen")
    .update({
      status: input.afsluiten ? "afgesloten" : "beslist",
      motivatie,
      beheerder_id: user.id,
      beslist_op: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.geschilId);

  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/dashboard/admin/geschillen");
  revalidatePath("/dashboard/geschillen");
  return { ok: true as const };
}
