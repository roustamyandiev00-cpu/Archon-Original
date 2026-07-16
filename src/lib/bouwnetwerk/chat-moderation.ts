/**
 * Heuristische chat-moderatie (Fase 2) — voorstellen, geen auto-sanctie.
 */

export type ModerationCategory =
  | "belediging"
  | "bedreiging"
  | "spam"
  | "fraude"
  | "contactgegevens"
  | "review_manipulatie";

export type ModerationFinding = {
  category: ModerationCategory;
  severity: "low" | "medium" | "high";
  detail: string;
};

const INSULT =
  /\b(idioot|klootzak|mongool|sukkel|loser|kut|teringlijer|kanker)\b/i;
const THREAT =
  /\b(ik (zal|ga) je|dood(maken|slaan)|afsodemieter|aangifte|advocaat (op je|sturen))\b/i;
const FRAUD =
  /\b(betaal (buiten|cash|contant) (het )?platform|stuur (iban|rekening)|crypto|western\s*union)\b/i;
const REVIEW_MANIP =
  /\b(positieve review|5 sterren (in ruil|voor)|nep.?review|review (ruilen|kopen))\b/i;
const SPAM =
  /(.)\1{8,}|https?:\/\/\S+\s+https?:\/\/\S+\s+https?:\/\/\S+/i;

export function analyzeChatMessage(text: string): ModerationFinding[] {
  const findings: ModerationFinding[] = [];
  const t = text.trim();
  if (!t) return findings;

  if (INSULT.test(t)) {
    findings.push({
      category: "belediging",
      severity: "medium",
      detail: "Mogelijke belediging gedetecteerd",
    });
  }
  if (THREAT.test(t)) {
    findings.push({
      category: "bedreiging",
      severity: "high",
      detail: "Mogelijke bedreiging of intimidatie",
    });
  }
  if (FRAUD.test(t)) {
    findings.push({
      category: "fraude",
      severity: "high",
      detail: "Mogelijke poging tot betaling buiten platform",
    });
  }
  if (REVIEW_MANIP.test(t)) {
    findings.push({
      category: "review_manipulatie",
      severity: "medium",
      detail: "Mogelijke review-manipulatie",
    });
  }
  if (SPAM.test(t) || t.length > 2500) {
    findings.push({
      category: "spam",
      severity: "low",
      detail: "Mogelijk spam / overmatig bericht",
    });
  }

  return findings;
}

export function suggestedSanctionType(
  findings: ModerationFinding[],
): "waarschuwing" | "schorsing_tijdelijk" | "schorsing_lang" | "blokkade" {
  if (findings.some((f) => f.severity === "high" && f.category === "bedreiging")) {
    return "schorsing_tijdelijk";
  }
  if (findings.some((f) => f.severity === "high")) {
    return "waarschuwing";
  }
  return "waarschuwing";
}
