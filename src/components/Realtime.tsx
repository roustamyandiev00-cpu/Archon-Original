import AutomationShowcase from "@/components/AutomationShowcase";
import { Bot, ImageIcon, ShieldCheck, Workflow } from "lucide-react";

const steps = [
  {
    icon: Bot,
    title: "Agents monitoren je bedrijf",
    description:
      "Ela, Scout en Pulse scannen offertes, facturen en leads — 24/7 op de achtergrond.",
  },
  {
    icon: Workflow,
    title: "Ze bereiden acties voor",
    description:
      "Opvolgmails, WhatsApp-berichten en betalingsherinneringen worden klaargezet ter goedkeuring.",
  },
  {
    icon: ShieldCheck,
    title: "Jij beslist met één klik",
    description:
      "Goedkeuren, Bewerken of Afwijzen. Niets gaat de deur uit zonder jouw OK.",
  },
];

const features = [
  "Elke agent met eigen naam, rol en taken",
  "Kies een avatar-foto uit 10 gezichten",
  "Offertes, facturen, leads en planning in één crew",
  "Meldingen via e-mail, gsm of Slack",
];

export default function Realtime() {
  return (
    <section id="inbox" className="section-tint-alt relative py-14 sm:py-20 lg:py-24">
      <div aria-hidden className="section-edge" />
      <div className="panel-soft-lg mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid items-start gap-8 lg:grid-cols-2 lg:items-center lg:gap-14">
          <div className="order-2 lg:order-1">
            <p className="text-sm font-medium text-sky-400">AI-crew · Actie-inbox</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl lg:text-4xl">
              Jouw AI-team.
              <span className="mt-1 block text-zinc-400 sm:mt-0 sm:inline">
                {" "}
                Jij houdt de controle.
              </span>
            </h2>
            <p className="mt-4 text-base leading-relaxed text-zinc-400 sm:text-lg">
              Geen chatbot die antwoordt en stopt. ArchonPro zet gespecialiseerde
              AI-agents in die je bedrijf volgen, concrete acties voorbereiden en
              wachten op jouw goedkeuring — alsof je een assistent hebt die alles
              al klaarzet.
            </p>

            <div className="mt-6 space-y-4 sm:mt-8">
              {steps.map((step) => (
                <div key={step.title} className="flex gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-sky-500/20 bg-sky-500/10 text-sky-400">
                    <step.icon size={16} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-zinc-200">
                      {step.title}
                    </p>
                    <p className="mt-0.5 text-sm leading-relaxed text-zinc-500">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <ul className="mt-6 space-y-2.5 sm:mt-8 sm:space-y-3">
              {features.map((t) => (
                <li key={t} className="flex items-start gap-3 text-sm text-zinc-300 sm:text-base">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-sky-500/15 text-xs text-sky-400">
                    ✓
                  </span>
                  {t}
                </li>
              ))}
            </ul>

            <p className="mt-5 flex items-center gap-2 text-sm text-zinc-500 sm:mt-6">
              <ImageIcon size={14} className="shrink-0 text-violet-400" />
              <span className="lg:hidden">
                Personaliseer elke agent met een eigen gezicht — probeer het
                hierboven.
              </span>
              <span className="hidden lg:inline">
                Personaliseer elke agent met een eigen gezicht — probeer het
                rechts.
              </span>
            </p>
          </div>

          <div className="order-1 lg:order-2">
            <AutomationShowcase />
          </div>
        </div>
      </div>
    </section>
  );
}
