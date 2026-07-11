import type { SupabaseClient } from "@supabase/supabase-js";
import type { ActionItem } from "@/components/dashboard/ActionItems";
import {
  fetchMissionCore,
  fetchOpenFacturen,
  fetchPendingAgentActions,
  loadTopbarSummary,
  type DoneItem,
  type MissionTask,
} from "@/components/dashboard/mission-data";
import { DEMO_DASHBOARD } from "@/lib/demo";

export type OverviewActionType =
  | "ai"
  | "offerte"
  | "factuur"
  | "lead"
  | "project";

export type OverviewUrgency = "urgent" | "attention" | "normal";

export type OverviewKpi = {
  id: string;
  label: string;
  value: string;
  hint: string;
  tone: "sky" | "amber" | "emerald" | "violet" | "rose";
};

export type StatusChip = {
  id: string;
  label: string;
  count: number;
  tone: "sky" | "amber" | "rose" | "emerald" | "violet";
};

export type OverviewAction = {
  id: string;
  type: OverviewActionType;
  title: string;
  client: string;
  detail: string;
  value?: string;
  agent?: string;
  urgency: OverviewUrgency;
  href: string;
  primaryLabel: string;
  actionId?: number;
  actionType?: string;
  riskLevel?: "low" | "medium" | "high";
  confidence?: number;
  requiresApproval?: boolean;
  impact?: "internal" | "external";
  deadline?: string;
  draftPreview?: string;
};

export type NovaPriority = {
  id: string;
  title: string;
  detail: string;
  href: string;
};

export type RiskItem = {
  id: string;
  title: string;
  detail: string;
  severity: "urgent" | "attention" | "info" | "ok";
  href?: string;
};

export type OverviewDashboardData = {
  isDemo: boolean;
  greeting: string;
  userName: string;
  heroSummary: string;
  urgentCount: number;
  chips: StatusChip[];
  kpis: OverviewKpi[];
  actions: OverviewAction[];
  priorities: NovaPriority[];
  risks: RiskItem[];
  activity: DoneItem[];
  agentName: string;
  openstaand: number;
  actionItems: ActionItem[];
};

function euro(n: number) {
  if (n >= 1000) return `€ ${(n / 1000).toFixed(1).replace(".", ",")}k`;
  return `€ ${Math.round(n).toLocaleString("nl-BE")}`;
}

function greetingFor(date = new Date()) {
  const h = date.getHours();
  if (h < 12) return "Goedemorgen";
  if (h < 18) return "Goedemiddag";
  return "Goedenavond";
}

function urgencyFromPriority(p: MissionTask["priority"]): OverviewUrgency {
  if (p === "high") return "urgent";
  if (p === "medium") return "attention";
  return "normal";
}

function kindToType(kind: MissionTask["kind"] | ActionItem["kind"]): OverviewActionType {
  if (kind === "offerte") return "offerte";
  if (kind === "factuur") return "factuur";
  return "lead";
}

function extractClient(text: string): string {
  const parts = text.split("—").map((s) => s.trim());
  if (parts.length > 1) return parts[0].replace(/^.*?\s+voor\s+/i, "").trim() || parts[0];
  const match = text.match(/(?:voor|naar|door)\s+([^·—]+)/i);
  return match?.[1]?.trim() ?? "—";
}

function taskToAction(task: MissionTask): OverviewAction {
  const client =
    task.detail.split("—")[0]?.trim() ||
    extractClient(task.title) ||
    "—";

  return {
    id: task.id,
    type: kindToType(task.kind),
    title: task.title,
    client,
    detail: task.detail,
    urgency: urgencyFromPriority(task.priority),
    href: task.href,
    primaryLabel: task.label,
  };
}

function aiToAction(
  item: ActionItem,
  pending?: {
    agent_name?: string | null;
    action_type?: string;
    confidence?: number | null;
    payload_json?: unknown;
    requires_approval?: boolean;
    created_at?: string;
  },
): OverviewAction {
  const payload = (pending?.payload_json ?? {}) as Record<string, unknown>;
  const meta = (payload._meta ?? {}) as Record<string, unknown>;
  const communication = meta.communicationIntent as
    | { draftMessage?: string }
    | undefined;

  return {
    id: `ai-${item.id}`,
    type: "ai",
    title: item.title,
    client: extractClient(item.detail) !== "—" ? extractClient(item.detail) : extractClient(item.title),
    detail: item.detail,
    agent: pending?.agent_name ?? "Nova",
    urgency: meta.riskLevel === "high" ? "urgent" : "attention",
    href: "/dashboard/automatisaties",
    primaryLabel: pending?.requires_approval === false ? "Bekijken" : "Goedkeuren",
    actionId: item.id,
    actionType: pending?.action_type ?? undefined,
    riskLevel: (meta.riskLevel as OverviewAction["riskLevel"]) ?? "medium",
    confidence: pending?.confidence ?? undefined,
    requiresApproval: pending?.requires_approval ?? true,
    impact: (meta.impact as OverviewAction["impact"]) ?? "internal",
    deadline: (meta.expiresAt as string | undefined) ?? pending?.created_at,
    draftPreview: communication?.draftMessage ?? (payload.draftMessage as string | undefined),
  };
}

function buildDemoOverview(
  userName: string,
  agentName: string,
): OverviewDashboardData {
  const actions: OverviewAction[] = [
    {
      id: "demo-ai-1",
      type: "ai",
      title: "Offerte klaar voor goedkeuring",
      client: "Janssens Renovatie",
      detail: "Concept voor badkamerrenovatie — 6 lijnen, BTW 21%",
      value: "€ 2.850",
      agent: "Lima",
      urgency: "attention",
      href: "/dashboard/automatisaties",
      primaryLabel: "Goedkeuren",
      actionId: -1,
    },
    {
      id: "demo-factuur-1",
      type: "factuur",
      title: "Factuurherinnering versturen",
      client: "Keukens Peeters",
      detail: "FAC-2026-0007 · 8 dagen over vervaldatum",
      value: "€ 1.240",
      urgency: "urgent",
      href: "/dashboard/facturen",
      primaryLabel: "Herinneren",
    },
    {
      id: "demo-offerte-1",
      type: "offerte",
      title: "Offerte opvolgen",
      client: "Wouters Dakwerken",
      detail: "OFF-2026-0007 · 5 dagen zonder reactie",
      value: "€ 4.200",
      urgency: "attention",
      href: "/dashboard/offertes",
      primaryLabel: "Opvolgen",
    },
    {
      id: "demo-lead-1",
      type: "lead",
      title: "Lead opvolgen",
      client: "Renovatie Vandenberghe",
      detail: "Nieuwe aanvraag via website · stadium Nieuw",
      value: "€ 6.500",
      urgency: "normal",
      href: "/dashboard/leads",
      primaryLabel: "Opvolgen",
    },
    {
      id: "demo-project-1",
      type: "project",
      title: "Projectstatus controleren",
      client: "De Smet",
      detail: "Badkamer De Smet · gepauzeerd — foto's ontbreken",
      urgency: "attention",
      href: "/dashboard/offertes/projecten",
      primaryLabel: "Bijwerken",
    },
  ];

  return {
    isDemo: true,
    greeting: greetingFor(),
    userName,
    heroSummary: `${agentName} heeft vandaag 12 acties gevonden — 3 zijn urgent.`,
    urgentCount: 3,
    chips: [
      { id: "ai", label: "AI-voorstellen", count: 8, tone: "sky" },
      { id: "facturen", label: "Facturen open", count: 3, tone: "amber" },
      { id: "offertes", label: "Offertes opvolgen", count: 2, tone: "violet" },
      { id: "project", label: "Project risico", count: 1, tone: "rose" },
    ],
    kpis: [
      {
        id: "offertes-today",
        label: "Offertes vandaag",
        value: "2",
        hint: "+1 vs gisteren",
        tone: "sky",
      },
      {
        id: "open-facturen",
        label: "Openstaande facturen",
        value: "3",
        hint: euro(DEMO_DASHBOARD.openstaand),
        tone: "amber",
      },
      {
        id: "pipeline",
        label: "Pipeline waarde",
        value: euro(84200),
        hint: "12 open deals",
        tone: "violet",
      },
      {
        id: "taken",
        label: "Taken vandaag",
        value: "12",
        hint: "3 urgent",
        tone: "rose",
      },
      {
        id: "leads",
        label: "Leads deze week",
        value: "4",
        hint: "1 wacht op antwoord",
        tone: "emerald",
      },
    ],
    actions,
    priorities: [
      {
        id: "p1",
        title: "Bel klant Janssens terug over offerte",
        detail: "€ 4.200 · 5 dagen zonder reactie",
        href: "/dashboard/offertes",
      },
      {
        id: "p2",
        title: "Factuur #2026-014 is 8 dagen te laat",
        detail: "Keukens Peeters · herinnering voorbereiden",
        href: "/dashboard/facturen",
      },
      {
        id: "p3",
        title: "Project Badkamer De Smet mist foto's",
        detail: "Status gepauzeerd — werfupdate nodig",
        href: "/dashboard/offertes/projecten",
      },
      {
        id: "p4",
        title: "Lead uit Antwerpen nog niet opgevolgd",
        detail: "Renovatie Vandenberghe · nieuw sinds gisteren",
        href: "/dashboard/leads",
      },
    ],
    risks: [
      {
        id: "r1",
        title: "3 facturen over vervaldatum",
        detail: euro(DEMO_DASHBOARD.openstaand) + " openstaand",
        severity: "urgent",
        href: "/dashboard/facturen",
      },
      {
        id: "r2",
        title: "2 offertes ouder dan 7 dagen",
        detail: "Zonder reactie van klant",
        severity: "attention",
        href: "/dashboard/offertes",
      },
      {
        id: "r3",
        title: "1 project zonder recente update",
        detail: "Badkamer De Smet · gepauzeerd",
        severity: "attention",
        href: "/dashboard/offertes/projecten",
      },
      {
        id: "r4",
        title: "8 AI-acties wachten op goedkeuring",
        detail: "Lima heeft voorstellen klaargezet",
        severity: "info",
        href: "/dashboard/automatisaties",
      },
    ],
    activity: DEMO_DASHBOARD.activity.map((a) => ({
      id: String(a.id),
      text: a.text,
      time: a.time,
      kind: a.kind,
    })),
    agentName,
    openstaand: DEMO_DASHBOARD.openstaand,
    actionItems: DEMO_DASHBOARD.actionItems.slice(0, 1),
  };
}

function buildEmptyOverview(input: {
  userName: string;
  agentName: string;
}): OverviewDashboardData {
  return {
    isDemo: false,
    greeting: greetingFor(),
    userName: input.userName,
    heroSummary: `${input.agentName} is klaar om je te helpen. Voeg je eerste klant, offerte of factuur toe om te starten.`,
    urgentCount: 0,
    chips: [],
    kpis: [
      {
        id: "offertes-today",
        label: "Offertes vandaag",
        value: "0",
        hint: "Nog geen offertes",
        tone: "sky",
      },
      {
        id: "open-facturen",
        label: "Openstaande facturen",
        value: "0",
        hint: "€ 0 openstaand",
        tone: "amber",
      },
      {
        id: "pipeline",
        label: "Pipeline waarde",
        value: "€ 0",
        hint: "Geen open deals",
        tone: "violet",
      },
      {
        id: "taken",
        label: "Taken vandaag",
        value: "0",
        hint: "Alles bij",
        tone: "rose",
      },
      {
        id: "leads",
        label: "Leads deze week",
        value: "0",
        hint: "Nog geen leads",
        tone: "emerald",
      },
    ],
    actions: [],
    priorities: [],
    risks: [
      {
        id: "all-ok",
        title: "Geen urgente risico's",
        detail: "Je werkruimte is leeg — tijd om te starten",
        severity: "ok",
      },
    ],
    activity: [],
    agentName: input.agentName,
    openstaand: 0,
    actionItems: [],
  };
}

export async function loadOverviewDashboard(input: {
  supabase: SupabaseClient;
  companyId: number | null;
  userName: string;
  agentName: string;
  previewMode?: boolean;
}): Promise<OverviewDashboardData> {
  const previewMode = input.previewMode ?? false;

  if (previewMode) {
    return buildDemoOverview(input.userName, input.agentName);
  }

  if (!input.companyId) {
    return buildEmptyOverview(input);
  }

  const core = await fetchMissionCore(input.supabase, input.companyId, {
    useDemoWhenEmpty: false,
  });

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);

  const [
    topbar,
    pendingRaw,
    openFacturen,
    leadsWeekRes,
    stalledOffertesRes,
    pausedProjectsRes,
  ] = await Promise.all([
    loadTopbarSummary(input.supabase, input.companyId),
    fetchPendingAgentActions(input.supabase, input.companyId),
    fetchOpenFacturen(input.supabase, input.companyId),
    input.supabase
      .from("deals")
      .select("id", { count: "exact", head: true })
      .eq("bedrijf_id", input.companyId)
      .gte("created_at", weekStart.toISOString()),
    input.supabase
      .from("offertes")
      .select("id", { count: "exact", head: true })
      .eq("bedrijf_id", input.companyId)
      .in("status_new", ["verzonden", "bekeken"])
      .lt("sent_at", new Date(Date.now() - 7 * 864e5).toISOString()),
    input.supabase
      .from("projecten")
      .select("id, naam, klant_naam, status")
      .eq("bedrijf_id", input.companyId)
      .eq("status", "gepauzeerd")
      .limit(3),
  ]);

  const todoCount =
    core.tasks.length + core.important.length + core.actionItems.length;
  const urgentCount = core.important.length;
  const followUpCount = core.tasks.filter((t) => t.kind === "offerte").length;
  const openFacturenCount = openFacturen.length;
  const aiCount = core.actionItems.length;
  const projectRiskCount = pausedProjectsRes.data?.length ?? 0;

  const heroSummary =
    urgentCount > 0
      ? `Je hebt vandaag ${todoCount} acties, ${euro(core.openstaand)} openstaand en ${followUpCount || urgentCount} ${followUpCount === 1 ? "offerte die" : "offertes die"} opvolging nodig ${followUpCount === 1 ? "heeft" : "hebben"}.`
      : todoCount > 0
        ? `Je hebt vandaag ${todoCount} acties en ${euro(core.openstaand)} openstaand — alles onder controle, maar er is werk op de plank.`
        : `${input.agentName} houdt alles in de gaten — geen urgente acties op dit moment.`;

  const chips: StatusChip[] = [
    ...(aiCount > 0
      ? [{ id: "ai", label: "AI-voorstellen", count: aiCount, tone: "sky" as const }]
      : []),
    ...(openFacturenCount > 0
      ? [
          {
            id: "facturen",
            label: "Facturen open",
            count: openFacturenCount,
            tone: "amber" as const,
          },
        ]
      : []),
    ...(followUpCount > 0
      ? [
          {
            id: "offertes",
            label: "Offertes opvolgen",
            count: followUpCount,
            tone: "violet" as const,
          },
        ]
      : []),
    ...(projectRiskCount > 0
      ? [
          {
            id: "project",
            label: "Project risico",
            count: projectRiskCount,
            tone: "rose" as const,
          },
        ]
      : []),
  ];

  const kpis: OverviewKpi[] = [
    {
      id: "offertes-today",
      label: "Offertes vandaag",
      value: String(topbar.offertesVandaag),
      hint: `${topbar.verzonden} verzonden`,
      tone: "sky",
    },
    {
      id: "open-facturen",
      label: "Openstaande facturen",
      value: String(openFacturenCount),
      hint: euro(core.openstaand),
      tone: "amber",
    },
    {
      id: "pipeline",
      label: "Pipeline waarde",
      value: euro(topbar.pipeline),
      hint: "Actieve deals",
      tone: "violet",
    },
    {
      id: "taken",
      label: "Taken vandaag",
      value: String(todoCount),
      hint: urgentCount > 0 ? `${urgentCount} urgent` : "Geen urgent",
      tone: urgentCount > 0 ? "rose" : "emerald",
    },
    {
      id: "leads",
      label: "Leads deze week",
      value: String(leadsWeekRes.count ?? 0),
      hint: "Nieuw in pipeline",
      tone: "emerald",
    },
  ];

  const pendingById = new Map(pendingRaw.map((p) => [p.id, p]));

  const actions: OverviewAction[] = [
    ...core.actionItems.map((item) =>
      aiToAction(item, pendingById.get(item.id)),
    ),
    ...core.important.map(taskToAction),
    ...core.tasks.map(taskToAction),
  ];

  for (const p of pausedProjectsRes.data ?? []) {
    actions.push({
      id: `project-${p.id}`,
      type: "project",
      title: "Projectstatus controleren",
      client: p.klant_naam,
      detail: `${p.naam} · gepauzeerd`,
      urgency: "attention",
      href: `/dashboard/offertes/projecten/${p.id}`,
      primaryLabel: "Bijwerken",
    });
  }

  const seen = new Set<string>();
  const uniqueActions = actions.filter((a) => {
    const key = `${a.type}-${a.title}-${a.client}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const priorities: NovaPriority[] = uniqueActions
    .filter((a) => a.urgency !== "normal")
    .slice(0, 4)
    .map((a) => ({
      id: `prio-${a.id}`,
      title: a.title,
      detail: a.value ? `${a.client} · ${a.value}` : `${a.client} · ${a.detail}`,
      href: a.href,
    }));

  if (priorities.length < 4) {
    for (const a of uniqueActions.filter((x) => x.urgency === "normal")) {
      if (priorities.length >= 4) break;
      priorities.push({
        id: `prio-${a.id}`,
        title: a.title,
        detail: a.client,
        href: a.href,
      });
    }
  }

  const riskItems: RiskItem[] = [
    ...(core.overdueFacturenCount > 0
      ? [
          {
            id: "overdue-facturen",
            title: `${core.overdueFacturenCount} factuur${core.overdueFacturenCount > 1 ? "en" : ""} over vervaldatum`,
            detail: `${euro(core.openstaand)} openstaand`,
            severity: "urgent" as const,
            href: "/dashboard/facturen",
          },
        ]
      : []),
    ...((stalledOffertesRes.count ?? 0) > 0
      ? [
          {
            id: "stalled-offertes",
            title: `${stalledOffertesRes.count} offerte${(stalledOffertesRes.count ?? 0) > 1 ? "s" : ""} ouder dan 7 dagen`,
            detail: "Zonder reactie van klant",
            severity: "attention" as const,
            href: "/dashboard/offertes",
          },
        ]
      : []),
    ...(projectRiskCount > 0
      ? [
          {
            id: "paused-projects",
            title: `${projectRiskCount} project${projectRiskCount > 1 ? "en" : ""} gepauzeerd`,
            detail: "Status vereist opvolging",
            severity: "attention" as const,
            href: "/dashboard/offertes/projecten",
          },
        ]
      : []),
    ...(aiCount > 0
      ? [
          {
            id: "ai-pending",
            title: `${aiCount} AI-actie${aiCount > 1 ? "s" : ""} wachten op goedkeuring`,
            detail: `${input.agentName} heeft voorstellen klaargezet`,
            severity: "info" as const,
            href: "/dashboard/automatisaties",
          },
        ]
      : []),
  ];

  const risks: RiskItem[] =
    riskItems.length > 0
      ? riskItems
      : [
          {
            id: "all-ok",
            title: "Geen urgente risico's",
            detail: "Facturen, offertes en projecten zijn onder controle",
            severity: "ok" as const,
          },
        ];

  return {
    isDemo: false,
    greeting: greetingFor(),
    userName: input.userName,
    heroSummary,
    urgentCount,
    chips,
    kpis,
    actions: uniqueActions.slice(0, 12),
    priorities,
    risks,
    activity: core.activity.slice(0, 8),
    agentName: input.agentName,
    openstaand: core.openstaand,
    actionItems: core.actionItems,
  };
}
