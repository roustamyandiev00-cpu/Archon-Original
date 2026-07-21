import {
  Bot,
  Building2,
  Coins,
  Flag,
  LayoutDashboard,
  Radar,
  Scale,
  Users,
} from "lucide-react";

export const adminNavItems = [
  {
    href: "/admin",
    label: "Overzicht",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    href: "/admin/companies",
    label: "Bedrijven",
    icon: Building2,
  },
  {
    href: "/admin/crm",
    label: "CRM",
    icon: Users,
  },
  {
    href: "/admin/rapportages",
    label: "Rapportages",
    icon: Flag,
  },
  {
    href: "/admin/geschillen",
    label: "Geschillen",
    icon: Scale,
  },
  {
    href: "/admin/ai-agents",
    label: "AI Agents",
    icon: Bot,
  },
  {
    href: "/admin/ai-tokens",
    label: "AI Tokens",
    icon: Coins,
  },
  {
    href: "/admin/proactive",
    label: "Proactief",
    icon: Radar,
  },
] as const;
