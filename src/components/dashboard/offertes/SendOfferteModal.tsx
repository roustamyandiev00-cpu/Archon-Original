"use client";

import { useEffect, useState } from "react";
import {
  Check,
  Copy,
  Download,
  Link2,
  Loader2,
  Mail,
  MessageCircle,
  Send,
  X,
} from "lucide-react";
import {
  prepareOfferteShare,
  sendOfferteByEmail,
} from "@/app/dashboard/offertes/send-actions";

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
    shareUrl: string;
    sharePath: string;
    pdfUrl: string;
    mailtoUrl: string | null;
    whatsappUrl: string | null;
    nummer: string;
    klant: string;
    canSendViaSmtp: boolean;
    deliveryMode: "smtp" | "mailto";
    smtpConfigured: boolean;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState<string | null>(null);
  const [recipientEmail, setRecipientEmail] = useState("");

  useEffect(() => {
    let cancelled = false;

    const id = window.setTimeout(() => {
      if (!open) {
        setShare(null);
        setError(null);
        setCopied(false);
        setEmailSent(null);
        setRecipientEmail("");
        return;
      }

      void (async () => {
        setLoading(true);
        setError(null);
        const result = await prepareOfferteShare(offerteId);
        if (cancelled) return;
        setLoading(false);
        if ("error" in result && result.error) {
          setError(result.error);
          return;
        }
        if ("ok" in result && result.ok) {
          setShare({
            shareUrl: result.shareUrl!,
            sharePath: result.sharePath!,
            pdfUrl: result.pdfUrl!,
            mailtoUrl: result.mailtoUrl ?? null,
            whatsappUrl: result.whatsappUrl ?? null,
            nummer: result.nummer!,
            klant: result.klant!,
            canSendViaSmtp: Boolean(result.canSendViaSmtp),
            deliveryMode: result.deliveryMode ?? "mailto",
            smtpConfigured: Boolean(result.smtpConfigured),
          });
          if ("customerEmail" in result && result.customerEmail) {
            setRecipientEmail(result.customerEmail);
          }
        }
      })();
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, [open, offerteId]);

  async function copyLink() {
    if (!share) return;
    try {
      await navigator.clipboard.writeText(share.shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Kopiëren mislukt. Selecteer de link handmatig.");
    }
  }

  async function sendByEmail() {
    setError(null);
    setEmailSent(null);
    setEmailSending(true);
    const result = await sendOfferteByEmail(offerteId, recipientEmail);
    setEmailSending(false);

    if ("error" in result) {
      const smtpMissing = "smtpMissing" in result && result.smtpMissing;
      setError(
        smtpMissing
          ? `${result.error} Je kunt de link hieronder wel handmatig delen.`
          : result.error ?? "E-mail verzenden mislukt.",
      );
      return;
    }

    if ("ok" in result && result.ok && "recipientEmail" in result) {
      setEmailSent(`Offerte verstuurd naar ${result.recipientEmail}.`);
      onSent?.();
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-900 p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-zinc-50">Offerte delen</h3>
            <p className="mt-1 text-sm text-zinc-400">
              Deel een publieke link. De klant hoeft niet in te loggen.
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

            <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
              <p className="truncate text-xs text-zinc-400">{share.shareUrl}</p>
            </div>

            <button
              type="button"
              onClick={() => void copyLink()}
              className="flex w-full items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-100 transition-colors hover:bg-white/10"
            >
              {copied ? (
                <Check size={16} className="text-emerald-400" />
              ) : (
                <Copy size={16} className="text-sky-400" />
              )}
              {copied ? "Link gekopieerd" : "Link kopiëren"}
            </button>

            <div>
              <label
                htmlFor="offerte-recipient-email"
                className="mb-1.5 block text-xs font-medium text-zinc-400"
              >
                Ontvanger e-mail
              </label>
              <input
                id="offerte-recipient-email"
                type="email"
                value={recipientEmail}
                onChange={(event) => setRecipientEmail(event.target.value)}
                placeholder="klant@bedrijf.be"
                disabled={emailSending || Boolean(emailSent)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-sky-500/60 disabled:cursor-not-allowed disabled:opacity-60"
              />
              <p className="mt-1 text-xs text-zinc-500">
                {share.canSendViaSmtp
                  ? "Wordt verstuurd via je SMTP/Gmail-instellingen."
                  : share.deliveryMode === "smtp" && !share.smtpConfigured
                    ? "SMTP gekozen, maar nog niet geconfigureerd in Instellingen → Integraties."
                    : "Verzendwijze: handmatig via e-mailprogramma (Instellingen → Integraties)."}
              </p>
            </div>

            {share.canSendViaSmtp ? (
              <button
                type="button"
                disabled={emailSending || Boolean(emailSent)}
                onClick={() => void sendByEmail()}
                className="flex w-full items-center gap-2 rounded-xl bg-sky-500 px-4 py-3 text-sm font-semibold text-zinc-950 transition-colors hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {emailSending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
                {emailSending
                  ? "Versturen…"
                  : "Via ArchonPro e-mail versturen"}
              </button>
            ) : null}

            {emailSent && (
              <p className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
                <Check size={16} />
                {emailSent}
              </p>
            )}

            <a
              href={share.sharePath}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-100 transition-colors hover:bg-white/10"
            >
              <Link2 size={16} className="text-sky-400" />
              Publieke pagina openen
            </a>

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
                className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm transition-colors ${
                  share.canSendViaSmtp
                    ? "border border-white/10 bg-white/5 text-zinc-100 hover:bg-white/10"
                    : "bg-sky-500 font-semibold text-zinc-950 hover:bg-sky-400"
                }`}
              >
                <Mail
                  size={16}
                  className={share.canSendViaSmtp ? "text-sky-400" : undefined}
                />
                {share.canSendViaSmtp
                  ? "E-mailprogramma openen"
                  : "E-mail openen"}
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
