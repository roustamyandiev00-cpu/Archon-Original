"use client";

import { useEffect, useState } from "react";
import { Download, Mail, MessageCircle, X } from "lucide-react";
import { sendOfferteShare } from "@/app/dashboard/offertes/send-actions";

export default function SendOfferteModal({
  offerteId,
  open,
  onClose,
  onSent,
}: {
  offerteId: number;
  open: boolean;
  onClose: () => void;
  onSent?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [share, setShare] = useState<{
    pdfUrl: string;
    mailtoUrl: string | null;
    whatsappUrl: string | null;
    nummer: string;
    klant: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setShare(null);
      setError(null);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      const result = await sendOfferteShare(offerteId);
      if (cancelled) return;
      setLoading(false);
      if ("error" in result && result.error) {
        setError(result.error);
        return;
      }
      if ("ok" in result && result.ok) {
        setShare({
          pdfUrl: result.pdfUrl!,
          mailtoUrl: result.mailtoUrl ?? null,
          whatsappUrl: result.whatsappUrl ?? null,
          nummer: result.nummer!,
          klant: result.klant!,
        });
        onSent?.();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, offerteId, onSent]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-900 p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-zinc-50">Offerte delen</h3>
            <p className="mt-1 text-sm text-zinc-400">
              Download de PDF en stuur via e-mail of WhatsApp.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
            aria-label="Sluiten"
          >
            <X size={18} />
          </button>
        </div>

        {loading && (
          <p className="mt-6 text-sm text-zinc-400">Voorbereiden…</p>
        )}

        {error && (
          <p className="mt-6 text-sm text-rose-400">{error}</p>
        )}

        {share && (
          <div className="mt-6 space-y-2">
            <p className="text-sm text-zinc-300">
              {share.nummer} — {share.klant}
            </p>
            <a
              href={share.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-100 transition-colors hover:bg-white/10"
            >
              <Download size={16} className="text-sky-400" />
              PDF downloaden
            </a>
            {share.mailtoUrl ? (
              <a
                href={share.mailtoUrl}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-100 transition-colors hover:bg-white/10"
              >
                <Mail size={16} className="text-sky-400" />
                E-mail openen
              </a>
            ) : (
              <p className="text-xs text-zinc-500">Geen e-mailadres bij klant.</p>
            )}
            {share.whatsappUrl ? (
              <a
                href={share.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-100 transition-colors hover:bg-white/10"
              >
                <MessageCircle size={16} className="text-emerald-400" />
                WhatsApp openen
              </a>
            ) : (
              <p className="text-xs text-zinc-500">Geen telefoonnummer bij klant.</p>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-full border border-white/15 px-4 py-2.5 text-sm text-zinc-300 hover:bg-white/5"
        >
          Sluiten
        </button>
      </div>
    </div>
  );
}
