import {
  Gauge,
  FileText,
  Receipt,
  Contact,
  Users,
  Zap,
  HardHat,
  Settings,
  Plug,
  type LucideIcon,
} from "lucide-react";

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
    href: "/dashboard",
    icon: Gauge,
    match: (pathname) =>
      pathname === "/dashboard" || pathname === "/dashboard/",
  },
  {
    id: "offertes",
    label: "Offertes",
    href: "/dashboard/offertes",
    icon: FileText,
    match: (pathname) => pathname.startsWith("/dashboard/offertes"),
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

export type MoreLink = {
  label: string;
  href: string;
  icon: LucideIcon;
  available?: boolean;
};

export const MOBILE_MORE_LINKS: MoreLink[] = [
  { label: "Bouwnetwerk", href: "/dashboard/werkposts", icon: HardHat },
  { label: "Integraties", href: "/dashboard/integraties", icon: Plug, available: false },
  { label: "Instellingen", href: "/dashboard/instellingen", icon: Settings },
];

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
  const swipeTab = MOBILE_SWIPE_TABS.find((tab) => tab.match(pathname));
  if (swipeTab) return swipeTab.id;

  const onMorePage = MOBILE_MORE_LINKS.some(
    (link) =>
      pathname === link.href || pathname.startsWith(`${link.href}/`),
  );
  if (onMorePage) return "more";

  return "more";
}
