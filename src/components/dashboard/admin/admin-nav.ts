import {
  LayoutDashboard,
  Building2,
  Users,
  UserCheck,
  Flag,
  Scale,
  Bot,
  Coins,
  CheckSquare,
  GitBranch,
  Radar,
  Headphones,
  MessageSquare,
  BookOpen,
  Settings,
  ClipboardList,
  Layers,
  Database,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const adminNavSections: NavSection[] = [
  {
    title: "Platform",
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
      {
        href: "/admin/crm-platform",
        label: "CRM",
        icon: UserCheck,
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
    ],
  },
  {
    title: "AI & Automatisering",
    items: [
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
        href: "/admin/goedkeuringen",
        label: "Goedkeuringen",
        icon: CheckSquare,
      },
      {
        href: "/admin/workflows",
        label: "Workflows",
        icon: GitBranch,
      },
      {
        href: "/admin/proactive",
        label: "Proactief",
        icon: Radar,
      },
    ],
  },
  {
    title: "Support",
    items: [
      {
        href: "/admin/support-tickets",
        label: "Supporttickets",
        icon: Headphones,
      },
      {
        href: "/admin/feedback",
        label: "Feedback",
        icon: MessageSquare,
      },
      {
        href: "/admin/kennisbank",
        label: "Kennisbank",
        icon: BookOpen,
      },
    ],
  },
  {
    title: "Systeem",
    items: [
      {
        href: "/admin/instellingen",
        label: "Instellingen",
        icon: Settings,
      },
      {
        href: "/admin/auditlogs",
        label: "Auditlogs",
        icon: ClipboardList,
      },
      {
        href: "/admin/integraties",
        label: "Integraties",
        icon: Layers,
      },
      {
        href: "/admin/backups",
        label: "Back-ups",
        icon: Database,
      },
    ],
  },
];
