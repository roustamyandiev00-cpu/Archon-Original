/**
 * Contactgegevens-detectie voor bouwnetwerk-chat (§4.5).
 * Soft-waarschuwing vóór signed contract; mag daarna door.
 */

export type ContactHit = {
  kind: "email" | "phone" | "whatsapp" | "url";
  match: string;
};

const EMAIL_RE =
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const PHONE_RE =
  /(?:\+|00)?(?:32|31|33)?[\s./-]?(?:\(?0?\d{1,3}\)?[\s./-]?)?\d{2,4}[\s./-]?\d{2,4}[\s./-]?\d{2,4}\b/g;
const WHATSAPP_RE =
  /(?:wa\.me\/|whatsapp\.com\/|whatsapp)/gi;
const URL_RE =
  /\b(?:https?:\/\/|www\.)[^\s<>"']+/gi;

export function detectContactDetails(text: string): ContactHit[] {
  if (!text.trim()) return [];
  const hits: ContactHit[] = [];
  const seen = new Set<string>();

  const push = (kind: ContactHit["kind"], match: string) => {
    const key = `${kind}:${match.toLowerCase()}`;
    if (seen.has(key)) return;
    seen.add(key);
    hits.push({ kind, match });
  };

  for (const m of text.match(EMAIL_RE) ?? []) push("email", m);
  for (const m of text.match(WHATSAPP_RE) ?? []) push("whatsapp", m);
  for (const m of text.match(URL_RE) ?? []) {
    if (/whatsapp|wa\.me/i.test(m)) continue;
    push("url", m);
  }
  for (const m of text.match(PHONE_RE) ?? []) {
    const digits = m.replace(/\D/g, "");
    if (digits.length < 8 || digits.length > 15) continue;
    // Filter dates / bedragen with few separators
    if (/^\d{1,2}[./]\d{1,2}([./]\d{2,4})?$/.test(m.trim())) continue;
    push("phone", m.trim());
  }

  return hits;
}

export function contactWarningMessage(hits: ContactHit[]): string {
  const kinds = [...new Set(hits.map((h) => h.kind))].join(", ");
  return (
    `Contactgegevens gedetecteerd (${kinds}). Deel telefoon/e-mail/WhatsApp pas ` +
    `nadat er een ondertekend samenwerkingscontract is — anders kan dit tot een ` +
    `waarschuwing leiden.`
  );
}
