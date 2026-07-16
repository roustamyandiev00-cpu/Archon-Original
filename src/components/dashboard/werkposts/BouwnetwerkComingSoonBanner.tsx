"use client";

import { useEffect, useState } from "react";
import { Rocket, Users, X } from "lucide-react";

const REQUIRED_USERS = 100;
// Pas dit getal aan via de admin zodra het platform groeit
const CURRENT_USERS = 12;
const STORAGE_KEY = "archonpro:wip-dismissed:bouwnetwerk";

export function BouwnetwerkComingSoonBanner() {
  const [visible, setVisible] = useState(false);
  const progressPercent = Math.min(
    Math.round((CURRENT_USERS / REQUIRED_USERS) * 100),
    100,
  );

  useEffect(() => {
    try {
      setVisible(window.localStorage.getItem(STORAGE_KEY) !== "1");
    } catch {
      setVisible(true);
    }
  }, []);

  function dismiss() {
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-sky-500/20 bg-sky-500/5 px-5 py-5">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-sky-500/10 blur-3xl"
      />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-sky-500/20 bg-sky-500/10 text-sky-400">
            <Rocket size={17} />
          </span>
          <div>
            <div className="flex items-start justify-between gap-3">
              <p className="font-semibold text-zinc-100">
                Bouwnetwerk wordt actief bij{" "}
                <span className="text-sky-400">{REQUIRED_USERS} gebruikers</span>
              </p>
              <button
                type="button"
                onClick={dismiss}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-zinc-500 transition-colors hover:bg-white/5 hover:text-zinc-200 sm:hidden"
                aria-label="Melding verbergen"
              >
                <X size={16} />
              </button>
            </div>
            <p className="mt-0.5 max-w-xl text-sm text-zinc-400">
              Je kan alles al bekijken en instellen. Zodra het platform{" "}
              {REQUIRED_USERS} actieve bouwbedrijven bereikt, gaat het netwerk
              live en kan je echt samenwerken en matchen.
            </p>
            <button
              type="button"
              onClick={dismiss}
              className="mt-3 inline-flex rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1.5 text-xs font-medium text-sky-200 transition-colors hover:bg-sky-500/15"
            >
              Begrepen, verberg dit
            </button>
          </div>
        </div>

        <div className="flex shrink-0 items-start gap-2">
          <div className="flex flex-col items-center gap-1.5 rounded-xl border border-white/10 bg-zinc-900/60 px-5 py-3 text-center">
            <div className="flex items-center gap-2 text-zinc-300">
              <Users size={14} />
              <span className="text-xs font-medium uppercase tracking-wide">
                Voortgang
              </span>
            </div>
            <p className="text-2xl font-bold text-zinc-50">
              {CURRENT_USERS}
              <span className="text-sm font-normal text-zinc-500">
                /{REQUIRED_USERS}
              </span>
            </p>
            <div className="h-1.5 w-28 overflow-hidden rounded-full bg-zinc-800">
              <div
                className="h-full rounded-full bg-sky-500 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-[11px] text-zinc-500">{progressPercent}% bereikt</p>
          </div>
          <button
            type="button"
            onClick={dismiss}
            className="hidden h-8 w-8 shrink-0 place-items-center rounded-lg text-zinc-500 transition-colors hover:bg-white/5 hover:text-zinc-200 sm:grid"
            aria-label="Melding verbergen"
            title="Melding verbergen"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
