import type { PeppolConfig } from "@/lib/peppol/build";

export type SendResult =
  | { ok: true; id: string; accessPoint: string }
  | { ok: false; error: string };

export type PeppolRecipient = {
  vat?: string | null;
};

export type PeppolTestResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

function billitBaseUrl(sandbox?: boolean): string {
  return sandbox ? "https://api.sandbox.billit.be" : "https://api.billit.be";
}

function billitHeaders(config: NonNullable<PeppolConfig>): Record<string, string> {
  const partyId = config.partyId?.trim();
  if (!partyId) {
    throw new Error("Billit vereist een Party ID.");
  }
  return {
    PartyID: partyId,
    ApiKey: config.apiKey,
    Accept: "application/json",
  };
}

/**
 * Verstuurt een UBL-factuur via het geconfigureerde Peppol access point.
 * Storecove en Billit zijn concreet geïmplementeerd; andere access points geven
 * een duidelijke melding (gebruik dan de UBL-download).
 */
export async function sendViaAccessPoint(
  config: PeppolConfig,
  ublXml: string,
  recipient: PeppolRecipient,
): Promise<SendResult> {
  if (!config) {
    return {
      ok: false,
      error:
        "Peppol is niet verbonden. Configureer eerst een access point in Integraties.",
    };
  }
  if (!config.apiKey) {
    return {
      ok: false,
      error:
        "Geen API-sleutel voor je access point ingesteld. Vul die in bij Integraties, of download voorlopig de UBL-XML.",
    };
  }

  switch (config.accessPoint) {
    case "storecove":
      return sendViaStorecove(config, ublXml, recipient);
    case "billit":
      return sendViaBillit(config, ublXml);
    default:
      return {
        ok: false,
        error: `Automatisch versturen via ${config.accessPoint || "dit access point"} is nog niet geactiveerd. Kies Storecove of Billit, of download de UBL-XML en upload die bij je provider.`,
      };
  }
}

/** Test of de Peppol access point-configuratie werkt (credentials + bereikbaarheid). */
export async function testPeppolAccessPoint(
  config: PeppolConfig,
): Promise<PeppolTestResult> {
  if (!config) {
    return { ok: false, error: "Peppol is niet geconfigureerd." };
  }
  if (!config.apiKey?.trim()) {
    return { ok: false, error: "Vul eerst een API-sleutel in." };
  }

  switch (config.accessPoint) {
    case "storecove":
      return testStorecove(config);
    case "billit":
      return testBillit(config);
    default:
      return {
        ok: false,
        error:
          "Verbindingstest is alleen beschikbaar voor Storecove en Billit. Bij 'Andere / handmatig' kun je de UBL-XML downloaden.",
      };
  }
}

async function sendViaStorecove(
  config: NonNullable<PeppolConfig>,
  ublXml: string,
  recipient: PeppolRecipient,
): Promise<SendResult> {
  const legalEntityId = config.legalEntityId;
  if (!legalEntityId) {
    return {
      ok: false,
      error:
        "Storecove vereist een Legal Entity ID. Vul die aan in de Peppol-integratie.",
    };
  }
  const receiverVat = (recipient.vat || "").replace(/\s+/g, "");
  if (!receiverVat) {
    return {
      ok: false,
      error:
        "Ontvanger heeft geen btw-nummer/Peppol-identificatie; kan niet routeren.",
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

async function sendViaBillit(
  config: NonNullable<PeppolConfig>,
  ublXml: string,
): Promise<SendResult> {
  if (!config.partyId?.trim()) {
    return {
      ok: false,
      error: "Billit vereist een Party ID. Vul die aan in de Peppol-integratie.",
    };
  }

  const url = `${billitBaseUrl(config.sandbox)}/v1/peppol/sendxml`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        ...billitHeaders(config),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ XML: ublXml }),
    });
    const json = (await res.json().catch(() => ({}))) as {
      InboxItemID?: string | number;
      inboxItemID?: string | number;
      Message?: string;
      message?: string;
      Errors?: unknown;
      errors?: unknown;
    };
    if (!res.ok) {
      const detail =
        json.Message ??
        json.message ??
        (json.Errors ?? json.errors
          ? JSON.stringify(json.Errors ?? json.errors)
          : `HTTP ${res.status}`);
      return { ok: false, error: `Billit: ${detail}` };
    }
    const id = String(json.InboxItemID ?? json.inboxItemID ?? "onbekend");
    return { ok: true, id, accessPoint: "billit" };
  } catch (e) {
    return {
      ok: false,
      error: `Kon Billit niet bereiken: ${e instanceof Error ? e.message : String(e)}`,
    };
  }
}

async function testStorecove(
  config: NonNullable<PeppolConfig>,
): Promise<PeppolTestResult> {
  if (!config.legalEntityId?.trim()) {
    return { ok: false, error: "Vul een Legal Entity ID in voor Storecove." };
  }

  try {
    const res = await fetch(
      `https://api.storecove.com/api/v2/legal_entities/${encodeURIComponent(config.legalEntityId)}`,
      {
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          Accept: "application/json",
        },
      },
    );
    if (res.status === 401 || res.status === 403) {
      return { ok: false, error: "Storecove: API-sleutel ongeldig of geen toegang." };
    }
    if (!res.ok) {
      return {
        ok: false,
        error: `Storecove: kon legal entity niet ophalen (HTTP ${res.status}).`,
      };
    }
    return { ok: true, message: "Storecove-verbinding werkt." };
  } catch (e) {
    return {
      ok: false,
      error: `Kon Storecove niet bereiken: ${e instanceof Error ? e.message : String(e)}`,
    };
  }
}

async function testBillit(
  config: NonNullable<PeppolConfig>,
): Promise<PeppolTestResult> {
  if (!config.partyId?.trim()) {
    return { ok: false, error: "Vul een Party ID in voor Billit." };
  }

  const lookupId = encodeURIComponent(
    config.participantId?.trim() || "9925:BE0123456789",
  );
  const url = `${billitBaseUrl(config.sandbox)}/v1/peppol/participantInformation/${lookupId}`;

  try {
    const res = await fetch(url, {
      headers: billitHeaders(config),
    });
    if (res.status === 401 || res.status === 403) {
      return {
        ok: false,
        error: "Billit: Party ID of API-sleutel ongeldig.",
      };
    }
    if (!res.ok) {
      return {
        ok: false,
        error: `Billit: verbinding mislukt (HTTP ${res.status}). Controleer Party ID en API-sleutel.`,
      };
    }
    const env = config.sandbox ? "sandbox" : "productie";
    return {
      ok: true,
      message: `Billit-verbinding werkt (${env}). Peppol-lookup bereikbaar.`,
    };
  } catch (e) {
    return {
      ok: false,
      error: `Kon Billit niet bereiken: ${e instanceof Error ? e.message : String(e)}`,
    };
  }
}
