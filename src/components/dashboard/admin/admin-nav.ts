import {
  Bot,
  Building2,
  LayoutDashboard,
  Radar,
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
    href: "/dashboard/admin/ai-agents",
    label: "AI Agents",
    icon: Bot,
  },
  {
    href: "/dashboard/admin/proactive",
    label: "Proactief",
    icon: Radar,
  },
] as const;
