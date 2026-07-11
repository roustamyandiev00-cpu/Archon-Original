import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Plug,
  Radio,
  Receipt,
  ScrollText,
} from "lucide-react";
import { getCompanyContext } from "@/lib/company";
import { formatEuro, formatDate } from "@/lib/offertes";
import { getPeppolConfig } from "@/lib/peppol/build";
import { untyped } from "@/lib/integraties";
import {
  getBillitCredentials,
  loadPeppolInbox,
  peppolConfigSupportsInbox,
} from "@/lib/peppol/inbox";
import {
  FinanceActionCard,
  FinanceMetric,
  FinancePageHeader,
  FinancePanel,
  StatusPill,
} from "@/components/dashboard/finance/FinanceHub";
import PeppolInboxPanel from "@/components/dashboard/finance/PeppolInboxPanel";
import MercuriusPanel from "@/components/dashboard/finance/MercuriusPanel";
import CompanySetupCard from "@/components/werkposts/CompanySetupCard";

export const metadata = { title: "E-Facturen — ArchonPro" };

type PeppolFactuur = {
  id: number;
  nummer: string | null;
  klant: string | null;
  totaal_bedrag: number | null;
  datum: string | null;
  peppol_status: string | null;
  peppol_last_error: string | null;
};

function peppolLabel(status: string | null) {
  if (status === "verzonden") return { label: "Verzonden", tone: "ok" as const };
  if (status === "fout") return { label: "Fout", tone: "danger" as const };
  return { label: "Nog niet verstuurd", tone: "neutral" as const };
}

export default async function EFacturenPage() {
  const { supabase, companyId } = await getCompanyContext();

  let peppolConnected = false;
  let canSyncInbox = false;
  let autoSyncEnabled = false;
  let lastInboxSyncAt: string | null = null;
  let inboxItems: Awaited<ReturnType<typeof loadPeppolInbox>> = [];
  let mercuriusFacturen: {
    id: number;
    nummer: string | null;
    klant: string | null;
    totaal_bedrag: number | null;
    datum: string | null;
    buyer_reference: string | null;
    mercurius_status: string | null;
    mercurius_last_error: string | null;
  }[] = [];
  let facturen: PeppolFactuur[] = [];
  let stats = { verzonden: 0, fout: 0, open: 0, totaal: 0, ontvangen: 0 };

  if (companyId) {
    const [peppol, facturenRes, inbox, billit, mercuriusRes] = await Promise.all([
      getPeppolConfig(supabase, companyId),
      supabase
        .from("facturen")
        .select(
          "id, nummer, klant, totaal_bedrag, datum, peppol_status, peppol_last_error",
        )
        .eq("bedrijf_id", companyId)
        .order("created_at", { ascending: false })
        .limit(20),
      loadPeppolInbox(supabase, companyId),
      getBillitCredentials(supabase, companyId),
      untyped(supabase)
        .from("facturen")
        .select(
          "id, nummer, klant, totaal_bedrag, datum, buyer_reference, mercurius_status, mercurius_last_error, customer_id, customers!inner(is_overheid)",
        )
        .eq("bedrijf_id", companyId)
        .eq("customers.is_overheid", true)
        .order("created_at", { ascending: false })
        .limit(15),
    ]);

    peppolConnected = Boolean(peppol);
    canSyncInbox = Boolean(billit) || peppolConfigSupportsInbox(peppol);
    if (peppol) {
      const cfg = await untyped(supabase)
        .from("integraties")
        .select("config")
        .eq("bedrijf_id", companyId)
        .eq("provider", "peppol")
        .maybeSingle();
      const c = (cfg.data?.config ?? {}) as Record<string, string>;
      autoSyncEnabled = String(c.autoSyncInbox) === "true";
      lastInboxSyncAt = c.lastInboxSyncAt ?? null;
    }
    inboxItems = inbox;
    mercuriusFacturen = (mercuriusRes.data ?? []).map((row) => ({
      id: row.id,
      nummer: row.nummer,
      klant: row.klant,
      totaal_bedrag: row.totaal_bedrag,
      datum: row.datum,
      buyer_reference: row.buyer_reference,
      mercurius_status: row.mercurius_status,
      mercurius_last_error: row.mercurius_last_error,
    }));
    facturen = facturenRes.data ?? [];
    stats = {
      totaal: facturen.length,
      verzonden: facturen.filter((f) => f.peppol_status === "verzonden").length,
      fout: facturen.filter((f) => f.peppol_status === "fout").length,
      open: facturen.filter((f) => !f.peppol_status || f.peppol_status === "concept")
        .length,
      ontvangen: inbox.filter((i) => i.status !== "verwerkt").length,
    };
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <FinancePageHeader
        eyebrow="Administratie"
        title="E-Facturen"
        description="Verstuur en ontvang facturen via PEPPOL conform Belgische wetgeving. UBL BIS Billing 3.0 (EN16931)."
        icon={<ScrollText size={20} />}
        badge={
          <StatusPill
            label={peppolConnected ? "Peppol verbonden" : "Peppol niet gekoppeld"}
            tone={peppolConnected ? "ok" : "warn"}
          />
        }
      />

      {!companyId && <CompanySetupCard />}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <FinanceMetric
          label="Verzonden"
          value={stats.verzonden}
          hint="Via Peppol netwerk"
          tone="ok"
        />
        <FinanceMetric
          label="Ontvangen"
          value={stats.ontvangen}
          hint="Nieuwe leveranciersfacturen"
          tone={stats.ontvangen > 0 ? "orange" : "neutral"}
        />
        <FinanceMetric
          label="Te versturen"
          value={stats.open}
          hint="Klaar of nog voor te bereiden"
          tone="orange"
        />
        <FinanceMetric
          label="Fouten"
          value={stats.fout}
          hint="Validatie of verzending mislukt"
          tone={stats.fout > 0 ? "warn" : "neutral"}
        />
        <FinanceMetric
          label="Uitgaand"
          value={stats.totaal}
          hint="Laatste 20 in overzicht"
        />
      </div>

      <MercuriusPanel facturen={mercuriusFacturen} peppolConnected={peppolConnected} />

      <PeppolInboxPanel
        items={inboxItems}
        canSync={canSyncInbox}
        autoSyncEnabled={autoSyncEnabled}
        lastSyncAt={lastInboxSyncAt}
      />

      {!peppolConnected && companyId && (
        <div className="flex flex-wrap items-start gap-4 rounded-2xl border border-amber-500/20 bg-amber-500/[0.05] p-5">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-500/15 text-amber-400">
            <AlertTriangle size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-amber-200">
              Peppol access point vereist
            </p>
            <p className="mt-1 text-sm text-zinc-400">
              Koppel Billit, Isabel 6 of een ander access point om e-facturen te
              versturen en te ontvangen.
            </p>
          </div>
          <Link
            href="/dashboard/instellingen?tab=integraties"
            className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-zinc-950 transition-colors hover:bg-orange-400"
          >
            <Plug size={15} />
            Peppol koppelen
          </Link>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <FinancePanel
          title="Peppol-facturen"
          action={
            <Link
              href="/dashboard/facturen"
              className="text-xs font-medium text-orange-400 hover:text-orange-300"
            >
              Alle facturen
            </Link>
          }
        >
          {facturen.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm text-zinc-400">Nog geen facturen</p>
              <p className="mt-1 text-xs text-zinc-600">
                Maak eerst een factuur om via Peppol te versturen.
              </p>
              <Link
                href="/dashboard/facturen"
                className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/[0.1] px-4 py-2 text-sm text-zinc-200 hover:bg-white/[0.04]"
              >
                <Receipt size={14} />
                Nieuwe factuur
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-white/[0.05]">
              {facturen.map((f) => {
                const status = peppolLabel(f.peppol_status);
                return (
                  <li key={f.id}>
                    <Link
                      href={`/dashboard/facturen/${f.id}`}
                      className="flex items-center gap-3 py-3 transition-colors hover:bg-white/[0.02]"
                    >
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-orange-500/15 bg-orange-500/10 text-orange-400">
                        <Radio size={15} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-zinc-100">
                          {f.nummer ?? `Factuur #${f.id}`}
                        </p>
                        <p className="truncate text-xs text-zinc-500">
                          {[f.klant, f.datum ? formatDate(f.datum) : null]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                        {f.peppol_last_error && f.peppol_status === "fout" && (
                          <p className="mt-0.5 truncate text-[11px] text-rose-400">
                            {f.peppol_last_error}
                          </p>
                        )}
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-medium text-zinc-200">
                          {formatEuro(f.totaal_bedrag ?? 0)}
                        </p>
                        <StatusPill label={status.label} tone={status.tone} />
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </FinancePanel>

        <aside className="space-y-4">
          <FinancePanel title="Wat ArchonPro ondersteunt">
            <ul className="space-y-3 text-sm text-zinc-400">
              <li className="flex items-start gap-2">
                <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-400" />
                UBL-facturen versturen via access point
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-400" />
                KBO/BCE en BTW-validatie per klant
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-400" />
                Gestructureerde mededeling + kopersreferentie
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-400" />
                Mercurius B2G voor overheidsklanten
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-400" />
                UBL-download van ontvangen facturen
              </li>
            </ul>
          </FinancePanel>

          <div className="grid gap-3">
            <FinanceActionCard
              title="Peppol instellen"
              description="Koppel Billit, Codabox of een ander Belgisch access point."
              href="/dashboard/instellingen?tab=integraties"
              cta="Naar integraties"
            />
            <FinanceActionCard
              title="Klant Peppol-gegevens"
              description="Vul participant ID en KBO in bij je contacten."
              href="/dashboard/contacten"
              cta="Contacten beheren"
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
