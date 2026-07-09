"use client";

import { useState } from "react";
import { Mail, MessageCircle, Phone, Link2, Check } from "lucide-react";
import { formatEuro } from "@/lib/offertes";

type Soort = "offerte" | "factuur" | "proforma";

/**
 * Zet een (Belgisch) telefoonnummer om naar een wa.me-formaat:
 * enkel cijfers, landcode zonder "+". Nummers die met 0 beginnen worden
 * als Belgisch (+32) behandeld.
 */
function toWhatsappNumber(phone: string): string {
  const digits = phone.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return digits.slice(1);
  if (digits.startsWith("00")) return digits.slice(2);
  if (digits.startsWith("0")) return "32" + digits.slice(1);
  return digits;
}

function berichtTekst(
  soort: Soort,
  nummer: string,
  klant: string,
  bedrag: number | null,
): string {
  const label =
    soort === "factuur"
      ? "factuur"
      : soort === "proforma"
        ? "proforma"
        : "offerte";
  const bedragTekst =
    bedrag != null ? ` ter waarde van ${formatEuro(bedrag)}` : "";
  return `Beste ${klant},\n\nHierbij ${label} ${nummer}${bedragTekst}. Heeft u nog vragen, laat het gerust weten.\n\nMet vriendelijke groet`;
}

export default function DocumentContactActions({
  soort,
  nummer,
  klant,
  bedrag,
  email,
  phone,
  detailPath,
}: {
  soort: Soort;
  nummer: string;
  klant: string;
  bedrag: number | null;
  email: string | null;
  phone: string | null;
  detailPath?: string;
}) {
  const [copied, setCopied] = useState(false);

  const label =
    soort === "factuur"
      ? "Factuur"
      : soort === "proforma"
        ? "Proforma"
        : "Offerte";
  const bericht = berichtTekst(soort, nummer, klant, bedrag);

  const mailtoHref = email
    ? `mailto:${email}?subject=${encodeURIComponent(
        `${label} ${nummer}`,
      )}&body=${encodeURIComponent(bericht)}`
    : undefined;

  const whatsappHref = phone
    ? `https://wa.me/${toWhatsappNumber(phone)}?text=${encodeURIComponent(
        bericht,
      )}`
    : undefined;

  const telHref = phone ? `tel:${phone.replace(/\s+/g, "")}` : undefined;

  async function copyLink() {
    if (!detailPath) return;
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}${detailPath}`
        : detailPath;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // stil falen — sommige browsers blokkeren clipboard zonder https
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      <IconAction
        as="a"
        href={mailtoHref}
        disabled={!email}
        title={email ? `E-mail naar ${email}` : "Geen e-mailadres bekend"}
        colorClass="text-sky-400 hover:bg-sky-500/15 hover:text-sky-300"
        label="E-mail versturen"
      >
        <Mail size={15} />
      </IconAction>

      <IconAction
        as="a"
        href={whatsappHref}
        target="_blank"
        disabled={!phone}
        title={phone ? "Versturen via WhatsApp" : "Geen telefoonnummer bekend"}
        colorClass="text-emerald-400 hover:bg-emerald-500/15 hover:text-emerald-300"
        label="WhatsApp"
      >
        <MessageCircle size={15} />
      </IconAction>

      <IconAction
        as="a"
        href={telHref}
        disabled={!phone}
        title={phone ? `Bellen: ${phone}` : "Geen telefoonnummer bekend"}
        colorClass="text-indigo-400 hover:bg-indigo-500/15 hover:text-indigo-300"
        label="Bellen"
      >
        <Phone size={15} />
      </IconAction>

      {detailPath && (
        <IconAction
          as="button"
          onClick={copyLink}
          disabled={false}
          title="Link kopiëren"
          colorClass={
            copied
              ? "text-emerald-400 bg-emerald-500/15"
              : "text-zinc-400 hover:bg-white/10 hover:text-zinc-200"
          }
          label="Link kopiëren"
        >
          {copied ? <Check size={15} /> : <Link2 size={15} />}
        </IconAction>
      )}
    </div>
  );
}

function IconAction({
  as,
  href,
  target,
  onClick,
  disabled,
  title,
  colorClass,
  label,
  children,
}: {
  as: "a" | "button";
  href?: string;
  target?: string;
  onClick?: () => void;
  disabled: boolean;
  title: string;
  colorClass: string;
  label: string;
  children: React.ReactNode;
}) {
  const base =
    "grid h-8 w-8 place-items-center rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/50";

  if (disabled || (as === "a" && !href)) {
    return (
      <span
        title={title}
        aria-label={label}
        className={`${base} cursor-not-allowed text-zinc-600`}
      >
        {children}
      </span>
    );
  }

  if (as === "a") {
    return (
      <a
        href={href}
        target={target}
        rel={target === "_blank" ? "noopener noreferrer" : undefined}
        title={title}
        aria-label={label}
        onClick={(e) => e.stopPropagation()}
        className={`${base} ${colorClass}`}
      >
        {children}
      </a>
    );
  }

  return (
    <button
      type="button"
      title={title}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      className={`${base} ${colorClass}`}
    >
      {children}
    </button>
  );
}
