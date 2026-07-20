"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertTriangle, Plus, RefreshCw, UserPlus } from "lucide-react";
import ContactenDataTable, {
  CONTACT_COLUMN_OPTIONS,
  defaultContactColumnVisibility,
  type ContactColumnVisibility,
} from "@/components/dashboard/contacten/ContactenDataTable";
import KlantForm, { type KlantRecord } from "@/components/dashboard/contacten/KlantForm";
import { deleteKlant } from "@/app/dashboard/contacten/actions";
import DataPanelToolbar from "@/components/dashboard/DataPanelToolbar";
import { exportKlantenCsv } from "@/components/dashboard/table-exports";
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
  loadFailed = false,
  embedded = false,
}: {
  klanten: KlantRecord[];
  loadFailed?: boolean;
  embedded?: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<KlantRecord | null>(null);
  const [creating, setCreating] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);
  const [columnVisibility, setColumnVisibility] = useState<ContactColumnVisibility>(
    defaultContactColumnVisibility,
  );

  const eInvoiceIdCount = klanten.filter((klant) =>
    Boolean(klant.peppol_participant_id?.trim()),
  ).length;

  async function remove(id: number, naam: string) {
    if (!confirm(`Klant "${naam}" deactiveren?`)) return;
    setActionError(null);
    const result = await deleteKlant(id);
    if (result && "error" in result && result.error) {
      setActionError(
        "Het contact kon niet worden gedeactiveerd. Probeer het opnieuw.",
      );
      return;
    }
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
              Beheer klanten met contact-, adres- en facturatiegegevens.
            </p>
          </div>
        </header>
      )}

      <Card className="dashboard-data-panel flex h-full min-h-0 flex-col overflow-hidden border-white/10 bg-zinc-950/50">
        <CardHeader className="dashboard-data-panel-header gap-3 border-white/10 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-0.5">
            <CardTitle className="text-base font-semibold text-zinc-50">
              Klanten
            </CardTitle>
            <CardDescription className="dashboard-data-panel-desc max-w-xl text-sm leading-relaxed text-zinc-400">
              Beheer je klantenbestand en de gegevens voor offertes, facturen
              en e-facturatie.
            </CardDescription>
          </div>

          {loadFailed ? null : klanten.length === 0 ? (
            <Button
              type="button"
              variant="default"
              onClick={() => setCreating(true)}
            >
              <Plus size={15} />
              Nieuw contact
            </Button>
          ) : (
            <DataPanelToolbar
              showFilters={showFilters}
              onToggleFilters={() => setShowFilters((value) => !value)}
              columns={CONTACT_COLUMN_OPTIONS}
              columnVisibility={columnVisibility}
              onColumnVisibilityChange={(id, visible) =>
                setColumnVisibility((current) => ({ ...current, [id]: visible }))
              }
              onExport={() => exportKlantenCsv(klanten)}
              exportLabel="Exporteer contacten"
            >
              <Button
                type="button"
                variant="default"
                onClick={() => setCreating(true)}
              >
                <Plus size={15} />
                Nieuw contact
              </Button>
            </DataPanelToolbar>
          )}
        </CardHeader>

        <CardContent className="dashboard-data-panel-body flex min-h-0 flex-1 flex-col">
          {actionError && (
            <p
              role="alert"
              className="mb-3 rounded-lg border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-sm text-rose-300"
            >
              {actionError}
            </p>
          )}

          {loadFailed ? (
            <div
              role="alert"
              className="flex min-h-64 flex-1 flex-col items-center justify-center px-4 py-12 text-center"
            >
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-rose-500/10 text-rose-300">
                <AlertTriangle size={22} />
              </span>
              <h2 className="mt-4 text-base font-semibold text-zinc-100">
                Contacten laden is niet gelukt
              </h2>
              <p className="mt-1 max-w-sm text-sm leading-6 text-zinc-500">
                Je gegevens zijn niet gewijzigd. Probeer de pagina opnieuw te
                laden.
              </p>
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.refresh()}
                className="mt-5"
              >
                <RefreshCw size={15} />
                Opnieuw proberen
              </Button>
            </div>
          ) : klanten.length === 0 ? (
            <div className="flex min-h-64 flex-1 flex-col items-center justify-center px-4 py-12 text-center">
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-sky-500/10 text-sky-400">
                <UserPlus size={22} />
              </span>
              <h2 className="mt-4 text-base font-semibold text-zinc-100">
                Voeg je eerste contact toe
              </h2>
              <p className="mt-1 max-w-sm text-sm leading-6 text-zinc-500">
                Contactgegevens worden hergebruikt in offertes, projecten en
                facturen, zodat je ze maar één keer hoeft in te vullen.
              </p>
              <Button
                type="button"
                variant="default"
                onClick={() => setCreating(true)}
                className="mt-5"
              >
                <Plus size={15} />
                Eerste contact toevoegen
              </Button>
            </div>
          ) : (
            <>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <Badge variant="info">
                  {klanten.length.toLocaleString("nl-BE")} contacten
                </Badge>
                <Badge
                  variant={
                    eInvoiceIdCount === klanten.length ? "success" : "warning"
                  }
                >
                  {eInvoiceIdCount} e-facturatie-ID
                </Badge>
              </div>

              <div className="dashboard-table-area">
                <ContactenDataTable
                  klanten={klanten}
                  onEdit={setEditing}
                  onDelete={remove}
                  showFilters={showFilters}
                  columnVisibility={columnVisibility}
                />
              </div>
            </>
          )}
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
