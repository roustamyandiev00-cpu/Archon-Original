import { isActivePreviewMode } from "@/components/dashboard/context";
import { getCompanyContext } from "@/lib/company";
import { DEMO_KLANTEN } from "@/lib/demo";
import { showDemoData } from "@/lib/demo-mode";
import ContactenView from "@/components/dashboard/contacten/ContactenView";
import type { KlantRecord } from "@/components/dashboard/contacten/KlantForm";
import { DemoBadge, NoCompanyNotice } from "@/components/dashboard/mission";

export const metadata = { title: "Contacten — ArchonPro" };

export default async function ContactenPage() {
  const preview = await isActivePreviewMode();
  const { supabase, companyId } = await getCompanyContext();

  let klanten: KlantRecord[] = [];
  let loadFailed = false;

  if (companyId) {
    const { data, error } = await supabase
      .from("customers")
      .select(
        "id, contact_type, name, company_name, first_name, last_name, email, phone, address, postcode, city, country, ondernemingsnummer, kvk, btw, peppol_participant_id, notes",
      )
      .eq("company_id", companyId)
      .eq("is_active", true)
      .order("name", { ascending: true });

    loadFailed = Boolean(error);
    klanten = (data ?? []) as KlantRecord[];
  }

  const isDemo = !loadFailed && showDemoData(preview, klanten.length === 0);
  if (isDemo) klanten = DEMO_KLANTEN as KlantRecord[];

  if (!companyId && !preview) {
    return (
      <div className="mx-auto max-w-6xl">
        <NoCompanyNotice />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {isDemo && (
        <div className="flex justify-end px-1">
          <DemoBadge />
        </div>
      )}
      <ContactenView klanten={klanten} loadFailed={loadFailed} />
    </div>
  );
}
