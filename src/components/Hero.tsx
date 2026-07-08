import { ArrowRight, Sparkles, FileText, Receipt, Users } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative overflow-hidden pt-40 pb-24 sm:pt-48">
      <div className="aurora-glow" />
      <div className="grid-fade absolute inset-0" />

      <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
        <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300">
          <Sparkles size={14} className="text-sky-400" />
          Nieuw: AI die je offertes en facturen opvolgt
        </div>

        <h1 className="text-balance text-4xl font-semibold leading-tight tracking-tight text-zinc-50 sm:text-6xl">
          Beheer je bouwbedrijf{" "}
          <span className="text-gradient">zonder gedoe</span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-8 text-zinc-400">
          Offertes, projecten, klanten en facturen op één plek. Geen losse
          WhatsApp-berichten of Excel-lijsten meer. Simpel. Snel. En nooit saai.
        </p>

        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a
            href="#start"
            className="group inline-flex items-center gap-2 rounded-full bg-sky-500 px-6 py-3 text-sm font-medium text-zinc-950 transition-colors hover:bg-sky-400"
          >
            Start gratis
            <ArrowRight
              size={16}
              className="transition-transform group-hover:translate-x-0.5"
            />
          </a>
          <a
            href="#features"
            className="inline-flex items-center gap-2 rounded-full border border-white/15 px-6 py-3 text-sm font-medium text-zinc-200 transition-colors hover:bg-white/5"
          >
            Bekijk demo
          </a>
        </div>

        <p className="mt-5 text-xs text-zinc-500">
          Gratis starten · Geen creditcard · Werkt op je gsm
        </p>
      </div>

      <HeroCard />
    </section>
  );
}

function HeroCard() {
  return (
    <div className="relative z-10 mx-auto mt-16 max-w-5xl px-6">
      <div className="rounded-3xl border border-white/10 bg-zinc-900/60 p-2 shadow-2xl shadow-sky-500/10 backdrop-blur-xl">
        <div className="rounded-2xl border border-white/5 bg-zinc-950/80 p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm text-zinc-400">Gefactureerd deze maand</p>
              <p className="mt-1 text-3xl font-semibold text-zinc-50">
                € 42.980
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
              <Receipt size={13} /> 12 facturen verstuurd
            </span>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <StatCard
              icon={<FileText size={16} />}
              label="Openstaande offertes"
              value="8"
              hint="3 wachten op reactie"
            />
            <StatCard
              icon={<Receipt size={16} />}
              label="Te innen"
              value="€ 6.240"
              hint="2 herinneringen klaar"
            />
            <StatCard
              icon={<Users size={16} />}
              label="Actieve klanten"
              value="34"
              hint="+5 deze maand"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.03] p-4 text-left">
      <div className="flex items-center gap-2 text-zinc-400">
        <span className="text-sky-400">{icon}</span>
        <span className="text-sm">{label}</span>
      </div>
      <p className="mt-2 text-xl font-semibold text-zinc-50">{value}</p>
      <p className="mt-0.5 text-xs text-zinc-500">{hint}</p>
    </div>
  );
}
