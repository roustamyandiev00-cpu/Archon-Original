import Link from "next/link";
import {
  LineChart as LineChartIcon,
  Globe,
  Mail,
  Share2,
  FileText,
  Euro,
  UserPlus,
  Sparkles,
} from "lucide-react";
import { Panel } from "@/components/dashboard/widgets";
import { LineTrend } from "@/components/dashboard/charts";
import {
  PageHeader,
  StatTile,
  NoCompanyNotice,
  DemoBadge,
} from "@/components/dashboard/mission";
import {
  demoAnalyticsFill,
  demoAnalyticsTotals,
} from "@/components/dashboard/demo";
import { getCompanyContext } from "@/lib/company";
import { isActivePreviewMode } from "@/components/dashboard/context";
import { showDemoData } from "@/lib/demo-mode";

export const metadata = { title: "Analytics — ArchonPro" };

const PERIODS = [
  { key: "7d", label: "7d", days: 7 },
  { key: "30d", label: "30d", days: 30 },
  { key: "90d", label: "90d", days: 90 },
];

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const preview = await isActivePreviewMode();
  const { period = "30d" } = await searchParams;
  const days = PERIODS.find((p) => p.key === period)?.days ?? 30;
  const { supabase, companyId } = await getCompanyContext();

  const now = new Date();
  const start = new Date(now.getTime() - (days - 1) * 864e5);
  const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const startIso = startDay.toISOString();

  const dayKeys: string[] = Array.from({ length: days }, (_, i) => {
    const d = new Date(startDay.getTime() + i * 864e5);
    return d.toISOString().slice(0, 10);
  });
  let series = dayKeys.map((k) => ({
    dag: `${k.slice(8, 10)}/${k.slice(5, 7)}`,
    key: k,
    offertes: 0,
    omzet: 0,
  }));
  const idxByKey = new Map(series.map((s, i) => [s.key, i]));

  let offertesCount = 0;
  let omzet = 0;
  let klantenCount = 0;
  let aiActies = 0;

  if (companyId) {
    const [offertesRes, facturenRes, klantenRes, aiRes] = await Promise.all([
      supabase
        .from("offertes")
        .select("created_at")
        .eq("bedrijf_id", companyId)
        .gte("created_at", startIso)
        .limit(5000),
      supabase
        .from("facturen")
        .select("created_at, datum, totaal_bedrag")
        .eq("bedrijf_id", companyId)
        .gte("created_at", startIso)
        .limit(5000),
      supabase
        .from("customers")
        .select("id", { count: "exact", head: true })
        .eq("company_id", companyId)
        .gte("created_at", startIso),
      supabase
        .from("agent_activity_logs")
        .select("id", { count: "exact", head: true })
        .eq("company_id", companyId)
        .gte("created_at", startIso),
    ]);

    for (const r of offertesRes.data ?? []) {
      offertesCount += 1;
      const i = idxByKey.get(r.created_at.slice(0, 10));
      if (i != null) series[i].offertes += 1;
    }
    for (const r of facturenRes.data ?? []) {
      const bedrag = Number(r.totaal_bedrag ?? 0);
      omzet += bedrag;
      const i = idxByKey.get((r.created_at ?? r.datum).slice(0, 10));
      if (i != null) series[i].omzet += bedrag;
    }
    klantenCount = klantenRes.count ?? 0;
    aiActies = aiRes.count ?? 0;
  }

  const isDemo = showDemoData(
    preview,
    offertesCount === 0 && omzet === 0 && klantenCount === 0 && aiActies === 0,
  );
  if (isDemo) {
    series = demoAnalyticsFill(series);
    const t = demoAnalyticsTotals(series);
    offertesCount = t.offertesCount;
    omzet = t.omzet;
    klantenCount = t.klantenCount;
    aiActies = t.aiActies;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<LineChartIcon size={20} />}
        title="Analytics"
        description="Interne rollups uit je eigen data en externe kanalen."
        actions={
          <div className="flex items-center gap-2">
            {isDemo && <DemoBadge />}
            <div className="flex items-center gap-1 rounded-full border border-white/10 bg-zinc-900/60 p-0.5">
            {PERIODS.map((p) => (
              <Link
                key={p.key}
                href={`/dashboard/analytics?period=${p.key}`}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  p.key === period
                    ? "bg-sky-500/20 text-sky-300"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {p.label}
              </Link>
            ))}
            </div>
          </div>
        }
      />

      {!companyId && <NoCompanyNotice />}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <ChannelCard
          icon={<Globe size={16} />}
          title="Website"
          status="niet geconfigureerd"
          hint="Koppel Google Analytics of Plausible om websitebezoek te tonen."
        />
        <ChannelCard
          icon={<Mail size={16} />}
          title="E-mail"
          status="via Archon"
          ok
          hint="Verzonden offertes en facturen worden intern geregistreerd."
        />
        <ChannelCard
          icon={<Share2 size={16} />}
          title="Sociaal"
          status="niet geconfigureerd"
          hint="Nog geen sociale kanalen gekoppeld."
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label={`Offertes (${period})`} value={offertesCount} icon={<FileText size={18} />} tone="sky" />
        <StatTile
          label={`Omzet (${period})`}
          value={`€ ${Math.round(omzet).toLocaleString("nl-BE")}`}
          icon={<Euro size={18} />}
          tone="emerald"
        />
        <StatTile label={`Nieuwe klanten (${period})`} value={klantenCount} icon={<UserPlus size={18} />} tone="violet" />
        <StatTile label={`AI-acties (${period})`} value={aiActies} icon={<Sparkles size={18} />} tone="amber" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel title={`Offertes per dag (${period})`}>
          <LineTrend
            data={series}
            xKey="dag"
            series={[{ key: "offertes", color: "#38bdf8", label: "Offertes" }]}
          />
        </Panel>
        <Panel title={`Omzet per dag (${period}, €)`}>
          <LineTrend
            data={series}
            xKey="dag"
            series={[{ key: "omzet", color: "#34d399", label: "Omzet" }]}
          />
        </Panel>
      </div>
    </div>
  );
}

function ChannelCard({
  icon,
  title,
  status,
  hint,
  ok = false,
}: {
  icon: React.ReactNode;
  title: string;
  status: string;
  hint: string;
  ok?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-4">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-medium text-zinc-200">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/5 text-zinc-400">
            {icon}
          </span>
          {title}
        </span>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
            ok ? "bg-emerald-500/15 text-emerald-400" : "bg-white/8 text-zinc-500"
          }`}
        >
          {status}
        </span>
      </div>
      <p className="mt-3 text-xs text-zinc-500">{hint}</p>
    </div>
  );
}
