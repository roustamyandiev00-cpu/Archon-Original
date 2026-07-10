import Link from "next/link";
import {
  FolderKanban,
  Hammer,
  PauseCircle,
  CheckCircle2,
  Calendar,
} from "lucide-react";
import { getCompanyContext } from "@/lib/company";
import { isActivePreviewMode } from "@/components/dashboard/context";
import GlowCard from "@/components/dashboard/GlowCard";
import NieuwProjectButton from "@/components/dashboard/projecten/NieuwProjectButton";
import {
  DEMO_PROJECTEN,
  formatProjectDate,
  projectStatusMeta,
  type ProjectRow,
} from "@/components/dashboard/projecten/projecten";
import { showDemoData } from "@/lib/demo-mode";

export const metadata = { title: "Projecten — ArchonPro" };

export default async function ProjectenPage() {
  const preview = await isActivePreviewMode();
  const { supabase, companyId } = await getCompanyContext();

  let projecten: ProjectRow[] = [];

  if (companyId) {
    const { data } = await supabase
      .from("projecten")
      .select("id, naam, klant_naam, start_datum_label, status, created_at")
      .eq("bedrijf_id", companyId)
      .order("created_at", { ascending: false });

    projecten = (data ?? []) as ProjectRow[];
  }

  const isDemo = showDemoData(preview, projecten.length === 0);
  if (isDemo) projecten = DEMO_PROJECTEN;

  const actief = projecten.filter((p) => p.status === "actief").length;
  const gepland = projecten.filter((p) => p.status === "gepland").length;
  const afgerond = projecten.filter((p) => p.status === "afgerond").length;
  const gepauzeerd = projecten.filter((p) => p.status === "gepauzeerd").length;

  const stats = [
    { label: "Actief", value: String(actief), icon: Hammer },
    { label: "Gepland", value: String(gepland), icon: Calendar },
    { label: "Afgerond", value: String(afgerond), icon: CheckCircle2 },
    { label: "Gepauzeerd", value: String(gepauzeerd), icon: PauseCircle },
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-violet-500/10 text-violet-400">
            <FolderKanban size={20} />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-zinc-50">Projecten</h1>
              {isDemo && (
                <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-300">
                  Demo
                </span>
              )}
            </div>
            <p className="mt-0.5 text-sm text-zinc-500">
              Volg je werven en projecten van offerte tot oplevering.
            </p>
          </div>
        </div>
        {!preview && companyId && <NieuwProjectButton />}
      </header>

      {!companyId && !preview && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
          Je account is nog niet aan een bedrijf gekoppeld.
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-white/10 bg-zinc-900/60 p-4 backdrop-blur"
          >
            <div className="flex items-center justify-between">
              <p className="text-[11px] uppercase tracking-wide text-zinc-500">
                {s.label}
              </p>
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-violet-500/10 text-violet-400">
                <s.icon size={15} />
              </span>
            </div>
            <p className="mt-2 font-mono text-2xl font-semibold text-zinc-50">
              {s.value}
            </p>
          </div>
        ))}
      </div>

      <GlowCard innerClassName="overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
            Alle projecten
          </h2>
          <span className="text-xs text-zinc-500">{projecten.length} totaal</span>
        </div>

        {projecten.length === 0 ? (
          <div className="grid place-items-center px-6 py-16 text-center">
            <div className="max-w-sm space-y-3">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-violet-500/10 text-violet-400">
                <FolderKanban size={22} />
              </span>
              <h3 className="text-base font-semibold text-zinc-100">
                Nog geen projecten
              </h3>
              <p className="text-sm text-zinc-500">
                Maak je eerste project aan of zet een geaccepteerde offerte om
                naar een werf.
              </p>
              {!preview && companyId && (
                <div className="flex justify-center pt-1">
                  <NieuwProjectButton />
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-[11px] uppercase tracking-wider text-zinc-500">
                  <th className="px-5 py-3 font-semibold">Project</th>
                  <th className="px-5 py-3 font-semibold">Klant</th>
                  <th className="px-5 py-3 font-semibold">Start</th>
                  <th className="px-5 py-3 font-semibold">Aangemaakt</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {projecten.map((p) => {
                  const meta = projectStatusMeta(p.status);
                  return (
                    <tr
                      key={p.id}
                      className="group border-b border-white/5 transition-colors last:border-0 hover:bg-white/[0.03]"
                    >
                      <td className="px-5 py-3">
                        {isDemo ? (
                          <span className="font-medium text-zinc-200">
                            {p.naam}
                          </span>
                        ) : (
                          <Link
                            href={`/dashboard/offertes/projecten/${p.id}`}
                            className="font-medium text-sky-400 hover:text-sky-300"
                          >
                            {p.naam}
                          </Link>
                        )}
                      </td>
                      <td className="px-5 py-3 text-zinc-200">
                        {p.klant_naam}
                      </td>
                      <td className="px-5 py-3 text-zinc-400">
                        {p.start_datum_label}
                      </td>
                      <td className="px-5 py-3 text-zinc-400">
                        {formatProjectDate(p.created_at)}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${meta.tone}`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${meta.dot}`}
                          />
                          {meta.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </GlowCard>
    </div>
  );
}
