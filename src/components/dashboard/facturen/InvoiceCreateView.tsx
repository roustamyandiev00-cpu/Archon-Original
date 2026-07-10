"use client";

import Link from "next/link";
import {
  Building2,
  CreditCard,
  Loader2,
  Plus,
  ReceiptText,
  Save,
  Send,
  Trash2,
  UserPlus,
} from "lucide-react";
import FactuurInvoicePreview from "@/components/dashboard/facturen/FactuurInvoicePreview";
import FacturenSectionNav from "@/components/dashboard/facturen/FacturenSectionNav";
import type { FactuurDocumentContext } from "@/components/dashboard/facturen/FactuurForm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatEuro, type OfferteLijnInput } from "@/lib/offertes";
import type { FactuurDocumentType } from "@/lib/facturen";
import type { BedrijfLite } from "@/lib/documentData";

type Customer = {
  id: number;
  name: string;
  company_name: string | null;
  first_name?: string | null;
  last_name?: string | null;
  address?: string | null;
  email?: string | null;
  phone?: string | null;
  btw?: string | null;
};

type TabId = "factuur" | "betaling" | "bedrijf";

type Props = {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  documentType: FactuurDocumentType;
  onDocumentTypeChange: (type: FactuurDocumentType) => void;
  reference: string;
  datum: string;
  onDatumChange: (value: string) => void;
  vervaldatum: string;
  onVervaldatumChange: (value: string) => void;
  isProforma: boolean;
  customers: Customer[];
  customerId: string;
  onCustomerIdChange: (value: string) => void;
  klantVrij: string;
  onKlantVrijChange: (value: string) => void;
  klantNaam: string;
  klantEmail: string;
  klantInitials: string;
  lines: OfferteLijnInput[];
  onUpdateLine: (index: number, patch: Partial<OfferteLijnInput>) => void;
  onAddLine: () => void;
  onRemoveLine: (index: number) => void;
  taxRate: number;
  onTaxRateChange: (rate: number) => void;
  discountType: "fixed" | "percent";
  onDiscountTypeChange: (type: "fixed" | "percent") => void;
  discountValue: number;
  onDiscountValueChange: (value: number) => void;
  subtotaal: number;
  btw: number;
  totaal: number;
  bedrijf: BedrijfLite;
  documentContext: FactuurDocumentContext;
  omschrijving: string;
  onOmschrijvingChange: (value: string) => void;
  notities: string;
  onNotitiesChange: (value: string) => void;
  loading: boolean;
  error: string | null;
  isDemo?: boolean;
  onSaveDraft: () => void;
  onSend: () => void;
};

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex flex-1 items-center justify-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
        active
          ? "border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100"
          : "border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

export default function InvoiceCreateView(props: Props) {
  const {
    activeTab,
    onTabChange,
    documentType,
    onDocumentTypeChange,
    reference,
    datum,
    onDatumChange,
    vervaldatum,
    onVervaldatumChange,
    isProforma,
    customers,
    customerId,
    onCustomerIdChange,
    klantVrij,
    onKlantVrijChange,
    klantNaam,
    klantEmail,
    klantInitials,
    lines,
    onUpdateLine,
    onAddLine,
    onRemoveLine,
    taxRate,
    onTaxRateChange,
    discountType,
    onDiscountTypeChange,
    discountValue,
    onDiscountValueChange,
    subtotaal,
    btw,
    totaal,
    bedrijf,
    documentContext,
    omschrijving,
    onOmschrijvingChange,
    notities,
    onNotitiesChange,
    loading,
    error,
    isDemo,
    onSaveDraft,
    onSend,
  } = props;

  const discountAmount =
    discountValue <= 0
      ? 0
      : discountType === "fixed"
        ? discountValue
        : (subtotaal * discountValue) / 100;

  const invoiceTab = (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-200">
            Referentienummer
          </label>
          <Input
            value={reference}
            readOnly
            className="h-9 font-mono text-xs text-zinc-500"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-200">
            Factuurdatum
          </label>
          <Input
            type="date"
            value={datum}
            onChange={(e) => onDatumChange(e.target.value)}
            className="h-9"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-200">
            Vervaldatum
          </label>
          <Input
            type="date"
            value={vervaldatum}
            onChange={(e) => onVervaldatumChange(e.target.value)}
            disabled={isProforma}
            className="h-9 disabled:cursor-not-allowed disabled:opacity-40"
          />
        </div>
      </div>

      <section className="invoice-create-section rounded-xl border p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Factureren aan
          </h3>
          <Link
            href="/dashboard/contacten"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-600 hover:text-sky-500 dark:text-sky-400 dark:hover:text-sky-300"
          >
            <UserPlus size={14} />
            Nieuwe klant
          </Link>
        </div>

        {customers.length > 0 ? (
          <Combobox
            className="mb-3"
            value={customerId}
            onChange={onCustomerIdChange}
            placeholder="— Kies een klant —"
            searchPlaceholder="Zoek op naam of bedrijf..."
            emptyText="Geen klant gevonden."
            options={customers.map((c) => ({
              value: String(c.id),
              label: c.company_name ? `${c.name} (${c.company_name})` : c.name,
              description: c.email ?? undefined,
            }))}
          />
        ) : null}

        {(customers.length === 0 || customerId === "") && (
          <Input
            value={klantVrij}
            onChange={(e) => onKlantVrijChange(e.target.value)}
            placeholder="Naam van de klant"
            className="mb-3 h-9"
          />
        )}

        <div className="flex items-center gap-3 rounded-lg border border-zinc-200/80 bg-white/60 p-3 dark:border-white/10 dark:bg-zinc-900/50">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-zinc-900 text-xs font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900">
            {klantInitials || "?"}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {klantNaam}
            </p>
            <p className="truncate text-xs text-zinc-500">{klantEmail}</p>
          </div>
        </div>
      </section>

      <section className="invoice-create-section rounded-xl border p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Factuurlijnen
          </h3>
          <Button type="button" variant="ghost" size="sm" onClick={onAddLine}>
            <Plus size={14} />
            Lijn toevoegen
          </Button>
        </div>

        <div className="overflow-x-auto rounded-lg border border-zinc-200/80 dark:border-white/10">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="min-w-[180px]">Omschrijving</TableHead>
                <TableHead className="w-24 text-right">Eenheden</TableHead>
                <TableHead className="w-24">Eenheid</TableHead>
                <TableHead className="w-28 text-right">Stukprijs</TableHead>
                <TableHead className="w-28 text-right">Regeltotaal</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {lines.map((l, i) => {
                const lineTotal =
                  (Number(l.aantal) || 0) * (Number(l.prijs_per_eenheid) || 0);
                return (
                  <TableRow key={i}>
                    <TableCell>
                      <Input
                        value={l.omschrijving}
                        onChange={(e) =>
                          onUpdateLine(i, { omschrijving: e.target.value })
                        }
                        placeholder="Omschrijving"
                        className="h-8 min-w-[140px] border-transparent bg-transparent px-1 shadow-none focus:border-zinc-300 dark:focus:border-white/20"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="any"
                        min={0}
                        value={l.aantal}
                        onChange={(e) =>
                          onUpdateLine(i, { aantal: Number(e.target.value) })
                        }
                        className="h-8 border-transparent bg-transparent px-1 shadow-none"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={l.eenheid}
                        onChange={(e) =>
                          onUpdateLine(i, { eenheid: e.target.value })
                        }
                        className="h-8 border-transparent bg-transparent px-1 shadow-none"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="any"
                        min={0}
                        value={l.prijs_per_eenheid}
                        onChange={(e) =>
                          onUpdateLine(i, {
                            prijs_per_eenheid: Number(e.target.value),
                          })
                        }
                        className="h-8 border-transparent bg-transparent px-1 text-right font-mono shadow-none"
                      />
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-zinc-700 dark:text-zinc-200">
                      {formatEuro(lineTotal)}
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => onRemoveLine(i)}
                        disabled={lines.length === 1}
                        aria-label="Lijn verwijderen"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </section>

      <section className="invoice-create-section rounded-xl border p-4">
        <h3 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Aanpassingen
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-500">
              BTW-tarief
            </label>
            <Select
              value={String(taxRate)}
              onChange={(e) => onTaxRateChange(Number(e.target.value))}
              className="h-9"
            >
              <option value="0">BTW (0%)</option>
              <option value="6">BTW (6%)</option>
              <option value="12">BTW (12%)</option>
              <option value="21">BTW (21%)</option>
            </Select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-500">
              Korting
            </label>
            <div className="flex gap-2">
              <Select
                value={discountType}
                onChange={(e) =>
                  onDiscountTypeChange(e.target.value as "fixed" | "percent")
                }
                className="h-9 w-32"
              >
                <option value="fixed">Vast bedrag</option>
                <option value="percent">Percentage</option>
              </Select>
              <Input
                type="number"
                min={0}
                step="any"
                value={discountValue}
                onChange={(e) => onDiscountValueChange(Number(e.target.value))}
                className="h-9 flex-1 font-mono"
              />
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-2 border-t border-zinc-200/80 pt-4 text-sm dark:border-white/10">
          <div className="flex justify-between text-zinc-500">
            <span>Nettobedrag</span>
            <span className="font-mono">{formatEuro(subtotaal)}</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-zinc-500">
              <span>Korting</span>
              <span className="font-mono">-{formatEuro(discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between text-zinc-500">
            <span>BTW {taxRate}%</span>
            <span className="font-mono">{formatEuro(btw)}</span>
          </div>
          <div className="flex justify-between border-t border-zinc-200/80 pt-2 text-base font-semibold text-zinc-900 dark:border-white/10 dark:text-zinc-50">
            <span>Te betalen</span>
            <span className="font-mono">{formatEuro(totaal)}</span>
          </div>
        </div>
      </section>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-200">
          Omschrijving (optioneel)
        </label>
        <Input
          value={omschrijving}
          onChange={(e) => onOmschrijvingChange(e.target.value)}
          placeholder="bijv. Werken maand juli"
          className="h-9"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-200">
          Notities (optioneel)
        </label>
        <textarea
          value={notities}
          onChange={(e) => onNotitiesChange(e.target.value)}
          rows={3}
          className="w-full resize-none rounded-lg border border-zinc-200/80 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/10 dark:border-white/10 dark:bg-zinc-950/70 dark:text-zinc-100 dark:placeholder:text-zinc-600"
        />
      </div>
    </div>
  );

  const paymentTab = (
    <div className="space-y-4">
      <p className="text-sm text-zinc-500">
        Betalingsgegevens op de factuur. Wijzig ze bij{" "}
        <Link
          href="/dashboard/instellingen"
          className="text-sky-600 hover:text-sky-500 dark:text-sky-400"
        >
          Instellingen
        </Link>
        .
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {[
          { label: "IBAN", value: bedrijf.iban },
          { label: "Betalingsreferentie", value: reference },
          { label: "Vervaldatum", value: isProforma ? "—" : vervaldatum },
          { label: "BTW-nummer", value: bedrijf.btw },
        ].map((field) => (
          <div
            key={field.label}
            className="invoice-create-section rounded-lg border px-3.5 py-2.5"
          >
            <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
              {field.label}
            </p>
            <p className="mt-0.5 truncate font-mono text-sm text-zinc-800 dark:text-zinc-200">
              {field.value || "—"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );

  const bedrijfTab = (
    <div className="space-y-4">
      <p className="text-sm text-zinc-500">
        Bedrijfsgegevens op de factuur. Wijzig ze bij{" "}
        <Link
          href="/dashboard/instellingen"
          className="text-sky-600 hover:text-sky-500 dark:text-sky-400"
        >
          Instellingen
        </Link>
        .
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {[
          { label: "Bedrijfsnaam", value: bedrijf.naam },
          { label: "BTW-nummer", value: bedrijf.btw },
          { label: "Adres", value: bedrijf.adres },
          {
            label: "Stad",
            value: [bedrijf.postcode, bedrijf.stad].filter(Boolean).join(" ") || null,
          },
          { label: "E-mail", value: bedrijf.email },
          { label: "Telefoon", value: bedrijf.telefoon },
        ].map((field) => (
          <div
            key={field.label}
            className="invoice-create-section rounded-lg border px-3.5 py-2.5"
          >
            <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
              {field.label}
            </p>
            <p className="mt-0.5 truncate text-sm text-zinc-800 dark:text-zinc-200">
              {field.value || "—"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="invoice-create-view flex h-full min-h-0 flex-col overflow-hidden">
      <div className="mb-4 shrink-0">
        <FacturenSectionNav />
      </div>

      <div className="invoice-create-header mb-5 flex shrink-0 flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
              Nieuwe factuur
            </h1>
            {isDemo && <Badge variant="warning">Demo</Badge>}
          </div>
          <p className="mt-1 max-w-xl text-sm text-zinc-500 dark:text-zinc-400">
            Vul de gegevens in, bekijk de preview en verstuur naar je klant.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={loading}
            onClick={onSaveDraft}
          >
            <Save size={14} />
            Concept opslaan
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            disabled={loading}
            className="border-zinc-200 bg-zinc-100 text-zinc-950 hover:bg-white dark:border-white/20 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white"
            onClick={onSend}
          >
            {loading ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Send size={14} />
            )}
            {isProforma ? "Proforma versturen" : "Factuur versturen"}
          </Button>
        </div>
      </div>

      {error && (
        <p className="mb-3 shrink-0 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-600 dark:text-rose-300">
          {error}
        </p>
      )}

      <div className="invoice-create-grid grid min-h-0 flex-1 grid-cols-1 gap-5 overflow-hidden xl:grid-cols-2">
        <div className="invoice-create-form flex min-h-0 flex-col overflow-hidden rounded-xl border border-zinc-200/80 bg-white shadow-sm dark:border-white/10 dark:bg-zinc-900/40">
          <div className="shrink-0 border-b border-zinc-200/80 dark:border-white/10">
            <div className="flex gap-1 px-3 pt-2">
              <button
                type="button"
                onClick={() => onDocumentTypeChange("factuur")}
                className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                  documentType === "factuur"
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                }`}
              >
                Factuur
              </button>
              <button
                type="button"
                onClick={() => onDocumentTypeChange("proforma")}
                className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                  documentType === "proforma"
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                }`}
              >
                Proforma
              </button>
            </div>
            <div className="grid grid-cols-3 gap-0 px-1">
              <TabButton
                active={activeTab === "factuur"}
                onClick={() => onTabChange("factuur")}
                icon={<ReceiptText size={14} />}
                label="Factuurgegevens"
              />
              <TabButton
                active={activeTab === "betaling"}
                onClick={() => onTabChange("betaling")}
                icon={<CreditCard size={14} />}
                label="Betaling"
              />
              <TabButton
                active={activeTab === "bedrijf"}
                onClick={() => onTabChange("bedrijf")}
                icon={<Building2 size={14} />}
                label="Bedrijf"
              />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
            {activeTab === "factuur" && invoiceTab}
            {activeTab === "betaling" && paymentTab}
            {activeTab === "bedrijf" && bedrijfTab}
          </div>
        </div>

        <FactuurInvoicePreview
          templateId={documentContext.defaultTemplate}
          defaultTemplate={documentContext.defaultTemplate}
          bedrijf={bedrijf}
          customers={customers}
          customerId={customerId}
          klantVrij={klantVrij}
          documentType={documentType}
          datum={datum}
          vervaldatum={vervaldatum}
          omschrijving={omschrijving}
          notities={notities}
          lines={lines}
          nummer={reference}
        />
      </div>
    </div>
  );
}

export function getDemoInvoiceLines(): OfferteLijnInput[] {
  return [
    {
      omschrijving: "Cloud hosting services",
      aantal: 1,
      eenheid: "stuks",
      prijs_per_eenheid: 3500,
      btw_percentage: 21,
    },
    {
      omschrijving: "Data analytics report",
      aantal: 2,
      eenheid: "stuks",
      prijs_per_eenheid: 750,
      btw_percentage: 21,
    },
    {
      omschrijving: "Technical support retainer",
      aantal: 1,
      eenheid: "stuks",
      prijs_per_eenheid: 400,
      btw_percentage: 21,
    },
  ];
}
