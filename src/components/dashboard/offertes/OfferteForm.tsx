"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Check,
  ChevronDown,
  Copy,
  ImageIcon,
  Loader2,
  Plus,
  Send,
  Trash2,
  Upload,
  UserPlus,
  X,
} from "lucide-react";
import SendOfferteModal from "@/components/dashboard/offertes/SendOfferteModal";
import OfferteDocumentPreview from "@/components/dashboard/offertes/OfferteDocumentPreview";
import PrijslijstPicker from "@/components/dashboard/prijslijst/PrijslijstPicker";
import type { PrijslijstPickItem } from "@/components/dashboard/prijslijst/types";
import { Combobox } from "@/components/ui/combobox";
import { createOfferte, updateOfferte } from "@/app/dashboard/offertes/actions";
import { createKlant } from "@/app/dashboard/contacten/actions";
import { uploadProjectBestanden } from "@/app/dashboard/offertes/projecten/bestanden-actions";
import {
  formatEuro,
  lineTotals,
  statusMeta,
  type OfferteLijnInput,
  type OfferteStatus,
  validateOfferteInput,
} from "@/lib/offertes";
import type { BedrijfLite } from "@/lib/documentData";

export type OfferteFormCustomer = {
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

export type OfferteDocumentContext = {
  defaultTemplate: string;
  templateId?: string;
  bedrijf: BedrijfLite;
};

export type OfferteFormInitial = {
  customerId: string;
  klantVrij: string;
  datum: string;
  geldigTot: string;
  notes: string;
  projectNaam?: string;
  afmetingen?: string;
  lines: OfferteLijnInput[];
};

const emptyLine: OfferteLijnInput = {
  omschrijving: "",
  aantal: 1,
  eenheid: "stuks",
  prijs_per_eenheid: 0,
  btw_percentage: 21,
};

const fieldClass =
  "h-11 w-full rounded-xl border border-white/10 bg-zinc-900/70 px-3 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-500 focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/20";
const fieldInvalidClass =
  "border-rose-500/50 focus:border-rose-500/70 focus:ring-rose-500/20";
const labelClass = "mb-1.5 block text-sm font-medium text-zinc-200";
const sectionClass =
  "rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-5";

function today() {
  return new Date().toISOString().slice(0, 10);
}
function plusDays(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function approxDataUrlBytes(dataUrl: string) {
  const comma = dataUrl.indexOf(",");
  const b64 = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
  return Math.round((b64.length * 3) / 4);
}

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export default function OfferteForm({
  customers,
  documentContext,
  offerteId,
  initial,
  seedDraft,
  nummer,
  prijslijstItems = [],
  status = "concept",
  hideBackLink = false,
  onBack,
}: {
  customers: OfferteFormCustomer[];
  documentContext: OfferteDocumentContext;
  offerteId?: number;
  initial?: OfferteFormInitial;
  seedDraft?: OfferteFormInitial;
  nummer?: string;
  prijslijstItems?: PrijslijstPickItem[];
  status?: string;
  hideBackLink?: boolean;
  onBack?: () => void;
}) {
  const router = useRouter();
  const [savedOfferteId, setSavedOfferteId] = useState<number>();
  const [savedNummer, setSavedNummer] = useState<string>();
  const workingId = savedOfferteId ?? offerteId;
  const workingNummer = savedNummer ?? nummer;
  const isEdit = typeof workingId === "number";
  const backHref = isEdit
    ? `/dashboard/offertes/${workingId}`
    : "/dashboard/offertes";

  const [customerId, setCustomerId] = useState(initial?.customerId ?? "");
  const [klantVrij, setKlantVrij] = useState(initial?.klantVrij ?? "");
  const [datum, setDatum] = useState(initial?.datum ?? today());
  const [geldigTot, setGeldigTot] = useState(
    initial?.geldigTot ?? plusDays(30),
  );
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [projectNaam, setProjectNaam] = useState(initial?.projectNaam ?? "");
  const [afmetingen, setAfmetingen] = useState(initial?.afmetingen ?? "");
  const [lines, setLines] = useState<OfferteLijnInput[]>(
    initial?.lines && initial.lines.length > 0
      ? initial.lines.map((l) => ({ ...l }))
      : [{ ...emptyLine }],
  );
  const [addedCustomers, setAddedCustomers] = useState<OfferteFormCustomer[]>(
    [],
  );
  const [newKlantOpen, setNewKlantOpen] = useState(false);
  const [newKlantName, setNewKlantName] = useState("");
  const [newKlantEmail, setNewKlantEmail] = useState("");
  const [newKlantPhone, setNewKlantPhone] = useState("");
  const [newKlantAddress, setNewKlantAddress] = useState("");
  const [newKlantBtw, setNewKlantBtw] = useState("");
  const [newKlantBusy, setNewKlantBusy] = useState(false);
  const [notesOpen, setNotesOpen] = useState(Boolean(initial?.notes));
  const [pendingFiles, setPendingFiles] = useState<
    { name: string; dataUrl: string; size: number }[]
  >([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [sendAfterSave, setSendAfterSave] = useState(false);
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  const statusInfo = statusMeta(status as OfferteStatus);

  const previewNotes = useMemo(() => {
    const parts: string[] = [];
    if (projectNaam.trim()) parts.push(`Project: ${projectNaam.trim()}`);
    if (afmetingen.trim()) parts.push(`Afmetingen: ${afmetingen.trim()}`);
    if (notes.trim()) parts.push(notes.trim());
    return parts.join("\n");
  }, [afmetingen, notes, projectNaam]);

  const customerList = useMemo(() => {
    const addedIds = new Set(addedCustomers.map((customer) => customer.id));
    return [
      ...addedCustomers,
      ...customers.filter((customer) => !addedIds.has(customer.id)),
    ];
  }, [addedCustomers, customers]);

  useEffect(() => {
    if (!seedDraft) return;
    const id = window.setTimeout(() => {
      setCustomerId(seedDraft.customerId);
      setKlantVrij(seedDraft.klantVrij);
      setDatum(seedDraft.datum);
      setGeldigTot(seedDraft.geldigTot);

      let cleanNotes = seedDraft.notes;
      if (
        cleanNotes.includes("Project Naam:") &&
        cleanNotes.includes("Beschrijving werkzaamheden:")
      ) {
        const match = cleanNotes.match(
          /Beschrijving werkzaamheden:\s*([\s\S]*)/i,
        );
        if (match?.[1]) cleanNotes = match[1].trim();
      }
      setNotes(cleanNotes);
      setNotesOpen(Boolean(cleanNotes.trim()));
      setProjectNaam(seedDraft.projectNaam ?? "");
      setAfmetingen(seedDraft.afmetingen ?? "");
      setLines(
        seedDraft.lines.map((l) => {
          let desc = l.omschrijving;
          if (
            desc.includes("Project Naam:") &&
            desc.includes("Beschrijving werkzaamheden:")
          ) {
            const match = desc.match(
              /Beschrijving werkzaamheden:\s*([\s\S]*)/i,
            );
            desc =
              match?.[1]?.trim() || "Werken volgens beschrijving";
          }
          return { ...l, omschrijving: desc };
        }),
      );
    }, 0);
    return () => window.clearTimeout(id);
  }, [seedDraft]);

  const totals = useMemo(() => lineTotals(lines), [lines]);

  const btwByRate = useMemo(() => {
    const map = new Map<number, number>();
    for (const l of lines) {
      const rate = Number(l.btw_percentage) || 0;
      const base = (Number(l.aantal) || 0) * (Number(l.prijs_per_eenheid) || 0);
      map.set(rate, (map.get(rate) ?? 0) + (base * rate) / 100);
    }
    return [...map.entries()]
      .filter(([, amount]) => amount > 0 || map.size === 1)
      .sort((a, b) => a[0] - b[0]);
  }, [lines]);

  const selectedCustomer = customerList.find(
    (c) => String(c.id) === customerId,
  );
  const klantName = selectedCustomer?.name?.trim() || klantVrij.trim();
  const validationIssues = validateOfferteInput({
    klant: klantName,
    datum,
    geldigTot,
    lines,
  });
  const canSave = validationIssues.length === 0;
  const canSend =
    canSave &&
    Boolean(selectedCustomer?.email?.trim() || klantName);
  const issueFor = (field: string) =>
    touched
      ? validationIssues.find((issue) => issue.field === field)?.message
      : undefined;

  const customerOptions = useMemo(
    () =>
      customerList.map((c) => ({
        value: String(c.id),
        label: c.company_name
          ? `${c.name} (${c.company_name})`
          : c.name,
        description: [c.email, c.phone].filter(Boolean).join(" · ") || undefined,
      })),
    [customerList],
  );

  function updateLine(i: number, patch: Partial<OfferteLijnInput>) {
    setLines((ls) => ls.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }
  function addLine() {
    setLines((ls) => [...ls, { ...emptyLine }]);
  }
  function duplicateLine(i: number) {
    setLines((ls) => {
      const copy = { ...ls[i] };
      return [...ls.slice(0, i + 1), copy, ...ls.slice(i + 1)];
    });
  }
  function removeLine(i: number) {
    setLines((ls) => (ls.length === 1 ? ls : ls.filter((_, idx) => idx !== i)));
  }
  function addFromPrijslijst(item: PrijslijstPickItem) {
    const next: OfferteLijnInput = {
      omschrijving: item.omschrijving,
      aantal: 1,
      eenheid: item.eenheid || "stuks",
      prijs_per_eenheid: item.prijs,
      btw_percentage: item.btwPercentage,
    };
    setLines((ls) => {
      const last = ls[ls.length - 1];
      const lastEmpty =
        last &&
        last.omschrijving.trim() === "" &&
        Number(last.prijs_per_eenheid) === 0;
      if (lastEmpty) return [...ls.slice(0, -1), next];
      return [...ls, next];
    });
  }

  async function handleCreateKlant() {
    const name = newKlantName.trim();
    if (!name) {
      setError("Vul een klantnaam in.");
      return;
    }
    setNewKlantBusy(true);
    setError(null);
    const res = await createKlant({
      name,
      email: newKlantEmail.trim() || undefined,
      phone: newKlantPhone.trim() || undefined,
      address: newKlantAddress.trim() || undefined,
      btw: newKlantBtw.trim() || undefined,
    });
    setNewKlantBusy(false);
    if ("error" in res && res.error) {
      setError(res.error);
      return;
    }
    if ("id" in res && res.id) {
      const id = res.id as number;
      setAddedCustomers((prev) => [
        {
          id,
          name,
          company_name: null,
          email: newKlantEmail.trim() || null,
          phone: newKlantPhone.trim() || null,
          address: newKlantAddress.trim() || null,
          btw: newKlantBtw.trim() || null,
        },
        ...prev,
      ]);
      setCustomerId(String(id));
      setKlantVrij("");
      setNewKlantOpen(false);
      setNewKlantName("");
      setNewKlantEmail("");
      setNewKlantPhone("");
      setNewKlantAddress("");
      setNewKlantBtw("");
      setSuccess("Klant toegevoegd.");
    }
  }

  function addFiles(fileList: FileList | File[] | null) {
    const files = fileList ? Array.from(fileList) : [];
    const allowedExtensions = /\.(jpe?g|png|pdf)$/i;
    const rejected = files.filter(
      (file) =>
        file.size > 15 * 1024 * 1024 || !allowedExtensions.test(file.name),
    );
    const accepted = files
      .filter(
        (file) =>
          file.size <= 15 * 1024 * 1024 && allowedExtensions.test(file.name),
      )
      .slice(0, Math.max(0, 20 - pendingFiles.length));

    if (rejected.length > 0 || accepted.length < files.length - rejected.length) {
      setError(
        "Sommige bestanden zijn geweigerd. Gebruik maximaal 20 JPG-, PNG- of PDF-bestanden van maximaal 15 MB.",
      );
    }

    accepted.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setPendingFiles((prev) => [
          ...prev,
          {
            name: file.name,
            dataUrl,
            size: file.size || approxDataUrlBytes(dataUrl),
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  }

  function validateForSave(): string | null {
    return validationIssues[0]?.message ?? null;
  }

  function validateForSend(): string | null {
    const base = validateForSave();
    if (base) return base;
    if (selectedCustomer && !selectedCustomer.email?.trim()) {
      return "De geselecteerde klant heeft geen e-mailadres. Vul dit aan of verstuur via de deelopties.";
    }
    return null;
  }

  async function persist(andSend: boolean) {
    setTouched(true);
    setError(null);
    setSuccess(null);

    const validation = andSend ? validateForSend() : validateForSave();
    if (validation) {
      setError(validation);
      return;
    }

    setLoading(true);
    if (andSend) setSendAfterSave(true);

    const payload = {
      customerId: selectedCustomer ? selectedCustomer.id : null,
      klant: klantName,
      datum,
      geldigTot,
      notes,
      lines,
      projectNaam: projectNaam.trim() || null,
      afmetingen: afmetingen.trim() || null,
    };

    const res = isEdit
      ? await updateOfferte({ id: workingId!, ...payload })
      : await createOfferte(payload);

    if ("error" in res && res.error) {
      setError(res.error);
      setLoading(false);
      setSendAfterSave(false);
      return;
    }

    if ("id" in res && res.id) {
      setSavedOfferteId(res.id);
      if ("nummer" in res && typeof res.nummer === "string") {
        setSavedNummer(res.nummer);
      }

      if (pendingFiles.length > 0) {
        const failedFiles: typeof pendingFiles = [];
        for (const pendingFile of pendingFiles) {
          const response = await fetch(pendingFile.dataUrl);
          const blob = await response.blob();
          const formData = new FormData();
          formData.append(
            "bestanden",
            new File([blob], pendingFile.name, { type: blob.type }),
          );
          const uploadResult = await uploadProjectBestanden({
            offerteId: res.id,
            customerId: selectedCustomer?.id ?? null,
            formData,
          });
          if ("error" in uploadResult && uploadResult.error) {
            failedFiles.push(pendingFile);
          }
        }
        setPendingFiles(failedFiles);
        if (failedFiles.length > 0) {
          setError(
            `De offerte is opgeslagen, maar ${failedFiles.length} bijlage${failedFiles.length === 1 ? "" : "n"} kon${failedFiles.length === 1 ? "" : "den"} niet worden geüpload. De mislukte bestanden blijven klaarstaan om opnieuw te proberen.`,
          );
          setLoading(false);
          setSendAfterSave(false);
          if (!isEdit) {
            router.replace(`/dashboard/offertes/${res.id}/bewerken`);
          }
          router.refresh();
          return;
        }
      }

      if (andSend) {
        setSendModalOpen(true);
        setSendAfterSave(true);
        setLoading(false);
        setSuccess("Concept opgeslagen — kies hoe je wilt versturen.");
        router.replace(`/dashboard/offertes/${res.id}/bewerken`);
        router.refresh();
        return;
      }

      setSuccess("Opgeslagen als concept.");
      setLoading(false);
      if (!isEdit) {
        router.replace(`/dashboard/offertes/${res.id}/bewerken`);
      }
      router.refresh();
    }
  }

  return (
    <div
      className="mx-auto flex h-full min-h-0 w-full max-w-[1600px] flex-1 flex-col overflow-hidden"
      id="offerte-form-root"
    >
      <header className="z-30 shrink-0 border-b border-white/10 bg-[#07070a]/95 px-1 py-3 backdrop-blur-md">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            {!hideBackLink ? (
              <Link
                href={backHref}
                className="mb-1 inline-flex items-center gap-1 text-sm text-zinc-400 transition-colors hover:text-zinc-200"
              >
                ← Terug naar offertes
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (onBack) onBack();
                  else router.push("/dashboard/offertes");
                }}
                className="mb-1 inline-flex items-center gap-1 text-sm text-zinc-400 transition-colors hover:text-zinc-200"
              >
                ← Terug naar offertes
              </button>
            )}
            <h1 className="text-xl font-semibold tracking-tight text-zinc-50">
              {isEdit ? "Offerte bewerken" : "Nieuwe offerte"}
            </h1>
            <p className="mt-0.5 text-sm text-zinc-500">
              Stel de offerte samen en controleer rechts de live preview.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="mr-1 text-right">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                Totaal incl. btw
              </p>
              <p className="font-mono text-base font-semibold text-zinc-100">
                {formatEuro(totals.totaal)}
              </p>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${statusInfo.tone}`}
              title="Offertestatus"
            >
              <span className={`h-1.5 w-1.5 rounded-full ${statusInfo.dot}`} />
              {statusInfo.label}
              {workingNummer ? (
                <span className="font-mono font-normal opacity-80">
                  · {workingNummer}
                </span>
              ) : null}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs ${
                loading
                  ? "border-sky-500/25 bg-sky-500/10 text-sky-300"
                  : error
                    ? "border-rose-500/25 bg-rose-500/10 text-rose-300"
                    : success
                      ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-300"
                      : "border-white/10 bg-white/5 text-zinc-400"
              }`}
              aria-live="polite"
            >
              {loading ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
              )}
              {loading
                ? "Opslaan…"
                : error
                  ? "Actie vereist"
                  : success
                    ? "Opgeslagen"
                    : "Nog niet opgeslagen"}
            </span>

            <button
              type="button"
              disabled={loading}
              onClick={() => void persist(false)}
              className="inline-flex h-11 items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 text-sm font-semibold text-zinc-100 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading && !sendAfterSave ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Opslaan…
                </>
              ) : (
                "Opslaan"
              )}
            </button>

            <button
              type="button"
              disabled={loading || !canSave}
              onClick={() => void persist(true)}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-sky-500 px-5 text-sm font-semibold text-zinc-950 transition-colors hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-50"
              title={
                !canSave
                  ? "Vul klant en minstens één offertelijn in"
                  : "Opslaan en versturen"
              }
            >
              {loading && sendAfterSave ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Bezig…
                </>
              ) : (
                <>
                  <Send size={16} />
                  Versturen
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      <div className="shrink-0" aria-live="polite">
        {error && (
          <p
            className="mt-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-sm text-rose-300"
            role="alert"
          >
            {error}
          </p>
        )}
        {success && (
          <p
            className="mt-3 inline-flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-300"
            role="status"
          >
            <Check size={15} />
            {success}
          </p>
        )}
      </div>

      <div className="grid min-h-0 flex-1 items-start gap-5 overflow-y-auto overscroll-contain pb-8 pt-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(420px,0.9fr)] xl:overflow-hidden">
        <div className="order-2 space-y-6 xl:order-1 xl:h-full xl:min-h-0 xl:overflow-y-auto xl:pb-8 xl:pr-2">
          {/* Sectie A — Klant en project */}
          <section className={sectionClass}>
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
              Klant en project
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              Kies de ontvanger en leg de context van de opdracht vast.
            </p>

            <div className="mt-4 space-y-4">
              <div>
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <label className={labelClass + " mb-0"}>Klant</label>
                  <button
                    type="button"
                    onClick={() => {
                      setNewKlantOpen((o) => !o);
                      setNewKlantName(klantVrij);
                    }}
                    className="inline-flex h-8 items-center gap-1 text-[12px] font-medium text-sky-400 hover:text-sky-300"
                  >
                    <UserPlus size={13} />
                    Nieuwe klant
                  </button>
                </div>

                {customerList.length > 0 ? (
                  <Combobox
                    options={customerOptions}
                    value={customerId}
                    onChange={(v) => {
                      setCustomerId(v);
                      setKlantVrij("");
                      setTouched(true);
                    }}
                    placeholder="Zoek of kies een klant…"
                    searchPlaceholder="Zoek op naam of e-mail…"
                    emptyText="Geen klant gevonden."
                    className={`h-11 dark:bg-zinc-900/70 ${
                      touched && !klantName ? fieldInvalidClass : ""
                    }`}
                  />
                ) : (
                  <input
                    value={klantVrij}
                    onChange={(e) => setKlantVrij(e.target.value)}
                    placeholder="Naam van de klant"
                    className={`${fieldClass} ${
                      touched && !klantName ? fieldInvalidClass : ""
                    }`}
                    aria-invalid={Boolean(issueFor("klant"))}
                  />
                )}
                {issueFor("klant") && (
                  <p className="mt-1.5 text-xs text-rose-300">
                    {issueFor("klant")}
                  </p>
                )}

                {selectedCustomer && (
                  <div className="mt-2 rounded-xl border border-white/8 bg-zinc-900/50 px-3 py-2 text-xs text-zinc-400">
                    <p className="font-medium text-zinc-200">
                      {selectedCustomer.name}
                      {selectedCustomer.company_name
                        ? ` · ${selectedCustomer.company_name}`
                        : ""}
                    </p>
                    <p className="mt-0.5">
                      {[
                        selectedCustomer.email,
                        selectedCustomer.phone,
                        selectedCustomer.address,
                      ]
                        .filter(Boolean)
                        .join(" · ") || "Geen contactgegevens"}
                    </p>
                  </div>
                )}

                {customerList.length > 0 && !customerId && !newKlantOpen && (
                  <p className="mt-2 text-[11px] text-zinc-500">
                    Geen match? Gebruik{" "}
                    <button
                      type="button"
                      className="font-medium text-sky-400 hover:text-sky-300"
                      onClick={() => setNewKlantOpen(true)}
                    >
                      Nieuwe klant
                    </button>
                    .
                  </p>
                )}

                {newKlantOpen && (
                  <div className="mt-3 space-y-3 rounded-xl border border-sky-500/25 bg-sky-500/5 p-3">
                    <p className="text-xs font-medium text-sky-300">
                      Nieuwe klant toevoegen
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <label className={labelClass}>Naam / bedrijf *</label>
                        <input
                          value={newKlantName}
                          onChange={(e) => setNewKlantName(e.target.value)}
                          className={fieldClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>E-mail</label>
                        <input
                          type="email"
                          value={newKlantEmail}
                          onChange={(e) => setNewKlantEmail(e.target.value)}
                          className={fieldClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Telefoon</label>
                        <input
                          value={newKlantPhone}
                          onChange={(e) => setNewKlantPhone(e.target.value)}
                          className={fieldClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Adres</label>
                        <input
                          value={newKlantAddress}
                          onChange={(e) => setNewKlantAddress(e.target.value)}
                          className={fieldClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>BTW-nummer</label>
                        <input
                          value={newKlantBtw}
                          onChange={(e) => setNewKlantBtw(e.target.value)}
                          placeholder="BE0…"
                          className={fieldClass}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setNewKlantOpen(false)}
                        className="h-9 rounded-lg px-3 text-xs text-zinc-400 hover:text-zinc-200"
                      >
                        Annuleren
                      </button>
                      <button
                        type="button"
                        disabled={newKlantBusy}
                        onClick={() => void handleCreateKlant()}
                        className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-sky-500 px-3 text-xs font-semibold text-zinc-950 disabled:opacity-60"
                      >
                        {newKlantBusy ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <UserPlus size={12} />
                        )}
                        Opslaan in contacten
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Project / werf</label>
                  <input
                    value={projectNaam}
                    onChange={(e) => setProjectNaam(e.target.value)}
                    placeholder="bv. Renovatie badkamer Peeters"
                    className={fieldClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Afmetingen</label>
                  <input
                    value={afmetingen}
                    onChange={(e) => setAfmetingen(e.target.value)}
                    placeholder="bv. 12 m² of 3 × 4 m"
                    className={fieldClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Offertedatum</label>
                  <input
                    type="date"
                    value={datum}
                    onChange={(e) => setDatum(e.target.value)}
                    className={`${fieldClass} ${
                      issueFor("datum") ? fieldInvalidClass : ""
                    }`}
                    aria-invalid={Boolean(issueFor("datum"))}
                  />
                  {issueFor("datum") && (
                    <p className="mt-1.5 text-xs text-rose-300">
                      {issueFor("datum")}
                    </p>
                  )}
                </div>
                <div>
                  <label className={labelClass}>Geldig tot</label>
                  <input
                    type="date"
                    value={geldigTot}
                    onChange={(e) => setGeldigTot(e.target.value)}
                    className={`${fieldClass} ${
                      issueFor("geldigTot") ? fieldInvalidClass : ""
                    }`}
                    aria-invalid={Boolean(issueFor("geldigTot"))}
                  />
                  {issueFor("geldigTot") && (
                    <p className="mt-1.5 text-xs text-rose-300">
                      {issueFor("geldigTot")}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Sectie B — Offertelijnen */}
          <section className={sectionClass}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                Offertelijnen
              </h2>
              <button
                type="button"
                onClick={addLine}
                className="inline-flex h-9 items-center gap-1.5 rounded-full border border-white/10 px-3 text-xs font-medium text-zinc-200 hover:bg-white/5"
              >
                <Plus size={13} /> Lijn toevoegen
              </button>
            </div>
            <p className="mt-1 text-sm text-zinc-500">
              Voeg minstens één volledige werkpost toe. Bedragen worden direct
              herberekend in de preview.
            </p>

            <div className="mt-3">
              <PrijslijstPicker
                items={prijslijstItems}
                onPick={addFromPrijslijst}
              />
            </div>

            <div className="mt-4 hidden overflow-x-auto md:block">
              <table className="w-full min-w-[640px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left text-[10px] uppercase tracking-wide text-zinc-500">
                    <th className="pb-2 pr-2 font-semibold">Omschrijving</th>
                    <th className="w-20 pb-2 pr-2 text-right font-semibold">
                      Aantal
                    </th>
                    <th className="w-24 pb-2 pr-2 font-semibold">Eenheid</th>
                    <th className="w-28 pb-2 pr-2 text-right font-semibold">
                      Prijs
                    </th>
                    <th className="w-20 pb-2 pr-2 text-right font-semibold">
                      BTW%
                    </th>
                    <th className="w-28 pb-2 pr-2 text-right font-semibold">
                      Totaal
                    </th>
                    <th className="w-20 pb-2 font-semibold">Acties</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((l, i) => {
                    const lineTotal =
                      (Number(l.aantal) || 0) *
                      (Number(l.prijs_per_eenheid) || 0);
                    const descIssue = issueFor(`lines.${i}.omschrijving`);
                    const amountIssue = issueFor(`lines.${i}.aantal`);
                    const priceIssue = issueFor(`lines.${i}.prijs`);
                    const vatIssue = issueFor(`lines.${i}.btw`);
                    return (
                      <tr
                        key={i}
                        className="border-b border-white/5 align-top transition-colors odd:bg-white/[0.015] hover:bg-white/[0.035]"
                      >
                        <td className="py-3 pr-2">
                          <input
                            value={l.omschrijving}
                            onChange={(e) =>
                              updateLine(i, { omschrijving: e.target.value })
                            }
                            placeholder="Werkpost"
                            className={`${fieldClass} ${
                              descIssue ? fieldInvalidClass : ""
                            }`}
                            aria-invalid={Boolean(descIssue)}
                            title={descIssue}
                          />
                        </td>
                        <td className="py-3 pr-2">
                          <input
                            type="number"
                            step="any"
                            min={0.01}
                            value={l.aantal}
                            onChange={(e) =>
                              updateLine(i, {
                                aantal: Number(e.target.value),
                              })
                            }
                            className={`${fieldClass} text-right ${
                              amountIssue ? fieldInvalidClass : ""
                            }`}
                            aria-invalid={Boolean(amountIssue)}
                            title={amountIssue}
                          />
                        </td>
                        <td className="py-3 pr-2">
                          <input
                            value={l.eenheid}
                            onChange={(e) =>
                              updateLine(i, { eenheid: e.target.value })
                            }
                            className={fieldClass}
                          />
                        </td>
                        <td className="py-3 pr-2">
                          <input
                            type="number"
                            step="any"
                            min={0}
                            value={l.prijs_per_eenheid}
                            onChange={(e) =>
                              updateLine(i, {
                                prijs_per_eenheid: Number(e.target.value),
                              })
                            }
                            className={`${fieldClass} text-right ${
                              priceIssue ? fieldInvalidClass : ""
                            }`}
                            aria-invalid={Boolean(priceIssue)}
                            title={priceIssue}
                          />
                        </td>
                        <td className="py-3 pr-2">
                          <input
                            type="number"
                            step="any"
                            min={0}
                            max={100}
                            value={l.btw_percentage}
                            onChange={(e) =>
                              updateLine(i, {
                                btw_percentage: Number(e.target.value),
                              })
                            }
                            className={`${fieldClass} text-right ${
                              vatIssue ? fieldInvalidClass : ""
                            }`}
                            aria-invalid={Boolean(vatIssue)}
                            title={vatIssue}
                          />
                        </td>
                        <td className="py-3 pr-2 pt-5 text-right font-mono text-xs text-zinc-300">
                          {formatEuro(lineTotal)}
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-1 pt-1">
                            <button
                              type="button"
                              onClick={() => duplicateLine(i)}
                              className="grid h-9 w-9 place-items-center rounded-lg text-zinc-500 hover:bg-white/5 hover:text-zinc-200"
                              aria-label="Lijn dupliceren"
                            >
                              <Copy size={14} />
                            </button>
                            <button
                              type="button"
                              disabled={lines.length <= 1}
                              onClick={() => removeLine(i)}
                              className="grid h-9 w-9 place-items-center rounded-lg text-zinc-500 hover:bg-rose-500/10 hover:text-rose-400 disabled:opacity-30"
                              aria-label="Lijn verwijderen"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-3 space-y-3 md:hidden">
              {lines.map((l, i) => {
                const lineTotal =
                  (Number(l.aantal) || 0) * (Number(l.prijs_per_eenheid) || 0);
                const descIssue = issueFor(`lines.${i}.omschrijving`);
                const amountIssue = issueFor(`lines.${i}.aantal`);
                const priceIssue = issueFor(`lines.${i}.prijs`);
                const vatIssue = issueFor(`lines.${i}.btw`);
                return (
                  <div
                    key={i}
                    className="space-y-3 rounded-xl border border-white/8 bg-zinc-900/40 p-3"
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                      Werkpost {i + 1}
                    </p>
                    <input
                      value={l.omschrijving}
                      onChange={(e) =>
                        updateLine(i, { omschrijving: e.target.value })
                      }
                      placeholder="Omschrijving"
                      className={`${fieldClass} ${
                        descIssue ? fieldInvalidClass : ""
                      }`}
                      aria-label={`Omschrijving werkpost ${i + 1}`}
                      aria-invalid={Boolean(descIssue)}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        value={l.aantal}
                        min={0.01}
                        step="any"
                        onChange={(e) =>
                          updateLine(i, { aantal: Number(e.target.value) })
                        }
                        className={`${fieldClass} text-right ${
                          amountIssue ? fieldInvalidClass : ""
                        }`}
                        aria-label="Aantal"
                        aria-invalid={Boolean(amountIssue)}
                      />
                      <input
                        value={l.eenheid}
                        onChange={(e) =>
                          updateLine(i, { eenheid: e.target.value })
                        }
                        className={fieldClass}
                        aria-label="Eenheid"
                      />
                      <input
                        type="number"
                        value={l.prijs_per_eenheid}
                        min={0}
                        step="any"
                        onChange={(e) =>
                          updateLine(i, {
                            prijs_per_eenheid: Number(e.target.value),
                          })
                        }
                        className={`${fieldClass} text-right ${
                          priceIssue ? fieldInvalidClass : ""
                        }`}
                        aria-label="Prijs"
                        aria-invalid={Boolean(priceIssue)}
                      />
                      <input
                        type="number"
                        value={l.btw_percentage}
                        min={0}
                        max={100}
                        step="any"
                        onChange={(e) =>
                          updateLine(i, {
                            btw_percentage: Number(e.target.value),
                          })
                        }
                        className={`${fieldClass} text-right ${
                          vatIssue ? fieldInvalidClass : ""
                        }`}
                        aria-label="BTW"
                        aria-invalid={Boolean(vatIssue)}
                      />
                    </div>
                    {[descIssue, amountIssue, priceIssue, vatIssue].find(
                      Boolean,
                    ) && (
                      <p className="text-xs text-rose-300">
                        {[descIssue, amountIssue, priceIssue, vatIssue].find(
                          Boolean,
                        )}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-zinc-400">
                        {formatEuro(lineTotal)}
                      </span>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => duplicateLine(i)}
                          className="grid h-9 w-9 place-items-center rounded-lg text-zinc-500 hover:bg-white/5"
                          aria-label={`Werkpost ${i + 1} dupliceren`}
                        >
                          <Copy size={14} />
                        </button>
                        <button
                          type="button"
                          disabled={lines.length <= 1}
                          onClick={() => removeLine(i)}
                          className="grid h-9 w-9 place-items-center rounded-lg text-zinc-500 hover:text-rose-400 disabled:opacity-30"
                          aria-label={`Werkpost ${i + 1} verwijderen`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {touched &&
              validationIssues.find((issue) =>
                issue.field.startsWith("lines."),
              ) && (
                <p className="mt-3 text-xs text-rose-300" role="alert">
                  {
                    validationIssues.find((issue) =>
                      issue.field.startsWith("lines."),
                    )?.message
                  }
                </p>
              )}

            <div className="mt-4 ml-auto max-w-xs space-y-1.5 border-t border-white/10 pt-4 text-sm">
              <div className="flex justify-between text-zinc-400">
                <span>Subtotaal</span>
                <span className="font-mono">{formatEuro(totals.subtotaal)}</span>
              </div>
              {btwByRate.map(([rate, amount]) => (
                <div
                  key={rate}
                  className="flex justify-between text-zinc-400"
                >
                  <span>BTW {rate}%</span>
                  <span className="font-mono">{formatEuro(amount)}</span>
                </div>
              ))}
              <div className="flex justify-between border-t border-white/10 pt-2 text-base font-semibold text-zinc-50">
                <span>Totaal incl. BTW</span>
                <span className="font-mono">{formatEuro(totals.totaal)}</span>
              </div>
            </div>
          </section>

          {/* Sectie C — Notities (inklappen) */}
          <section className={sectionClass}>
            <button
              type="button"
              onClick={() => setNotesOpen((o) => !o)}
              className="flex w-full items-center justify-between gap-2 text-left"
              aria-expanded={notesOpen}
              aria-controls="offerte-notities"
            >
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                Voorwaarden en notities
              </h2>
              <ChevronDown
                size={16}
                className={`text-zinc-500 transition-transform ${
                  notesOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            {notesOpen && (
              <div className="mt-4" id="offerte-notities">
                <label className={labelClass}>Klantgerichte notitie</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  placeholder="Voorwaarden, planning, opmerkingen voor de klant…"
                  className={`${fieldClass} h-auto min-h-[6rem] resize-y py-2.5`}
                />
                <p className="mt-1.5 text-[11px] text-zinc-500">
                  Verschijnt in de preview en op de PDF. Aparte interne notities
                  en betaalvoorwaarden volgen in een latere stap.
                </p>
              </div>
            )}
          </section>

          {/* Sectie D — Bijlagen (compact) */}
          <section className={sectionClass}>
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
              Bijlagen
            </h2>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-dashed border-white/15 bg-zinc-900/40 px-4 text-sm text-zinc-200 hover:border-sky-500/40 hover:bg-sky-500/5"
              >
                <Upload size={15} className="text-sky-400" />
                Bestanden kiezen
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                multiple
                className="hidden"
                onChange={(e) => {
                  addFiles(e.target.files);
                  e.target.value = "";
                }}
              />
              <span className="text-[11px] text-zinc-500">
                JPG, PNG of PDF · gekoppeld bij opslaan
              </span>
            </div>

            {pendingFiles.length > 0 && (
              <ul className="mt-3 divide-y divide-white/5 rounded-xl border border-white/10">
                {pendingFiles.map((p, i) => (
                  <li
                    key={`${p.name}-${i}`}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm"
                  >
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-sky-500/10 text-sky-400">
                      <ImageIcon size={14} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-zinc-200">{p.name}</p>
                      <p className="text-[11px] text-zinc-500">
                        {formatBytes(p.size)} · klaar om te uploaden
                      </p>
                    </div>
                    <button
                      type="button"
                      className="text-zinc-500 hover:text-rose-400"
                      aria-label={`${p.name} verwijderen`}
                      onClick={() =>
                        setPendingFiles((prev) =>
                          prev.filter((_, idx) => idx !== i),
                        )
                      }
                    >
                      <X size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="order-1 min-w-0 xl:order-2 xl:h-full xl:min-h-0">
          <div className="rounded-2xl border border-white/10 bg-[#0b0b0f] p-4 shadow-xl shadow-black/10 sm:p-5 xl:h-full xl:overflow-hidden">
            <OfferteDocumentPreview
              embedded
              collapsibleOnMobile
              templateId={documentContext.templateId}
              defaultTemplate={documentContext.defaultTemplate}
              bedrijf={documentContext.bedrijf}
              customers={customerList}
              customerId={customerId}
              klantVrij={klantVrij}
              datum={datum}
              geldigTot={geldigTot}
              notes={previewNotes}
              lines={lines}
              nummer={workingNummer}
            />
          </div>
          {!canSend && canSave && selectedCustomer && !selectedCustomer.email && (
            <p className="mt-3 text-xs text-amber-300/90">
              Tip: voeg een e-mail toe aan de klant voor soepeler versturen. Je
              kunt ook via link of WhatsApp delen.
            </p>
          )}
        </aside>
      </div>

      {workingId != null && (
        <SendOfferteModal
          offerteId={workingId}
          open={sendModalOpen}
          onClose={() => {
            setSendModalOpen(false);
            setSendAfterSave(false);
            router.refresh();
          }}
          onSent={() => {
            setSuccess("Offerte gedeeld / verzonden.");
            setSendModalOpen(false);
            setSendAfterSave(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
