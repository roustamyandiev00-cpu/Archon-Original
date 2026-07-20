"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Calendar,
  CheckCircle2,
  Eye,
  FolderKanban,
  Hammer,
  PauseCircle,
  Bot,
  PenLine,
} from "lucide-react";
import { NieuwProjectModal } from "@/components/dashboard/projecten/NieuwProjectButton";
import ProjectAiWizard from "@/components/dashboard/projecten/ProjectAiWizard";
import TableRowActionMenu from "@/components/dashboard/TableRowActionMenu";
import {
  formatProjectDate,
  projectStatusMeta,
  type ProjectRow,
  type ProjectStatus,
} from "@/components/dashboard/projecten/projecten";

type StatusFilter = "all" | ProjectStatus;

const FILTERS: {
  id: ProjectStatus;
  label: string;
  icon: typeof Hammer;
}[] = [
  { id: "actief", label: "Actief", icon: Hammer },
  { id: "gepland", label: "Gepland", icon: Calendar },
  { id: "afgerond", label: "Afgerond", icon: CheckCircle2 },
  { id: "gepauzeerd", label: "Gepauzeerd", icon: PauseCircle },
];

export default function ProjectenView({
  projecten,
  fileCounts,
  isDemo,
  canCreate,
  agentName = "Lara",
}: {
  projecten: ProjectRow[];
  fileCounts: Record<string, number>;
  isDemo: boolean;
  canCreate: boolean;
  agentName?: string;
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [manualOpen, setManualOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiSession, setAiSession] = useState(0);
  const [menuId, setMenuId] = useState<string | null>(null);
  const manualTriggerRef = useRef<HTMLButtonElement>(null);
  const aiTriggerRef = useRef<HTMLButtonElement>(null);
  const emptyManualRef = useRef<HTMLButtonElement>(null);
  const emptyAiRef = useRef<HTMLButtonElement>(null);
  const lastManualRef = useRef<HTMLButtonElement | null>(null);
  const lastAiRef = useRef<HTMLButtonElement | null>(null);

  const counts = useMemo(() => {
    const base = {
      actief: 0,
      gepland: 0,
      afgerond: 0,
      gepauzeerd: 0,
    };
    for (const p of projecten) {
      const key = p.status as ProjectStatus;
      if (key in base) base[key] += 1;
    }
    return base;
  }, [projecten]);

  const filtered = useMemo(() => {
    if (filter === "all") return projecten;
    return projecten.filter((p) => p.status === filter);
  }, [filter, projecten]);

  function openManual(trigger: HTMLButtonElement | null) {
    lastManualRef.current = trigger;
    setManualOpen(true);
  }

  function openAi(trigger: HTMLButtonElement | null) {
    lastAiRef.current = trigger;
    setAiSession((n) => n + 1);
    setAiOpen(true);
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 border-b border-white/[0.08] pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight text-zinc-50 sm:text-2xl">
              Projecten
            </h1>
            {isDemo && (
              <span className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-300">
                Demo
              </span>
            )}
          </div>
          <p className="mt-1 max-w-2xl text-sm text-zinc-400">
            Volg je werven van planning tot oplevering — manueel of met je
            AI-agent die vragen stelt.
          </p>
        </div>
        {canCreate && (
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <button
              ref={manualTriggerRef}
              type="button"
              onClick={() => openManual(manualTriggerRef.current)}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/[0.04] px-4 text-sm font-medium text-zinc-100 transition-colors hover:border-white/25 hover:bg-white/[0.07] sm:w-auto"
            >
              <PenLine size={16} />
              Nieuw manueel
            </button>
            <button
              ref={aiTriggerRef}
              type="button"
              onClick={() => openAi(aiTriggerRef.current)}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-sky-500 px-4 text-sm font-semibold text-zinc-950 transition-colors hover:bg-sky-400 sm:w-auto"
            >
              <Bot size={16} />
              Met AI-agent
            </button>
          </div>
        )}
      </header>

      {projecten.length > 0 && (
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="Projecten filteren op status"
        >
          <FilterChip
            active={filter === "all"}
            label="Alle"
            count={projecten.length}
            onClick={() => setFilter("all")}
          />
          {FILTERS.map((f) => (
            <FilterChip
              key={f.id}
              active={filter === f.id}
              label={f.label}
              count={counts[f.id]}
              icon={<f.icon size={12} />}
              onClick={() => setFilter(f.id)}
            />
          ))}
        </div>
      )}

      <section className="overflow-hidden rounded-xl border border-white/[0.08] bg-zinc-900/40">
        <div className="flex items-center justify-between border-b border-white/[0.08] px-4 py-3 sm:px-5">
          <h2 className="text-sm font-semibold text-zinc-100">
            {filter === "all"
              ? "Alle projecten"
              : FILTERS.find((f) => f.id === filter)?.label ?? "Projecten"}
          </h2>
          <span className="text-xs tabular-nums text-zinc-500">
            {filtered.length}{" "}
            {filtered.length === 1 ? "project" : "projecten"}
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="grid place-items-center px-6 py-16 text-center">
            <div className="max-w-sm space-y-3">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl border border-white/[0.08] bg-zinc-900 text-sky-400">
                <FolderKanban size={22} />
              </span>
              <h3 className="text-base font-semibold text-zinc-50">
                {projecten.length === 0
                  ? "Nog geen projecten"
                  : "Geen projecten in deze status"}
              </h3>
              <p className="text-sm leading-relaxed text-zinc-400">
                {projecten.length === 0
                  ? "Maak je eerste project aan en volg de voortgang van planning tot oplevering."
                  : "Kies een andere status of toon opnieuw alle projecten."}
              </p>
              {projecten.length > 0 && (
                <button
                  type="button"
                  onClick={() => setFilter("all")}
                  className="inline-flex h-10 items-center justify-center rounded-lg border border-white/15 bg-white/[0.04] px-4 text-sm font-medium text-zinc-100 hover:bg-white/[0.07]"
                >
                  Alle projecten tonen
                </button>
              )}
              {canCreate && projecten.length === 0 && (
                <div className="flex flex-col items-center gap-2 pt-1 sm:flex-row sm:justify-center">
                  <button
                    ref={emptyManualRef}
                    type="button"
                    onClick={() => openManual(emptyManualRef.current)}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/[0.04] px-4 text-sm font-medium text-zinc-100 hover:bg-white/[0.07]"
                  >
                    <PenLine size={16} />
                    Manueel
                  </button>
                  <button
                    ref={emptyAiRef}
                    type="button"
                    onClick={() => openAi(emptyAiRef.current)}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-sky-500 px-4 text-sm font-semibold text-zinc-950 hover:bg-sky-400"
                  >
                    <Bot size={16} />
                    Met AI-agent
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="hidden md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.08] text-left text-[11px] uppercase tracking-wider text-zinc-500">
                    <th className="px-5 py-3 font-semibold">Project</th>
                    <th className="px-5 py-3 font-semibold">Klant</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 font-semibold">Planning</th>
                    <th className="px-5 py-3 font-semibold">
                      <span className="sr-only">Acties</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => {
                    const meta = projectStatusMeta(p.status);
                    const files = fileCounts[p.id] ?? 0;
                    return (
                      <tr
                        key={p.id}
                        className="border-b border-white/[0.06] transition-colors last:border-0 hover:bg-white/[0.03]"
                      >
                        <td className="px-5 py-3.5">
                          {isDemo ? (
                            <span className="font-medium text-zinc-100">
                              {p.naam}
                            </span>
                          ) : (
                            <Link
                              href={`/dashboard/offertes/projecten/${p.id}`}
                              className="font-medium text-zinc-50 transition-colors hover:text-sky-300"
                            >
                              {p.naam}
                            </Link>
                          )}
                          {!isDemo && files > 0 && (
                            <p className="mt-0.5 text-[11px] text-zinc-500">
                              {files} {files === 1 ? "bestand" : "bestanden"}
                            </p>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-zinc-400">
                          {p.klant_naam}
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium ${meta.tone}`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${meta.dot}`}
                              aria-hidden
                            />
                            {meta.label}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-zinc-400">
                          {p.start_datum_label || "—"}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          {!isDemo && (
                            <TableRowActionMenu
                              label={`Acties voor ${p.naam}`}
                              open={menuId === p.id}
                              onOpenChange={(next) =>
                                setMenuId(next ? p.id : null)
                              }
                              items={[
                                {
                                  label: "Openen",
                                  icon: <Eye size={14} />,
                                  onClick: () => {
                                    router.push(
                                      `/dashboard/offertes/projecten/${p.id}`,
                                    );
                                  },
                                },
                              ]}
                            />
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <ul className="divide-y divide-white/[0.06] md:hidden">
              {filtered.map((p) => {
                const meta = projectStatusMeta(p.status);
                const files = fileCounts[p.id] ?? 0;
                return (
                  <li key={p.id} className="px-4 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        {isDemo ? (
                          <p className="font-medium text-zinc-50">{p.naam}</p>
                        ) : (
                          <Link
                            href={`/dashboard/offertes/projecten/${p.id}`}
                            className="font-medium text-zinc-50 hover:text-sky-300"
                          >
                            {p.naam}
                          </Link>
                        )}
                        <p className="mt-0.5 text-sm text-zinc-400">
                          {p.klant_naam}
                        </p>
                      </div>
                      <span
                        className={`inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium ${meta.tone}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${meta.dot}`}
                          aria-hidden
                        />
                        {meta.label}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
                      <span>Planning: {p.start_datum_label || "—"}</span>
                      <span>Aangemaakt: {formatProjectDate(p.created_at)}</span>
                      {!isDemo && files > 0 && (
                        <span>
                          {files} {files === 1 ? "bestand" : "bestanden"}
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </section>

      {canCreate && (
        <>
          <NieuwProjectModal
            open={manualOpen}
            onOpenChange={setManualOpen}
            returnFocusRef={lastManualRef}
          />
          <ProjectAiWizard
            key={aiSession}
            open={aiOpen}
            onOpenChange={setAiOpen}
            agentName={agentName}
            returnFocusRef={lastAiRef}
          />
        </>
      )}
    </div>
  );
}

function FilterChip({
  active,
  label,
  count,
  icon,
  onClick,
}: {
  active: boolean;
  label: string;
  count: number;
  icon?: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`inline-flex h-11 items-center gap-2 rounded-lg border px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/40 ${
        active
          ? "border-sky-500/40 bg-sky-500/15 text-sky-100"
          : "border-white/[0.08] bg-zinc-900/50 text-zinc-400 hover:border-white/15 hover:text-zinc-200"
      }`}
    >
      {icon}
      <span>{label}</span>
      <span
        className={`rounded-md px-1.5 py-0.5 font-mono text-[11px] tabular-nums ${
          active
            ? "bg-sky-500/20 text-sky-200"
            : "bg-white/[0.06] text-zinc-500"
        }`}
      >
        {count}
      </span>
    </button>
  );
}
