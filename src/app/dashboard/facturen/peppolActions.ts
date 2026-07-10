"use server";

import { createHash } from "crypto";
import { revalidatePath } from "next/cache";
import { requireWriteAccess } from "@/components/dashboard/context";
import {
  getPeppolConfig,
  buildFactuurUbl,
  syncCompanyLegalEntity,
} from "@/lib/peppol/build";
import { buildInvoiceUBL } from "@/lib/peppol/ubl";
import { sendViaAccessPoint } from "@/lib/peppol/send";
import { normalizeStructuredCommunication } from "@/lib/peppol/be";
import { validateMercuriusInvoice } from "@/lib/peppol/mercurius";
import { untyped } from "@/lib/integraties";
import { notifySlackFactuurVerzonden } from "@/components/dashboard/integraties/slackNotify";

function hashXml(xml: string) {
  return createHash("sha256").update(xml, "utf8").digest("hex");
}

async function logTransmission(
  supabase: unknown,
  input: {
    companyId: number;
    factuurId: number;
    status: string;
    accessPoint?: string;
    messageId?: string;
    error?: string;
    ublHash?: string;
  },
) {
  await untyped(supabase).from("peppol_transmissions").insert({
    bedrijf_id: input.companyId,
    factuur_id: input.factuurId,
    direction: "outbound",
    status: input.status,
    access_point: input.accessPoint ?? null,
    message_id: input.messageId ?? null,
    error_message: input.error ?? null,
    ubl_hash: input.ublHash ?? null,
  });
}

/** Sla Peppol-specifieke factuurvelden op (kopersreferentie, gestructureerde mededeling). */
export async function updateFactuurPeppolFields(
  factuurId: number,
  fields: {
    buyerReference?: string;
    structuredCommunication?: string;
  },
) {
  const access = await requireWriteAccess();
  if ("error" in access) return { error: access.error };
  const { supabase, companyId } = access;

  const patch: Record<string, string | null> = {
    updated_at: new Date().toISOString(),
  };
  if (fields.buyerReference !== undefined) {
    patch.buyer_reference = fields.buyerReference.trim() || null;
  }
  if (fields.structuredCommunication !== undefined) {
    patch.structured_communication = normalizeStructuredCommunication(
      fields.structuredCommunication,
    );
  }

  const { error } = await untyped(supabase)
    .from("facturen")
    .update(patch)
    .eq("id", factuurId)
    .eq("bedrijf_id", companyId);

  if (error) return { error: error.message };

  revalidatePath(`/dashboard/facturen/${factuurId}`);
  return { ok: true };
}

/** Valideer of een factuur klaar is voor Peppol (zonder te versturen). */
export async function checkFactuurPeppolReadiness(factuurId: number) {
  const access = await requireWriteAccess();
  if ("error" in access) return { error: access.error };
  const { supabase, companyId } = access;

  const peppol = await getPeppolConfig(supabase, companyId);
  const built = await buildFactuurUbl(supabase, companyId, factuurId, peppol);
  if (!built) return { error: "Factuur niet gevonden." };

  return {
    ok: built.readiness.ok,
    issues: built.readiness.issues,
    peppolConnected: Boolean(peppol),
  };
}

/** Verstuurt een factuur als e-factuur via het geconfigureerde Peppol access point. */
export async function sendFactuurViaPeppol(factuurId: number) {
  const access = await requireWriteAccess();
  if ("error" in access) return { error: access.error };
  const { supabase, companyId } = access;

  const peppol = await getPeppolConfig(supabase, companyId);
  if (!peppol) {
    return {
      error:
        "Peppol is niet verbonden. Ga naar Integraties → Peppol en configureer een access point.",
    };
  }

  const built = await buildFactuurUbl(supabase, companyId, factuurId, peppol);
  if (!built) return { error: "Factuur niet gevonden." };

  if (!built.readiness.ok) {
    const first = built.readiness.issues.find((i) => i.severity === "error");
    return {
      error:
        first?.message ??
        "Factuur voldoet niet aan de Peppol-vereisten. Los de openstaande punten op.",
      issues: built.readiness.issues,
    };
  }

  const xml = buildInvoiceUBL(built.ubl);
  const ublHash = hashXml(xml);

  const result = await sendViaAccessPoint(peppol, xml, {
    vat: built.ubl.customer.vat,
  });

  const now = new Date().toISOString();

  if (!result.ok) {
    await untyped(supabase)
      .from("facturen")
      .update({
        peppol_status: "fout",
        peppol_last_error: result.error,
        updated_at: now,
      })
      .eq("id", factuurId)
      .eq("bedrijf_id", companyId);

    await logTransmission(supabase, {
      companyId,
      factuurId,
      status: "fout",
      accessPoint: peppol.accessPoint,
      error: result.error,
      ublHash,
    });

    revalidatePath(`/dashboard/facturen/${factuurId}`);
    return { error: result.error };
  }

  await untyped(supabase)
    .from("facturen")
    .update({
      peppol_status: "verzonden",
      peppol_sent_at: now,
      peppol_message_id: result.id,
      peppol_last_error: null,
      sent_at: now,
      status: "verzonden",
      updated_at: now,
    })
    .eq("id", factuurId)
    .eq("bedrijf_id", companyId);

  await logTransmission(supabase, {
    companyId,
    factuurId,
    status: "verzonden",
    accessPoint: result.accessPoint,
    messageId: result.id,
    ublHash,
  });

  void notifySlackFactuurVerzonden(supabase, companyId, {
    id: factuurId,
    nummer: built.nummer,
    klant: built.ubl.customer.name,
    totaal: built.ubl.lines.reduce((sum, line) => {
      const net = line.quantity * line.unitPrice;
      return sum + net * (1 + line.vatPercent / 100);
    }, 0),
  });

  revalidatePath(`/dashboard/facturen/${factuurId}`);
  revalidatePath("/dashboard/facturen");
  return { ok: true, id: result.id };
}

/** Synchroniseer bedrijfsgegevens naar company_legal_entities na instellingen-wijziging. */
export async function syncPeppolCompanyProfile() {
  const access = await requireWriteAccess();
  if ("error" in access) return { error: access.error };
  await syncCompanyLegalEntity(access.supabase, access.companyId);
  return { ok: true };
}

async function loadMercuriusCustomer(
  supabase: unknown,
  companyId: number,
  customerId: number | null,
) {
  if (!customerId) return { is_overheid: false, mercurius_entiteit_id: null as string | null };
  const { data } = await untyped(supabase)
    .from("customers")
    .select("is_overheid, mercurius_entiteit_id")
    .eq("id", customerId)
    .eq("company_id", companyId)
    .maybeSingle();
  return {
    is_overheid: Boolean(data?.is_overheid),
    mercurius_entiteit_id: (data?.mercurius_entiteit_id as string | null) ?? null,
  };
}

/** Valideer Mercurius/B2G-gereedheid zonder te versturen. */
export async function checkFactuurMercuriusReadiness(factuurId: number) {
  const access = await requireWriteAccess();
  if ("error" in access) return { error: access.error };
  const { supabase, companyId } = access;

  const peppol = await getPeppolConfig(supabase, companyId);
  const built = await buildFactuurUbl(supabase, companyId, factuurId, peppol);
  if (!built) return { error: "Factuur niet gevonden." };

  const { data: factuur } = await untyped(supabase)
    .from("facturen")
    .select("customer_id")
    .eq("id", factuurId)
    .maybeSingle();

  const customer = await loadMercuriusCustomer(
    supabase,
    companyId,
    factuur?.customer_id ?? null,
  );

  const readiness = validateMercuriusInvoice({
    ubl: built.ubl,
    customerIsOverheid: customer.is_overheid,
    mercuriusEntiteitId: customer.mercurius_entiteit_id,
  });

  return {
    ok: readiness.ok && built.readiness.ok,
    mercuriusIssues: readiness.issues,
    peppolIssues: built.readiness.issues,
    peppolConnected: Boolean(peppol),
  };
}

/** Verstuur factuur naar Belgische overheid via Mercurius/Peppol B2G. */
export async function sendFactuurViaMercurius(factuurId: number) {
  const readiness = await checkFactuurMercuriusReadiness(factuurId);
  if ("error" in readiness && readiness.error) return readiness;
  if (!readiness.ok) {
    const first = [
      ...(readiness.mercuriusIssues ?? []),
      ...(readiness.peppolIssues ?? []),
    ].find((i) => i.severity === "error");
    return {
      error:
        first?.message ??
        "Factuur voldoet niet aan Mercurius/B2G-vereisten.",
    };
  }
  if (!readiness.peppolConnected) {
    return {
      error: "Peppol is niet verbonden — Mercurius vereist een access point.",
    };
  }

  const result = await sendFactuurViaPeppol(factuurId);
  if ("error" in result && result.error) {
    const access = await requireWriteAccess();
    if (!("error" in access)) {
      await untyped(access.supabase)
        .from("facturen")
        .update({
          mercurius_status: "fout",
          mercurius_last_error: result.error,
          updated_at: new Date().toISOString(),
        })
        .eq("id", factuurId)
        .eq("bedrijf_id", access.companyId);
    }
    return result;
  }

  const access = await requireWriteAccess();
  if ("error" in access) return { ok: true };
  const now = new Date().toISOString();
  await untyped(access.supabase)
    .from("facturen")
    .update({
      mercurius_status: "verzonden",
      mercurius_sent_at: now,
      mercurius_last_error: null,
      updated_at: now,
    })
    .eq("id", factuurId)
    .eq("bedrijf_id", access.companyId);

  revalidatePath("/dashboard/e-facturen");
  revalidatePath(`/dashboard/facturen/${factuurId}`);
  return { ok: true };
}
