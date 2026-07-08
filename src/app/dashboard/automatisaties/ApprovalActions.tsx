"use client";

import { useState, useTransition } from "react";
import { ThumbsUp, ThumbsDown, Loader2 } from "lucide-react";
import { decideAction } from "./actions";

export default function ApprovalActions({ id }: { id: number }) {
  const [pending, startTransition] = useTransition();
  const [acting, setActing] = useState<"approve" | "reject" | null>(null);
  const [error, setError] = useState<string | null>(null);

  function decide(decision: "approve" | "reject") {
    setActing(decision);
    setError(null);
    startTransition(async () => {
      const res = await decideAction(id, decision);
      if (res?.error) setError(res.error);
      setActing(null);
    });
  }

  return (
    <div className="flex items-center gap-1.5">
      {error && <span className="text-[10px] text-rose-400">{error}</span>}
      <button
        onClick={() => decide("approve")}
        disabled={pending}
        className="inline-flex items-center gap-1 rounded bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-400 transition-colors hover:bg-emerald-500/25 disabled:opacity-50"
      >
        {acting === "approve" ? (
          <Loader2 size={10} className="animate-spin" />
        ) : (
          <ThumbsUp size={10} />
        )}
        Goedkeuren
      </button>
      <button
        onClick={() => decide("reject")}
        disabled={pending}
        className="inline-flex items-center gap-1 rounded bg-rose-500/15 px-2 py-0.5 text-[10px] font-medium text-rose-400 transition-colors hover:bg-rose-500/25 disabled:opacity-50"
      >
        {acting === "reject" ? (
          <Loader2 size={10} className="animate-spin" />
        ) : (
          <ThumbsDown size={10} />
        )}
        Afwijzen
      </button>
    </div>
  );
}
