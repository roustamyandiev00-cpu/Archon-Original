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

/** Belgische BTW-tarieven */
export const studioInvoiceTaxOptions: StudioInvoiceTaxOption[] = [
  { id: "btw-21", name: "BTW", rate: 21 },
  { id: "btw-12", name: "BTW", rate: 12 },
  { id: "btw-6", name: "BTW", rate: 6 },
  { id: "btw-0", name: "Geen BTW", rate: 0 },
];

/** Demo-klanten alleen voor isDemo-modus */
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
  taxId: "btw-21",
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
    studioInvoiceTaxOptions.find((option) => option.rate === rate)?.id ??
    "btw-21"
  );
}

export function studioRateFromTaxId(taxId: string) {
  return (
    studioInvoiceTaxOptions.find((option) => option.id === taxId)?.rate ?? 21
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
    Math.max(
      getStudioInvoiceSubtotal(invoice) - getStudioInvoiceDiscount(invoice),
      0,
    ) *
    (taxRate / 100)
  );
}

export function getStudioInvoiceTotal(invoice: StudioInvoiceFormValues) {
  return (
    Math.max(
      getStudioInvoiceSubtotal(invoice) - getStudioInvoiceDiscount(invoice),
      0,
    ) + getStudioInvoiceTax(invoice)
  );
}

export function formatStudioCurrency(value: number) {
  return new Intl.NumberFormat("nl-BE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);
}

export function formatStudioDisplayDate(iso: string) {
  if (!iso) return "Kies een datum";
  try {
    return new Intl.DateTimeFormat("nl-BE", {
      day: "numeric",
      month: "long",
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

export function customerDisplayName(c: {
  name?: string | null;
  company_name?: string | null;
}) {
  return (c.company_name || c.name || "").trim();
}

function mapBedrijfToFrom(bedrijf: BedrijfLite): StudioInvoiceFromDetails {
  const addressLines = [
    bedrijf.adres,
    [bedrijf.postcode, bedrijf.stad].filter(Boolean).join(" "),
  ]
    .map((line) => line?.trim())
    .filter(Boolean) as string[];

  return {
    name: bedrijf.naam || "Jouw bedrijf",
    email: bedrijf.email || "",
    phone: bedrijf.telefoon || "",
    website: "",
    addressLines:
      addressLines.length > 0 ? addressLines : ["Adres niet ingesteld"],
    taxId: bedrijf.btw || "—",
    paymentAccountName: bedrijf.naam || "Rekening",
    routingNumber: bedrijf.iban || "—",
    issuerName: bedrijf.naam || "",
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
    description: line.omschrijving || "—",
    quantity: Number(line.aantal) || 0,
    unitPrice: Number(line.prijs_per_eenheid) || 0,
  }));

  const matchedDemo =
    input.useStudioDemoFrom
      ? studioInvoiceClients.find(
          (client) =>
            client.name.toLowerCase() === input.klantNaam.toLowerCase(),
        )
      : undefined;

  const to: StudioInvoiceToDetails =
    matchedDemo ??
    ({
      id: "custom",
      name: input.klantNaam || "Klant",
      email: input.klantEmail || "",
      addressLines: input.klantAddress?.length
        ? input.klantAddress
        : ["Adres niet opgegeven"],
      taxId: input.klantTaxId || "—",
    } satisfies StudioInvoiceToDetails);

  return {
    referenceNumber: input.reference || "Concept",
    issuedDate: input.datum,
    paymentDueDate: input.vervaldatum,
    from: input.useStudioDemoFrom
      ? studioDefaultFrom
      : mapBedrijfToFrom(input.bedrijf),
    to,
    taxId: input.taxId,
    discountType: input.discountType,
    discountValue: input.discountValue,
    items,
  };
}
