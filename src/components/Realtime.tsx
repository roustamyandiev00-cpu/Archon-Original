import { Mail, TrendingUp, BellRing } from "lucide-react";

const alerts = [
  {
    icon: Mail,
    tone: "text-sky-400",
    time: "2 u geleden",
    title: "5 offertes wachten op reactie",
    body: "Van Dijck Bouw reageerde nog niet. Zal ik een opvolgmail voorstellen?",
    actions: true,
  },
  {
    icon: TrendingUp,
    tone: "text-emerald-400",
    time: "52 min geleden",
    title: "Warme lead gedetecteerd",
    body: "Nieuwe aanvraag scoort hoog — reageer snel voor de beste kans.",
  },
  {
    icon: BellRing,
    tone: "text-rose-400",
    time: "Zonet",
    title: "Factuur 8 dagen te laat",
    body: "€ 2.487,92 openstaand bij De Smet Sanitair. Herinnering klaar.",
    actions: true,
  },
];

export default function Realtime() {
  return (
    <section id="inbox" className="relative py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-14 px-6 lg:grid-cols-2">
        <div>
          <p className="text-sm font-medium text-sky-400">Actie-inbox</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl">
            Geen chatbot. Wel concrete tips.
          </h2>
          <p className="mt-4 text-lg text-zinc-400">
            ArchonPro houdt je bedrijf in de gaten en zet klaar wat er moet
            gebeuren: welke offerte opvolgen, welke factuur herinneren, welke
            lead bellen. Jij beslist met één klik — Goedkeuren, Afwijzen of
            Bewerken.
          </p>

          <ul className="mt-8 space-y-3">
            {[
              "Slimme opvolging van offertes",
              "Automatische factuurherinneringen",
              "Meldingen via e-mail, gsm of Slack",
            ].map((t) => (
              <li key={t} className="flex items-center gap-3 text-zinc-300">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-sky-500/15 text-sky-400">
                  ✓
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative">
          <div className="aurora-glow opacity-60" />
          <div className="relative z-10 space-y-3">
            {alerts.map((a) => (
              <div
                key={a.title}
                className="rounded-2xl border border-white/10 bg-zinc-900/70 p-4 backdrop-blur-xl"
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/5 ${a.tone}`}
                  >
                    <a.icon size={17} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-zinc-500">
                        ArchonPro · {a.time}
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm font-medium text-zinc-100">
                      {a.title}
                    </p>
                    <p className="mt-0.5 text-sm text-zinc-400">{a.body}</p>
                    {a.actions && (
                      <div className="mt-3 flex gap-2">
                        <button className="rounded-lg bg-sky-500 px-3 py-1.5 text-xs font-medium text-zinc-950 hover:bg-sky-400">
                          Goedkeuren
                        </button>
                        <button className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-zinc-300 hover:bg-white/5">
                          Afwijzen
                        </button>
                        <button className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-zinc-300 hover:bg-white/5">
                          Bewerken
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
