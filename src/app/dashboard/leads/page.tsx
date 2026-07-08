import { Contact } from "lucide-react";
import PlaceholderPage from "@/components/dashboard/PlaceholderPage";

export const metadata = { title: "Leads / CRM — ArchonPro" };

export default function LeadsPage() {
  return (
    <PlaceholderPage
      title="Leads / CRM"
      description="Beheer je leads, klanten en verkoopkansen."
      icon={<Contact size={20} />}
      features={[
        "Leads en klanten centraliseren",
        "Sales-funnel opvolgen",
        "Automatische opvolging door Nova",
      ]}
    />
  );
}
