import { getCompanyContext } from "@/lib/company";
import { isActivePreviewMode } from "@/components/dashboard/context";
import { loadUserAgentName } from "@/lib/agents/userAi";
import ProjectenView from "@/components/dashboard/projecten/ProjectenView";
import {
  DEMO_PROJECTEN,
  toUiProjectStatus,
  type ProjectRow,
} from "@/components/dashboard/projecten/projecten";
import { showDemoData } from "@/lib/demo-mode";

export const metadata = { title: "Projecten — ArchonPro" };

export default async function ProjectenPage() {
  const preview = await isActivePreviewMode();
  const { supabase, companyId, user } = await getCompanyContext();

  let projecten: ProjectRow[] = [];
  let agentName = "Lara";

  if (companyId) {
    const { data } = await supabase
      .from("projecten")
      .select("id, naam, klant_naam, start_datum_label, status, created_at")
      .eq("bedrijf_id", companyId)
      .order("created_at", { ascending: false });

    projecten = (data ?? []).map((row) => ({
      ...(row as ProjectRow),
      status: toUiProjectStatus(row.status),
    }));
  }

  if (user) {
    agentName = await loadUserAgentName(supabase, user.id);
  }

  const isDemo = showDemoData(preview, projecten.length === 0);
  if (isDemo) projecten = DEMO_PROJECTEN;

  const fileCounts: Record<string, number> = {};
  if (companyId && !isDemo && projecten.length > 0) {
    const ids = projecten.map((p) => p.id);
    const { data: counts } = await supabase
      .from("project_bestanden")
      .select("project_id")
      .eq("company_id", companyId)
      .in("project_id", ids);
    for (const row of counts ?? []) {
      if (!row.project_id) continue;
      fileCounts[row.project_id] = (fileCounts[row.project_id] ?? 0) + 1;
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      {!companyId && !preview && (
        <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
          Je account is nog niet aan een bedrijf gekoppeld.
        </div>
      )}
      <ProjectenView
        projecten={projecten}
        fileCounts={fileCounts}
        isDemo={isDemo}
        canCreate={Boolean(!preview && companyId)}
        agentName={agentName}
      />
    </div>
  );
}
