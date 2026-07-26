import {
  BarChart3,
  Bot,
  BrainCircuit,
  CalendarDays,
  Contact,
  Crosshair,
  FileText,
  FolderKanban,
  Handshake,
  HardHat,
  LineChart,
  List,
  LogOut,
  Receipt,
  ScrollText,
  Search,
  Settings,
  Shield,
  Tags,
  Users,
  Wallet,
  CheckSquare,
  type LucideIcon,
} from "lucide-react";

export type SidebarItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
  badgeTone?: "info" | "warning";
  /** Optioneel label bv. "Beta" naast de link. */
  tag?: string;
  /** Opvallende kleur, bv. voor functies die pas bij 100 gebruikers live gaan. */
  accent?: "amber";
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
      { label: "Command Center", href: "/dashboard/command-center", icon: Crosshair },
    ],
  },
  {
    title: "Operatie",
    items: [
      { label: "Contacten", href: "/dashboard/contacten", icon: Users },
      { label: "Offertes", href: "/dashboard/offertes", icon: FileText,
        children: [
          {
            label: "Prijslijst",
            href: "/dashboard/prijslijst",
            icon: Tags,
          },
        ],
      },
      {
        label: "Projecten",
        href: "/dashboard/offertes/projecten",
        icon: FolderKanban,
      },
      {
        label: "Facturen",
        href: "/dashboard/facturen",
        icon: Receipt,
        children: [
          {
            label: "E-Facturen",
            href: "/dashboard/e-facturen",
            icon: ScrollText,
            tag: "Beta",
          },
          {
            label: "Boekhouding",
            href: "/dashboard/boekhouding",
            icon: Wallet,
          },
        ],
      },
      {
        label: "Leads / CRM",
        href: "/dashboard/leads",
        icon: Contact,
        badge: 5,
        badgeTone: "info",
      },
      {
        label: "Bouwnetwerk",
        href: "/dashboard/werkposts",
        icon: HardHat,
        accent: "amber",
      },
      {
        label: "Samenwerkingen",
        href: "/dashboard/werkposts/samenwerkingen",
        icon: Handshake,
        accent: "amber",
      },
    ],
  },
  {
    title: "Administratie",
    items: [
      {
        label: "Agenda",
        href: "/dashboard/agenda",
        icon: CalendarDays,
      },
      {
        label: "Taken",
        href: "/dashboard/taken",
        icon: CheckSquare,
      },
      {
        label: "Activiteiten",
        href: "/dashboard/activiteit",
        icon: List,
      },
      // Tijdelijk verborgen: Team, Audit, Telegram
    ],
  },
  {
    title: "AI",
    items: [
      { label: "AI-agents", href: "/dashboard/command-center?view=crew", icon: Bot },
      { label: "Geheugen", href: "/dashboard/geheugen", icon: BrainCircuit },
    ],
  },
];

/** Observeer-links in de topbar (niet in sidebar). */
export const TOPBAR_OBSERVEER_ITEMS: SidebarItem[] = [
  { label: "Onderzoek", href: "/dashboard/onderzoek", icon: Search, available: true },
  { label: "KPI's", href: "/dashboard/kpi", icon: BarChart3, available: true },
  { label: "Analytics", href: "/dashboard/analytics", icon: LineChart, available: true },
];

export const SIDEBAR_CEO_CONSOLE = {
  label: "CEO Console",
  href: "/admin",
  icon: Shield,
} as const;

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
export function sidebarItemIsActive(
  pathname: string,
  href: string,
  searchParams?: Pick<URLSearchParams, "get"> | null,
): boolean {
  const current = pathname.replace(/\/$/, "");
  const [pathPart, queryPart] = href.split("?");
  const target = pathPart.replace(/\/$/, "");
  const hrefView = queryPart
    ? new URLSearchParams(queryPart).get("view")
    : null;
  const currentView = searchParams?.get("view") ?? null;

  if (hrefView === "crew") {
    return current === "/dashboard/command-center" && currentView === "crew";
  }

  if (target === "/dashboard/overzicht") {
    return current === "/dashboard/overzicht" || current === "/dashboard";
  }

  if (target === "/dashboard/command-center") {
    return current === "/dashboard/command-center" && currentView !== "crew";
  }

  if (target === "/dashboard/offertes") {
    return (
      current.startsWith("/dashboard/offertes") &&
      !current.startsWith("/dashboard/offertes/projecten")
    );
  }

  if (target === "/dashboard/facturen") {
    return (
      current.startsWith("/dashboard/facturen") &&
      !current.startsWith("/dashboard/e-facturen") &&
      !current.startsWith("/dashboard/boekhouding")
    );
  }

  if (target === "/dashboard/e-facturen") {
    return current.startsWith("/dashboard/e-facturen");
  }

  if (target === "/dashboard/boekhouding") {
    return current.startsWith("/dashboard/boekhouding");
  }

  if (target === "/dashboard/werkposts") {
    return (
      current.startsWith("/dashboard/werkposts") &&
      !current.startsWith("/dashboard/werkposts/samenwerkingen")
    );
  }

  return current === target || current.startsWith(`${target}/`);
}

export function groupHasActivePath(
  group: SidebarGroup,
  pathname: string,
  searchParams?: Pick<URLSearchParams, "get"> | null,
): boolean {
  return group.items.some(
    (item) =>
      sidebarItemIsActive(pathname, item.href, searchParams) ||
      item.children?.some((child) =>
        sidebarItemIsActive(pathname, child.href, searchParams),
      ),
  );
}
