import { Clock, Bell, CalendarClock, ListChecks, AlertTriangle } from "lucide-react";
import { Panel } from "@/components/dashboard/widgets";
import {
  PageHeader,
  StatTile,
  EmptyState,
  NoCompanyNotice,
  DemoBadge,
  StatusBadge,
} from "@/components/dashboard/mission";
import { demoCronJobs } from "@/components/dashboard/demo";
import { getCompanyContext } from "@/lib/company";
import { isActivePreviewMode } from "@/components/dashboard/context";
import { showDemoData } from "@/lib/demo-mode";

function scheduleBounds() {
  const now = Date.now();
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);
  return { now, endOfToday: endOfToday.getTime() };
}

export const metadata = { title: "Cron — ArchonPro" };

type Job = {
  id: string;
  title: string;
  sub: string;
  when: number | null;
  kind: "reminder" | "afspraak" | "taak";
};

function fmtWhen(ms: number | null) {
  if (ms == null) return "geen tijdstip";
  return new Date(ms).toLocaleString("nl-BE", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function CronPage() {
  const preview = await isActivePreviewMode();
  const { supabase, companyId } = await getCompanyContext();

  let jobs: Job[] = [];

  if (companyId) {
    const [remRes, afsRes, taskRes] = await Promise.all([
      supabase
        .from("reminders")
        .select("id, title, message, reminder_at, entity_type")
        .eq("company_id", companyId)
        .eq("is_sent", false)
        .order("reminder_at", { ascending: true })
        .limit(100),
      supabase
        .from("afspraken")
        .select("id, titel, type, start_tijd, status")
        .eq("bedrijf_id", companyId)
        .order("start_tijd", { ascending: true })
        .limit(100),
      supabase
        .from("agent_tasks")
        .select("id, title, type, status, priority, assigned_agent, created_at")
        .eq("company_id", companyId)
        .in("status", ["pending", "queued", "scheduled", "in_progress"])
        .order("created_at", { ascending: false })
        .limit(100),
    ]);

    for (const r of remRes.data ?? []) {
      jobs.push({
        id: `rem-${r.id}`,
        title: r.title,
        sub: r.message || `Herinnering · ${r.entity_type}`,
        when: r.reminder_at ? new Date(r.reminder_at).getTime() : null,
        kind: "reminder",
      });
    }
    for (const a of afsRes.data ?? []) {
      jobs.push({
        id: `afs-${a.id}`,
        title: a.titel,
        sub: `Afspraak${a.type ? ` · ${a.type}` : ""}`,
        when: a.start_tijd ? new Date(a.start_tijd).getTime() : null,
        kind: "afspraak",
      });
    }
    for (const t of taskRes.data ?? []) {
      jobs.push({
        id: `task-${t.id}`,
        title: t.title,
        sub: `Taak · ${t.assigned_agent}${t.priority ? ` · ${t.priority}` : ""}`,
        when: null,
        kind: "taak",
      });
    }
  }

  const isDemo = showDemoData(preview, jobs.length === 0);
  if (isDemo) jobs = demoCronJobs();

  const { now, endOfToday } = scheduleBounds();

  const overdue = jobs.filter((j) => j.when != null && j.when < now).length;
  const today = jobs.filter(
    (j) => j.when != null && j.when >= now && j.when <= endOfToday,
  ).length;

  jobs.sort((a, b) => {
    if (a.when == null) return 1;
    if (b.when == null) return -1;
    return a.when - b.when;
  });

  const kindMeta = {
    reminder: { icon: <Bell size={14} />, label: "Herinnering" },
    afspraak: { icon: <CalendarClock size={14} />, label: "Afspraak" },
    taak: { icon: <ListChecks size={14} />, label: "Taak" },
  } as const;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Clock size={20} />}
        title="Cron & planning"
        description="Geplande herinneringen, afspraken en agent-taken."
        actions={isDemo ? <DemoBadge /> : undefined}
      />

      {!companyId && <NoCompanyNotice />}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile label="Totaal gepland" value={jobs.length} icon={<Clock size={18} />} tone="sky" />
        <StatTile label="Vandaag" value={today} icon={<CalendarClock size={18} />} tone="emerald" />
        <StatTile label="Achterstallig" value={overdue} icon={<AlertTriangle size={18} />} tone="rose" />
      </div>

      <Panel title="Geplande taken">
        {jobs.length === 0 ? (
          <EmptyState
            icon={<Clock size={18} />}
            title="Niets gepland"
            description="Geplande herinneringen en afspraken verschijnen hier."
          />
        ) : (
          <div className="divide-y divide-white/5">
            {jobs.map((j) => {
              const meta = kindMeta[j.kind];
              const isOverdue = j.when != null && j.when < now;
              return (
                <div key={j.id} className="flex items-center gap-3 py-2.5 first:pt-0">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/5 text-zinc-400">
                    {meta.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-zinc-200">{j.title}</p>
                    <p className="truncate text-[11px] text-zinc-500">{j.sub}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="font-mono text-xs text-zinc-400">
                      {fmtWhen(j.when)}
                    </span>
                    {j.when == null ? (
                      <StatusBadge tone="zinc">in wachtrij</StatusBadge>
                    ) : isOverdue ? (
                      <StatusBadge tone="danger">achterstallig</StatusBadge>
                    ) : (
                      <StatusBadge tone="info">gepland</StatusBadge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Panel>
    </div>
  );
}
