import { getCompanyContext } from "@/lib/company";
import ContactenView from "@/components/dashboard/contacten/ContactenView";
import type { KlantRecord } from "@/components/dashboard/contacten/KlantForm";
import { NoCompanyNotice } from "@/components/dashboard/mission";

export const metadata = { title: "Contacten — ArchonPro" };

export default async function ContactenPage() {
  const { supabase, companyId } = await getCompanyContext();

  if (!companyId) {
    return (
      <div className="mx-auto max-w-6xl">
        <NoCompanyNotice />
      </div>
    );
  }

  const { data } = await supabase
    .from("customers")
    .select(
      "id, contact_type, name, company_name, first_name, last_name, email, phone, address, postcode, city, country, ondernemingsnummer, kvk, btw, peppol_participant_id, notes",
    )
    .eq("company_id", companyId)
    .eq("is_active", true)
    .order("name", { ascending: true });

  const klanten = (data ?? []) as KlantRecord[];

  return <ContactenView klanten={klanten} />;
}
