export type CompanyPlan = "Starter" | "Business" | "Enterprise";

export type CompanyStatus = "active" | "trial" | "suspended";

export type CompanyLogoTone =
  | "sky"
  | "emerald"
  | "violet"
  | "amber"
  | "rose"
  | "cyan";

export type ManagedCompany = {
  id: string;
  name: string;
  domain: string;
  owner: string;
  ownerEmail: string;
  plan: CompanyPlan;
  activeUsers: number;
  aiTokensUsed: number;
  aiCost: number;
  monthlyRevenue: number;
  storageUsedGb: number;
  lastLogin: string;
  status: CompanyStatus;
  createdAt: string;
  logoInitials: string;
  logoTone: CompanyLogoTone;
};

export type CompaniesStat = {
  id: "total" | "active" | "trial" | "suspended";
  label: string;
  value: string;
  detail: string;
};

export const companyPlanOptions: CompanyPlan[] = [
  "Starter",
  "Business",
  "Enterprise",
];

export const companyStatusOptions: CompanyStatus[] = [
  "active",
  "trial",
  "suspended",
];

export const planLabels: Record<CompanyPlan, string> = {
  Starter: "Starter",
  Business: "Business",
  Enterprise: "Enterprise",
};

export const statusLabels: Record<CompanyStatus, string> = {
  active: "Active",
  trial: "Trial",
  suspended: "Suspended",
};

const companies: ManagedCompany[] = [
  {
    id: "archonpro-bv",
    name: "ArchonPro BV",
    domain: "archonpro.be",
    owner: "Milan Verstraeten",
    ownerEmail: "milan@archonpro.be",
    plan: "Business",
    activeUsers: 52,
    aiTokensUsed: 1238000,
    aiCost: 184.2,
    monthlyRevenue: 624,
    storageUsedGb: 842,
    lastLogin: "2026-07-10T08:42:00Z",
    status: "active",
    createdAt: "2025-11-14T09:20:00Z",
    logoInitials: "AP",
    logoTone: "sky",
  },
  {
    id: "bouwbedrijf-de-vlaming",
    name: "Bouwbedrijf De Vlaming",
    domain: "devlamingbouw.be",
    owner: "Koen De Vlaming",
    ownerEmail: "koen@devlamingbouw.be",
    plan: "Enterprise",
    activeUsers: 84,
    aiTokensUsed: 2149000,
    aiCost: 326.8,
    monthlyRevenue: 1290,
    storageUsedGb: 1280,
    lastLogin: "2026-07-10T07:58:00Z",
    status: "active",
    createdAt: "2025-08-22T10:40:00Z",
    logoInitials: "DV",
    logoTone: "emerald",
  },
  {
    id: "renovatie-peeters",
    name: "Renovatie Peeters NV",
    domain: "renovatiepeeters.be",
    owner: "Lotte Peeters",
    ownerEmail: "lotte@renovatiepeeters.be",
    plan: "Business",
    activeUsers: 31,
    aiTokensUsed: 872400,
    aiCost: 119.35,
    monthlyRevenue: 624,
    storageUsedGb: 416,
    lastLogin: "2026-07-10T07:15:00Z",
    status: "active",
    createdAt: "2026-01-07T13:05:00Z",
    logoInitials: "RP",
    logoTone: "violet",
  },
  {
    id: "construct-plus",
    name: "Construct Plus",
    domain: "constructplus.be",
    owner: "Nadia El Amrani",
    ownerEmail: "nadia@constructplus.be",
    plan: "Enterprise",
    activeUsers: 67,
    aiTokensUsed: 1680200,
    aiCost: 241.9,
    monthlyRevenue: 1290,
    storageUsedGb: 934,
    lastLogin: "2026-07-09T16:30:00Z",
    status: "active",
    createdAt: "2025-12-03T08:30:00Z",
    logoInitials: "CP",
    logoTone: "cyan",
  },
  {
    id: "dakwerken-janssens",
    name: "Dakwerken Janssens",
    domain: "dakwerkenjanssens.be",
    owner: "Bram Janssens",
    ownerEmail: "bram@dakwerkenjanssens.be",
    plan: "Starter",
    activeUsers: 6,
    aiTokensUsed: 142900,
    aiCost: 18.65,
    monthlyRevenue: 149,
    storageUsedGb: 78,
    lastLogin: "2026-07-09T11:08:00Z",
    status: "trial",
    createdAt: "2026-06-27T12:15:00Z",
    logoInitials: "DJ",
    logoTone: "amber",
  },
  {
    id: "geveltechniek-antwerp",
    name: "Geveltechniek Antwerp",
    domain: "geveltechniekantwerp.be",
    owner: "Sarah Van den Broeck",
    ownerEmail: "sarah@geveltechniekantwerp.be",
    plan: "Enterprise",
    activeUsers: 91,
    aiTokensUsed: 2385400,
    aiCost: 351.55,
    monthlyRevenue: 1290,
    storageUsedGb: 1540,
    lastLogin: "2026-07-10T09:01:00Z",
    status: "active",
    createdAt: "2025-09-18T14:45:00Z",
    logoInitials: "GA",
    logoTone: "rose",
  },
  {
    id: "schrijnwerkerij-mertens",
    name: "Schrijnwerkerij Mertens",
    domain: "mertensatelier.be",
    owner: "Tom Mertens",
    ownerEmail: "tom@mertensatelier.be",
    plan: "Business",
    activeUsers: 18,
    aiTokensUsed: 506700,
    aiCost: 71.1,
    monthlyRevenue: 624,
    storageUsedGb: 233,
    lastLogin: "2026-07-08T14:22:00Z",
    status: "suspended",
    createdAt: "2026-02-11T16:10:00Z",
    logoInitials: "SM",
    logoTone: "emerald",
  },
  {
    id: "woningbouw-groep-limburg",
    name: "Woningbouw Groep Limburg",
    domain: "woningbouwlimburg.be",
    owner: "Jeroen Claes",
    ownerEmail: "jeroen@woningbouwlimburg.be",
    plan: "Enterprise",
    activeUsers: 108,
    aiTokensUsed: 2942000,
    aiCost: 429.7,
    monthlyRevenue: 1290,
    storageUsedGb: 2110,
    lastLogin: "2026-07-10T06:55:00Z",
    status: "active",
    createdAt: "2025-07-04T09:00:00Z",
    logoInitials: "WL",
    logoTone: "sky",
  },
  {
    id: "elektro-install-brugge",
    name: "Elektro Install Brugge",
    domain: "elektrobrugge.be",
    owner: "Pieter Moens",
    ownerEmail: "pieter@elektrobrugge.be",
    plan: "Starter",
    activeUsers: 4,
    aiTokensUsed: 86400,
    aiCost: 11.8,
    monthlyRevenue: 149,
    storageUsedGb: 44,
    lastLogin: "2026-07-07T09:40:00Z",
    status: "suspended",
    createdAt: "2026-05-19T10:25:00Z",
    logoInitials: "EB",
    logoTone: "cyan",
  },
  {
    id: "totaalprojecten-vlaanderen",
    name: "Totaalprojecten Vlaanderen",
    domain: "totaalprojecten.vlaanderen",
    owner: "Sarah De Cock",
    ownerEmail: "sarah@totaalprojecten.vlaanderen",
    plan: "Business",
    activeUsers: 26,
    aiTokensUsed: 691300,
    aiCost: 94.4,
    monthlyRevenue: 624,
    storageUsedGb: 361,
    lastLogin: "2026-07-10T09:24:00Z",
    status: "trial",
    createdAt: "2026-07-02T09:30:00Z",
    logoInitials: "TV",
    logoTone: "violet",
  },
  {
    id: "isolatie-pro-gent",
    name: "Isolatie Pro Gent",
    domain: "isolatieprogent.be",
    owner: "Tom Verbeeck",
    ownerEmail: "tom@isolatieprogent.be",
    plan: "Starter",
    activeUsers: 9,
    aiTokensUsed: 196200,
    aiCost: 24.9,
    monthlyRevenue: 149,
    storageUsedGb: 96,
    lastLogin: "2026-07-10T07:50:00Z",
    status: "trial",
    createdAt: "2026-07-01T15:05:00Z",
    logoInitials: "IG",
    logoTone: "amber",
  },
  {
    id: "betonbouw-hasselt",
    name: "Betonbouw Hasselt",
    domain: "betonbouwhasselt.be",
    owner: "Aline Swinnen",
    ownerEmail: "aline@betonbouwhasselt.be",
    plan: "Enterprise",
    activeUsers: 73,
    aiTokensUsed: 1894200,
    aiCost: 278.15,
    monthlyRevenue: 1290,
    storageUsedGb: 1174,
    lastLogin: "2026-07-09T21:15:00Z",
    status: "active",
    createdAt: "2025-10-29T11:35:00Z",
    logoInitials: "BH",
    logoTone: "rose",
  },
  {
    id: "interieurwerken-maes",
    name: "Interieurwerken Maes",
    domain: "interieurmaes.be",
    owner: "Katrien Maes",
    ownerEmail: "katrien@interieurmaes.be",
    plan: "Business",
    activeUsers: 22,
    aiTokensUsed: 544800,
    aiCost: 76.25,
    monthlyRevenue: 624,
    storageUsedGb: 310,
    lastLogin: "2026-07-08T18:12:00Z",
    status: "active",
    createdAt: "2026-03-15T08:50:00Z",
    logoInitials: "IM",
    logoTone: "emerald",
  },
  {
    id: "hvac-solutions-north",
    name: "HVAC Solutions North",
    domain: "hvacnorth.be",
    owner: "Matthias Willems",
    ownerEmail: "matthias@hvacnorth.be",
    plan: "Starter",
    activeUsers: 7,
    aiTokensUsed: 118300,
    aiCost: 15.7,
    monthlyRevenue: 149,
    storageUsedGb: 68,
    lastLogin: "2026-07-06T12:05:00Z",
    status: "suspended",
    createdAt: "2026-04-18T10:00:00Z",
    logoInitials: "HN",
    logoTone: "sky",
  },
  {
    id: "terra-projects",
    name: "Terra Projects",
    domain: "terraprojects.be",
    owner: "Elise Martens",
    ownerEmail: "elise@terraprojects.be",
    plan: "Enterprise",
    activeUsers: 61,
    aiTokensUsed: 1516400,
    aiCost: 226.45,
    monthlyRevenue: 1290,
    storageUsedGb: 1028,
    lastLogin: "2026-07-10T05:33:00Z",
    status: "active",
    createdAt: "2025-11-30T14:15:00Z",
    logoInitials: "TP",
    logoTone: "cyan",
  },
  {
    id: "plafondwerken-van-looy",
    name: "Plafondwerken Van Looy",
    domain: "vanlooyplafonds.be",
    owner: "Rik Van Looy",
    ownerEmail: "rik@vanlooyplafonds.be",
    plan: "Business",
    activeUsers: 15,
    aiTokensUsed: 368600,
    aiCost: 49.85,
    monthlyRevenue: 624,
    storageUsedGb: 181,
    lastLogin: "2026-07-09T10:18:00Z",
    status: "trial",
    createdAt: "2026-06-12T09:45:00Z",
    logoInitials: "VL",
    logoTone: "violet",
  },
  {
    id: "infra-west",
    name: "Infra West",
    domain: "infrawest.be",
    owner: "Hanne Goossens",
    ownerEmail: "hanne@infrawest.be",
    plan: "Enterprise",
    activeUsers: 97,
    aiTokensUsed: 2477800,
    aiCost: 388.05,
    monthlyRevenue: 1290,
    storageUsedGb: 1762,
    lastLogin: "2026-07-10T04:42:00Z",
    status: "active",
    createdAt: "2025-06-09T12:40:00Z",
    logoInitials: "IW",
    logoTone: "amber",
  },
  {
    id: "greenbuild-kempen",
    name: "GreenBuild Kempen",
    domain: "greenbuildkempen.be",
    owner: "Noor Jacobs",
    ownerEmail: "noor@greenbuildkempen.be",
    plan: "Starter",
    activeUsers: 5,
    aiTokensUsed: 93400,
    aiCost: 12.45,
    monthlyRevenue: 149,
    storageUsedGb: 52,
    lastLogin: "2026-07-05T15:20:00Z",
    status: "trial",
    createdAt: "2026-07-04T08:10:00Z",
    logoInitials: "GK",
    logoTone: "emerald",
  },
];

export function getCompaniesManagementData() {
  return companies;
}

export function getCompaniesStats(companyList: ManagedCompany[]): CompaniesStat[] {
  const active = companyList.filter((company) => company.status === "active");
  const trial = companyList.filter((company) => company.status === "trial");
  const suspended = companyList.filter(
    (company) => company.status === "suspended",
  );

  const totalMrr = active.reduce(
    (sum, company) => sum + company.monthlyRevenue,
    0,
  );
  const trialPotential = trial.reduce(
    (sum, company) => sum + company.monthlyRevenue,
    0,
  );

  return [
    {
      id: "total",
      label: "Total Companies",
      value: companyList.length.toLocaleString("nl-BE"),
      detail: `${formatCurrency(totalMrr)} active MRR under management`,
    },
    {
      id: "active",
      label: "Active Companies",
      value: active.length.toLocaleString("nl-BE"),
      detail: `${formatTokens(
        active.reduce((sum, company) => sum + company.aiTokensUsed, 0),
      )} tokens this month`,
    },
    {
      id: "trial",
      label: "Trial Companies",
      value: trial.length.toLocaleString("nl-BE"),
      detail: `${formatCurrency(trialPotential)} conversion pipeline`,
    },
    {
      id: "suspended",
      label: "Suspended Companies",
      value: suspended.length.toLocaleString("nl-BE"),
      detail: `${suspended.reduce(
        (sum, company) => sum + company.activeUsers,
        0,
      )} users currently locked`,
    },
  ];
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("nl-BE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

export function formatTokens(tokens: number) {
  return new Intl.NumberFormat("nl-BE", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(tokens);
}

export function formatStorage(gigabytes: number) {
  if (gigabytes >= 1024) {
    return `${(gigabytes / 1024).toLocaleString("nl-BE", {
      maximumFractionDigits: 1,
    })} TB`;
  }
  return `${gigabytes.toLocaleString("nl-BE")} GB`;
}

export function formatDate(iso: string) {
  return new Intl.DateTimeFormat("nl-BE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

export function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("nl-BE", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}
