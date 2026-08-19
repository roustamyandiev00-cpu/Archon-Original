"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Download,
  ExternalLink,
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
import { integratiesSettingsHref } from "@/lib/integraties";
import { cn } from "@/lib/utils";

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

type ViewMode = "week" | "dag" | "lijst";

const inputClass =
  "w-full rounded-xl border border-white/10 bg-zinc-950/70 px-3 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-sky-500/60";

const STATUS_OPTIONS = [
  { id: "gepland", label: "Gepland" },
  { id: "bevestigd", label: "Bevestigd" },
  { id: "afgerond", label: "Afgerond" },
  { id: "geannuleerd", label: "Geannuleerd" },
] as const;

const TYPE_OPTIONS = [
  { id: "werfbezoek", label: "Werfbezoek" },
  { id: "overleg", label: "Overleg" },
  { id: "intern", label: "Intern" },
  { id: "opmeting", label: "Opmeting" },
] as const;

const WORK_HOURS = Array.from({ length: 12 }, (_, index) => index + 7);

function parseDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatTime(start: string, end: string | null) {
  const startDate = parseDate(start);
  if (!startDate) return "--:--";
  const startLabel = startDate.toLocaleTimeString("nl-BE", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const endDate = end ? parseDate(end) : null;
  if (!endDate) return startLabel;
  return `${startLabel}-${endDate.toLocaleTimeString("nl-BE", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

function todayLocal() {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
}

function dateKey(date: Date) {
  const local = new Date(date);
  local.setMinutes(local.getMinutes() - local.getTimezoneOffset());
  return local.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function startOfWeek(date: Date) {
  const start = new Date(date);
  const day = start.getDay() || 7;
  start.setDate(start.getDate() - day + 1);
  start.setHours(0, 0, 0, 0);
  return start;
}

function formatDayHeader(date: Date) {
  return {
    weekday: date.toLocaleDateString("nl-BE", { weekday: "short" }),
    day: date.toLocaleDateString("nl-BE", {
      day: "2-digit",
      month: "short",
    }),
  };
}

function hourLabel(hour: number) {
  return `${String(hour).padStart(2, "0")}:00`;
}

function afspraakHour(afspraak: AgendaAfspraak) {
  const start = parseDate(afspraak.startTijd);
  if (!start) return null;
  return start.getHours();
}

function toGoogleDate(value: string) {
  return value.replaceAll("-", "").replaceAll(":", "").replace(".000", "");
}

function googleCalendarUrl(afspraak: AgendaAfspraak) {
  const start = parseDate(afspraak.startTijd);
  if (!start) return null;
  const end = parseDate(afspraak.eindTijd ?? "");
  const safeEnd = end ?? new Date(start.getTime() + 60 * 60 * 1000);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: afspraak.titel,
    dates: `${toGoogleDate(start.toISOString())}/${toGoogleDate(safeEnd.toISOString())}`,
    details: afspraak.beschrijving ?? "",
    location: afspraak.locatie ?? "",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function escapeIcs(value: string) {
  return value
    .replaceAll("\\", "\\\\")
    .replaceAll(";", "\\;")
    .replaceAll(",", "\\,")
    .replaceAll("\n", "\\n");
}

function downloadIcs(afspraak: AgendaAfspraak) {
  const start = parseDate(afspraak.startTijd);
  if (!start) return;
  const end = parseDate(afspraak.eindTijd ?? "");
  const safeEnd = end ?? new Date(start.getTime() + 60 * 60 * 1000);
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ArchonPro//Agenda//NL",
    "BEGIN:VEVENT",
    `UID:archonpro-afspraak-${afspraak.id}@archonpro`,
    `DTSTAMP:${toGoogleDate(new Date().toISOString())}`,
    `DTSTART:${toGoogleDate(start.toISOString())}`,
    `DTEND:${toGoogleDate(safeEnd.toISOString())}`,
    `SUMMARY:${escapeIcs(afspraak.titel)}`,
    afspraak.locatie ? `LOCATION:${escapeIcs(afspraak.locatie)}` : "",
    afspraak.beschrijving
      ? `DESCRIPTION:${escapeIcs(afspraak.beschrijving)}`
      : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);
  const blob = new Blob([lines.join("\r\n")], { type: "text/calendar" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${afspraak.titel.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "afspraak"}.ics`;
  link.click();
  URL.revokeObjectURL(url);
}

function statusBadge(status: string | null) {
  const label =
    STATUS_OPTIONS.find((option) => option.id === status)?.label ?? "Gepland";
  return (
    <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-xs text-zinc-300">
      {label}
    </span>
  );
}

export default function AgendaManager({
  afspraken,
  nowMs,
}: {
  afspraken: AgendaAfspraak[];
  nowMs: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [typeFilter, setTypeFilter] = useState("alles");
  const [visibleDate, setVisibleDate] = useState(() => new Date(nowMs));
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

  const sorted = useMemo(
    () =>
      [...afspraken].sort(
        (left, right) =>
          new Date(left.startTijd).getTime() - new Date(right.startTijd).getTime(),
      ),
    [afspraken],
  );

  const filtered = useMemo(
    () =>
      typeFilter === "alles"
        ? sorted
        : sorted.filter((afspraak) => afspraak.type === typeFilter),
    [sorted, typeFilter],
  );

  const { upcoming, past, todayCount, weekCount } = useMemo(() => {
    const today = new Date(nowMs);
    const todayKey = today.toISOString().slice(0, 10);
    const weekEnd = nowMs + 7 * 24 * 60 * 60 * 1000;
    const upcomingItems: AgendaAfspraak[] = [];
    const pastItems: AgendaAfspraak[] = [];
    let todayItems = 0;
    let weekItems = 0;

    for (const afspraak of filtered) {
      const time = new Date(afspraak.startTijd).getTime();
      if (!Number.isNaN(time) && time >= nowMs - 60 * 60 * 1000) {
        upcomingItems.push(afspraak);
      } else {
        pastItems.push(afspraak);
      }
      if (afspraak.startTijd.slice(0, 10) === todayKey) todayItems += 1;
      if (!Number.isNaN(time) && time >= nowMs && time <= weekEnd) {
        weekItems += 1;
      }
    }

    return {
      upcoming: upcomingItems,
      past: pastItems.reverse(),
      todayCount: todayItems,
      weekCount: weekItems,
    };
  }, [filtered, nowMs]);

  const weekStart = useMemo(() => startOfWeek(visibleDate), [visibleDate]);
  const visibleDays = useMemo(
    () =>
      viewMode === "dag"
        ? [visibleDate]
        : Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)),
    [viewMode, visibleDate, weekStart],
  );
  const calendarTitle = useMemo(() => {
    if (viewMode === "dag") {
      return visibleDate.toLocaleDateString("nl-BE", {
        weekday: "long",
        day: "2-digit",
        month: "long",
      });
    }
    const end = addDays(weekStart, 6);
    return `${weekStart.toLocaleDateString("nl-BE", {
      day: "2-digit",
      month: "short",
    })} - ${end.toLocaleDateString("nl-BE", {
      day: "2-digit",
      month: "short",
    })}`;
  }, [viewMode, visibleDate, weekStart]);
  const appointmentsBySlot = useMemo(() => {
    const slots = new Map<string, AgendaAfspraak[]>();
    for (const afspraak of filtered) {
      const start = parseDate(afspraak.startTijd);
      const hour = afspraakHour(afspraak);
      if (!start || hour == null) continue;
      const key = `${dateKey(start)}-${hour}`;
      slots.set(key, [...(slots.get(key) ?? []), afspraak]);
    }
    return slots;
  }, [filtered]);

  function resetForm() {
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

  function openAtSlot(day: Date, hour: number) {
    const endHour = Math.min(hour + 1, 23);
    setForm({
      titel: "",
      datum: dateKey(day),
      startTijd: `${String(hour).padStart(2, "0")}:00`,
      eindTijd: `${String(endHour).padStart(2, "0")}:00`,
      locatie: "",
      beschrijving: "",
      type: "werfbezoek",
    });
    setError(null);
    setOpen(true);
  }

  function moveCalendar(direction: -1 | 1) {
    setVisibleDate((current) =>
      addDays(current, direction * (viewMode === "dag" ? 1 : 7)),
    );
  }

  function close() {
    setOpen(false);
    setError(null);
    resetForm();
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
      close();
      setSuccess("Afspraak toegevoegd.");
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

  function appointmentCard(afspraak: AgendaAfspraak) {
    const googleUrl = googleCalendarUrl(afspraak);
    return (
      <article
        key={afspraak.id}
        className="rounded-2xl border border-white/10 bg-zinc-950/55 p-4 shadow-sm shadow-black/20"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium text-zinc-100">{afspraak.titel}</p>
              {statusBadge(afspraak.status)}
              {afspraak.type && (
                <span className="rounded-full border border-sky-400/20 bg-sky-400/10 px-2.5 py-1 text-xs text-sky-200">
                  {afspraak.type}
                </span>
              )}
            </div>
            <p className="flex items-center gap-2 text-sm text-zinc-400">
              <Clock3 size={14} className="text-zinc-500" />
              {formatTime(afspraak.startTijd, afspraak.eindTijd)}
            </p>
            {afspraak.locatie && (
              <p className="flex items-center gap-2 text-sm text-zinc-400">
                <MapPin size={14} className="text-zinc-500" />
                {afspraak.locatie}
              </p>
            )}
            {afspraak.beschrijving && (
              <p className="max-w-2xl text-sm leading-6 text-zinc-500">
                {afspraak.beschrijving}
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={afspraak.status ?? "gepland"}
              disabled={pending}
              onChange={(event) => setStatus(afspraak.id, event.target.value)}
              className="h-9 rounded-lg border border-white/10 bg-zinc-900 px-2.5 text-sm text-zinc-200 disabled:opacity-50"
              aria-label={`Status van ${afspraak.titel}`}
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status.id} value={status.id}>
                  {status.label}
                </option>
              ))}
            </select>
            {googleUrl && (
              <a
                href={googleUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/10 px-3 text-sm text-zinc-300 hover:border-sky-400/40 hover:text-sky-200"
              >
                <ExternalLink size={14} />
                Google
              </a>
            )}
            <button
              type="button"
              onClick={() => downloadIcs(afspraak)}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/10 px-3 text-sm text-zinc-300 hover:border-emerald-400/40 hover:text-emerald-200"
            >
              <Download size={14} />
              .ics
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => remove(afspraak.id)}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/10 px-3 text-sm text-zinc-400 hover:border-rose-500/40 hover:text-rose-300 disabled:opacity-50"
            >
              <Trash2 size={14} />
              Verwijderen
            </button>
          </div>
        </div>
      </article>
    );
  }

  function calendarAppointment(afspraak: AgendaAfspraak) {
    const googleUrl = googleCalendarUrl(afspraak);
    return (
      <div
        key={afspraak.id}
        className="dashboard-agenda-appointment group rounded-lg border border-sky-400/25 bg-sky-400/10 p-2 text-left shadow-sm shadow-black/20"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-sky-100">
              {afspraak.titel}
            </p>
            <p className="mt-0.5 text-[11px] text-sky-200/80">
              {formatTime(afspraak.startTijd, afspraak.eindTijd)}
            </p>
          </div>
          <button
            type="button"
            disabled={pending}
            onClick={(event) => {
              event.stopPropagation();
              setStatus(
                afspraak.id,
                afspraak.status === "afgerond" ? "gepland" : "afgerond",
              );
            }}
            className="grid h-6 w-6 shrink-0 place-items-center rounded-md border border-white/10 text-sky-100 opacity-80 hover:bg-white/10 disabled:opacity-40"
            aria-label={`Status van ${afspraak.titel} wisselen`}
          >
            <Check size={12} />
          </button>
        </div>
        {afspraak.locatie && (
          <p className="mt-1 truncate text-[11px] text-zinc-400">
            {afspraak.locatie}
          </p>
        )}
        <div className="mt-2 flex flex-wrap gap-1.5">
          {googleUrl && (
            <a
              href={googleUrl}
              target="_blank"
              rel="noreferrer"
              onClick={(event) => event.stopPropagation()}
              className="rounded-md border border-white/10 px-2 py-1 text-[11px] text-zinc-300 hover:text-sky-200"
            >
              Google
            </a>
          )}
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              downloadIcs(afspraak);
            }}
            className="rounded-md border border-white/10 px-2 py-1 text-[11px] text-zinc-300 hover:text-emerald-200"
          >
            .ics
          </button>
        </div>
      </div>
    );
  }

  function calendarGrid() {
    return (
      <section className="dashboard-agenda-calendar flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/45">
        <div className="dashboard-agenda-calendar-toolbar flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-zinc-100">
              {calendarTitle}
            </p>
            <p className="mt-0.5 text-xs text-zinc-500">
              Klik op een leeg uur om direct een afspraak te plannen.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => moveCalendar(-1)}
              className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-zinc-300 hover:bg-white/5"
              aria-label="Vorige periode"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={() => setVisibleDate(new Date(nowMs))}
              className="h-8 rounded-lg border border-white/10 px-3 text-xs font-medium text-zinc-300 hover:bg-white/5"
            >
              Vandaag
            </button>
            <button
              type="button"
              onClick={() => moveCalendar(1)}
              className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-zinc-300 hover:bg-white/5"
              aria-label="Volgende periode"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div className="dashboard-agenda-calendar-scroll min-h-0 flex-1 overflow-auto">
          <div
            className="dashboard-agenda-calendar-grid grid min-w-[760px]"
            style={{
              gridTemplateColumns: `72px repeat(${visibleDays.length}, minmax(0, 1fr))`,
            }}
          >
            <div className="dashboard-agenda-corner sticky left-0 top-0 z-30 border-b border-r border-white/10 bg-zinc-950/95 backdrop-blur" />
            {visibleDays.map((day) => {
              const header = formatDayHeader(day);
              const isToday = dateKey(day) === todayLocal();
              return (
                <div
                  key={dateKey(day)}
                  className={cn(
                    "dashboard-agenda-day-header sticky top-0 z-20 border-b border-r border-white/10 px-3 py-3 last:border-r-0 backdrop-blur",
                    isToday
                      ? "dashboard-agenda-day-header--today bg-sky-500/10"
                      : "bg-zinc-950/95",
                  )}
                >
                  <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">
                    {header.weekday}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-zinc-100">
                    {header.day}
                  </p>
                </div>
              );
            })}

            {WORK_HOURS.map((hour) => (
              <div key={hour} className="contents">
                <div className="dashboard-agenda-time-cell sticky left-0 z-10 border-r border-t border-white/10 bg-zinc-950/95 px-3 py-3 text-xs text-zinc-500 backdrop-blur">
                  {hourLabel(hour)}
                </div>
                {visibleDays.map((day) => {
                  const slotKey = `${dateKey(day)}-${hour}`;
                  const items = appointmentsBySlot.get(slotKey) ?? [];
                  return (
                    <button
                      key={slotKey}
                      type="button"
                      onClick={() => openAtSlot(day, hour)}
                      className="dashboard-agenda-slot min-h-[78px] border-r border-t border-white/10 p-2 text-left transition-colors last:border-r-0 hover:bg-white/[0.03]"
                      aria-label={`Afspraak plannen op ${dateKey(day)} om ${hourLabel(hour)}`}
                    >
                      <div className="space-y-2">
                        {items.length === 0 ? (
                          <span className="dashboard-agenda-slot-empty text-[11px] text-zinc-700">
                            Vrij
                          </span>
                        ) : (
                          items.map(calendarAppointment)
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-5">
      <section className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Vandaag", value: todayCount },
          { label: "Komende 7 dagen", value: weekCount },
          { label: "Alle afspraken", value: afspraken.length },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
          >
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-zinc-500">
              {item.label}
            </p>
            <p className="mt-2 text-2xl font-semibold text-zinc-100">
              {item.value}
            </p>
          </div>
        ))}
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {(["week", "dag", "lijst"] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setViewMode(mode)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm capitalize",
                viewMode === mode
                  ? "border-sky-400/50 bg-sky-400/10 text-sky-100"
                  : "border-white/10 text-zinc-400 hover:text-zinc-200",
              )}
            >
              {mode}
            </button>
          ))}
          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            className="h-9 rounded-full border border-white/10 bg-zinc-950 px-3 text-sm text-zinc-300"
            aria-label="Filter op type afspraak"
          >
            <option value="alles">Alle types</option>
            {TYPE_OPTIONS.map((type) => (
              <option key={type.id} value={type.id}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={integratiesSettingsHref({ provider: "google-calendar" })}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-zinc-300 hover:border-sky-400/40 hover:text-sky-200"
          >
            <ExternalLink size={15} />
            Google Agenda koppelen
          </Link>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-sky-400"
          >
            <Plus size={16} />
            Nieuwe afspraak
          </button>
        </div>
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

      {viewMode === "week" || viewMode === "dag" ? (
        <div className="min-h-0 flex-1">{calendarGrid()}</div>
      ) : (
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto pr-1">
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-zinc-200">Komend</h2>
            {upcoming.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-white/10 bg-zinc-950/40 px-4 py-10 text-center text-sm text-zinc-500">
                Geen komende afspraken. Plan een werfbezoek of overleg.
              </p>
            ) : (
              upcoming.map(appointmentCard)
            )}
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-zinc-200">Voorbij</h2>
            {past.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-white/10 bg-zinc-950/40 px-4 py-8 text-center text-sm text-zinc-500">
                Nog geen eerdere afspraken.
              </p>
            ) : (
              past.map(appointmentCard)
            )}
          </section>
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-zinc-900 p-5 shadow-2xl">
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
                aria-label="Venster sluiten"
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
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      titel: event.target.value,
                    }))
                  }
                  placeholder="bv. Werfbezoek Peeters"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm text-zinc-300">Datum</label>
                  <input
                    type="date"
                    className={inputClass}
                    value={form.datum}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        datum: event.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm text-zinc-300">Type</label>
                  <select
                    className={inputClass}
                    value={form.type}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        type: event.target.value,
                      }))
                    }
                  >
                    {TYPE_OPTIONS.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm text-zinc-300">Start</label>
                  <input
                    type="time"
                    className={inputClass}
                    value={form.startTijd}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        startTijd: event.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm text-zinc-300">Einde</label>
                  <input
                    type="time"
                    className={inputClass}
                    value={form.eindTijd}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        eindTijd: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-zinc-300">Locatie</label>
                <input
                  className={inputClass}
                  value={form.locatie}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      locatie: event.target.value,
                    }))
                  }
                  placeholder="Adres of werflocatie"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-zinc-300">
                  Notitie
                </label>
                <textarea
                  className={`${inputClass} min-h-[88px] resize-y`}
                  value={form.beschrijving}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      beschrijving: event.target.value,
                    }))
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
