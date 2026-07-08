import { FileText } from "lucide-react";
import { getCompanyContext } from "@/lib/company";
import OfferteForm from "@/components/dashboard/offertes/OfferteForm";

export const metadata = { title: "Nieuwe offerte — ArchonPro" };

export default async function NieuweOffertePage() {
  const { supabase, companyId } = await getCompanyContext();

  let customers: { id: number; name: string; company_name: string | null }[] =
    [];
  if (companyId) {
    const { data } = await supabase
      .from("customers")
      .select("id, name, company_name")
      .eq("company_id", companyId)
      .eq("is_active", true)
      .order("name");
    customers = data ?? [];
  }

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <header className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-sky-500/10 text-sky-400">
          <FileText size={20} />
        </span>
        <div>
          <h1 className="text-xl font-semibold text-zinc-50">Nieuwe offerte</h1>
          <p className="mt-0.5 text-sm text-zinc-500">
            Vul links de gegevens in en bekijk rechts direct de preview.
          </p>
        </div>
      </header>

      <OfferteForm customers={customers} />
    </div>
  );
}
