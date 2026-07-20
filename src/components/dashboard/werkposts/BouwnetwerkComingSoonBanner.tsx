"use client";

import { useEffect, useState } from "react";
import { Rocket, Users, X } from "lucide-react";

import {
  BOUWNETWERK_REQUIRED_USERS,
  bouwnetwerkProgressPercent,
  isBouwnetwerkUnlocked,
} from "@/lib/bouwnetwerk-gate";

const STORAGE_KEY = "archonpro:wip-dismissed:bouwnetwerk";

export function BouwnetwerkComingSoonBanner({
  registeredUsers = 0,
  requiredUsers = BOUWNETWERK_REQUIRED_USERS,
}: {
  registeredUsers?: number;
  requiredUsers?: number;
}) {
  const [visible, setVisible] = useState(false);
  const progressPercent = bouwnetwerkProgressPercent(
    registeredUsers,
    requiredUsers,
  );
  const unlocked = isBouwnetwerkUnlocked(registeredUsers, requiredUsers);

  useEffect(() => {
    if (unlocked) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVisible(false);
      return;
    }
    try {
      setVisible(window.localStorage.getItem(STORAGE_KEY) !== "1");
    } catch {
      setVisible(true);
    }
  }, [unlocked]);

  function dismiss() {
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore
    }
    setVisible(false);
  }

  if (!visible || unlocked) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-orange-500/25 bg-orange-500/5 px-5 py-5">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-orange-500/10 blur-3xl"
      />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-orange-500/25 bg-orange-500/10 text-orange-400">
            <Rocket size={17} />
          </span>
          <div>
            <div className="flex items-start justify-between gap-3">
              <p className="font-semibold text-zinc-100">
                Bouwnetwerk &amp; Samenwerkingen worden actief bij{" "}
                <span className="text-orange-400">
                  {requiredUsers} geregistreerde gebruikers
                </span>
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
              Deze modules zijn nog in ontwikkeling en nog niet beschikbaar
              voor gebruik. De teller in de topbar toont het echte aantal
              registraties op ArchonPro.
            </p>
            <button
              type="button"
              onClick={dismiss}
              className="mt-3 inline-flex rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1.5 text-xs font-medium text-orange-200 transition-colors hover:bg-orange-500/15"
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
            <p className="text-2xl font-bold text-orange-400 tabular-nums">
              {registeredUsers}
              <span className="text-sm font-normal text-orange-500/70">
                /{requiredUsers}
              </span>
            </p>
            <div className="h-1.5 w-28 overflow-hidden rounded-full bg-zinc-800">
              <div
                className="h-full rounded-full bg-orange-500 transition-all duration-500"
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
