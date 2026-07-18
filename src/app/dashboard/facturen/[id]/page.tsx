import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCompanyContext } from "@/lib/company";
import { lineTotals } from "@/lib/offertes";
import { factuurStatusMeta, documentTypeMeta } from "@/lib/facturen";
import FactuurDetailView from "@/components/dashboard/facturen/FactuurDetailView";
import type {
  FactuurActivityItem,
  FactuurPaymentRow,
} from "@/components/dashboard/facturen/FactuurDetailSidebar";
import {
  buildDocumentValues,
  buildDocumentRows,
  type CustomerLite,
} from "@/lib/documentData";
import { getPeppolConfig } from "@/lib/peppol/build";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const factuurId = Number(id);
  const { supabase, companyId } = await getCompanyContext();

  if (!companyId || Number.isNaN(factuurId)) {
    return { title: "Factuur — ArchonPro" };
  }

  const { data } = await supabase
    .from("facturen")
    .select("nummer, klant")
    .eq("id", factuurId)
    .eq("bedrijf_id", companyId)
    .maybeSingle();

  if (!data?.nummer) return { title: "Factuur — ArchonPro" };

  const klant = data.klant?.trim();
  return {
    title: klant
      ? `${data.nummer} — ${klant} | ArchonPro`
      : `${data.nummer} | ArchonPro`,
  };
}

export default async function FactuurDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const factuurId = Number(id);
  const { supabase, companyId } = await getCompanyContext();

  if (!companyId || Number.isNaN(factuurId)) notFound();

  const { data: factuur } = await supabase
    .from("facturen")
    .select(
      "id, nummer, klant, totaal_bedrag, datum, vervaldatum, status, document_type, omschrijving, notities, created_at, updated_at, sent_at, paid_at, customer_id, template_id, offerte_id, buyer_reference, structured_communication, peppol_status, peppol_last_error, peppol_sent_at",
    )
    .eq("id", factuurId)
    .eq("bedrijf_id", companyId)
    .maybeSingle();

  if (!factuur) notFound();

  const [{ data: lijnen }, { data: betalingen }] = await Promise.all([
    supabase
      .from("factuur_lijnen")
      .select("id, omschrijving, aantal, eenheid, prijs_per_eenheid, btw_percentage")
      .eq("factuur_id", factuurId)
      .order("sort_order"),
    supabase
      .from("betalingen")
      .select("bedrag, datum, betaalmethode, referentie")
      .eq("factuur_id", factuurId)
      .eq("bedrijf_id", companyId)
      .order("datum", { ascending: false }),
  ]);

  const lines = (lijnen ?? []).map((l) => ({
    omschrijving: l.omschrijving ?? "",
    aantal: Number(l.aantal ?? 0),
    eenheid: l.eenheid ?? "stuks",
    prijs_per_eenheid: Number(l.prijs_per_eenheid ?? 0),
    btw_percentage: Number(l.btw_percentage ?? 0),
  }));
  const totals = lineTotals(lines);
  const meta = factuurStatusMeta(factuur.status);
  const typeMeta = documentTypeMeta(factuur.document_type);
  const isProforma = factuur.document_type === "proforma";
  const isPaid = Boolean(factuur.paid_at) || factuur.status === "betaald";

  const payments: FactuurPaymentRow[] = (betalingen ?? []).map((b) => ({
    bedrag: Number(b.bedrag ?? 0),
    datum: b.datum,
    betaalmethode: b.betaalmethode,
    referentie: b.referentie,
  }));
  const paidAmount = isPaid
    ? payments.reduce((sum, p) => sum + p.bedrag, 0) ||
      Number(factuur.totaal_bedrag ?? totals.totaal)
    : payments.reduce((sum, p) => sum + p.bedrag, 0);
  const openAmount = Math.max(
    0,
    Number(factuur.totaal_bedrag ?? totals.totaal) - paidAmount,
  );

  const { data: bedrijf } = await supabase
    .from("bedrijven")
    .select(
      "naam, adres, postcode, stad, telefoon, email, btw, iban, algemene_voorwaarden, footer_tekst, default_invoice_template",
    )
    .eq("id", companyId)
    .maybeSingle();

  let customer: CustomerLite = null;
  if (factuur.customer_id) {
    const { data } = await supabase
      .from("customers")
      .select(
        "name, company_name, first_name, last_name, address, email, phone, btw",
      )
      .eq("id", factuur.customer_id)
      .eq("company_id", companyId)
      .maybeSingle();
    customer = data;
  }

  const docValues = buildDocumentValues(
    {
      kind: "invoice",
      nummer: factuur.nummer ?? `#${factuur.id}`,
      datum: factuur.datum,
      vervaldatum: factuur.vervaldatum,
      omschrijving: factuur.omschrijving,
      klant: factuur.klant,
      isProforma,
    },
    bedrijf,
    customer,
    lines,
  );
  const docRows = buildDocumentRows(lines);

  const peppol = await getPeppolConfig(supabase, companyId);
  const peppolConnected = Boolean(peppol);
  const peppolCanSend =
    peppolConnected &&
    (peppol?.accessPoint === "storecove" || peppol?.accessPoint === "billit") &&
    Boolean(peppol?.apiKey);

  const activity: FactuurActivityItem[] = [];
  if (factuur.created_at) {
    activity.push({ label: "Factuur aangemaakt", at: factuur.created_at });
  }
  if (
    factuur.updated_at &&
    factuur.created_at &&
    factuur.updated_at !== factuur.created_at
  ) {
    activity.push({ label: "Factuur bijgewerkt", at: factuur.updated_at });
  }
  if (factuur.sent_at) {
    activity.push({ label: "Factuur verzonden", at: factuur.sent_at });
  }
  if (factuur.peppol_sent_at) {
    activity.push({
      label: "Verzonden via Peppol",
      at: factuur.peppol_sent_at,
    });
  }
  if (factuur.paid_at) {
    activity.push({ label: "Betaling geregistreerd", at: factuur.paid_at });
  }
  activity.sort(
    (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
  );

  const customerLabel =
    customer?.company_name?.trim() ||
    customer?.name?.trim() ||
    factuur.klant ||
    "Onbekende klant";

  return (
    <FactuurDetailView
      factuur={factuur}
      lines={lines}
      totals={totals}
      meta={meta}
      typeMeta={typeMeta}
      customerLabel={customerLabel}
      customerDetails={
        customer
          ? {
              email: customer.email,
              phone: customer.phone,
              address: customer.address,
              btw: customer.btw,
            }
          : null
      }
      isProforma={isProforma}
      isPaid={isPaid}
      paidAmount={paidAmount}
      openAmount={isPaid ? 0 : openAmount}
      payments={payments}
      activity={activity}
      peppolConnected={peppolConnected}
      peppolCanSend={peppolCanSend}
      currentTemplate={factuur.template_id ?? ""}
      defaultTemplate={bedrijf?.default_invoice_template ?? ""}
      docValues={docValues}
      docRows={docRows}
    />
  );
}
