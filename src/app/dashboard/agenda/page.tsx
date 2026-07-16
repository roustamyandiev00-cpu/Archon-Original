import { CalendarDays } from "lucide-react";
import { getCompanyContext } from "@/lib/company";
import { PageHeader, NoCompanyNotice } from "@/components/dashboard/mission";
import ModuleWipBanner from "@/components/dashboard/ModuleWipBanner";
import AgendaManager, {
  type AgendaAfspraak,
} from "@/components/dashboard/agenda/AgendaManager";

export const metadata = { title: "Agenda — ArchonPro" };

export default async function AgendaPage() {
  const { supabase, companyId } = await getCompanyContext();

  if (!companyId) {
    return (
      <div className="mx-auto max-w-6xl">
        <NoCompanyNotice />
      </div>
    );
  }

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

  return (
    <div className="mx-auto max-w-[1100px] space-y-5">
      <ModuleWipBanner
        moduleId="agenda"
        title="Agenda is nog in ontwikkeling"
        description="Je kan afspraken al bekijken en beheren. Extra planningfuncties volgen. Verberg dit bericht als je wilt."
      />
      <PageHeader
        icon={<CalendarDays size={20} />}
        title="Agenda"
        description="Plan werfbezoeken, overleggen en interne afspraken."
      />
      {error ? (
        <p className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-200">
          Agenda kon niet worden geladen: {error.message}
        </p>
      ) : (
        <AgendaManager afspraken={afspraken} />
      )}
    </div>
  );
}
