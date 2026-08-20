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
    <section
      id="inbox"
      className="relative border-b border-white/[0.08] bg-[#071526] py-16 sm:py-20 lg:py-24"
    >
      <div className="mx-auto max-w-[90rem] px-4 sm:px-6 lg:px-10">
        <div className="grid items-start gap-10 rounded-2xl border border-white/[0.09] bg-[#081320] p-5 shadow-[0_24px_72px_rgba(0,0,0,0.2)] sm:p-8 lg:grid-cols-[minmax(0,0.86fr)_minmax(0,1.14fr)] lg:items-center lg:gap-14 lg:p-10">
          <div className="order-2 lg:order-1">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-300">
              AI-crew · Actie-inbox
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.025em] text-white sm:text-4xl">
              Jouw AI-team.
              <span className="mt-1 block text-sky-300 sm:mt-0 sm:inline">
                {" "}
                Jij houdt de controle.
              </span>
            </h2>
            <p className="mt-5 text-base leading-7 text-slate-400 sm:text-lg">
              Geen chatbot die antwoordt en stopt. ArchonPro zet gespecialiseerde
              AI-agents in die je bedrijf volgen, concrete acties voorbereiden en
              wachten op jouw goedkeuring — alsof je een assistent hebt die alles
              al klaarzet.
            </p>

            <div className="mt-7 space-y-5 border-l border-sky-300/20 pl-5 sm:mt-8">
              {steps.map((step) => (
                <div key={step.title} className="flex gap-3">
                  <span className="-ml-[2.65rem] grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-sky-300/25 bg-[#0b2035] text-sky-300 shadow-[0_0_0_4px_#081320]">
                    <step.icon size={16} strokeWidth={1.7} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-100">
                      {step.title}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-400">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <ul className="mt-7 grid gap-3 border-t border-white/[0.08] pt-6 sm:mt-8 sm:grid-cols-2">
              {features.map((t) => (
                <li key={t} className="flex items-start gap-3 text-sm text-slate-300">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border border-sky-300/25 bg-sky-400/[0.08] text-[10px] text-sky-300">
                    <ShieldCheck size={11} />
                  </span>
                  {t}
                </li>
              ))}
            </ul>

            <p className="mt-6 flex items-center gap-2 text-sm text-slate-500">
              <ImageIcon size={14} className="shrink-0 text-orange-300" />
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
