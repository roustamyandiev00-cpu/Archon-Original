import type { ChatAgent } from "@/components/dashboard/agent-chat/AgentChatProvider";

export type CrewAgentDef = {
  id: string;
  name: string;
  role: string;
  model: string;
  description: string;
  examplePrompt: string;
  gradient: string;
  actions: { label: string; href: string }[];
};

export const CREW_AGENTS: CrewAgentDef[] = [
  {
    id: "thomas",
    name: "Thomas",
    role: "Agenda & Afspraken",
    model: "Gemini 1.5 Flash",
    description:
      "Plant afspraken, stuurt herinneringen en houdt je agenda bij.",
    examplePrompt: "Plan een werfbezoek volgende week dinsdag om 10u.",
    gradient: "from-orange-400 to-amber-500",
    actions: [
      { label: "Plan afspraak", href: "/dashboard/agenda" },
      { label: "Toon agenda vandaag", href: "/dashboard/agenda" },
      { label: "Stuur herinnering", href: "/dashboard/automatisaties" },
      { label: "Maak brief", href: "/dashboard/automatisaties" },
    ],
  },
  {
    id: "jason",
    name: "Jason",
    role: "Offertes",
    model: "Gemini 1.5 Pro",
    description: "Maakt offertes, berekent prijzen en volgt op.",
    examplePrompt: "Maak een offerte voor een badkamerrenovatie van €12.000.",
    gradient: "from-violet-400 to-purple-500",
    actions: [
      { label: "Nieuwe offerte", href: "/dashboard/offertes/nieuw" },
      { label: "Openstaande offertes", href: "/dashboard/offertes" },
      { label: "Offerte opvolgen", href: "/dashboard/offertes" },
      { label: "Maak brief", href: "/dashboard/automatisaties" },
    ],
  },
  {
    id: "robin",
    name: "Robin",
    role: "Facturen & Betalingen",
    model: "Gemini 1.5 Flash",
    description:
      "Maakt facturen, volgt betalingen op en stuurt herinneringen.",
    examplePrompt: "Welke facturen zijn nog niet betaald deze maand?",
    gradient: "from-sky-400 to-indigo-500",
    actions: [
      { label: "Nieuwe factuur", href: "/dashboard/facturen" },
      { label: "Onbetaalde facturen", href: "/dashboard/facturen" },
      { label: "Stuur aanmaning", href: "/dashboard/facturen" },
      { label: "Maak brief", href: "/dashboard/automatisaties" },
    ],
  },
  {
    id: "maarten",
    name: "Maarten",
    role: "Projecten & Planning",
    model: "Gemini 1.5 Pro",
    description:
      "Beheert projecten, bewaakt deadlines en rapporteert voortgang.",
    examplePrompt: "Welke projecten lopen vertraging op deze week?",
    gradient: "from-emerald-400 to-teal-500",
    actions: [
      { label: "Projectstatus", href: "/dashboard/offertes/projecten" },
      { label: "Vertraagde projecten", href: "/dashboard/offertes/projecten" },
      { label: "Nieuw project", href: "/dashboard/offertes/projecten" },
      { label: "Maak brief", href: "/dashboard/automatisaties" },
    ],
  },
  {
    id: "nele",
    name: "Nele",
    role: "Klanten & Contacten",
    model: "Gemini 1.5 Flash",
    description:
      "Beheert klantrelaties, zoekt contacten op en volgt leads op.",
    examplePrompt: "Zoek alle klanten in Leuven met open offertes.",
    gradient: "from-rose-400 to-pink-500",
    actions: [
      { label: "Klant zoeken", href: "/dashboard/contacten" },
      { label: "Nieuwe klant", href: "/dashboard/contacten" },
      { label: "Klanthistoriek", href: "/dashboard/contacten" },
      { label: "Maak brief", href: "/dashboard/automatisaties" },
    ],
  },
  {
    id: "matias",
    name: "Matias",
    role: "Cashflow & Boekhouding",
    model: "Gemini 1.5 Pro",
    description:
      "Analyseert cashflow, bewaakt budget en geeft financieel inzicht.",
    examplePrompt: "Hoe ziet mijn cashflow eruit de komende 30 dagen?",
    gradient: "from-amber-400 to-orange-500",
    actions: [
      { label: "Cashflow analyse", href: "/dashboard/facturen" },
      { label: "Budget check", href: "/dashboard/boekhouding" },
      { label: "Financieel rapport", href: "/dashboard/facturen" },
      { label: "Maak brief", href: "/dashboard/automatisaties" },
    ],
  },
];

export function crewAgentToChat(agent: CrewAgentDef): ChatAgent {
  return {
    id: agent.id,
    name: agent.name,
    role: agent.role,
    gradient: agent.gradient,
  };
}
