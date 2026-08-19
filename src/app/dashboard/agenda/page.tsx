import { CalendarDays } from "lucide-react";
import { getCompanyContext } from "@/lib/company";
import { PageHeader, NoCompanyNotice } from "@/components/dashboard/mission";
import AgendaManager, {
  type AgendaAfspraak,
} from "@/components/dashboard/agenda/AgendaManager";

export const metadata = { title: "Agenda — ArchonPro" };

async function loadAgendaAfspraken(
  supabase: Awaited<ReturnType<typeof getCompanyContext>>["supabase"],
  companyId: number,
): Promise<{
  afspraken: AgendaAfspraak[];
  error: { message: string } | null;
  nowMs: number;
}> {
  const nowMs = Date.now();
  const { data, error } = await supabase
    .from("afspraken")
    .select(
      "id, titel, beschrijving, locatie, start_tijd, eind_tijd, status, type",
    )
    .eq("bedrijf_id", companyId)
    .order("start_tijd", { ascending: true })
    .limit(200);

  const afspraken: AgendaAfspraak[] = (data ?? []).map((row) => ({
    id: row.id,
    titel: row.titel,
    beschrijving: row.beschrijving,
    locatie: row.locatie,
    startTijd: row.start_tijd,
    eindTijd: row.eind_tijd,
    status: row.status,
    type: row.type,
  }));

  return { afspraken, error: error ? { message: error.message } : null, nowMs };
}

export default async function AgendaPage() {
  const { supabase, companyId } = await getCompanyContext();

  if (!companyId) {
    return (
      <div className="mx-auto max-w-6xl">
        <NoCompanyNotice />
      </div>
    );
  }

  const { afspraken, error, nowMs } = await loadAgendaAfspraken(
    supabase,
    companyId,
  );

  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-[1160px] flex-col gap-5">
      <PageHeader
        icon={<CalendarDays size={20} />}
        title="Agenda"
        description="Plan werfbezoeken, overleggen en interne afspraken. Exporteer afspraken naar Google Calendar of verbind je Google Agenda via Integraties."
      />
      {error ? (
        <p className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-200">
          Agenda kon niet worden geladen: {error.message}
        </p>
      ) : (
        <div className="min-h-0 flex-1">
          <AgendaManager afspraken={afspraken} nowMs={nowMs} />
        </div>
      )}
    </div>
  );
}
