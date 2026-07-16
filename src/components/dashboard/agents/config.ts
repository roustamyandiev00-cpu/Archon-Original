import type { AiToestemming } from "@/app/dashboard/instellingen/settings";
import { DEFAULT_BUILTIN_AVATARS } from "@/lib/agents/avatar-options";

export type AgentCapability =
  | "offertes"
  | "facturen"
  | "leads"
  | "automatisaties"
  | "herinneringen"
  | "planning";

export type CustomAgent = {
  id: string;
  name: string;
  role: string;
  instructies: string;
  capabilities: AgentCapability[];
  gradient: string;
  avatarUrl?: string | null;
  enabled: boolean;
  toestemming: AiToestemming;
  /** Ingebouwde agent — naam/rol aanpasbaar, niet verwijderbaar. */
  builtin?: boolean;
};

export const CAPABILITY_OPTIONS: {
  id: AgentCapability;
  label: string;
  description: string;
  href: string;
}[] = [
  {
    id: "offertes",
    label: "Offertes",
    description: "Opstellen, opvolgen en versturen van offertes",
    href: "/dashboard/offertes",
  },
  {
    id: "facturen",
    label: "Facturen",
    description: "Facturen aanmaken, Peppol en betalingen",
    href: "/dashboard/facturen",
  },
  {
    id: "leads",
    label: "Leads & CRM",
    description: "Nieuwe aanvragen en pipeline opvolgen",
    href: "/dashboard/leads",
  },
  {
    id: "automatisaties",
    label: "Automatisering",
    description: "AI-voorstellen en goedkeuringen",
    href: "/dashboard/automatisaties",
  },
  {
    id: "herinneringen",
    label: "Herinneringen",
    description: "Betalingsherinneringen en opvolgmails",
    href: "/dashboard/facturen",
  },
  {
    id: "planning",
    label: "Planning",
    description: "Afspraken en werfbezoeken plannen",
    href: "/dashboard/comms",
  },
];

export const GRADIENT_OPTIONS = [
  { id: "from-sky-400 to-indigo-500", label: "Blauw" },
  { id: "from-violet-400 to-purple-500", label: "Paars" },
  { id: "from-amber-400 to-orange-500", label: "Oranje" },
  { id: "from-emerald-400 to-teal-500", label: "Groen" },
  { id: "from-rose-400 to-pink-500", label: "Roze" },
  { id: "from-cyan-400 to-blue-500", label: "Cyaan" },
] as const;

export const DEFAULT_AGENTS: CustomAgent[] = [
  {
    id: "nova",
    name: "Lara",
    role: "AI-metgezel",
    instructies:
      "Monitor offertes, facturen en leads. Stel proactief acties voor en wacht op goedkeuring.",
    capabilities: ["automatisaties", "herinneringen", "planning"],
    gradient: "from-sky-400 to-indigo-500",
    avatarUrl: DEFAULT_BUILTIN_AVATARS.nova,
    enabled: true,
    toestemming: "voorstellen",
    builtin: true,
  },
  {
    id: "schatter",
    name: "Viktor",
    role: "Offertes",
    instructies:
      "Bereid offertes voor, structureer regels en volg verzonden offertes op.",
    capabilities: ["offertes"],
    gradient: "from-violet-400 to-purple-500",
    avatarUrl: DEFAULT_BUILTIN_AVATARS.schatter,
    enabled: true,
    toestemming: "voorstellen",
    builtin: true,
  },
  {
    id: "facturatie",
    name: "Nina",
    role: "Peppol",
    instructies:
      "Maak facturen aan, verstuur via Peppol en stuur betalingsherinneringen.",
    capabilities: ["facturen", "herinneringen"],
    gradient: "from-amber-400 to-orange-500",
    avatarUrl: DEFAULT_BUILTIN_AVATARS.facturatie,
    enabled: true,
    toestemming: "voorstellen",
    builtin: true,
  },
  {
    id: "opvolger",
    name: "Daan",
    role: "Leads",
    instructies:
      "Verrijk nieuwe leads, plan opvolging en houd de pipeline actueel.",
    capabilities: ["leads", "planning"],
    gradient: "from-emerald-400 to-teal-500",
    avatarUrl: DEFAULT_BUILTIN_AVATARS.opvolger,
    enabled: true,
    toestemming: "voorstellen",
    builtin: true,
  },
];

export function capabilityHref(capabilities: AgentCapability[]): string {
  const first = capabilities[0];
  return (
    CAPABILITY_OPTIONS.find((c) => c.id === first)?.href ??
    "/dashboard/automatisaties"
  );
}

export function mergeAgents(stored: CustomAgent[] | undefined): CustomAgent[] {
  if (!stored?.length) return DEFAULT_AGENTS.map((a) => ({ ...a }));

  const byId = new Map(stored.map((a) => [a.id, a]));
  const merged = DEFAULT_AGENTS.map((def) => {
    const saved = byId.get(def.id);
    if (!saved) return { ...def };
    return {
      ...def,
      ...saved,
      name:
        saved.name?.trim() === "Nova" || saved.name?.trim() === "Lima" || saved.name?.trim() === "Ela" || saved.name?.trim() === "Schatter" || saved.name?.trim() === "Facturatie" || saved.name?.trim() === "Opvolger"
          ? def.name
          : saved.name || def.name,
      builtin: true,
      capabilities:
        saved.capabilities?.length ? saved.capabilities : def.capabilities,
      avatarUrl: saved.avatarUrl ?? def.avatarUrl ?? null,
    };
  });

  for (const agent of stored) {
    if (!agent.builtin && !DEFAULT_AGENTS.some((d) => d.id === agent.id)) {
      merged.push(agent);
    }
  }

  return merged;
}

export function newAgentId() {
  return `agent-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function validateAgent(agent: CustomAgent): string | null {
  if (!agent.name.trim()) return "Naam is verplicht.";
  if (!agent.role.trim()) return "Rol is verplicht.";
  if (!agent.capabilities.length) return "Kies minstens één taak.";
  return null;
}
