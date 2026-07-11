"use client";

import type { AgentCapability } from "@/components/dashboard/agents/config";
import { CAPABILITY_OPTIONS } from "@/components/dashboard/agents/config";

const AGENT_ROUTES: Record<string, string> = {
  nova: "/dashboard/command-center?view=crew",
  schatter: "/dashboard/offertes",
  facturatie: "/dashboard/facturen",
  opvolger: "/dashboard/leads",
};

const PAGE_PATTERNS: { patterns: RegExp[]; route: string; label: string; openControlCenter?: boolean }[] = [
  {
    patterns: [/control\s*center/, /ai\s*control/, /logboek/, /agent.?status/, /recente?\s*acties/, /live\s*status/],
    route: "/dashboard/command-center",
    label: "AI Control Center",
    openControlCenter: true,
  },
  {
    patterns: [/offerte/, /schatter/, /calculatie/],
    route: "/dashboard/offertes",
    label: "Offertes",
  },
  {
    patterns: [/factuur/, /peppol/, /facturatie/, /betaal/],
    route: "/dashboard/facturen",
    label: "Facturen",
  },
  {
    patterns: [/contact/, /klant/],
    route: "/dashboard/contacten",
    label: "Contacten",
  },
  {
    patterns: [/lead/, /crm/, /opvolg/, /pipeline/],
    route: "/dashboard/leads",
    label: "Leads",
  },
  {
    patterns: [/geheugen/, /onthoud/, /herinnering/],
    route: "/dashboard/geheugen",
    label: "Geheugen",
  },
  {
    patterns: [/automat/, /goedkeur/, /voorstel/],
    route: "/dashboard/automatisaties",
    label: "Automatisaties",
  },
  {
    patterns: [/agent/, /nova/],
    route: "/dashboard/command-center?view=crew",
    label: "AI-agents",
  },
  {
    patterns: [/project/],
    route: "/dashboard/projecten",
    label: "Projecten",
  },
  {
    patterns: [/instelling/, /setting/],
    route: "/dashboard/instellingen",
    label: "Instellingen",
  },
];

export function routeForAgent(agentId: string): string {
  return AGENT_ROUTES[agentId] ?? "/dashboard/automatisaties";
}

export function routeForCapability(capability: AgentCapability): string {
  return (
    CAPABILITY_OPTIONS.find((c) => c.id === capability)?.href ??
    "/dashboard/automatisaties"
  );
}

export function detectNavigationIntent(
  text: string,
  agentId?: string,
): { route: string; label: string; openControlCenter?: boolean } | null {
  const q = text.toLowerCase();

  if (
    q.includes("nieuwe offerte") ||
    q.includes("offerte opstel") ||
    q.includes("offerte maken")
  ) {
    return { route: "/dashboard/offertes/nieuw", label: "Nieuwe offerte" };
  }

  const wantsNav =
    q.includes("ga naar") ||
    q.includes("open ") ||
    q.includes("toon ") ||
    q.includes("bekijk ") ||
    q.includes("navigeer") ||
    q.includes("breng me naar") ||
    q.includes("laat zien");

  if (wantsNav) {
    for (const item of PAGE_PATTERNS) {
      if (item.patterns.some((p) => p.test(q))) {
        return {
          route: item.route,
          label: item.label,
          openControlCenter: item.openControlCenter,
        };
      }
    }
  }

  // Control center zonder expliciet navigatie-commando
  if (
    q.includes("control center") ||
    q.includes("ai control") ||
    q.includes("logboek") ||
    q.includes("agent status") ||
    q.includes("recente acties")
  ) {
    return {
      route: "/dashboard/command-center",
      label: "AI Control Center",
      openControlCenter: true,
    };
  }

  if (agentId && (q.includes("jouw pagina") || q.includes("werkgebied"))) {
    const route = routeForAgent(agentId);
    const label =
      PAGE_PATTERNS.find((p) => p.route === route)?.label ?? "dashboard";
    return { route, label };
  }

  return null;
}

export function detectQuickAction(
  text: string,
  agentId: string,
): { route: string; label: string } | null {
  const q = text.toLowerCase();

  if (agentId === "schatter" && (q.includes("nieuw") || q.includes("opstel"))) {
    return { route: "/dashboard/offertes/nieuw", label: "Nieuwe offerte" };
  }

  if (
    agentId === "facturatie" &&
    (q.includes("control") || q.includes("openstaand"))
  ) {
    return { route: "/dashboard/facturen", label: "Facturen" };
  }

  if (agentId === "opvolger" && (q.includes("lead") || q.includes("opvolg"))) {
    return { route: "/dashboard/leads", label: "Leads" };
  }

  return null;
}
