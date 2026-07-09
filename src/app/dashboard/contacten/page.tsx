import { getCompanyContext } from "@/lib/company";
import KlantenPanel from "@/components/dashboard/contacten/KlantenPanel";
import PlaceholderPage from "@/components/dashboard/PlaceholderPage";
import { Users } from "lucide-react";

export const metadata = { title: "Contacten — ArchonPro" };

export default async function ContactenPage() {
  const { supabase, companyId } = await getCompanyContext();

  if (!companyId) {
    return (
      <PlaceholderPage
        title="Contacten"
        description="Beheer je klanten en contactgegevens."
        icon={<Users size={20} />}
        features={["Geen actief bedrijf gevonden voor je account."]}
      />
    );
  }

  const { data } = await supabase
    .from("customers")
    .select(
      "id, name, company_name, first_name, last_name, email, phone, address, postcode, city, country, ondernemingsnummer, kvk, btw, peppol_participant_id, notes",
    )
    .eq("company_id", companyId)
    .eq("is_active", true)
    .order("name");

  return (
    <div className="py-2">
      <KlantenPanel klanten={data ?? []} />
    </div>
  );
}
