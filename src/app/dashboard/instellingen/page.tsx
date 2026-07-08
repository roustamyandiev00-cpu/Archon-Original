import { Settings } from "lucide-react";
import { getCompanyContext } from "@/lib/company";
import SettingsForm from "@/components/dashboard/instellingen/SettingsForm";
import PlaceholderPage from "@/components/dashboard/PlaceholderPage";
import { parseExtras, DEFAULT_TEMPLATE, type SettingsInput } from "./settings";

export const metadata = { title: "Instellingen — ArchonPro" };

export default async function InstellingenPage() {
  const { supabase, companyId } = await getCompanyContext();

  if (!companyId) {
    return (
      <PlaceholderPage
        title="Instellingen"
        description="Beheer je account, bedrijf en voorkeuren."
        icon={<Settings size={20} />}
        features={["Geen actief bedrijf gevonden voor je account."]}
      />
    );
  }

  const { data } = await supabase
    .from("bedrijven")
    .select(
      "naam, adres, postcode, stad, telefoon, email, kvk, btw, iban, logo_url, betaalterm, algemene_voorwaarden, footer_tekst, default_quote_template, default_invoice_template, ai_assistant",
    )
    .eq("id", companyId)
    .maybeSingle();

  const extras = parseExtras(data?.ai_assistant ?? null);

  const initial: SettingsInput = {
    naam: data?.naam ?? "",
    adres: data?.adres ?? "",
    postcode: data?.postcode ?? "",
    stad: data?.stad ?? "",
    telefoon: data?.telefoon ?? "",
    email: data?.email ?? "",
    kvk: data?.kvk ?? "",
    btw: data?.btw ?? "",
    iban: data?.iban ?? "",
    logo_url: data?.logo_url ?? "",
    betaalterm: data?.betaalterm ?? 30,
    standaardBtw: extras.standaardBtw,
    algemene_voorwaarden: data?.algemene_voorwaarden ?? "",
    footer_tekst: data?.footer_tekst ?? "",
    quoteTemplate: data?.default_quote_template || DEFAULT_TEMPLATE,
    invoiceTemplate: data?.default_invoice_template || DEFAULT_TEMPLATE,
    ai: extras.ai,
  };

  return (
    <div className="mx-auto max-w-[1100px] space-y-6">
      <header className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-sky-500/10 text-sky-400">
          <Settings size={20} />
        </span>
        <div>
          <h1 className="text-xl font-semibold text-zinc-50">Instellingen</h1>
          <p className="mt-0.5 text-sm text-zinc-500">
            Beheer je bedrijfsgegevens, offerte- &amp; factuurinstellingen en de
            AI-agent.
          </p>
        </div>
      </header>

      <SettingsForm initial={initial} />
    </div>
  );
}
