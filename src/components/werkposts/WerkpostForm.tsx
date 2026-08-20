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
  Plus,
  ChevronLeft,
  ChevronRight,
  Footprints,
  Rows3,
} from "lucide-react";
import {
  createWerkpost,
  uploadWerkpostFotos,
} from "@/app/dashboard/werkposts/actions";
import { REGIOS } from "@/lib/werkposts";

const inputClass =
  "w-full rounded-xl border border-white/10 bg-zinc-900/50 px-3.5 py-2.5 text-sm text-zinc-100 outline-none transition-all placeholder:text-zinc-500 focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/10";
const labelClass =
  "mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-400";
const sectionHeaderClass =
  "flex items-center gap-2 pb-3 mb-4 border-b border-white/5 text-sm font-semibold text-zinc-100";

const STEPS = [
  { id: "algemeen", label: "Algemeen", title: "Algemene Informatie", icon: FileText },
  { id: "locatie", label: "Locatie", title: "Locatie & Capaciteit", icon: MapPin },
  { id: "planning", label: "Planning", title: "Planning & Tarieven", icon: Calendar },
  { id: "extras", label: "Extras", title: "Vaardigheden & Visuals", icon: Tag },
] as const;

type StepIndex = 0 | 1 | 2 | 3;
type ViewMode = "wizard" | "all";

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
  const [viewMode, setViewMode] = useState<ViewMode>("wizard");
  const [step, setStep] = useState<StepIndex>(0);
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

  function validateStep(current: StepIndex): string | null {
    if (current === 0) {
      if (!titel.trim()) return "Vul een titel in.";
      if (!beschrijving.trim()) return "Vul een omschrijving in.";
      return null;
    }
    if (current === 1) {
      if (!regio.trim()) return "Kies of typ een regio.";
      if (!aantalPersonen || aantalPersonen < 1) {
        return "Aantal personen moet minstens 1 zijn.";
      }
      return null;
    }
    if (current === 2) {
      if (!startdatum) return "Kies een startdatum.";
      return null;
    }
    return null;
  }

  function goNext() {
    const validationError = validateStep(step);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setStep((prev) => Math.min(prev + 1, STEPS.length - 1) as StepIndex);
  }

  function goPrev() {
    setError(null);
    setStep((prev) => Math.max(prev - 1, 0) as StepIndex);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (viewMode === "wizard" && step !== STEPS.length - 1) {
      goNext();
      return;
    }

    // Bij "Alles tonen" (en de laatste wizardstap) valideren we alle stappen.
    for (const s of [0, 1, 2] as StepIndex[]) {
      const validationError = validateStep(s);
      if (validationError) {
        setError(validationError);
        if (viewMode === "wizard") setStep(s);
        return;
      }
    }

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

  const isLastStep = step === STEPS.length - 1;
  const showAll = viewMode === "all";

  function switchView(mode: ViewMode) {
    setError(null);
    setViewMode(mode);
  }

  function renderFields(index: StepIndex) {
    const autoFocus = viewMode === "wizard";

    if (index === 0) {
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={labelClass}>Titel van de post</label>
            <input
              value={titel}
              onChange={(e) => setTitel(e.target.value)}
              placeholder="bijv. Ervaren metselaars gezocht voor renovatieproject"
              className={inputClass}
              autoFocus={autoFocus}
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
                setUrgentie(
                  e.target.value as "normaal" | "urgent" | "zeer_urgent",
                )
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
      );
    }

    if (index === 1) {
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Regio / Provincie</label>
            <input
              value={regio}
              onChange={(e) => setRegio(e.target.value)}
              list="regio-opties"
              placeholder="Selecteer of typ een regio"
              className={inputClass}
              autoFocus={autoFocus}
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
      );
    }

    if (index === 2) {
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Startdatum</label>
            <input
              type="date"
              value={startdatum}
              onChange={(e) => setStartdatum(e.target.value)}
              className={inputClass}
              autoFocus={autoFocus}
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

          <div className="mt-2 grid gap-4 border-t border-white/5 pt-4 sm:col-span-2 sm:grid-cols-3">
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
      );
    }

    return (
      <div className="space-y-5">
        <div>
          <label className={labelClass}>
            Vereiste vaardigheden / Certificaten
          </label>
          <input
            value={vaardigheden}
            onChange={(e) => setVaardigheden(e.target.value)}
            placeholder="Metselen, VCA-vol, Beton storten, Tekening lezen (scheid met komma's)"
            className={inputClass}
            autoFocus={autoFocus}
          />
        </div>

        <div>
          <label className={labelClass}>
            Foto&apos;s van de werf of het werk (Optioneel)
          </label>
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
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-zinc-900/35 px-4 py-2.5 text-sm text-zinc-200 transition-all hover:border-zinc-700 hover:bg-white/5"
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
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {/* Weergave-schakelaar: stapsgewijze wizard of alles op één pagina. */}
      <div className="flex justify-end">
        <div
          role="tablist"
          aria-label="Weergave"
          className="inline-flex items-center gap-0.5 rounded-full border border-white/10 bg-zinc-900/50 p-0.5"
        >
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === "wizard"}
            onClick={() => switchView("wizard")}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              viewMode === "wizard"
                ? "bg-sky-500 text-zinc-950"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Footprints size={13} />
            Stapsgewijs
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === "all"}
            onClick={() => switchView("all")}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              viewMode === "all"
                ? "bg-sky-500 text-zinc-950"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Rows3 size={13} />
            Alles tonen
          </button>
        </div>
      </div>

      {!showAll && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-medium text-zinc-500">
              Stap {step + 1} van {STEPS.length}
            </p>
            <p className="text-xs text-zinc-500">{STEPS[step].label}</p>
          </div>
          <div className="flex items-center gap-2">
            {STEPS.map((item, index) => {
              const done = index < step;
              const active = index === step;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    if (index <= step) {
                      setError(null);
                      setStep(index as StepIndex);
                    }
                  }}
                  disabled={index > step}
                  className={`h-1.5 flex-1 rounded-full transition-colors ${
                    active
                      ? "bg-sky-500"
                      : done
                        ? "bg-sky-500/50"
                        : "bg-white/10"
                  } ${index <= step ? "cursor-pointer" : "cursor-default"}`}
                  aria-label={`Stap ${index + 1}: ${item.label}`}
                  aria-current={active ? "step" : undefined}
                />
              );
            })}
          </div>
          <div className="flex flex-wrap gap-2">
            {STEPS.map((item, index) => {
              const active = index === step;
              const done = index < step;
              return (
                <span
                  key={item.id}
                  className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${
                    active
                      ? "bg-sky-500/15 text-sky-300"
                      : done
                        ? "bg-white/5 text-zinc-400"
                        : "bg-transparent text-zinc-600"
                  }`}
                >
                  {index + 1}. {item.label}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {showAll ? (
        <div className="space-y-4">
          {STEPS.map((item, index) => {
            const SectionIcon = item.icon;
            return (
              <div
                key={item.id}
                className="rounded-2xl border border-white/5 bg-zinc-900/30 p-5 backdrop-blur-sm"
              >
                <h3 className={sectionHeaderClass}>
                  <SectionIcon size={16} className="text-sky-400" />
                  {index + 1}. {item.title}
                </h3>
                {renderFields(index as StepIndex)}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-white/5 bg-zinc-900/30 p-5 backdrop-blur-sm">
          {(() => {
            const StepIcon = STEPS[step].icon;
            return (
              <h3 className={sectionHeaderClass}>
                <StepIcon size={16} className="text-sky-400" />
                {step + 1}. {STEPS[step].title}
              </h3>
            );
          })()}
          {renderFields(step)}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between gap-3 pt-1">
        <div>
          {!showAll && step > 0 ? (
            <button
              type="button"
              onClick={goPrev}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-4 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/5 hover:text-zinc-100"
            >
              <ChevronLeft size={16} />
              Vorige
            </button>
          ) : !embedded ? (
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-full border border-white/10 px-5 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:bg-white/5 hover:text-zinc-200"
            >
              Annuleren
            </button>
          ) : null}
        </div>

        <div className="flex items-center gap-3">
          {!showAll && !isLastStep ? (
            <button
              type="button"
              onClick={goNext}
              className="inline-flex items-center gap-1.5 rounded-full bg-sky-500 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition-all hover:bg-sky-400 hover:shadow-[0_0_15px_rgba(14,165,233,0.3)]"
            >
              Volgende
              <ChevronRight size={16} />
            </button>
          ) : (
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-6 py-2.5 text-sm font-semibold text-zinc-950 transition-all hover:bg-sky-400 hover:shadow-[0_0_15px_rgba(14,165,233,0.3)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Bezig met
                  plaatsen…
                </>
              ) : (
                <>
                  <Plus size={16} /> Werkpost publiceren
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
