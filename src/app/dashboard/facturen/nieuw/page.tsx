import { Receipt } from "lucide-react";
import { getCompanyContext } from "@/lib/company";
import FactuurForm from "@/components/dashboard/facturen/FactuurForm";

export const metadata = { title: "Nieuwe factuur — ArchonPro" };

export default async function NieuweFactuurPage() {
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
          <Receipt size={20} />
        </span>
        <div>
          <h1 className="text-xl font-semibold text-zinc-50">Nieuwe factuur</h1>
          <p className="mt-0.5 text-sm text-zinc-500">
            Kies factuur of proforma, vul links de gegevens in en bekijk rechts
            direct de preview.
          </p>
        </div>
      </header>

      <FactuurForm customers={customers} />
    </div>
  );
}
