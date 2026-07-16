"use server";

import { revalidatePath } from "next/cache";
import { requireWriteAccess } from "@/components/dashboard/context";

export type AfspraakInput = {
  channelId: string;
  counterpartId: number | null;
  counterpartNaam: string;
  titel: string;
  datum: string; // yyyy-mm-dd
  startTijd: string; // HH:mm
  eindTijd?: string; // HH:mm (optioneel)
  locatie?: string;
  beschrijving?: string;
};

function toIso(datum: string, tijd: string): string | null {
  if (!datum || !tijd) return null;
  const d = new Date(`${datum}T${tijd}`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

/**
 * Legt een afspraak vast voor een samenwerking en plaatst die meteen in de
 * agenda (tabel `afspraken`, gekoppeld aan het bedrijf). De samenwerking wordt
 * vastgelegd in `deelnemers` zodat we de afspraak per gesprek kunnen tonen.
 * Ook wordt er een chatbericht in het kanaal geplaatst zodat de tegenpartij de
 * geplande afspraak ziet.
 */
export async function createAfspraak(input: AfspraakInput) {
  const access = await requireWriteAccess();
  if ("error" in access) return { error: access.error };
  const { supabase, user, companyId } = access;
  const titel = input.titel.trim();
  if (!titel) return { error: "Geef de afspraak een titel." };

  const startIso = toIso(input.datum, input.startTijd);
  if (!startIso) return { error: "Kies een geldige datum en starttijd." };

  const eindIso = input.eindTijd ? toIso(input.datum, input.eindTijd) : null;
  if (eindIso && eindIso <= startIso) {
    return { error: "De eindtijd moet na de starttijd liggen." };
  }

  const { data: membership } = await supabase
    .from("bouwnetwerk_channel_members")
    .select("id")
    .eq("channel_id", input.channelId)
    .eq("company_id", companyId)
    .eq("is_active", true)
    .maybeSingle();

  if (!membership) return { error: "Je bent geen lid van dit gesprek." };

  const { data: afspraak, error } = await supabase
    .from("afspraken")
    .insert({
      titel,
      beschrijving: input.beschrijving?.trim() || null,
      locatie: input.locatie?.trim() || null,
      start_tijd: startIso,
      eind_tijd: eindIso,
      type: "bouwnetwerk",
      status: "gepland",
      bedrijf_id: companyId,
      user_id: user.id,
      deelnemers: {
        bron: "bouwnetwerk",
        channel_id: input.channelId,
        counterpart_id: input.counterpartId,
        counterpart_naam: input.counterpartNaam,
      },
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  const dt = new Date(startIso);
  const wanneer = dt.toLocaleString("nl-NL", {
    dateStyle: "full",
    timeStyle: "short",
  });

  await supabase.from("bouwnetwerk_messages").insert({
    channel_id: input.channelId,
    sender_company_id: companyId,
    sender_user_id: user.id,
    content: `📅 Afspraak voorgesteld: ${titel} — ${wanneer}${
      input.locatie?.trim() ? ` (${input.locatie.trim()})` : ""
    }`,
    type: "text",
  });

  await supabase
    .from("bouwnetwerk_channels")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", input.channelId);

  revalidatePath("/dashboard/werkposts/samenwerkingen");
  return { success: true, id: afspraak.id as number };
}

export async function updateAfspraakStatus(
  afspraakId: number,
  status: "gepland" | "bevestigd" | "geannuleerd" | "afgerond",
) {
  const access = await requireWriteAccess();
  if ("error" in access) return { error: access.error };
  const { supabase, companyId } = access;
  const { error } = await supabase
    .from("afspraken")
    .update({ status })
    .eq("id", afspraakId)
    .eq("bedrijf_id", companyId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/werkposts/samenwerkingen");
  return { success: true };
}

export async function submitCompanyReview(
  targetCompanyId: number,
  rating: number,
  commentaar: string,
  samenwerkingContractId: string,
) {
  const access = await requireWriteAccess();
  if ("error" in access) return { error: access.error };
  const { supabase, companyId } = access;

  if (companyId === targetCompanyId) {
    return { error: "Je kunt je eigen bedrijf niet beoordelen." };
  }

  const contractId = samenwerkingContractId?.trim();
  if (!contractId) {
    return {
      error:
        "Beoordelen kan alleen na een ondertekend samenwerkingscontract.",
    };
  }

  const { data: contract } = await supabase
    .from("samenwerking_contracts")
    .select(
      "id, status, party_a_company_id, party_b_company_id",
    )
    .eq("id", contractId)
    .maybeSingle();

  if (!contract) {
    return { error: "Samenwerkingscontract niet gevonden." };
  }
  if (contract.status !== "signed") {
    return {
      error:
        "Het samenwerkingscontract moet eerst door beide partijen ondertekend zijn.",
    };
  }
  const isParty =
    contract.party_a_company_id === companyId ||
    contract.party_b_company_id === companyId;
  if (!isParty) {
    return { error: "Je bent geen partij bij dit contract." };
  }
  const otherParty =
    contract.party_a_company_id === companyId
      ? contract.party_b_company_id
      : contract.party_a_company_id;
  if (otherParty !== targetCompanyId) {
    return {
      error: "De beoordeling moet over de contractpartner gaan.",
    };
  }

  const cleanRating = Math.round(Number(rating));
  if (cleanRating < 1 || cleanRating > 5) {
    return { error: "De score moet tussen 1 en 5 sterren liggen." };
  }

  const cleanCommentaar = commentaar.trim();
  if (!cleanCommentaar) {
    return { error: "Schrijf een toelichting bij je beoordeling." };
  }

  const { error } = await supabase
    .from("bedrijf_reviews")
    .upsert(
      {
        reviewer_company_id: companyId,
        target_company_id: targetCompanyId,
        rating: cleanRating,
        commentaar: cleanCommentaar,
        samenwerking_contract_id: contractId,
      },
      {
        onConflict: "reviewer_company_id,target_company_id",
      },
    );

  if (error) return { error: error.message };

  revalidatePath("/bouwnetwerk");
  revalidatePath("/dashboard/werkposts/samenwerkingen");
  revalidatePath("/dashboard/werkposts");
  return { success: true };
}

