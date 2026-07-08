import Link from "next/link";
import { Search, Lightbulb } from "lucide-react";
import { Panel } from "@/components/dashboard/widgets";
import {
  PageHeader,
  EmptyState,
  NoCompanyNotice,
  DemoBadge,
  StatusBadge,
  relTime,
} from "@/components/dashboard/mission";
import { demoSignals, demoSignalTypes } from "@/components/dashboard/demo";
import { getCompanyContext } from "@/lib/company";

export const metadata = { title: "Onderzoek — ArchonPro" };

type Signal = {
  id: string;
  title: string;
  content: string;
  type: string;
  source: string | null;
  created_at: string;
};

export default async function OnderzoekPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  const { supabase, companyId } = await getCompanyContext();

  let signals: Signal[] = [];
  let types: string[] = [];

  if (companyId) {
    let query = supabase
      .from("ai_knowledge_base")
      .select("id, title, content, type, source, created_at")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })
      .limit(100);
    if (type) query = query.eq("type", type);

    const [listRes, typesRes] = await Promise.all([
      query,
      supabase
        .from("ai_knowledge_base")
        .select("type")
        .eq("company_id", companyId)
        .limit(1000),
    ]);

    signals = listRes.data ?? [];
    types = Array.from(
      new Set((typesRes.data ?? []).map((r) => r.type).filter(Boolean)),
    ).sort();
  }

  const isDemo = signals.length === 0 && !type;
  if (isDemo) {
    signals = demoSignals;
    types = demoSignalTypes;
  }

  const today = new Date().toISOString().slice(0, 10);
  const todaySignals = signals.filter((s) => s.created_at.slice(0, 10) === today);
  const earlier = signals.filter((s) => s.created_at.slice(0, 10) !== today);

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Search size={20} />}
        title="Onderzoek"
        description="Signalen en inzichten die je AI-agents hebben verzameld."
        actions={isDemo ? <DemoBadge /> : undefined}
      />

      {!companyId && <NoCompanyNotice />}

      {companyId && (
        <div className="flex flex-wrap items-center gap-1.5">
          <Chip label="Alle" href="/dashboard/onderzoek" active={!type} />
          {types.map((t) => (
            <Chip
              key={t}
              label={t.replace(/[_-]+/g, " ")}
              href={`/dashboard/onderzoek?type=${encodeURIComponent(t)}`}
              active={type === t}
            />
          ))}
        </div>
      )}

      {todaySignals.length > 0 && (
        <Panel title={`Vandaag (${todaySignals.length})`}>
          <div className="space-y-3">
            {todaySignals.map((s) => (
              <SignalCard key={s.id} s={s} />
            ))}
          </div>
        </Panel>
      )}

      <Panel title={todaySignals.length > 0 ? `Eerder (${earlier.length})` : `Alle signalen (${earlier.length})`}>
        {signals.length === 0 ? (
          <EmptyState
            icon={<Lightbulb size={18} />}
            title="Nog geen onderzoekssignalen"
            description="Zodra je agents onderzoek doen, verschijnen inzichten hier."
          />
        ) : (
          <div className="space-y-3">
            {earlier.map((s) => (
              <SignalCard key={s.id} s={s} />
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

function SignalCard({ s }: { s: Signal }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <StatusBadge tone="info">{s.type.replace(/[_-]+/g, " ")}</StatusBadge>
          <span className="text-sm font-medium text-zinc-200">{s.title}</span>
        </div>
        <span className="shrink-0 font-mono text-[10px] text-zinc-500">
          {relTime(s.created_at)}
        </span>
      </div>
      <p className="mt-2 line-clamp-3 text-xs text-zinc-400">{s.content}</p>
      {s.source && (
        <p className="mt-2 truncate text-[10px] text-zinc-600">Bron: {s.source}</p>
      )}
    </div>
  );
}

function Chip({
  label,
  href,
  active,
}: {
  label: string;
  href: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-3 py-1 text-xs font-medium capitalize transition-colors ${
        active
          ? "border-sky-500/40 bg-sky-500/15 text-sky-300"
          : "border-white/10 bg-zinc-900/60 text-zinc-400 hover:text-zinc-200"
      }`}
    >
      {label}
    </Link>
  );
}
