import {
  Zap,
  Clock,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Timer,
  Activity,
  Mail,
} from "lucide-react";
import { Panel } from "@/components/dashboard/widgets";
import {
  PageHeader,
  StatTile,
  EmptyState,
  NoCompanyNotice,
  DemoBadge,
  BarList,
  HourBars,
  relTime,
} from "@/components/dashboard/mission";
import {
  demoApprovals,
  demoSkillCounts,
  demoHourly,
  demoAutomationSummary,
} from "@/components/dashboard/demo";
import { getCompanyContext } from "@/lib/company";
import { isActivePreviewMode } from "@/components/dashboard/context";
import { showDemoData } from "@/lib/demo-mode";
import ApprovalActions from "./ApprovalActions";

export const metadata = { title: "Automatisaties — ArchonPro" };

function labelForAction(t: string) {
  const map: Record<string, string> = {
    create_offerte: "Offerte opstellen",
    send_offerte: "Offerte versturen",
    send_quote_followup: "Offerte opvolgen",
    send_invoice: "Factuur versturen",
    send_reminder: "Herinnering sturen",
    send_payment_reminder: "Betalingsherinnering",
    send_formal_notice: "Ingebrekestelling",
    forward_to_bailiff: "Dossier naar deurwaarder",
    follow_up: "Opvolging",
    create_invoice: "Factuur opstellen",
    propose_chat_sanction: "Chat-sanctie voorstellen",
    propose_werkpost_match: "Werkpost-match voorstellen",
    propose_materiaal_zoek: "Materiaalvoorraad",
    propose_geschil_samenvatting: "Geschil-samenvatting",
  };
  return map[t] ?? t.replace(/[_-]+/g, " ");
}

export default async function AutomatisatiesPage() {
  const preview = await isActivePreviewMode();
  const { supabase, companyId } = await getCompanyContext();

  const now = new Date();
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const monthAgo = new Date(now.getTime() - 30 * 864e5).toISOString();

  let pendingApprovals: {
    id: number;
    title: string;
    reason: string | null;
    action_type: string;
    agent_name: string;
    created_at: string;
  }[] = [];
  let executions30d = 0;
  let scheduledJobs = 0;
  let skillCounts: { label: string; value: number; hint?: string }[] = [];
  let hourly: { hour: number; count: number }[] = [];

  if (companyId) {
    const [approvalsRes, execRes, scheduledRes, skillRes, hourRes] = await Promise.all([
      supabase
        .from("agent_actions")
        .select("id, title, reason, action_type, agent_name, created_at")
        .eq("company_id", companyId)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("agent_activity_logs")
        .select("id", { count: "exact", head: true })
        .eq("company_id", companyId)
        .gte("created_at", monthAgo),
      supabase
        .from("reminders")
        .select("id", { count: "exact", head: true })
        .eq("company_id", companyId)
        .eq("is_sent", false),
      supabase
        .from("agent_activity_logs")
        .select("action_type, agent_name, created_at")
        .eq("company_id", companyId)
        .gte("created_at", monthAgo)
        .limit(1000),
      supabase
        .from("agent_activity_logs")
        .select("created_at")
        .eq("company_id", companyId)
        .gte("created_at", dayStart)
        .limit(1000),
    ]);

    pendingApprovals = approvalsRes.data ?? [];
    executions30d = execRes.count ?? 0;
    scheduledJobs = scheduledRes.count ?? 0;

    const counter = new Map<string, { count: number; last: string }>();
    for (const r of skillRes.data ?? []) {
      const key = r.action_type || "onbekend";
      const cur = counter.get(key);
      if (cur) {
        cur.count += 1;
        if (r.created_at > cur.last) cur.last = r.created_at;
      } else {
        counter.set(key, { count: 1, last: r.created_at });
      }
    }
    skillCounts = Array.from(counter.entries())
      .map(([k, v]) => ({
        label: labelForAction(k),
        value: v.count,
        hint: relTime(v.last),
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    const hourMap = new Map<number, number>();
    for (const r of hourRes.data ?? []) {
      const h = new Date(r.created_at).getHours();
      hourMap.set(h, (hourMap.get(h) ?? 0) + 1);
    }
    hourly = Array.from(hourMap.entries()).map(([hour, count]) => ({ hour, count }));
  }

  const isDemo = showDemoData(
    preview,
    pendingApprovals.length === 0 &&
      executions30d === 0 &&
      scheduledJobs === 0 &&
      skillCounts.length === 0,
  );

  if (isDemo) {
    pendingApprovals = demoApprovals;
    executions30d = demoAutomationSummary.executions30d;
    scheduledJobs = demoAutomationSummary.scheduledJobs;
    skillCounts = demoSkillCounts;
    hourly = demoHourly();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Zap size={20} />}
        title="Automatisaties"
        description="Goedkeuringen, uitvoeringen en geplande taken van je AI-agents."
        actions={isDemo ? <DemoBadge /> : undefined}
      />

      {!companyId && <NoCompanyNotice />}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile
          label="Wachtend op goedkeuring"
          value={pendingApprovals.length}
          icon={<AlertTriangle size={18} />}
          tone="amber"
        />
        <StatTile
          label="Uitvoeringen (30d)"
          value={executions30d}
          icon={<Activity size={18} />}
          tone="sky"
        />
        <StatTile
          label="Geplande taken"
          value={scheduledJobs}
          icon={<Timer size={18} />}
          tone="emerald"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel
          title="Goedkeuringen"
          action={
            pendingApprovals.length > 0 ? (
              <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-400">
                {pendingApprovals.length}
              </span>
            ) : undefined
          }
        >
          {pendingApprovals.length === 0 ? (
            <EmptyState
              icon={<CheckCircle2 size={18} className="text-emerald-400" />}
              title="Alles is bij"
              description="Er zijn geen voorstellen die op goedkeuring wachten."
            />
          ) : (
            <div className="max-h-96 space-y-2 overflow-y-auto">
              {pendingApprovals.map((a) => (
                <div
                  key={a.id}
                  className="flex items-start gap-3 rounded-lg bg-white/[0.03] p-3"
                >
                  <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-sky-500/10 text-sky-400">
                    <Mail size={14} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-zinc-200">
                      {a.title}
                    </p>
                    {a.reason && (
                      <p className="truncate text-[11px] text-zinc-500">{a.reason}</p>
                    )}
                    <div className="mt-1.5 flex items-center gap-2">
                      <p className="flex-1 text-[10px] text-zinc-500">
                        {a.agent_name} · {relTime(a.created_at)}
                      </p>
                      <ApprovalActions id={a.id} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Dagschema">
          <div className="space-y-2.5 text-sm">
            <ScheduleRow tijd="08:30" taak="Openstaande offertes opvolgen" agent="Daan" />
            <ScheduleRow tijd="09:00" taak="Nieuwe leads verwerken" agent="Lara" />
            <ScheduleRow tijd="12:00" taak="Betalingsherinneringen controleren" agent="Nina" />
            <ScheduleRow tijd="16:00" taak="Dagrapport samenstellen" agent="Lara" />
          </div>
          <div className="mt-3 flex items-center gap-2 border-t border-white/10 pt-3 text-[10px] text-zinc-500">
            <Calendar size={12} /> Alleen op weekdagen (ma–vr)
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel title="Skill-uitvoeringen (30 dagen)">
          {skillCounts.length === 0 ? (
            <EmptyState title="Nog geen uitvoeringen" />
          ) : (
            <BarList items={skillCounts} />
          )}
        </Panel>

        <Panel
          title="Activiteit per uur — vandaag"
          action={<Clock size={13} className="text-zinc-500" />}
        >
          <HourBars data={hourly} nowHour={now.getHours()} />
        </Panel>
      </div>
    </div>
  );
}

function ScheduleRow({
  tijd,
  taak,
  agent,
}: {
  tijd: string;
  taak: string;
  agent: string;
}) {
  return (
    <div className="flex items-center gap-3 border-l-2 border-sky-500/50 py-1.5 pl-3">
      <span className="w-12 shrink-0 font-mono text-xs text-zinc-500">{tijd}</span>
      <span className="flex-1 text-sm text-zinc-200">{taak}</span>
      <span className="shrink-0 text-[10px] text-zinc-500">{agent}</span>
    </div>
  );
}
