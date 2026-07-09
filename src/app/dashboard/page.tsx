import {
  FileText,
  Euro,
  Bot,
  Sparkles,
  Send,
  PhoneCall,
  FileCheck2,
  type LucideIcon,
} from "lucide-react";
import { Panel, StatCard, TrendChart, Funnel } from "@/components/dashboard/widgets";
import ActionItems, { type ActionItem } from "@/components/dashboard/ActionItems";
import { createClient } from "@/lib/supabase/server";
import { DEMO_DASHBOARD } from "@/lib/demo";

const spark = (base: number) =>
  Array.from({ length: 14 }, (_, i) => ({
    v: Math.round(base + Math.sin(i / 2) * base * 0.18 + i * base * 0.03),
  }));

// Illustratieve fallback voor grafieken zolang een bedrijf nog geen historiek heeft.
const fallbackTrend = [
  { week: "W1", omzet: 42, offertes: 18 },
  { week: "W2", omzet: 48, offertes: 22 },
  { week: "W3", omzet: 45, offertes: 20 },
  { week: "W4", omzet: 58, offertes: 27 },
  { week: "W5", omzet: 61, offertes: 25 },
  { week: "W6", omzet: 70, offertes: 31 },
  { week: "W7", omzet: 66, offertes: 29 },
  { week: "W8", omzet: 78, offertes: 34 },
  { week: "W9", omzet: 84, offertes: 38 },
  { week: "W10", omzet: 92, offertes: 41 },
  { week: "W11", omzet: 88, offertes: 39 },
  { week: "W12", omzet: 101, offertes: 44 },
];

const fallbackFunnel = [
  { label: "Nieuwe leads", value: 148 },
  { label: "Gekwalificeerd", value: 96 },
  { label: "Offerte verzonden", value: 61 },
  { label: "Onderhandeling", value: 34 },
  { label: "Gewonnen", value: 21 },
];

const agents = [
  { name: "Nova", role: "AI-metgezel", status: "actief", color: "bg-emerald-400" },
  { name: "Schatter", role: "Offertes", status: "actief", color: "bg-emerald-400" },
  { name: "Facturatie", role: "Peppol", status: "idle", color: "bg-zinc-500" },
  { name: "Opvolger", role: "Leads", status: "actief", color: "bg-emerald-400" },
];

const activityIcon: Record<string, { icon: LucideIcon; tone: string }> = {
  offerte: { icon: FileText, tone: "text-sky-400" },
  factuur: { icon: Euro, tone: "text-emerald-400" },
  reminder: { icon: Send, tone: "text-indigo-400" },
  lead: { icon: PhoneCall, tone: "text-amber-400" },
  default: { icon: FileCheck2, tone: "text-zinc-400" },
};

function euro(n: number) {
  if (n >= 1000) return `€ ${(n / 1000).toFixed(1)}k`;
  return `€ ${n.toLocaleString("nl-BE")}`;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.round(diff / 60000);
  if (min < 60) return `${Math.max(1, min)} min`;
  const u = Math.round(min / 60);
  if (u < 24) return `${u} u`;
  return `${Math.round(u / 24)} d`;
}

function kindOf(entity?: string | null): ActionItem["kind"] {
  const e = (entity ?? "").toLowerCase();
  if (e.includes("offerte") || e.includes("quote")) return "offerte";
  if (e.includes("factuur") || e.includes("invoice")) return "factuur";
  return "opvolging";
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let companyId: number | null = null;

  if (user) {
    const { data: membership } = await supabase
      .from("company_memberships")
      .select("company_id")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    companyId = membership?.company_id ?? null;
  }

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .slice(0, 10);

  let offertesCount = 0;
  let klantenCount = 0;
  let gefactureerd = 0;
  let openstaand = 0;
  let actionItems: ActionItem[] = [];
  let activity: { id: number; text: string; time: string; kind: string }[] = [];

  if (companyId) {
    const [
      offertesRes,
      klantenRes,
      facturenMonthRes,
      openstaandRes,
      actionsRes,
      activityRes,
    ] = await Promise.all([
      supabase
        .from("offertes")
        .select("id", { count: "exact", head: true })
        .eq("bedrijf_id", companyId)
        .gte("created_at", monthStart),
      supabase
        .from("customers")
        .select("id", { count: "exact", head: true })
        .eq("company_id", companyId)
        .eq("is_active", true),
      supabase
        .from("facturen")
        .select("totaal_bedrag")
        .eq("bedrijf_id", companyId)
        .gte("datum", monthStart),
      supabase
        .from("facturen")
        .select("totaal_bedrag")
        .eq("bedrijf_id", companyId)
        .is("paid_at", null)
        .neq("status", "betaald"),
      supabase
        .from("agent_actions")
        .select("id, title, reason, action_type, target_entity_type")
        .eq("company_id", companyId)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(6),
      supabase
        .from("agent_activity_logs")
        .select("id, message, agent_name, action_type, created_at")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })
        .limit(6),
    ]);

    offertesCount = offertesRes.count ?? 0;
    klantenCount = klantenRes.count ?? 0;
    gefactureerd = (facturenMonthRes.data ?? []).reduce(
      (s, r) => s + Number(r.totaal_bedrag ?? 0),
      0,
    );
    openstaand = (openstaandRes.data ?? []).reduce(
      (s, r) => s + Number(r.totaal_bedrag ?? 0),
      0,
    );
    actionItems = (actionsRes.data ?? []).map((a) => ({
      id: a.id,
      title: a.title,
      detail: a.reason ?? a.action_type ?? "AI-voorstel",
      kind: kindOf(a.target_entity_type),
    }));
    activity = (activityRes.data ?? []).map((l) => ({
      id: l.id,
      text: l.message ?? `${l.agent_name} — ${l.action_type}`,
      time: timeAgo(l.created_at),
      kind: kindOf(l.action_type),
    }));
  }

  // Toon demovoorbeeld zolang er nog geen echte cijfers zijn.
  const isDemo =
    offertesCount === 0 &&
    klantenCount === 0 &&
    gefactureerd === 0 &&
    actionItems.length === 0 &&
    activity.length === 0;
  if (isDemo) {
    offertesCount = DEMO_DASHBOARD.offertesCount;
    klantenCount = DEMO_DASHBOARD.klantenCount;
    gefactureerd = DEMO_DASHBOARD.gefactureerd;
    openstaand = DEMO_DASHBOARD.openstaand;
    actionItems = DEMO_DASHBOARD.actionItems;
    activity = DEMO_DASHBOARD.activity;
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-zinc-50">Overzicht</h1>
            {isDemo && (
              <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-300">
                Demo
              </span>
            )}
          </div>
          <p className="mt-0.5 text-sm text-zinc-500">
            Alles wat vandaag je aandacht nodig heeft — in één blik.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {agents.map((a) => (
            <div
              key={a.name}
              className="flex items-center gap-2 rounded-full border border-white/10 bg-zinc-900/60 px-3 py-1.5"
            >
              <span className={`h-1.5 w-1.5 rounded-full ${a.color}`} />
              <span className="text-xs font-medium text-zinc-200">{a.name}</span>
              <span className="text-[11px] text-zinc-500">{a.role}</span>
            </div>
          ))}
        </div>
      </header>

      {!companyId && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
          Je account is nog niet aan een bedrijf gekoppeld. Zodra je een bedrijf
          hebt, verschijnen hier je echte cijfers.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Offertes deze maand"
          value={String(offertesCount)}
          trend="—"
          icon="fileText"
          data={spark(30)}
        />
        <StatCard
          label="Gefactureerd (maand)"
          value={euro(gefactureerd)}
          trend="—"
          icon="euro"
          data={spark(60)}
        />
        <StatCard
          label="Actieve klanten"
          value={String(klantenCount)}
          trend="—"
          icon="contact"
          data={spark(20)}
        />
        <StatCard
          label="Openstaand"
          value={euro(openstaand)}
          trend="—"
          icon="receipt"
          data={spark(40)}
          positive={false}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Panel
          title="Action items"
          className="lg:col-span-2"
          action={
            <span className="rounded-full bg-sky-500/12 px-2 py-0.5 text-[11px] font-semibold text-sky-400">
              {actionItems.length} openstaand
            </span>
          }
        >
          <ActionItems items={actionItems} />
        </Panel>

        <Panel title="Nova AI-metgezel">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-sky-400 to-indigo-500 text-zinc-950">
              <Bot size={18} />
            </span>
            <div>
              <p className="text-sm text-zinc-200">
                {actionItems.length > 0
                  ? `Ik heb ${actionItems.length} voorstel${actionItems.length > 1 ? "len" : ""} klaarstaan die op je goedkeuring wachten.`
                  : "Alles is bij. Ik hou je offertes en facturen in de gaten."}
              </p>
              <button className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-sky-500 px-3.5 py-1.5 text-xs font-medium text-zinc-950 transition-colors hover:bg-sky-400">
                <Sparkles size={13} /> Voorstel uitvoeren
              </button>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 border-t border-white/10 pt-4">
            <MiniStat label="Openstaande acties" value={String(actionItems.length)} />
            <MiniStat label="Actieve klanten" value={String(klantenCount)} />
            <MiniStat label="Offertes (maand)" value={String(offertesCount)} />
            <MiniStat label="Openstaand" value={euro(openstaand)} />
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Panel
          title="Omzet & offertes — 12 weken"
          className="lg:col-span-2"
          action={
            <div className="flex items-center gap-3 text-[11px] text-zinc-400">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-sky-400" /> Omzet
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-violet-400" /> Offertes
              </span>
            </div>
          }
        >
          <TrendChart data={fallbackTrend} />
        </Panel>

        <Panel title="Sales-funnel">
          <Funnel stages={fallbackFunnel} />
        </Panel>
      </div>

      <Panel title="Recente activiteit">
        {activity.length === 0 ? (
          <p className="py-6 text-center text-sm text-zinc-500">
            Nog geen activiteit om te tonen.
          </p>
        ) : (
          <div className="divide-y divide-white/5">
            {activity.map((a) => {
              const meta = activityIcon[a.kind] ?? activityIcon.default;
              return (
                <div
                  key={a.id}
                  className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
                >
                  <span
                    className={`grid h-8 w-8 place-items-center rounded-lg bg-white/5 ${meta.tone}`}
                  >
                    <meta.icon size={15} />
                  </span>
                  <p className="flex-1 text-sm text-zinc-300">{a.text}</p>
                  <span className="font-mono text-xs text-zinc-500">{a.time}</span>
                </div>
              );
            })}
          </div>
        )}
      </Panel>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-0.5 font-mono text-base font-semibold text-zinc-100">
        {value}
      </p>
    </div>
  );
}
