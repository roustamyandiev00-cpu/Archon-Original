"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Building2,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Radio,
  Search,
  Trash2,
  User,
} from "lucide-react";
import GlowCard from "@/components/dashboard/GlowCard";
import KlantForm, { type KlantRecord } from "@/components/dashboard/contacten/KlantForm";
import { deleteKlant } from "@/app/dashboard/contacten/actions";

export default function KlantenPanel({ klanten }: { klanten: KlantRecord[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<KlantRecord | null>(null);
  const [creating, setCreating] = useState(false);

  const filtered = klanten.filter((k) => {
    const hay = [
      k.name,
      k.company_name,
      k.email,
      k.phone,
      k.city,
      k.btw,
      k.ondernemingsnummer,
      k.peppol_participant_id,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return hay.includes(query.toLowerCase());
  });

  async function remove(id: number, naam: string) {
    if (!confirm(`Klant "${naam}" deactiveren?`)) return;
    await deleteKlant(id);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
            Contacten
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Beheer klanten met adres- en Peppol-gegevens voor e-facturatie.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-4 py-2.5 text-sm font-medium text-zinc-950 hover:bg-sky-400"
        >
          <Plus size={16} /> Nieuwe klant
        </button>
      </header>

      <div className="relative max-w-md">
        <Search
          size={15}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Zoek op naam, e-mail, BTW, Peppol…"
          className="w-full rounded-xl border border-white/10 bg-zinc-900/60 py-2.5 pl-9 pr-3 text-sm text-zinc-100 outline-none focus:border-sky-500/50"
        />
      </div>

      <GlowCard innerClassName="p-0 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-white/5 text-zinc-500">
              <User size={22} />
            </span>
            <p className="mt-3 text-sm text-zinc-400">
              {klanten.length === 0
                ? "Nog geen klanten — voeg je eerste contact toe."
                : "Geen resultaten voor je zoekopdracht."}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-white/5">
            {filtered.map((k) => {
              const peppolReady = Boolean(
                k.peppol_participant_id || k.btw || k.ondernemingsnummer,
              );
              const adres = [k.address, k.postcode, k.city]
                .filter(Boolean)
                .join(", ");
              return (
                <li
                  key={k.id}
                  className="flex flex-wrap items-start justify-between gap-3 px-4 py-4 sm:px-5"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-zinc-100">{k.name}</p>
                      {k.company_name && (
                        <span className="rounded-full bg-indigo-500/15 px-2 py-0.5 text-[10px] font-medium text-indigo-300">
                          {k.company_name}
                        </span>
                      )}
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          peppolReady
                            ? "bg-emerald-500/15 text-emerald-300"
                            : "bg-amber-500/15 text-amber-300"
                        }`}
                      >
                        <Radio size={10} />
                        {peppolReady ? "Peppol klaar" : "Peppol onvolledig"}
                      </span>
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
                      {k.email && (
                        <span className="inline-flex items-center gap-1">
                          <Mail size={11} /> {k.email}
                        </span>
                      )}
                      {k.phone && (
                        <span className="inline-flex items-center gap-1">
                          <Phone size={11} /> {k.phone}
                        </span>
                      )}
                      {adres && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin size={11} /> {adres}
                        </span>
                      )}
                    </div>
                    {(k.ondernemingsnummer || k.btw || k.peppol_participant_id) && (
                      <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-zinc-600">
                        {k.ondernemingsnummer && (
                          <span>KBO: {k.ondernemingsnummer}</span>
                        )}
                        {k.btw && <span>BTW: {k.btw}</span>}
                        {k.peppol_participant_id && (
                          <span>Peppol: {k.peppol_participant_id}</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setEditing(k)}
                      className="grid h-8 w-8 place-items-center rounded-lg text-zinc-400 hover:bg-white/5 hover:text-sky-300"
                      aria-label={`Bewerk ${k.name}`}
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(k.id, k.name)}
                      className="grid h-8 w-8 place-items-center rounded-lg text-zinc-400 hover:bg-rose-500/10 hover:text-rose-400"
                      aria-label={`Verwijder ${k.name}`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </GlowCard>

      {(creating || editing) && (
        <KlantForm
          klant={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={() => router.refresh()}
        />
      )}
    </div>
  );
}
