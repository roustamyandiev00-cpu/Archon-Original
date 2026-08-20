import { getCompanyContext } from "@/lib/company";
import { untyped } from "@/lib/integraties";
import PartnersClient from "@/components/dashboard/bouwnetwerk/PartnersClient";
import { refreshBetrouwbaarheidsscore } from "@/lib/bouwnetwerk/betrouwbaarheid";
import PlaceholderPage from "@/components/dashboard/PlaceholderPage";
import { Handshake } from "lucide-react";

export const metadata = { title: "Partners — ArchonPro" };

export default async function PartnersPage() {
  const { supabase, companyId } = await getCompanyContext();

  if (!companyId) {
    return (
      <PlaceholderPage
        title="Zakelijke partners"
        description="Beheer favorieten en matching-instellingen."
        icon={<Handshake size={20} />}
        features={["Koppel eerst een bedrijf aan je account."]}
        moduleId="bouwnetwerk"
      />
    );
  }

  const [{ data: connecties }, { data: settings }, { data: directory }] =
    await Promise.all([
      untyped(supabase)
        .from("bedrijf_connecties")
        .select("id, connectie_bedrijf_id, status, notities, created_at")
        .eq("bedrijf_id", companyId)
        .order("created_at", { ascending: false }),
      untyped(supabase)
        .from("onderaannemer_agent_settings")
        .select("*")
        .eq("company_id", companyId)
        .maybeSingle(),
      supabase
        .from("bedrijven_directory")
        .select("id, naam")
        .neq("id", companyId)
        .order("naam", { ascending: true })
        .limit(100),
    ]);

  const score = await refreshBetrouwbaarheidsscore(supabase, companyId);

  const nameById = new Map(
    (directory ?? []).map((d) => [d.id as number, d.naam ?? `Bedrijf #${d.id}`]),
  );

  const partners = ((connecties ?? []) as Array<{
    id: string;
    connectie_bedrijf_id: number;
    status: string;
    notities: string | null;
    created_at: string;
  }>).map((c) => ({
    id: c.id,
    connectieBedrijfId: c.connectie_bedrijf_id,
    naam: nameById.get(c.connectie_bedrijf_id) ?? `Bedrijf #${c.connectie_bedrijf_id}`,
    status: c.status,
    notities: c.notities,
    createdAt: c.created_at,
  }));

  return (
    <PartnersClient
      partners={partners}
      directory={(directory ?? []).map((d) => ({
        id: d.id as number,
        naam: d.naam ?? `Bedrijf #${d.id}`,
      }))}
      score={score}
      settings={{
        enabled: Boolean(settings?.enabled),
        regio: (settings?.regio as string[]) ?? [],
        typeWerk: (settings?.type_werk as string[]) ?? [],
        beschikbaar: settings?.beschikbaar ?? true,
        minimumUurtarief: settings?.minimum_uurtarief
          ? Number(settings.minimum_uurtarief)
          : null,
        maxBerichtenPerDag: settings?.max_berichten_per_dag ?? 5,
      }}
    />
  );
}
