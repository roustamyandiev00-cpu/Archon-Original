"use client";

import Link from "next/link";
import { useRef } from "react";
import {
  CalendarIcon,
  FileText,
  FolderKanban,
  GripVertical,
  Hash,
  Loader2,
  Paperclip,
  Plus,
  Save,
  Send,
  Settings,
  Trash2,
  X,
} from "lucide-react";
import StudioInvoicePreview from "@/components/dashboard/facturen/studio/StudioInvoicePreview";
import {
  buildStudioInvoiceValues,
  customerDisplayName,
  formatStudioCurrency,
  formatStudioDisplayDate,
  getInitials,
  getStudioLineAmount,
  studioInvoiceClients,
  studioInvoiceTaxOptions,
  type StudioInvoiceDiscountType,
} from "@/components/dashboard/facturen/studio/studio-invoice-data";
import type { FactuurDocumentContext } from "@/components/dashboard/facturen/FactuurForm";
import PrijslijstPicker from "@/components/dashboard/prijslijst/PrijslijstPicker";
import type { PrijslijstPickItem } from "@/components/dashboard/prijslijst/types";
import type { FacturenProjectOption } from "@/lib/facturen/load-facturen-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select } from "@/components/ui/select";
import type { BedrijfLite } from "@/lib/documentData";
import type { OfferteLijnInput } from "@/lib/offertes";

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

type TabId = "invoice" | "payment" | "business";

type Props = {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  reference: string;
  onReferenceChange: (value: string) => void;
  datum: string;
  onDatumChange: (value: string) => void;
  vervaldatum: string;
  onVervaldatumChange: (value: string) => void;
  customers: Customer[];
  customerId: string;
  onCustomerIdChange: (value: string) => void;
  klantVrij: string;
  onKlantVrijChange: (value: string) => void;
  klantNaam: string;
  klantEmail: string;
  klantAddress?: string[];
  klantTaxId?: string;
  projects?: FacturenProjectOption[];
  projectId?: string;
  onProjectIdChange?: (value: string) => void;
  pendingFiles?: File[];
  onPendingFilesChange?: (files: File[]) => void;
  lines: OfferteLijnInput[];
  onUpdateLine: (index: number, patch: Partial<OfferteLijnInput>) => void;
  onAddLine: () => void;
  onRemoveLine: (index: number) => void;
  prijslijstItems?: PrijslijstPickItem[];
  onPickPrijslijst?: (item: PrijslijstPickItem) => void;
  taxId: string;
  onTaxIdChange: (taxId: string) => void;
  discountType: StudioInvoiceDiscountType;
  onDiscountTypeChange: (type: StudioInvoiceDiscountType) => void;
  discountValue: number;
  onDiscountValueChange: (value: number) => void;
  bedrijf: BedrijfLite;
  documentContext: FactuurDocumentContext;
  loading: boolean;
  error: string | null;
  useStudioDemoFrom?: boolean;
  isDemo?: boolean;
  onSaveDraft: () => void;
  onSend: () => void;
  viewportFit?: boolean;
};

function Separator() {
  return <hr className="border-zinc-200" />;
}

function StudioTabs({
  activeTab,
  onTabChange,
}: {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}) {
  const tabs: { id: TabId; label: string }[] = [
    { id: "invoice", label: "Factuur" },
    { id: "payment", label: "Betaling" },
    { id: "business", label: "Bedrijf" },
  ];

  return (
    <div className="grid h-8 w-full grid-cols-3 rounded-lg bg-zinc-100 p-0.5">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onTabChange(tab.id)}
          className={`inline-flex items-center justify-center rounded-md px-2 text-xs font-medium transition-colors ${
            activeTab === tab.id
              ? "bg-white text-zinc-900 shadow-sm"
              : "text-zinc-500 hover:text-zinc-700"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function DatePickerField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <label htmlFor={id} className="text-[11px] text-zinc-500">
        {label}
      </label>
      <Popover>
        <PopoverTrigger asChild>
          <button
            id={id}
            type="button"
            className="flex h-8 w-full items-center justify-between rounded-lg border border-zinc-200 bg-white px-2.5 text-left text-xs font-normal text-zinc-900 hover:bg-zinc-50"
          >
            <span>{formatStudioDisplayDate(value)}</span>
            <CalendarIcon size={16} className="text-zinc-400" />
          </button>
        </PopoverTrigger>
        <PopoverContent>
          <Input
            type="date"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className="h-9"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

export default function InvoiceCreateView(props: Props) {
  const {
    activeTab,
    onTabChange,
    reference,
    onReferenceChange,
    datum,
    onDatumChange,
    vervaldatum,
    onVervaldatumChange,
    customers,
    customerId,
    onCustomerIdChange,
    klantVrij,
    onKlantVrijChange,
    klantNaam,
    klantEmail,
    klantAddress,
    klantTaxId,
    projects = [],
    projectId = "",
    onProjectIdChange,
    pendingFiles = [],
    onPendingFilesChange,
    lines,
    onUpdateLine,
    onAddLine,
    onRemoveLine,
    prijslijstItems = [],
    onPickPrijslijst,
    taxId,
    onTaxIdChange,
    discountType,
    onDiscountTypeChange,
    discountValue,
    onDiscountValueChange,
    bedrijf,
    loading,
    error,
    useStudioDemoFrom,
    isDemo,
    onSaveDraft,
    onSend,
  } = props;

  const fileInputRef = useRef<HTMLInputElement>(null);

  const studioInvoice = buildStudioInvoiceValues({
    reference,
    datum,
    vervaldatum,
    bedrijf,
    klantNaam,
    klantEmail,
    klantAddress,
    klantTaxId,
    taxId,
    discountType,
    discountValue,
    lines,
    useStudioDemoFrom,
  });

  const selectValue = customerId
    ? customerId
    : isDemo && studioInvoiceClients.some((c) => c.name === klantNaam)
      ? studioInvoiceClients.find((c) => c.name === klantNaam)!.id
      : klantVrij
        ? "custom"
        : "";

  const invoiceTab = (
    <>
      <section className="flex flex-col gap-2">
        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-end">
          <div className="flex flex-col gap-0.5">
            <label htmlFor="reference-number" className="text-[11px] text-zinc-500">
              Referentie
            </label>
            <div className="relative">
              <Input
                id="reference-number"
                value={reference}
                onChange={(event) => onReferenceChange(event.target.value)}
                className="h-8 pr-8 font-mono text-xs"
                placeholder="Wordt automatisch toegekend"
              />
              <Hash
                size={14}
                className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400"
              />
            </div>
          </div>
          <DatePickerField
            id="issued-date"
            label="Factuurdatum"
            value={datum}
            onChange={onDatumChange}
          />
          <DatePickerField
            id="payment-due-date"
            label="Vervaldatum"
            value={vervaldatum}
            onChange={onVervaldatumChange}
          />
        </div>
      </section>

      <Separator />

      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-medium tracking-tight text-zinc-900">
            Gefactureerd aan
          </h2>
          <Link
            href="/dashboard/contacten"
            className="inline-flex h-7 items-center gap-1 rounded-md px-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
          >
            <Plus size={14} />
            Nieuwe klant
          </Link>
        </div>

        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="flex flex-col gap-0.5">
            <label htmlFor="client-select" className="text-[11px] text-zinc-500">
              Klant
            </label>
            {isDemo ? (
              <Select
                id="client-select"
                value={selectValue}
                onChange={(event) => {
                  const nextClient = studioInvoiceClients.find(
                    (client) => client.id === event.target.value,
                  );
                  if (nextClient) {
                    onCustomerIdChange("");
                    onKlantVrijChange(nextClient.name);
                  }
                }}
                className="h-8 text-xs"
              >
                {studioInvoiceClients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </Select>
            ) : (
              <Select
                id="client-select"
                value={selectValue}
                onChange={(event) => {
                  const v = event.target.value;
                  if (v === "" || v === "custom") {
                    onCustomerIdChange("");
                    return;
                  }
                  onCustomerIdChange(v);
                }}
                className="h-8 text-xs"
              >
                <option value="">Kies een klant…</option>
                {customers.map((c) => {
                  const label = customerDisplayName(c);
                  return (
                    <option key={c.id} value={String(c.id)}>
                      {label}
                      {c.email ? ` — ${c.email}` : ""}
                    </option>
                  );
                })}
                {selectValue === "custom" ? (
                  <option value="custom">{klantNaam}</option>
                ) : null}
              </Select>
            )}
          </div>

          {!isDemo && !customerId ? (
            <div className="flex flex-col gap-0.5">
              <label className="text-[11px] text-zinc-500">Of typ naam</label>
              <Input
                value={klantVrij}
                onChange={(e) => onKlantVrijChange(e.target.value)}
                placeholder="Klantnaam"
                className="h-8 text-xs"
              />
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1.5">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-zinc-900 text-[10px] font-semibold text-white">
                {getInitials(klantNaam).slice(0, 2) || "—"}
              </span>
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-zinc-900">
                  {klantNaam}
                </p>
                <p className="truncate text-[11px] text-zinc-500">{klantEmail}</p>
              </div>
            </div>
          )}
        </div>

        {onProjectIdChange && (
          <div className="flex flex-col gap-0.5">
            <label htmlFor="project-select" className="text-[11px] text-zinc-500">
              Project / werf (optioneel)
            </label>
            <div className="relative">
              <Select
                id="project-select"
                value={projectId}
                onChange={(e) => onProjectIdChange(e.target.value)}
                className="h-8 pl-8 text-xs"
              >
                <option value="">Geen project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.naam}
                  </option>
                ))}
              </Select>
              <FolderKanban
                size={13}
                className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400"
              />
            </div>
          </div>
        )}
      </section>

      <Separator />

      <section className="flex min-h-0 flex-1 flex-col gap-2">
        <div className="flex shrink-0 items-center justify-between gap-2">
          <h2 className="text-sm font-medium tracking-tight text-zinc-900">
            Factuurlijnen
          </h2>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 border-transparent px-1.5 text-xs text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
            onClick={onAddLine}
          >
            <Plus size={14} />
            Regel
          </Button>
        </div>

        {onPickPrijslijst ? (
          <div className="shrink-0">
            <PrijslijstPicker
              items={prijslijstItems}
              onPick={onPickPrijslijst}
              variant="light"
            />
          </div>
        ) : null}

        <div className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto overscroll-contain">
          <div className="hidden items-center gap-2 px-1 text-[11px] font-medium text-zinc-500 md:grid md:grid-cols-[20px_minmax(0,1fr)_56px_96px_88px_28px]">
            <span />
            <span>Omschrijving</span>
            <span className="px-1">Aantal</span>
            <span className="px-1">Prijs</span>
            <span className="text-right">Totaal</span>
            <span />
          </div>

          <div className="flex flex-col gap-1.5">
            {lines.map((line, index) => {
              const item = {
                id: `line-${index}`,
                description: line.omschrijving,
                quantity: Number(line.aantal) || 0,
                unitPrice: Number(line.prijs_per_eenheid) || 0,
              };

              return (
                <div
                  key={index}
                  className="grid min-w-0 grid-cols-[20px_minmax(0,1fr)_56px_96px_88px_28px] items-center gap-1.5"
                >
                  <button
                    type="button"
                    aria-label={`Regel ${index + 1} verplaatsen`}
                    className="grid h-7 w-5 place-items-center text-zinc-400"
                  >
                    <GripVertical size={14} />
                  </button>
                  <Input
                    value={line.omschrijving}
                    onChange={(event) =>
                      onUpdateLine(index, { omschrijving: event.target.value })
                    }
                    aria-label={`Regel ${index + 1} omschrijving`}
                    className="h-8 min-w-0 text-xs"
                  />
                  <Input
                    type="number"
                    step="1"
                    min={0}
                    value={line.aantal}
                    onChange={(event) =>
                      onUpdateLine(index, { aantal: Number(event.target.value) })
                    }
                    aria-label={`Regel ${index + 1} aantal`}
                    className="h-8 text-xs"
                  />
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    value={line.prijs_per_eenheid}
                    onChange={(event) =>
                      onUpdateLine(index, {
                        prijs_per_eenheid: Number(event.target.value),
                      })
                    }
                    aria-label={`Regel ${index + 1} eenheidsprijs`}
                    className="h-8 text-xs"
                  />
                  <div className="min-w-0 text-right text-xs font-medium text-zinc-900">
                    {formatStudioCurrency(getStudioLineAmount(item))}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    aria-label={`Regel ${index + 1} verwijderen`}
                    onClick={() => onRemoveLine(index)}
                    disabled={lines.length === 1}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <Separator />

      <section className="grid shrink-0 gap-2 sm:grid-cols-3">
        <div className="flex flex-col gap-0.5">
          <label htmlFor="tax-select" className="text-[11px] text-zinc-500">
            BTW
          </label>
          <Select
            id="tax-select"
            value={taxId}
            onChange={(event) => onTaxIdChange(event.target.value)}
            className="h-8 text-xs"
          >
            {studioInvoiceTaxOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name} {option.rate}%
              </option>
            ))}
          </Select>
        </div>
        <div className="flex flex-col gap-0.5">
          <label htmlFor="discount-type" className="text-[11px] text-zinc-500">
            Kortingstype
          </label>
          <Select
            id="discount-type"
            value={discountType}
            onChange={(event) =>
              onDiscountTypeChange(event.target.value as StudioInvoiceDiscountType)
            }
            className="h-8 text-xs"
          >
            <option value="fixed">Vast bedrag</option>
            <option value="percent">Percentage</option>
          </Select>
        </div>
        <div className="flex flex-col gap-0.5">
          <label htmlFor="discount-value" className="text-[11px] text-zinc-500">
            Korting
          </label>
          <Input
            id="discount-value"
            type="number"
            min={0}
            step="0.01"
            value={discountValue}
            onChange={(event) =>
              onDiscountValueChange(Number(event.target.value) || 0)
            }
            className="h-8 text-xs"
          />
        </div>
      </section>

      {onPendingFilesChange ? (
        <>
          <Separator />
          <section className="flex shrink-0 flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-medium tracking-tight text-zinc-900">
                Bijlagen
              </h2>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 border-transparent px-1.5 text-xs text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip size={13} />
                Uploaden
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                className="hidden"
                onChange={(e) => {
                  const files = Array.from(e.target.files ?? []);
                  if (files.length) {
                    onPendingFilesChange([...pendingFiles, ...files]);
                  }
                  e.target.value = "";
                }}
              />
            </div>
            {pendingFiles.length > 0 ? (
              <ul className="flex flex-wrap gap-1">
                {pendingFiles.map((f, i) => (
                  <li
                    key={`${f.name}-${i}`}
                    className="inline-flex max-w-full items-center gap-1 rounded-md border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 text-[11px] text-zinc-700"
                  >
                    <FileText size={11} className="shrink-0 text-zinc-400" />
                    <span className="truncate">{f.name}</span>
                    <button
                      type="button"
                      className="shrink-0 text-zinc-400 hover:text-rose-500"
                      aria-label="Verwijderen"
                      onClick={() =>
                        onPendingFilesChange(
                          pendingFiles.filter((_, idx) => idx !== i),
                        )
                      }
                    >
                      <X size={12} />
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        </>
      ) : null}
    </>
  );

  const paymentTab = (
    <div className="space-y-4">
      <p className="text-xs text-zinc-500">
        Betalingsgegevens uit je bedrijfsinstellingen.{" "}
        <Link
          href="/dashboard/instellingen"
          className="inline-flex items-center gap-1 font-medium text-zinc-800 underline-offset-2 hover:underline"
        >
          <Settings size={12} />
          Bewerken
        </Link>
      </p>
      <section className="grid gap-3 sm:grid-cols-2">
        {[
          { label: "Rekeninghouder", value: studioInvoice.from.paymentAccountName },
          { label: "IBAN", value: studioInvoice.from.routingNumber },
          { label: "Referentie", value: reference },
          {
            label: "Vervaldatum",
            value: formatStudioDisplayDate(vervaldatum),
          },
        ].map((field) => (
          <div
            key={field.label}
            className="rounded-lg border border-zinc-200 px-3.5 py-2.5"
          >
            <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
              {field.label}
            </p>
            <p className="mt-0.5 truncate font-mono text-sm text-zinc-800">
              {field.value || "—"}
            </p>
          </div>
        ))}
      </section>
    </div>
  );

  const businessTab = (
    <div className="space-y-4">
      <p className="text-xs text-zinc-500">
        Jouw bedrijfsgegevens op de factuur.{" "}
        <Link
          href="/dashboard/instellingen"
          className="inline-flex items-center gap-1 font-medium text-zinc-800 underline-offset-2 hover:underline"
        >
          <Settings size={12} />
          Instellingen
        </Link>
      </p>
      <section className="grid gap-3 sm:grid-cols-2">
        {[
          { label: "Bedrijfsnaam", value: studioInvoice.from.name },
          { label: "BTW-nummer", value: studioInvoice.from.taxId },
          { label: "E-mail", value: studioInvoice.from.email },
          { label: "Telefoon", value: studioInvoice.from.phone },
          {
            label: "Adres",
            value: studioInvoice.from.addressLines.join(", "),
          },
          { label: "IBAN", value: studioInvoice.from.routingNumber },
        ].map((field) => (
          <div
            key={field.label}
            className="rounded-lg border border-zinc-200 px-3.5 py-2.5"
          >
            <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
              {field.label}
            </p>
            <p className="mt-0.5 truncate text-sm text-zinc-800">
              {field.value || "—"}
            </p>
          </div>
        ))}
      </section>
    </div>
  );

  return (
    <div className="studio-invoice-create flex h-full min-h-0 flex-col gap-2 overflow-hidden">
      <div className="flex shrink-0 items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-lg font-medium leading-none tracking-tight text-zinc-900">
            Nieuwe factuur
          </h1>
          <p className="mt-0.5 truncate text-xs text-zinc-500">
            Gegevens links · live preview rechts
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={loading}
            className="h-8 border border-zinc-200 bg-white px-2.5 text-xs text-zinc-900 hover:bg-zinc-50"
            onClick={onSaveDraft}
          >
            <Save size={14} />
            Concept
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            disabled={loading}
            className="h-8 border-zinc-900 bg-zinc-900 px-2.5 text-xs text-white hover:bg-zinc-800"
            onClick={onSend}
          >
            {loading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Send size={14} />
            )}
            Factuur maken
          </Button>
        </div>
      </div>

      {error ? (
        <p className="shrink-0 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs text-rose-600">
          {error}
        </p>
      ) : null}

      <div className="grid min-h-0 flex-1 gap-2.5 overflow-hidden xl:grid-cols-2 xl:items-stretch">
        <div className="studio-invoice-form flex h-full min-h-0 flex-col gap-2 overflow-hidden rounded-xl border border-zinc-200/80 bg-white p-2.5 shadow-sm sm:p-3">
          <StudioTabs activeTab={activeTab} onTabChange={onTabChange} />
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            {activeTab === "invoice" ? (
              <div className="flex h-full min-h-0 flex-col gap-2 overflow-hidden">
                {invoiceTab}
              </div>
            ) : null}
            {activeTab === "payment" ? (
              <div className="min-h-0 flex-1 overflow-y-auto">{paymentTab}</div>
            ) : null}
            {activeTab === "business" ? (
              <div className="min-h-0 flex-1 overflow-y-auto">{businessTab}</div>
            ) : null}
          </div>
        </div>

        <StudioInvoicePreview invoice={studioInvoice} />
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
