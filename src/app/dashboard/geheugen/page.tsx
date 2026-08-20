import { BrainCircuit, Database, BookOpen, Layers, Star } from "lucide-react";
import Link from "next/link";
import { Panel } from "@/components/dashboard/widgets";
import {
  PageHeader,
  StatTile,
  EmptyState,
  NoCompanyNotice,
  DemoBadge,
  BarList,
  relTime,
} from "@/components/dashboard/mission";
import {
  demoMemories,
  demoKnowledge,
  demoMemoryTypeBreakdown,
} from "@/components/dashboard/demo";
import { getCompanyContext } from "@/lib/company";
import { isActivePreviewMode } from "@/components/dashboard/context";
import { showDemoData } from "@/lib/demo-mode";
import SeedPricesButton from "@/components/dashboard/geheugen/SeedPricesButton";

export const metadata = { title: "Geheugen — ArchonPro" };

const TYPE_LABELS: Record<string, string> = {
  fact: "Feit",
  preference: "Voorkeur",
  context: "Context",
  instruction: "Instructie",
  interaction: "Interactie",
  general: "Algemeen",
};

export default async function GeheugenPage() {
  const preview = await isActivePreviewMode();
  const { supabase, companyId } = await getCompanyContext();

  let memories: {
    id: string;
    content: string;
    memory_type: string;
    importance: number | null;
    created_at: string | null;
  }[] = [];
  let knowledge: {
    id: string;
    title: string;
    type: string;
    source: string | null;
    created_at: string;
  }[] = [];
  let memTotal = 0;
  let kbTotal = 0;
  let typeBreakdown: { label: string; value: number }[] = [];

  if (companyId) {
    const [memRes, kbRes, memCountRes, kbCountRes, typeRes] = await Promise.all([
      supabase
        .from("ai_agent_memory")
        .select("id, content, memory_type, importance, created_at")
        .eq("company_id", companyId)
        .order("importance", { ascending: false, nullsFirst: false })
        .limit(12),
      supabase
        .from("ai_knowledge_base")
        .select("id, title, type, source, created_at")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("ai_agent_memory")
        .select("id", { count: "exact", head: true })
        .eq("company_id", companyId),
      supabase
        .from("ai_knowledge_base")
        .select("id", { count: "exact", head: true })
        .eq("company_id", companyId),
      supabase
        .from("ai_agent_memory")
        .select("memory_type")
        .eq("company_id", companyId)
        .limit(2000),
    ]);

    memories = memRes.data ?? [];
    knowledge = kbRes.data ?? [];
    memTotal = memCountRes.count ?? 0;
    kbTotal = kbCountRes.count ?? 0;

    const counter = new Map<string, number>();
    for (const r of typeRes.data ?? []) {
      const k = r.memory_type || "general";
      counter.set(k, (counter.get(k) ?? 0) + 1);
    }
    typeBreakdown = Array.from(counter.entries())
      .map(([k, v]) => ({ label: TYPE_LABELS[k] ?? k, value: v }))
      .sort((a, b) => b.value - a.value);
  }

  const isDemo = showDemoData(preview, memTotal === 0 && kbTotal === 0);
  if (isDemo) {
    memories = demoMemories;
    knowledge = demoKnowledge;
    typeBreakdown = demoMemoryTypeBreakdown;
    memTotal = 40;
    kbTotal = demoKnowledge.length;
  }

  const avgImportance =
    memories.length > 0
      ? (
          memories.reduce((s, m) => s + (m.importance ?? 0), 0) / memories.length
        ).toFixed(1)
      : "—";

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<BrainCircuit size={20} />}
        title="Geheugen"
        description="Wat je AI-agents onthouden over je bedrijf en klanten."
        actions={
          <div className="flex items-center gap-2">
            {isDemo && <DemoBadge />}
            {companyId && !isDemo && <SeedPricesButton />}
            <Link
              href="/dashboard/instellingen"
              className="text-xs text-sky-400 hover:underline"
            >
              Instellingen
            </Link>
          </div>
        }
      />

      {!companyId && <NoCompanyNotice />}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile label="Geheugen-items" value={memTotal} icon={<Database size={18} />} tone="sky" />
        <StatTile label="Kennisbank" value={kbTotal} icon={<BookOpen size={18} />} tone="violet" />
        <StatTile
          label="Gem. belangrijkheid"
          value={avgImportance}
          icon={<Star size={18} />}
          tone="amber"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Panel title="Per type" className="lg:col-span-1">
          {typeBreakdown.length === 0 ? (
            <EmptyState icon={<Layers size={18} />} title="Nog geen geheugen" />
          ) : (
            <BarList items={typeBreakdown} accent="from-violet-400 to-sky-500" />
          )}
        </Panel>

        <Panel title="Belangrijkste geheugen-items" className="lg:col-span-2">
          {memories.length === 0 ? (
            <EmptyState
              icon={<BrainCircuit size={18} />}
              title="Nog geen geheugen opgebouwd"
              description="Naarmate je AI-agents werken, verschijnt hier wat ze onthouden."
            />
          ) : (
            <div className="divide-y divide-white/5">
              {memories.map((m) => (
                <div key={m.id} className="flex items-start gap-3 py-2.5 first:pt-0">
                  <span className="mt-0.5 rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] font-medium uppercase text-zinc-400">
                    {TYPE_LABELS[m.memory_type] ?? m.memory_type}
                  </span>
                  <p className="min-w-0 flex-1 text-sm text-zinc-300">
                    <span className="line-clamp-2">{m.content}</span>
                    <span className="mt-0.5 block text-[10px] text-zinc-500">
                      {relTime(m.created_at)}
                    </span>
                  </p>
                  {m.importance != null && (
                    <span className="flex shrink-0 items-center gap-0.5 font-mono text-xs text-amber-400">
                      <Star size={11} /> {m.importance}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>

      <Panel title="Kennisbank">
        {knowledge.length === 0 ? (
          <EmptyState
            icon={<BookOpen size={18} />}
            title="Kennisbank is leeg"
            description="Documenten en referenties die je agents gebruiken verschijnen hier."
          />
        ) : (
          <div className="divide-y divide-white/5">
            {knowledge.map((k) => (
              <div key={k.id} className="flex items-center gap-3 py-2.5 first:pt-0">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/5 text-zinc-400">
                  <BookOpen size={14} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-zinc-200">{k.title}</p>
                  <p className="text-[11px] text-zinc-500">
                    {k.type}
                    {k.source ? ` · ${k.source}` : ""}
                  </p>
                </div>
                <span className="shrink-0 font-mono text-[10px] text-zinc-500">
                  {relTime(k.created_at)}
                </span>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
