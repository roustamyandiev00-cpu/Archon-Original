export type InboundUblSummary = {
  documentType: "invoice" | "creditnote" | "unknown";
  invoiceNumber: string | null;
  supplierName: string | null;
  totalAmount: number | null;
  currency: string;
  issueDate: string | null;
};

function firstMatch(xml: string, pattern: RegExp): string | null {
  const m = xml.match(pattern);
  return m?.[1]?.trim() ?? null;
}

function section(xml: string, tag: string): string | null {
  const re = new RegExp(
    `<(?:\\w+:)?${tag}[^>]*>([\\s\\S]*?)</(?:\\w+:)?${tag}>`,
    "i",
  );
  return xml.match(re)?.[1] ?? null;
}

function tagIn(block: string, tag: string): string | null {
  return firstMatch(block, new RegExp(`<(?:\\w+:)?${tag}[^>]*>([^<]*)</(?:\\w+:)?${tag}>`, "i"));
}

/** Parseert kernvelden uit een inkomende UBL (factuur of creditnota). */
export function parseInboundUbl(xml: string): InboundUblSummary {
  const isCredit =
    /<(?:\w+:)?CreditNote[\s>]/i.test(xml) ||
    xml.includes("CreditNote-2");
  const documentType: InboundUblSummary["documentType"] = isCredit
    ? "creditnote"
    : /<(?:\w+:)?Invoice[\s>]/i.test(xml)
      ? "invoice"
      : "unknown";

  const supplierBlock = section(xml, "AccountingSupplierParty") ?? "";
  const supplierName =
    tagIn(supplierBlock, "RegistrationName") ??
    tagIn(supplierBlock, "Name");

  const invoiceNumber =
    tagIn(xml, "ID") ??
    firstMatch(xml, /<cbc:ID[^>]*>([^<]+)<\/cbc:ID>/i);

  const issueDate = tagIn(xml, "IssueDate");

  const totalRaw =
    tagIn(xml, "TaxInclusiveAmount") ??
    tagIn(xml, "PayableAmount") ??
    tagIn(xml, "TaxExclusiveAmount");
  const totalAmount = totalRaw ? Number(totalRaw.replace(",", ".")) : null;

  const currency =
    firstMatch(xml, /currencyID="([^"]+)"/i) ??
    tagIn(xml, "DocumentCurrencyCode") ??
    "EUR";

  return {
    documentType,
    invoiceNumber,
    supplierName,
    totalAmount: Number.isFinite(totalAmount) ? totalAmount : null,
    currency,
    issueDate,
  };
}

export function classifyPeppolDocumentType(peppolDocumentType: string | undefined) {
  const value = (peppolDocumentType ?? "").toUpperCase();
  if (value === "IMR") return "imr" as const;
  if (value === "MLR") return "mlr" as const;
  if (value.includes("CREDITNOTE")) return "creditnote" as const;
  if (value.includes("INVOICE")) return "invoice" as const;
  return "unknown" as const;
}
