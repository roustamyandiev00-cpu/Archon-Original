import Link from "next/link";
import { AlertTriangle, ArrowLeft, FolderKanban, FileText } from "lucide-react";
import { notFound } from "next/navigation";
import { getCompanyContext } from "@/lib/company";
import { isActivePreviewMode } from "@/components/dashboard/context";
import GlowCard from "@/components/dashboard/GlowCard";
import ProjectStatusSelect from "@/components/dashboard/projecten/ProjectStatusSelect";
import ProjectBestandenPanel from "@/components/dashboard/projecten/ProjectBestandenPanel";
import { listProjectBestanden } from "@/app/dashboard/offertes/projecten/bestanden-actions";
import {
  formatProjectDate,
  projectStatusMeta,
} from "@/components/dashboard/projecten/projecten";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return { title: `Project ${id.slice(0, 8)} — ArchonPro` };
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const preview = await isActivePreviewMode();
  const { supabase, companyId } = await getCompanyContext();

  if (!companyId) notFound();

  const { data: project, error: projectError } = await supabase
    .from("projecten")
    .select(
      "id, naam, klant_naam, start_datum_label, status, created_at, customer_id, offerte_id",
    )
    .eq("id", id)
    .eq("bedrijf_id", companyId)
    .maybeSingle();

  if (projectError) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <Link
          href="/dashboard/offertes/projecten"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-300"
        >
          <ArrowLeft size={15} />
          Terug naar projecten
        </Link>
        <div
          role="alert"
          className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-5 text-rose-100"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="mt-0.5 shrink-0 text-rose-300" />
            <div>
              <h1 className="font-semibold">Project kon niet worden geladen</h1>
              <p className="mt-1 text-sm text-rose-200/80">
                Je gegevens zijn niet gewijzigd. Probeer de pagina opnieuw te
                laden.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!project) notFound();

  const meta = projectStatusMeta(project.status);
  const { bestanden, error: bestandenError } = await listProjectBestanden(id);

  let offerteNummer: string | null = null;
  if (project.offerte_id) {
    const { data: off } = await supabase
      .from("offertes")
      .select("nummer")
      .eq("id", project.offerte_id)
      .eq("bedrijf_id", companyId)
      .maybeSingle();
    offerteNummer = off?.nummer ?? null;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/dashboard/offertes/projecten"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-300"
      >
        <ArrowLeft size={15} />
        Terug naar projecten
      </Link>

      <header className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-violet-500/10 text-violet-400">
          <FolderKanban size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-semibold text-zinc-50">{project.naam}</h1>
          <p className="mt-0.5 text-sm text-zinc-500">{project.klant_naam}</p>
        </div>
        <span
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${meta.tone}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
          {meta.label}
        </span>
      </header>

      <GlowCard subtle innerClassName="p-5 space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-zinc-500">
              Klant
            </p>
            <p className="mt-1 text-sm text-zinc-100">{project.klant_naam}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-zinc-500">
              Start
            </p>
            <p className="mt-1 text-sm text-zinc-100">
              {project.start_datum_label}
            </p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-zinc-500">
              Aangemaakt
            </p>
            <p className="mt-1 text-sm text-zinc-100">
              {formatProjectDate(project.created_at)}
            </p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-zinc-500">
              Status wijzigen
            </p>
            <div className="mt-1">
              <ProjectStatusSelect
                projectId={project.id}
                status={project.status}
                readOnly={preview}
              />
            </div>
          </div>
        </div>

        {project.offerte_id && (
          <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
            <FileText size={14} className="shrink-0 text-sky-400" />
            <span className="text-xs text-zinc-500">Bronofferte</span>
            <Link
              href={`/dashboard/offertes/${project.offerte_id}`}
              className="text-xs font-medium text-sky-400 hover:text-sky-300"
            >
              {offerteNummer ?? `#${project.offerte_id}`}
            </Link>
          </div>
        )}
      </GlowCard>

      <GlowCard subtle innerClassName="p-5">
        <ProjectBestandenPanel
          projectId={project.id}
          customerId={project.customer_id}
          offerteId={project.offerte_id}
          initialBestanden={bestanden}
          initialError={
            bestandenError
              ? "De projectbestanden konden niet worden geladen. Probeer het later opnieuw."
              : null
          }
          readOnly={preview}
        />
      </GlowCard>
    </div>
  );
}
