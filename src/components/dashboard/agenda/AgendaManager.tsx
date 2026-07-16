"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import {
  CalendarDays,
  Check,
  Loader2,
  MapPin,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import {
  createAgendaAfspraak,
  deleteAgendaAfspraak,
  updateAgendaAfspraakStatus,
} from "@/app/dashboard/agenda/actions";

export type AgendaAfspraak = {
  id: number;
  titel: string;
  beschrijving: string | null;
  locatie: string | null;
  startTijd: string;
  eindTijd: string | null;
  status: string | null;
  type: string | null;
};

const inputClass =
  "w-full rounded-xl border border-white/10 bg-zinc-900/70 px-3 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-sky-500/60";

const STATUS_OPTIONS = [
  { id: "gepland", label: "Gepland" },
  { id: "bevestigd", label: "Bevestigd" },
  { id: "afgerond", label: "Afgerond" },
  { id: "geannuleerd", label: "Geannuleerd" },
] as const;

function formatWhen(start: string, end: string | null) {
  const s = new Date(start);
  if (Number.isNaN(s.getTime())) return "—";
  const date = s.toLocaleDateString("nl-BE", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
  const time = s.toLocaleTimeString("nl-BE", {
    hour: "2-digit",
    minute: "2-digit",
  });
  if (!end) return `${date} · ${time}`;
  const e = new Date(end);
  if (Number.isNaN(e.getTime())) return `${date} · ${time}`;
  return `${date} · ${time}–${e.toLocaleTimeString("nl-BE", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

function todayLocal() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

export default function AgendaManager({
  afspraken,
  nowMs,
}: {
  afspraken: AgendaAfspraak[];
  /** Stabiele "nu"-timestamp van de serverrender (ms). Vermijdt impure Date.now in render. */
  nowMs: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    titel: "",
    datum: todayLocal(),
    startTijd: "09:00",
    eindTijd: "10:00",
    locatie: "",
    beschrijving: "",
    type: "werfbezoek",
  });

  const { upcoming, past } = useMemo(() => {
    const up: AgendaAfspraak[] = [];
    const pa: AgendaAfspraak[] = [];
    for (const a of afspraken) {
      const t = new Date(a.startTijd).getTime();
      if (!Number.isNaN(t) && t >= nowMs - 60 * 60 * 1000) up.push(a);
      else pa.push(a);
    }
    return { upcoming: up, past: pa };
  }, [afspraken, nowMs]);

  function close() {
    setOpen(false);
    setError(null);
    setForm({
      titel: "",
      datum: todayLocal(),
      startTijd: "09:00",
      eindTijd: "10:00",
      locatie: "",
      beschrijving: "",
      type: "werfbezoek",
    });
  }

  function submit() {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await createAgendaAfspraak(form);
      if ("error" in result) {
        setError(result.error ?? "Aanmaken mislukt.");
        return;
      }
      setSuccess("Afspraak toegevoegd.");
      close();
      router.refresh();
    });
  }

  function setStatus(id: number, status: string) {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await updateAgendaAfspraakStatus(id, status);
      if ("error" in result) {
        setError(result.error ?? "Status bijwerken mislukt.");
        return;
      }
      setSuccess("Status bijgewerkt.");
      router.refresh();
    });
  }

  function remove(id: number) {
    if (!window.confirm("Deze afspraak verwijderen?")) return;
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await deleteAgendaAfspraak(id);
      if ("error" in result) {
        setError(result.error ?? "Verwijderen mislukt.");
        return;
      }
      setSuccess("Afspraak verwijderd.");
      router.refresh();
    });
  }

  function list(items: AgendaAfspraak[], empty: string) {
    if (items.length === 0) {
      return (
        <p className="rounded-xl border border-dashed border-white/10 bg-zinc-950/40 px-4 py-8 text-center text-sm text-zinc-500">
          {empty}
        </p>
      );
    }

    return (
      <div className="divide-y divide-white/10 overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/50">
        {items.map((a) => (
          <article
            key={a.id}
            className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"
          >
            <div className="min-w-0">
              <p className="font-medium text-zinc-100">{a.titel}</p>
              <p className="mt-0.5 text-sm text-zinc-500">
                {formatWhen(a.startTijd, a.eindTijd)}
                {a.type ? ` · ${a.type}` : ""}
              </p>
              {a.locatie && (
                <p className="mt-1 flex items-center gap-1.5 text-xs text-zinc-500">
                  <MapPin size={12} />
                  {a.locatie}
                </p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={a.status ?? "gepland"}
                disabled={pending}
                onChange={(e) => setStatus(a.id, e.target.value)}
                className="rounded-lg border border-white/10 bg-zinc-900 px-2.5 py-2 text-sm text-zinc-200 disabled:opacity-50"
                aria-label={`Status van ${a.titel}`}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={pending}
                onClick={() => remove(a.id)}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/10 px-3 text-sm text-zinc-400 hover:border-rose-500/40 hover:text-rose-300 disabled:opacity-50"
              >
                <Trash2 size={14} />
                Verwijderen
              </button>
            </div>
          </article>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-zinc-500">
          {upcoming.length} komende · {past.length} voorbije
        </p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-sky-400"
        >
          <Plus size={16} />
          Nieuwe afspraak
        </button>
      </div>

      {error && (
        <p className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          {error}
        </p>
      )}
      {success && (
        <p className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
          <Check size={16} />
          {success}
        </p>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-zinc-200">Komend</h2>
        {list(upcoming, "Geen komende afspraken. Plan een werfbezoek of overleg.")}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-zinc-200">Voorbij</h2>
        {list(past, "Nog geen eerdere afspraken.")}
      </section>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-900 p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarDays size={18} className="text-sky-400" />
                <h2 className="text-lg font-semibold text-zinc-100">
                  Nieuwe afspraak
                </h2>
              </div>
              <button
                type="button"
                onClick={close}
                className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="mb-1.5 block text-sm text-zinc-300">Titel</label>
                <input
                  className={inputClass}
                  value={form.titel}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, titel: e.target.value }))
                  }
                  placeholder="bv. Werfbezoek Peeters"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm text-zinc-300">Datum</label>
                  <input
                    type="date"
                    className={inputClass}
                    value={form.datum}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, datum: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm text-zinc-300">Type</label>
                  <select
                    className={inputClass}
                    value={form.type}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, type: e.target.value }))
                    }
                  >
                    <option value="werfbezoek">Werfbezoek</option>
                    <option value="overleg">Overleg</option>
                    <option value="intern">Intern</option>
                    <option value="opmeting">Opmeting</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm text-zinc-300">Start</label>
                  <input
                    type="time"
                    className={inputClass}
                    value={form.startTijd}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, startTijd: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm text-zinc-300">Einde</label>
                  <input
                    type="time"
                    className={inputClass}
                    value={form.eindTijd}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, eindTijd: e.target.value }))
                    }
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-zinc-300">Locatie</label>
                <input
                  className={inputClass}
                  value={form.locatie}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, locatie: e.target.value }))
                  }
                  placeholder="Adres of werflocatie"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-zinc-300">
                  Notitie
                </label>
                <textarea
                  className={`${inputClass} min-h-[80px] resize-y`}
                  value={form.beschrijving}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, beschrijving: e.target.value }))
                  }
                  placeholder="Optioneel"
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={close}
                className="rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-300 hover:bg-white/5"
              >
                Annuleren
              </button>
              <button
                type="button"
                disabled={pending || !form.titel.trim()}
                onClick={submit}
                className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-sky-400 disabled:opacity-50"
              >
                {pending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Plus size={16} />
                )}
                Opslaan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
