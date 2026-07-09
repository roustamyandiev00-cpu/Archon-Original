import type { PeppolConfig } from "@/lib/peppol/build";

export type SendResult =
  | { ok: true; id: string; accessPoint: string }
  | { ok: false; error: string };

export type PeppolRecipient = {
  vat?: string | null;
};

/**
 * Verstuurt een UBL-factuur via het geconfigureerde Peppol access point.
 * Momenteel is Storecove concreet geïmplementeerd; andere access points geven
 * een duidelijke melding (gebruik dan de UBL-download).
 */
export async function sendViaAccessPoint(
  config: PeppolConfig,
  ublXml: string,
  recipient: PeppolRecipient,
): Promise<SendResult> {
  if (!config) {
    return { ok: false, error: "Peppol is niet verbonden. Configureer eerst een access point in Integraties." };
  }
  if (!config.apiKey) {
    return { ok: false, error: "Geen API-sleutel voor je access point ingesteld. Vul die in bij Integraties, of download voorlopig de UBL-XML." };
  }

  switch (config.accessPoint) {
    case "storecove":
      return sendViaStorecove(config, ublXml, recipient);
    default:
      return {
        ok: false,
        error: `Automatisch versturen via ${config.accessPoint || "dit access point"} is nog niet geactiveerd. Download de UBL-XML en upload die bij je provider, of kies Storecove.`,
      };
  }
}

async function sendViaStorecove(
  config: NonNullable<PeppolConfig>,
  ublXml: string,
  recipient: PeppolRecipient,
): Promise<SendResult> {
  const legalEntityId = (config as unknown as { legalEntityId?: string })
    .legalEntityId;
  if (!legalEntityId) {
    return {
      ok: false,
      error: "Storecove vereist een Legal Entity ID. Vul die aan in de Peppol-integratie.",
    };
  }
  const receiverVat = (recipient.vat || "").replace(/\s+/g, "");
  if (!receiverVat) {
    return {
      ok: false,
      error: "Ontvanger heeft geen btw-nummer/Peppol-identificatie; kan niet routeren.",
    };
  }

  const body = {
    legalEntityId: Number(legalEntityId),
    routing: {
      eIdentifiers: [{ scheme: "BE:VAT", id: receiverVat }],
    },
    document: {
      documentType: "invoice",
      rawDocumentData: {
        document: Buffer.from(ublXml, "utf8").toString("base64"),
        parse: true,
        parseStrategy: "ubl",
      },
    },
  };

  try {
    const res = await fetch("https://api.storecove.com/api/v2/document_submissions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });
    const json = (await res.json().catch(() => ({}))) as {
      guid?: string;
      id?: string | number;
      message?: string;
      errors?: unknown;
    };
    if (!res.ok) {
      const detail =
        json.message ||
        (json.errors ? JSON.stringify(json.errors) : `HTTP ${res.status}`);
      return { ok: false, error: `Storecove: ${detail}` };
    }
    return {
      ok: true,
      id: String(json.guid ?? json.id ?? "onbekend"),
      accessPoint: "storecove",
    };
  } catch (e) {
    return {
      ok: false,
      error: `Kon Storecove niet bereiken: ${e instanceof Error ? e.message : String(e)}`,
    };
  }
}
