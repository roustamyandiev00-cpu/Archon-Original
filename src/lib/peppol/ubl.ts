/**
 * Genereert een Peppol BIS Billing 3.0 (EN16931) UBL-factuur.
 * Dit is exact het XML-formaat dat over het Peppol-netwerk verstuurd wordt;
 * de XML kan gedownload en via elk access point verzonden worden.
 */

export type UblParty = {
  name: string;
  vat?: string | null;
  address?: string | null;
  city?: string | null;
  postalZone?: string | null;
  country?: string | null; // ISO 3166-1 alpha-2, default BE
  endpointScheme?: string | null; // bv. 0208 (KBO) of 9925 (BE btw)
  endpointValue?: string | null;
};

export type UblLine = {
  name: string;
  quantity: number;
  unitCode?: string;
  unitPrice: number;
  vatPercent: number;
};

export type UblInvoice = {
  id: string;
  issueDate: string; // YYYY-MM-DD
  dueDate?: string | null;
  currency?: string; // default EUR
  supplier: UblParty;
  customer: UblParty;
  iban?: string | null;
  note?: string | null;
  lines: UblLine[];
};

const CUSTOMIZATION_ID =
  "urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0";
const PROFILE_ID = "urn:fdc:peppol.eu:2017:poacc:billing:01:1.0";

function esc(v: string | number | null | undefined): string {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function money(n: number): string {
  return (Math.round((n + Number.EPSILON) * 100) / 100).toFixed(2);
}

function isoDate(v: string | null | undefined): string {
  if (!v) return new Date().toISOString().slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}/.test(v)) return v.slice(0, 10);
  const d = new Date(v);
  return Number.isNaN(d.getTime())
    ? new Date().toISOString().slice(0, 10)
    : d.toISOString().slice(0, 10);
}

/** Zet een eenheid om naar een UN/ECE Rec 20-code (default stuks C62). */
export function unitCode(eenheid: string | null | undefined): string {
  const e = (eenheid ?? "").toLowerCase().trim();
  const map: Record<string, string> = {
    stuk: "C62",
    stuks: "C62",
    stk: "C62",
    post: "C62",
    uur: "HUR",
    uren: "HUR",
    u: "HUR",
    dag: "DAY",
    dagen: "DAY",
    m: "MTR",
    meter: "MTR",
    lm: "MTR",
    "m2": "MTK",
    "m²": "MTK",
    "m3": "MTQ",
    "m³": "MTQ",
    kg: "KGM",
    l: "LTR",
    liter: "LTR",
  };
  return map[e] ?? "C62";
}

function party(tag: string, p: UblParty): string {
  const country = (p.country || "BE").toUpperCase();
  const endpointScheme = p.endpointScheme || (p.vat ? "9925" : null);
  const endpointValue = p.endpointValue || p.vat || null;
  const lines: string[] = [`    <cac:${tag}>`, `      <cac:Party>`];
  if (endpointScheme && endpointValue) {
    lines.push(
      `        <cbc:EndpointID schemeID="${esc(endpointScheme)}">${esc(endpointValue)}</cbc:EndpointID>`,
    );
  }
  lines.push(
    `        <cac:PartyName><cbc:Name>${esc(p.name)}</cbc:Name></cac:PartyName>`,
    `        <cac:PostalAddress>`,
    `          <cbc:StreetName>${esc(p.address || "")}</cbc:StreetName>`,
    `          <cbc:CityName>${esc(p.city || "")}</cbc:CityName>`,
    `          <cbc:PostalZone>${esc(p.postalZone || "")}</cbc:PostalZone>`,
    `          <cac:Country><cbc:IdentificationCode>${esc(country)}</cbc:IdentificationCode></cac:Country>`,
    `        </cac:PostalAddress>`,
  );
  if (p.vat) {
    lines.push(
      `        <cac:PartyTaxScheme>`,
      `          <cbc:CompanyID>${esc(p.vat)}</cbc:CompanyID>`,
      `          <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>`,
      `        </cac:PartyTaxScheme>`,
    );
  }
  lines.push(
    `        <cac:PartyLegalEntity>`,
    `          <cbc:RegistrationName>${esc(p.name)}</cbc:RegistrationName>`,
    p.vat ? `          <cbc:CompanyID>${esc(p.vat)}</cbc:CompanyID>` : "",
    `        </cac:PartyLegalEntity>`,
    `      </cac:Party>`,
    `    </cac:${tag}>`,
  );
  return lines.filter(Boolean).join("\n");
}

export function buildInvoiceUBL(inv: UblInvoice): string {
  const currency = inv.currency || "EUR";
  const lines = inv.lines.length
    ? inv.lines
    : [{ name: "", quantity: 0, unitPrice: 0, vatPercent: 0 }];

  // Bedragen per regel + btw-groepering.
  const byRate = new Map<number, { taxable: number }>();
  let lineExtensionTotal = 0;
  const lineXml = lines
    .map((l, i) => {
      const ext = (Number(l.quantity) || 0) * (Number(l.unitPrice) || 0);
      lineExtensionTotal += ext;
      const rate = Number(l.vatPercent) || 0;
      byRate.set(rate, { taxable: (byRate.get(rate)?.taxable ?? 0) + ext });
      return [
        `  <cac:InvoiceLine>`,
        `    <cbc:ID>${i + 1}</cbc:ID>`,
        `    <cbc:InvoicedQuantity unitCode="${esc(unitCode(l.unitCode))}">${money(Number(l.quantity) || 0)}</cbc:InvoicedQuantity>`,
        `    <cbc:LineExtensionAmount currencyID="${currency}">${money(ext)}</cbc:LineExtensionAmount>`,
        `    <cac:Item>`,
        `      <cbc:Name>${esc(l.name || "Artikel")}</cbc:Name>`,
        `      <cac:ClassifiedTaxCategory>`,
        `        <cbc:ID>${rate > 0 ? "S" : "Z"}</cbc:ID>`,
        `        <cbc:Percent>${money(rate)}</cbc:Percent>`,
        `        <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>`,
        `      </cac:ClassifiedTaxCategory>`,
        `    </cac:Item>`,
        `    <cac:Price>`,
        `      <cbc:PriceAmount currencyID="${currency}">${money(Number(l.unitPrice) || 0)}</cbc:PriceAmount>`,
        `    </cac:Price>`,
        `  </cac:InvoiceLine>`,
      ].join("\n");
    })
    .join("\n");

  let taxTotal = 0;
  const subtotals = Array.from(byRate.entries())
    .map(([rate, { taxable }]) => {
      const tax = taxable * (rate / 100);
      taxTotal += tax;
      return [
        `    <cac:TaxSubtotal>`,
        `      <cbc:TaxableAmount currencyID="${currency}">${money(taxable)}</cbc:TaxableAmount>`,
        `      <cbc:TaxAmount currencyID="${currency}">${money(tax)}</cbc:TaxAmount>`,
        `      <cac:TaxCategory>`,
        `        <cbc:ID>${rate > 0 ? "S" : "Z"}</cbc:ID>`,
        `        <cbc:Percent>${money(rate)}</cbc:Percent>`,
        `        <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>`,
        `      </cac:TaxCategory>`,
        `    </cac:TaxSubtotal>`,
      ].join("\n");
    })
    .join("\n");

  const taxExclusive = lineExtensionTotal;
  const taxInclusive = taxExclusive + taxTotal;

  const paymentMeans = inv.iban
    ? [
        `  <cac:PaymentMeans>`,
        `    <cbc:PaymentMeansCode>30</cbc:PaymentMeansCode>`,
        `    <cac:PayeeFinancialAccount>`,
        `      <cbc:ID>${esc(inv.iban.replace(/\s+/g, ""))}</cbc:ID>`,
        `    </cac:PayeeFinancialAccount>`,
        `  </cac:PaymentMeans>`,
      ].join("\n")
    : "";

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"`,
    `  xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"`,
    `  xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">`,
    `  <cbc:CustomizationID>${CUSTOMIZATION_ID}</cbc:CustomizationID>`,
    `  <cbc:ProfileID>${PROFILE_ID}</cbc:ProfileID>`,
    `  <cbc:ID>${esc(inv.id)}</cbc:ID>`,
    `  <cbc:IssueDate>${isoDate(inv.issueDate)}</cbc:IssueDate>`,
    inv.dueDate ? `  <cbc:DueDate>${isoDate(inv.dueDate)}</cbc:DueDate>` : "",
    `  <cbc:InvoiceTypeCode>380</cbc:InvoiceTypeCode>`,
    inv.note ? `  <cbc:Note>${esc(inv.note)}</cbc:Note>` : "",
    `  <cbc:DocumentCurrencyCode>${currency}</cbc:DocumentCurrencyCode>`,
    party("AccountingSupplierParty", inv.supplier),
    party("AccountingCustomerParty", inv.customer),
    paymentMeans,
    `  <cac:TaxTotal>`,
    `    <cbc:TaxAmount currencyID="${currency}">${money(taxTotal)}</cbc:TaxAmount>`,
    subtotals,
    `  </cac:TaxTotal>`,
    `  <cac:LegalMonetaryTotal>`,
    `    <cbc:LineExtensionAmount currencyID="${currency}">${money(lineExtensionTotal)}</cbc:LineExtensionAmount>`,
    `    <cbc:TaxExclusiveAmount currencyID="${currency}">${money(taxExclusive)}</cbc:TaxExclusiveAmount>`,
    `    <cbc:TaxInclusiveAmount currencyID="${currency}">${money(taxInclusive)}</cbc:TaxInclusiveAmount>`,
    `    <cbc:PayableAmount currencyID="${currency}">${money(taxInclusive)}</cbc:PayableAmount>`,
    `  </cac:LegalMonetaryTotal>`,
    lineXml,
    `</Invoice>`,
  ]
    .filter((l) => l !== "")
    .join("\n");
}
