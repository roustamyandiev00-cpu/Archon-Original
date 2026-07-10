import { formatEuro } from "@/lib/offertes";

export type IncassoStage =
  | "herinnering"
  | "aanmaning"
  | "ingebrekestelling"
  | "deurwaarder";

export type IncassoEmailSettings = {
  herinneringDagenNa: number;
  herinneringHerhaalDagen: number;
  herinneringMaxAantal: number;
  deurwaarderEmail: string | null;
};

export const DEFAULT_INCASSO_SETTINGS: IncassoEmailSettings = {
  herinneringDagenNa: 7,
  herinneringHerhaalDagen: 7,
  herinneringMaxAantal: 3,
  deurwaarderEmail: null,
};

export type IncassoFactuurContext = {
  id: number;
  nummer: string;
  klant: string;
  totaalBedrag: number;
  vervaldatum: string | null;
  reminderCount: number;
  structuredCommunication: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  customerAddress: string | null;
  companyName: string;
  companyEmail: string | null;
  companyIban: string | null;
  pdfUrl: string;
};

export function daysOverdue(vervaldatum: string | null): number {
  if (!vervaldatum) return 0;
  const due = new Date(`${vervaldatum}T23:59:59`);
  const diff = Date.now() - due.getTime();
  return Math.max(0, Math.floor(diff / 86_400_000));
}

export function determineIncassoStage(input: {
  vervaldatum: string | null;
  reminderCount: number;
  settings: IncassoEmailSettings;
}): IncassoStage | null {
  const overdue = daysOverdue(input.vervaldatum);
  if (overdue < input.settings.herinneringDagenNa) return null;

  const count = input.reminderCount ?? 0;
  const step =
    input.settings.herinneringDagenNa +
    count * input.settings.herinneringHerhaalDagen;

  if (count < input.settings.herinneringMaxAantal && overdue >= step) {
    if (count === 0) return "herinnering";
    if (count === 1) return "aanmaning";
    return "ingebrekestelling";
  }

  if (
    count >= input.settings.herinneringMaxAantal &&
    overdue >= step + 7
  ) {
    return "deurwaarder";
  }

  return null;
}

export function stageLabel(stage: IncassoStage): string {
  const map: Record<IncassoStage, string> = {
    herinnering: "Betalingsherinnering",
    aanmaning: "Tweede aanmaning",
    ingebrekestelling: "Ingebrekestelling",
    deurwaarder: "Dossier naar deurwaarder",
  };
  return map[stage];
}

export function actionTypeForStage(stage: IncassoStage): string {
  if (stage === "deurwaarder") return "forward_to_bailiff";
  if (stage === "ingebrekestelling") return "send_formal_notice";
  return "send_payment_reminder";
}

function mededeling(ctx: IncassoFactuurContext): string {
  return ctx.structuredCommunication
    ? `Gelieve het bedrag over te maken met gestructureerde mededeling ${ctx.structuredCommunication}.`
    : `Gelieve het bedrag over te maken met vermelding van factuurnummer ${ctx.nummer}.`;
}

export function buildCustomerEmail(
  stage: IncassoStage,
  ctx: IncassoFactuurContext,
): { subject: string; body: string } {
  const bedrag = formatEuro(ctx.totaalBedrag);
  const verval = ctx.vervaldatum
    ? new Date(ctx.vervaldatum).toLocaleDateString("nl-BE")
    : "onbekend";
  const iban = ctx.companyIban ? `\nIBAN: ${ctx.companyIban}` : "";

  if (stage === "herinnering") {
    return {
      subject: `Betalingsherinnering — factuur ${ctx.nummer}`,
      body: [
        `Beste ${ctx.klant},`,
        "",
        `Uit onze administratie blijkt dat factuur ${ctx.nummer} (${bedrag}) met vervaldatum ${verval} nog niet werd voldaan.`,
        "Mogelijk heeft u de betaling reeds uitgevoerd — dan mag u deze herinnering als niet verzonden beschouwen.",
        mededeling(ctx),
        iban,
        "",
        "Met vriendelijke groet,",
        ctx.companyName,
      ]
        .filter(Boolean)
        .join("\n"),
    };
  }

  if (stage === "aanmaning") {
    return {
      subject: `Tweede aanmaning — factuur ${ctx.nummer}`,
      body: [
        `Beste ${ctx.klant},`,
        "",
        `Ondanks een eerdere herinnering noteerden wij nog geen betaling voor factuur ${ctx.nummer} (${bedrag}, vervallen op ${verval}).`,
        "Wij verzoeken u vriendelijk doch dringend om binnen 7 kalenderdagen te betalen.",
        mededeling(ctx),
        iban,
        "",
        "Met vriendelijke groet,",
        ctx.companyName,
      ]
        .filter(Boolean)
        .join("\n"),
    };
  }

  return {
    subject: `Ingebrekestelling — factuur ${ctx.nummer}`,
    body: [
      `Beste ${ctx.klant},`,
      "",
      `Wij stellen u formeel in gebreke wegens de onbetaalde factuur ${ctx.nummer} (${bedrag}, vervallen op ${verval}).`,
      "Bij uitblijven van betaling binnen 7 kalenderdagen zijn wij genoodzaakt verdere invorderingsstappen te zetten, inclusief doorsturing naar een gerechtsdeurwaarder en aanrekening van invorderingskosten.",
      mededeling(ctx),
      iban,
      "",
      "Met vriendelijke groet,",
      ctx.companyName,
    ]
      .filter(Boolean)
      .join("\n"),
  };
}

export function buildBailiffEmail(
  ctx: IncassoFactuurContext,
  history: string[],
): { subject: string; body: string } {
  const bedrag = formatEuro(ctx.totaalBedrag);
  const verval = ctx.vervaldatum
    ? new Date(ctx.vervaldatum).toLocaleDateString("nl-BE")
    : "onbekend";

  return {
    subject: `Invorderingsdossier — ${ctx.klant} — factuur ${ctx.nummer}`,
    body: [
      "Geachte collega,",
      "",
      `Hierbij bezorgen wij u een invorderingsdossier voor onderstaande vordering:`,
      "",
      `Schuldenaar: ${ctx.klant}`,
      ctx.customerAddress ? `Adres: ${ctx.customerAddress}` : "",
      ctx.customerEmail ? `E-mail: ${ctx.customerEmail}` : "",
      ctx.customerPhone ? `Telefoon: ${ctx.customerPhone}` : "",
      "",
      `Factuurnummer: ${ctx.nummer}`,
      `Openstaand bedrag: ${bedrag}`,
      `Vervaldatum: ${verval}`,
      ctx.structuredCommunication
        ? `Gestructureerde mededeling: ${ctx.structuredCommunication}`
        : "",
      "",
      "Bewijs van voorafgaande ingebrekestellingen:",
      ...history.map((line) => `- ${line}`),
      "",
      `Factuur-PDF: ${ctx.pdfUrl}`,
      "",
      "Gelieve ons te bevestigen bij ontvangst van dit dossier.",
      "",
      "Met vriendelijke groet,",
      ctx.companyName,
      ctx.companyEmail ?? "",
    ]
      .filter(Boolean)
      .join("\n"),
  };
}

export function mailtoUrl(email: string, subject: string, body: string): string {
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
