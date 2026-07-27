import {
  Zap,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Activity,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
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
    target_route: string | null;
  }[] = [];
  let activity30d = 0;
  let skillCounts: { label: string; value: number; hint?: string }[] = [];
  let hourly: { hour: number; count: number }[] = [];
  let loadFailed = false;

  if (companyId) {
    const [approvalsRes, activityRes, skillRes, hourRes] = await Promise.all([
      supabase
        .from("agent_actions")
        .select(
          "id, title, reason, action_type, agent_name, created_at, target_route",
        )
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

    loadFailed = [approvalsRes, activityRes, skillRes, hourRes].some(
      (result) => Boolean(result.error),
    );
    pendingApprovals = approvalsRes.data ?? [];
    activity30d = activityRes.count ?? 0;

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
    !loadFailed &&
    pendingApprovals.length === 0 &&
      activity30d === 0 &&
      skillCounts.length === 0,
  );

  if (isDemo) {
    pendingApprovals = demoApprovals.map((approval) => ({
      ...approval,
      target_route: null,
    }));
    activity30d = demoAutomationSummary.executions30d;
    skillCounts = demoSkillCounts;
    hourly = demoHourly();
  }

  const activityToday = hourly.reduce((total, item) => total + item.count, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Zap size={20} />}
        title="AI-goedkeuringen"
        description="Controleer voorstellen voordat een AI-agent actie onderneemt."
        actions={isDemo ? <DemoBadge /> : undefined}
      />

      {!companyId && <NoCompanyNotice />}

      <div className="flex items-start gap-3 rounded-xl border border-sky-500/20 bg-sky-500/[0.07] px-4 py-3 text-sm text-sky-100">
        <ShieldCheck size={18} className="mt-0.5 shrink-0 text-sky-400" />
        <div>
          <p className="font-medium">Menselijke controle staat centraal</p>
          <p className="mt-0.5 text-xs leading-relaxed text-sky-200/70">
            Hier beoordeel je voorstellen met impact. Uitgebreide automatisaties en
            dagschema&apos;s maken geen deel uit van de huidige MVP.
          </p>
        </div>
      </div>

      {loadFailed && (
        <div
          role="alert"
          className="rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-200"
        >
          Niet alle goedkeuringsgegevens konden worden geladen. Vernieuw de pagina
          of probeer het later opnieuw.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile
          label="Wachtend op goedkeuring"
          value={pendingApprovals.length}
          icon={<AlertTriangle size={18} />}
          tone="amber"
        />
        <StatTile
          label="Agentactiviteiten (30d)"
          value={activity30d}
          icon={<Activity size={18} />}
          tone="sky"
        />
        <StatTile
          label="Agentactiviteiten vandaag"
          value={activityToday}
          icon={<Clock size={18} />}
          tone="emerald"
        />
      </div>

      <Panel
        title="Te beoordelen voorstellen"
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
          <div className="space-y-3">
            {pendingApprovals.map((approval) => {
              const contextRoute = approval.target_route?.startsWith("/dashboard/")
                ? approval.target_route
                : null;
              return (
                <article
                  key={approval.id}
                  className="rounded-xl border border-white/10 bg-white/[0.025] p-4"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-sky-500/10 text-sky-400">
                      <Zap size={16} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-zinc-500">
                        <span className="rounded-full bg-white/5 px-2 py-0.5 font-medium text-zinc-400">
                          {labelForAction(approval.action_type)}
                        </span>
                        <span>{approval.agent_name}</span>
                        <span aria-hidden="true">·</span>
                        <span>{relTime(approval.created_at)}</span>
                      </div>
                      <h3 className="mt-2 text-sm font-medium leading-6 text-zinc-100">
                        {approval.title}
                      </h3>
                      {approval.reason && (
                        <p className="mt-1 text-xs leading-5 text-zinc-400">
                          {approval.reason}
                        </p>
                      )}
                      {contextRoute && (
                        <Link
                          href={contextRoute}
                          className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-sky-400 hover:text-sky-300"
                        >
                          Context bekijken <ExternalLink size={12} />
                        </Link>
                      )}
                    </div>
                    {isDemo ? (
                      <span className="shrink-0 self-start rounded-full bg-white/5 px-2.5 py-1 text-[10px] font-medium text-zinc-400">
                        Alleen voorbeeld
                      </span>
                    ) : (
                      <ApprovalActions id={approval.id} />
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </Panel>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel title="Activiteit per type (30 dagen)">
          {skillCounts.length === 0 ? (
            <EmptyState
              title="Nog geen activiteit"
              description="Uitgevoerde agentacties verschijnen hier zodra ze gelogd zijn."
            />
          ) : (
            <BarList items={skillCounts} />
          )}
        </Panel>

        <Panel
          title="Activiteit per uur — vandaag"
          action={<Clock size={13} className="text-zinc-500" />}
        >
          {hourly.length === 0 ? (
            <EmptyState
              title="Vandaag nog geen activiteit"
              description="Er zijn vandaag nog geen agentacties gelogd."
            />
          ) : (
            <HourBars data={hourly} nowHour={now.getHours()} />
          )}
        </Panel>
      </div>
    </div>
  );
}
