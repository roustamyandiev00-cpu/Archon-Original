"use client";

import Image from "next/image";
import { useState, useSyncExternalStore } from "react";
import { Share, X } from "lucide-react";
import { LogoMark } from "@/components/BrandLogo";
import {
  canShowAddToHomeScreenPrompt,
  dismissAddToHomeScreenPrompt,
  isIosSafari,
  isStandaloneDisplay,
} from "@/lib/pwa";

type AddToHomeScreenPromptProps = {
  /** Compacte variant voor onderaan het dashboard. */
  variant?: "banner" | "card";
};

const subscribeToClient = () => () => {};
const serverPromptSnapshot = () => false;

function InstallSteps() {
  return (
    <ol className="mt-4 space-y-2.5 text-sm text-zinc-300">
      <li className="flex items-start gap-2.5">
        <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/8 text-xs font-semibold text-sky-300">
          1
        </span>
        <span>
          Open de pagina in <strong className="font-medium text-zinc-100">Safari</strong>{" "}
          (niet Chrome).
        </span>
      </li>
      <li className="flex items-start gap-2.5">
        <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/8 text-xs font-semibold text-sky-300">
          2
        </span>
        <span>
          Tik onderaan op{" "}
          <Share size={14} className="mb-0.5 inline text-sky-400" />{" "}
          <strong className="font-medium text-zinc-100">Deel</strong>
        </span>
      </li>
      <li className="flex items-start gap-2.5">
        <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/8 text-xs font-semibold text-sky-300">
          3
        </span>
        <span>
          Kies{" "}
          <strong className="font-medium text-zinc-100">Zet op beginscherm</strong>
        </span>
      </li>
      <li className="flex items-start gap-2.5">
        <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/8 text-xs font-semibold text-sky-300">
          4
        </span>
        <span>
          Tik <strong className="font-medium text-zinc-100">Voeg toe</strong> — het AP-icoon
          staat op je beginscherm.
        </span>
      </li>
    </ol>
  );
}

export default function AddToHomeScreenPrompt({
  variant = "banner",
}: AddToHomeScreenPromptProps) {
  const canShow = useSyncExternalStore(
    subscribeToClient,
    canShowAddToHomeScreenPrompt,
    serverPromptSnapshot,
  );
  const needsSafari = useSyncExternalStore(
    subscribeToClient,
    () => !isIosSafari() && !isStandaloneDisplay(),
    serverPromptSnapshot,
  );
  const [dismissed, setDismissed] = useState(false);
  const visible = canShow && !dismissed;

  if (!visible) return null;

  function handleDismiss() {
    dismissAddToHomeScreenPrompt();
    setDismissed(true);
  }

  const iconPreview = (
    <div className="flex flex-col items-center gap-2">
      <div className="rounded-[1.35rem] bg-zinc-900 p-1 shadow-lg shadow-black/40">
        <Image
          src="/apple-icon.png"
          alt="ArchonPro app-icoon"
          width={72}
          height={72}
          className="h-[4.5rem] w-[4.5rem] rounded-[1.15rem]"
          unoptimized
        />
      </div>
      <p className="text-[11px] font-medium text-zinc-500">Zo ziet het icoon eruit</p>
    </div>
  );

  if (variant === "card") {
    return (
      <section className="w-full rounded-3xl border border-sky-500/25 bg-gradient-to-br from-sky-500/10 via-zinc-950 to-zinc-950 p-5 text-zinc-100">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          {iconPreview}
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <div className="flex items-center justify-center gap-2 sm:justify-start">
              <LogoMark size={28} glow={false} />
              <h2 className="text-base font-semibold">Zet ArchonPro op je beginscherm</h2>
            </div>
            <p className="mt-1 text-sm text-zinc-400">
              Open de app met één tik — zonder Safari-adresbalk.
            </p>
            {needsSafari ? (
              <p className="mt-2 text-xs text-amber-300/90">
                Tip: kopieer de link en open hem in Safari voor het icoon.
              </p>
            ) : null}
          </div>
        </div>

        <InstallSteps />

        <button
          type="button"
          onClick={handleDismiss}
          className="mt-4 text-xs text-zinc-500 transition-colors hover:text-zinc-300"
        >
          Niet nu
        </button>
      </section>
    );
  }

  return (
    <div
      className="fixed inset-x-0 z-[60] px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] md:hidden"
      style={{ bottom: "calc(4.5rem + env(safe-area-inset-bottom))" }}
    >
      <div className="mx-auto max-w-md rounded-2xl border border-sky-500/30 bg-zinc-950/95 p-4 shadow-2xl shadow-black/40 backdrop-blur-md">
        <div className="flex items-start gap-3">
          <Image
            src="/apple-icon.png"
            alt="ArchonPro app-icoon"
            width={44}
            height={44}
            className="h-11 w-11 shrink-0 rounded-xl"
            unoptimized
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-zinc-50">ArchonPro op je beginscherm</p>
            <p className="mt-0.5 text-xs leading-relaxed text-zinc-400">
              Deel → Zet op beginscherm → AP-icoon vast op je iPhone.
            </p>
            {needsSafari ? (
              <p className="mt-1 text-[11px] text-amber-300/90">Gebruik Safari voor dit icoon.</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Sluiten"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-zinc-500 transition-colors hover:bg-white/5 hover:text-zinc-300"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
