import { getCompanyContext } from "@/lib/company";
import { isActivePreviewMode } from "@/components/dashboard/context";
import { DemoBadge } from "@/components/dashboard/mission";
import LeadsBoard, {
  type DealCard,
} from "@/components/dashboard/leads/LeadsBoard";
import CompanySetupCard from "@/components/werkposts/CompanySetupCard";
import { DEMO_LEADS } from "@/lib/demo";
import { showDemoData } from "@/lib/demo-mode";

export const metadata = { title: "Leads / CRM — ArchonPro" };

export default async function LeadsPage() {
  const preview = await isActivePreviewMode();
  const { supabase, user, companyId } = await getCompanyContext();

  if (!preview && (!user || !companyId)) {
    return (
      <div className="mx-auto max-w-lg py-8">
        <CompanySetupCard />
      </div>
    );
  }

  let deals: DealCard[] = [];
  let isDemo = preview;

  if (companyId) {
    const { data } = await supabase
      .from("deals")
      .select(
        "id, titel, stadium, waarde, kans, deadline, contactpersoon, telefoon, email, notitie",
      )
      .eq("bedrijf_id", companyId)
      .order("created_at", { ascending: true });

    deals = (data ?? []) as DealCard[];
    isDemo = showDemoData(preview, deals.length === 0);
  }

  if (isDemo) deals = DEMO_LEADS;

  return (
    <div className="space-y-4">
      {isDemo && (
        <div className="flex justify-end">
          <DemoBadge />
        </div>
      )}
      <LeadsBoard initialDeals={deals} />
    </div>
  );
}
