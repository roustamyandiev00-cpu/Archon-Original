"use client";

import { useCallback, useEffect, useState, useSyncExternalStore, useTransition } from "react";
import { createPortal } from "react-dom";
import { Building2, Loader2, User, X } from "lucide-react";
import {
  createKlant,
  updateKlant,
  type KlantInput,
} from "@/app/dashboard/contacten/actions";
import { BtwLookupFieldSky } from "@/components/dashboard/contacten/BtwLookupField";
import type { CompanyLookupResult } from "@/components/dashboard/contacten/companyLookup";

export type KlantRecord = {
  id: number;
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

const inputCls =
  "w-full rounded-lg border border-white/10 bg-zinc-950/60 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none transition-colors focus:border-sky-500/60";

const subscribeToClient = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

function emptyForm(): KlantInput {
  return {
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

export default function KlantForm({
  klant,
  onClose,
  onSaved,
}: {
  klant?: KlantRecord | null;
  onClose: () => void;
  onSaved: () => void;
}) {
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
        f.peppol_participant_id ||
        `0208:${data.ondernemingsnummer}`,
    }));
  }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = klant
        ? await updateKlant(klant.id, form)
        : await createKlant(form);
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
              {klant ? "Klant bewerken" : "Nieuwe klant"}
            </h2>
            <p className="text-xs text-zinc-500">
              Peppol-velden zijn nodig voor e-facturatie naar dit bedrijf.
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
          <section className="space-y-3">
            <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
              <User size={13} /> Contact
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Voornaam">
                <input
                  value={form.first_name}
                  onChange={(e) => set("first_name", e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="Achternaam">
                <input
                  value={form.last_name}
                  onChange={(e) => set("last_name", e.target.value)}
                  className={inputCls}
                />
              </Field>
            </div>
            <Field label="Weergavenaam *">
              <input
                required
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Jan Janssen of Bouwbedrijf BV"
                className={inputCls}
              />
            </Field>
            <Field label="Bedrijfsnaam">
              <input
                value={form.company_name}
                onChange={(e) => set("company_name", e.target.value)}
                className={inputCls}
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="E-mail">
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="Telefoon">
                <input
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
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

          <section className="space-y-3 rounded-xl border border-sky-500/20 bg-sky-500/5 p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-sky-300">
              Peppol / e-facturatie
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <BtwLookupFieldSky
                value={form.btw ?? ""}
                onChange={(v) => set("btw", v)}
                onResolved={applyCompanyLookup}
                hint="Gegevens worden automatisch ingevuld via het Belgisch ondernemingsregister"
              />
              <Field
                label="Ondernemingsnummer (KBO)"
                hint="10 cijfers, bv. 0123456789"
              >
                <input
                  value={form.ondernemingsnummer}
                  onChange={(e) => set("ondernemingsnummer", e.target.value)}
                  className={inputCls}
                />
              </Field>
            </div>
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
                  onChange={(e) => set("mercurius_entiteit_id", e.target.value)}
                  placeholder="0208:0123456789"
                  className={inputCls}
                />
              </Field>
            )}
          </section>

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
              {klant ? "Opslaan" : "Klant toevoegen"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-zinc-400">
        {label}
      </span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-zinc-600">{hint}</span>}
    </label>
  );
}
