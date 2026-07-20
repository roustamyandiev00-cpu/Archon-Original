import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCompanyContext } from "@/lib/company";
import { formatEuro, lineTotals } from "@/lib/offertes";
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

  const { data: factuur, error: factuurError } = await supabase
    .from("facturen")
    .select(
      "id, nummer, klant, totaal_bedrag, datum, vervaldatum, status, document_type, omschrijving, notities, created_at, updated_at, sent_at, paid_at, customer_id, project_id, template_id, offerte_id, buyer_reference, structured_communication, peppol_status, peppol_last_error, peppol_sent_at",
    )
    .eq("id", factuurId)
    .eq("bedrijf_id", companyId)
    .maybeSingle();

  if (factuurError) {
    throw new Error("De factuur kon niet worden opgehaald. Probeer het opnieuw.");
  }
  if (!factuur) notFound();

  const [lijnenResult, betalingenResult] = await Promise.all([
    supabase
      .from("factuur_lijnen")
      .select("id, omschrijving, aantal, eenheid, prijs_per_eenheid, btw_percentage")
      .eq("factuur_id", factuurId)
      .eq("company_id", companyId)
      .order("sort_order"),
    supabase
      .from("betalingen")
      .select("bedrag, datum, betaalmethode, referentie")
      .eq("factuur_id", factuurId)
      .eq("bedrijf_id", companyId)
      .order("datum", { ascending: false }),
  ]);

  if (lijnenResult.error) {
    throw new Error("De factuurregels konden niet worden opgehaald.");
  }
  if (betalingenResult.error) {
    throw new Error("De betalingen konden niet worden opgehaald.");
  }

  const lijnen = lijnenResult.data;
  const betalingen = betalingenResult.data;

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

  const { data: bedrijf, error: bedrijfError } = await supabase
    .from("bedrijven")
    .select(
      "naam, adres, postcode, stad, telefoon, email, btw, iban, algemene_voorwaarden, footer_tekst, default_invoice_template",
    )
    .eq("id", companyId)
    .maybeSingle();

  if (bedrijfError) {
    throw new Error("De bedrijfsgegevens konden niet worden opgehaald.");
  }

  let customer: CustomerLite = null;
  if (factuur.customer_id) {
    const { data, error: customerError } = await supabase
      .from("customers")
      .select(
        "name, company_name, first_name, last_name, address, email, phone, btw",
      )
      .eq("id", factuur.customer_id)
      .eq("company_id", companyId)
      .maybeSingle();
    if (customerError) {
      throw new Error("De klantgegevens konden niet worden opgehaald.");
    }
    customer = data;
  }

  let relatedProject: {
    id: string;
    naam: string;
    status: string;
  } | null = null;
  if (factuur.project_id) {
    const { data, error: projectError } = await supabase
      .from("projecten")
      .select("id, naam, status")
      .eq("id", factuur.project_id)
      .eq("bedrijf_id", companyId)
      .maybeSingle();
    if (projectError) {
      throw new Error("Het gekoppelde project kon niet worden opgehaald.");
    }
    relatedProject = data;
  }

  const customerStats = {
    invoiceCount: 0,
    projectCount: 0,
    openAmount: 0,
  };
  if (factuur.customer_id) {
    const [customerInvoicesResult, customerProjectsResult] = await Promise.all([
      supabase
        .from("facturen")
        .select("id, totaal_bedrag, status, paid_at")
        .eq("customer_id", factuur.customer_id)
        .eq("bedrijf_id", companyId),
      supabase
        .from("projecten")
        .select("id", { count: "exact", head: true })
        .eq("customer_id", factuur.customer_id)
        .eq("bedrijf_id", companyId),
    ]);

    if (customerInvoicesResult.error || customerProjectsResult.error) {
      throw new Error("Het klantdossier kon niet volledig worden opgehaald.");
    }

    const customerInvoices = customerInvoicesResult.data ?? [];
    customerStats.invoiceCount = customerInvoices.length;
    customerStats.projectCount = customerProjectsResult.count ?? 0;

    const openInvoices = customerInvoices.filter(
      (invoice) => !invoice.paid_at && invoice.status !== "betaald",
    );
    if (openInvoices.length > 0) {
      const { data: customerPayments, error: customerPaymentsError } = await supabase
        .from("betalingen")
        .select("factuur_id, bedrag")
        .eq("bedrijf_id", companyId)
        .in(
          "factuur_id",
          openInvoices.map((invoice) => invoice.id),
        );

      if (customerPaymentsError) {
        throw new Error("Het openstaande klantsaldo kon niet worden berekend.");
      }

      const paidByInvoice = new Map<number, number>();
      for (const payment of customerPayments ?? []) {
        if (payment.factuur_id == null) continue;
        paidByInvoice.set(
          payment.factuur_id,
          (paidByInvoice.get(payment.factuur_id) ?? 0) + Number(payment.bedrag ?? 0),
        );
      }
      customerStats.openAmount = openInvoices.reduce(
        (sum, invoice) =>
          sum +
          Math.max(
            0,
            Number(invoice.totaal_bedrag ?? 0) -
              (paidByInvoice.get(invoice.id) ?? 0),
          ),
        0,
      );
    }
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
  for (const payment of payments) {
    if (!payment.datum) continue;
    activity.push({
      label: "Betaling geregistreerd",
      detail: `${formatEuro(payment.bedrag)}${
        payment.betaalmethode ? ` via ${payment.betaalmethode}` : ""
      }`,
      at: payment.datum,
    });
  }
  if (factuur.paid_at && !payments.some((payment) => payment.datum)) {
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
              id: factuur.customer_id,
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
      customerStats={customerStats}
      relatedProject={relatedProject}
      peppolConnected={peppolConnected}
      peppolCanSend={peppolCanSend}
      currentTemplate={factuur.template_id ?? ""}
      defaultTemplate={bedrijf?.default_invoice_template ?? ""}
      docValues={docValues}
      docRows={docRows}
    />
  );
}
