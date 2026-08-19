"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck } from "lucide-react";
import { acceptChatTerms } from "@/app/dashboard/comms/chat-terms-actions";
import {
  CHAT_TERMS_BODY,
  CHAT_TERMS_TITLE,
  CHAT_TERMS_VERSION,
} from "@/lib/bouwnetwerk/chat-terms";

export default function ChatTermsModal({
  open,
  onAccepted,
}: {
  open: boolean;
  onAccepted?: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  if (!open) return null;

  function accept() {
    if (!checked) {
      setError("Bevestig dat je akkoord gaat.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await acceptChatTerms();
      if ("error" in res && res.error) {
        setError(res.error);
        return;
      }
      onAccepted?.();
      router.refresh();
    });
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-zinc-950/85 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-zinc-900 p-6 shadow-2xl">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sky-500/15 text-sky-400">
            <ShieldCheck size={18} />
          </span>
          <div>
            <h2 className="text-lg font-semibold text-zinc-50">
              {CHAT_TERMS_TITLE}
            </h2>
            <p className="mt-0.5 text-[11px] text-zinc-500">
              Versie {CHAT_TERMS_VERSION}
            </p>
          </div>
        </div>

        <div className="mt-4 max-h-56 space-y-3 overflow-y-auto rounded-xl border border-white/5 bg-zinc-950/50 p-4 text-sm leading-relaxed text-zinc-300 whitespace-pre-line">
          {CHAT_TERMS_BODY}
        </div>

        <label className="mt-4 flex items-start gap-2.5 text-sm text-zinc-300">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            className="mt-1 rounded border-white/20 bg-zinc-900"
          />
          <span>
            Ik ga akkoord met de chatregels en geef toestemming voor gecontroleerde
            opslag van berichten.
          </span>
        </label>

        {error && <p className="mt-2 text-xs text-rose-400">{error}</p>}

        <button
          type="button"
          onClick={accept}
          disabled={pending}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {pending && <Loader2 size={14} className="animate-spin" />}
          Akkoord & doorgaan
        </button>
      </div>
    </div>
  );
}
