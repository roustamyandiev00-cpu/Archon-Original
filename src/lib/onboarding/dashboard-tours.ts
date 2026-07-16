import type { TourIntent, TourStep } from "@/lib/onboarding/tour-intents";

export type { TourIntent, TourStep };

export const DASHBOARD_INTENT_GREETING: Record<TourIntent, string> = {
  offertes:
    "Welkom in je Command Center! Ik laat je zien hoe je hier sneller offertes maakt en opvolgt.",
  facturatie:
    "Welkom! Ik wijs je waar je facturen, cashflow en betalingsopvolging regelt.",
  projecten:
    "Welkom! Zo houd je werven en projecten hier overzichtelijk bij.",
  overzicht:
    "Welkom in je Command Center! Ik geef je een rondleiding door alles wat je nodig hebt.",
};

export const DASHBOARD_TOURS: Record<TourIntent, TourStep[]> = {
  overzicht: [
    {
      id: "status",
      target: '[data-tour="dash-status"]',
      title: "Je dagelijkse status",
      text: "Bovenaan zie je meteen wat vandaag aandacht vraagt — openstaande taken, vervallen facturen of een rustige dag.",
    },
    {
      id: "metrics",
      target: '[data-tour="dash-metrics"]',
      title: "Kerncijfers in één oogopslag",
      text: "Vandaag, Aandacht, Cashflow en Pipeline geven je een snelle snapshot van je bedrijf zonder door menu's te moeten klikken.",
    },
    {
      id: "actions",
      target: '[data-tour="dash-actions"]',
      title: "Snelle acties",
      text: "Met één klik start je een nieuwe klant, offerte, project of factuur. Dit zijn je meest gebruikte taken.",
    },
    {
      id: "agents",
      target: '[data-tour="dash-agents"]',
      title: "AI Command Center",
      text: "Zes AI-agents voor offertes, facturen, projecten, klanten, planning en documenten. Klik op een kaart om direct naar die module te gaan.",
    },
    {
      id: "inbox",
      target: '[data-tour="dash-inbox"]',
      title: "AI Inbox",
      text: "Hier verschijnen concrete acties van je AI-agents — offertes om op te volgen, facturen die aandacht vragen, nieuwe leads.",
    },
    {
      id: "views",
      target: '[data-tour="dash-views"]',
      title: "Weergaven",
      text: "Wissel tussen Command Center, Opvolging, Financiën, Projecten en AI Crew. Elke tab toont wat voor jou relevant is.",
    },
    {
      id: "sidebar",
      target: '[data-tour="dash-sidebar"]',
      title: "Navigatie",
      text: "Via het menu links bereik je contacten, offertes, facturen, leads, automatisaties en meer — je volledige administratie.",
    },
    {
      id: "nova",
      target: '[data-tour="dash-nova"]',
      title: "Ela, je AI-metgezel",
      text: "Klik op Ela rechtsboven om vragen te stellen, taken te geven of acties klaar te zetten. Ik help je de hele dag door.",
    },
  ],
  offertes: [
    {
      id: "status",
      target: '[data-tour="dash-status"]',
      title: "Offertes in je pipeline",
      text: "Hier zie je hoeveel offertes openstaan en wat opvolging nodig heeft.",
    },
    {
      id: "actions",
      target: '[data-tour="dash-actions"]',
      title: "Nieuwe offerte starten",
      text: "Klik op Nieuwe Offerte om direct een voorstel op te stellen — Ela kan de regels alvast invullen.",
    },
    {
      id: "agents-offerte",
      target: '[data-tour="dash-agent-offerte"]',
      title: "Offerte-agent",
      text: "Deze agent houdt je openstaande offertes bij en stelt opvolgacties voor wanneer een klant niet reageert.",
    },
    {
      id: "inbox",
      target: '[data-tour="dash-inbox"]',
      title: "Offertes in je inbox",
      text: "Verzonden offertes die opvolging nodig hebben, verschijnen hier automatisch.",
    },
    {
      id: "nova",
      target: '[data-tour="dash-nova"]',
      title: "Vraag Ela om hulp",
      text: "Zeg bijvoorbeeld 'maak een offerte voor renovatie badkamer' — Ela zet alles klaar ter goedkeuring.",
    },
  ],
  facturatie: [
    {
      id: "metrics",
      target: '[data-tour="dash-metrics"]',
      title: "Cashflow & vervallen facturen",
      text: "De Cashflow-tegel toont meteen hoeveel facturen vervallen zijn en wat er nog openstaat.",
    },
    {
      id: "actions",
      target: '[data-tour="dash-actions"]',
      title: "Nieuwe factuur",
      text: "Maak een factuur in je eigen huisstijl of zet een goedgekeurde offerte om met één klik.",
    },
    {
      id: "agents-factuur",
      target: '[data-tour="dash-agent-factuur"]',
      title: "Factuur-agent",
      text: "Deze agent regelt betalingsherinneringen en houdt openstaande facturen in de gaten.",
    },
    {
      id: "inbox",
      target: '[data-tour="dash-inbox"]',
      title: "Factuur-acties",
      text: "Vervallen facturen en herinneringen die klaarstaan, vind je hier in je AI Inbox.",
    },
    {
      id: "nova",
      target: '[data-tour="dash-nova"]',
      title: "Ela voor facturatie",
      text: "Vraag Ela om een betalingsherinnering klaar te zetten of openstaande facturen te controleren.",
    },
  ],
  projecten: [
    {
      id: "status",
      target: '[data-tour="dash-status"]',
      title: "Projectoverzicht",
      text: "Zie welke werven en taken vandaag aandacht vragen.",
    },
    {
      id: "actions",
      target: '[data-tour="dash-actions"]',
      title: "Nieuw project",
      text: "Start een project vanuit een offerte of maak er direct een aan voor een nieuwe werf.",
    },
    {
      id: "agents-project",
      target: '[data-tour="dash-agent-project"]',
      title: "Project-agent",
      text: "Houdt je lopende werven bij en koppelt taken aan klanten en offertes.",
    },
    {
      id: "views",
      target: '[data-tour="dash-views"]',
      title: "Projecten-weergave",
      text: "Via de tab Projecten zie je al je werven, planning en openstaande taken samen.",
    },
    {
      id: "nova",
      target: '[data-tour="dash-nova"]',
      title: "Ela op de werf",
      text: "Vraag Ela om een werf op te volgen of een taak toe te voegen — ook vanaf je gsm.",
    },
  ],
};
