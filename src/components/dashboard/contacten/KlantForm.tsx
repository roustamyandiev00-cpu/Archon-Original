"use client";

import { useState, useTransition } from "react";
import { Building2, Loader2, User, X } from "lucide-react";
import {
  createKlant,
  updateKlant,
  type KlantInput,
} from "@/app/dashboard/contacten/actions";

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
  notes: string | null;
};

const inputCls =
  "w-full rounded-lg border border-white/10 bg-zinc-950/60 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none transition-colors focus:border-sky-500/60";

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

  function set<K extends keyof KlantInput>(key: K, value: KlantInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

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

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl border border-white/10 bg-zinc-950 shadow-2xl sm:max-w-2xl sm:rounded-2xl"
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-zinc-50">
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
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-5 p-5">
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
              <Field label="BTW-nummer" hint="bv. BE0123456789">
                <input
                  value={form.btw}
                  onChange={(e) => set("btw", e.target.value)}
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

          <div className="flex justify-end gap-2 border-t border-white/10 pt-4">
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
    </div>
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
