import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Code2,
  KeyRound,
  Layers,
  LifeBuoy,
  ShieldCheck,
  Terminal,
  Zap,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import PageHero from "@/components/PageHero";
import Footer from "@/components/Footer";
import { API_RESOURCES } from "@/lib/apiResources";

export const metadata: Metadata = {
  title: "Ontwikkelaars — ArchonPro API",
  description:
    "Koppel je eigen software aan ArchonPro. Lees offertes, facturen en klanten uit via onze REST API met API-sleutels en scopes.",
};

const useCases = [
  {
    icon: Layers,
    title: "Eigen dashboards",
    desc: "Haal offertes, facturen en klanten op in je interne rapportage of BI-tool.",
  },
  {
    icon: Zap,
    title: "Automatiseringen",
    desc: "Trigger workflows wanneer een offerte wordt goedgekeurd of een factuur verstuurd is.",
  },
  {
    icon: ShieldCheck,
    title: "Veilig per bedrijf",
    desc: "Elke sleutel is gekoppeld aan één bedrijf. Scopes bepalen welke data je mag uitlezen.",
  },
];

const quickstart = [
  "Maak een gratis ArchonPro-account aan.",
  "Ga in het dashboard naar Instellingen → tab API.",
  "Maak een sleutel aan met de scopes die je nodig hebt.",
  "Roep een endpoint aan met Authorization: Bearer <sleutel>.",
];

export default function OntwikkelaarsPage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <ResourceCards />
        <Endpoints />
        <Quickstart />
        <UseCases />
        <SupportCta />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}

function Hero() {
  return (
    <PageHero
      variant="violet"
      kicker={
        <>
          <Code2 size={13} className="text-violet-300" /> Ontwikkelaars
        </>
      }
      title="Koppel je software aan"
      accent="ArchonPro"
      subtitle="Bouw integraties tussen je eigen applicatie en ArchonPro. Onze REST API geeft je veilig toegang tot offertes, facturen, klanten en meer — met API-sleutels en fijne rechten per scope."
      primary={{ label: "Gratis account aanmaken", href: "/register" }}
      secondary={{ label: "Bekijk endpoints", href: "#endpoints" }}
      visual={
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-zinc-950/80 p-5 font-mono text-xs leading-relaxed backdrop-blur-xl sm:p-6">
          <div className="flex items-center gap-2 border-b border-white/10 pb-3 text-zinc-500">
            <Terminal size={14} className="text-violet-400" />
            terminal
          </div>
          <pre className="mt-4 overflow-x-auto text-zinc-300">
            <code>{`curl -H "Authorization: Bearer ap_live_…" \\
  https://archonpro.be/api/v1/facturen

{
  "resource": "facturen",
  "data": [ … ]
}`}</code>
          </pre>
        </div>
      }
    />
  );
}

function ResourceCards() {
  const cards = [
    {
      icon: BookOpen,
      title: "API-referentie",
      desc: "Overzicht van alle resources, authenticatie en response-formaat. Start bij het index-endpoint.",
      href: "/api/v1",
      external: true,
      label: "Open /api/v1",
    },
    {
      icon: KeyRound,
      title: "API-sleutels",
      desc: "Maak sleutels aan in je dashboard, kies scopes per resource en trek sleutels in wanneer nodig.",
      href: "/dashboard/instellingen",
      external: false,
      label: "Naar instellingen",
    },
    {
      icon: LifeBuoy,
      title: "Integratie-hulp",
      desc: "Vragen over Peppol, Billit of een maatwerk-koppeling? Ons team helpt je verder.",
      href: "mailto:support@archonpro.be",
      external: true,
      label: "Mail support",
    },
  ];

  return (
    <section className="relative py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium text-violet-400">Aan de slag</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl">
            Alles om te integreren
          </h2>
          <p className="mt-4 text-lg text-zinc-400">
            Geïnspireerd op developer-first platforms — documentatie, sleutels en
            support op één plek.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-3">
          {cards.map((card) => (
            <div
              key={card.title}
              className="flex flex-col rounded-2xl border border-white/10 bg-zinc-900/50 p-6 transition-colors hover:border-violet-500/30"
            >
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-violet-500/10 text-violet-400 ring-1 ring-inset ring-white/10">
                <card.icon size={20} />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-zinc-50">
                {card.title}
              </h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-zinc-400">
                {card.desc}
              </p>
              <Link
                href={card.href}
                target={card.external ? "_blank" : undefined}
                rel={card.external ? "noopener noreferrer" : undefined}
                className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-violet-300 transition-colors hover:text-violet-200"
              >
                {card.label}
                <ArrowRight size={14} />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Endpoints() {
  return (
    <section id="endpoints" className="relative py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium text-sky-400">v1 — read-only</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl">
            Beschikbare endpoints
          </h2>
          <p className="mt-4 text-lg text-zinc-400">
            Alle endpoints zijn GET-only. Data is altijd beperkt tot het bedrijf
            van je API-sleutel.
          </p>
        </div>

        <div className="mt-12 overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/50">
          <div className="grid grid-cols-[1fr_auto] gap-4 border-b border-white/10 px-5 py-3 text-xs font-medium uppercase tracking-wide text-zinc-500 sm:grid-cols-[140px_1fr_2fr]">
            <span className="hidden sm:block">Resource</span>
            <span>Pad</span>
            <span className="hidden sm:block">Beschrijving</span>
          </div>
          {API_RESOURCES.map((r) => (
            <div
              key={r.id}
              className="grid grid-cols-1 gap-1 border-b border-white/5 px-5 py-4 last:border-0 sm:grid-cols-[140px_1fr_2fr] sm:items-center sm:gap-4"
            >
              <span className="font-mono text-sm text-violet-300">{r.id}</span>
              <code className="text-sm text-zinc-200">{r.path}</code>
              <span className="text-sm text-zinc-400">{r.description}</span>
            </div>
          ))}
        </div>

        <p className="mt-6 text-center text-sm text-zinc-500">
          Paginering via{" "}
          <code className="rounded bg-white/5 px-1.5 py-0.5 text-zinc-300">
            ?limit=50&amp;offset=0
          </code>
          . Index:{" "}
          <Link
            href="/api/v1"
            className="text-sky-400 hover:text-sky-300"
            target="_blank"
            rel="noopener noreferrer"
          >
            /api/v1
          </Link>
        </p>
      </div>
    </section>
  );
}

function Quickstart() {
  return (
    <section className="relative py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
          <div>
            <p className="text-sm font-medium text-violet-400">Snelstart</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-50">
              Eerste request in vier stappen
            </h2>
            <ol className="mt-8 space-y-4">
              {quickstart.map((step, i) => (
                <li key={step} className="flex gap-4">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-violet-500/15 text-sm font-semibold text-violet-300 ring-1 ring-violet-500/25">
                    {i + 1}
                  </span>
                  <p className="pt-1 text-sm leading-relaxed text-zinc-300">
                    {step}
                  </p>
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-2xl border border-white/10 bg-zinc-950/80 p-5 sm:p-6">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Voorbeeld
            </p>
            <pre className="mt-4 overflow-x-auto font-mono text-xs leading-relaxed text-zinc-300">
              <code>{`# Offertes ophalen
curl -H "Authorization: Bearer ap_live_JOUW_SLEUTEL" \\
  "https://archonpro.be/api/v1/offertes?limit=25"

# Alternatief: x-api-key header
curl -H "x-api-key: ap_live_JOUW_SLEUTEL" \\
  https://archonpro.be/api/v1/klanten`}</code>
            </pre>
            <p className="mt-4 text-xs text-zinc-500">
              Vervang het domein door je eigen omgeving (lokaal of productie).
              De sleutel zie je één keer bij aanmaken — bewaar hem veilig.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function UseCases() {
  return (
    <section className="relative py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl">
            Waarvoor developers ArchonPro gebruiken
          </h2>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {useCases.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-white/10 bg-zinc-900/50 p-6"
            >
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400">
                <item.icon size={18} />
              </div>
              <h3 className="mt-4 text-base font-semibold text-zinc-100">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SupportCta() {
  return (
    <section className="relative py-12">
      <div className="mx-auto max-w-4xl px-6">
        <div className="rounded-3xl border border-white/10 bg-zinc-900/50 p-8 sm:p-10">
          <blockquote className="text-center">
            <p className="text-lg leading-relaxed text-zinc-300 sm:text-xl">
              “We koppelden onze interne planningstool aan ArchonPro via de API.
              Offertes en klanten stromen nu automatisch door — zonder dubbel
              werk op de werf.”
            </p>
            <footer className="mt-5 text-sm text-zinc-500">
              — Integratiepartner, bouw &amp; renovatie
            </footer>
          </blockquote>
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="relative overflow-hidden py-24">
      <div className="mx-auto max-w-4xl px-6">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/60 px-6 py-16 text-center sm:px-12">
          <div className="aurora-glow opacity-80" />
          <div className="relative z-10">
            <h2 className="text-balance text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl">
              Ga zelf aan de slag met de ArchonPro API
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-zinc-400">
              14 dagen gratis proberen. Maak daarna je eerste API-sleutel aan
              in het dashboard.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/register"
                className="group inline-flex items-center gap-2 rounded-full bg-violet-500 px-6 py-3 text-sm font-medium text-zinc-950 transition-colors hover:bg-violet-400"
              >
                Gratis dev-account
                <ArrowRight
                  size={16}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </Link>
              <Link
                href="/functies/integraties"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 px-6 py-3 text-sm font-medium text-zinc-200 transition-colors hover:bg-white/5"
              >
                Bekijk ook integraties
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
