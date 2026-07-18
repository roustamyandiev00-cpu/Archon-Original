"use client";

import Link from "next/link";
import { useRef } from "react";
import {
  AlertTriangle,
  CalendarIcon,
  CheckCircle2,
  ExternalLink,
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
  Sparkles,
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
import { useAgentChat } from "@/components/dashboard/agent-chat/AgentChatProvider";

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
  return <hr className="border-white/10" />;
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
    <div className="grid h-8 w-full grid-cols-3 rounded-lg border border-white/10 bg-zinc-950/60 p-0.5">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onTabChange(tab.id)}
          className={`inline-flex items-center justify-center rounded-md px-2 text-xs font-medium transition-colors ${
            activeTab === tab.id
              ? "bg-sky-500/15 text-sky-100 shadow-sm ring-1 ring-sky-500/30"
              : "text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-200"
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
            className="flex h-8 w-full items-center justify-between rounded-lg border border-white/10 bg-zinc-950/55 px-2.5 text-left text-xs font-normal text-zinc-100 hover:bg-white/[0.04]"
          >
            <span>{formatStudioDisplayDate(value)}</span>
            <CalendarIcon size={16} className="text-zinc-500" />
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
  const { activeAgent, isTyping: aiIsTyping, open: openAgentChat, sendMessage } =
    useAgentChat();

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

  const paymentMissing = [
    !studioInvoice.from.paymentAccountName ? "rekeninghouder" : null,
    !studioInvoice.from.routingNumber ? "IBAN" : null,
    !vervaldatum ? "vervaldatum" : null,
  ].filter((item): item is string => Boolean(item));

  const businessMissing = [
    !studioInvoice.from.name ? "bedrijfsnaam" : null,
    !studioInvoice.from.taxId ? "BTW-nummer" : null,
    !studioInvoice.from.email ? "e-mailadres" : null,
    studioInvoice.from.addressLines.length === 0 ? "adres" : null,
  ].filter((item): item is string => Boolean(item));

  function handleAskAiForTips() {
    const lineSummary = lines
      .filter(
        (line) =>
          line.omschrijving.trim() || Number(line.prijs_per_eenheid) > 0,
      )
      .map(
        (line, index) =>
          `${index + 1}. ${line.omschrijving || "Zonder omschrijving"} — ${Number(line.aantal) || 0} ${line.eenheid || "stuks"} × €${Number(line.prijs_per_eenheid || 0).toFixed(2)} (${Number(line.btw_percentage || 0)}% btw)`,
      )
      .join("\n");

    openAgentChat();
    sendMessage(
      [
        "Ik ben bezig met een nieuwe factuur. Controleer de huidige invoer en geef maximaal vijf concrete tips over ontbrekende gegevens, duidelijke regelomschrijvingen, btw en betaalvoorwaarden.",
        "Maak niets aan, wijzig niets en verstuur niets; geef alleen advies dat ik zelf kan toepassen.",
        `Klant: ${klantNaam || "nog niet gekozen"}`,
        `Project: ${projects.find((project) => project.id === projectId)?.naam || "geen project gekozen"}`,
        `Factuurdatum: ${datum || "ontbreekt"}`,
        `Vervaldatum: ${vervaldatum || "ontbreekt"}`,
        `Betalingsgegevens ontbreken: ${paymentMissing.join(", ") || "niets"}`,
        `Bedrijfsgegevens ontbreken: ${businessMissing.join(", ") || "niets"}`,
        `Korting: ${discountValue || 0} (${discountType === "percent" ? "procent" : "vast bedrag"})`,
        `Factuurlijnen:\n${lineSummary || "nog geen ingevulde factuurlijnen"}`,
      ].join("\n"),
    );
  }

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
          <h2 className="text-sm font-medium tracking-tight text-zinc-100">
            Gefactureerd aan
          </h2>
          <Link
            href="/dashboard/contacten"
            className="inline-flex h-7 items-center gap-1 rounded-md px-1.5 text-xs font-medium text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-100"
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
            <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-zinc-950/50 px-2.5 py-1.5">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-sky-500/20 text-[10px] font-semibold text-sky-200 ring-1 ring-sky-500/30">
                {getInitials(klantNaam).slice(0, 2) || "—"}
              </span>
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-zinc-100">
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
          <h2 className="text-sm font-medium tracking-tight text-zinc-100">
            Factuurlijnen
          </h2>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 border-transparent px-1.5 text-xs text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-100"
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
              variant="dark"
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
                  <div className="min-w-0 text-right text-xs font-medium text-zinc-100">
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
              <h2 className="text-sm font-medium tracking-tight text-zinc-100">
                Bijlagen
              </h2>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 border-transparent px-1.5 text-xs text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-100"
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
                    className="inline-flex max-w-full items-center gap-1 rounded-md border border-white/10 bg-zinc-950/50 px-1.5 py-0.5 text-[11px] text-zinc-300"
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
      <div className="flex flex-col gap-3 rounded-lg border border-white/10 bg-zinc-950/40 p-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-100">
            Betalingsgegevens controleren
          </p>
          <p className="mt-1 text-xs leading-relaxed text-zinc-500">
            De vervaldatum geldt voor deze factuur. Rekeninghouder en IBAN
            komen uit je bedrijfsinstellingen.
          </p>
        </div>
        <span
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] font-semibold ${
            paymentMissing.length === 0
              ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-300"
              : "border-amber-500/25 bg-amber-500/10 text-amber-300"
          }`}
        >
          {paymentMissing.length === 0 ? (
            <CheckCircle2 size={12} />
          ) : (
            <AlertTriangle size={12} />
          )}
          {paymentMissing.length === 0
            ? "Klaar"
            : `${paymentMissing.length} ontbrekend`}
        </span>
      </div>

      <section className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-white/10 bg-zinc-950/40 px-3.5 py-2.5">
          <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
            Rekeninghouder
          </p>
          <p className="mt-0.5 truncate text-sm text-zinc-200">
            {studioInvoice.from.paymentAccountName || "Niet ingesteld"}
          </p>
        </div>
        <div className="rounded-lg border border-white/10 bg-zinc-950/40 px-3.5 py-2.5">
          <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
            IBAN
          </p>
          <p className="mt-0.5 truncate font-mono text-sm text-zinc-200">
            {studioInvoice.from.routingNumber || "Niet ingesteld"}
          </p>
        </div>
        <div className="flex flex-col gap-0.5">
          <label className="text-[11px] text-zinc-500">
            Voorbeeldreferentie
          </label>
          <div className="flex h-8 items-center rounded-lg border border-white/10 bg-zinc-950/40 px-2.5 font-mono text-xs text-zinc-300">
            {reference || "Wordt toegekend bij opslaan"}
          </div>
        </div>
        <DatePickerField
          id="payment-tab-due-date"
          label="Vervaldatum"
          value={vervaldatum}
          onChange={onVervaldatumChange}
        />
      </section>

      {paymentMissing.length > 0 ? (
        <p className="rounded-lg border border-amber-500/20 bg-amber-500/[0.07] px-3 py-2 text-xs text-amber-200">
          Nog instellen: {paymentMissing.join(", ")}.
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Link
          href="/dashboard/instellingen?tab=bedrijf"
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 text-xs font-medium text-zinc-200 hover:bg-white/[0.08]"
        >
          <Settings size={13} />
          IBAN aanpassen
          <ExternalLink size={11} />
        </Link>
        <Link
          href="/dashboard/instellingen?tab=documenten"
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 text-xs font-medium text-zinc-200 hover:bg-white/[0.08]"
        >
          <Settings size={13} />
          Betaalvoorwaarden
          <ExternalLink size={11} />
        </Link>
      </div>
    </div>
  );

  const businessTab = (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-lg border border-white/10 bg-zinc-950/40 p-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-100">
            Bedrijfsgegevens op de factuur
          </p>
          <p className="mt-1 text-xs leading-relaxed text-zinc-500">
            Controleer je wettelijke afzendergegevens. Aanpassingen gelden voor
            alle toekomstige documenten.
          </p>
        </div>
        <span
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] font-semibold ${
            businessMissing.length === 0
              ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-300"
              : "border-amber-500/25 bg-amber-500/10 text-amber-300"
          }`}
        >
          {businessMissing.length === 0 ? (
            <CheckCircle2 size={12} />
          ) : (
            <AlertTriangle size={12} />
          )}
          {businessMissing.length === 0
            ? "Volledig"
            : `${businessMissing.length} ontbrekend`}
        </span>
      </div>
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
            className="rounded-lg border border-white/10 bg-zinc-950/40 px-3.5 py-2.5"
          >
            <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
              {field.label}
            </p>
            <p className="mt-0.5 truncate text-sm text-zinc-200">
              {field.value || "—"}
            </p>
          </div>
        ))}
      </section>
      {businessMissing.length > 0 ? (
        <p className="rounded-lg border border-amber-500/20 bg-amber-500/[0.07] px-3 py-2 text-xs text-amber-200">
          Nog aanvullen: {businessMissing.join(", ")}.
        </p>
      ) : null}
      <Link
        href="/dashboard/instellingen?tab=bedrijf"
        target="_blank"
        rel="noreferrer"
        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 text-xs font-medium text-zinc-200 hover:bg-white/[0.08]"
      >
        <Settings size={13} />
        Bedrijfsgegevens aanpassen
        <ExternalLink size={11} />
      </Link>
    </div>
  );

  return (
    <div className="studio-invoice-create flex h-full min-h-0 flex-col gap-2 overflow-hidden">
      <div className="flex shrink-0 items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-lg font-medium leading-none tracking-tight text-zinc-50">
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
            disabled={loading || aiIsTyping}
            className="h-8 border border-violet-500/20 bg-violet-500/[0.07] px-2.5 text-xs text-violet-200 hover:bg-violet-500/15"
            onClick={handleAskAiForTips}
            title={`Vraag ${activeAgent.name} om de huidige factuur te controleren`}
          >
            {aiIsTyping ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Sparkles size={14} />
            )}
            <span className="hidden sm:inline">Vraag AI om tips</span>
            <span className="sm:hidden">AI-tips</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={loading}
            className="h-8 border border-white/10 bg-white/[0.04] px-2.5 text-xs text-zinc-200 hover:bg-white/[0.08]"
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
            className="h-8 border-sky-500/40 bg-sky-500/15 px-2.5 text-xs text-sky-100 hover:bg-sky-500/25"
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
        <p className="shrink-0 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs text-rose-300">
          {error}
        </p>
      ) : null}

      <p className="sr-only" aria-live="polite">
        {aiIsTyping
          ? `${activeAgent.name} controleert de huidige factuur.`
          : ""}
      </p>

      <div className="grid min-h-0 flex-1 gap-2.5 overflow-hidden xl:grid-cols-2 xl:items-stretch">
        <div className="studio-invoice-form flex h-full min-h-0 flex-col gap-2 overflow-hidden rounded-xl border border-white/10 bg-zinc-950/50 p-2.5 shadow-none sm:p-3">
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
