import {
  BarChart3,
  Bot,
  BrainCircuit,
  Clock,
  Contact,
  Crosshair,
  FileText,
  FolderKanban,
  Gauge,
  Handshake,
  HardHat,
  LineChart,
  List,
  LogOut,
  MessageCircle,
  Plug,
  Receipt,
  Rocket,
  ScrollText,
  Search,
  Settings,
  Users,
  Wallet,
  Zap,
  type LucideIcon,
} from "lucide-react";

export type SidebarItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
  badgeTone?: "info" | "warning";
  available?: boolean;
  children?: SidebarItem[];
};

export type SidebarGroup = {
  title: string;
  items: SidebarItem[];
  collapsible?: boolean;
};

export const SIDEBAR_GROUPS: SidebarGroup[] = [
  {
    title: "Overzicht",
    items: [
      { label: "Overzicht", href: "/dashboard/overzicht", icon: Gauge },
      { label: "Command Center", href: "/dashboard/command-center", icon: Crosshair },
    ],
  },
  {
    title: "Operatie",
    items: [
      { label: "Contacten", href: "/dashboard/contacten", icon: Users },
      {
        label: "Offertes",
        href: "/dashboard/offertes",
        icon: FileText,
        children: [
          {
            label: "Projecten",
            href: "/dashboard/offertes/projecten",
            icon: FolderKanban,
          },
        ],
      },
      {
        label: "Facturen",
        href: "/dashboard/facturen",
        icon: Receipt,
        badge: 3,
        badgeTone: "warning",
      },
      {
        label: "Leads / CRM",
        href: "/dashboard/leads",
        icon: Contact,
        badge: 5,
        badgeTone: "info",
      },
      { label: "Automatisaties", href: "/dashboard/automatisaties", icon: Zap },
      {
        label: "Bouwnetwerk",
        href: "/dashboard/werkposts",
        icon: HardHat,
        children: [
          {
            label: "Samenwerkingen",
            href: "/dashboard/werkposts/samenwerkingen",
            icon: Handshake,
          },
        ],
      },
    ],
  },
  {
    title: "Administratie",
    items: [
      {
        label: "E-Facturen",
        href: "/dashboard/e-facturen",
        icon: ScrollText,
      },
      {
        label: "Boekhouding",
        href: "/dashboard/boekhouding",
        icon: Wallet,
      },
      {
        label: "Activiteiten",
        href: "/dashboard/activiteit",
        icon: List,
      },
    ],
  },
  {
    title: "AI",
    items: [
      { label: "AI-agents", href: "/dashboard/nova-agents", icon: Bot },
      { label: "Comms", href: "/dashboard/comms", icon: MessageCircle },
      { label: "Geheugen", href: "/dashboard/geheugen", icon: BrainCircuit },
    ],
  },
  {
    title: "Observeer",
    collapsible: true,
    items: [
      { label: "Onderzoek", href: "/dashboard/onderzoek", icon: Search, available: false },
      { label: "KPI's", href: "/dashboard/kpi", icon: BarChart3, available: false },
      { label: "Analytics", href: "/dashboard/analytics", icon: LineChart, available: false },
    ],
  },
  {
    title: "Systeem",
    collapsible: true,
    items: [
      { label: "Integraties", href: "/dashboard/integraties", icon: Plug },
      { label: "Cron", href: "/dashboard/cron", icon: Clock, available: false },
      { label: "Deploy", href: "/dashboard/deploy", icon: Rocket, available: false },
    ],
  },
];

export const SIDEBAR_SETTINGS = {
  label: "Instellingen",
  href: "/dashboard/instellingen",
  icon: Settings,
} as const;

export const SIDEBAR_LOGOUT = {
  label: "Uitloggen",
  icon: LogOut,
} as const;

/** Pad matcht actief item (inclusief subroutes). */
export function sidebarItemIsActive(pathname: string, href: string): boolean {
  const current = pathname.replace(/\/$/, "");
  const target = href.replace(/\/$/, "");

  if (target === "/dashboard") {
    return current === "/dashboard" || current === "/dashboard/command-center";
  }

  if (target === "/dashboard/overzicht") {
    return current === "/dashboard/overzicht";
  }

  if (target === "/dashboard/command-center") {
    return current === "/dashboard/command-center" || current === "/dashboard";
  }

  if (target === "/dashboard/offertes") {
    return (
      current.startsWith("/dashboard/offertes") &&
      !current.startsWith("/dashboard/offertes/projecten")
    );
  }

  return current === target || current.startsWith(`${target}/`);
}

export function groupHasActivePath(group: SidebarGroup, pathname: string): boolean {
  return group.items.some(
    (item) =>
      sidebarItemIsActive(pathname, item.href) ||
      item.children?.some((child) => sidebarItemIsActive(pathname, child.href)),
  );
}
