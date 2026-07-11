"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import { markFactuurAsPaid } from "@/app/dashboard/facturen/actions";
import { Button } from "@/components/ui/button";

export default function MarkFactuurPaidButton({
  factuurId,
  nummer,
  disabled = false,
  variant = "default",
  className,
  onDone,
}: {
  factuurId: number;
  nummer: string;
  disabled?: boolean;
  variant?: "default" | "menu";
  className?: string;
  onDone?: () => void;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setBusy(true);
    setError(null);

    const result = await markFactuurAsPaid(factuurId);

    if ("error" in result && result.error) {
      setError(result.error);
      setBusy(false);
      return;
    }

    onDone?.();
    router.refresh();
    setBusy(false);
  }

  if (variant === "menu") {
    return (
      <>
        <button
          type="button"
          disabled={disabled || busy}
          onClick={() => void handleClick()}
          className={`block w-full px-3 py-2 text-left text-sm text-emerald-700 hover:bg-emerald-50 disabled:opacity-50 dark:text-emerald-300 dark:hover:bg-emerald-500/10 ${className ?? ""}`}
        >
          {busy ? "Bezig…" : "Markeer als betaald"}
        </button>
        {error ? (
          <p className="px-3 pb-2 text-xs text-rose-500">{error}</p>
        ) : null}
      </>
    );
  }

  return (
    <div className={className}>
      <Button
        type="button"
        disabled={disabled || busy}
        onClick={() => void handleClick()}
        className="gap-2 bg-emerald-600 text-white hover:bg-emerald-500"
      >
        {busy ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <CheckCircle2 size={16} />
        )}
        Markeer {nummer} als betaald
      </Button>
      {error ? (
        <p className="mt-2 text-xs text-rose-400">{error}</p>
      ) : null}
    </div>
  );
}
