"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { X, Sparkles } from "lucide-react";
import { MOBILE_MORE_LINKS } from "@/components/dashboard/nav-config";
import { TRIAL_DAYS } from "@/components/dashboard/trial";

type Props = {
  open: boolean;
  onClose: () => void;
  isPreviewMode?: boolean;
};

export default function MobileMoreSheet({
  open,
  onClose,
  isPreviewMode = false,
}: Props) {
  const pathname = usePathname();

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const links = isPreviewMode
    ? MOBILE_MORE_LINKS.filter((link) => link.href !== "/dashboard/instellingen")
    : MOBILE_MORE_LINKS;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        type="button"
        aria-label="Sluit menu"
        className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <div
        id="mobile-more-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mobile-more-sheet-title"
        className="mobile-more-sheet absolute inset-x-0 bottom-0 max-h-[78vh] overflow-hidden rounded-t-3xl border border-white/10 bg-zinc-950 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
          <div>
            <p id="mobile-more-sheet-title" className="text-sm font-semibold text-zinc-50">
              Meer
            </p>
            <p className="text-xs text-zinc-500">Overige dashboard-pagina&apos;s</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Sluit menu"
            className="grid h-9 w-9 place-items-center rounded-full bg-white/5 text-zinc-400 transition-colors hover:text-zinc-100"
          >
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto px-3 py-3 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <div className="grid grid-cols-2 gap-2">
            {links.map((link) => {
              const active =
                pathname === link.href ||
                pathname.startsWith(`${link.href}/`);
              const available = link.available !== false;

              return (
                <Link
                  key={link.href}
                  href={available ? link.href : "#"}
                  onClick={(event) => {
                    if (!available) event.preventDefault();
                    else onClose();
                  }}
                  aria-disabled={!available}
                  className={`flex flex-col items-start gap-3 rounded-2xl border px-4 py-4 transition-colors ${
                    !available
                      ? "cursor-default border-white/[0.04] bg-white/[0.02] opacity-50"
                      : active
                        ? "border-sky-500/30 bg-sky-500/10"
                        : "border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.05]"
                  }`}
                >
                  <span
                    className={`grid h-10 w-10 place-items-center rounded-xl ${
                      active ? "bg-sky-500/15 text-sky-400" : "bg-white/5 text-zinc-400"
                    }`}
                  >
                    <link.icon size={18} />
                  </span>
                  <span className="text-sm font-medium text-zinc-100">
                    {link.label}
                    {link.tag ? (
                      <span className="ml-1.5 rounded bg-amber-500/15 px-1 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-amber-300">
                        {link.tag}
                      </span>
                    ) : null}
                    {!available ? (
                      <span className="mt-0.5 block text-[10px] font-normal text-zinc-500">
                        Binnenkort
                      </span>
                    ) : null}
                  </span>
                </Link>
              );
            })}
          </div>

          {isPreviewMode && (
            <Link
              href="/register"
              onClick={onClose}
              className="mt-3 flex items-center justify-center gap-2 rounded-2xl bg-sky-500 px-4 py-3.5 text-sm font-semibold text-zinc-950"
            >
              <Sparkles size={16} />
              Start {TRIAL_DAYS} dagen gratis
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
