"use server";

import { revalidatePath } from "next/cache";
import { getCompanyContext } from "@/lib/company";

export type CreateWerkpostInput = {
  titel: string;
  beschrijving: string;
  aardVanWerk: string;
  type: "aanbod" | "vraag";
  urgentie: "normaal" | "urgent" | "zeer_urgent";
  regio: string;
  stad: string;
  postcode: string;
  adres: string;
  aantalPersonen: number;
  startdatum: string;
  einddatum: string;
  geschatteDuurDagen: number | null;
  budgetMin: number | null;
  budgetMax: number | null;
  tariefPerUur: number | null;
  tariefType: string;
  vereisteVaardigheden: string[];
};

export async function createWerkpost(input: CreateWerkpostInput) {
  const { supabase, user, companyId } = await getCompanyContext();
  if (!user || !companyId) {
    return { error: "Je account is nog niet aan een bedrijf gekoppeld." };
  }
  if (!input.titel.trim() || !input.beschrijving.trim() || !input.regio.trim()) {
    return { error: "Titel, omschrijving en regio zijn verplicht." };
  }
  if (!input.startdatum) {
    return { error: "Kies een startdatum." };
  }

  const { data: bedrijf } = await supabase
    .from("bedrijven")
    .select("naam")
    .eq("id", companyId)
    .maybeSingle();

  const { data, error } = await supabase
    .from("werkposts")
    .insert({
      titel: input.titel.trim(),
      beschrijving: input.beschrijving.trim(),
      aard_van_werk: input.aardVanWerk.trim() || input.titel.trim(),
      type: input.type,
      urgentie: input.urgentie,
      regio: input.regio.trim(),
      stad: input.stad.trim() || null,
      postcode: input.postcode.trim() || null,
      adres: input.adres.trim() || null,
      aantal_personen: input.aantalPersonen || 1,
      startdatum: input.startdatum,
      einddatum: input.einddatum || null,
      geschatte_duur_dagen: input.geschatteDuurDagen,
      budget_min: input.budgetMin,
      budget_max: input.budgetMax,
      tarief_per_uur: input.tariefPerUur,
      tarief_type: input.tariefType || null,
      vereiste_vaardigheden:
        input.vereisteVaardigheden.length > 0 ? input.vereisteVaardigheden : null,
      company_id: companyId,
      company_naam: bedrijf?.naam ?? null,
      created_by_user_id: user.id,
      status: "open",
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/bouwnetwerk");
  revalidatePath("/dashboard/werkposts");
  return { id: data.id as string };
}

export async function sluitWerkpost(werkpostId: string, reden?: string) {
  const { supabase, user, companyId } = await getCompanyContext();
  if (!user || !companyId) return { error: "Niet ingelogd." };

  const { error } = await supabase
    .from("werkposts")
    .update({
      status: "gesloten",
      gesloten_op: new Date().toISOString(),
      gesloten_reden: reden ?? null,
    })
    .eq("id", werkpostId)
    .eq("company_id", companyId);

  if (error) return { error: error.message };

  revalidatePath("/bouwnetwerk");
  revalidatePath("/dashboard/werkposts");
  return { success: true };
}

export type CreateReactieInput = {
  bericht: string;
  voorgesteldTarief: number | null;
  beschikbaarheidVanaf: string | null;
  beschikbaarheidTot: string | null;
};

export async function createReactie(
  werkpostId: string,
  input: CreateReactieInput,
) {
  const { supabase, user, companyId } = await getCompanyContext();
  if (!user || !companyId) {
    return { error: "Log in met een bedrijfsaccount om te reageren." };
  }
  if (!input.bericht.trim()) {
    return { error: "Schrijf een kort bericht bij je reactie." };
  }

  const { data: post } = await supabase
    .from("werkposts")
    .select("id, company_id, status")
    .eq("id", werkpostId)
    .maybeSingle();

  if (!post) return { error: "Deze werkpost bestaat niet (meer)." };
  if (post.company_id === companyId) {
    return { error: "Je kan niet reageren op je eigen werkpost." };
  }
  if (post.status !== "open") {
    return { error: "Deze werkpost staat niet meer open." };
  }

  const { error } = await supabase.from("werkpost_reacties").insert({
    werkpost_id: werkpostId,
    company_id: companyId,
    user_id: user.id,
    bericht: input.bericht.trim(),
    voorgesteld_tarief: input.voorgesteldTarief,
    beschikbaarheid_vanaf: input.beschikbaarheidVanaf,
    beschikbaarheid_tot: input.beschikbaarheidTot,
    status: "in_afwachting",
  });

  if (error) return { error: error.message };

  await supabase
    .from("werkposts")
    .update({ aantal_reacties: (await countReacties(werkpostId, supabase)) })
    .eq("id", werkpostId);

  revalidatePath("/bouwnetwerk");
  revalidatePath(`/dashboard/werkposts/${werkpostId}`);
  return { success: true };
}

async function countReacties(
  werkpostId: string,
  supabase: Awaited<ReturnType<typeof getCompanyContext>>["supabase"],
) {
  const { count } = await supabase
    .from("werkpost_reacties")
    .select("id", { count: "exact", head: true })
    .eq("werkpost_id", werkpostId);
  return count ?? 0;
}

export async function rejectReactie(reactieId: string) {
  const { supabase, user, companyId } = await getCompanyContext();
  if (!user || !companyId) return { error: "Niet ingelogd." };

  const { data: reactie } = await supabase
    .from("werkpost_reacties")
    .select("id, werkpost_id, werkposts:werkpost_id(company_id)")
    .eq("id", reactieId)
    .maybeSingle();

  const ownerCompanyId = (
    reactie?.werkposts as unknown as { company_id: number } | null
  )?.company_id;
  if (!reactie || ownerCompanyId !== companyId) {
    return { error: "Je mag deze reactie niet beheren." };
  }

  const { error } = await supabase
    .from("werkpost_reacties")
    .update({ status: "afgewezen" })
    .eq("id", reactieId);

  if (error) return { error: error.message };

  revalidatePath(`/dashboard/werkposts/${reactie.werkpost_id}`);
  return { success: true };
}

/**
 * Accepteer een reactie: zet de status om, en maak (of hergebruik) een
 * bouwnetwerk-chatkanaal aan tussen de twee bedrijven zodat ze verder kunnen
 * praten in Comms.
 *
 * Vereist de migratie in supabase/migrations/20260707_bouwnetwerk_channel_link.sql
 * (kolommen werkpost_id / werkpost_reactie_id op bouwnetwerk_channels).
 */
export async function acceptReactie(reactieId: string) {
  const { supabase, user, companyId } = await getCompanyContext();
  if (!user || !companyId) return { error: "Niet ingelogd." };

  const { data: reactie } = await supabase
    .from("werkpost_reacties")
    .select(
      "id, werkpost_id, company_id, werkposts:werkpost_id(id, company_id, titel)",
    )
    .eq("id", reactieId)
    .maybeSingle();

  const post = reactie?.werkposts as unknown as {
    id: string;
    company_id: number;
    titel: string;
  } | null;

  if (!reactie || !post || post.company_id !== companyId) {
    return { error: "Je mag deze reactie niet beheren." };
  }

  const { error: updateError } = await supabase
    .from("werkpost_reacties")
    .update({ status: "geaccepteerd" })
    .eq("id", reactieId);
  if (updateError) return { error: updateError.message };

  await supabase
    .from("werkposts")
    .update({ status: "in_behandeling" })
    .eq("id", post.id);

  // Bestaat er al een kanaal voor deze reactie? (bv. dubbele klik)
  const { data: bestaand } = await supabase
    .from("bouwnetwerk_channels")
    .select("id")
    .eq("werkpost_reactie_id", reactieId)
    .maybeSingle();

  let channelId = bestaand?.id as string | undefined;

  if (!channelId) {
    const { data: channel, error: channelError } = await supabase
      .from("bouwnetwerk_channels")
      .insert({
        type: "direct",
        name: `Bouwnetwerk — ${post.titel}`.slice(0, 120),
        created_by_company_id: companyId,
        created_by_user_id: user.id,
        werkpost_id: post.id,
        werkpost_reactie_id: reactieId,
      })
      .select("id")
      .single();

    if (channelError) {
      return {
        error:
          `Reactie geaccepteerd, maar het chatkanaal kon niet worden aangemaakt (${channelError.message}). ` +
          "Draai de migratie 20260707_bouwnetwerk_channel_link.sql en controleer de RLS-policies.",
      };
    }
    channelId = channel.id as string;

    const { error: membersError } = await supabase
      .from("bouwnetwerk_channel_members")
      .insert([
        { channel_id: channelId, company_id: companyId, role: "eigenaar" },
        { channel_id: channelId, company_id: reactie.company_id, role: "onderaannemer" },
      ]);
    if (membersError) {
      return {
        error: `Reactie geaccepteerd, maar leden konden niet worden toegevoegd (${membersError.message}).`,
      };
    }
  }

  revalidatePath(`/dashboard/werkposts/${post.id}`);
  revalidatePath("/dashboard/comms");
  return { success: true, channelId };
}
