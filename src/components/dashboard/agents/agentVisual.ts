import { DEFAULT_AGENTS } from "@/components/dashboard/agents/config";

export type AgentVisual = {
  id: string;
  name: string;
  gradient: string;
  avatarUrl?: string | null;
};

/** Backend/UI-aliassen → builtin agent-id in DEFAULT_AGENTS. */
const AGENT_NAME_ALIASES: Record<string, string> = {
  nova: "nova",
  lara: "nova",
  ela: "nova",
  lima: "facturatie",
  nina: "facturatie",
  facturatie: "facturatie",
  schatter: "schatter",
  viktor: "schatter",
  opvolger: "opvolger",
  daan: "opvolger",
};

export function resolveAgentVisual(agentName: string): AgentVisual {
  const trimmed = agentName.trim();
  const lower = trimmed.toLowerCase();
  const normalized = AGENT_NAME_ALIASES[lower] ?? lower;
  const match =
    DEFAULT_AGENTS.find(
      (agent) =>
        agent.name.toLowerCase() === normalized ||
        agent.id.toLowerCase() === normalized ||
        agent.name.toLowerCase() === lower,
    ) ??
    DEFAULT_AGENTS.find((agent) =>
      normalized.includes(agent.name.toLowerCase()),
    );

  if (match) {
    return {
      id: match.id,
      name: match.name,
      gradient: match.gradient,
      avatarUrl: match.avatarUrl ?? null,
    };
  }

  return {
    id: "custom",
    name: agentName.trim() || "Lara",
    gradient: "from-zinc-400 to-zinc-600",
  };
}

export function routeForActivityLog(input: {
  action_type: string;
  output_json: Record<string, unknown> | null;
}): string {
  const output = input.output_json ?? {};
  const offerteId = output.offerteId ?? output.offerte_id;
  const factuurId = output.factuurId ?? output.factuur_id;

  if (typeof factuurId === "number") {
    return `/dashboard/facturen/${factuurId}`;
  }
  if (typeof offerteId === "number") {
    return `/dashboard/offertes/${offerteId}`;
  }

  switch (input.action_type) {
    case "create_offerte":
    case "send_offerte":
      return "/dashboard/offertes";
    case "create_invoice_from_offerte":
    case "send_payment_reminder":
    case "send_formal_notice":
    case "forward_to_bailiff":
      return "/dashboard/facturen";
    case "lead_follow_up":
      return "/dashboard/leads";
    case "propose_chat_sanction":
      return "/dashboard/automatisaties";
    case "propose_werkpost_match":
      return "/bouwnetwerk";
    default:
      return "/dashboard/activiteit";
  }
}
