import AutomationShowcase from "@/components/AutomationShowcase";

export default function Realtime() {
  return (
    <section id="inbox" className="section-tint-alt relative py-24">
      <div aria-hidden className="section-edge" />
      <div className="panel-soft-lg mx-auto max-w-6xl px-6">
        <div className="grid items-center gap-14 lg:grid-cols-2">
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

        <AutomationShowcase />
        </div>
      </div>
    </section>
  );
}
