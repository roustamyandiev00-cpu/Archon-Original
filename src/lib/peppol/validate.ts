import type { UblInvoice } from "@/lib/peppol/ubl";
import {
  isValidStructuredCommunication,
  normalizeBelgianVat,
  peppolEndpointFromParty,
} from "@/lib/peppol/be";

export type PeppolValidationIssue = {
  field: string;
  message: string;
  severity: "error" | "warning";
};

export type PeppolReadiness = {
  ok: boolean;
  issues: PeppolValidationIssue[];
};

function err(field: string, message: string): PeppolValidationIssue {
  return { field, message, severity: "error" };
}

function warn(field: string, message: string): PeppolValidationIssue {
  return { field, message, severity: "warning" };
}

/** Controleer of een factuur voldoet aan verplichte Peppol BIS 3.0 / BE-velden. */
export function validatePeppolInvoice(
  inv: UblInvoice,
  opts?: {
    isCreditNote?: boolean;
    structuredCommunication?: string | null;
  },
): PeppolReadiness {
  const issues: PeppolValidationIssue[] = [];

  if (!inv.id?.trim()) issues.push(err("nummer", "Factuurnummer ontbreekt."));
  if (!inv.issueDate) issues.push(err("datum", "Factuurdatum ontbreekt."));

  if (!inv.supplier.name?.trim()) {
    issues.push(err("leverancier", "Bedrijfsnaam leverancier ontbreekt."));
  }
  if (!inv.supplier.address?.trim() || !inv.supplier.postalZone?.trim() || !inv.supplier.city?.trim()) {
    issues.push(
      err("leverancier_adres", "Volledig adres leverancier is verplicht (straat, postcode, stad)."),
    );
  }
  const supplierEp = peppolEndpointFromParty({
    peppolParticipantId:
      inv.supplier.endpointScheme && inv.supplier.endpointValue
        ? `${inv.supplier.endpointScheme}:${inv.supplier.endpointValue}`
        : null,
    kbo: inv.supplier.endpointScheme === "0208" ? inv.supplier.endpointValue : null,
    vat: inv.supplier.vat,
  });
  if (!supplierEp) {
    issues.push(
      err(
        "leverancier_peppol",
        "Peppol-identificatie leverancier ontbreekt (KBO of BTW in Instellingen).",
      ),
    );
  }
  if (!normalizeBelgianVat(inv.supplier.vat)) {
    issues.push(err("leverancier_btw", "Geldig Belgisch BTW-nummer leverancier is verplicht."));
  }
  if (!inv.iban?.trim()) {
    issues.push(warn("iban", "IBAN ontbreekt — betalingsgegevens worden niet meegestuurd."));
  }

  if (!inv.customer.name?.trim()) {
    issues.push(err("klant", "Klantnaam ontbreekt."));
  }
  if (!inv.customer.address?.trim()) {
    issues.push(warn("klant_adres", "Klantadres ontbreekt — aanbevolen voor EN16931."));
  }
  const buyerEp = peppolEndpointFromParty({
    peppolParticipantId:
      inv.customer.endpointScheme && inv.customer.endpointValue
        ? `${inv.customer.endpointScheme}:${inv.customer.endpointValue}`
        : null,
    kbo: inv.customer.endpointScheme === "0208" ? inv.customer.endpointValue : null,
    vat: inv.customer.vat,
  });
  if (!buyerEp && !normalizeBelgianVat(inv.customer.vat)) {
    issues.push(
      err(
        "klant_peppol",
        "Koper heeft geen Peppol-ID of BTW-nummer — routering via Peppol is onmogelijk.",
      ),
    );
  }

  if (!inv.buyerReference?.trim()) {
    issues.push(
      err(
        "buyer_reference",
        "Kopersreferentie (BT-10) is verplicht in België. Vul orderref / PO in op de factuur.",
      ),
    );
  }

  if (!inv.dueDate && !opts?.isCreditNote) {
    issues.push(warn("vervaldatum", "Vervaldatum ontbreekt."));
  }

  const validLines = inv.lines.filter(
    (l) => l.name.trim() && Number(l.quantity) > 0,
  );
  if (validLines.length === 0) {
    issues.push(err("lijnen", "Minstens één factuurlijn met omschrijving en aantal is verplicht."));
  }

  const sc = opts?.structuredCommunication;
  if (sc && !isValidStructuredCommunication(sc)) {
    issues.push(
      warn(
        "structured_communication",
        "Gestructureerde mededeling heeft geen geldig formaat (+++000/0000/00000+++).",
      ),
    );
  }

  return {
    ok: issues.every((i) => i.severity !== "error"),
    issues,
  };
}
