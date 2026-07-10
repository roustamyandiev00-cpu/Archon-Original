import type { SupabaseClient } from "@supabase/supabase-js";
import { buildFactuurUbl } from "@/lib/peppol/build";
import { buildInvoiceUBL } from "@/lib/peppol/ubl";
import { getPeppolConfig } from "@/lib/peppol/build";
import { untyped } from "@/lib/integraties";
import {
  getIntegrationConfig,
  getOAuthAccessToken,
  markFactuurExportError,
  markFactuurExported,
} from "@/lib/accounting/tokens";

const EXACT_BASE = "https://start.exactonline.be/api/v1";

async function exactFetch(
  token: string,
  path: string,
  init?: RequestInit,
) {
  const res = await fetch(`${EXACT_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const json = await res.json().catch(() => ({}));
  return { res, json };
}

async function resolveDivision(
  supabase: unknown,
  companyId: number,
  token: string,
  config: Record<string, unknown>,
) {
  const stored = config.division;
  if (stored) return String(stored);

  const { res, json } = await exactFetch(
    token,
    "/current/Me?$select=CurrentDivision",
  );
  if (!res.ok) return null;
  const results = (json as { d?: { results?: { CurrentDivision?: number }[] } })
    ?.d?.results;
  const division = results?.[0]?.CurrentDivision;
  if (!division) return null;

  await untyped(supabase)
    .from("integraties")
    .update({
      config: { ...config, division: String(division) },
      updated_at: new Date().toISOString(),
    })
    .eq("bedrijf_id", companyId)
    .eq("provider", "exact-online");

  return String(division);
}

export async function exportFactuurToExact(
  supabaseClient: unknown,
  companyId: number,
  factuurId: number,
): Promise<{ ok: true; entryId: string } | { ok: false; error: string }> {
  const supabase = untyped(supabaseClient) as SupabaseClient;
  const tokenRes = await getOAuthAccessToken(
    supabaseClient,
    companyId,
    "exact-online",
  );
  if (!tokenRes.ok) return tokenRes;

  const config = await getIntegrationConfig(
    supabaseClient,
    companyId,
    "exact-online",
  );
  if (!config) return { ok: false, error: "Exact Online is niet gekoppeld." };

  const { data: factuur } = await supabase
    .from("facturen")
    .select("id, nummer, accounting_export_id, customer_id, klant, datum, omschrijving")
    .eq("id", factuurId)
    .eq("bedrijf_id", companyId)
    .maybeSingle();

  if (!factuur) return { ok: false, error: "Factuur niet gevonden." };
  if (factuur.accounting_export_id) {
    return {
      ok: false,
      error: `Al geëxporteerd (ID ${factuur.accounting_export_id}).`,
    };
  }

  const division = await resolveDivision(
    supabaseClient,
    companyId,
    tokenRes.token,
    config,
  );
  if (!division) {
    return { ok: false, error: "Kon Exact-divisie niet bepalen." };
  }

  const { data: lijnen } = await supabase
    .from("factuur_lijnen")
    .select("omschrijving, aantal, prijs_per_eenheid, btw_percentage")
    .eq("factuur_id", factuurId)
    .order("sort_order");

  if (!lijnen?.length) {
    return { ok: false, error: "Factuur heeft geen regels." };
  }

  let customerVat: string | null = null;
  if (factuur.customer_id) {
    const { data: klant } = await supabase
      .from("customers")
      .select("btw, company_name, name")
      .eq("id", factuur.customer_id)
      .eq("company_id", companyId)
      .maybeSingle();
    customerVat = klant?.btw ?? null;
  }

  const description = `${factuur.nummer ?? factuur.id} — ${factuur.klant ?? "Klant"}`;

  const salesEntryLines = lijnen.map((l, idx) => {
    const qty = Number(l.aantal ?? 1);
    const price = Number(l.prijs_per_eenheid ?? 0);
    const vat = Number(l.btw_percentage ?? 21);
    return {
      LineNumber: idx + 1,
      Description: l.omschrijving ?? `Regel ${idx + 1}`,
      Quantity: qty,
      AmountFC: Number((qty * price).toFixed(2)),
      VATCode: vat >= 21 ? "1" : vat >= 12 ? "2" : vat >= 6 ? "3" : "0",
    };
  });

  const body: Record<string, unknown> = {
    Description: description.slice(0, 60),
    EntryDate: factuur.datum,
    YourRef: factuur.nummer ?? String(factuur.id),
    SalesEntryLines: salesEntryLines,
  };

  if (customerVat) {
    const vatFilter = encodeURIComponent(
      `VATNumber eq '${customerVat.replace(/\s+/g, "")}'`,
    );
    const accountRes = await exactFetch(
      tokenRes.token,
      `/${division}/crm/Accounts?$filter=${vatFilter}&$select=ID&$top=1`,
    );
    const accountId = (
      accountRes.json as { d?: { results?: { ID?: string }[] } }
    )?.d?.results?.[0]?.ID;
    if (accountId) body.Customer = accountId;
  }

  const { res, json } = await exactFetch(
    tokenRes.token,
    `/${division}/salesentry/SalesEntries`,
    { method: "POST", body: JSON.stringify(body) },
  );

  if (!res.ok) {
    const err =
      (json as { error?: { message?: { value?: string } } })?.error?.message
        ?.value ?? `Exact: HTTP ${res.status}`;
    await markFactuurExportError(supabaseClient, companyId, factuurId, err);
    return { ok: false, error: err };
  }

  const entryId = String(
    (json as { d?: { EntryID?: string; EntryNumber?: number } })?.d?.EntryID ??
      (json as { d?: { EntryNumber?: number } })?.d?.EntryNumber ??
      "onbekend",
  );

  await markFactuurExported(
    supabaseClient,
    companyId,
    factuurId,
    "exact-online",
    entryId,
  );

  return { ok: true, entryId };
}

/** Exporteert UBL naar Yuki via Upload-webservice (SOAP). */
export async function exportFactuurToYuki(
  supabaseClient: unknown,
  companyId: number,
  factuurId: number,
): Promise<{ ok: true; documentId: string } | { ok: false; error: string }> {
  const config = await getIntegrationConfig(supabaseClient, companyId, "yuki");
  if (!config) return { ok: false, error: "Yuki is niet gekoppeld." };

  const apiKey = String(config.apiKey ?? "").trim();
  const administrationId = String(config.administrationId ?? "").trim();
  if (!apiKey) return { ok: false, error: "Yuki API-sleutel ontbreekt." };
  if (!administrationId) {
    return {
      ok: false,
      error: "Vul een Yuki administratie-ID in bij Integraties.",
    };
  }

  const supabase = untyped(supabaseClient) as SupabaseClient;
  const { data: factuur } = await supabase
    .from("facturen")
    .select("id, nummer, accounting_export_id")
    .eq("id", factuurId)
    .eq("bedrijf_id", companyId)
    .maybeSingle();

  if (!factuur) return { ok: false, error: "Factuur niet gevonden." };
  if (factuur.accounting_export_id) {
    return {
      ok: false,
      error: `Al geëxporteerd (ID ${factuur.accounting_export_id}).`,
    };
  }

  const peppol = await getPeppolConfig(supabaseClient, companyId);
  const built = await buildFactuurUbl(
    supabaseClient,
    companyId,
    factuurId,
    peppol,
  );
  if (!built) return { ok: false, error: "Kon factuur niet opbouwen." };

  const xml = buildInvoiceUBL(built.ubl);
  const fileName = `${built.nummer ?? factuurId}.xml`;
  const base64 = Buffer.from(xml, "utf8").toString("base64");

  const sessionId = await yukiAuthenticate(apiKey);
  if (!sessionId) {
    return { ok: false, error: "Yuki-authenticatie mislukt." };
  }

  const documentId = await yukiUploadDocument(
    sessionId,
    administrationId,
    fileName,
    base64,
  );
  if (!documentId) {
    const err = "Yuki upload mislukt.";
    await markFactuurExportError(supabaseClient, companyId, factuurId, err);
    return { ok: false, error: err };
  }

  await markFactuurExported(
    supabaseClient,
    companyId,
    factuurId,
    "yuki",
    documentId,
  );

  return { ok: true, documentId };
}

async function yukiSoap(
  service: string,
  action: string,
  body: string,
): Promise<string | null> {
  const envelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xmlns:xsd="http://www.w3.org/2001/XMLSchema"
  xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>${body}</soap:Body>
</soap:Envelope>`;

  const res = await fetch(`https://api.yukiworks.be/ws/${service}.asmx`, {
    method: "POST",
    headers: {
      "Content-Type": "text/xml; charset=utf-8",
      SOAPAction: `http://www.yukiworks.nl/webservices/${action}`,
    },
    body: envelope,
  });

  const text = await res.text();
  if (!res.ok) return null;
  return text;
}

function soapTag(xml: string, tag: string): string | null {
  const re = new RegExp(`<(?:\\w+:)?${tag}[^>]*>([^<]*)</(?:\\w+:)?${tag}>`, "i");
  return xml.match(re)?.[1]?.trim() ?? null;
}

async function yukiAuthenticate(apiKey: string): Promise<string | null> {
  const xml = await yukiSoap(
    "Accounting",
    "Authenticate",
    `<Authenticate xmlns="http://www.yukiworks.nl/webservices">
      <accessKey>${apiKey}</accessKey>
    </Authenticate>`,
  );
  if (!xml) return null;
  return soapTag(xml, "AuthenticateResult");
}

async function yukiUploadDocument(
  sessionId: string,
  administrationId: string,
  fileName: string,
  base64Content: string,
): Promise<string | null> {
  const xml = await yukiSoap(
    "Upload",
    "UploadDocument",
    `<UploadDocument xmlns="http://www.yukiworks.nl/webservices">
      <sessionId>${sessionId}</sessionId>
      <administrationId>${administrationId}</administrationId>
      <fileName>${fileName}</fileName>
      <documentContent>${base64Content}</documentContent>
    </UploadDocument>`,
  );
  if (!xml) return null;
  return soapTag(xml, "UploadDocumentResult") ?? "uploaded";
}
