import { BarChart3, ArrowUp, ArrowDown } from "lucide-react";
import { Panel } from "@/components/dashboard/widgets";
import { LineTrend } from "@/components/dashboard/charts";
import {
  PageHeader,
  NoCompanyNotice,
  DemoBadge,
  ProgressBar,
} from "@/components/dashboard/mission";
import { demoKpiFill } from "@/components/dashboard/demo";
import { getCompanyContext } from "@/lib/company";

export const metadata = { title: "KPI's — ArchonPro" };

const WEEKS = 12;

// Kwartaaldoelen (90 dagen) — richtwaarden.
const TARGETS = {
  offertes: 120,
  omzet: 90_000,
  klanten: 40,
  facturen: 90,
  afspraken: 60,
};

function mondayOf(d: Date) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - day);
  return x;
}

type WeekRow = {
  week: string;
  offertes: number;
  omzet: number;
  klanten: number;
  facturen: number;
  afspraken: number;
};

export default async function KpiPage() {
  const { supabase, companyId } = await getCompanyContext();

  const thisMonday = mondayOf(new Date());
  const start = new Date(thisMonday);
  start.setDate(start.getDate() - (WEEKS - 1) * 7);
  const startIso = start.toISOString();

  let weeks: WeekRow[] = Array.from({ length: WEEKS }, (_, i) => {
    const m = new Date(start);
    m.setDate(m.getDate() + i * 7);
    return {
      week: `${String(m.getDate()).padStart(2, "0")}/${String(m.getMonth() + 1).padStart(2, "0")}`,
      offertes: 0,
      omzet: 0,
      klanten: 0,
      facturen: 0,
      afspraken: 0,
    };
  });

  const bucket = (iso: string | null) => {
    if (!iso) return -1;
    const t = new Date(iso).getTime();
    const idx = Math.floor((t - start.getTime()) / (7 * 864e5));
    return idx >= 0 && idx < WEEKS ? idx : -1;
  };

  if (companyId) {
    const [offertesRes, facturenRes, klantenRes, afsprakenRes] = await Promise.all([
      supabase
        .from("offertes")
        .select("created_at")
        .eq("bedrijf_id", companyId)
        .gte("created_at", startIso)
        .limit(5000),
      supabase
        .from("facturen")
        .select("datum, totaal_bedrag, created_at")
        .eq("bedrijf_id", companyId)
        .gte("created_at", startIso)
        .limit(5000),
      supabase
        .from("customers")
        .select("created_at")
        .eq("company_id", companyId)
        .gte("created_at", startIso)
        .limit(5000),
      supabase
        .from("afspraken")
        .select("created_at")
        .eq("bedrijf_id", companyId)
        .gte("created_at", startIso)
        .limit(5000),
    ]);

    for (const r of offertesRes.data ?? []) {
      const i = bucket(r.created_at);
      if (i >= 0) weeks[i].offertes += 1;
    }
    for (const r of facturenRes.data ?? []) {
      const i = bucket(r.created_at ?? r.datum);
      if (i >= 0) {
        weeks[i].facturen += 1;
        weeks[i].omzet += Number(r.totaal_bedrag ?? 0);
      }
    }
    for (const r of klantenRes.data ?? []) {
      const i = bucket(r.created_at);
      if (i >= 0) weeks[i].klanten += 1;
    }
    for (const r of afsprakenRes.data ?? []) {
      const i = bucket(r.created_at);
      if (i >= 0) weeks[i].afspraken += 1;
    }
  }

  const isDemo = weeks.every(
    (w) => w.offertes + w.omzet + w.klanten + w.facturen + w.afspraken === 0,
  );
  if (isDemo) weeks = demoKpiFill(weeks);

  const thisWeek = weeks[WEEKS - 1];
  const lastWeek = weeks[WEEKS - 2];

  const totals = weeks.reduce(
    (acc, w) => ({
      offertes: acc.offertes + w.offertes,
      omzet: acc.omzet + w.omzet,
      klanten: acc.klanten + w.klanten,
      facturen: acc.facturen + w.facturen,
      afspraken: acc.afspraken + w.afspraken,
    }),
    { offertes: 0, omzet: 0, klanten: 0, facturen: 0, afspraken: 0 },
  );

  const metrics: {
    label: string;
    key: keyof Omit<WeekRow, "week">;
    target: number;
    money?: boolean;
  }[] = [
    { label: "Offertes", key: "offertes", target: TARGETS.offertes },
    { label: "Omzet", key: "omzet", target: TARGETS.omzet, money: true },
    { label: "Nieuwe klanten", key: "klanten", target: TARGETS.klanten },
    { label: "Facturen", key: "facturen", target: TARGETS.facturen },
    { label: "Afspraken", key: "afspraken", target: TARGETS.afspraken },
  ];

  const fmt = (v: number, money?: boolean) =>
    money ? `€ ${Math.round(v).toLocaleString("nl-BE")}` : String(v);

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<BarChart3 size={20} />}
        title="KPI's"
        description="Wekelijkse prestaties versus je kwartaaldoelen."
        actions={
          <div className="flex items-center gap-2">
            {isDemo && <DemoBadge />}
            <span className="text-xs text-zinc-500">
              Weken gevolgd{" "}
              <span className="font-mono text-zinc-300">{WEEKS}</span>
            </span>
          </div>
        }
      />

      {!companyId && <NoCompanyNotice />}

      <Panel title="Wekelijkse metrics">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-[11px] uppercase tracking-wider text-zinc-500">
                <th className="pb-2 pr-4 font-semibold">Metric</th>
                <th className="pb-2 pr-4 font-semibold">Deze week</th>
                <th className="pb-2 pr-4 font-semibold">Vorige week</th>
                <th className="pb-2 pr-4 font-semibold">Kwartaaldoel</th>
                <th className="pb-2 font-semibold">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {metrics.map((m) => {
                const c = thisWeek[m.key];
                const p = lastWeek[m.key];
                const diff = p > 0 ? ((c - p) / p) * 100 : c > 0 ? 100 : 0;
                const up = diff >= 0;
                return (
                  <tr key={m.key}>
                    <td className="py-2.5 pr-4 font-medium text-zinc-200">{m.label}</td>
                    <td className="py-2.5 pr-4 font-mono text-zinc-100">
                      {fmt(c, m.money)}
                    </td>
                    <td className="py-2.5 pr-4 font-mono text-zinc-500">
                      {fmt(p, m.money)}
                    </td>
                    <td className="py-2.5 pr-4 font-mono text-zinc-500">
                      {fmt(m.target, m.money)}
                    </td>
                    <td className="py-2.5">
                      <span
                        className={`inline-flex items-center gap-0.5 font-mono text-xs ${
                          up ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        {up ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                        {up ? "+" : ""}
                        {diff.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel title="Offertes (wekelijks)">
          <LineTrend
            data={weeks}
            series={[{ key: "offertes", color: "#38bdf8", label: "Offertes" }]}
          />
        </Panel>
        <Panel title="Omzet (wekelijks, €)">
          <LineTrend
            data={weeks}
            series={[{ key: "omzet", color: "#34d399", label: "Omzet" }]}
          />
        </Panel>
        <Panel title="Klanten & facturen (wekelijks)">
          <LineTrend
            data={weeks}
            series={[
              { key: "klanten", color: "#a78bfa", label: "Klanten" },
              { key: "facturen", color: "#fbbf24", label: "Facturen" },
            ]}
          />
        </Panel>
        <Panel title="Afspraken (wekelijks)">
          <LineTrend
            data={weeks}
            series={[{ key: "afspraken", color: "#f472b6", label: "Afspraken" }]}
          />
        </Panel>
      </div>

      <Panel title="Voortgang kwartaaldoelen (90 dagen)">
        <div className="space-y-3">
          <ProgressBar label="Offertes" current={totals.offertes} target={TARGETS.offertes} />
          <ProgressBar
            label="Omzet"
            current={Math.round(totals.omzet)}
            target={TARGETS.omzet}
            unit=" €"
          />
          <ProgressBar label="Nieuwe klanten" current={totals.klanten} target={TARGETS.klanten} />
          <ProgressBar label="Afspraken" current={totals.afspraken} target={TARGETS.afspraken} />
        </div>
      </Panel>
    </div>
  );
}
