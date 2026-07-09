import Link from "next/link";
import { ArrowLeft, FolderKanban } from "lucide-react";
import { notFound } from "next/navigation";
import { getCompanyContext } from "@/lib/company";
import { isActivePreviewMode } from "@/components/dashboard/context";
import GlowCard from "@/components/dashboard/GlowCard";
import ProjectStatusSelect from "@/components/dashboard/projecten/ProjectStatusSelect";
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

  const { data: project } = await supabase
    .from("projecten")
    .select("id, naam, klant_naam, start_datum_label, status, created_at")
    .eq("id", id)
    .eq("bedrijf_id", companyId)
    .maybeSingle();

  if (!project) notFound();

  const meta = projectStatusMeta(project.status);

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
      </GlowCard>
    </div>
  );
}
