"use client";

import { useState } from "react";
import { Check, Copy, Gift, Share2 } from "lucide-react";
import { REFERRAL_REWARDS } from "@/components/ReferralProgram";
import { buildReferralRegisterUrl } from "@/lib/referral";

export default function ReferralInvitePanel({
  referralCode,
}: {
  referralCode: string;
}) {
  const [copied, setCopied] = useState<"code" | "link" | null>(null);

  const shareUrl =
    typeof window !== "undefined"
      ? buildReferralRegisterUrl(referralCode, window.location.origin)
      : buildReferralRegisterUrl(referralCode);

  async function copy(value: string, kind: "code" | "link") {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(kind);
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      /* clipboard niet beschikbaar */
    }
  }

  return (
    <div className="rounded-2xl border border-violet-500/25 bg-gradient-to-br from-violet-500/10 via-zinc-900/40 to-sky-500/10 p-5">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-500/15 text-violet-300">
          <Gift size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-violet-100">
            Nodig vrienden uit
          </p>
          <p className="mt-1 text-sm leading-relaxed text-zinc-400">
            Deel je persoonlijke code. Jij krijgt{" "}
            <span className="text-zinc-200">{REFERRAL_REWARDS.inviter}</span>,
            zij krijgen{" "}
            <span className="text-zinc-200">{REFERRAL_REWARDS.invitee}</span>.
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-center justify-between gap-3 rounded-xl border border-white/10 bg-zinc-950/50 px-4 py-3">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
              Jouw code
            </p>
            <p className="mt-0.5 font-mono text-lg font-semibold tracking-wider text-violet-200">
              {referralCode}
            </p>
          </div>
          <button
            type="button"
            onClick={() => copy(referralCode, "code")}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-zinc-200 transition-colors hover:border-white/20 hover:bg-white/[0.07]"
          >
            {copied === "code" ? (
              <>
                <Check size={14} className="text-emerald-400" />
                Gekopieerd
              </>
            ) : (
              <>
                <Copy size={14} />
                Kopieer
              </>
            )}
          </button>
        </div>

        <button
          type="button"
          onClick={() => copy(shareUrl, "link")}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-3 text-sm font-medium text-violet-200 transition-colors hover:border-violet-400/40 hover:bg-violet-500/15"
        >
          {copied === "link" ? (
            <>
              <Check size={16} className="text-emerald-400" />
              Link gekopieerd
            </>
          ) : (
            <>
              <Share2 size={16} />
              Deel uitnodigingslink
            </>
          )}
        </button>
      </div>
    </div>
  );
}
