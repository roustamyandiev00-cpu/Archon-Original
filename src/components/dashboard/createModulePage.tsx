import type { ReactNode } from "react";
import PlaceholderPage from "@/components/dashboard/PlaceholderPage";
import { CalendarDays, History, Send, Tags, Users, Wallet } from "lucide-react";

type ModuleDef = {
  title: string;
  description: string;
  icon: ReactNode;
  features: string[];
};

const MODULES: Record<string, ModuleDef> = {
  prijslijst: {
    title: "Prijslijst",
    description: "Beheer standaardprijzen, eenheden en calculatieregels voor offertes.",
    icon: <Tags size={20} />,
    features: [
      "Artikelen en eenheidsprijzen",
      "Koppeling met offertes en projecten",
      "Import uit Excel of CSV",
    ],
  },
  agenda: {
    title: "Agenda",
    description: "Plan werfbezoeken, afspraken en teamplanning op één plek.",
    icon: <CalendarDays size={20} />,
    features: [
      "Dag- en weekweergave",
      "Koppeling met projecten en klanten",
      "Herinneringen en uitnodigingen",
    ],
  },
  telegram: {
    title: "Telegram Support",
    description: "Koppel Telegram voor snelle support en teamnotificaties.",
    icon: <Send size={20} />,
    features: [
      "Bot-koppeling voor meldingen",
      "Supportkanaal voor je team",
      "Statusupdates vanuit het dashboard",
    ],
  },
  team: {
    title: "Team",
    description: "Beheer gebruikers, rollen en toegang binnen je organisatie.",
    icon: <Users size={20} />,
    features: [
      "Teamleden uitnodigen",
      "Rollen en rechten",
      "Activiteit per gebruiker",
    ],
  },
  audit: {
    title: "Audit Log",
    description: "Bekijk wie wat wanneer heeft gewijzigd in je workspace.",
    icon: <History size={20} />,
    features: [
      "Wijzigingshistoriek",
      "Filter op gebruiker en module",
      "Export voor compliance",
    ],
  },
  boekhouding: {
    title: "Boekhouding",
    description: "Koppel je boekhoudpakket en synchroniseer facturen en betalingen.",
    icon: <Wallet size={20} />,
    features: [
      "Exact, Yuki, Octopus en meer",
      "Automatische export van facturen",
      "BTW- en Peppol-afstemming",
    ],
  },
};

export function createDashboardModulePage(slug: keyof typeof MODULES) {
  const mod = MODULES[slug];
  return function DashboardModulePage() {
    return (
      <PlaceholderPage
        title={mod.title}
        description={mod.description}
        icon={mod.icon}
        features={mod.features}
      />
    );
  };
}
