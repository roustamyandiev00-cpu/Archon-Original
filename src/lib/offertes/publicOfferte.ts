import { createClient } from "@supabase/supabase-js";
import {
  buildDocumentValues,
  buildDocumentRows,
  type CustomerLite,
} from "@/lib/documentData";
import {
  buildDocumentHtml,
  resolveDocumentTemplateId,
} from "@/components/dashboard/documenten/documentTemplate";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";
import { htmlToPdf } from "@/lib/pdf";

export type PublicOfferteResult =
  | { ok: true; html: string; nummer: string; bedrijfNaam: string; expired: false }
  | { ok: false; reason: "not_found" | "expired" | "invalid" };

const TOKEN_RE = /^[a-f0-9]{32}$/i;

type PublicOffertePayload = {
  error: "not_found" | "expired" | "invalid" | null;
  offerte?: {
    id: number;
    nummer: string | null;
    klant: string | null;
    datum: string;
    geldig_tot: string | null;
    notes: string | null;
    template_id: string | null;
    bedrijf_id: number;
  };
  bedrijf?: {
    naam: string | null;
    adres: string | null;
    postcode: string | null;
    stad: string | null;
    telefoon: string | null;
    email: string | null;
    btw: string | null;
    iban: string | null;
    algemene_voorwaarden: string | null;
    footer_tekst: string | null;
    default_quote_template: string | null;
  };
  customer?: CustomerLite;
  lijnen?: Array<{
    omschrijving: string | null;
    aantal: number;
    eenheid: string;
    prijs_per_eenheid: number;
    btw_percentage: number;
  }>;
};

export function isValidPublicOfferteToken(token: string): boolean {
  return TOKEN_RE.test(token.trim());
}

function publicSupabase() {
  return createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function loadPublicOfferteHtml(
  token: string,
): Promise<
  | { ok: true; html: string; nummer: string; bedrijfNaam: string }
  | { ok: false; reason: "not_found" | "expired" | "invalid" }
> {
  const trimmed = token.trim();
  if (!isValidPublicOfferteToken(trimmed)) {
    return { ok: false, reason: "invalid" };
  }

  const supabase = publicSupabase();
  const { data, error } = await supabase.rpc("get_public_offerte_by_token", {
    p_token: trimmed,
  });

  if (error || !data) {
    return { ok: false, reason: "not_found" };
  }

  const payload = data as PublicOffertePayload;
  if (payload.error === "expired") return { ok: false, reason: "expired" };
  if (payload.error === "invalid") return { ok: false, reason: "invalid" };
  if (payload.error || !payload.offerte || !payload.bedrijf) {
    return { ok: false, reason: "not_found" };
  }

  const offerte = payload.offerte;
  const bedrijf = payload.bedrijf;
  const lines = (payload.lijnen ?? []).map((l) => ({
    omschrijving: l.omschrijving ?? "",
    aantal: Number(l.aantal ?? 0),
    eenheid: l.eenheid ?? "stuks",
    prijs_per_eenheid: Number(l.prijs_per_eenheid ?? 0),
    btw_percentage: Number(l.btw_percentage ?? 0),
  }));

  const values = buildDocumentValues(
    {
      kind: "quote",
      nummer: offerte.nummer ?? `#${offerte.id}`,
      datum: offerte.datum,
      geldig_tot: offerte.geldig_tot,
      notes: offerte.notes,
      klant: offerte.klant,
    },
    bedrijf,
    payload.customer ?? null,
    lines,
  );
  const rows = buildDocumentRows(lines);
  const templateId = resolveDocumentTemplateId(
    offerte.template_id,
    bedrijf.default_quote_template,
  );
  const html = buildDocumentHtml(templateId, "quote", values, rows);

  return {
    ok: true,
    html,
    nummer: offerte.nummer ?? `#${offerte.id}`,
    bedrijfNaam: bedrijf.naam ?? "Bedrijf",
  };
}

export async function getPublicOfferteHtml(
  token: string,
): Promise<PublicOfferteResult> {
  try {
    const bundle = await loadPublicOfferteHtml(token);
    if (!bundle.ok) return bundle;
    return { ...bundle, expired: false };
  } catch {
    return { ok: false, reason: "not_found" };
  }
}

export async function getPublicOffertePdf(
  token: string,
): Promise<
  | { ok: true; pdf: Buffer; nummer: string }
  | { ok: false; reason: "not_found" | "expired" | "invalid" }
> {
  try {
    const bundle = await loadPublicOfferteHtml(token);
    if (!bundle.ok) return bundle;
    const pdf = await htmlToPdf(bundle.html);
    return { ok: true, pdf, nummer: bundle.nummer };
  } catch {
    return { ok: false, reason: "not_found" };
  }
}
