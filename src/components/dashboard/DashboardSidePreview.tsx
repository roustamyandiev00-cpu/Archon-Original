import type { SupabaseClient } from "@supabase/supabase-js";
import { History, Radio } from "lucide-react";
import { loadControlCenterData } from "@/components/dashboard/mission-data";
import { loadCompanyAgents } from "@/components/dashboard/agents/storage";
import { loadUserAgentName } from "@/lib/agents/userAi";

type LogRow = {
  id: number;
  message: string | null;
  agent_name: string;
  action_type: string;
  created_at: string;
};

const agentColorMap: Record<string, { badge: string; text: string; border: string }> = {
  Nova: {
    badge: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    text: "text-sky-400",
    border: "border-sky-500/20",
  },
  Schatter: {
    badge: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    text: "text-purple-400",
    border: "border-purple-500/20",
  },
  Facturatie: {
    badge: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    text: "text-amber-400",
    border: "border-amber-500/20",
  },
  Opvolger: {
    badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    text: "text-emerald-400",
    border: "border-emerald-500/20",
  },
};

function colorsFor(name: string) {
  const direct = agentColorMap[name];
  if (direct) return direct;
  const key = Object.keys(agentColorMap).find((k) =>
    name.toLowerCase().includes(k.toLowerCase()),
  );
  return key ? agentColorMap[key] : agentColorMap.Nova;
}

function getRelativeTime(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "nu";
  if (diffMins < 60) return `${diffMins}m geleden`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}u geleden`;
  return new Date(isoString).toLocaleDateString("nl-BE", {
    day: "numeric",
    month: "short",
  });
}

const mockLogs: LogRow[] = [
  {
    id: 1,
    agent_name: "Schatter",
    action_type: "offerte",
    message: "Concept-offerte OF-2026-0012 opgesteld voor Janssens BVBA",
    created_at: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
  },
  {
    id: 2,
    agent_name: "Opvolger",
    action_type: "opvolging",
    message: "Klantopvolging herinnering klaargezet voor openstaande offerte OF-2026-0008",
    created_at: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
  },
  {
    id: 3,
    agent_name: "Facturatie",
    action_type: "factuur",
    message: "Peppol factuur F-2026-0004 gecontroleerd en klaargezet voor verzending",
    created_at: new Date(Date.now() - 65 * 60 * 1000).toISOString(),
  },
  {
    id: 4,
    agent_name: "Nova",
    action_type: "opvolging",
    message: "Lead winratio geanalyseerd voor wekelijkse rapportage",
    created_at: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
  },
];

export default async function DashboardSidePreview({
  supabase,
  companyId,
  userId,
  isPreview,
}: {
  supabase: SupabaseClient;
  companyId: number | null;
  userId: string | null;
  isPreview: boolean;
}) {
  let agents: Awaited<ReturnType<typeof loadControlCenterData>>["agents"] = [];
  let logs: LogRow[] = [];
  let isDemo = true;

  if (companyId && !isPreview) {
    const [agentName, agentConfig] = await Promise.all([
      userId ? loadUserAgentName(supabase, userId) : Promise.resolve("Nova"),
      loadCompanyAgents(supabase, companyId),
    ]);

    const loaded = await loadControlCenterData(
      supabase,
      companyId,
      agentName,
      agentConfig,
    );
    agents = loaded.agents;
    logs = (loaded.logs ?? []) as LogRow[];
    isDemo = loaded.isDemo;
  }

  const activeLogs = logs.length > 0 ? logs : mockLogs;
  const activeAgents =
    agents.length > 0
      ? agents
      : [
          { id: "nova", name: "Nova", role: "AI-metgezel", status: "idle" as const, statusLabel: "Stand-by", pending: 0 },
          { id: "schatter", name: "Schatter", role: "Offertes", status: "actief" as const, statusLabel: "Actief", pending: 0 },
          { id: "facturatie", name: "Facturatie", role: "Peppol", status: "idle" as const, statusLabel: "Stand-by", pending: 0 },
          { id: "opvolger", name: "Opvolger", role: "Leads", status: "actief" as const, statusLabel: "Actief", pending: 0 },
        ];

  return (
    <div className="flex h-full min-h-0 flex-col space-y-5">
      <div className="shrink-0 flex items-center justify-between border-b border-white/5 pb-3">
        <div>
          <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
            <Radio size={15} className="text-zinc-400" />
            AI Control Center
          </h3>
          <p className="text-[10px] text-zinc-400 mt-0.5">
            Live status & recent gemaakte acties
            {isDemo && agents.length === 0 ? " · demo" : ""}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 shrink-0">
        {activeAgents.slice(0, 4).map((a) => {
          const colors = colorsFor(a.name);
          const isActive = a.status === "actief";

          return (
            <div
              key={a.id}
              className="rounded-xl border border-zinc-800 bg-zinc-900 p-2.5"
            >
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-medium ${colors.text}`}>{a.name}</span>
                <span
                  className={`inline-flex h-2 w-2 rounded-full ${isActive ? "bg-emerald-500" : "bg-zinc-600"}`}
                />
              </div>
              <p className="text-[9px] text-zinc-500 mt-0.5">{a.role}</p>
              <p className="text-[9px] font-medium text-zinc-400 mt-2">
                {a.statusLabel}
                {a.pending > 0 ? ` · ${a.pending} open` : ""}
              </p>
            </div>
          );
        })}
      </div>

      <div className="flex-1 min-h-0 flex flex-col border border-zinc-800 rounded-xl overflow-hidden bg-zinc-900">
        <div className="flex items-center gap-2 border-b border-zinc-800 px-3.5 py-2.5 shrink-0">
          <History size={13} className="text-zinc-500" />
          <span className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
            Recent logboek
          </span>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-white/[0.03] p-3 space-y-2 scrollbar-thin">
          {activeLogs.map((log) => {
            const colors = colorsFor(log.agent_name);
            return (
              <div key={log.id} className="pt-2 first:pt-0 pb-1 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span
                    className={`rounded px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider ${colors.badge}`}
                  >
                    {log.agent_name}
                  </span>
                  <span className="text-[9px] text-zinc-500">
                    {getRelativeTime(log.created_at)}
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-zinc-300">{log.message}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
