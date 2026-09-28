import {
  BarChart3,
  Bot,
  BrainCircuit,
  CalendarDays,
  CheckSquare,
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
  Tags,
  Users,
  Wallet,
  Zap,
  type LucideIcon,
} from "lucide-react";

import {
  BOUWNETWERK_REQUIRED_USERS,
  bouwnetwerkSidebarHint,
  isBouwnetwerkUnlocked,
} from "@/lib/bouwnetwerk-gate";

export type SidebarItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
  badgeTone?: "info" | "warning";
  /** Optioneel label bv. "Beta" of "WIP" naast de link. */
  tag?: string;
  /** Kleur van label/icoon — bv. waarschuwing voor modules die nog niet live zijn. */
  labelTone?: "default" | "warning" | "danger";
  available?: boolean;
  /** Tooltip wanneer item disabled of in waarschuwingsmodus is. */
  hint?: string;
  children?: SidebarItem[];
};

export function bouwnetwerkSidebarMeta(
  registeredUsers: number,
): Pick<SidebarItem, "labelTone" | "tag" | "available" | "hint"> {
  if (isBouwnetwerkUnlocked(registeredUsers)) {
    return { labelTone: "default", available: true };
  }
  return {
    labelTone: "warning",
    tag: "WIP",
    available: false,
    hint: bouwnetwerkSidebarHint(BOUWNETWERK_REQUIRED_USERS),
  };
}

export type SidebarGroup = {
  title: string;
  items: SidebarItem[];
  collapsible?: boolean;
};

const SIDEBAR_GROUPS_BASE: SidebarGroup[] = [
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
      {
        label: "Prijslijst",
        href: "/dashboard/prijslijst",
        icon: Tags,
      },
      { label: "Offertes", href: "/dashboard/offertes", icon: FileText },
      {
        label: "Projecten",
        href: "/dashboard/offertes/projecten",
        icon: FolderKanban,
      },
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
        label: "Facturen",
        href: "/dashboard/facturen",
        icon: Receipt,
      },
      {
        label: "Boekhouding",
        href: "/dashboard/boekhouding",
        icon: Wallet,
      },
      {
        label: "Leads / CRM",
        href: "/dashboard/leads",
        icon: Contact,
      },
      {
        label: "Automatisaties",
        href: "/dashboard/automatisaties",
        icon: Zap,
        available: false,
        tag: "WIP",
        labelTone: "warning",
        hint: "Binnenkort beschikbaar",
      },
    ],
  },
  {
    title: "Later",
    collapsible: true,
    items: [
      {
        label: "Bouwnetwerk",
        href: "/dashboard/werkposts",
        icon: HardHat,
        available: false,
        tag: "WIP",
        labelTone: "warning",
        hint: "Binnenkort beschikbaar",
      },
      {
        label: "Samenwerkingen",
        href: "/dashboard/werkposts/samenwerkingen",
        icon: Handshake,
        available: false,
        tag: "WIP",
        labelTone: "warning",
        hint: "Binnenkort beschikbaar",
      },
      {
        label: "Telegram",
        href: "/dashboard/telegram",
        icon: MessageCircle,
        available: false,
        tag: "WIP",
        labelTone: "warning",
        hint: "Binnenkort beschikbaar",
      },
      {
        label: "Geschillen",
        href: "/dashboard/geschillen",
        icon: Shield,
        available: false,
        tag: "WIP",
        labelTone: "warning",
        hint: "Binnenkort beschikbaar",
      },
    ],
  },
  {
    title: "Beheer",
    collapsible: true,
    items: [
      {
        label: "E-Facturen",
        href: "/dashboard/e-facturen",
        icon: ScrollText,
        tag: "Beta",
      },
      {
        label: "Activiteiten",
        href: "/dashboard/activiteit",
        icon: List,
      },
      {
        label: "Team",
        href: "/dashboard/team",
        icon: Users,
      },
      {
        label: "Audit",
        href: "/dashboard/audit",
        icon: Shield,
      },
    ],
  },
  {
    title: "AI",
    items: [
      { label: "AI-agents", href: "/dashboard/command-center?view=crew", icon: Bot },
      {
        label: "Comms",
        href: "/dashboard/comms",
        icon: MessageCircle,
        available: false,
        tag: "WIP",
        labelTone: "warning",
        hint: "Binnenkort beschikbaar",
      },
      { label: "Geheugen", href: "/dashboard/geheugen", icon: BrainCircuit },
    ],
  },
];

/** Sidebar-groepen met Bouwnetwerk/Samenwerkingen WIP-status o.b.v. echte teller. */
export function getSidebarGroups(registeredUsers: number): SidebarGroup[] {
  const meta = bouwnetwerkSidebarMeta(registeredUsers);
  return SIDEBAR_GROUPS_BASE.map((group) => ({
    ...group,
    items: group.items.map((item) =>
      item.href === "/dashboard/werkposts" ||
      item.href === "/dashboard/werkposts/samenwerkingen"
        ? { ...item, ...meta }
        : item,
    ),
  }));
}

/** Observeer-links in de topbar (niet in sidebar). */
export const TOPBAR_OBSERVEER_ITEMS: SidebarItem[] = [
  { label: "Onderzoek", href: "/dashboard/onderzoek", icon: Search, available: true },
  { label: "KPI's", href: "/dashboard/kpi", icon: BarChart3, available: true },
  // Analytics redirect naar KPI — beide links blijven voor backwards compatibility
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

/** Vindt de sectie + paginalabel voor het huidige pad (voor de topbar-titel). */
export function findCurrentPageLabel(
  pathname: string,
  searchParams?: Pick<URLSearchParams, "get"> | null,
): { group: string; label: string } | null {
  for (const group of SIDEBAR_GROUPS_BASE) {
    for (const item of group.items) {
      if (sidebarItemIsActive(pathname, item.href, searchParams)) {
        return { group: group.title, label: item.label };
      }
      if (item.children) {
        for (const child of item.children) {
          if (sidebarItemIsActive(pathname, child.href, searchParams)) {
            return { group: group.title, label: child.label };
          }
        }
      }
    }
  }
  return null;
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
