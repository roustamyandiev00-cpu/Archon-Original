export type ArchonFeatureStatus = "live" | "partial" | "planned" | "no";
export type BillitLicense = "free" | "paid" | "extra" | "no" | "yes";

export type BillitFeatureRow = {
  name: string;
  billitFree: BillitLicense;
  billitPaid: BillitLicense;
  archon: ArchonFeatureStatus;
  archonNote?: string;
  billitHelp?: string;
};

export type BillitFeatureCategory = {
  id: string;
  title: string;
  features: BillitFeatureRow[];
};

/** Gebaseerd op https://www.billit.eu/nl-be/functies/alle-features/ */
export const BILLIT_FEATURE_MATRIX: BillitFeatureCategory[] = [
  {
    id: "e-invoicing",
    title: "E-invoicing",
    features: [
      {
        name: "E-facturen versturen via Peppol (platform)",
        billitFree: "yes",
        billitPaid: "yes",
        archon: "live",
      },
      {
        name: "E-facturen versturen via Peppol (API)",
        billitFree: "no",
        billitPaid: "yes",
        archon: "live",
      },
      {
        name: "E-facturen ontvangen via Peppol",
        billitFree: "no",
        billitPaid: "yes",
        archon: "live",
        archonNote: "Billit access point",
      },
      {
        name: "E-facturen via Mercurius (overheid BE)",
        billitFree: "yes",
        billitPaid: "yes",
        archon: "live",
        archonNote: "Via Peppol B2G",
      },
      {
        name: "UBL BIS 3.0 / EN16931 validatie",
        billitFree: "no",
        billitPaid: "yes",
        archon: "live",
      },
    ],
  },
  {
    id: "documenten",
    title: "Documenten",
    features: [
      {
        name: "Creditnota's",
        billitFree: "no",
        billitPaid: "yes",
        archon: "partial",
        archonNote: "UBL ondersteund",
      },
      {
        name: "Offertes maken & versturen",
        billitFree: "no",
        billitPaid: "yes",
        archon: "live",
      },
      {
        name: "Klantportaal & digitale goedkeuring",
        billitFree: "no",
        billitPaid: "yes",
        archon: "live",
      },
      {
        name: "Facturen via e-mail",
        billitFree: "no",
        billitPaid: "yes",
        archon: "live",
      },
      {
        name: "Voorgemaakte templates",
        billitFree: "no",
        billitPaid: "yes",
        archon: "partial",
      },
    ],
  },
  {
    id: "automatisaties",
    title: "Automatisaties",
    features: [
      {
        name: "Bankkoppeling & betalingscontrole",
        billitFree: "no",
        billitPaid: "yes",
        archon: "partial",
        archonNote: "CSV/CAMT import + matching",
      },
      {
        name: "Automatische herinneringen",
        billitFree: "no",
        billitPaid: "yes",
        archon: "partial",
        archonNote: "Incasso-module",
      },
      {
        name: "Periodieke facturen",
        billitFree: "no",
        billitPaid: "yes",
        archon: "planned",
      },
      {
        name: "Koppeling met boekhouder",
        billitFree: "no",
        billitPaid: "yes",
        archon: "live",
        archonNote: "Billit, Yuki, Exact",
      },
      {
        name: "Documenten uit mailbox",
        billitFree: "no",
        billitPaid: "yes",
        archon: "planned",
      },
      {
        name: "Automatische Peppol-inbox sync",
        billitFree: "no",
        billitPaid: "yes",
        archon: "live",
      },
    ],
  },
  {
    id: "databeheer",
    title: "Databeheer",
    features: [
      {
        name: "Projecten groeperen",
        billitFree: "no",
        billitPaid: "yes",
        archon: "live",
      },
      {
        name: "Producten / prijslijst",
        billitFree: "no",
        billitPaid: "yes",
        archon: "partial",
      },
      {
        name: "Klanten & leveranciers + import",
        billitFree: "no",
        billitPaid: "yes",
        archon: "live",
      },
      {
        name: "Cashflowoverzicht",
        billitFree: "no",
        billitPaid: "yes",
        archon: "partial",
        archonNote: "Financiën-tab",
      },
      {
        name: "Uitgebreide rapporten",
        billitFree: "no",
        billitPaid: "yes",
        archon: "partial",
      },
      {
        name: "Multifactorauthenticatie (MFA)",
        billitFree: "yes",
        billitPaid: "yes",
        archon: "partial",
        archonNote: "Via Supabase Auth",
      },
    ],
  },
  {
    id: "extra",
    title: "Extra modules",
    features: [
      {
        name: "Mobiele app",
        billitFree: "no",
        billitPaid: "yes",
        archon: "partial",
        archonNote: "Responsive PWA",
      },
      {
        name: "BTW-aangifte",
        billitFree: "no",
        billitPaid: "yes",
        archon: "planned",
      },
      {
        name: "Grootboekrekeningen",
        billitFree: "no",
        billitPaid: "yes",
        archon: "planned",
      },
      {
        name: "Bouwnetwerk / werkposts",
        billitFree: "no",
        billitPaid: "no",
        archon: "live",
        archonNote: "Uniek voor ArchonPro",
      },
      {
        name: "AI-assistent & automatisaties",
        billitFree: "no",
        billitPaid: "no",
        archon: "live",
        archonNote: "Uniek voor ArchonPro",
      },
    ],
  },
];

export function archonStatusLabel(status: ArchonFeatureStatus) {
  switch (status) {
    case "live":
      return "Live";
    case "partial":
      return "Gedeeltelijk";
    case "planned":
      return "Gepland";
    default:
      return "Nee";
  }
}

export function billitLicenseLabel(license: BillitLicense) {
  switch (license) {
    case "yes":
      return "Ja";
    case "free":
      return "Gratis";
    case "paid":
      return "Betaald";
    case "extra":
      return "Extra";
    default:
      return "Nee";
  }
}
