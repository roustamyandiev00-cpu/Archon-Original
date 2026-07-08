import { Rocket, Server, GitBranch } from "lucide-react";
import { Panel } from "@/components/dashboard/widgets";
import {
  PageHeader,
  EmptyState,
  StatusBadge,
  DemoBadge,
  relTime,
} from "@/components/dashboard/mission";
import { demoRuntimeLog } from "@/components/dashboard/demo";
import { getCompanyContext } from "@/lib/company";

export const metadata = { title: "Deploy — ArchonPro" };

export const dynamic = "force-dynamic";

function hostFromUrl(url?: string) {
  if (!url) return "onbekend";
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

export default async function DeployPage() {
  const { supabase, companyId } = await getCompanyContext();

  let dbOk = false;
  let activity: {
    id: number;
    message: string;
    agent_name: string;
    action_type: string;
    created_at: string;
  }[] = [];

  try {
    const probe = await supabase.from("bedrijven").select("id", { head: true, count: "exact" });
    dbOk = !probe.error;
  } catch {
    dbOk = false;
  }

  if (companyId) {
    const { data } = await supabase
      .from("agent_activity_logs")
      .select("id, message, agent_name, action_type, created_at")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })
      .limit(15);
    activity = data ?? [];
  }

  const isDemo = activity.length === 0;
  if (isDemo) activity = demoRuntimeLog;

  const dbHost = hostFromUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const env = process.env.NODE_ENV ?? "development";

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Rocket size={20} />}
        title="Deploy"
        description="Systeemstatus, omgeving en recente runtime-activiteit."
        actions={isDemo ? <DemoBadge /> : undefined}
      />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <StatusCard label="Database" value={dbOk ? "verbonden" : "onbereikbaar"} ok={dbOk} />
        <StatusCard label="Omgeving" value={env === "production" ? "productie" : env} ok />
        <StatusCard
          label="Deploy-proces"
          value="inactief"
          ok
        />
      </div>

      <Panel title="Runtime">
        <div className="space-y-2 text-xs">
          <Row label="Database-host">
            <code className="rounded bg-white/5 px-1.5 py-0.5 text-zinc-300">{dbHost}</code>
          </Row>
          <Row label="Framework">
            <span className="text-zinc-300">Next.js 16 · React 19</span>
          </Row>
          <Row label="Backend">
            <span className="text-zinc-300">Supabase (PostgreSQL)</span>
          </Row>
          <Row label="Node-omgeving">
            <span className="text-zinc-300">{env}</span>
          </Row>
        </div>
      </Panel>

      <Panel
        title="Recente runtime-activiteit"
        action={
          <StatusBadge tone={dbOk ? "ok" : "danger"}>
            {dbOk ? "operationeel" : "storing"}
          </StatusBadge>
        }
      >
        {activity.length === 0 ? (
          <EmptyState
            icon={<Server size={18} />}
            title="Nog geen runtime-activiteit"
            description="Zodra je agents draaien, verschijnen hier hun logs."
          />
        ) : (
          <div className="max-h-96 space-y-1.5 overflow-y-auto font-mono text-xs">
            {activity.map((a) => (
              <div
                key={a.id}
                className="flex items-start gap-2 rounded bg-white/[0.02] px-2.5 py-1.5"
              >
                <span className="shrink-0 text-zinc-600">{relTime(a.created_at)}</span>
                <span className="shrink-0 text-sky-400">[{a.agent_name}]</span>
                <span className="min-w-0 flex-1 text-zinc-400">{a.message}</span>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-zinc-900/40 px-4 py-3 text-xs text-zinc-500">
        <GitBranch size={14} className="text-zinc-600" />
        Er is nog geen CI/CD-pijplijn gekoppeld. Deze pagina toont de live
        systeemstatus.
      </div>
    </div>
  );
}

function StatusCard({
  label,
  value,
  ok,
}: {
  label: string;
  value: string;
  ok: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-4">
      <p className="text-[11px] uppercase tracking-wide text-zinc-500">{label}</p>
      <p
        className={`mt-1 font-mono text-lg font-semibold ${
          ok ? "text-emerald-400" : "text-rose-400"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-white/5 py-1.5 last:border-0">
      <span className="text-zinc-500">{label}</span>
      {children}
    </div>
  );
}
