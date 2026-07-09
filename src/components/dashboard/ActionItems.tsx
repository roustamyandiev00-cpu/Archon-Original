"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, Receipt, Send, Check, X, Loader2 } from "lucide-react";
import { decideAction } from "@/app/dashboard/automatisaties/actions";

export type ActionItem = {
  id: number;
  title: string;
  detail: string;
  kind: "offerte" | "factuur" | "opvolging";
};

const kindMeta = {
  offerte: { icon: FileText, tone: "bg-sky-500/12 text-sky-400" },
  factuur: { icon: Receipt, tone: "bg-amber-500/12 text-amber-400" },
  opvolging: { icon: Send, tone: "bg-indigo-500/12 text-indigo-400" },
} as const;

export default function ActionItems({
  items,
  demoMode = false,
}: {
  items: ActionItem[];
  demoMode?: boolean;
}) {
  const router = useRouter();
  const [actions, setActions] = useState(items);
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function resolve(id: number, status: "approved" | "rejected") {
    if (demoMode || id < 0) {
      router.push("/dashboard/automatisaties");
      return;
    }
    setBusy(id);
    setError(null);
    const decision = status === "approved" ? "approve" : "reject";
    const result = await decideAction(id, decision);
    if ("error" in result && result.error) {
      setError(result.error);
      setBusy(null);
      return;
    }
    setActions((a) => a.filter((x) => x.id !== id));
    if (status === "approved" && "route" in result && result.route) {
      router.push(result.route);
    } else {
      router.refresh();
    }
    setBusy(null);
  }

  if (actions.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-zinc-500">
        Alles afgehandeld — niks te doen.
      </p>
    );
  }

  return (
    <div className="space-y-2.5">
      {error && (
        <p role="alert" className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
          {error}
        </p>
      )}
      {actions.map((item) => {
        const meta = kindMeta[item.kind];
        return (
          <div
            key={item.id}
            className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-3"
          >
            <span
              className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${meta.tone}`}
            >
              <meta.icon size={16} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-zinc-100">
                {item.title}
              </p>
              <p className="truncate text-xs text-zinc-500">{item.detail}</p>
            </div>
            <div className="flex items-center gap-1.5">
              {demoMode || item.id < 0 ? (
                <Link
                  href="/dashboard/automatisaties"
                  className="inline-flex items-center gap-1 rounded-lg bg-sky-500/15 px-2.5 py-1.5 text-xs font-medium text-sky-300 transition-colors hover:bg-sky-500/25"
                >
                  Bekijken
                </Link>
              ) : (
                <>
              <button
                onClick={() => resolve(item.id, "approved")}
                disabled={busy === item.id}
                className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/15 px-2.5 py-1.5 text-xs font-medium text-emerald-400 transition-colors hover:bg-emerald-500/25 disabled:opacity-60"
              >
                {busy === item.id ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Check size={14} />
                )}{" "}
                Goedkeuren
              </button>
              <button
                onClick={() => resolve(item.id, "rejected")}
                disabled={busy === item.id}
                aria-label="Afwijzen"
                className="grid h-7 w-7 place-items-center rounded-lg text-zinc-500 transition-colors hover:bg-white/5 hover:text-rose-400 disabled:opacity-60"
              >
                <X size={14} />
              </button>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
