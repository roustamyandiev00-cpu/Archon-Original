import {
  BarChart3,
  Bot,
  BrainCircuit,
  Contact,
  Crosshair,
  FileText,
  FolderKanban,
  Handshake,
  HardHat,
  LineChart,
  List,
  LogOut,
  MessageCircle,
  Receipt,
  ScrollText,
  Search,
  Settings,
  Shield,
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
      { label: "Command Center", href: "/dashboard/command-center", icon: Crosshair },
    ],
  },
  {
    title: "Operatie",
    items: [
      { label: "Contacten", href: "/dashboard/contacten", icon: Users },
      { label: "Offertes", href: "/dashboard/offertes", icon: FileText },
      {
        label: "Projecten",
        href: "/dashboard/offertes/projecten",
        icon: FolderKanban,
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
      { label: "Bouwnetwerk", href: "/dashboard/werkposts", icon: HardHat },
      {
        label: "Samenwerkingen",
        href: "/dashboard/werkposts/samenwerkingen",
        icon: Handshake,
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
      { label: "AI-agents", href: "/dashboard/command-center?view=crew", icon: Bot },
      { label: "Comms", href: "/dashboard/comms", icon: MessageCircle },
      { label: "Geheugen", href: "/dashboard/geheugen", icon: BrainCircuit },
    ],
  },
];

/** Observeer-links in de topbar (niet in sidebar). */
export const TOPBAR_OBSERVEER_ITEMS: SidebarItem[] = [
  { label: "Onderzoek", href: "/dashboard/onderzoek", icon: Search, available: false },
  { label: "KPI's", href: "/dashboard/kpi", icon: BarChart3, available: false },
  { label: "Analytics", href: "/dashboard/analytics", icon: LineChart, available: false },
];

export const SIDEBAR_CEO_CONSOLE = {
  label: "CEO Console",
  href: "/dashboard/admin",
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
    return current.startsWith("/dashboard/facturen");
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
