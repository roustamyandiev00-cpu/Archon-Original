import type { BedrijfLite } from "@/lib/documentData";
import type { OfferteLijnInput } from "@/lib/offertes";

export interface StudioInvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface StudioInvoiceTaxOption {
  id: string;
  name: string;
  rate: number;
}

export type StudioInvoiceDiscountType = "fixed" | "percent";

export const STUDIO_INVOICE_PAPER_WIDTH = 816;
export const STUDIO_INVOICE_PAPER_HEIGHT = 1056;
export const STUDIO_INVOICE_PAPER_SCALE = 0.6;

export interface StudioInvoiceFromDetails {
  name: string;
  email: string;
  phone: string;
  website: string;
  addressLines: string[];
  taxId: string;
  paymentAccountName: string;
  routingNumber: string;
  issuerName: string;
}

export interface StudioInvoiceToDetails {
  id: string;
  name: string;
  email: string;
  addressLines: string[];
  taxId: string;
}

export interface StudioInvoiceFormValues {
  referenceNumber: string;
  issuedDate: string;
  paymentDueDate: string;
  from: StudioInvoiceFromDetails;
  to: StudioInvoiceToDetails;
  taxId: string;
  discountType: StudioInvoiceDiscountType;
  discountValue: number;
  items: StudioInvoiceLineItem[];
}

export const studioInvoiceTaxOptions: StudioInvoiceTaxOption[] = [
  { id: "gst", name: "GST", rate: 18 },
  { id: "vat", name: "VAT", rate: 12 },
  { id: "service-tax", name: "Service Tax", rate: 10 },
  { id: "none", name: "No Tax", rate: 0 },
];

export const studioInvoiceClients: StudioInvoiceToDetails[] = [
  {
    id: "bright-enterprises",
    name: "Bright Enterprises",
    email: "billing@brightenterprises.com",
    addressLines: [
      "450 Park Avenue South",
      "New York, NY 10016",
      "United States",
    ],
    taxId: "US-EIN-84-2938475",
  },
  {
    id: "aiy-cap",
    name: "AIY Cap",
    email: "finance@aiycap.com",
    addressLines: [
      "One BKC, Bandra Kurla Complex",
      "Mumbai, Maharashtra 400051",
    ],
    taxId: "GSTIN-27AAICA9102K1Z7",
  },
  {
    id: "northline-gmbh",
    name: "Northline GmbH",
    email: "ap@northline.de",
    addressLines: ["Kastanienallee 32", "10435 Berlin", "Germany"],
    taxId: "DE-VAT-219384756",
  },
];

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function plusDaysIso(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export const studioDefaultFrom: StudioInvoiceFromDetails = {
  name: "Weblabs Studio",
  email: "hello@weblabs.studio",
  phone: "+1-512-555-0184",
  website: "weblabs.studio",
  addressLines: ["214 Pixel Avenue", "Austin, TX 78701"],
  taxId: "WS-1029384756",
  paymentAccountName: "Mercury Business",
  routingNumber: "084009519",
  issuerName: "Arham Khan",
};

export const studioDefaultInvoiceValues: StudioInvoiceFormValues = {
  referenceNumber: "FL-0425",
  issuedDate: todayIso(),
  paymentDueDate: plusDaysIso(14),
  from: studioDefaultFrom,
  to: studioInvoiceClients[1],
  taxId: "vat",
  discountType: "fixed",
  discountValue: 40,
  items: [
    {
      id: "hosting",
      description: "Cloud hosting services",
      quantity: 1,
      unitPrice: 3500,
    },
    {
      id: "analytics",
      description: "Data analytics report",
      quantity: 2,
      unitPrice: 750,
    },
    {
      id: "support",
      description: "Technical support retainer",
      quantity: 1,
      unitPrice: 400,
    },
  ],
};

export function studioTaxIdFromRate(rate: number) {
  return (
    studioInvoiceTaxOptions.find((option) => option.rate === rate)?.id ?? "vat"
  );
}

export function studioRateFromTaxId(taxId: string) {
  return (
    studioInvoiceTaxOptions.find((option) => option.id === taxId)?.rate ?? 12
  );
}

export function getStudioLineAmount(item?: StudioInvoiceLineItem) {
  if (!item) return 0;
  const quantity = Number.isFinite(item.quantity) ? item.quantity : 0;
  const unitPrice = Number.isFinite(item.unitPrice) ? item.unitPrice : 0;
  return quantity * unitPrice;
}

export function getStudioInvoiceSubtotal(invoice: StudioInvoiceFormValues) {
  return invoice.items.reduce(
    (subtotal, item) => subtotal + getStudioLineAmount(item),
    0,
  );
}

export function getStudioInvoiceTaxOption(invoice: StudioInvoiceFormValues) {
  return (
    studioInvoiceTaxOptions.find((option) => option.id === invoice.taxId) ??
    studioInvoiceTaxOptions[0]
  );
}

export function getStudioInvoiceDiscount(invoice: StudioInvoiceFormValues) {
  const subtotal = getStudioInvoiceSubtotal(invoice);
  const discountValue = Number.isFinite(invoice.discountValue)
    ? invoice.discountValue
    : 0;
  const discount =
    invoice.discountType === "percent"
      ? subtotal * (discountValue / 100)
      : discountValue;
  return Math.min(Math.max(discount, 0), subtotal);
}

export function getStudioInvoiceTax(invoice: StudioInvoiceFormValues) {
  const taxRate = getStudioInvoiceTaxOption(invoice).rate;
  return (
    Math.max(getStudioInvoiceSubtotal(invoice) - getStudioInvoiceDiscount(invoice), 0) *
    (taxRate / 100)
  );
}

export function getStudioInvoiceTotal(invoice: StudioInvoiceFormValues) {
  return (
    Math.max(getStudioInvoiceSubtotal(invoice) - getStudioInvoiceDiscount(invoice), 0) +
    getStudioInvoiceTax(invoice)
  );
}

export function formatStudioCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);
}

export function formatStudioDisplayDate(iso: string) {
  if (!iso) return "Pick a date";
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(new Date(iso + "T12:00:00"));
  } catch {
    return iso;
  }
}

export function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function mapBedrijfToFrom(bedrijf: BedrijfLite): StudioInvoiceFromDetails {
  const addressLines = [bedrijf.adres, [bedrijf.postcode, bedrijf.stad].filter(Boolean).join(" ")]
    .map((line) => line?.trim())
    .filter(Boolean) as string[];

  return {
    name: bedrijf.naam || studioDefaultFrom.name,
    email: bedrijf.email || studioDefaultFrom.email,
    phone: bedrijf.telefoon || studioDefaultFrom.phone,
    website: studioDefaultFrom.website,
    addressLines: addressLines.length > 0 ? addressLines : studioDefaultFrom.addressLines,
    taxId: bedrijf.btw || studioDefaultFrom.taxId,
    paymentAccountName: bedrijf.naam || studioDefaultFrom.paymentAccountName,
    routingNumber: bedrijf.iban || studioDefaultFrom.routingNumber,
    issuerName: studioDefaultFrom.issuerName,
  };
}

type BuildStudioInvoiceInput = {
  reference: string;
  datum: string;
  vervaldatum: string;
  bedrijf: BedrijfLite;
  klantNaam: string;
  klantEmail: string;
  klantAddress?: string[];
  klantTaxId?: string;
  taxId: string;
  discountType: StudioInvoiceDiscountType;
  discountValue: number;
  lines: OfferteLijnInput[];
  useStudioDemoFrom?: boolean;
};

export function buildStudioInvoiceValues(
  input: BuildStudioInvoiceInput,
): StudioInvoiceFormValues {
  const items = input.lines.map((line, index) => ({
    id: `line-${index}`,
    description: line.omschrijving,
    quantity: Number(line.aantal) || 0,
    unitPrice: Number(line.prijs_per_eenheid) || 0,
  }));

  const matchedClient =
    studioInvoiceClients.find(
      (client) => client.name.toLowerCase() === input.klantNaam.toLowerCase(),
    ) ??
    ({
      id: "custom",
      name: input.klantNaam || "Client",
      email: input.klantEmail || "",
      addressLines: input.klantAddress?.length
        ? input.klantAddress
        : ["Address not provided"],
      taxId: input.klantTaxId || "—",
    } satisfies StudioInvoiceToDetails);

  return {
    referenceNumber: input.reference,
    issuedDate: input.datum,
    paymentDueDate: input.vervaldatum,
    from: input.useStudioDemoFrom ? studioDefaultFrom : mapBedrijfToFrom(input.bedrijf),
    to: matchedClient,
    taxId: input.taxId,
    discountType: input.discountType,
    discountValue: input.discountValue,
    items,
  };
}
