"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

type FaqItem = { q: string; a: string };

const defaultItems: FaqItem[] = [
  {
    q: "Moet ik perfect spreken zodat Lima het begrijpt?",
    a: "Nee. Lima is getraind op bouwjargon: afkortingen, vaktermen en benaderingen. Spreek zoals tegen een collega op de werf — ze begrijpt je zelfs via WhatsApp.",
  },
  {
    q: "Kan ik een offerte maken via spraakherkenning?",
    a: "Ja. Dicteer je werken hardop vanaf je gsm. Lima transcribeert, structureert en genereert een volledige offerte in minder dan een minuut — ook met werfjargon of ruwe schattingen.",
  },
  {
    q: "Welke formaten kan de AI lezen?",
    a: "Spraaknotities, vrije tekst, foto's van handgeschreven notities, meetstaten en PDF's. Wat het formaat ook is — Lima analyseert en structureert de inhoud automatisch tot een professionele offerte.",
  },
  {
    q: "Werkt de AI voor alle vakgebieden?",
    a: "Ja. Elektricien, loodgieter, schilder, metselaar, tegelzetter, dakdekker, schrijnwerker, gipsplaatser, verwarmingstechnicus en alle vakken — Lima kent de terminologie en prestaties van elk beroep.",
  },
  {
    q: "Kan ik een offerte automatisch omzetten in een factuur?",
    a: "Ja. Een goedgekeurde offerte wordt met één klik een factuur, met behoud van alle werklijnen, voorschotten en wettelijke vermeldingen. Conform e-facturatie via Peppol.",
  },
];

export default function Faq({
  items = defaultItems,
  title = "Veelgestelde vragen",
}: {
  items?: FaqItem[];
  title?: string;
}) {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section id="faq" className="relative py-24">
      <div className="mx-auto max-w-3xl px-6">
        <div className="text-center">
          <p className="text-sm font-medium text-sky-400">FAQ</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl">
            {title}
          </h2>
        </div>

        <div className="mt-12 space-y-3">
          {items.map((item, i) => {
            const isOpen = openIdx === i;
            return (
              <div
                key={item.q}
                className="rounded-2xl border border-white/10 bg-zinc-900/50"
              >
                <button
                  onClick={() => setOpenIdx(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <span className="text-sm font-medium text-zinc-100 sm:text-base">
                    {item.q}
                  </span>
                  <ChevronDown
                    size={18}
                    className={`shrink-0 text-sky-400 transition-transform ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <p className="px-5 pb-5 text-sm leading-relaxed text-zinc-400">
                    {item.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
