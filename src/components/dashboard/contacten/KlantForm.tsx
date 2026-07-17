"use client";

import { useCallback, useEffect, useState, useSyncExternalStore, useTransition } from "react";
import { createPortal } from "react-dom";
import { Building2, Loader2, User, X } from "lucide-react";
import {
  createKlant,
  updateKlant,
  type ContactType,
  type KlantInput,
} from "@/app/dashboard/contacten/actions";
import { BtwLookupField } from "@/components/dashboard/contacten/BtwLookupField";
import type { CompanyLookupResult } from "@/components/dashboard/contacten/companyLookup";

export type KlantRecord = {
  id: number;
  contact_type?: ContactType | null;
  name: string;
  company_name: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  postcode: string | null;
  city: string | null;
  country: string | null;
  ondernemingsnummer: string | null;
  kvk: string | null;
  btw: string | null;
  peppol_participant_id: string | null;
  is_overheid?: boolean | null;
  mercurius_entiteit_id?: string | null;
  notes: string | null;
};

type ContactKind = "particulier" | "bedrijf";

function kindToContactType(kind: ContactKind): ContactType {
  return kind === "particulier" ? "individual" : "company";
}

function contactTypeToKind(type: ContactType | null | undefined): ContactKind | null {
  if (type === "individual") return "particulier";
  if (type === "company") return "bedrijf";
  return null;
}

const inputCls =
  "w-full rounded-xl border border-white/[0.08] bg-zinc-950/70 px-3.5 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none transition-[border-color,box-shadow] focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/15";

const subscribeToClient = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

function inferKind(k: KlantRecord): ContactKind {
  const fromType = contactTypeToKind(k.contact_type);
  if (fromType) return fromType;
  if (k.company_name?.trim() || k.btw?.trim() || k.ondernemingsnummer?.trim()) {
    return "bedrijf";
  }
  return "particulier";
}

function emptyForm(): KlantInput {
  return {
    contact_type: "company",
    name: "",
    company_name: "",
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    address: "",
    postcode: "",
    city: "",
    country: "BE",
    ondernemingsnummer: "",
    btw: "",
    peppol_participant_id: "",
    is_overheid: false,
    mercurius_entiteit_id: "",
    notes: "",
  };
}

function fromRecord(k: KlantRecord): KlantInput {
  return {
    contact_type: kindToContactType(inferKind(k)),
    name: k.name,
    company_name: k.company_name ?? "",
    first_name: k.first_name ?? "",
    last_name: k.last_name ?? "",
    email: k.email ?? "",
    phone: k.phone ?? "",
    address: k.address ?? "",
    postcode: k.postcode ?? "",
    city: k.city ?? "",
    country: k.country ?? "BE",
    ondernemingsnummer: k.ondernemingsnummer ?? k.kvk ?? "",
    btw: k.btw ?? "",
    peppol_participant_id: k.peppol_participant_id ?? "",
    is_overheid: Boolean(k.is_overheid),
    mercurius_entiteit_id: k.mercurius_entiteit_id ?? "",
    notes: k.notes ?? "",
  };
}

function displayName(form: KlantInput, kind: ContactKind): string {
  if (kind === "bedrijf") {
    return (
      form.company_name?.trim() ||
      form.name.trim() ||
      [form.first_name, form.last_name].filter(Boolean).join(" ").trim()
    );
  }
  return (
    [form.first_name, form.last_name].filter(Boolean).join(" ").trim() ||
    form.name.trim()
  );
}

export default function KlantForm({
  klant,
  onClose,
  onSaved,
}: {
  klant?: KlantRecord | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [kind, setKind] = useState<ContactKind>(
    klant ? inferKind(klant) : "bedrijf",
  );
  const [form, setForm] = useState<KlantInput>(
    klant ? fromRecord(klant) : emptyForm(),
  );
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const mounted = useSyncExternalStore(
    subscribeToClient,
    clientSnapshot,
    serverSnapshot,
  );
  const isBedrijf = kind === "bedrijf";

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  function set<K extends keyof KlantInput>(key: K, value: KlantInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function switchKind(next: ContactKind) {
    setKind(next);
    setError(null);
    if (next === "particulier") {
      setForm((f) => ({
        ...f,
        contact_type: "individual",
        company_name: "",
        btw: "",
        ondernemingsnummer: "",
        peppol_participant_id: "",
        is_overheid: false,
        mercurius_entiteit_id: "",
        name: [f.first_name, f.last_name].filter(Boolean).join(" ").trim() || f.name,
      }));
    } else {
      setForm((f) => ({ ...f, contact_type: "company" }));
    }
  }

  const applyCompanyLookup = useCallback((data: CompanyLookupResult) => {
    setForm((f) => ({
      ...f,
      btw: data.btw,
      ondernemingsnummer: data.ondernemingsnummer,
      company_name: data.name,
      name: f.name.trim() ? f.name : data.name,
      address: data.street || f.address,
      postcode: data.postcode || f.postcode,
      city: data.city || f.city,
      country: data.country || f.country || "BE",
      peppol_participant_id:
        f.peppol_participant_id || `0208:${data.ondernemingsnummer}`,
    }));
  }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const name = displayName(form, kind);
    if (!name) {
      setError(
        isBedrijf
          ? "Bedrijfsnaam of weergavenaam is verplicht."
          : "Voornaam en achternaam zijn verplicht.",
      );
      return;
    }

    const payload: KlantInput = {
      ...form,
      contact_type: kindToContactType(kind),
      name,
      company_name: isBedrijf ? form.company_name : "",
      btw: isBedrijf ? form.btw : "",
      ondernemingsnummer: isBedrijf ? form.ondernemingsnummer : "",
      peppol_participant_id: isBedrijf ? form.peppol_participant_id : "",
      is_overheid: isBedrijf ? form.is_overheid : false,
      mercurius_entiteit_id: isBedrijf ? form.mercurius_entiteit_id : "",
    };

    startTransition(async () => {
      const res = klant
        ? await updateKlant(klant.id, payload)
        : await createKlant(payload);
      if (res && "error" in res && res.error) {
        setError(res.error);
        return;
      }
      onSaved();
      onClose();
    });
  }

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="klant-form-title"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[min(92dvh,900px)] w-full flex-col rounded-t-3xl border border-white/10 bg-zinc-950 shadow-2xl sm:max-w-2xl sm:rounded-2xl"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <h2 id="klant-form-title" className="text-lg font-semibold text-zinc-50">
              {klant ? "Contact bewerken" : "Nieuw contact"}
            </h2>
            <p className="text-xs text-zinc-500">
              {isBedrijf
                ? "Peppol-velden helpen bij e-facturatie naar dit bedrijf."
                : "Particulier contact voor offertes en opvolging."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-zinc-500 hover:bg-white/5 hover:text-zinc-200"
            aria-label="Sluiten"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
            <div>
              <span className="mb-2 block text-xs font-medium text-zinc-400">
                Type <span className="text-sky-400">*</span>
              </span>
              <div className="grid grid-cols-2 gap-1 rounded-xl border border-white/[0.08] bg-zinc-950/60 p-1">
                <SegmentButton
                  active={kind === "particulier"}
                  onClick={() => switchKind("particulier")}
                  icon={<User size={15} />}
                  label="Particulier"
                />
                <SegmentButton
                  active={isBedrijf}
                  onClick={() => switchKind("bedrijf")}
                  icon={<Building2 size={15} />}
                  label="Bedrijf"
                />
              </div>
            </div>

            <section className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Voornaam" required>
                  <input
                    required
                    value={form.first_name}
                    onChange={(e) => set("first_name", e.target.value)}
                    placeholder="Sarah"
                    className={inputCls}
                  />
                </Field>
                <Field label="Achternaam" required>
                  <input
                    required
                    value={form.last_name}
                    onChange={(e) => set("last_name", e.target.value)}
                    placeholder="Thompson"
                    className={inputCls}
                  />
                </Field>
              </div>

              {isBedrijf && (
                <>
                  <BtwLookupField
                    value={form.btw ?? ""}
                    onChange={(v) => set("btw", v)}
                    onResolved={applyCompanyLookup}
                    accent="sky"
                  />
                  <Field label="Bedrijfsnaam" required>
                    <input
                      required
                      value={form.company_name}
                      onChange={(e) => set("company_name", e.target.value)}
                      placeholder="Bouwbedrijf Peeters BV"
                      className={inputCls}
                    />
                  </Field>
                </>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                <Field
                  label={isBedrijf ? "Zakelijk e-mailadres" : "E-mailadres"}
                >
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                    placeholder={isBedrijf ? "jij@bedrijf.be" : "jan@email.be"}
                    className={inputCls}
                  />
                </Field>
                <Field label="Telefoon">
                  <input
                    value={form.phone}
                    onChange={(e) => set("phone", e.target.value)}
                    placeholder="+32 470 12 34 56"
                    className={inputCls}
                  />
                </Field>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                <Building2 size={13} /> Adres
              </h3>
              <Field label="Straat en nummer">
                <input
                  value={form.address}
                  onChange={(e) => set("address", e.target.value)}
                  className={inputCls}
                />
              </Field>
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Postcode">
                  <input
                    value={form.postcode}
                    onChange={(e) => set("postcode", e.target.value)}
                    className={inputCls}
                  />
                </Field>
                <Field label="Stad">
                  <input
                    value={form.city}
                    onChange={(e) => set("city", e.target.value)}
                    className={inputCls}
                  />
                </Field>
                <Field label="Land">
                  <input
                    value={form.country}
                    onChange={(e) => set("country", e.target.value)}
                    placeholder="BE"
                    className={inputCls}
                  />
                </Field>
              </div>
            </section>

            {isBedrijf && (
              <section className="space-y-3 rounded-xl border border-sky-500/20 bg-sky-500/5 p-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-sky-300">
                  Peppol / e-facturatie
                </h3>
                <Field
                  label="Ondernemingsnummer (KBO)"
                  hint="10 cijfers, bv. 0123456789 — vaak automatisch via BTW-lookup"
                >
                  <input
                    value={form.ondernemingsnummer}
                    onChange={(e) => set("ondernemingsnummer", e.target.value)}
                    className={inputCls}
                  />
                </Field>
                <Field
                  label="Peppol-identificatie"
                  hint="Optioneel — wordt afgeleid uit KBO/BTW als leeg. Formaat: 0208:0123456789"
                >
                  <input
                    value={form.peppol_participant_id}
                    onChange={(e) => set("peppol_participant_id", e.target.value)}
                    placeholder="0208:0123456789"
                    className={inputCls}
                  />
                </Field>
                <label className="flex items-center gap-2 text-sm text-zinc-300">
                  <input
                    type="checkbox"
                    checked={Boolean(form.is_overheid)}
                    onChange={(e) => set("is_overheid", e.target.checked)}
                    className="rounded border-white/20 bg-zinc-900"
                  />
                  Overheidsklant (Mercurius B2G)
                </label>
                {form.is_overheid && (
                  <Field
                    label="Mercurius-entiteit ID"
                    hint="Optioneel — specifieke Peppol-ID van de overheidsentiteit"
                  >
                    <input
                      value={form.mercurius_entiteit_id ?? ""}
                      onChange={(e) =>
                        set("mercurius_entiteit_id", e.target.value)
                      }
                      placeholder="0208:0123456789"
                      className={inputCls}
                    />
                  </Field>
                )}
              </section>
            )}

            <Field label="Notities">
              <textarea
                rows={3}
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                className={`${inputCls} resize-none`}
              />
            </Field>

            {error && (
              <p className="rounded-lg border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
                {error}
              </p>
            )}
          </div>

          <div className="flex shrink-0 justify-end gap-2 border-t border-white/10 bg-zinc-950 px-5 py-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-300 hover:bg-white/5"
            >
              Annuleren
            </button>
            <button
              type="submit"
              disabled={pending}
              className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-5 py-2 text-sm font-medium text-zinc-950 hover:bg-sky-400 disabled:opacity-60"
            >
              {pending && <Loader2 size={15} className="animate-spin" />}
              {klant ? "Opslaan" : "Contact toevoegen"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}

function SegmentButton({
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
      className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
        active
          ? "bg-sky-500/15 text-sky-200 shadow-sm ring-1 ring-inset ring-sky-500/30"
          : "text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-300"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-zinc-400">
        {label}
        {required && <span className="text-sky-400"> *</span>}
      </span>
      {children}
      {hint && (
        <span className="mt-1 block text-[11px] text-zinc-600">{hint}</span>
      )}
    </label>
  );
}
