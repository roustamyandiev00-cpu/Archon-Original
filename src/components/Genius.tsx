import { Sparkles, TrendingUp } from "lucide-react";

const stats = [
  { value: "5 min", label: "Gemiddeld per offerte i.p.v. 2 uur handwerk" },
  { value: "2× sneller", label: "Betaald dankzij automatische herinneringen" },
  { value: "3 u / week", label: "Bespaarde administratie per week" },
];

export default function Genius() {
  return (
    <section id="resultaten" className="relative py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium text-sky-400">Resultaten</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl">
            Minder administratie, meer afgewerkte projecten
          </h2>
          <p className="mt-4 text-lg text-zinc-400">
            Concrete resultaten van vakmensen die met ArchonPro werken.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-3">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-white/10 bg-zinc-900/50 p-6 text-center"
            >
              <p className="text-3xl font-semibold text-gradient">{s.value}</p>
              <p className="mt-2 text-sm text-zinc-400">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          {/* AI-assistent */}
          <div className="rounded-3xl border border-white/10 bg-zinc-900/50 p-6 sm:p-8">
            <div className="flex items-center gap-2 text-zinc-400">
              <Sparkles size={16} className="text-sky-400" />
              <span className="text-sm">ArchonPro AI stelt voor</span>
            </div>

            <div className="mt-6 space-y-3">
              <div className="ml-auto w-fit max-w-[80%] rounded-2xl rounded-br-sm bg-sky-500 px-4 py-2.5 text-sm text-zinc-950">
                Van Dijck Bouw reageerde nog niet op offerte #1042.
              </div>
              <div className="w-fit max-w-[85%] rounded-2xl rounded-bl-sm border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-zinc-200">
                Ik zet een vriendelijke opvolgmail klaar met de offerte in
                bijlage. Versturen op dinsdag 9u? <b>Goedkeuren</b> of{" "}
                <b>Bewerken</b>.
              </div>
            </div>

            <div className="mt-6 flex items-center gap-2 rounded-full border border-white/10 bg-zinc-950/60 px-4 py-2.5">
              <Sparkles size={16} className="text-sky-400" />
              <input
                disabled
                placeholder="Vraag ArchonPro…"
                className="w-full bg-transparent text-sm text-zinc-300 outline-none placeholder:text-zinc-500"
              />
            </div>
          </div>

          {/* Omzet-overzicht */}
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/50 p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-zinc-400">
                <TrendingUp size={16} className="text-sky-400" />
                <span className="text-sm">Omzet dit jaar</span>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
                +18% t.o.v. vorig jaar
              </span>
            </div>

            <p className="mt-4 text-3xl font-semibold text-zinc-50">€ 312.450</p>
            <p className="mt-1 text-sm text-zinc-400">
              Op koers voor je beste jaar tot nu toe.
            </p>

            <Sparkline />
          </div>
        </div>
      </div>
    </section>
  );
}

function Sparkline() {
  return (
    <div className="mt-6">
      <svg viewBox="0 0 320 90" className="h-24 w-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="fillGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M0 70 L40 60 L80 65 L120 45 L160 50 L200 30 L240 38 L280 18 L320 24 L320 90 L0 90 Z"
          fill="url(#fillGrad)"
        />
        <path
          d="M0 70 L40 60 L80 65 L120 45 L160 50 L200 30 L240 38 L280 18 L320 24"
          fill="none"
          stroke="#38bdf8"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
