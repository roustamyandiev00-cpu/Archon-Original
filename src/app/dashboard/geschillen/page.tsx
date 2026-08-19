import { getCompanyContext } from "@/lib/company";
import { untyped } from "@/lib/integraties";
import GeschillenClient from "@/components/dashboard/geschillen/GeschillenClient";
import PlaceholderPage from "@/components/dashboard/PlaceholderPage";
import { Scale } from "lucide-react";

export const metadata = { title: "Geschillen — ArchonPro" };

export default async function GeschillenPage() {
  const { supabase, companyId } = await getCompanyContext();
  if (!companyId) {
    return (
      <PlaceholderPage
        title="Geschillen"
        description="Meld en volg geschillen met partners."
        icon={<Scale size={20} />}
        features={["Koppel eerst een bedrijf."]}
        moduleId="bouwnetwerk"
      />
    );
  }

  const [{ data: rows }, { data: directory }] = await Promise.all([
    untyped(supabase)
      .from("geschillen")
      .select("*")
      .or(
        `melder_company_id.eq.${companyId},tegenpartij_company_id.eq.${companyId}`,
      )
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("bedrijven_directory")
      .select("id, naam")
      .neq("id", companyId)
      .order("naam")
      .limit(100),
  ]);

  return (
    <GeschillenClient
      companyId={companyId}
      geschillen={(rows ?? []) as Array<Record<string, unknown>>}
      directory={(directory ?? []).map((d) => ({
        id: d.id as number,
        naam: d.naam ?? `Bedrijf #${d.id}`,
      }))}
    />
  );
}
