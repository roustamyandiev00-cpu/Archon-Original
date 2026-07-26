"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2, X, Building2, MapPin, Plus } from "lucide-react";
import {
  createBouwmateriaalWinkel,
  uploadBouwmateriaalWinkelFotos,
  type BouwmateriaalCategorie,
} from "@/app/bouwmaterialen/actions";
import { REGIOS } from "@/lib/werkposts";
import {
  BOUWMATERIAAL_CATEGORIEEN,
  CATEGORIE_META,
} from "@/lib/bouwmaterialen";
import LocationPicker from "@/components/dakbedrijven/LocationPicker";

const inputClass =
  "w-full rounded-xl border border-white/10 bg-zinc-900/50 px-3.5 py-2.5 text-sm text-zinc-100 outline-none transition-all placeholder:text-zinc-500 focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/10";
const labelClass = "mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-400";
const sectionHeaderClass = "flex items-center gap-2 pb-3 mb-4 border-b border-white/5 text-sm font-semibold text-zinc-100";

export default function BouwmateriaalWinkelForm() {
  const router = useRouter();
  const [naam, setNaam] = useState("");
  const [categorie, setCategorie] = useState<BouwmateriaalCategorie>("dak");
  const [adres, setAdres] = useState("");
  const [postcode, setPostcode] = useState("");
  const [stad, setStad] = useState("");
  const [regio, setRegio] = useState("");
  const [telefoon, setTelefoon] = useState("");
  const [website, setWebsite] = useState("");
  const [beschrijving, setBeschrijving] = useState("");
  const [toegevoegdDoor, setToegevoegdDoor] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [fotos, setFotos] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function addFiles(list: FileList | null) {
    if (!list) return;
    const picked = Array.from(list).filter((f) => f.type.startsWith("image/"));
    setFotos((prev) => [...prev, ...picked].slice(0, 8));
  }

  function removeFoto(index: number) {
    setFotos((prev) => prev.filter((_, i) => i !== index));
  }

  function resetForm() {
    setNaam("");
    setCategorie("dak");
    setAdres("");
    setPostcode("");
    setStad("");
    setRegio("");
    setTelefoon("");
    setWebsite("");
    setBeschrijving("");
    setToegevoegdDoor("");
    setLat(null);
    setLng(null);
    setFotos([]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    const res = await createBouwmateriaalWinkel({
      naam,
      categorie,
      adres,
      postcode,
      stad,
      regio,
      telefoon,
      website,
      beschrijving,
      toegevoegdDoor,
      lat,
      lng,
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
        const uploadRes = await uploadBouwmateriaalWinkelFotos(res.id, fd);
        if ("error" in uploadRes && uploadRes.error) {
          setLoading(false);
          setError(
            `Winkel toegevoegd, maar foto's uploaden mislukte: ${uploadRes.error}`,
          );
          return;
        }
      }
      setLoading(false);
      setSuccess(true);
      resetForm();
      router.refresh();
      return;
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Sectie 1: Winkel */}
      <div className="rounded-2xl border border-white/5 bg-zinc-900/30 p-5 backdrop-blur-sm">
        <h3 className={sectionHeaderClass}>
          <Building2 size={16} className="text-sky-400" />
          1. Winkelgegevens
        </h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={labelClass}>Naam van de winkel</label>
            <input
              value={naam}
              onChange={(e) => setNaam(e.target.value)}
              placeholder="bijv. Bouwmaterialen Janssens"
              className={inputClass}
              required
            />
          </div>

          <div>
            <label className={labelClass}>Categorie</label>
            <select
              value={categorie}
              onChange={(e) => setCategorie(e.target.value as BouwmateriaalCategorie)}
              className={inputClass}
            >
              {BOUWMATERIAAL_CATEGORIEEN.map((cat) => (
                <option key={cat} value={cat}>
                  {CATEGORIE_META[cat].label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Telefoon (Optioneel)</label>
            <input
              value={telefoon}
              onChange={(e) => setTelefoon(e.target.value)}
              placeholder="bijv. 03 123 45 67"
              className={inputClass}
            />
          </div>

          <div className="sm:col-span-2">
            <label className={labelClass}>Website (Optioneel)</label>
            <input
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="bijv. www.bouwmaterialenjanssens.be"
              className={inputClass}
            />
          </div>

          <div className="sm:col-span-2">
            <label className={labelClass}>Korte omschrijving (Optioneel)</label>
            <textarea
              value={beschrijving}
              onChange={(e) => setBeschrijving(e.target.value)}
              rows={3}
              placeholder="Welke dak- of tegelmaterialen verkopen ze?"
              className={`${inputClass} resize-none`}
            />
          </div>
        </div>
      </div>

      {/* Sectie 2: Locatie */}
      <div className="rounded-2xl border border-white/5 bg-zinc-900/30 p-5 backdrop-blur-sm">
        <h3 className={sectionHeaderClass}>
          <MapPin size={16} className="text-sky-400" />
          2. Adres
        </h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={labelClass}>Straatnaam en huisnummer</label>
            <input
              value={adres}
              onChange={(e) => setAdres(e.target.value)}
              placeholder="bijv. Materialenstraat 12"
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
            <label className={labelClass}>Stad / Gemeente</label>
            <input
              value={stad}
              onChange={(e) => setStad(e.target.value)}
              placeholder="bijv. Antwerpen"
              className={inputClass}
            />
          </div>

          <div className="sm:col-span-2">
            <label className={labelClass}>Regio / Provincie</label>
            <input
              value={regio}
              onChange={(e) => setRegio(e.target.value)}
              list="bouwmateriaal-winkel-regio-opties"
              placeholder="Selecteer of typ een regio"
              className={inputClass}
            />
            <datalist id="bouwmateriaal-winkel-regio-opties">
              {REGIOS.map((r) => (
                <option key={r} value={r} />
              ))}
            </datalist>
          </div>

          <div className="sm:col-span-2">
            <label className={labelClass}>Pin op de kaart (Optioneel, wel aanbevolen)</label>
            <LocationPicker
              lat={lat}
              lng={lng}
              onChange={(newLat, newLng) => {
                setLat(newLat);
                setLng(newLng);
              }}
            />
          </div>
        </div>
      </div>

      {/* Sectie 3: Foto's */}
      <div className="rounded-2xl border border-white/5 bg-zinc-900/30 p-5 backdrop-blur-sm">
        <h3 className={sectionHeaderClass}>
          <ImagePlus size={16} className="text-sky-400" />
          3. Foto&apos;s &amp; wie voegt toe
        </h3>

        <div className="space-y-5">
          <div>
            <label className={labelClass}>Foto&apos;s van winkel of materialen (Optioneel)</label>
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

          <div>
            <label className={labelClass}>Jouw naam (Optioneel)</label>
            <input
              value={toegevoegdDoor}
              onChange={(e) => setToegevoegdDoor(e.target.value)}
              placeholder="Zodat anderen weten wie dit toevoegde"
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          Winkel toegevoegd aan de directory. Bedankt!
        </div>
      )}

      {/* Actieknop */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-6 py-2.5 text-sm font-semibold text-zinc-950 transition-all hover:bg-sky-400 hover:shadow-[0_0_15px_rgba(14,165,233,0.3)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Bezig met toevoegen…
            </>
          ) : (
            <>
              <Plus size={16} /> Winkel toevoegen
            </>
          )}
        </button>
      </div>
    </form>
  );
}
