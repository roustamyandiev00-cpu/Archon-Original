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
    <div className="dashboard-page flex h-full min-h-0 flex-col gap-2 lg:gap-0">
      <header className="dashboard-page-header flex shrink-0 flex-col gap-2 border-b border-white/10 pb-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
            Operatie / Contacten
          </p>
          <h1 className="mt-0.5 text-xl font-semibold tracking-tight text-zinc-50">
            Contacten
          </h1>
          <p className="mt-1 hidden text-sm text-zinc-400 sm:block lg:hidden xl:block">
            Beheer klanten met adres- en Peppol-gegevens voor e-facturatie.
          </p>
        </div>
        <Button type="button" variant="default" onClick={() => setShowIntake(true)}>
          <MessageSquarePlus size={15} />
          Nieuw contact
        </Button>
      </header>

      <div className="dashboard-page-content">
        <KlantenPanel klanten={klanten} embedded />
      </div>
    </div>
  );
}
