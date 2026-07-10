"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Bot,
  Check,
  ExternalLink,
  FileText,
  FolderKanban,
  Loader2,
  Receipt,
  UserRound,
  X,
} from "lucide-react";
import { decideAction } from "@/app/dashboard/automatisaties/actions";
import { useAgentNavigation } from "@/components/dashboard/agent-navigation/AgentNavigationProvider";
import type {
  OverviewAction,
  OverviewActionType,
  OverviewUrgency,
} from "@/components/dashboard/overview-data";

const TABS: { id: "all" | OverviewActionType; label: string }[] = [
  { id: "all", label: "Alles" },
  { id: "ai", label: "AI-voorstellen" },
  { id: "offerte", label: "Offertes" },
  { id: "factuur", label: "Facturen" },
  { id: "project", label: "Projecten" },
  { id: "lead", label: "Leads" },
];

const typeMeta: Record<
  OverviewActionType,
  { label: string; icon: typeof FileText; tone: string }
> = {
  ai: { label: "AI", icon: Bot, tone: "bg-sky-500/12 text-sky-400 border-sky-500/20" },
  offerte: {
    label: "Offerte",
    icon: FileText,
    tone: "bg-violet-500/12 text-violet-400 border-violet-500/20",
  },
  factuur: {
    label: "Factuur",
    icon: Receipt,
    tone: "bg-amber-500/12 text-amber-400 border-amber-500/20",
  },
  lead: {
    label: "Lead",
    icon: UserRound,
    tone: "bg-emerald-500/12 text-emerald-400 border-emerald-500/20",
  },
  project: {
    label: "Project",
    icon: FolderKanban,
    tone: "bg-rose-500/12 text-rose-400 border-rose-500/20",
  },
};

const urgencyMeta: Record<
  OverviewUrgency,
  { label: string; tone: string }
> = {
  urgent: { label: "Urgent", tone: "text-rose-400 bg-rose-500/10 border-rose-500/20" },
  attention: {
    label: "Aandacht",
    tone: "text-amber-300 bg-amber-500/10 border-amber-500/20",
  },
  normal: { label: "Normaal", tone: "text-zinc-400 bg-white/5 border-white/10" },
};

export default function OverviewActionsPanel({
  actions: initial,
  isDemo,
}: {
  actions: OverviewAction[];
  isDemo: boolean;
}) {
  const router = useRouter();
  const { navigateTo, markActionNavigated } = useAgentNavigation();
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("all");
  const [actions, setActions] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (tab === "all") return actions;
    return actions.filter((a) => a.type === tab);
  }, [actions, tab]);

  async function resolve(action: OverviewAction, decision: "approve" | "reject") {
    if (!action.actionId) {
      navigateTo(action.href, { minimizeChat: true });
      return;
    }

    if (isDemo || action.actionId < 0) {
      navigateTo("/dashboard/automatisaties", { minimizeChat: true });
      return;
    }

    setBusy(action.id);
    setError(null);
    const result = await decideAction(
      action.actionId,
      decision === "approve" ? "approve" : "reject",
    );

    if ("error" in result && result.error) {
      setError(result.error);
      setBusy(null);
      return;
    }

    setActions((prev) => prev.filter((a) => a.id !== action.id));

    if (decision === "approve" && "route" in result && result.route) {
      if ("actionId" in result && typeof result.actionId === "number") {
        markActionNavigated(result.actionId);
      }
      navigateTo(result.route, { minimizeChat: true });
    } else {
      router.refresh();
    }
    setBusy(null);
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-zinc-900/60">
      <div className="flex flex-col gap-3 border-b border-white/10 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div>
          <h2 className="text-sm font-semibold text-zinc-100">Acties vandaag</h2>
          <p className="text-xs text-zinc-500">
            {actions.length} openstaand · gesorteerd op urgentie
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {TABS.map((t) => {
            const count =
              t.id === "all"
                ? actions.length
                : actions.filter((a) => a.type === t.id).length;
            if (t.id !== "all" && count === 0) return null;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  tab === t.id
                    ? "bg-white/10 text-zinc-100"
                    : "text-zinc-500 hover:bg-white/5 hover:text-zinc-300"
                }`}
              >
                {t.label}
                {count > 0 ? ` (${count})` : ""}
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-4 sm:p-5">
        {error && (
          <p
            role="alert"
            className="mb-3 rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-300"
          >
            {error}
          </p>
        )}

        {filtered.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm text-zinc-400">Geen open acties in deze categorie.</p>
            <p className="mt-1 text-xs text-zinc-600">
              Alles is bij — {isDemo ? "demo" : "Nova"} blijft monitoren.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filtered.map((action) => {
              const meta = typeMeta[action.type];
              const urgency = urgencyMeta[action.urgency];
              const Icon = meta.icon;

              return (
                <div
                  key={action.id}
                  className={`rounded-xl border p-4 transition-colors ${
                    action.urgency === "urgent"
                      ? "border-rose-500/20 bg-rose-500/[0.04]"
                      : "border-white/10 bg-white/[0.02]"
                  }`}
                >
                  <div className="flex flex-wrap items-start gap-3">
                    <span
                      className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${meta.tone}`}
                    >
                      <Icon size={11} />
                      {meta.label}
                    </span>
                    <span
                      className={`inline-flex rounded-md border px-2 py-0.5 text-[10px] font-medium ${urgency.tone}`}
                    >
                      {urgency.label}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-zinc-100">{action.title}</p>
                      <p className="mt-1 text-xs text-zinc-500">
                        Klant: <span className="text-zinc-400">{action.client}</span>
                        {action.value ? (
                          <>
                            {" "}
                            · Waarde:{" "}
                            <span className="text-zinc-300">{action.value}</span>
                          </>
                        ) : null}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                        {action.detail}
                        {action.agent ? (
                          <span className="text-zinc-600">
                            {" "}
                            · Gemaakt door {action.agent}
                          </span>
                        ) : null}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5">
                      {action.type === "ai" && action.actionId ? (
                        <>
                          <Link
                            href={action.href}
                            className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-white/5"
                          >
                            Bekijken
                          </Link>
                          <button
                            type="button"
                            onClick={() => resolve(action, "approve")}
                            disabled={busy === action.id}
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/15 px-2.5 py-1.5 text-xs font-medium text-emerald-400 transition-colors hover:bg-emerald-500/25 disabled:opacity-60"
                          >
                            {busy === action.id ? (
                              <Loader2 size={13} className="animate-spin" />
                            ) : (
                              <Check size={13} />
                            )}
                            Goedkeuren
                          </button>
                          <button
                            type="button"
                            onClick={() => resolve(action, "reject")}
                            disabled={busy === action.id}
                            aria-label="Afwijzen"
                            className="grid h-8 w-8 place-items-center rounded-lg text-zinc-500 transition-colors hover:bg-white/5 hover:text-rose-400 disabled:opacity-60"
                          >
                            <X size={14} />
                          </button>
                        </>
                      ) : (
                        <>
                          <Link
                            href={action.href}
                            className="inline-flex items-center gap-1 rounded-lg bg-sky-500/15 px-3 py-1.5 text-xs font-medium text-sky-300 transition-colors hover:bg-sky-500/25"
                          >
                            {action.primaryLabel}
                            <ExternalLink size={12} />
                          </Link>
                          {action.urgency === "urgent" && (
                            <span className="grid h-8 w-8 place-items-center text-rose-400">
                              <AlertCircle size={15} />
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
