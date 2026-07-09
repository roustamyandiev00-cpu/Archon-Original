import { Receipt } from "lucide-react";
import { getCompanyContext } from "@/lib/company";
import FactuurForm, {
  type FactuurDocumentContext,
} from "@/components/dashboard/facturen/FactuurForm";
import { DEFAULT_TEMPLATE } from "@/app/dashboard/instellingen/settings";

export const metadata = { title: "Nieuwe factuur — ArchonPro" };

export default async function NieuweFactuurPage() {
  const { supabase, companyId } = await getCompanyContext();

  let customers: {
    id: number;
    name: string;
    company_name: string | null;
    first_name: string | null;
    last_name: string | null;
    address: string | null;
    email: string | null;
    phone: string | null;
    btw: string | null;
  }[] = [];
  let documentContext: FactuurDocumentContext = {
    defaultTemplate: DEFAULT_TEMPLATE,
    bedrijf: {
      naam: null,
      adres: null,
      postcode: null,
      stad: null,
      telefoon: null,
      email: null,
      btw: null,
      iban: null,
      algemene_voorwaarden: null,
      footer_tekst: null,
    },
  };

  if (companyId) {
    const [{ data }, { data: bedrijf }] = await Promise.all([
      supabase
        .from("customers")
        .select(
          "id, name, company_name, first_name, last_name, address, email, phone, btw",
        )
        .eq("company_id", companyId)
        .eq("is_active", true)
        .order("name"),
      supabase
        .from("bedrijven")
        .select(
          "naam, adres, postcode, stad, telefoon, email, btw, iban, algemene_voorwaarden, footer_tekst, default_invoice_template",
        )
        .eq("id", companyId)
        .maybeSingle(),
    ]);
    customers = data ?? [];
    documentContext = {
      defaultTemplate: bedrijf?.default_invoice_template || DEFAULT_TEMPLATE,
      bedrijf: bedrijf ?? documentContext.bedrijf,
    };
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
            Bekijk je factuursjabloon en vul via Gegevens invullen de details in.
          </p>
        </div>
      </header>

      <FactuurForm customers={customers} documentContext={documentContext} />
    </div>
  );
}
