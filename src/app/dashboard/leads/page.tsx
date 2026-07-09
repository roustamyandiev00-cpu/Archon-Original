import { getCompanyContext } from "@/lib/company";
import LeadsBoard, {
  type DealCard,
} from "@/components/dashboard/leads/LeadsBoard";
import CompanySetupCard from "@/components/werkposts/CompanySetupCard";

export const metadata = { title: "Leads / CRM — ArchonPro" };

export default async function LeadsPage() {
  const { supabase, user, companyId } = await getCompanyContext();

  if (!user || !companyId) {
    return (
      <div className="mx-auto max-w-lg py-8">
        <CompanySetupCard />
      </div>
    );
  }

  const { data } = await supabase
    .from("deals")
    .select("id, titel, stadium, waarde, kans, deadline")
    .eq("bedrijf_id", companyId)
    .order("created_at", { ascending: true });

  const deals = (data ?? []) as DealCard[];

  return <LeadsBoard initialDeals={deals} />;
}
