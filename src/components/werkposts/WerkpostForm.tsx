"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ImagePlus,
  Loader2,
  X,
  FileText,
  MapPin,
  Users,
  Calendar,
  Euro,
  Tag,
  Plus
} from "lucide-react";
import {
  createWerkpost,
  uploadWerkpostFotos,
} from "@/app/dashboard/werkposts/actions";
import { REGIOS } from "@/lib/werkposts";

const inputClass =
  "w-full rounded-xl border border-white/10 bg-zinc-900/50 px-3.5 py-2.5 text-sm text-zinc-100 outline-none transition-all placeholder:text-zinc-500 focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/10";
const labelClass = "mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-400";
const sectionHeaderClass = "flex items-center gap-2 pb-3 mb-4 border-b border-white/5 text-sm font-semibold text-zinc-100";

export default function WerkpostForm({
  onCreated,
  embedded = false,
}: {
  /** Waar naartoe navigeren na succesvol plaatsen. Default: dashboard-detail. */
  onCreated?: (id: string) => void;
  /** Verberg annuleerknop (inline op Bouwnetwerk-dashboard). */
  embedded?: boolean;
}) {
  const router = useRouter();
  const [titel, setTitel] = useState("");
  const [type, setType] = useState<"vraag" | "aanbod">("vraag");
  const [urgentie, setUrgentie] = useState<"normaal" | "urgent" | "zeer_urgent">(
    "normaal",
  );
  const [beschrijving, setBeschrijving] = useState("");
  const [aardVanWerk, setAardVanWerk] = useState("");
  const [regio, setRegio] = useState("");
  const [stad, setStad] = useState("");
  const [postcode, setPostcode] = useState("");
  const [adres, setAdres] = useState("");
  const [aantalPersonen, setAantalPersonen] = useState(1);
  const [startdatum, setStartdatum] = useState("");
  const [einddatum, setEinddatum] = useState("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [tariefPerUur, setTariefPerUur] = useState("");
  const [vaardigheden, setVaardigheden] = useState("");
  const [fotos, setFotos] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addFiles(list: FileList | null) {
    if (!list) return;
    const picked = Array.from(list).filter((f) => f.type.startsWith("image/"));
    setFotos((prev) => [...prev, ...picked].slice(0, 8));
  }

  function removeFoto(index: number) {
    setFotos((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await createWerkpost({
      titel,
      beschrijving,
      aardVanWerk,
      type,
      urgentie,
      regio,
      stad,
      postcode,
      adres,
      aantalPersonen: Number(aantalPersonen) || 1,
      startdatum,
      einddatum,
      geschatteDuurDagen: null,
      budgetMin: budgetMin ? Number(budgetMin) : null,
      budgetMax: budgetMax ? Number(budgetMax) : null,
      tariefPerUur: tariefPerUur ? Number(tariefPerUur) : null,
      tariefType: "uur",
      vereisteVaardigheden: vaardigheden
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean),
    });

    if ("error" in res && res.error) {
      setLoading(false);
      setError(res.error);
      return;
    }
    if ("id" in res && res.id) {
      if (fotos.length > 0) {
        const fd = new FormData();
        for (const file of fotos) fd.append("fotos", file);
        const uploadRes = await uploadWerkpostFotos(res.id, fd);
        if ("error" in uploadRes && uploadRes.error) {
          setLoading(false);
          setError(
            `Werkpost geplaatst, maar foto's uploaden mislukte: ${uploadRes.error}`,
          );
          return;
        }
      }
      setLoading(false);
      if (onCreated) onCreated(res.id);
      else router.push(`/dashboard/werkposts/${res.id}`);
      router.refresh();
      return;
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Sectie 1: Algemeen */}
      <div className="rounded-2xl border border-white/5 bg-zinc-900/30 p-5 backdrop-blur-sm">
        <h3 className={sectionHeaderClass}>
          <FileText size={16} className="text-sky-400" />
          1. Algemene Informatie
        </h3>
        
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={labelClass}>Titel van de post</label>
            <input
              value={titel}
              onChange={(e) => setTitel(e.target.value)}
              placeholder="bijv. Ervaren metselaars gezocht voor renovatieproject"
              className={inputClass}
              required
            />
          </div>

          <div>
            <label className={labelClass}>Ik wil...</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as "vraag" | "aanbod")}
              className={inputClass}
            >
              <option value="vraag">Personeel zoeken (Vraag)</option>
              <option value="aanbod">Personeel aanbieden (Aanbod)</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Urgentieniveau</label>
            <select
              value={urgentie}
              onChange={(e) =>
                setUrgentie(e.target.value as "normaal" | "urgent" | "zeer_urgent")
              }
              className={inputClass}
            >
              <option value="normaal">Normaal</option>
              <option value="urgent">Urgent (Binnen 2 weken)</option>
              <option value="zeer_urgent">Zeer urgent (Direct nodig)</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className={labelClass}>Uitgebreide omschrijving</label>
            <textarea
              value={beschrijving}
              onChange={(e) => setBeschrijving(e.target.value)}
              rows={4}
              placeholder="Beschrijf de taken, benodigde certificaten (zoals VCA), verwachtingen en andere relevante details..."
              className={`${inputClass} resize-none`}
              required
            />
          </div>

          <div className="sm:col-span-2">
            <label className={labelClass}>Aard van het werk / Categorie</label>
            <input
              value={aardVanWerk}
              onChange={(e) => setAardVanWerk(e.target.value)}
              placeholder="bijv. Ruwbouw, Afwerking, Elektriciteit, Sanitair..."
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Sectie 2: Locatie & Capaciteit */}
      <div className="rounded-2xl border border-white/5 bg-zinc-900/30 p-5 backdrop-blur-sm">
        <h3 className={sectionHeaderClass}>
          <MapPin size={16} className="text-sky-400" />
          2. Locatie &amp; Capaciteit
        </h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Regio / Provincie</label>
            <input
              value={regio}
              onChange={(e) => setRegio(e.target.value)}
              list="regio-opties"
              placeholder="Selecteer of typ een regio"
              className={inputClass}
              required
            />
            <datalist id="regio-opties">
              {REGIOS.map((r) => (
                <option key={r} value={r} />
              ))}
            </datalist>
          </div>

          <div>
            <label className={labelClass}>Stad / Gemeente</label>
            <input
              value={stad}
              onChange={(e) => setStad(e.target.value)}
              placeholder="bijv. Antwerpen"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Postcode</label>
            <input
              value={postcode}
              onChange={(e) => setPostcode(e.target.value)}
              placeholder="bijv. 2000"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Aantal personen</label>
            <div className="relative flex items-center">
              <Users size={16} className="absolute left-3.5 text-zinc-500" />
              <input
                type="number"
                min={1}
                value={aantalPersonen}
                onChange={(e) => setAantalPersonen(Number(e.target.value))}
                className={`${inputClass} pl-10`}
                required
              />
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className={labelClass}>Adres (Optioneel)</label>
            <input
              value={adres}
              onChange={(e) => setAdres(e.target.value)}
              placeholder="Straatnaam en huisnummer"
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Sectie 3: Planning & Budget */}
      <div className="rounded-2xl border border-white/5 bg-zinc-900/30 p-5 backdrop-blur-sm">
        <h3 className={sectionHeaderClass}>
          <Calendar size={16} className="text-sky-400" />
          3. Planning &amp; Tarieven
        </h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Startdatum</label>
            <input
              type="date"
              value={startdatum}
              onChange={(e) => setStartdatum(e.target.value)}
              className={inputClass}
              required
            />
          </div>

          <div>
            <label className={labelClass}>Einddatum (Optioneel)</label>
            <input
              type="date"
              value={einddatum}
              onChange={(e) => setEinddatum(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="sm:col-span-2 grid gap-4 sm:grid-cols-3 border-t border-white/5 pt-4 mt-2">
            <div>
              <label className={labelClass}>Uurtarief (€ / uur)</label>
              <div className="relative flex items-center">
                <Euro size={14} className="absolute left-3.5 text-zinc-500" />
                <input
                  type="number"
                  value={tariefPerUur}
                  onChange={(e) => setTariefPerUur(e.target.value)}
                  placeholder="Richtprijs"
                  className={`${inputClass} pl-9`}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Min. Totaal Budget (€)</label>
              <div className="relative flex items-center">
                <Euro size={14} className="absolute left-3.5 text-zinc-500" />
                <input
                  type="number"
                  value={budgetMin}
                  onChange={(e) => setBudgetMin(e.target.value)}
                  placeholder="Minimaal"
                  className={`${inputClass} pl-9`}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Max. Totaal Budget (€)</label>
              <div className="relative flex items-center">
                <Euro size={14} className="absolute left-3.5 text-zinc-500" />
                <input
                  type="number"
                  value={budgetMax}
                  onChange={(e) => setBudgetMax(e.target.value)}
                  placeholder="Maximaal"
                  className={`${inputClass} pl-9`}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sectie 4: Vaardigheden & Foto's */}
      <div className="rounded-2xl border border-white/5 bg-zinc-900/30 p-5 backdrop-blur-sm">
        <h3 className={sectionHeaderClass}>
          <Tag size={16} className="text-sky-400" />
          4. Vaardigheden &amp; Visuals
        </h3>

        <div className="space-y-5">
          <div>
            <label className={labelClass}>Vereiste vaardigheden / Certificaten</label>
            <input
              value={vaardigheden}
              onChange={(e) => setVaardigheden(e.target.value)}
              placeholder="Metselen, VCA-vol, Beton storten, Tekening lezen (scheid met komma's)"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Foto&apos;s van de werf of het werk (Optioneel)</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                addFiles(e.target.files);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
            />
            
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-zinc-900/35 px-4 py-2.5 text-sm text-zinc-200 transition-all hover:bg-white/5 hover:border-zinc-700"
              >
                <ImagePlus size={15} className="text-sky-400" />
                Foto&apos;s selecteren
              </button>
              <span className="text-xs text-zinc-500">
                Max. 8 foto&apos;s, tot 10 MB per stuk.
              </span>
            </div>

            {fotos.length > 0 && (
              <div className="mt-4 grid grid-cols-4 gap-3 sm:grid-cols-6 lg:grid-cols-8">
                {fotos.map((file, i) => (
                  <div
                    key={`${file.name}-${i}`}
                    className="group relative aspect-square w-full overflow-hidden rounded-xl border border-white/10 bg-zinc-950"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                    <button
                      type="button"
                      onClick={() => removeFoto(i)}
                      className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-zinc-950/80 text-zinc-200 opacity-0 transition-opacity hover:bg-rose-600/90 group-hover:opacity-100"
                      aria-label="Foto verwijderen"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          {error}
        </div>
      )}

      {/* Actieknop */}
      <div className="flex items-center justify-end gap-3 pt-2">
        {!embedded && (
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-full border border-white/10 px-5 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:bg-white/5 hover:text-zinc-200"
          >
            Annuleren
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-6 py-2.5 text-sm font-semibold text-zinc-950 transition-all hover:bg-sky-400 hover:shadow-[0_0_15px_rgba(14,165,233,0.3)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Bezig met plaatsen…
            </>
          ) : (
            <>
              <Plus size={16} /> Werkpost publiceren
            </>
          )}
        </button>
      </div>
    </form>
  );
}
