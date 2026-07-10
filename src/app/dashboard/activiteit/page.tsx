import Link from "next/link";
import { List, Info } from "lucide-react";
import { Panel } from "@/components/dashboard/widgets";
import {
  PageHeader,
  EmptyState,
  NoCompanyNotice,
  DemoBadge,
  StatusBadge,
  relTime,
} from "@/components/dashboard/mission";
import { demoActivity, demoActivityTypes } from "@/components/dashboard/demo";
import { getCompanyContext } from "@/lib/company";
import { isActivePreviewMode } from "@/components/dashboard/context";
import { showDemoData } from "@/lib/demo-mode";

export const metadata = { title: "Activiteit — ArchonPro" };

type Entry = {
  id: number;
  message: string;
  agent_name: string;
  action_type: string;
  error_message: string | null;
  created_at: string;
};

function toneFor(action: string): "ok" | "warn" | "danger" | "info" | "zinc" {
  const a = action.toLowerCase();
  if (a.includes("fail") || a.includes("error") || a.includes("reject")) return "danger";
  if (a.includes("warn") || a.includes("triage")) return "warn";
  if (a.includes("send") || a.includes("create") || a.includes("approve")) return "info";
  return "zinc";
}

function dayLabel(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yest = new Date(today.getTime() - 864e5);
  if (d.toDateString() === today.toDateString()) return "Vandaag";
  if (d.toDateString() === yest.toDateString()) return "Gisteren";
  return d.toLocaleDateString("nl-BE", { weekday: "long", day: "numeric", month: "long" });
}

export default async function ActiviteitPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string }>;
}) {
  const preview = await isActivePreviewMode();
  const { action } = await searchParams;
  const { supabase, companyId } = await getCompanyContext();

  let entries: Entry[] = [];
  let types: string[] = [];

  if (companyId) {
    let query = supabase
      .from("agent_activity_logs")
      .select("id, message, agent_name, action_type, error_message, created_at")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })
      .limit(200);
    if (action) query = query.eq("action_type", action);

    const [listRes, typesRes] = await Promise.all([
      query,
      supabase
        .from("agent_activity_logs")
        .select("action_type")
        .eq("company_id", companyId)
        .limit(1000),
    ]);

    entries = listRes.data ?? [];
    types = Array.from(
      new Set((typesRes.data ?? []).map((r) => r.action_type).filter(Boolean)),
    ).sort();
  }

  const isDemo = showDemoData(preview, entries.length === 0 && !action);
  if (isDemo) {
    entries = demoActivity;
    types = demoActivityTypes;
  }

  // Groepeer per dag met behoud van volgorde.
  const groups: { day: string; items: Entry[] }[] = [];
  const seen = new Map<string, Entry[]>();
  for (const e of entries) {
    const label = dayLabel(e.created_at);
    if (!seen.has(label)) {
      const arr: Entry[] = [];
      seen.set(label, arr);
      groups.push({ day: label, items: arr });
    }
    seen.get(label)!.push(e);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<List size={20} />}
        title="Activiteit"
        description="Volledig logboek van wat je AI-agents hebben gedaan."
        actions={isDemo ? <DemoBadge /> : undefined}
      />

      {!companyId && <NoCompanyNotice />}

      {companyId && (
        <div className="flex flex-wrap items-center gap-1.5">
          <FilterChip label="Alle" href="/dashboard/activiteit" active={!action} />
          {types.map((t) => (
            <FilterChip
              key={t}
              label={t.replace(/[_-]+/g, " ")}
              href={`/dashboard/activiteit?action=${encodeURIComponent(t)}`}
              active={action === t}
            />
          ))}
        </div>
      )}

      <Panel title="Logboek">
        {entries.length === 0 ? (
          <EmptyState icon={<Info size={18} />} title="Nog geen activiteit geregistreerd" />
        ) : (
          <div className="space-y-4">
            {groups.map((g) => (
              <div key={g.day}>
                <p className="mb-1 text-[11px] uppercase tracking-wider text-zinc-600">
                  {g.day}
                </p>
                <div className="divide-y divide-white/5">
                  {g.items.map((e) => (
                    <div key={e.id} className="flex items-start gap-3 py-2.5">
                      <span className="mt-0.5 shrink-0">
                        <StatusBadge tone={toneFor(e.action_type)}>
                          {e.action_type.replace(/[_-]+/g, " ")}
                        </StatusBadge>
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-zinc-300">{e.message}</p>
                        {e.error_message && (
                          <p className="text-[11px] text-rose-400">{e.error_message}</p>
                        )}
                        <p className="text-[10px] text-zinc-600">{e.agent_name}</p>
                      </div>
                      <span className="shrink-0 font-mono text-xs text-zinc-500">
                        {relTime(e.created_at)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

function FilterChip({
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
