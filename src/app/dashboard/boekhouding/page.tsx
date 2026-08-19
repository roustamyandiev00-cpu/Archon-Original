import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Plug,
  RefreshCw,
  Wallet,
} from "lucide-react";
import { getCompanyContext } from "@/lib/company";
import { formatEuro } from "@/lib/offertes";
import {
  INTEGRATION_PROVIDERS,
  untyped,
  type Integratie,
} from "@/lib/integraties";
import {
  FinanceActionCard,
  FinanceMetric,
  FinancePageHeader,
  FinancePanel,
  StatusPill,
} from "@/components/dashboard/finance/FinanceHub";
import AccountingExportPanel from "@/components/dashboard/finance/AccountingExportPanel";
import BillitFeatureMatrix from "@/components/dashboard/finance/BillitFeatureMatrix";
import BankReconciliationPanel from "@/components/dashboard/finance/BankReconciliationPanel";
import { listConnectedAccountingProviders } from "@/lib/accounting/router";
import CompanySetupCard from "@/components/werkposts/CompanySetupCard";

export const metadata = { title: "Boekhouding — ArchonPro" };

const BOEKHOUD_PROVIDERS = INTEGRATION_PROVIDERS.filter((p) =>
  p.category.toLowerCase().includes("boekhoud"),
);

export default async function BoekhoudingPage() {
  const { supabase, companyId } = await getCompanyContext();

  let connections: Integratie[] = [];
  let openstaand = 0;
  let gefactureerd = 0;
  let facturenCount = 0;
  let exportFacturen: {
    id: number;
    nummer: string | null;
    klant: string | null;
    totaal_bedrag: number | null;
    datum: string | null;
    status: string | null;
    paid_at?: string | null;
    accounting_export_id: string | null;
    accounting_exported_at: string | null;
    accounting_export_provider: string | null;
  }[] = [];
  let accountingProviders: Awaited<
    ReturnType<typeof listConnectedAccountingProviders>
  > = [];
  let bankAccounts: { id: number; iban: string; alias: string | null }[] = [];
  let bankTransactions: {
    id: number;
    transactie_datum: string;
    bedrag: number;
    tegenpartij: string | null;
    omschrijving: string | null;
    gestructureerde_mededeling: string | null;
    match_status: string;
    factuur_id: number | null;
  }[] = [];
  let bankOpenCount = 0;
  let bankMatchedCount = 0;
  let exportedCount = 0;

  if (companyId) {
    const [integratiesRes, facturenRes, providers, bankRes, txRes] =
      await Promise.all([
      untyped(supabase)
        .from("integraties")
        .select("*")
        .eq("bedrijf_id", companyId),
      supabase
        .from("facturen")
        .select(
          "id, nummer, klant, totaal_bedrag, datum, status, paid_at, accounting_export_id, accounting_exported_at, accounting_export_provider",
        )
        .eq("bedrijf_id", companyId)
        .order("created_at", { ascending: false })
        .limit(30),
      listConnectedAccountingProviders(supabase, companyId),
      supabase
        .from("bank_rekeningen")
        .select("id, iban, alias")
        .eq("bedrijf_id", companyId)
        .order("created_at", { ascending: true }),
      supabase
        .from("bank_transacties")
        .select(
          "id, transactie_datum, bedrag, tegenpartij, omschrijving, gestructureerde_mededeling, match_status, factuur_id",
        )
        .eq("bedrijf_id", companyId)
        .order("transactie_datum", { ascending: false })
        .limit(40),
    ]);

    accountingProviders = providers;
    connections = (integratiesRes.data ?? []) as Integratie[];
    exportFacturen = (facturenRes.data ?? []) as typeof exportFacturen;
    bankAccounts = (bankRes.data ?? []) as typeof bankAccounts;
    bankTransactions = (txRes.data ?? []) as typeof bankTransactions;
    bankOpenCount = bankTransactions.filter((t) => t.match_status === "open")
      .length;
    bankMatchedCount = bankTransactions.filter(
      (t) => t.match_status === "gematcht",
    ).length;
    facturenCount = exportFacturen.length;
    exportedCount = exportFacturen.filter((f) => f.accounting_export_id).length;
    for (const f of exportFacturen) {
      const bedrag = Number(f.totaal_bedrag ?? 0);
      if (f.paid_at || f.status === "betaald") {
        gefactureerd += bedrag;
      } else if (f.status !== "concept") {
        openstaand += bedrag;
      }
    }
  }

  const accountingConnected = connections.filter(
    (c) =>
      BOEKHOUD_PROVIDERS.some((p) => p.id === c.provider) &&
      c.status === "connected",
  );

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <FinancePageHeader
        eyebrow="Administratie"
        title="Boekhouding"
        description="Koppel je boekhoudpakket, exporteer facturen en houd cashflow en betalingen synchroon met je accountant."
        icon={<Wallet size={20} />}
        badge={
          <StatusPill
            label={
              accountingConnected.length > 0
                ? `${accountingConnected.length} koppeling actief`
                : "Geen boekhoudkoppeling"
            }
            tone={accountingConnected.length > 0 ? "ok" : "neutral"}
          />
        }
      />

      {!companyId && <CompanySetupCard />}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <FinanceMetric
          label="Openstaand"
          value={formatEuro(openstaand)}
          hint="Nog niet betaald"
          tone={openstaand > 0 ? "warn" : "ok"}
        />
        <FinanceMetric
          label="Gefactureerd"
          value={formatEuro(gefactureerd)}
          hint="Betaalde facturen"
          tone="ok"
        />
        <FinanceMetric
          label="Facturen"
          value={facturenCount}
          hint="Totaal in systeem"
        />
        <FinanceMetric
          label="Geëxporteerd"
          value={exportedCount}
          hint="Naar Billit / boekhouder"
          tone={exportedCount > 0 ? "ok" : "neutral"}
        />
      </div>

      <AccountingExportPanel
        facturen={exportFacturen}
        providers={accountingProviders}
      />

      <BillitFeatureMatrix />

      <BankReconciliationPanel
        accounts={bankAccounts}
        transactions={bankTransactions}
        openCount={bankOpenCount}
        matchedCount={bankMatchedCount}
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <FinancePanel
          title="Boekhoudkoppelingen"
          action={
            <Link
              href="/dashboard/instellingen?tab=integraties"
              className="text-xs font-medium text-orange-400 hover:text-orange-300"
            >
              Beheren
            </Link>
          }
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {BOEKHOUD_PROVIDERS.map((provider) => {
              const conn = connections.find((c) => c.provider === provider.id);
              const connected = conn?.status === "connected";

              return (
                <div
                  key={provider.id}
                  className={`rounded-xl border p-4 ${
                    connected
                      ? "border-emerald-500/20 bg-emerald-500/[0.04]"
                      : "border-white/[0.08] bg-zinc-950/40"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-zinc-100">
                        {provider.name}
                      </p>
                      <p className="mt-0.5 text-xs text-zinc-500">
                        {provider.description}
                      </p>
                    </div>
                    <Building2
                      size={16}
                      className={connected ? "text-emerald-400" : "text-zinc-600"}
                    />
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <StatusPill
                      label={connected ? "Verbonden" : "Niet gekoppeld"}
                      tone={connected ? "ok" : "neutral"}
                    />
                    <Link
                      href={`/dashboard/instellingen?tab=integraties&provider=${provider.id}`}
                      className="text-xs font-medium text-orange-400 hover:text-orange-300"
                    >
                      {connected ? "Beheren" : "Koppelen"}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </FinancePanel>

        <aside className="space-y-4">
          <FinancePanel title="Billit-inspiratie — roadmap">
            <p className="text-xs leading-relaxed text-zinc-500">
              Op basis van marktleider{" "}
              <a
                href="https://www.billit.eu/nl-be/functies/alle-features/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-400 hover:text-orange-300"
              >
                Billit
              </a>{" "}
              bouwen we stap voor stap uit:
            </p>
            <ul className="mt-3 space-y-2.5 text-sm">
              <RoadmapItem done label="Export Billit / Yuki / Exact" />
              <RoadmapItem done label="Bankafstemming (CSV/CAMT)" />
              <RoadmapItem done label="Mercurius B2G (overheid)" />
              <RoadmapItem label="BTW-aangifte voorbereiding" />
              <RoadmapItem label="Cashflowrapporten" />
            </ul>
          </FinancePanel>

          <div className="grid gap-3">
            <FinanceActionCard
              title="Integraties openen"
              description="Exact, Yuki, Octopus, WinBooks, Silverfin en meer."
              href="/dashboard/instellingen?tab=integraties"
              cta="Koppelingen beheren"
            />
            <FinanceActionCard
              title="Facturen exporteren"
              description="Bekijk openstaande en betaalde facturen voor export."
              href="/dashboard/facturen"
              cta="Naar facturen"
            />
          </div>
        </aside>
      </div>

      <FinancePanel title="Synchronisatie">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/[0.06] bg-zinc-950/40 p-4">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/[0.08] bg-zinc-900/80 text-orange-400">
              <RefreshCw size={18} />
            </span>
            <div>
              <p className="text-sm font-medium text-zinc-200">
                Export naar Billit actief
              </p>
              <p className="mt-0.5 text-xs text-zinc-500">
                Verkoopfacturen worden via de Billit Orders API doorgestuurd.
                Yuki en Exact volgen in een volgende fase.
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/instellingen?tab=integraties"
            className="inline-flex items-center gap-2 rounded-full border border-white/[0.1] px-4 py-2 text-sm font-medium text-zinc-200 transition-colors hover:border-orange-500/25 hover:text-orange-200"
          >
            <Plug size={14} />
            Setup starten
            <ArrowRight size={14} />
          </Link>
        </div>
      </FinancePanel>
    </div>
  );
}

function RoadmapItem({ label, done }: { label: string; done?: boolean }) {
  return (
    <li className="flex items-center gap-2 text-zinc-400">
      <CheckCircle2
        size={14}
        className={done ? "text-emerald-400" : "text-zinc-700"}
      />
      <span className={done ? "text-zinc-300" : ""}>{label}</span>
      {done && (
        <span className="rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-300">
          live
        </span>
      )}
    </li>
  );
}
