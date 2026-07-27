import {
  Bot,
  Building2,
  Coins,
  Flag,
  LayoutDashboard,
  Radar,
  Scale,
  ScrollText,
  Users,
} from "lucide-react";

export const adminNavGroups = [
  {
    label: "Platform",
    items: [
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
        label: "Gebruikers",
        icon: Users,
      },
    ],
  },
  {
    label: "AI",
    items: [
      {
        href: "/admin/ai-agents",
        label: "AI Control Center",
        icon: Bot,
      },
      {
        href: "/admin/ai-tokens",
        label: "AI-tokens",
        icon: Coins,
      },
      {
        href: "/admin/proactive",
        label: "Agentacties",
        icon: Radar,
      },
      {
        href: "/admin/ai-logs",
        label: "AI-logs",
        icon: ScrollText,
      },
    ],
  },
  {
    label: "Toezicht",
    items: [
      {
        href: "/admin/geschillen",
        label: "Geschillen",
        icon: Scale,
      },
    ],
  },
  {
    label: "Analytics",
    items: [
      {
        href: "/admin/rapportages",
        label: "Rapportages",
        icon: Flag,
      },
    ],
  },
] as const;
