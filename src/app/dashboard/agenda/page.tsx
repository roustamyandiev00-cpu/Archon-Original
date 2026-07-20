import { CalendarDays } from "lucide-react";
import { isActivePreviewMode } from "@/components/dashboard/context";
import { getCompanyContext } from "@/lib/company";
import { DEMO_AFSPRAKEN } from "@/lib/demo";
import { showDemoData } from "@/lib/demo-mode";
import {
  PageHeader,
  NoCompanyNotice,
  DemoBadge,
} from "@/components/dashboard/mission";
import ModuleWipBanner from "@/components/dashboard/ModuleWipBanner";
import AgendaManager, {
  type AgendaAfspraak,
} from "@/components/dashboard/agenda/AgendaManager";
import { loadGoogleCalendarConnection } from "@/components/dashboard/agenda/googleCalendar";

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
  const preview = await isActivePreviewMode();
  const { supabase, companyId } = await getCompanyContext();

  let afspraken: AgendaAfspraak[] = [];
  let error: { message: string } | null = null;
  // eslint-disable-next-line react-hooks/purity -- async Server Component, not a render function
  const nowMs = Date.now();
  let googleCalendar = null as Awaited<
    ReturnType<typeof loadGoogleCalendarConnection>
  > | null;

  if (companyId) {
    const loaded = await loadAgendaAfspraken(supabase, companyId);
    afspraken = loaded.afspraken;
    error = loaded.error;
    googleCalendar = await loadGoogleCalendarConnection(supabase, companyId);
  }

  const isDemo = showDemoData(preview, afspraken.length === 0);
  if (isDemo) {
    afspraken = DEMO_AFSPRAKEN;
    error = null;
  }

  if (!companyId && !preview) {
    return (
      <div className="mx-auto max-w-6xl">
        <NoCompanyNotice />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1100px] space-y-5">
      <ModuleWipBanner
        moduleId="agenda"
        title="Agenda is nog in ontwikkeling"
        description="Je kan afspraken al bekijken en beheren. Extra planningfuncties volgen. Verberg dit bericht als je wilt."
      />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeader
          icon={<CalendarDays size={20} />}
          title="Agenda"
          description="Plan werfbezoeken, overleggen en interne afspraken."
        />
        {isDemo && <DemoBadge />}
      </div>
      {error ? (
        <div
          role="alert"
          className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-200"
        >
          <p>De agenda kon niet worden geladen. Je gegevens zijn niet gewijzigd.</p>
          <p className="mt-1 text-xs text-rose-200/80">
            Vernieuw de pagina of probeer het later opnieuw.
          </p>
        </div>
      ) : (
        <AgendaManager
          afspraken={afspraken}
          nowMs={nowMs}
          googleCalendar={googleCalendar}
        />
      )}
    </div>
  );
}
