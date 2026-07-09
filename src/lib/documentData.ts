import { formatEuro, formatDate, lineTotals } from "@/lib/offertes";
import type { DocumentRow } from "@/components/dashboard/documenten/documentTemplate";

export type BedrijfLite = {
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
};

export type CustomerLite = {
  name: string | null;
  company_name: string | null;
  first_name: string | null;
  last_name: string | null;
  address: string | null;
  email: string | null;
  phone: string | null;
  btw: string | null;
} | null;

export type DocLineLite = {
  omschrijving: string;
  aantal: number;
  eenheid: string;
  prijs_per_eenheid: number;
  btw_percentage: number;
};

export type DocumentMeta =
  | {
      kind: "quote";
      nummer: string;
      datum: string | null;
      geldig_tot: string | null;
      notes: string | null;
      klant: string | null;
    }
  | {
      kind: "invoice";
      nummer: string;
      datum: string | null;
      vervaldatum: string | null;
      omschrijving: string | null;
      klant: string | null;
      isProforma: boolean;
    };

function fullName(c: NonNullable<CustomerLite>): string {
  return [c.first_name, c.last_name].filter(Boolean).join(" ").trim();
}

function bedrijfValues(bedrijf: BedrijfLite | null): Record<string, string> {
  return {
    bedrijf_naam: bedrijf?.naam ?? "",
    bedrijf_adres: bedrijf?.adres ?? "",
    bedrijf_postcode_gemeente: [bedrijf?.postcode, bedrijf?.stad]
      .filter(Boolean)
      .join(" "),
    bedrijf_btw: bedrijf?.btw ?? "",
    bedrijf_email: bedrijf?.email ?? "",
    bedrijf_telefoon: bedrijf?.telefoon ?? "",
    iban: bedrijf?.iban ?? "",
  };
}

function klantValues(
  customer: CustomerLite,
  fallbackNaam: string | null,
): Record<string, string> {
  const naam =
    customer?.company_name?.trim() ||
    customer?.name?.trim() ||
    (customer ? fullName(customer) : "") ||
    fallbackNaam ||
    "";
  const contactpersoon =
    customer?.company_name && customer
      ? fullName(customer)
      : "";
  return {
    klant_naam: naam,
    klant_adres: customer?.address ?? "",
    klant_postcode_gemeente: "",
    klant_email: customer?.email ?? "",
    klant_telefoon: customer?.phone ?? "",
    klant_btw: customer?.btw ?? "",
    klant_contactpersoon: contactpersoon,
  };
}

export function buildDocumentRows(lines: DocLineLite[]): DocumentRow[] {
  return lines.map((l) => ({
    omschrijving: l.omschrijving,
    aantal: String(l.aantal),
    eenheid: l.eenheid,
    eenheidsprijs: formatEuro(l.prijs_per_eenheid),
    regel_totaal: formatEuro(l.aantal * l.prijs_per_eenheid),
  }));
}

/** Bouwt alle placeholder-waarden voor één offerte of factuur. */
export function buildDocumentValues(
  doc: DocumentMeta,
  bedrijf: BedrijfLite | null,
  customer: CustomerLite,
  lines: DocLineLite[],
): Record<string, string> {
  const totals = lineTotals(lines);
  const btwTarieven = Array.from(new Set(lines.map((l) => l.btw_percentage)));
  const voorwaarden =
    bedrijf?.algemene_voorwaarden ?? bedrijf?.footer_tekst ?? "";

  const base: Record<string, string> = {
    ...bedrijfValues(bedrijf),
    ...klantValues(customer, doc.klant),
    subtotaal: formatEuro(totals.subtotaal),
    btw_bedrag: formatEuro(totals.btw),
    totaal: formatEuro(totals.totaal),
    btw_tarief: btwTarieven.length === 1 ? `${btwTarieven[0]}%` : "",
  };

  if (doc.kind === "quote") {
    return {
      ...base,
      offerte_nummer: doc.nummer,
      offerte_datum: formatDate(doc.datum),
      geldig_tot: formatDate(doc.geldig_tot),
      project_omschrijving: doc.notes ?? "",
      offerte_voorwaarden: voorwaarden,
    };
  }

  return {
    ...base,
    factuur_nummer: doc.nummer,
    factuur_datum: formatDate(doc.datum),
    vervaldatum: doc.isProforma ? "—" : formatDate(doc.vervaldatum),
    project_omschrijving: doc.omschrijving ?? "",
    factuur_voorwaarden: voorwaarden,
  };
}
