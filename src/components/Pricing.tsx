"use client";

import { useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronDown,
  CircleHelp,
  Sparkles,
} from "lucide-react";
import { FastLink } from "@/components/FastLink";
import { TRIAL_DAYS } from "@/components/dashboard/trial";

type BillingCycle = "yearly" | "monthly" | "quarterly";

type Plan = {
  name: string;
  badge?: string;
  limit: string;
  limitHint: string;
  audience: string;
  prices: Record<BillingCycle, { amount: string; compare?: string; note?: string }>;
  features: string[];
  cta: string;
  href: string;
  highlight?: boolean;
};

const billingOptions: { id: BillingCycle; label: string }[] = [
  { id: "yearly", label: "Betaal jaarlijks (1 maand gratis)" },
  { id: "monthly", label: "Betaal maandelijks" },
  { id: "quarterly", label: "Betaal per kwartaal" },
];

const plans: Plan[] = [
  {
    name: "Starter",
    limit: "Tot 50",
    limitHint:
      "Offertes, facturen en documenten per maand. Ideaal om ArchonPro uit te proberen zonder complexiteit.",
    audience: "Voor zelfstandige vakmensen en starters.",
    prices: {
      yearly: { amount: "€27", compare: "€29", note: "Jaarlijks gefactureerd? Dan krijg je 1 maand gratis." },
      monthly: { amount: "€29", note: "Maandelijks opzegbaar, geen verborgen kosten." },
      quarterly: { amount: "€28", compare: "€29", note: "Per kwartaal gefactureerd." },
    },
    features: [
      "Klanten, offertes & facturen",
      "Basis dashboard",
      "Kleine AI-hulp voor teksten",
      "Conforme PDF's, klaar voor Peppol",
    ],
    cta: `Probeer ${TRIAL_DAYS} dagen gratis`,
    href: "/register?plan=starter",
  },
  {
    name: "Pro",
    badge: "Meest gekozen",
    limit: "Tot 250",
    limitHint:
      "Documenten en projecten per maand. Voor bedrijven die offertes, facturen en opvolging op één plek willen.",
    audience: "Voor kleine bouwbedrijven en groeiende KMO's.",
    prices: {
      yearly: { amount: "€55", compare: "€59", note: "Jaarlijks gefactureerd? Dan krijg je 1 maand gratis." },
      monthly: { amount: "€59", note: "Maandelijks opzegbaar, geen verborgen kosten." },
      quarterly: { amount: "€57", compare: "€59", note: "Per kwartaal gefactureerd." },
    },
    features: [
      "Alles uit Starter",
      "Projecten & documentenbeheer",
      "Klantenportaal & opvolging",
      "Slimme AI-tekstsuggesties",
      "Automatische herinneringen",
    ],
    cta: `Probeer ${TRIAL_DAYS} dagen gratis`,
    href: "/register?plan=pro",
    highlight: true,
  },
  {
    name: "Business",
    limit: "Onbeperkt",
    limitHint:
      "Geen documentlimiet. Voor teams die planning, rollen en rapportage nodig hebben.",
    audience: "Voor teams en groeiende bedrijven.",
    prices: {
      yearly: { amount: "€92", compare: "€99", note: "Jaarlijks gefactureerd? Dan krijg je 1 maand gratis." },
      monthly: { amount: "€99", note: "Maandelijks opzegbaar, geen verborgen kosten." },
      quarterly: { amount: "€96", compare: "€99", note: "Per kwartaal gefactureerd." },
    },
    features: [
      "Alles uit Pro",
      "Rollen & rechten voor je team",
      "Planning & werkpostings",
      "Rapporten & inzichten",
      "AI-agents voor opvolging",
    ],
    cta: `Probeer ${TRIAL_DAYS} dagen gratis`,
    href: "/register?plan=business",
  },
];

const goodToKnow = [
  {
    title: "Je start met 1 gebruiker inbegrepen",
    body: "Extra gebruiker nodig? Voeg die eenvoudig toe vanaf €9 per maand.",
  },
  {
    title: "Wat als ik mijn limiet overschrijd?",
    body: "Geen stress — we blokkeren niets. Je krijgt een melding en betaalt enkel een kleine meerprijs per extra document.",
  },
  {
    title: "Je boekhouder laten meekijken?",
    body: "Werk vlot samen met je boekhouder, zonder bestanden heen en weer te sturen.",
  },
  {
    title: "Pakket aanpassen of opzeggen",
    body: "Upgrade gaat meteen in. Downgrade start vanaf je volgende betaalperiode. Opzeggen kan altijd.",
  },
];

const featureList = [
  "Offertes en facturen in je huisstijl",
  "Peppol e-facturatie inbegrepen",
  "AI-offertes en slimme tekstsuggesties",
  "Klantenportaal en opvolging",
  "Projecten, taken en documenten",
  "Automatische betalingsherinneringen",
  "Mobiel factureren onderweg",
  "Boekhouder gratis laten meekijken",
  "Btw-overzicht en betaalstatus",
  "Integraties met je bestaande tools",
];

const faq = [
  {
    q: "Kan ik ArchonPro gratis testen?",
    a: `Ja. Tijdens de gratis proefperiode van ${TRIAL_DAYS} dagen probeer je alle functies van je gekozen pakket uit, zonder creditcard.`,
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
        <span className="text-base font-semibold text-zinc-900">{q}</span>
        <ChevronDown
          size={18}
          className={`shrink-0 text-zinc-500 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && <p className="pb-4 text-sm leading-relaxed text-zinc-600">{a}</p>}
    </div>
  );
}

export default function Pricing({ showIntro = true }: { showIntro?: boolean }) {
  const [billing, setBilling] = useState<BillingCycle>("yearly");

  return (
    <section id="prijzen" className="bg-white">
      {showIntro && (
        <div className="border-b border-zinc-100 bg-gradient-to-b from-blue-50/80 to-white px-6 pb-14 pt-28 text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
            Een prijs die past bij je bedrijf
          </p>
          <h1 className="mx-auto mt-3 max-w-3xl text-balance text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
            Heldere prijzen, zonder verrassingen
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-zinc-600">
            Kies je pakket op basis van wat je nodig hebt. Alle kernfuncties zitten
            standaard in elk pakket — het enige verschil is schaal en teamgrootte.
          </p>
        </div>
      )}

      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-zinc-900 sm:text-3xl">
            Kies op basis van je verbruik
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-zinc-600 sm:text-base">
            Je kan per maand, per kwartaal of jaarlijks betalen. Starter, KMO of
            team? ArchonPro groeit met je mee.
          </p>
        </div>

        <div className="mt-8 flex justify-center">
          <div
            role="tablist"
            aria-label="Betaalperiode"
            className="inline-flex max-w-full flex-wrap justify-center gap-1 rounded-lg border border-zinc-200 bg-zinc-50 p-1"
          >
            {billingOptions.map((opt) => (
              <button
                key={opt.id}
                type="button"
                role="tab"
                aria-selected={billing === opt.id}
                onClick={() => setBilling(opt.id)}
                className={`rounded-md px-3 py-2 text-xs font-semibold transition-colors sm:px-4 sm:text-sm ${
                  billing === opt.id
                    ? "bg-white text-zinc-900 shadow-sm ring-1 ring-zinc-200"
                    : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className={`grid gap-5 lg:grid-cols-3 ${showIntro ? "mt-10" : "mt-8"}`}>
          {plans.map((plan) => {
            const price = plan.prices[billing];

            return (
              <article
                key={plan.name}
                className={`relative flex flex-col rounded-lg border bg-white p-6 sm:p-7 ${
                  plan.highlight
                    ? "border-blue-500 shadow-lg shadow-blue-500/10 ring-1 ring-blue-500/20 lg:-mt-1 lg:mb-1"
                    : "border-zinc-200"
                }`}
              >
                {plan.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
                    {plan.badge}
                  </span>
                )}

                <div className="flex items-start gap-2">
                  <p className="text-3xl font-bold tracking-tight text-zinc-900">
                    {plan.limit}
                  </p>
                  <span
                    className="mt-2 text-zinc-400"
                    title={plan.limitHint}
                    aria-label={plan.limitHint}
                  >
                    <CircleHelp size={16} />
                  </span>
                </div>
                <p className="mt-1 text-sm font-medium text-zinc-500">
                  documenten / maand
                </p>
                <p className="mt-4 text-sm leading-relaxed text-zinc-600">
                  {plan.audience}
                </p>

                <div className="mt-6 flex items-end gap-2">
                  {price.compare && (
                    <span className="text-lg text-zinc-400 line-through">
                      {price.compare}
                    </span>
                  )}
                  <span className="text-4xl font-bold tracking-tight text-zinc-900">
                    {price.amount}
                  </span>
                  <span className="pb-1 text-sm text-zinc-500">per maand</span>
                </div>

                {price.note && (
                  <p className="mt-2 text-xs leading-relaxed text-zinc-500">
                    {price.note}
                  </p>
                )}

                <p className="mt-2 text-xs text-zinc-400">
                  *Prijs per bedrijf of apart dossier.
                </p>

                <FastLink
                  href={plan.href}
                  className={`mt-6 inline-flex w-full items-center justify-center gap-2 rounded px-5 py-3 text-sm font-semibold transition-colors ${
                    plan.highlight
                      ? "bg-blue-600 text-white hover:bg-blue-500"
                      : "border border-zinc-900 text-zinc-900 hover:bg-zinc-50"
                  }`}
                >
                  {plan.cta}
                  <ArrowRight size={16} />
                </FastLink>

                <p className="mt-4 text-center text-xs font-medium text-zinc-500">
                  Alle functies zijn inbegrepen
                </p>

                <ul className="mt-6 space-y-2.5 border-t border-zinc-100 pt-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-zinc-700">
                      <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-blue-600 text-white">
                        <Check size={10} strokeWidth={3} />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>

        <div className="mt-16 rounded-xl border border-zinc-200 bg-zinc-50 p-6 sm:p-8">
          <h3 className="text-lg font-bold text-zinc-900">Goed om te weten …</h3>
          <ul className="mt-5 space-y-4">
            {goodToKnow.map((item) => (
              <li key={item.title} className="flex gap-3">
                <span className="mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-blue-100 text-blue-700">
                  <Check size={12} strokeWidth={3} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-zinc-900">{item.title}</p>
                  <p className="mt-0.5 text-sm text-zinc-600">{item.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-16">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
            Makkelijker ondernemen
          </p>
          <h3 className="mt-2 text-2xl font-bold text-zinc-900 sm:text-3xl">
            Je administratie, gewoon goed geregeld
          </h3>
          <p className="mt-2 text-zinc-600">
            Alles wat je nodig hebt om zorgeloos te factureren in de bouw.
          </p>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {featureList.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-sm text-zinc-700">
                <Check size={16} className="mt-0.5 shrink-0 text-blue-600" strokeWidth={2.5} />
                {f}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-16">
          <h3 className="text-2xl font-bold text-zinc-900">Veelgestelde vragen</h3>
          <div className="mt-4 rounded-xl border border-zinc-200 bg-white px-5 sm:px-6">
            {faq.map((item) => (
              <FaqItem key={item.q} q={item.q} a={item.a} />
            ))}
          </div>
        </div>

        <div className="mt-16 overflow-hidden rounded-2xl bg-zinc-900 px-6 py-10 text-center sm:px-10 sm:py-12">
          <div className="mx-auto flex max-w-2xl flex-col items-center">
            <Sparkles size={28} className="text-blue-400" />
            <h3 className="mt-4 text-2xl font-bold text-white sm:text-3xl">
              Probeer ArchonPro — &apos;t is gratis
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-zinc-300 sm:text-base">
              In enkele klikken is je account klaar. Probeer {TRIAL_DAYS} dagen helemaal
              gratis uit, zonder enige verplichting. Geen creditcard nodig.
            </p>
            <FastLink
              href="/register"
              className="mt-6 inline-flex items-center gap-2 rounded bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-500"
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
