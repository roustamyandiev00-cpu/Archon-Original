"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Cog,
  Download,
  EyeOff,
  Plus,
  SlidersHorizontal,
} from "lucide-react";
import ContactenDataTable from "@/components/dashboard/contacten/ContactenDataTable";
import KlantForm, { type KlantRecord } from "@/components/dashboard/contacten/KlantForm";
import { deleteKlant } from "@/app/dashboard/contacten/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function KlantenPanel({
  klanten,
  embedded = false,
}: {
  klanten: KlantRecord[];
  embedded?: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<KlantRecord | null>(null);
  const [creating, setCreating] = useState(false);
  const [showFilters, setShowFilters] = useState(true);

  const peppolReadyCount = klanten.filter(
    (k) => k.peppol_participant_id || k.btw || k.ondernemingsnummer,
  ).length;

  async function remove(id: number, naam: string) {
    if (!confirm(`Klant "${naam}" deactiveren?`)) return;
    await deleteKlant(id);
    router.refresh();
  }

  return (
    <div className={embedded ? "dashboard-page-content h-full" : "space-y-6"}>
      {!embedded && (
        <header className="flex flex-col gap-4 border-b border-white/10 pb-6 lg:flex-row lg:items-end lg:justify-between">
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
        </header>
      )}

      <Card className="dashboard-data-panel overflow-hidden border-white/10 bg-zinc-950/50">
        <CardHeader className="dashboard-data-panel-header gap-3 border-white/10 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-0.5">
            <CardTitle className="text-base font-semibold text-zinc-50">
              Klanten
            </CardTitle>
            <CardDescription className="dashboard-data-panel-desc max-w-xl text-sm leading-relaxed text-zinc-400">
              Beheer je klantenbestand, Peppol-gegevens en toegang voor
              offertes en e-facturatie.
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            <Button
              type="button"
              variant="ghost"
              aria-label={showFilters ? "Filters verbergen" : "Filters tonen"}
              onClick={() => setShowFilters((value) => !value)}
            >
              {showFilters ? <EyeOff size={15} /> : <SlidersHorizontal size={15} />}
              <span className="hidden sm:inline">
                {showFilters ? "Hide" : "Filters"}
              </span>
            </Button>
            <Button type="button" variant="ghost" aria-label="Kolommen aanpassen">
              <Cog size={15} />
              <span className="hidden sm:inline">Customize</span>
            </Button>
            <Button type="button" variant="ghost" aria-label="Exporteer contacten">
              <Download size={15} />
              <span className="hidden sm:inline">Export</span>
            </Button>
            <Button
              type="button"
              variant="default"
              onClick={() => setCreating(true)}
            >
              <Plus size={15} />
              Nieuwe klant
            </Button>
          </div>
        </CardHeader>

        <CardContent className="dashboard-data-panel-body">
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Badge variant="info">
              {klanten.length.toLocaleString("nl-BE")} contacten
            </Badge>
            <Badge variant={peppolReadyCount === klanten.length ? "success" : "warning"}>
              {peppolReadyCount} Peppol klaar
            </Badge>
          </div>

          <div className="dashboard-table-area">
            <ContactenDataTable
              klanten={klanten}
              onEdit={setEditing}
              onDelete={remove}
              showFilters={showFilters}
            />
          </div>
        </CardContent>
      </Card>

      {(creating || editing) && (
        <KlantForm
          klant={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={() => router.refresh()}
        />
      )}
    </div>
  );
}
