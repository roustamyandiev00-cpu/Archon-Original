"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireWriteAccess } from "@/components/dashboard/context";
import {
  generateSamenwerkingContractDraft,
  type SamenwerkingContractDraft,
} from "@/lib/agents/contract";
import { loadMergedAiConfig } from "@/lib/agents/companyAi";
import {
  buildContractHtml,
  draftToStoredHtml,
} from "@/lib/pdf/contractTemplate";
import { htmlToPdf } from "@/lib/pdf";
import {
  mapSamenwerkingContractRow,
  type SamenwerkingContractRow,
} from "@/lib/werkposts/contracts";

const CONTRACT_BUCKET = "company-private";

export type { SamenwerkingContractRow };

function formatSignedAt(iso: string): string {
  return new Date(iso).toLocaleString("nl-BE", {
    dateStyle: "long",
    timeStyle: "short",
  });
}

async function assertChannelMember(
  supabase: SupabaseClient,
  channelId: string,
  companyId: number,
) {
  const { data: membership } = await supabase
    .from("bouwnetwerk_channel_members")
    .select("id")
    .eq("channel_id", channelId)
    .eq("company_id", companyId)
    .eq("is_active", true)
    .maybeSingle();
  return Boolean(membership);
}

async function loadContractContext(
  supabase: SupabaseClient,
  channelId: string,
  companyId: number,
  extraPrompt?: string,
) {
  const { data: channel } = await supabase
    .from("bouwnetwerk_channels")
    .select("id, werkpost_id, werkpost_reactie_id")
    .eq("id", channelId)
    .maybeSingle();

  if (!channel) return { error: "Gesprek niet gevonden." as const };

  const { data: members } = await supabase
    .from("bouwnetwerk_channel_members")
    .select("company_id")
    .eq("channel_id", channelId)
    .eq("is_active", true);

  const memberIds = (members ?? [])
    .map((m) => m.company_id)
    .filter((id): id is number => typeof id === "number");

  if (!memberIds.includes(companyId)) {
    return { error: "Je bent geen lid van dit gesprek." as const };
  }

  if (memberIds.length < 2) {
    return { error: "Beide partijen moeten in het gesprek zitten." as const };
  }

  const otherCompanyId = memberIds.find((id) => id !== companyId)!;
  let partyAId = companyId;
  let partyBId = otherCompanyId;

  let werkpost: {
    titel: string;
    beschrijving: string | null;
    regio: string | null;
    type: string | null;
    startdatum: string | null;
    einddatum: string | null;
    company_id: number;
  } | null = null;

  let reactie: {
    bericht: string | null;
    voorgesteld_tarief: number | null;
  } | null = null;

  if (channel.werkpost_id) {
    const { data: wp } = await supabase
      .from("werkposts")
      .select(
        "titel, beschrijving, regio, type, startdatum, einddatum, company_id",
      )
      .eq("id", channel.werkpost_id)
      .maybeSingle();
    werkpost = wp ?? null;
    if (wp?.company_id) {
      partyAId = wp.company_id;
      partyBId = memberIds.find((id) => id !== partyAId) ?? otherCompanyId;
    }
  }

  if (channel.werkpost_reactie_id) {
    const { data: r } = await supabase
      .from("werkpost_reacties")
      .select("bericht, voorgesteld_tarief")
      .eq("id", channel.werkpost_reactie_id)
      .maybeSingle();
    reactie = r ?? null;
  }

  const companyIds = [partyAId, partyBId];
  const { data: bedrijven } = await supabase
    .from("bedrijven_directory")
    .select("id, naam")
    .in("id", companyIds);

  const naamMap = new Map<number, string>();
  for (const b of bedrijven ?? []) {
    if (b.id != null) naamMap.set(b.id, b.naam ?? `Bedrijf #${b.id}`);
  }

  const partyAName = naamMap.get(partyAId) ?? `Bedrijf #${partyAId}`;
  const partyBName = naamMap.get(partyBId) ?? `Bedrijf #${partyBId}`;

  return {
    channel,
    partyAId,
    partyBId,
    partyAName,
    partyBName,
    werkpost,
    reactie,
    extraPrompt,
  };
}

export async function generateSamenwerkingContract(
  channelId: string,
  extraPrompt?: string,
): Promise<{ contract?: SamenwerkingContractRow; error?: string }> {
  const access = await requireWriteAccess();
  if ("error" in access) return { error: access.error };
  const { supabase, user, companyId } = access;

  const ctx = await loadContractContext(
    supabase,
    channelId,
    companyId,
    extraPrompt?.trim(),
  );
  if ("error" in ctx) return { error: ctx.error };

  const { data: existing } = await supabase
    .from("samenwerking_contracts")
    .select("id, status")
    .eq("channel_id", channelId)
    .neq("status", "void")
    .maybeSingle();

  if (existing && existing.status !== "draft") {
    return {
      error:
        "Er loopt al een contract ter ondertekening of getekend. Maak eerst het huidige contract ongeldig.",
    };
  }

  const ai = await loadMergedAiConfig(supabase, companyId, user.id);
  const { draft, error: aiError } = await generateSamenwerkingContractDraft({
    ai,
    supabase,
    companyId,
    userId: user.id,
    context: {
      partyAName: ctx.partyAName,
      partyBName: ctx.partyBName,
      werkpostTitel: ctx.werkpost?.titel,
      werkpostBeschrijving: ctx.werkpost?.beschrijving,
      werkpostRegio: ctx.werkpost?.regio,
      werkpostType: ctx.werkpost?.type,
      voorgesteldTarief: ctx.reactie?.voorgesteld_tarief ?? null,
      reactieBericht: ctx.reactie?.bericht,
      startdatum: ctx.werkpost?.startdatum,
      einddatum: ctx.werkpost?.einddatum,
      extraPrompt: ctx.extraPrompt,
    },
  });

  if (!draft) return { error: aiError ?? "Contract kon niet worden gegenereerd." };

  const draftHtml = draftToStoredHtml({
    draft,
    partyAName: ctx.partyAName,
    partyBName: ctx.partyBName,
  });

  const payload = {
    channel_id: channelId,
    werkpost_id: ctx.channel.werkpost_id,
    werkpost_reactie_id: ctx.channel.werkpost_reactie_id,
    created_by_company_id: companyId,
    party_a_company_id: ctx.partyAId,
    party_b_company_id: ctx.partyBId,
    titel: draft.titel,
    draft_html: draftHtml,
    draft_json: draft,
    status: "draft" as const,
    ai_prompt: ctx.extraPrompt ?? null,
    updated_at: new Date().toISOString(),
  };

  let row;
  if (existing?.id) {
    const { data, error } = await supabase
      .from("samenwerking_contracts")
      .update(payload)
      .eq("id", existing.id)
      .select("*")
      .single();
    if (error) return { error: error.message };
    row = data;
  } else {
    const { data, error } = await supabase
      .from("samenwerking_contracts")
      .insert(payload)
      .select("*")
      .single();
    if (error) return { error: error.message };
    row = data;
  }

  revalidatePath("/dashboard/werkposts/samenwerkingen");
  return { contract: mapSamenwerkingContractRow(row as Record<string, unknown>) };
}

export async function sendContractForSigning(contractId: string) {
  const access = await requireWriteAccess();
  if ("error" in access) return { error: access.error };
  const { supabase, user, companyId } = access;

  const { data: contract } = await supabase
    .from("samenwerking_contracts")
    .select("*")
    .eq("id", contractId)
    .maybeSingle();

  if (!contract) return { error: "Contract niet gevonden." };
  if (contract.status !== "draft") {
    return { error: "Alleen concepten kunnen ter ondertekening worden verstuurd." };
  }

  const isMember = await assertChannelMember(
    supabase,
    contract.channel_id,
    companyId,
  );
  if (!isMember) return { error: "Geen toegang tot dit contract." };

  const { error } = await supabase
    .from("samenwerking_contracts")
    .update({
      status: "pending_signatures",
      updated_at: new Date().toISOString(),
    })
    .eq("id", contractId);

  if (error) return { error: error.message };

  await supabase.from("bouwnetwerk_messages").insert({
    channel_id: contract.channel_id,
    sender_company_id: companyId,
    sender_user_id: user.id,
    content: JSON.stringify({
      text: `📄 Contract "${contract.titel}" klaar ter ondertekening. Beide partijen kunnen digitaal tekenen in Samenwerkingen.`,
      contractId,
      contractStatus: "pending_signatures",
    }),
    type: "text",
  });

  await supabase
    .from("bouwnetwerk_channels")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", contract.channel_id);

  revalidatePath("/dashboard/werkposts/samenwerkingen");
  return { success: true };
}

async function renderAndStorePdf(
  supabase: SupabaseClient,
  contract: Record<string, unknown>,
  partyAName: string,
  partyBName: string,
) {
  const draft = contract.draft_json as SamenwerkingContractDraft;
  const html = buildContractHtml({
    draft,
    partyAName,
    partyBName,
    partyASignature: contract.party_a_signed_at
      ? {
          companyName: partyAName,
          signerName: String(contract.party_a_signer_name ?? partyAName),
          signedAt: formatSignedAt(String(contract.party_a_signed_at)),
        }
      : null,
    partyBSignature: contract.party_b_signed_at
      ? {
          companyName: partyBName,
          signerName: String(contract.party_b_signer_name ?? partyBName),
          signedAt: formatSignedAt(String(contract.party_b_signed_at)),
        }
      : null,
  });

  const pdfBuffer = await htmlToPdf(html);
  const path = `${contract.party_a_company_id}/contracts/${contract.id}.pdf`;

  const { error: uploadError } = await supabase.storage
    .from(CONTRACT_BUCKET)
    .upload(path, pdfBuffer, {
      contentType: "application/pdf",
      upsert: true,
    });

  if (uploadError) throw new Error(uploadError.message);

  await supabase
    .from("samenwerking_contracts")
    .update({
      draft_html: html,
      pdf_storage_path: path,
      updated_at: new Date().toISOString(),
    })
    .eq("id", contract.id);
}

export async function signSamenwerkingContract(contractId: string) {
  const access = await requireWriteAccess();
  if ("error" in access) return { error: access.error };
  const { supabase, user, companyId } = access;

  const { data: contract } = await supabase
    .from("samenwerking_contracts")
    .select("*")
    .eq("id", contractId)
    .maybeSingle();

  if (!contract) return { error: "Contract niet gevonden." };
  if (contract.status !== "pending_signatures") {
    return { error: "Dit contract wacht niet op ondertekening." };
  }

  const isMember = await assertChannelMember(
    supabase,
    contract.channel_id,
    companyId,
  );
  if (!isMember) return { error: "Geen toegang tot dit contract." };

  const isPartyA = companyId === contract.party_a_company_id;
  const isPartyB = companyId === contract.party_b_company_id;
  if (!isPartyA && !isPartyB) {
    return { error: "Alleen contractpartijen kunnen tekenen." };
  }

  if (isPartyA && contract.party_a_signed_at) {
    return { error: "Jouw bedrijf heeft dit contract al ondertekend." };
  }
  if (isPartyB && contract.party_b_signed_at) {
    return { error: "Jouw bedrijf heeft dit contract al ondertekend." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", user.id)
    .maybeSingle();

  const signerName =
    profile?.full_name?.trim() ||
    profile?.email?.split("@")[0] ||
    "Geautoriseerde ondertekenaar";

  const now = new Date().toISOString();
  const otherSigned = isPartyA
    ? contract.party_b_signed_at
    : contract.party_a_signed_at;

  const updates = isPartyA
    ? {
        updated_at: now,
        party_a_signed_at: now,
        party_a_signed_by: user.id,
        party_a_signer_name: signerName,
        ...(otherSigned ? { status: "signed" as const } : {}),
      }
    : {
        updated_at: now,
        party_b_signed_at: now,
        party_b_signed_by: user.id,
        party_b_signer_name: signerName,
        ...(otherSigned ? { status: "signed" as const } : {}),
      };

  const { data: updated, error } = await supabase
    .from("samenwerking_contracts")
    .update(updates)
    .eq("id", contractId)
    .select("*")
    .single();

  if (error) return { error: error.message };

  const companyIds = [
    contract.party_a_company_id,
    contract.party_b_company_id,
  ];
  const { data: bedrijven } = await supabase
    .from("bedrijven_directory")
    .select("id, naam")
    .in("id", companyIds);

  const naamMap = new Map<number, string>();
  for (const b of bedrijven ?? []) {
    if (b.id != null) naamMap.set(b.id, b.naam ?? `Bedrijf #${b.id}`);
  }

  const partyAName =
    naamMap.get(contract.party_a_company_id) ??
    `Bedrijf #${contract.party_a_company_id}`;
  const partyBName =
    naamMap.get(contract.party_b_company_id) ??
    `Bedrijf #${contract.party_b_company_id}`;

  const signedMessage =
    updates.status === "signed"
      ? `✅ Contract "${contract.titel}" is volledig ondertekend door beide partijen.`
      : `✍️ ${signerName} (${isPartyA ? partyAName : partyBName}) heeft het contract ondertekend. Wacht op de andere partij.`;

  await supabase.from("bouwnetwerk_messages").insert({
    channel_id: contract.channel_id,
    sender_company_id: companyId,
    sender_user_id: user.id,
    content: JSON.stringify({
      text: signedMessage,
      contractId,
      contractStatus: updates.status ?? "pending_signatures",
    }),
    type: "text",
  });

  if (updates.status === "signed") {
    try {
      await renderAndStorePdf(
        supabase,
        updated as Record<string, unknown>,
        partyAName,
        partyBName,
      );
    } catch (pdfErr) {
      console.error("Contract PDF:", pdfErr);
    }
  }

  await supabase
    .from("bouwnetwerk_channels")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", contract.channel_id);

  revalidatePath("/dashboard/werkposts/samenwerkingen");
  return {
    success: true,
    contract: mapSamenwerkingContractRow(updated as Record<string, unknown>),
  };
}

export async function voidSamenwerkingContract(contractId: string) {
  const access = await requireWriteAccess();
  if ("error" in access) return { error: access.error };
  const { supabase, companyId } = access;

  const { data: contract } = await supabase
    .from("samenwerking_contracts")
    .select("channel_id, status, created_by_company_id")
    .eq("id", contractId)
    .maybeSingle();

  if (!contract) return { error: "Contract niet gevonden." };
  if (contract.status === "signed") {
    return { error: "Getekende contracten kunnen niet worden geannuleerd." };
  }

  const isMember = await assertChannelMember(
    supabase,
    contract.channel_id,
    companyId,
  );
  if (!isMember) return { error: "Geen toegang." };

  const { error } = await supabase
    .from("samenwerking_contracts")
    .update({ status: "void", updated_at: new Date().toISOString() })
    .eq("id", contractId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/werkposts/samenwerkingen");
  return { success: true };
}
