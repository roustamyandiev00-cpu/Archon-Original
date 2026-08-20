"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ThumbsUp, ThumbsDown, Loader2 } from "lucide-react";
import { decideAction } from "./actions";
import { useAgentNavigation } from "@/components/dashboard/agent-navigation/AgentNavigationProvider";

export default function ApprovalActions({ id }: { id: number }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const { navigateTo, markActionNavigated } = useAgentNavigation();
  const [acting, setActing] = useState<"approve" | "reject" | null>(null);
  const [error, setError] = useState<string | null>(null);

  function decide(decision: "approve" | "reject") {
    setActing(decision);
    setError(null);
    startTransition(async () => {
      const res = await decideAction(id, decision);
      if (res?.error) {
        setError(res.error);
      } else if (decision === "approve" && res && "route" in res && res.route) {
        if ("actionId" in res && typeof res.actionId === "number") {
          markActionNavigated(res.actionId);
        }
        if ("mailto" in res && typeof res.mailto === "string") {
          window.open(res.mailto, "_blank");
        }
        if ("bailiffMailto" in res && typeof res.bailiffMailto === "string") {
          window.open(res.bailiffMailto, "_blank");
        }
        navigateTo(res.route, { minimizeChat: true });
      } else {
        router.refresh();
      }
      setActing(null);
    });
  }

  return (
    <div className="flex w-full flex-col items-start gap-2 sm:w-auto sm:items-end">
      {error && (
        <span
          role="alert"
          className="max-w-xs text-xs leading-5 text-rose-400"
        >
          {error}
        </span>
      )}
      <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
        <button
          type="button"
          onClick={() => decide("approve")}
          disabled={pending}
          className="inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-500/15 px-3 py-2 text-xs font-medium text-emerald-400 transition-colors hover:bg-emerald-500/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
        >
          {acting === "approve" ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <ThumbsUp size={13} />
          )}
          Goedkeuren
        </button>
        <button
          type="button"
          onClick={() => decide("reject")}
          disabled={pending}
          className="inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-rose-500/15 px-3 py-2 text-xs font-medium text-rose-400 transition-colors hover:bg-rose-500/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/70 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
        >
          {acting === "reject" ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <ThumbsDown size={13} />
          )}
          Afwijzen
        </button>
      </div>
    </div>
  );
}
