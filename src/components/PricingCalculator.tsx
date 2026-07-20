"use client";

import { useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronDown,
  FileText,
  Globe,
  HardDrive,
  Layers,
  Minus,
  Plus,
  Sparkles,
  Zap,
} from "lucide-react";
import { FastLink } from "@/components/FastLink";
import {
  ADDONS,
  BILLING_OPTIONS,
  PLANS,
  usePricingCalculator,
  type Addon,
  type BillingCycle,
  type PricingPlan,
} from "@/hooks/usePricingCalculator";

// ─── Icon helper ──────────────────────────────────────────────────────────────

const ICONS: Record<string, React.ReactNode> = {
  FileText: <FileText size={16} />,
  Zap: <Zap size={16} />,
  Globe: <Globe size={16} />,
  HardDrive: <HardDrive size={16} />,
  Layers: <Layers size={16} />,
};

// ─── Billing Toggle ───────────────────────────────────────────────────────────

function BillingToggle({
  billing,
  onChange,
}: {
  billing: BillingCycle;
  onChange: (v: BillingCycle) => void;
}) {
  return (
    <div className="flex justify-center">
      <div
        role="tablist"
        aria-label="Betaalperiode"
        className="inline-flex flex-wrap justify-center gap-1 rounded-xl border border-zinc-200 bg-zinc-50 p-1"
      >
        {BILLING_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            role="tab"
            aria-selected={billing === opt.id}
            onClick={() => onChange(opt.id)}
            className={`relative flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
              billing === opt.id
                ? "bg-white text-zinc-900 shadow-sm ring-1 ring-zinc-200"
                : "text-zinc-500 hover:text-zinc-800"
            }`}
          >
            {opt.label}
            {opt.badge && (
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                {opt.badge}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── User Slider ──────────────────────────────────────────────────────────────

function UserSelector({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const MAX = 20;
  const pct = ((value - 1) / (MAX - 1)) * 100;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-zinc-900">Aantal gebruikers</p>
          <p className="text-xs text-zinc-500 mt-0.5">1 gebruiker inbegrepen, daarna €9/gebruiker/maand</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onChange(Math.max(1, value - 1))}
            disabled={value <= 1}
            className="grid h-8 w-8 place-items-center rounded-lg border border-zinc-200 text-zinc-600 transition-colors hover:bg-zinc-50 disabled:opacity-30"
            aria-label="Minder gebruikers"
          >
            <Minus size={14} />
          </button>
          <span className="w-10 text-center text-lg font-bold text-zinc-900">{value}</span>
          <button
            type="button"
            onClick={() => onChange(Math.min(MAX, value + 1))}
            disabled={value >= MAX}
            className="grid h-8 w-8 place-items-center rounded-lg border border-zinc-200 text-zinc-600 transition-colors hover:bg-zinc-50 disabled:opacity-30"
            aria-label="Meer gebruikers"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      {/* Slider */}
      <div className="mt-4 px-1">
        <div className="relative h-2 rounded-full bg-zinc-100">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-blue-500 transition-all"
            style={{ width: `${pct}%` }}
          />
          <input
            type="range"
            min={1}
            max={MAX}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            aria-label="Aantal gebruikers"
          />
          {/* Thumb */}
          <div
            className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-2 border-blue-500 bg-white shadow transition-all"
            style={{ left: `calc(${pct}% - 8px)` }}
          />
        </div>
        <div className="mt-2 flex justify-between text-[10px] text-zinc-400">
          <span>1</span>
          <span>5</span>
          <span>10</span>
          <span>15</span>
          <span>20</span>
        </div>
      </div>
    </div>
  );
}

// ─── Plan Card ────────────────────────────────────────────────────────────────

function PlanCard({
  plan,
  selected,
  billing,
  userCount,
  onSelect,
}: {
  plan: PricingPlan;
  selected: boolean;
  billing: BillingCycle;
  userCount: number;
  onSelect: () => void;
}) {
  const price = plan.basePrice[billing];
  const listPrice = plan.listPrice;
  const discountPercent =
    listPrice > price ? Math.round((1 - price / listPrice) * 100) : 0;
  const extraUsers = Math.max(0, userCount - plan.includedUsers);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`relative flex w-full flex-col rounded-xl border p-5 text-left transition-all sm:p-6 ${
        selected
          ? plan.highlight
            ? "border-blue-500 bg-blue-50 ring-2 ring-blue-500/30"
            : "border-zinc-900 bg-zinc-50 ring-2 ring-zinc-900/10"
          : "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50/50"
      }`}
      aria-pressed={selected}
    >
      {plan.badge && (
        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-3 py-0.5 text-[11px] font-semibold text-white">
          {plan.badge}
        </span>
      )}

      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-base font-bold text-zinc-900">{plan.name}</p>
          <p className="mt-0.5 text-xs text-zinc-500">{plan.tagline}</p>
        </div>
        <span
          className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 transition-colors ${
            selected ? "border-blue-600 bg-blue-600" : "border-zinc-300 bg-white"
          }`}
        >
          {selected && <Check size={11} strokeWidth={3} className="text-white" />}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-x-2 gap-y-1">
        {discountPercent > 0 && (
          <span className="text-base font-medium text-zinc-400 line-through decoration-zinc-400/80">
            €{listPrice}
          </span>
        )}
        <span className="text-3xl font-bold tracking-tight text-zinc-900">€{price}</span>
        <span className="pb-0.5 text-xs text-zinc-500">/maand</span>
      </div>
      {discountPercent > 0 && (
        <span className="mt-2 inline-flex w-fit items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200/80">
          −{discountPercent}% korting
        </span>
      )}

      {extraUsers > 0 && (
        <p className="mt-1.5 text-xs text-zinc-500">
          + €{extraUsers * plan.extraUserPrice} voor {extraUsers} extra {extraUsers === 1 ? "gebruiker" : "gebruikers"}
        </p>
      )}

      <ul className="mt-4 space-y-1.5 border-t border-zinc-100 pt-4">
        {plan.features.slice(0, 4).map((f) => (
          <li key={f} className="flex items-start gap-2 text-xs text-zinc-600">
            <Check size={12} className="mt-0.5 shrink-0 text-blue-600" strokeWidth={2.5} />
            {f}
          </li>
        ))}
        {plan.features.length > 4 && (
          <li className="text-xs text-zinc-400">
            +{plan.features.length - 4} meer functies inbegrepen
          </li>
        )}
      </ul>
    </button>
  );
}

// ─── Addon Toggle ─────────────────────────────────────────────────────────────

function AddonItem({
  addon,
  active,
  available,
  onToggle,
}: {
  addon: Addon;
  active: boolean;
  available: boolean;
  onToggle: () => void;
}) {
  const isFree = addon.price === 0;

  return (
    <button
      type="button"
      onClick={available ? onToggle : undefined}
      disabled={!available || isFree}
      className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-all ${
        !available
          ? "cursor-not-allowed border-zinc-100 bg-zinc-50 opacity-50"
          : active
          ? "border-blue-400 bg-blue-50 ring-1 ring-blue-400/30"
          : "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50/50"
      }`}
      aria-pressed={active}
      title={!available ? "Niet beschikbaar voor dit pakket" : undefined}
    >
      <span
        className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${
          active ? "bg-blue-100 text-blue-700" : "bg-zinc-100 text-zinc-500"
        }`}
      >
        {ICONS[addon.icon]}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-semibold text-zinc-900">{addon.name}</p>
          {addon.badge && (
            <span className="rounded-full bg-zinc-100 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-600">
              {addon.badge}
            </span>
          )}
        </div>
        <p className="mt-0.5 text-xs leading-relaxed text-zinc-500">{addon.description}</p>
      </div>

      <div className="shrink-0 text-right">
        <p className={`text-sm font-bold ${isFree ? "text-green-600" : "text-zinc-900"}`}>
          {isFree ? "Gratis" : `+€${addon.price}/m`}
        </p>
        {!isFree && available && (
          <span
            className={`mt-1 block text-[10px] font-semibold ${
              active ? "text-blue-600" : "text-zinc-400"
            }`}
          >
            {active ? "Actief" : "Toevoegen"}
          </span>
        )}
      </div>
    </button>
  );
}

// ─── Price Summary ────────────────────────────────────────────────────────────

function PriceSummary({
  plan,
  breakdown,
  billing,
  userCount,
}: {
  plan: PricingPlan;
  breakdown: ReturnType<typeof usePricingCalculator>["breakdown"];
  billing: BillingCycle;
  userCount: number;
}) {
  const periodLabel: Record<BillingCycle, string> = {
    monthly: "per maand",
    quarterly: "per kwartaal",
    yearly: "per jaar",
  };

  const extraUsers = Math.max(0, userCount - plan.includedUsers);

  return (
    <div className="sticky top-4 rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="border-b border-zinc-100 px-6 py-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Jouw prijs — live berekend
        </p>
        <div className="mt-2 flex flex-wrap items-end gap-x-2 gap-y-1">
          {breakdown.discountPercent > 0 && (
            <span className="pb-1 text-lg font-medium text-zinc-400 line-through">
              €{Math.round(breakdown.listSubtotalMonthly)}
            </span>
          )}
          <span className="text-4xl font-bold tracking-tight text-zinc-900">
            €{Math.round(breakdown.subtotalMonthly)}
          </span>
          <span className="pb-1 text-sm text-zinc-500">/ maand</span>
        </div>
        {breakdown.discountPercent > 0 && (
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
            −{breakdown.discountPercent}% introductiekorting
          </div>
        )}
        {billing !== "monthly" && (
          <p className="mt-1 text-xs text-zinc-500">
            Gefactureerd als{" "}
            <span className="font-semibold text-zinc-700">
              €{breakdown.totalPerPeriod} {periodLabel[billing]}
            </span>
          </p>
        )}
        {breakdown.savingsVsMonthly > 0 && (
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
            <Check size={11} strokeWidth={3} />
            Je bespaart €{breakdown.savingsVsMonthly} per jaar
          </div>
        )}
      </div>

      <div className="px-6 py-4">
        <ul className="space-y-2.5 text-sm">
          <li className="flex justify-between text-zinc-600">
            <span>Pakket {plan.name}</span>
            <span className="font-medium text-zinc-900">
              {breakdown.discountPercent > 0 && (
                <span className="mr-1.5 text-zinc-400 line-through">
                  €{breakdown.planListBase}
                </span>
              )}
              €{breakdown.planBase}/m
            </span>
          </li>
          {extraUsers > 0 && (
            <li className="flex justify-between text-zinc-600">
              <span>
                {extraUsers} extra {extraUsers === 1 ? "gebruiker" : "gebruikers"}
              </span>
              <span className="font-medium text-zinc-900">
                €{breakdown.extraUsersTotal}/m
              </span>
            </li>
          )}
          {breakdown.addonsTotal > 0 && (
            <li className="flex justify-between text-zinc-600">
              <span>Add-ons</span>
              <span className="font-medium text-zinc-900">
                €{breakdown.addonsTotal}/m
              </span>
            </li>
          )}
          {billing !== "monthly" && (
            <li className="flex justify-between border-t border-zinc-100 pt-2.5 text-zinc-600">
              <span>Subtotaal × {breakdown.billingMultiplier} maanden</span>
              <span className="font-medium text-zinc-900">
                €{Math.round(breakdown.subtotalMonthly * breakdown.billingMultiplier)}
              </span>
            </li>
          )}
          {billing === "yearly" && (
            <li className="flex justify-between text-zinc-500">
              <span>Jaarlijkse korting (1 maand gratis)</span>
              <span className="font-medium text-green-600">
                −€{Math.round(breakdown.subtotalMonthly * breakdown.billingMultiplier - breakdown.totalPerPeriod)}
              </span>
            </li>
          )}
          {billing === "quarterly" && (
            <li className="flex justify-between text-zinc-500">
              <span>Kwartaalkorting (3%)</span>
              <span className="font-medium text-green-600">
                −€{Math.round((breakdown.subtotalMonthly * 3 - breakdown.totalPerPeriod) * 100) / 100}
              </span>
            </li>
          )}
        </ul>

        <div className="mt-4 flex items-center justify-between rounded-lg bg-zinc-50 px-4 py-3">
          <span className="text-sm font-bold text-zinc-900">Totaal {periodLabel[billing]}</span>
          <span className="text-lg font-bold text-zinc-900">€{breakdown.totalPerPeriod}</span>
        </div>

        <FastLink
          href={`${plan.href}&users=${userCount}&billing=${billing}`}
          className={`mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold transition-colors ${
            plan.highlight
              ? "bg-blue-600 text-white hover:bg-blue-500"
              : "bg-zinc-900 text-white hover:bg-zinc-800"
          }`}
        >
          {plan.cta}
          <ArrowRight size={16} />
        </FastLink>

        <p className="mt-3 text-center text-xs text-zinc-400">
          14 dagen gratis · geen creditcard nodig
        </p>
      </div>
    </div>
  );
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────

const faq = [
  {
    q: "Kan ik ArchonPro gratis testen?",
    a: "Ja. Tijdens de gratis proefperiode van 14 dagen probeer je alle functies van je gekozen pakket uit, zonder creditcard.",
  },
  {
    q: "Heb ik een kredietkaart nodig om te starten?",
    a: "Neen. Een e-mailadres volstaat om een account aan te maken en ArchonPro gratis uit te proberen.",
  },
  {
    q: "Wat gebeurt er na afloop van mijn proefperiode?",
    a: "Je beslist zelf of je een betalend abonnement neemt. Je account en gegevens blijven bewaard, zodat je meteen verder kan.",
  },
  {
    q: "Is Peppol inbegrepen?",
    a: "Ja. Toegang tot Peppol e-facturatie zit in elk betalend pakket, zonder extra kosten.",
  },
  {
    q: "Kan ik mijn abonnement later aanpassen?",
    a: "Ja. Upgrade gaat meteen in. Downgrade start na je huidige betaalperiode. Opzeggen kan op elk moment.",
  },
  {
    q: "Wat als ik meer dan 20 gebruikers nodig heb?",
    a: "Neem contact op voor een aangepaste offerte. Wij voorzien maatwerk voor grotere teams.",
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-zinc-200 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 py-4 text-left"
        aria-expanded={open}
      >
        <span className="text-sm font-semibold text-zinc-900 sm:text-base">{q}</span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <p className="pb-4 text-sm leading-relaxed text-zinc-600">{a}</p>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PricingCalculator({ showIntro = true }: { showIntro?: boolean }) {
  const {
    selectedPlanId,
    setSelectedPlanId,
    userCount,
    setUserCount,
    billing,
    setBilling,
    activeAddons,
    toggleAddon,
    selectedPlan,
    breakdown,
  } = usePricingCalculator();

  return (
    <section id="prijzen" className="bg-white">
      {/* Hero intro */}
      {showIntro && (
        <div className="border-b border-zinc-100 bg-gradient-to-b from-blue-50/80 to-white px-6 pb-14 pt-28 text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
            Een prijs die past bij je bedrijf
          </p>
          <h1 className="mx-auto mt-3 max-w-3xl text-balance text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
            Heldere prijzen, zonder verrassingen
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-zinc-600">
            Stel je pakket samen. Zie de prijs direct. Geen verborgen kosten.
          </p>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        {/* Billing toggle */}
        <div className="mb-10">
          <BillingToggle billing={billing} onChange={setBilling} />
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          {/* Left column — configurator */}
          <div className="space-y-8">

            {/* Stap 1 — Pakket */}
            <div>
              <div className="mb-4 flex items-center gap-3">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-blue-600 text-xs font-bold text-white">
                  1
                </span>
                <h2 className="text-lg font-bold text-zinc-900">Kies je pakket</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                {PLANS.map((plan) => (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    selected={selectedPlanId === plan.id}
                    billing={billing}
                    userCount={userCount}
                    onSelect={() => setSelectedPlanId(plan.id)}
                  />
                ))}
              </div>
            </div>

            {/* Stap 2 — Gebruikers */}
            <div>
              <div className="mb-4 flex items-center gap-3">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-blue-600 text-xs font-bold text-white">
                  2
                </span>
                <h2 className="text-lg font-bold text-zinc-900">Hoeveel gebruikers?</h2>
              </div>
              <UserSelector value={userCount} onChange={setUserCount} />
            </div>

            {/* Stap 3 — Add-ons */}
            <div>
              <div className="mb-4 flex items-center gap-3">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-blue-600 text-xs font-bold text-white">
                  3
                </span>
                <h2 className="text-lg font-bold text-zinc-900">
                  Voeg extras toe{" "}
                  <span className="text-sm font-normal text-zinc-400">(optioneel)</span>
                </h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {ADDONS.map((addon) => {
                  const available =
                    !addon.requiredPlan ||
                    addon.requiredPlan.includes(selectedPlanId);
                  return (
                    <AddonItem
                      key={addon.id}
                      addon={addon}
                      active={activeAddons.has(addon.id)}
                      available={available}
                      onToggle={() => toggleAddon(addon.id)}
                    />
                  );
                })}
              </div>
              <p className="mt-3 text-xs text-zinc-400">
                * Sommige add-ons vereisen een hoger pakket.
              </p>
            </div>

            {/* Goed om te weten */}
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-5 sm:p-6">
              <h3 className="text-sm font-bold text-zinc-900">Goed om te weten …</h3>
              <ul className="mt-4 space-y-3">
                {[
                  {
                    title: "Je start met 1 gebruiker inbegrepen",
                    body: "Extra gebruiker nodig? Voeg die toe vanaf €9 per maand.",
                  },
                  {
                    title: "Wat als ik mijn limiet overschrijd?",
                    body: "Geen stress — we blokkeren niets. Je krijgt een melding en betaalt enkel een kleine meerprijs per extra document.",
                  },
                  {
                    title: "Pakket aanpassen of opzeggen",
                    body: "Upgrade gaat meteen in. Downgrade start vanaf je volgende betaalperiode. Opzeggen kan altijd.",
                  },
                  {
                    title: "Boekhouder laten meekijken?",
                    body: "Werk vlot samen met je boekhouder, zonder bestanden heen en weer te sturen.",
                  },
                ].map((item) => (
                  <li key={item.title} className="flex gap-3">
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-blue-100 text-blue-700">
                      <Check size={11} strokeWidth={3} />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-zinc-900">{item.title}</p>
                      <p className="mt-0.5 text-xs text-zinc-500">{item.body}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* FAQ */}
            <div>
              <h3 className="text-xl font-bold text-zinc-900">Veelgestelde vragen</h3>
              <div className="mt-4 rounded-xl border border-zinc-200 bg-white px-5 sm:px-6">
                {faq.map((item) => (
                  <FaqItem key={item.q} q={item.q} a={item.a} />
                ))}
              </div>
            </div>
          </div>

          {/* Right column — price summary (sticky) */}
          <div>
            <PriceSummary
              plan={selectedPlan}
              breakdown={breakdown}
              billing={billing}
              userCount={userCount}
            />
          </div>
        </div>

        {/* CTA banner */}
        <div className="mt-16 overflow-hidden rounded-2xl bg-zinc-900 px-6 py-10 text-center sm:px-10 sm:py-12">
          <div className="mx-auto flex max-w-2xl flex-col items-center">
            <Sparkles size={28} className="text-blue-400" />
            <h3 className="mt-4 text-2xl font-bold text-white sm:text-3xl">
              Probeer ArchonPro — &apos;t is gratis
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-zinc-300 sm:text-base">
              In enkele klikken is je account klaar. Probeer 14 dagen helemaal
              gratis uit, zonder enige verplichting. Geen creditcard nodig.
            </p>
            <FastLink
              href="/register"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-500"
            >
              Start je gratis proefperiode
              <ArrowRight size={16} />
            </FastLink>
          </div>
        </div>
      </div>
    </section>
  );
}
