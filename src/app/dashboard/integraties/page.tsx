import { Plug } from "lucide-react";
import { getCompanyContext } from "@/lib/company";
import {
  INTEGRATION_PROVIDERS,
  untyped,
  type Integratie,
} from "@/lib/integraties";
import PlaceholderPage from "@/components/dashboard/PlaceholderPage";
import IntegrationsGrid from "@/components/dashboard/integraties/IntegrationsGrid";

export const metadata = { title: "Integraties — ArchonPro" };

export default async function IntegratiesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const connectedParam = typeof sp.connected === "string" ? sp.connected : null;
  const errorParam = typeof sp.error === "string" ? sp.error : null;
  const { supabase, companyId } = await getCompanyContext();

  if (!companyId) {
    return (
      <PlaceholderPage
        title="Integraties"
        description="Koppel ArchonPro met je boekhoud- en bouwsoftware en Peppol."
        icon={<Plug size={20} />}
        features={["Geen actief bedrijf gevonden voor je account."]}
      />
    );
  }

  const { data } = await untyped(supabase)
    .from("integraties")
    .select("*")
    .eq("bedrijf_id", companyId);

  const connections = (data ?? []) as Integratie[];
  const byProvider: Record<string, { status: string; config: Record<string, unknown> }> =
    Object.fromEntries(
      connections.map((c) => [c.provider, { status: c.status, config: c.config ?? {} }]),
    );

  return (
    <div className="mx-auto max-w-[1100px] space-y-6">
      <header className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-sky-500/10 text-sky-400">
          <Plug size={20} />
        </span>
        <div>
          <h1 className="text-xl font-semibold text-zinc-50">Integraties</h1>
          <p className="mt-0.5 text-sm text-zinc-500">
            Koppel je boekhoud- en bouwsoftware en sluit aan op het
            Peppol-netwerk voor e-facturatie.
          </p>
        </div>
      </header>

      {connectedParam && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          Koppeling met <b>{connectedParam}</b> is geautoriseerd en actief.
        </div>
      )}
      {errorParam && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          {errorParam}
        </div>
      )}

      <IntegrationsGrid providers={INTEGRATION_PROVIDERS} connections={byProvider} />
    </div>
  );
}
