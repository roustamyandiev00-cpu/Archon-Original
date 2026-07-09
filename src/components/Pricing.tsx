import {
  Check,
  ArrowRight,
  UserPlus,
  Sparkles,
  HardHat,
  GraduationCap,
  Calculator,
} from "lucide-react";

type Plan = {
  name: string;
  badge?: string;
  audience: string;
  blurb: string;
  price: string;
  period: string;
  features: string[];
  cta: string;
  href: string;
  highlight?: boolean;
};

const plans: Plan[] = [
  {
    name: "Starter",
    audience: "Voor zelfstandige vakmensen",
    blurb:
      "Voor wie snel offertes en facturen wil maken zonder ingewikkeld systeem.",
    price: "€29",
    period: "/ maand",
    features: [
      "Klanten, offertes & facturen",
      "Overzichtelijk basis dashboard",
      "Kleine AI-hulp voor teksten",
      "Conforme PDF's, klaar voor Peppol",
    ],
    cta: "Start met Starter",
    href: "/register?plan=starter",
  },
  {
    name: "Pro",
    badge: "Meest gekozen",
    audience: "Voor kleine bouwbedrijven",
    blurb:
      "Voor bedrijven die offertes, facturen, projecten en documenten op één plek willen beheren.",
    price: "€59",
    period: "/ maand",
    features: [
      "Alles uit Starter",
      "Projecten & documentenbeheer",
      "Klantenportaal & opvolging",
      "Slimme AI-tekstsuggesties",
      "Automatische herinneringen",
    ],
    cta: "Kies Pro",
    href: "/register?plan=pro",
    highlight: true,
  },
  {
    name: "Business",
    audience: "Voor teams en groeiende bedrijven",
    blurb:
      "Voor bedrijven die controle nodig hebben over klanten, planning, projecten en onderaannemers.",
    price: "€99",
    period: "/ maand",
    features: [
      "Alles uit Pro",
      "Rollen & rechten voor je team",
      "Planning & werkpostings (Bouwnetwerk)",
      "Rapporten & inzichten",
      "AI-agents voor opvolging",
    ],
    cta: "Start met Business",
    href: "/register?plan=business",
  },
];

const workflow = [
  { step: "1", title: "Klant komt binnen", desc: "Contact, aanvraag, notities en documenten op één plek." },
  { step: "2", title: "Offerte maken", desc: "Professionele PDF, duidelijke prijzen en slimme tekstsuggesties." },
  { step: "3", title: "Opvolgen", desc: "Herinneringen, status en automatische opvolging zonder chaos." },
  { step: "4", title: "Project uitvoeren", desc: "Taken, foto's, documenten, planning en teamcommunicatie." },
  { step: "5", title: "Factureren", desc: "Factuur, betaalstatus en klantcommunicatie netjes bewaard." },
];

const addOns = [
  { icon: UserPlus, title: "Extra gebruiker", price: "€9 – €15 / maand" },
  { icon: Sparkles, title: "Extra AI-credits", price: "€10 / €25 / €50 pakketten" },
  { icon: HardHat, title: "Werkposting", price: "Gratis beperkt, daarna €5 – €15" },
  { icon: GraduationCap, title: "Premium onboarding", price: "€149 – €499 eenmalig" },
  { icon: Calculator, title: "Boekhoudkoppeling", price: "€10 – €20 / maand" },
];

export default function Pricing({ showIntro = true }: { showIntro?: boolean }) {
  return (
    <section id="prijzen" className="relative overflow-hidden py-24">
      <div className="mx-auto max-w-6xl px-6">
        {showIntro && (
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-medium text-sky-400">
              Prijzen &amp; functies
            </p>
            <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl">
              Pakketten voor vakmensen die sneller willen werken
            </h2>
            <p className="mt-4 text-lg text-zinc-400">
              Kies een pakket dat past bij je bedrijf: van eenvoudige offertes en
              facturen tot projectopvolging, klantenportaal en slimme
              automatisering.
            </p>
          </div>
        )}

        {/* Pakketten */}
        <div className={`grid items-start gap-6 lg:grid-cols-3 ${showIntro ? "mt-14" : ""}`}>
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-3xl border p-6 sm:p-8 ${
                plan.highlight
                  ? "border-cyan-400/50 bg-zinc-900/80 lg:-mt-4 lg:mb-4 lg:shadow-2xl lg:shadow-cyan-500/10"
                  : "border-white/10 bg-zinc-900/50"
              }`}
            >
              {plan.highlight && (
                <>
                  <div className="aurora-glow opacity-60" aria-hidden />
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-sky-500 to-cyan-400 px-3.5 py-1 text-xs font-semibold text-zinc-950 shadow-lg shadow-cyan-500/30">
                    {plan.badge}
                  </span>
                </>
              )}

              <div className="relative z-10 flex flex-1 flex-col">
                <h3 className="text-lg font-semibold text-zinc-50">
                  {plan.name}
                </h3>
                <p className="mt-1 text-sm font-medium text-sky-400">
                  {plan.audience}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                  {plan.blurb}
                </p>

                <div className="mt-6 flex items-end gap-1.5">
                  <span
                    className={`text-4xl font-semibold tracking-tight ${
                      plan.highlight ? "text-gradient-cyan" : "text-zinc-50"
                    }`}
                  >
                    {plan.price}
                  </span>
                  <span className="pb-1 text-sm text-zinc-500">
                    {plan.period}
                  </span>
                </div>

                <ul className="mt-6 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-zinc-300">
                      <span
                        className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full ${
                          plan.highlight
                            ? "bg-gradient-to-br from-sky-500 to-cyan-400 text-zinc-950"
                            : "bg-sky-500/15 text-sky-400"
                        }`}
                      >
                        <Check size={11} strokeWidth={3} />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>

                <a
                  href={plan.href}
                  className={`group mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-medium transition-all ${
                    plan.highlight
                      ? "bg-gradient-to-r from-sky-500 to-cyan-400 text-zinc-950 hover:from-sky-400 hover:to-cyan-300 hover:shadow-lg hover:shadow-cyan-500/25"
                      : "border border-white/15 text-zinc-100 hover:border-sky-500/50 hover:bg-white/5"
                  }`}
                >
                  {plan.cta}
                  <ArrowRight
                    size={16}
                    className="transition-transform group-hover:translate-x-0.5"
                  />
                </a>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-zinc-500">
          14 dagen gratis proberen · Maandelijks opzegbaar · Geen installatie
          nodig · Veilig online dashboard
        </p>

        {/* Workflow */}
        <div className="mt-20 rounded-3xl border border-white/10 bg-zinc-900/40 p-6 sm:p-10">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-medium text-sky-400">
              Van aanvraag tot betaald project
            </p>
            <h3 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl">
              Eén centrale cockpit, geen losse administratie-tools
            </h3>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {workflow.map((w) => (
              <div
                key={w.step}
                className="relative rounded-2xl border border-white/10 bg-zinc-950/40 p-5"
              >
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-sky-500/25 to-indigo-500/20 text-sm font-semibold text-sky-300 ring-1 ring-inset ring-white/10">
                  {w.step}
                </span>
                <h4 className="mt-4 text-sm font-semibold text-zinc-50">
                  {w.title}
                </h4>
                <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">
                  {w.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Add-ons */}
        <div className="mt-12">
          <div className="mx-auto max-w-2xl text-center">
            <h3 className="text-xl font-semibold tracking-tight text-zinc-50">
              Groeit je bedrijf? Breid uit wanneer je wil.
            </h3>
            <p className="mt-2 text-sm text-zinc-400">
              Handige extra&apos;s bovenop je pakket — je betaalt alleen voor wat
              je gebruikt.
            </p>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {addOns.map((a) => (
              <div
                key={a.title}
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-zinc-900/50 px-4 py-3.5"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-sky-500/10 text-sky-400 ring-1 ring-inset ring-white/10">
                  <a.icon size={17} />
                </span>
                <div>
                  <p className="text-sm font-medium text-zinc-100">{a.title}</p>
                  <p className="text-xs text-zinc-500">{a.price}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
