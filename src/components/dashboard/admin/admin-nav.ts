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
    href: "/dashboard/admin",
    label: "Overzicht",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    href: "/dashboard/admin/companies",
    label: "Bedrijven",
    icon: Building2,
  },
  {
    href: "/dashboard/admin/crm",
    label: "CRM",
    icon: Users,
  },
  {
    href: "/dashboard/admin/rapportages",
    label: "Rapportages",
    icon: Flag,
  },
  {
    href: "/dashboard/admin/geschillen",
    label: "Geschillen",
    icon: Scale,
  },
  {
    href: "/dashboard/admin/ai-agents",
    label: "AI Agents",
    icon: Bot,
  },
  {
    href: "/dashboard/admin/ai-tokens",
    label: "AI Tokens",
    icon: Coins,
  },
  {
    href: "/dashboard/admin/proactive",
    label: "Proactief",
    icon: Radar,
  },
] as const;
