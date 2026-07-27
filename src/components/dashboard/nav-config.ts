import {
  Gauge,
  FileText,
  FolderKanban,
  Receipt,
  Contact,
  Users,
  Zap,
  HardHat,
  Handshake,
  Settings,
  Bot,
  CalendarDays,
  CheckSquare,
  Tags,
  List,
  ScrollText,
  Wallet,
  Shield,
  type LucideIcon,
} from "lucide-react";

import {
  BOUWNETWERK_REQUIRED_USERS,
  bouwnetwerkSidebarHint,
  isBouwnetwerkUnlocked,
} from "@/lib/bouwnetwerk-gate";

export type MobileTab = {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  match: (pathname: string) => boolean;
};

/** Hoofdtabs onderaan — swipebaar tussen deze routes. */
export const MOBILE_SWIPE_TABS: MobileTab[] = [
  {
    id: "home",
    label: "Home",
    href: "/dashboard/command-center",
    icon: Gauge,
    match: (pathname) =>
      pathname === "/dashboard" ||
      pathname === "/dashboard/" ||
      pathname.startsWith("/dashboard/command-center") ||
      pathname.startsWith("/dashboard/overzicht"),
  },
  {
    id: "offertes",
    label: "Offertes",
    href: "/dashboard/offertes",
    icon: FileText,
    match: (pathname) =>
      pathname.startsWith("/dashboard/offertes") &&
      !pathname.startsWith("/dashboard/offertes/projecten"),
  },
  {
    id: "facturen",
    label: "Facturen",
    href: "/dashboard/facturen",
    icon: Receipt,
    match: (pathname) => pathname.startsWith("/dashboard/facturen"),
  },
  {
    id: "leads",
    label: "Leads",
    href: "/dashboard/leads",
    icon: Contact,
    match: (pathname) => pathname.startsWith("/dashboard/leads"),
  },
  {
    id: "contacten",
    label: "Contacten",
    href: "/dashboard/contacten",
    icon: Users,
    match: (pathname) => pathname.startsWith("/dashboard/contacten"),
  },
  {
    id: "automatisaties",
    label: "Auto",
    href: "/dashboard/automatisaties",
    icon: Zap,
    match: (pathname) => pathname.startsWith("/dashboard/automatisaties"),
  },
];

const MOBILE_PRIMARY_TAB_IDS = new Set(["home", "contacten", "offertes", "facturen"]);

/** Vaste hoofdnavigatie: maximaal vier routes, aangevuld met AI-chat en Meer. */
export const MOBILE_PRIMARY_TABS = MOBILE_SWIPE_TABS.filter((tab) =>
  MOBILE_PRIMARY_TAB_IDS.has(tab.id),
);

export type MoreLink = {
  label: string;
  href: string;
  icon: LucideIcon;
  available?: boolean;
  tag?: string;
  /** Oranje/rood label voor modules die nog niet live zijn. */
  labelTone?: "default" | "warning" | "danger";
  hint?: string;
};

function bouwnetwerkMoreMeta(
  registeredUsers: number,
): Pick<MoreLink, "labelTone" | "tag" | "available" | "hint"> {
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

export function getMobileMoreLinks(registeredUsers: number): MoreLink[] {
  const meta = bouwnetwerkMoreMeta(registeredUsers);
  return [
    { label: "Projecten", href: "/dashboard/offertes/projecten", icon: FolderKanban },
    { label: "Leads / CRM", href: "/dashboard/leads", icon: Contact },
    { label: "Agenda", href: "/dashboard/agenda", icon: CalendarDays },
    { label: "Taken", href: "/dashboard/taken", icon: CheckSquare },
    { label: "Prijslijst", href: "/dashboard/prijslijst", icon: Tags },
    { label: "Boekhouding", href: "/dashboard/boekhouding", icon: Wallet },
    {
      label: "Automatisaties",
      href: "/dashboard/automatisaties",
      icon: Zap,
    },
    { label: "AI Assistent", href: "/dashboard/command-center?view=crew", icon: Bot },
    {
      label: "BouwNetwerk",
      href: "/dashboard/werkposts",
      icon: HardHat,
      ...meta,
    },
    {
      label: "Samenwerkingen",
      href: "/dashboard/werkposts/samenwerkingen",
      icon: Handshake,
      ...meta,
    },
    {
      label: "E-Facturen",
      href: "/dashboard/e-facturen",
      icon: ScrollText,
      tag: "Beta",
    },
    { label: "Activiteiten", href: "/dashboard/activiteit", icon: List },
    { label: "Team", href: "/dashboard/team", icon: Users },
    { label: "Audit", href: "/dashboard/audit", icon: Shield },
    { label: "Instellingen", href: "/dashboard/instellingen", icon: Settings },
  ];
}

/** @deprecated gebruik getMobileMoreLinks(registeredUsers) */
export const MOBILE_MORE_LINKS: MoreLink[] = getMobileMoreLinks(0);

export function getMobileSwipeTabIndex(pathname: string): number {
  return MOBILE_SWIPE_TABS.findIndex((tab) => tab.match(pathname));
}

/** Lijst-route van de actieve tab, als je op een detailpagina zit. */
export function getMobileDetailParent(pathname: string): string | null {
  for (const tab of MOBILE_SWIPE_TABS) {
    if (!tab.match(pathname)) continue;

    const listPath = tab.href.replace(/\/$/, "");
    const current = pathname.replace(/\/$/, "");
    if (current === listPath) return null;

    return tab.href;
  }
  return null;
}

export function getActiveMobileTabId(pathname: string): string {
  const primaryTab = MOBILE_PRIMARY_TABS.find((tab) => tab.match(pathname));
  if (primaryTab) return primaryTab.id;

  return "more";
}
