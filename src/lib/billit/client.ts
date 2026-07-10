export type BillitCredentials = {
  apiKey: string;
  partyId: string;
  sandbox?: boolean;
};

export function billitBaseUrl(sandbox?: boolean): string {
  return sandbox ? "https://api.sandbox.billit.be" : "https://api.billit.be";
}

export function billitHeaders(creds: BillitCredentials): Record<string, string> {
  const partyId = creds.partyId.trim();
  if (!partyId) {
    throw new Error("Billit vereist een Party ID.");
  }
  return {
    PartyID: partyId,
    ApiKey: creds.apiKey,
    Accept: "application/json",
  };
}

export async function billitFetch(
  creds: BillitCredentials,
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const url = `${billitBaseUrl(creds.sandbox)}${path.startsWith("/") ? path : `/${path}`}`;
  return fetch(url, {
    ...init,
    headers: {
      ...billitHeaders(creds),
      ...(init?.headers ?? {}),
    },
  });
}

export type BillitInboxItem = {
  InboxItemID: number;
  SenderPeppolID?: string;
  PeppolDocumentType?: string;
  ReceiverPeppolID?: string;
  ReceiverCompanyID?: string;
  CreationDate?: string;
  PeppolFileID?: string;
};

export type BillitFileResponse = {
  FileID?: string;
  FileName?: string;
  MimeType?: string;
  FileContent?: string;
};

export async function fetchBillitInbox(creds: BillitCredentials) {
  const res = await billitFetch(creds, "/v1/peppol/inbox");
  const json = (await res.json().catch(() => ({}))) as {
    InboxItems?: BillitInboxItem[];
    Message?: string;
    message?: string;
  };
  if (!res.ok) {
    const detail = json.Message ?? json.message ?? `HTTP ${res.status}`;
    return { ok: false as const, error: `Billit inbox: ${detail}` };
  }
  return { ok: true as const, items: json.InboxItems ?? [] };
}

export async function fetchBillitFile(creds: BillitCredentials, fileId: string) {
  const res = await billitFetch(creds, `/v1/files/${encodeURIComponent(fileId)}`);
  const json = (await res.json().catch(() => ({}))) as BillitFileResponse & {
    Message?: string;
    message?: string;
  };
  if (!res.ok) {
    const detail = json.Message ?? json.message ?? `HTTP ${res.status}`;
    return { ok: false as const, error: `Billit bestand: ${detail}` };
  }
  if (!json.FileContent) {
    return { ok: false as const, error: "Billit: leeg bestand ontvangen." };
  }
  const xml = Buffer.from(json.FileContent, "base64").toString("utf8");
  return {
    ok: true as const,
    xml,
    fileName: json.FileName ?? `${fileId}.xml`,
    mimeType: json.MimeType ?? "text/xml",
  };
}

export async function confirmBillitInboxItem(
  creds: BillitCredentials,
  inboxItemId: string | number,
) {
  const res = await billitFetch(
    creds,
    `/v1/peppol/inbox/${encodeURIComponent(String(inboxItemId))}/confirm`,
    { method: "POST" },
  );
  if (!res.ok) {
    const json = (await res.json().catch(() => ({}))) as {
      Message?: string;
      message?: string;
    };
    const detail = json.Message ?? json.message ?? `HTTP ${res.status}`;
    return { ok: false as const, error: `Billit bevestigen: ${detail}` };
  }
  return { ok: true as const };
}

export type BillitOrderPayload = Record<string, unknown>;

export async function testBillitCredentials(creds: BillitCredentials) {
  const lookupId = encodeURIComponent("9925:BE0123456789");
  const res = await billitFetch(creds, `/v1/peppol/participantInformation/${lookupId}`);
  if (res.status === 401 || res.status === 403) {
    return {
      ok: false as const,
      error: "Billit: Party ID of API-sleutel ongeldig.",
    };
  }
  if (!res.ok) {
    return {
      ok: false as const,
      error: `Billit: verbinding mislukt (HTTP ${res.status}).`,
    };
  }
  const env = creds.sandbox ? "sandbox" : "productie";
  return {
    ok: true as const,
    message: `Billit-verbinding werkt (${env}).`,
  };
}

export async function createBillitOrder(
  creds: BillitCredentials,
  order: BillitOrderPayload,
) {
  const res = await billitFetch(creds, "/v1/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(order),
  });
  const json = (await res.json().catch(() => ({}))) as
    | number
    | { OrderID?: number; orderID?: number; errors?: { Description?: string }[]; Message?: string; message?: string };

  if (!res.ok) {
    if (typeof json === "object" && json !== null && "errors" in json && Array.isArray(json.errors)) {
      const first = json.errors[0]?.Description;
      return { ok: false as const, error: first ?? `Billit order: HTTP ${res.status}` };
    }
    const detail =
      typeof json === "object" && json !== null
        ? (json.Message ?? json.message ?? `HTTP ${res.status}`)
        : `HTTP ${res.status}`;
    return { ok: false as const, error: `Billit order: ${detail}` };
  }

  const orderId =
    typeof json === "number"
      ? json
      : Number(json.OrderID ?? json.orderID ?? 0);

  if (!orderId) {
    return { ok: false as const, error: "Billit: geen OrderID ontvangen." };
  }
  return { ok: true as const, orderId: String(orderId) };
}
