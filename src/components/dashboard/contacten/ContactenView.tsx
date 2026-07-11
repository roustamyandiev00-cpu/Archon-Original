"use client";

import { useState } from "react";
import { ArrowLeft, MessageSquarePlus } from "lucide-react";
import ContactForm from "@/components/dashboard/ContactForm";
import KlantenPanel from "@/components/dashboard/contacten/KlantenPanel";
import type { KlantRecord } from "@/components/dashboard/contacten/KlantForm";
import { Button } from "@/components/ui/button";

export default function ContactenView({ klanten }: { klanten: KlantRecord[] }) {
  const [showIntake, setShowIntake] = useState(false);

  if (showIntake) {
    return (
      <div className="space-y-4">
        <Button
          type="button"
          variant="ghost"
          onClick={() => setShowIntake(false)}
          className="gap-2 text-zinc-400 hover:text-zinc-100"
        >
          <ArrowLeft size={16} />
          Terug naar contacten
        </Button>
        <ContactForm />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-3xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
            Operatie / Contacten
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl">
            Contacten
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">
            Beheer klanten met adres- en Peppol-gegevens voor e-facturatie.
          </p>
        </div>
        <Button type="button" variant="default" onClick={() => setShowIntake(true)}>
          <MessageSquarePlus size={15} />
          Nieuw contact
        </Button>
      </header>

      <KlantenPanel klanten={klanten} embedded />
    </div>
  );
}
