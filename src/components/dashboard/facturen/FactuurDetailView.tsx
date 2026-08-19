import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Clock3,
  FolderKanban,
  ReceiptText,
} from "lucide-react";
import FactuurDetailSidebar, {
  type FactuurActivityItem,
  type FactuurPaymentRow,
} from "@/components/dashboard/facturen/FactuurDetailSidebar";
import DocumentContactActions from "@/components/dashboard/DocumentContactActions";
import { formatDate, formatEuro } from "@/lib/offertes";
import type { DocumentRow } from "@/components/dashboard/documenten/documentTemplate";

export type FactuurDetailLine = {
  omschrijving: string;
  aantal: number;
  eenheid: string;
  prijs_per_eenheid: number;
  btw_percentage: number;
};

export type FactuurDetailTotals = {
  subtotaal: number;
  btw: number;
  totaal: number;
};

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-zinc-500">
        {label}
      </p>
      <p className="mt-0.5 text-sm text-zinc-200">{value}</p>
    </div>
  );
}

export function displayedFactuurAmount({
  isPaid,
  paidAmount,
  openAmount,
}: {
  isPaid: boolean;
  paidAmount: number;
  openAmount: number;
}) {
  return isPaid ? paidAmount : openAmount;
}

export default function FactuurDetailView({
  factuur,
  lines,
  totals,
  meta,
  typeMeta,
  customerLabel,
  customerDetails,
  isProforma,
  isPaid,
  paidAmount,
  openAmount,
  payments,
  activity,
  customerStats,
  relatedProject,
  peppolConnected,
  peppolCanSend,
  currentTemplate,
  defaultTemplate,
  docValues,
  docRows,
}: {
  factuur: {
    id: number;
    nummer: string | null;
    klant: string | null;
    totaal_bedrag: number | null;
    datum: string | null;
    vervaldatum: string | null;
    status: string | null;
    document_type: string | null;
    omschrijving: string | null;
    notities: string | null;
    created_at: string | null;
    updated_at: string | null;
    sent_at: string | null;
    paid_at: string | null;
    offerte_id: number | null;
    buyer_reference: string | null;
    structured_communication: string | null;
    peppol_status: string | null;
    peppol_last_error: string | null;
    peppol_sent_at: string | null;
  };
  lines: FactuurDetailLine[];
  totals: FactuurDetailTotals;
  meta: { label: string; tone: string; dot: string };
  typeMeta: { label: string; tone: string; dot: string };
  customerLabel: string;
  customerDetails: {
    id?: number | null;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    btw?: string | null;
  } | null;
  isProforma: boolean;
  isPaid: boolean;
  paidAmount: number;
  openAmount: number;
  payments: FactuurPaymentRow[];
  activity: FactuurActivityItem[];
  customerStats: {
    invoiceCount: number;
    projectCount: number;
    openAmount: number;
  };
  relatedProject: {
    id: string;
    naam: string;
    status: string;
  } | null;
  peppolConnected: boolean;
  peppolCanSend: boolean;
  currentTemplate: string;
  defaultTemplate: string;
  docValues: Record<string, string>;
  docRows: DocumentRow[];
}) {
  const nummer = factuur.nummer ?? `#${factuur.id}`;
  const displayedAmount = displayedFactuurAmount({
    isPaid,
    paidAmount,
    openAmount,
  });
  const totalAmount = Number(factuur.totaal_bedrag ?? totals.totaal);
  const aiMissingFields = [
    !customerDetails?.email ? "e-mailadres van de klant" : null,
    !customerDetails?.address ? "adres van de klant" : null,
    !isProforma && !factuur.vervaldatum ? "vervaldatum" : null,
    lines.length === 0 ? "factuurregels" : null,
  ].filter((field): field is string => Boolean(field));

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-5 pb-10">
      <header className="rounded-2xl border border-white/[0.06] bg-zinc-900/25 px-4 py-4 sm:px-5">
        <div className="min-w-0 space-y-3">
          <Link
            href="/dashboard/facturen/lijst"
            className="group inline-flex items-center gap-1.5 text-sm text-zinc-400 transition-colors hover:text-zinc-200"
          >
            <ArrowLeft
              size={15}
              className="transition-transform group-hover:-translate-x-0.5"
            />
            Terug naar facturen
          </Link>

          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="font-mono text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl">
              {nummer}
            </h1>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${typeMeta.tone}`}
              title="Documenttype"
            >
              <span className={`h-1.5 w-1.5 rounded-full ${typeMeta.dot}`} />
              {typeMeta.label}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${meta.tone}`}
              title="Status"
            >
              <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
              {meta.label}
            </span>
          </div>

          <p className="truncate text-base font-medium text-zinc-300">
            {customerLabel}
          </p>
        </div>
      </header>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start">
        <main className="min-w-0 space-y-5">
          <section className="rounded-2xl border border-white/[0.08] bg-zinc-900/50 p-4 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-5 border-b border-white/[0.08] pb-5">
              <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-zinc-500">
                  Factuur
                </p>
                <p className="mt-1 font-mono text-lg font-semibold text-zinc-50">
                  {nummer}
                </p>
                <p className="mt-1 text-sm text-zinc-300">{customerLabel}</p>
                <p className="mt-1 text-sm text-zinc-400">
                  {factuur.omschrijving || "Factuurdocument"}
                </p>
              </div>
              <div className="min-w-[12rem] rounded-2xl border border-sky-500/15 bg-sky-500/[0.06] px-4 py-3 text-right">
                <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-zinc-500">
                  {isProforma ? "Totaal" : isPaid ? "Betaald" : "Te betalen"}
                </p>
                <p className="mt-1 font-mono text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl">
                  {formatEuro(displayedAmount)}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  {isPaid ? "Volledig voldaan" : isProforma ? "Documenttotaal" : "Nog te betalen"}
                </p>
              </div>
            </div>

            <div className="grid gap-3 py-4 sm:grid-cols-2 lg:grid-cols-4">
              <Meta label="Factuurdatum" value={formatDate(factuur.datum)} />
              <Meta
                label="Vervaldatum"
                value={isProforma ? "—" : formatDate(factuur.vervaldatum)}
              />
              <Meta label="Aangemaakt" value={formatDate(factuur.created_at)} />
              {factuur.sent_at ? (
                <Meta label="Verzonden" value={formatDate(factuur.sent_at)} />
              ) : null}
              {factuur.paid_at ? (
                <Meta label="Betaald op" value={formatDate(factuur.paid_at)} />
              ) : null}
            </div>

            {factuur.omschrijving ? (
              <p className="mb-4 text-sm leading-relaxed text-zinc-300">
                {factuur.omschrijving}
              </p>
            ) : null}

            {/* Desktop / tablet table */}
            <div className="hidden overflow-x-auto rounded-2xl border border-white/[0.08] sm:block">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-white/[0.08] bg-zinc-950/55 text-left text-[11px] uppercase tracking-wider text-zinc-500">
                    <th className="px-4 py-3 font-semibold">Omschrijving</th>
                    <th className="px-4 py-3 text-right font-semibold">Aantal</th>
                    <th className="px-4 py-3 text-right font-semibold">Eenheid</th>
                    <th className="px-4 py-3 text-right font-semibold">
                      Eenheidsprijs
                    </th>
                    <th className="px-4 py-3 text-right font-semibold">BTW</th>
                    <th className="px-4 py-3 text-right font-semibold">Totaal</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.length > 0 ? (
                    lines.map((l, i) => (
                      <tr
                        key={i}
                        className="border-b border-white/[0.05] transition-colors odd:bg-white/[0.012] hover:bg-sky-500/[0.04] last:border-0"
                      >
                        <td className="max-w-[18rem] break-words px-4 py-3.5 font-medium text-zinc-200">
                          {l.omschrijving || "—"}
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono text-zinc-400">
                          {l.aantal}
                        </td>
                        <td className="px-4 py-3.5 text-right text-zinc-400">
                          {l.eenheid}
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono text-zinc-400">
                          {formatEuro(l.prijs_per_eenheid)}
                        </td>
                        <td className="px-4 py-3.5 text-right text-zinc-400">
                          {l.btw_percentage}%
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono font-medium text-zinc-100">
                          {formatEuro(l.aantal * l.prijs_per_eenheid)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-3 py-8 text-center text-sm text-zinc-500"
                      >
                        Geen factuurregels
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile line cards */}
            <div className="space-y-2 sm:hidden">
              {lines.length > 0 ? (
                lines.map((l, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-white/[0.08] bg-zinc-950/40 p-3"
                  >
                    <p className="break-words text-sm font-medium text-zinc-100">
                      {l.omschrijving || "—"}
                    </p>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-zinc-400">
                      <span>
                        {l.aantal} {l.eenheid}
                      </span>
                      <span className="text-right font-mono">
                        {formatEuro(l.prijs_per_eenheid)}
                      </span>
                      <span>BTW {l.btw_percentage}%</span>
                      <span className="text-right font-mono text-zinc-100">
                        {formatEuro(l.aantal * l.prijs_per_eenheid)}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="py-6 text-center text-sm text-zinc-500">
                  Geen factuurregels
                </p>
              )}
            </div>

            <div className="mt-4 flex justify-end">
              <div className="w-full max-w-xs space-y-1.5 text-sm">
                <div className="flex justify-between text-zinc-400">
                  <span>Subtotaal</span>
                  <span className="font-mono">{formatEuro(totals.subtotaal)}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>BTW</span>
                  <span className="font-mono">{formatEuro(totals.btw)}</span>
                </div>
                {!isProforma && paidAmount > 0 ? (
                  <div className="flex justify-between text-zinc-400">
                    <span>Reeds betaald</span>
                    <span className="font-mono">{formatEuro(paidAmount)}</span>
                  </div>
                ) : null}
                <div className="flex justify-between border-t border-white/[0.08] pt-2 text-base font-semibold text-zinc-50">
                  <span>
                    {isProforma
                      ? "Totaal"
                      : isPaid
                        ? "Betaald"
                        : "Nog te betalen"}
                  </span>
                  <span className="font-mono">
                    {formatEuro(
                      isProforma
                        ? totals.totaal
                        : isPaid
                          ? paidAmount
                          : openAmount,
                    )}
                  </span>
                </div>
              </div>
            </div>

            {isProforma ? (
              <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
                Dit is een proforma en geldt niet als officiële factuur.
              </div>
            ) : null}

            {factuur.notities ? (
              <div className="mt-4 rounded-xl border border-white/[0.08] bg-zinc-950/40 p-4">
                <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.1em] text-zinc-500">
                  Notities
                </p>
                <p className="whitespace-pre-line text-sm text-zinc-300">
                  {factuur.notities}
                </p>
              </div>
            ) : null}

            {factuur.structured_communication ? (
              <div className="mt-4 rounded-xl border border-white/[0.08] bg-zinc-950/40 p-4">
                <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.1em] text-zinc-500">
                  Betalingsmededeling
                </p>
                <p className="font-mono text-sm text-zinc-200">
                  {factuur.structured_communication}
                </p>
              </div>
            ) : null}

          </section>

          <div className="grid gap-5 lg:grid-cols-2">
            <section className="rounded-2xl border border-white/[0.08] bg-zinc-900/50 p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sky-500/10 text-sky-300">
                    <Building2 size={18} aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-sm font-semibold text-zinc-100">
                      Klantdossier
                    </h2>
                    <p className="truncate text-sm text-zinc-400">
                      {customerLabel}
                    </p>
                  </div>
                </div>
                <DocumentContactActions
                  soort={isProforma ? "proforma" : "factuur"}
                  nummer={nummer}
                  klant={customerLabel}
                  bedrag={totalAmount}
                  email={customerDetails?.email ?? null}
                  phone={customerDetails?.phone ?? null}
                />
              </div>

              <div className="mt-4 space-y-1 text-xs leading-relaxed text-zinc-500">
                {customerDetails?.address ? <p>{customerDetails.address}</p> : null}
                {customerDetails?.email ? <p>{customerDetails.email}</p> : null}
                {customerDetails?.phone ? <p>{customerDetails.phone}</p> : null}
                {customerDetails?.btw ? <p>BTW {customerDetails.btw}</p> : null}
                {!customerDetails ? <p>Geen gekoppeld klantdossier.</p> : null}
              </div>

              <dl className="mt-5 grid grid-cols-3 gap-2">
                <div className="rounded-xl bg-zinc-950/45 p-3">
                  <dt className="text-[10px] uppercase tracking-wider text-zinc-500">
                    Facturen
                  </dt>
                  <dd className="mt-1 font-mono text-lg font-semibold text-zinc-100">
                    {customerStats.invoiceCount}
                  </dd>
                </div>
                <div className="rounded-xl bg-zinc-950/45 p-3">
                  <dt className="text-[10px] uppercase tracking-wider text-zinc-500">
                    Projecten
                  </dt>
                  <dd className="mt-1 font-mono text-lg font-semibold text-zinc-100">
                    {customerStats.projectCount}
                  </dd>
                </div>
                <div className="rounded-xl bg-zinc-950/45 p-3">
                  <dt className="text-[10px] uppercase tracking-wider text-zinc-500">
                    Openstaand
                  </dt>
                  <dd className="mt-1 font-mono text-sm font-semibold text-zinc-100">
                    {formatEuro(customerStats.openAmount)}
                  </dd>
                </div>
              </dl>

              {relatedProject || factuur.offerte_id ? (
                <div className="mt-4 flex flex-wrap gap-2 border-t border-white/[0.08] pt-4">
                  {relatedProject ? (
                    <Link
                      href={`/dashboard/offertes/projecten/${relatedProject.id}`}
                      className="inline-flex items-center gap-2 rounded-lg border border-violet-500/25 bg-violet-500/10 px-3 py-2 text-xs font-medium text-violet-200 transition-colors hover:bg-violet-500/15"
                    >
                      <FolderKanban size={14} aria-hidden="true" />
                      {relatedProject.naam}
                    </Link>
                  ) : null}
                  {factuur.offerte_id ? (
                    <Link
                      href={`/dashboard/offertes/${factuur.offerte_id}`}
                      className="inline-flex items-center gap-2 rounded-lg border border-sky-500/25 bg-sky-500/10 px-3 py-2 text-xs font-medium text-sky-200 transition-colors hover:bg-sky-500/15"
                    >
                      <ReceiptText size={14} aria-hidden="true" />
                      Bronofferte
                    </Link>
                  ) : null}
                </div>
              ) : null}
            </section>

            <section className="rounded-2xl border border-white/[0.08] bg-zinc-900/50 p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/10 text-emerald-300">
                  <Clock3 size={18} aria-hidden="true" />
                </span>
                <div>
                  <h2 className="text-sm font-semibold text-zinc-100">
                    Documentactiviteit
                  </h2>
                  <p className="text-xs text-zinc-500">
                    Alleen geregistreerde gebeurtenissen
                  </p>
                </div>
              </div>

              {activity.length > 0 ? (
                <ol className="mt-5 space-y-0">
                  {activity.map((item, index) => (
                    <li
                      key={`${item.label}-${item.at}-${index}`}
                      className="relative flex gap-3 pb-4 last:pb-0"
                    >
                      {index < activity.length - 1 ? (
                        <span className="absolute bottom-0 left-[5px] top-3 w-px bg-white/[0.08]" />
                      ) : null}
                      <span className="relative mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full border-2 border-zinc-900 bg-sky-400 ring-2 ring-sky-400/15" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-zinc-200">
                          {item.label}
                        </p>
                        {item.detail ? (
                          <p className="mt-0.5 text-xs text-zinc-400">
                            {item.detail}
                          </p>
                        ) : null}
                        <time
                          dateTime={item.at}
                          className="mt-1 block font-mono text-[11px] text-zinc-500"
                        >
                          {formatDate(item.at)}
                        </time>
                      </div>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="mt-5 text-sm text-zinc-500">
                  Nog geen geregistreerde activiteit.
                </p>
              )}
            </section>
          </div>
        </main>

        <FactuurDetailSidebar
          factuurId={factuur.id}
          nummer={nummer}
          status={factuur.status}
          statusLabel={meta.label}
          statusTone={meta.tone}
          statusDot={meta.dot}
          typeLabel={typeMeta.label}
          typeTone={typeMeta.tone}
          typeDot={typeMeta.dot}
          isProforma={isProforma}
          isPaid={isPaid}
          paidAt={factuur.paid_at}
          paidAmount={paidAmount}
          openAmount={openAmount}
          payments={payments}
          aiContext={{
            customerLabel,
            statusLabel: meta.label,
            invoiceDate: factuur.datum,
            dueDate: factuur.vervaldatum,
            totalAmount,
            openAmount,
            lineCount: lines.length,
            missingFields: aiMissingFields,
            isProforma,
          }}
          peppolConnected={peppolConnected}
          peppolCanSend={peppolCanSend}
          buyerReference={factuur.buyer_reference}
          structuredCommunication={factuur.structured_communication}
          peppolStatus={factuur.peppol_status}
          peppolLastError={factuur.peppol_last_error}
          currentTemplate={currentTemplate}
          defaultTemplate={defaultTemplate}
          docValues={docValues}
          docRows={docRows}
        />
      </div>
    </div>
  );
}
