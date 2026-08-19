import { downloadCsv } from "@/lib/csv";
import type { KlantRecord } from "@/components/dashboard/contacten/KlantForm";
import type { OfferteListRow } from "@/components/dashboard/offertes/OffertesView";
import type { FactuurListItem } from "@/components/dashboard/facturen/FacturenDataTable";

export function exportKlantenCsv(klanten: KlantRecord[]) {
  downloadCsv(
    `contacten-${new Date().toISOString().slice(0, 10)}.csv`,
    [
      "Naam",
      "Bedrijf",
      "E-mail",
      "Telefoon",
      "Postcode",
      "Stad",
      "BTW",
      "KBO",
      "Peppol",
    ],
    klanten.map((klant) => [
      klant.name,
      klant.company_name ?? "",
      klant.email ?? "",
      klant.phone ?? "",
      klant.postcode ?? "",
      klant.city ?? "",
      klant.btw ?? "",
      klant.ondernemingsnummer ?? "",
      klant.peppol_participant_id ?? "",
    ]),
  );
}

export function exportOffertesCsv(offertes: OfferteListRow[]) {
  downloadCsv(
    `offertes-${new Date().toISOString().slice(0, 10)}.csv`,
    ["Nummer", "Klant", "E-mail", "Datum", "Geldig tot", "Bedrag", "Status"],
    offertes.map((offerte) => [
      offerte.nummer ?? `#${offerte.id}`,
      offerte.klant ?? "",
      offerte.email ?? "",
      offerte.datum ?? "",
      offerte.geldig_tot ?? "",
      offerte.bedrag ?? "",
      offerte.status_new ?? "",
    ]),
  );
}

export function exportFacturenCsv(facturen: FactuurListItem[]) {
  downloadCsv(
    `facturen-${new Date().toISOString().slice(0, 10)}.csv`,
    [
      "Nummer",
      "Type",
      "Klant",
      "E-mail",
      "Datum",
      "Vervaldatum",
      "Bedrag",
      "Status",
    ],
    facturen.map((factuur) => [
      factuur.nummer ?? `#${factuur.id}`,
      factuur.document_type ?? "",
      factuur.klant ?? "",
      factuur.email ?? "",
      factuur.datum ?? "",
      factuur.vervaldatum ?? "",
      factuur.totaal_bedrag ?? "",
      factuur.status ?? "",
    ]),
  );
}
