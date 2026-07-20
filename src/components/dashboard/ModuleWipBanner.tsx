"use client";

import { useEffect, useState } from "react";
import { Construction, X } from "lucide-react";

type Props = {
  /** Unieke sleutel per module, bv. "agenda" of "team". */
  moduleId: string;
  title?: string;
  description?: string;
};

function storageKey(moduleId: string) {
  return `archonpro:wip-dismissed:${moduleId}`;
}

export default function ModuleWipBanner({
  moduleId,
  title = "Nog in ontwikkeling",
  description = "Je kan deze pagina al openen en bekijken. De functionaliteit wordt verder afgewerkt — zodra alles klaar is, verdwijnt deze melding vanzelf uit de productflow.",
}: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const dismissed = window.localStorage.getItem(storageKey(moduleId));
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVisible(dismissed !== "1");
    } catch {
      setVisible(true);
    }
  }, [moduleId]);

  function dismiss() {
    try {
      window.localStorage.setItem(storageKey(moduleId), "1");
    } catch {
      // localStorage kan geblokkeerd zijn — banner gewoon verbergen
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-amber-500/25 bg-amber-500/5 px-4 py-4 sm:px-5">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-amber-500/10 blur-3xl"
      />
      <div className="relative flex items-start gap-3">
        <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-amber-500/25 bg-amber-500/10 text-amber-300">
          <Construction size={17} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-zinc-100">{title}</p>
              <p className="mt-0.5 text-sm text-zinc-400">{description}</p>
            </div>
            <button
              type="button"
              onClick={dismiss}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-zinc-500 transition-colors hover:bg-white/5 hover:text-zinc-200"
              aria-label="Melding verbergen"
              title="Melding verbergen"
            >
              <X size={16} />
            </button>
          </div>
          <button
            type="button"
            onClick={dismiss}
            className="mt-3 inline-flex rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-200 transition-colors hover:bg-amber-500/15"
          >
            Begrepen, verberg dit
          </button>
        </div>
      </div>
    </div>
  );
}
