"use client";

import { useState, useMemo } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type BillingCycle = "monthly" | "quarterly" | "yearly";

export interface PricingPlan {
  id: string;
  name: string;
  badge?: string;
  tagline: string;
  /** Actuele prijs per maand (per bedrijfsdossier). */
  basePrice: Record<BillingCycle, number>;
  /** Doorgestreepte listprijs (promotie) — hoger dan de actuele maandprijs. */
  listPrice: number;
  extraUserPrice: number; // extra gebruiker per maand
  includedUsers: number; // standaard inbegrepen gebruikers
  maxUsers?: number;
  features: string[];
  highlight?: boolean;
  cta: string;
  href: string;
  color: "default" | "blue" | "dark";
}

export interface Addon {
  id: string;
  name: string;
  description: string;
  price: number; // per maand
  badge?: string;
  icon: string;
  requiredPlan?: string[]; // alleen beschikbaar voor deze plans
}

export interface PriceBreakdown {
  planBase: number;
  planListBase: number;
  extraUsersTotal: number;
  addonsTotal: number;
  subtotalMonthly: number;
  listSubtotalMonthly: number;
  discountPercent: number;
  billingMultiplier: number; // hoeveelheid maanden per betaalperiode
  totalPerPeriod: number;
  savingsVsMonthly: number;
  yearlyTotal: number;
}

// ─── Configuratie ─────────────────────────────────────────────────────────────

export const BILLING_OPTIONS: { id: BillingCycle; label: string; badge?: string }[] = [
  { id: "monthly", label: "Maandelijks" },
  { id: "quarterly", label: "Per kwartaal", badge: "3% korting" },
  { id: "yearly", label: "Jaarlijks", badge: "1 maand gratis" },
];

export const BILLING_MULTIPLIER: Record<BillingCycle, number> = {
  monthly: 1,
  quarterly: 3,
  yearly: 12,
};

// Korting als factor (1 = geen korting, 0.916 ≈ 1 maand gratis bij 12)
export const BILLING_DISCOUNT: Record<BillingCycle, number> = {
  monthly: 1,
  quarterly: 0.97, // 3% korting
  yearly: 11 / 12, // 1 maand gratis = ~8.3% korting
};

export const PLANS: PricingPlan[] = [
  {
    id: "starter",
    name: "Starter",
    tagline: "Voor zelfstandige vakmensen en starters.",
    basePrice: {
      monthly: 29,
      quarterly: 28,
      yearly: 27,
    },
    listPrice: 39,
    extraUserPrice: 9,
    includedUsers: 1,
    features: [
      "Klanten, offertes & facturen",
      "Basis dashboard",
      "AI-hulp voor teksten",
      "Conforme PDF's, klaar voor Peppol",
      "Tot 50 documenten / maand",
    ],
    cta: "Probeer 14 dagen gratis",
    href: "/register?plan=starter",
    color: "default",
  },
  {
    id: "pro",
    name: "Pro",
    badge: "Meest gekozen",
    tagline: "Voor kleine bouwbedrijven en groeiende KMO's.",
    basePrice: {
      monthly: 59,
      quarterly: 57,
      yearly: 55,
    },
    listPrice: 79,
    extraUserPrice: 9,
    includedUsers: 1,
    features: [
      "Alles uit Starter",
      "Projecten & documentenbeheer",
      "Klantenportaal & opvolging",
      "Slimme AI-tekstsuggesties",
      "Automatische herinneringen",
      "Tot 250 documenten / maand",
    ],
    highlight: true,
    cta: "Probeer 14 dagen gratis",
    href: "/register?plan=pro",
    color: "blue",
  },
  {
    id: "business",
    name: "Business",
    tagline: "Voor teams en groeiende bedrijven.",
    basePrice: {
      monthly: 99,
      quarterly: 96,
      yearly: 92,
    },
    listPrice: 129,
    extraUserPrice: 9,
    includedUsers: 1,
    features: [
      "Alles uit Pro",
      "Rollen & rechten voor je team",
      "Planning & werkpostings",
      "Rapporten & inzichten",
      "AI-agents voor opvolging",
      "Onbeperkte documenten",
    ],
    cta: "Probeer 14 dagen gratis",
    href: "/register?plan=business",
    color: "dark",
  },
];

export const ADDONS: Addon[] = [
  {
    id: "extra-templates",
    name: "Extra facturatie templates",
    description: "5 extra huisstijl-sjablonen bovenop de standaard templates.",
    price: 5,
    icon: "FileText",
  },
  {
    id: "billit",
    name: "Billit API integratie",
    description: "Automatisch factureren via Billit. Sync in beide richtingen.",
    price: 12,
    badge: "Populair",
    icon: "Zap",
    requiredPlan: ["pro", "business"],
  },
  {
    id: "peppol",
    name: "Peppol e-facturatie",
    description: "Stuur en ontvang wettelijke e-facturen via het Peppol-netwerk.",
    price: 0,
    icon: "Globe",
  },
  {
    id: "extra-storage",
    name: "Extra opslag (10 GB)",
    description: "Meer opslagruimte voor bijlagen, foto's en documenten.",
    price: 4,
    icon: "HardDrive",
  },
  {
    id: "white-label",
    name: "White-label",
    description: "Verwijder ArchonPro branding. Eigen domein voor klantenportaal.",
    price: 19,
    badge: "Business",
    icon: "Layers",
    requiredPlan: ["business"],
  },
];

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function usePricingCalculator() {
  const [selectedPlanId, setSelectedPlanId] = useState<string>("pro");
  const [userCount, setUserCount] = useState<number>(1);
  const [billing, setBilling] = useState<BillingCycle>("yearly");
  const [activeAddons, setActiveAddons] = useState<Set<string>>(
    new Set(["peppol"]) // Peppol gratis standaard actief
  );

  const selectedPlan = useMemo(
    () => PLANS.find((p) => p.id === selectedPlanId) ?? PLANS[1],
    [selectedPlanId]
  );

  const toggleAddon = (addonId: string) => {
    setActiveAddons((prev) => {
      const next = new Set(prev);
      if (next.has(addonId)) {
        next.delete(addonId);
      } else {
        next.add(addonId);
      }
      return next;
    });
  };

  const breakdown = useMemo((): PriceBreakdown => {
    const plan = selectedPlan;
    const planBase = plan.basePrice[billing];
    const planListBase = plan.listPrice;
    const extraUsers = Math.max(0, userCount - plan.includedUsers);
    const extraUsersTotal = extraUsers * plan.extraUserPrice;

    const addonsTotal = ADDONS.filter((a) => activeAddons.has(a.id)).reduce(
      (sum, a) => sum + a.price,
      0
    );

    const subtotalMonthly = planBase + extraUsersTotal + addonsTotal;
    const listSubtotalMonthly = planListBase + extraUsersTotal + addonsTotal;
    const discountPercent =
      planListBase > planBase
        ? Math.round((1 - planBase / planListBase) * 100)
        : 0;
    const multiplier = BILLING_MULTIPLIER[billing];
    const discount = BILLING_DISCOUNT[billing];
    const totalPerPeriod = Math.round(subtotalMonthly * multiplier * discount * 100) / 100;

    // Vergelijk met puur maandelijks (geen korting)
    const monthlyBase = plan.basePrice["monthly"];
    const monthlySubtotal = monthlyBase + extraUsersTotal + addonsTotal;
    const yearlyIfMonthly = monthlySubtotal * 12;
    const yearlyTotal = billing === "yearly"
      ? totalPerPeriod
      : Math.round(subtotalMonthly * 12 * BILLING_DISCOUNT["yearly"] * 100) / 100;
    const savingsVsMonthly =
      billing !== "monthly"
        ? Math.round((yearlyIfMonthly - yearlyTotal) * 100) / 100
        : 0;

    return {
      planBase,
      planListBase,
      extraUsersTotal,
      addonsTotal,
      subtotalMonthly,
      listSubtotalMonthly,
      discountPercent,
      billingMultiplier: multiplier,
      totalPerPeriod,
      savingsVsMonthly,
      yearlyTotal,
    };
  }, [selectedPlan, userCount, billing, activeAddons]);

  return {
    // State
    selectedPlanId,
    setSelectedPlanId,
    userCount,
    setUserCount,
    billing,
    setBilling,
    activeAddons,
    toggleAddon,
    // Derived
    selectedPlan,
    breakdown,
  };
}
