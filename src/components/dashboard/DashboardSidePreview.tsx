import type { SupabaseClient } from "@supabase/supabase-js";
import { Bot, Sparkles, CheckCircle2, History, Activity, Radio } from "lucide-react";

type LogRow = {
  id: number;
  message: string | null;
  agent_name: string;
  action_type: string;
  created_at: string;
};

const agentColorMap: Record<string, { badge: string; text: string; border: string; bg: string }> = {
  Nova: {
    badge: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    text: "text-sky-400",
    border: "border-sky-500/20",
    bg: "bg-sky-500/5",
  },
  Schatter: {
    badge: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    text: "text-purple-400",
    border: "border-purple-500/20",
    bg: "bg-purple-500/5",
  },
  Facturatie: {
    badge: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    text: "text-amber-400",
    border: "border-amber-500/20",
    bg: "bg-amber-500/5",
  },
  Opvolger: {
    badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    text: "text-emerald-400",
    border: "border-emerald-500/20",
    bg: "bg-emerald-500/5",
  },
};

function getRelativeTime(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "nu";
  if (diffMins < 60) return `${diffMins}m geleden`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}u geleden`;
  return new Date(isoString).toLocaleDateString("nl-BE", { day: "numeric", month: "short" });
}

export default async function DashboardSidePreview({
  supabase,
  companyId,
  isPreview,
}: {
  supabase: SupabaseClient;
  companyId: number | null;
  isPreview: boolean;
}) {
  let logs: LogRow[] = [];

  if (companyId && !isPreview) {
    const { data } = await supabase
      .from("agent_activity_logs")
      .select("id, message, agent_name, action_type, created_at")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })
      .limit(10);
    
    logs = (data ?? []) as any[];
  }

  // Realistic mock logs representing agent accomplishments
  const mockLogs = [
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
    {
      id: 5,
      agent_name: "Schatter",
      action_type: "offerte",
      message: "Calculatie voltooid voor project: Renovatie Peeters",
      created_at: new Date(Date.now() - 360 * 60 * 1000).toISOString(),
    }
  ];

  const activeLogs = logs.length > 0 ? logs : mockLogs;

  const agents = [
    { name: "Nova", role: "Al-metgezel", status: "standby" },
    { name: "Schatter", role: "Offertes", status: "actief" },
    { name: "Facturatie", role: "Peppol", status: "standby" },
    { name: "Opvolger", role: "Leads", status: "actief" },
  ];

  return (
    <div className="flex h-full min-h-0 flex-col space-y-5">
      
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between border-b border-white/5 pb-3">
        <div>
          <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
            <Radio size={15} className="text-emerald-400 animate-pulse" />
            AI Control Center
          </h3>
          <p className="text-[10px] text-zinc-400 mt-0.5">
            Live status & recent gemaakte acties
          </p>
        </div>
      </div>

      {/* Agents Status Grid */}
      <div className="grid grid-cols-2 gap-2 shrink-0">
        {agents.map((a) => {
          const colors = agentColorMap[a.name] || agentColorMap.Nova;
          const isActive = a.status === "actief";
          
          return (
            <div
              key={a.name}
              className={`rounded-xl border border-white/5 p-2.5 bg-zinc-950/40 hover:${colors.border} transition-colors`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-bold ${colors.text}`}>{a.name}</span>
                <span className="flex h-2 w-2 relative">
                  {isActive && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  )}
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${isActive ? "bg-emerald-500" : "bg-zinc-600"}`} />
                </span>
              </div>
              <p className="text-[9px] text-zinc-500 mt-0.5">{a.role}</p>
              <p className="text-[9px] font-medium text-zinc-400 capitalize mt-2">
                {isActive ? "Actief..." : "Standby"}
              </p>
            </div>
          );
        })}
      </div>

      {/* Recent Activity Logbook */}
      <div className="flex-1 min-h-0 flex flex-col bg-zinc-950/20 border border-white/5 rounded-2xl overflow-hidden">
        <div className="flex items-center gap-2 border-b border-white/5 bg-zinc-950/40 px-3.5 py-2.5 shrink-0">
          <History size={13} className="text-zinc-400" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
            Recent Logboek
          </span>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-white/[0.03] p-3 space-y-2 scrollbar-thin">
          {activeLogs.map((log) => {
            const colors = agentColorMap[log.agent_name] || agentColorMap.Nova;
            return (
              <div key={log.id} className="pt-2 first:pt-0 pb-1 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className={`rounded px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider ${colors.badge}`}>
                    {log.agent_name}
                  </span>
                  <span className="text-[9px] text-zinc-500">
                    {getRelativeTime(log.created_at)}
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-zinc-300">
                  {log.message}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
