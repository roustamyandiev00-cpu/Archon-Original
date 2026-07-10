import { getCompanyContext } from "@/lib/company";
import { isActivePreviewMode } from "@/components/dashboard/context";
import { DemoBadge } from "@/components/dashboard/mission";
import LeadsBoard, {
  type DealCard,
  type KlantOption,
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
  let klanten: KlantOption[] = [];
  let isDemo = preview;

  if (companyId) {
    const [{ data: dealRows }, { data: customerRows }] = await Promise.all([
      supabase
        .from("deals")
        .select(
          "id, titel, stadium, waarde, kans, deadline, contactpersoon, telefoon, email, notitie, customer_id, customers(name, company_name)",
        )
        .eq("bedrijf_id", companyId)
        .order("created_at", { ascending: true }),
      supabase
        .from("customers")
        .select("id, name, company_name, email, phone")
        .eq("company_id", companyId)
        .eq("is_active", true)
        .order("name", { ascending: true }),
    ]);

    klanten = (customerRows ?? []) as KlantOption[];
    deals = (dealRows ?? []).map((row) => {
      const customer = row.customers as
        | { name: string; company_name: string | null }
        | null
        | undefined;
      return {
        id: row.id,
        titel: row.titel,
        stadium: row.stadium,
        waarde: row.waarde,
        kans: row.kans,
        deadline: row.deadline,
        contactpersoon: row.contactpersoon,
        telefoon: row.telefoon,
        email: row.email,
        notitie: row.notitie,
        customer_id: row.customer_id,
        customerName: customer
          ? customer.company_name
            ? `${customer.name} (${customer.company_name})`
            : customer.name
          : null,
      } satisfies DealCard;
    });
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
      <LeadsBoard initialDeals={deals} klanten={klanten} />
    </div>
  );
}
