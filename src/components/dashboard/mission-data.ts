import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ActionItem } from "@/components/dashboard/ActionItems";
import { DEMO_DASHBOARD } from "@/lib/demo";
import { relTime } from "@/components/dashboard/mission";
import {
  capabilityHref,
  type AgentCapability,
  type CustomAgent,
} from "@/components/dashboard/agents/config";

type PendingActionRow = {
  id: number;
  title: string;
  reason: string | null;
  action_type: string;
  target_entity_type: string | null;
  target_route: string | null;
};

type OpenFactuurRow = {
  id: number;
  nummer: string;
  klant: string | null;
  totaal_bedrag: number | null;
  vervaldatum: string | null;
  status: string | null;
};

/** Gedeeld tussen topbar en overzicht — één query per request. */
export const fetchPendingAgentActions = cache(
  async (supabase: SupabaseClient, companyId: number) => {
    const { data } = await supabase
      .from("agent_actions")
      .select(
        "id, title, reason, action_type, target_entity_type, target_route",
      )
      .eq("company_id", companyId)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(8);

    return (data ?? []) as PendingActionRow[];
  },
);

/** Alle open facturen in één round-trip (topbar + KPI + taken). */
export const fetchOpenFacturen = cache(
  async (supabase: SupabaseClient, companyId: number) => {
    const { data } = await supabase
      .from("facturen")
      .select("id, nummer, klant, totaal_bedrag, vervaldatum, status")
      .eq("bedrijf_id", companyId)
      .is("paid_at", null)
      .neq("status", "betaald")
      .order("vervaldatum", { ascending: true });

    return (data ?? []) as OpenFactuurRow[];
  },
);

export type MissionTask = {
  id: string;
  title: string;
  detail: string;
  kind: ActionItem["kind"];
  href: string;
  priority: "high" | "medium" | "low";
  label: string;
};

export type DoneItem = {
  id: string;
  text: string;
  time: string;
  kind: string;
  href?: string;
};

export type NovaBriefing = {
  headline: string;
  bullets: string[];
  ctaLabel: string;
  ctaHref: string;
};

export type AgentWorkItem = {
  id: string;
  text: string;
  href: string;
  /** Alleen bij afgeronde items: relatieve tijd. */
  time?: string;
};

export type AgentFleetMember = {
  id: string;
  name: string;
  role: string;
  status: "actief" | "idle" | "wacht";
  statusLabel: string;
  gradient: string;
  pending: number;
  doneRecent: number;
  proactive: string;
  href: string;
  lastAction?: string;
  /** Wat deze agent nog moet doen (top 3). */
  todoItems: AgentWorkItem[];
  /** Wat deze agent recent heeft afgerond (top 2). */
  doneItems: AgentWorkItem[];
  /** Proactieve volgende stap, ook als er niets open staat. */
  suggestion: { label: string; href: string };
};

export type NavBadges = {
  openFacturen: number;
  openLeads: number;
};

export type TopbarSummary = {
  offertesVandaag: number;
  verzonden: number;
  pipeline: number;
  notifications: { id: string; title: string; detail: string; href: string }[];
  syncedAt: string;
};

function euro(n: number) {
  if (n >= 1000) return `€ ${(n / 1000).toFixed(1)}k`;
  return `€ ${Math.round(n).toLocaleString("nl-BE")}`;
}

function kindOf(entity?: string | null): ActionItem["kind"] {
  const e = (entity ?? "").toLowerCase();
  if (e.includes("offerte") || e.includes("quote")) return "offerte";
  if (e.includes("factuur") || e.includes("invoice")) return "factuur";
  return "opvolging";
}

function daysSince(iso: string | null | undefined) {
  if (!iso) return 0;
  return Math.floor((Date.now() - new Date(iso).getTime()) / 864e5);
}

export async function loadNavBadges(
  supabase: SupabaseClient,
  companyId: number | null,
): Promise<NavBadges> {
  if (!companyId) return { openFacturen: 0, openLeads: 0 };

  const [facturenRes, leadsRes] = await Promise.all([
    supabase
      .from("facturen")
      .select("id", { count: "exact", head: true })
      .eq("bedrijf_id", companyId)
      .is("paid_at", null)
      .neq("status", "betaald"),
    supabase
      .from("deals")
      .select("id", { count: "exact", head: true })
      .eq("bedrijf_id", companyId)
      .in("stadium", ["Nieuw", "Gekwalificeerd", "Offerte verzonden"]),
  ]);

  return {
    openFacturen: facturenRes.count ?? 0,
    openLeads: leadsRes.count ?? 0,
  };
}

export async function loadTopbarSummary(
  supabase: SupabaseClient,
  companyId: number | null,
): Promise<TopbarSummary> {
  const today = new Date().toISOString().slice(0, 10);
  const fallback: TopbarSummary = {
    offertesVandaag: 0,
    verzonden: 0,
    pipeline: 0,
    notifications: [],
    syncedAt: new Date().toISOString(),
  };

  if (!companyId) return fallback;

  const [offertesToday, sentToday, pipelineRes, pendingActions, openFacturen] =
    await Promise.all([
      supabase
        .from("offertes")
        .select("id", { count: "exact", head: true })
        .eq("bedrijf_id", companyId)
        .gte("created_at", `${today}T00:00:00`),
      supabase
        .from("offertes")
        .select("id", { count: "exact", head: true })
        .eq("bedrijf_id", companyId)
        .eq("status_new", "verzonden")
        .gte("sent_at", `${today}T00:00:00`),
      supabase
        .from("deals")
        .select("waarde")
        .eq("bedrijf_id", companyId)
        .not("stadium", "in", '("Gewonnen","Verloren")'),
      fetchPendingAgentActions(supabase, companyId),
      fetchOpenFacturen(supabase, companyId),
    ]);

  const pipeline = (pipelineRes.data ?? []).reduce(
    (s, d) => s + Number(d.waarde ?? 0),
    0,
  );

  const notifications = [
    ...pendingActions.slice(0, 5).map((a) => ({
      id: `action-${a.id}`,
      title: a.title,
      detail: a.reason ?? "AI-voorstel wacht op goedkeuring",
      href: a.target_route ?? "/dashboard/automatisaties",
    })),
    ...openFacturen.slice(0, 3).map((f) => ({
      id: `factuur-${f.id}`,
      title: `Openstaande factuur ${f.nummer}`,
      detail: f.klant ?? "Betaalherinnering mogelijk",
      href: `/dashboard/facturen/${f.id}`,
    })),
  ].slice(0, 6);

  return {
    offertesVandaag: offertesToday.count ?? 0,
    verzonden: sentToday.count ?? 0,
    pipeline,
    notifications,
    syncedAt: new Date().toISOString(),
  };
}

export async function loadMissionOverview(
  supabase: SupabaseClient,
  companyId: number | null,
  agentName: string,
  agentConfig: CustomAgent[],
) {
  const core = await fetchMissionCore(supabase, companyId);
  return assembleMissionOverview(core, agentName, agentConfig);
}

export const fetchMissionCore = cache(async function fetchMissionCore(
  supabase: SupabaseClient,
  companyId: number | null,
) {
  let offertesCount = 0;
  let klantenCount = 0;
  let gefactureerd = 0;
  let openstaand = 0;
  let actionItems: ActionItem[] = [];
  let activity: DoneItem[] = [];
  let tasks: MissionTask[] = [];
  let important: MissionTask[] = [];
  let activityLogs: { agent_name: string; message: string | null }[] = [];

  if (companyId) {
    const monthStart = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1,
    )
      .toISOString()
      .slice(0, 10);
    const today = new Date().toISOString().slice(0, 10);

    const [
      offertesRes,
      klantenRes,
      facturenMonthRes,
      pendingActions,
      openFacturen,
      activityRes,
      followUpOffertes,
      conceptOffertes,
      deals,
      recentAccepted,
      recentPaid,
    ] = await Promise.all([
      supabase
        .from("offertes")
        .select("id", { count: "exact", head: true })
        .eq("bedrijf_id", companyId)
        .gte("created_at", monthStart),
      supabase
        .from("customers")
        .select("id", { count: "exact", head: true })
        .eq("company_id", companyId)
        .eq("is_active", true),
      supabase
        .from("facturen")
        .select("totaal_bedrag")
        .eq("bedrijf_id", companyId)
        .gte("datum", monthStart),
      fetchPendingAgentActions(supabase, companyId),
      fetchOpenFacturen(supabase, companyId),
      supabase
        .from("agent_activity_logs")
        .select("id, message, agent_name, action_type, created_at")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })
        .limit(8),
      supabase
        .from("offertes")
        .select("id, nummer, klant, status_new, sent_at")
        .eq("bedrijf_id", companyId)
        .in("status_new", ["verzonden", "bekeken"])
        .order("sent_at", { ascending: true })
        .limit(5),
      supabase
        .from("offertes")
        .select("id, nummer, klant, created_at")
        .eq("bedrijf_id", companyId)
        .eq("status_new", "concept")
        .order("created_at", { ascending: false })
        .limit(4),
      supabase
        .from("deals")
        .select("id, titel, stadium, waarde, deadline")
        .eq("bedrijf_id", companyId)
        .in("stadium", ["Nieuw", "Gekwalificeerd", "Offerte verzonden"])
        .order("created_at", { ascending: false })
        .limit(4),
      supabase
        .from("offertes")
        .select("id, nummer, klant, accepted_at")
        .eq("bedrijf_id", companyId)
        .eq("status_new", "geaccepteerd")
        .order("accepted_at", { ascending: false })
        .limit(3),
      supabase
        .from("facturen")
        .select("id, nummer, klant, paid_at")
        .eq("bedrijf_id", companyId)
        .not("paid_at", "is", null)
        .order("paid_at", { ascending: false })
        .limit(3),
    ]);

    const overdueFacturen = openFacturen.filter(
      (f) => f.vervaldatum && f.vervaldatum < today,
    );
    const openFacturenTasks = openFacturen.slice(0, 5);

    offertesCount = offertesRes.count ?? 0;
    klantenCount = klantenRes.count ?? 0;
    gefactureerd = (facturenMonthRes.data ?? []).reduce(
      (s, r) => s + Number(r.totaal_bedrag ?? 0),
      0,
    );
    openstaand = openFacturen.reduce(
      (s, r) => s + Number(r.totaal_bedrag ?? 0),
      0,
    );

    actionItems = pendingActions.map((a) => ({
      id: a.id,
      title: a.title,
      detail: a.reason ?? a.action_type ?? "AI-voorstel",
      kind: kindOf(a.target_entity_type),
    }));

    for (const o of overdueFacturen.slice(0, 4)) {
      important.push({
        id: `overdue-${o.id}`,
        title: `Factuur ${o.nummer} vervallen`,
        detail: `${o.klant} — ${euro(Number(o.totaal_bedrag ?? 0))} openstaand`,
        kind: "factuur",
        href: `/dashboard/facturen/${o.id}`,
        priority: "high",
        label: "Urgent",
      });
    }

    for (const o of followUpOffertes.data ?? []) {
      const days = daysSince(o.sent_at);
      const item: MissionTask = {
        id: `followup-${o.id}`,
        title: `Offerte ${o.nummer} opvolgen`,
        detail: `${o.klant} — ${days > 0 ? `${days} dagen` : "vandaag"} zonder reactie`,
        kind: "offerte",
        href: `/dashboard/offertes/${o.id}`,
        priority: days >= 5 ? "high" : "medium",
        label: days >= 5 ? "Opvolgen" : "Bekijken",
      };
      if (days >= 5) important.push(item);
      else tasks.push(item);
    }

    for (const o of conceptOffertes.data ?? []) {
      tasks.push({
        id: `concept-${o.id}`,
        title: `Offerte ${o.nummer} afronden`,
        detail: `${o.klant} — nog in concept, klaar om te versturen`,
        kind: "offerte",
        href: `/dashboard/offertes/${o.id}`,
        priority: "medium",
        label: "Afronden",
      });
    }

    for (const f of openFacturenTasks) {
      if (important.some((i) => i.id === `overdue-${f.id}`)) continue;
      const overdue = f.vervaldatum && f.vervaldatum < today;
      tasks.push({
        id: `open-${f.id}`,
        title: `Factuur ${f.nummer} innen`,
        detail: `${f.klant} — ${euro(Number(f.totaal_bedrag ?? 0))}`,
        kind: "factuur",
        href: `/dashboard/facturen/${f.id}`,
        priority: overdue ? "high" : "medium",
        label: overdue ? "Herinneren" : "Openen",
      });
    }

    for (const d of deals.data ?? []) {
      tasks.push({
        id: `deal-${d.id}`,
        title: d.titel,
        detail: `${d.stadium} — pipeline ${euro(Number(d.waarde ?? 0))}`,
        kind: "opvolging",
        href: "/dashboard/leads",
        priority: "medium",
        label: "Lead",
      });
    }

    if (offertesCount === 0 && klantenCount > 0) {
      tasks.push({
        id: "onboard-offerte",
        title: "Eerste offerte opstellen",
        detail: `Je hebt ${klantenCount} contacten — zet er een offerte voor klaar`,
        kind: "offerte",
        href: "/dashboard/offertes/nieuw",
        priority: "low",
        label: "Starten",
      });
    }

    activity = (activityRes.data ?? []).map((l) => ({
      id: `log-${l.id}`,
      text: l.message ?? `${l.agent_name} — ${l.action_type}`,
      time: relTime(l.created_at),
      kind: kindOf(l.action_type),
    }));
    activityLogs = (activityRes.data ?? []).map((l) => ({
      agent_name: l.agent_name,
      message: l.message,
    }));

    for (const o of recentAccepted.data ?? []) {
      activity.push({
        id: `accepted-${o.id}`,
        text: `Offerte ${o.nummer} geaccepteerd door ${o.klant}`,
        time: relTime(o.accepted_at),
        kind: "offerte",
        href: `/dashboard/offertes/${o.id}`,
      });
    }

    for (const f of recentPaid.data ?? []) {
      activity.push({
        id: `paid-${f.id}`,
        text: `Factuur ${f.nummer} betaald door ${f.klant}`,
        time: relTime(f.paid_at),
        kind: "factuur",
        href: `/dashboard/facturen/${f.id}`,
      });
    }

    activity.sort(
      (a, b) =>
        (b.time === "nu" ? 999 : 0) - (a.time === "nu" ? 999 : 0),
    );
  }

  const isDemo =
    !companyId ||
    (klantenCount === 0 &&
      offertesCount === 0 &&
      gefactureerd === 0 &&
      actionItems.length === 0 &&
      tasks.length === 0 &&
      important.length === 0 &&
      activity.length === 0);

  if (isDemo) {
    offertesCount = DEMO_DASHBOARD.offertesCount;
    klantenCount = DEMO_DASHBOARD.klantenCount;
    gefactureerd = DEMO_DASHBOARD.gefactureerd;
    openstaand = DEMO_DASHBOARD.openstaand;
    actionItems = DEMO_DASHBOARD.actionItems;
    activity = DEMO_DASHBOARD.activity.map((a) => ({
      id: String(a.id),
      text: a.text,
      time: a.time,
      kind: a.kind,
    }));
    tasks = DEMO_DASHBOARD.actionItems.map((a) => ({
      id: `demo-${a.id}`,
      title: a.title,
      detail: a.detail,
      kind: a.kind,
      href:
        a.kind === "offerte"
          ? "/dashboard/offertes"
          : a.kind === "factuur"
            ? "/dashboard/facturen"
            : "/dashboard/leads",
      priority: "medium" as const,
      label: "Openen",
    }));
    important = tasks.filter((t) => t.kind === "factuur").slice(0, 1);
    tasks = tasks.filter((t) => !important.includes(t));
  }

  return {
    offertesCount,
    klantenCount,
    gefactureerd,
    openstaand,
    actionItems,
    activity,
    tasks,
    important,
    activityLogs,
    isDemo,
  };
});

export function assembleMissionOverview(
  core: Awaited<ReturnType<typeof fetchMissionCore>>,
  agentName: string,
  agentConfig: CustomAgent[],
) {
  const {
    offertesCount,
    klantenCount,
    gefactureerd,
    openstaand,
    actionItems,
    activity,
    tasks,
    important,
    activityLogs,
    isDemo,
  } = core;

  const todoCount = tasks.length + important.length + actionItems.length;
  const nova = buildNovaBriefing({
    agentName,
    todoCount,
    actionItems,
    important,
    openstaand,
    offertesCount,
    klantenCount,
    isDemo,
  });

  const agents = buildAgentFleet({
    agentName,
    agentConfig,
    actionItems,
    tasks,
    important,
    activity,
    activityLogs,
    openstaand,
    isDemo,
  });

  return {
    offertesCount,
    klantenCount,
    gefactureerd,
    openstaand,
    actionItems,
    activity: activity.slice(0, 8),
    tasks,
    important,
    nova,
    agents,
    isDemo,
    todoCount,
  };
}

function buildNovaBriefing(input: {
  agentName: string;
  todoCount: number;
  actionItems: ActionItem[];
  important: MissionTask[];
  openstaand: number;
  offertesCount: number;
  klantenCount: number;
  isDemo: boolean;
}): NovaBriefing {
  const bullets: string[] = [];

  if (input.actionItems.length > 0) {
    bullets.push(
      `${input.actionItems.length} AI-voorstel${input.actionItems.length > 1 ? "len" : ""} wacht${input.actionItems.length === 1 ? "" : "en"} op je goedkeuring.`,
    );
  }
  if (input.important.length > 0) {
    bullets.push(
      `${input.important.length} urgente ${input.important.length === 1 ? "zaak" : "zaken"} verdienen vandaag aandacht.`,
    );
  }
  if (input.openstaand > 0) {
    bullets.push(
      `Er staat nog geld open — focus op innen en opvolgen.`,
    );
  }
  if (input.offertesCount === 0 && input.klantenCount > 0) {
    bullets.push(
      `Je hebt ${input.klantenCount} contacten maar nog geen offerte deze maand. Tijd om te converteren.`,
    );
  }
  if (bullets.length === 0) {
    bullets.push(
      "Alles is bij. Ik blijf je offertes, facturen en leads monitoren.",
    );
  }

  const headline =
    input.todoCount > 0
      ? `Ik heb ${input.todoCount} punt${input.todoCount > 1 ? "en" : ""} voor je klaarstaan.`
      : `${input.agentName} houdt je bedrijf in de gaten — alles loopt op schema.`;

  return {
    headline,
    bullets,
    ctaLabel:
      input.actionItems.length > 0
        ? "AI-voorstellen bekijken"
        : input.todoCount > 0
          ? "Taken afwerken"
          : "Automatisaties openen",
    ctaHref:
      input.actionItems.length > 0
        ? "/dashboard/automatisaties"
        : input.todoCount > 0
          ? "/dashboard/offertes"
          : "/dashboard/automatisaties",
  };
}

function pendingForCapabilities(
  capabilities: AgentCapability[],
  counts: {
    offerteTodo: number;
    factuurTodo: number;
    leadTodo: number;
    novaPending: number;
  },
) {
  let total = 0;
  if (capabilities.includes("offertes")) total += counts.offerteTodo;
  if (capabilities.includes("facturen") || capabilities.includes("herinneringen"))
    total += counts.factuurTodo;
  if (capabilities.includes("leads")) total += counts.leadTodo;
  if (capabilities.includes("automatisaties")) total += counts.novaPending;
  return total;
}

function proactiveForAgent(
  agent: CustomAgent,
  counts: {
    offerteTodo: number;
    factuurTodo: number;
    leadTodo: number;
    novaPending: number;
    openstaand: number;
  },
): string {
  if (agent.instructies.trim()) {
    const pending = pendingForCapabilities(agent.capabilities, counts);
    if (pending > 0) {
      return `${pending} open punt${pending > 1 ? "en" : ""} — ${agent.instructies.trim().slice(0, 80)}${agent.instructies.length > 80 ? "…" : ""}`;
    }
    return agent.instructies.trim();
  }

  const parts: string[] = [];
  if (agent.capabilities.includes("automatisaties") && counts.novaPending > 0) {
    parts.push(
      `${counts.novaPending} voorstel${counts.novaPending > 1 ? "len" : ""} wacht op goedkeuring.`,
    );
  }
  if (agent.capabilities.includes("offertes") && counts.offerteTodo > 0) {
    parts.push(
      `${counts.offerteTodo} offerte${counts.offerteTodo > 1 ? "s" : ""} vragen aandacht.`,
    );
  }
  if (
    (agent.capabilities.includes("facturen") ||
      agent.capabilities.includes("herinneringen")) &&
    counts.factuurTodo > 0
  ) {
    parts.push(
      `${counts.factuurTodo} factuur${counts.factuurTodo > 1 ? "s" : ""} open.`,
    );
  }
  if (agent.capabilities.includes("leads") && counts.leadTodo > 0) {
    parts.push(
      `${counts.leadTodo} lead${counts.leadTodo > 1 ? "s" : ""} wachten op opvolging.`,
    );
  }
  if (parts.length > 0) return parts.join(" ");
  return `${agent.name} staat klaar — geen open taken op dit moment.`;
}

function agentMatchesLog(agent: CustomAgent, logName: string) {
  const n = logName.toLowerCase();
  if (n.includes(agent.name.toLowerCase())) return true;
  if (agent.id === "nova" && (n.includes("nova") || n === agent.name.toLowerCase()))
    return true;
  if (agent.id === "schatter" && (n.includes("schatter") || n.includes("offerte")))
    return true;
  if (agent.id === "facturatie" && (n.includes("factuur") || n.includes("peppol")))
    return true;
  if (agent.id === "opvolger" && (n.includes("opvolg") || n.includes("lead")))
    return true;
  return false;
}

function agentTaskKinds(agent: CustomAgent): ActionItem["kind"][] {
  const kinds: ActionItem["kind"][] = [];
  if (agent.capabilities.includes("offertes")) kinds.push("offerte");
  if (
    agent.capabilities.includes("facturen") ||
    agent.capabilities.includes("herinneringen")
  )
    kinds.push("factuur");
  if (agent.capabilities.includes("leads")) kinds.push("opvolging");
  return kinds;
}

function suggestionForAgent(
  agent: CustomAgent,
  counts: {
    offerteTodo: number;
    factuurTodo: number;
    leadTodo: number;
    novaPending: number;
  },
): { label: string; href: string } {
  if (agent.capabilities.includes("automatisaties")) {
    return counts.novaPending > 0
      ? { label: "Voorstellen goedkeuren", href: "/dashboard/automatisaties" }
      : { label: "Nieuw voorstel laten maken", href: "/dashboard/automatisaties" };
  }
  if (agent.capabilities.includes("offertes")) {
    return counts.offerteTodo > 0
      ? { label: "Offertes afwerken", href: "/dashboard/offertes" }
      : { label: "Nieuwe offerte opstellen", href: "/dashboard/offertes/nieuw" };
  }
  if (
    agent.capabilities.includes("facturen") ||
    agent.capabilities.includes("herinneringen")
  ) {
    return counts.factuurTodo > 0
      ? { label: "Herinneringen versturen", href: "/dashboard/facturen" }
      : { label: "Nieuwe factuur aanmaken", href: "/dashboard/facturen/nieuw" };
  }
  if (agent.capabilities.includes("leads")) {
    return counts.leadTodo > 0
      ? { label: "Leads opvolgen", href: "/dashboard/leads" }
      : { label: "Pipeline bekijken", href: "/dashboard/leads" };
  }
  return { label: "Openen", href: capabilityHref(agent.capabilities) };
}

function buildAgentFleet(input: {
  agentName: string;
  agentConfig: CustomAgent[];
  actionItems: ActionItem[];
  tasks: MissionTask[];
  important: MissionTask[];
  activity: DoneItem[];
  activityLogs: { agent_name: string; message: string | null }[];
  openstaand: number;
  isDemo: boolean;
}): AgentFleetMember[] {
  const allTasks = [...input.important, ...input.tasks];
  const offerteTodo = allTasks.filter((t) => t.kind === "offerte").length;
  const factuurTodo = allTasks.filter((t) => t.kind === "factuur").length;
  const leadTodo = allTasks.filter((t) => t.kind === "opvolging").length;
  const novaPending = input.actionItems.length;

  const counts = {
    offerteTodo,
    factuurTodo,
    leadTodo,
    novaPending,
    openstaand: input.openstaand,
  };

  const enabledAgents = input.agentConfig.filter((a) => a.enabled);

  return enabledAgents.map((agent) => {
    let doneRecent = 0;
    let lastAction: string | undefined;
    const doneItems: AgentWorkItem[] = [];

    for (const log of input.activityLogs) {
      if (!agentMatchesLog(agent, log.agent_name)) continue;
      doneRecent += 1;
      if (!lastAction && log.message) lastAction = log.message;
    }

    const kinds = agentTaskKinds(agent);

    for (const item of input.activity) {
      const matches =
        kinds.includes(item.kind as ActionItem["kind"]) ||
        (agent.capabilities.includes("automatisaties") &&
          item.kind === "opvolging");
      if (!matches) continue;
      doneRecent += 1;
      if (!lastAction) lastAction = item.text;
      if (doneItems.length < 2) {
        doneItems.push({
          id: item.id,
          text: item.text,
          href: item.href ?? capabilityHref(agent.capabilities),
          time: item.time,
        });
      }
    }

    // Openstaande taken die bij dit werkdomein horen.
    const todoItems: AgentWorkItem[] = allTasks
      .filter((t) => kinds.includes(t.kind))
      .slice(0, 3)
      .map((t) => ({ id: t.id, text: t.title, href: t.href }));

    // Nova (automatisaties) toont de AI-voorstellen als eigen takenlijst.
    if (agent.capabilities.includes("automatisaties")) {
      for (const a of input.actionItems.slice(0, 3 - todoItems.length)) {
        todoItems.unshift({
          id: `action-${a.id}`,
          text: a.title,
          href: "/dashboard/automatisaties",
        });
      }
    }

    const pending = pendingForCapabilities(agent.capabilities, counts);
    const displayName =
      agent.id === "nova" ? input.agentName || agent.name : agent.name;
    const status: AgentFleetMember["status"] =
      pending > 0 ? "actief" : doneRecent > 0 ? "wacht" : "idle";
    const statusLabel =
      pending > 0 ? "Actief" : doneRecent > 0 ? "Klaar" : "Stand-by";

    return {
      id: agent.id,
      name: displayName,
      role: agent.role,
      status,
      statusLabel,
      gradient: agent.gradient,
      pending,
      doneRecent,
      proactive: proactiveForAgent(agent, counts),
      href: capabilityHref(agent.capabilities),
      lastAction,
      todoItems: todoItems.slice(0, 3),
      doneItems,
      suggestion: suggestionForAgent(agent, counts),
    };
  });
}

export { euro };
