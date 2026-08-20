/** Versie-hash van chatregels + opslagtoestemming (AVG). */
export const CHAT_TERMS_VERSION = "2026-07-16";

export const CHAT_TERMS_TITLE = "Chatregels & toestemming opslag";

export const CHAT_TERMS_BODY = [
  "Gesprekken in het bouwnetwerk worden bewaard zodat geschillen en misbruik kunnen worden beoordeeld.",
  "Beledigingen, bedreigingen, spam, fraude en het delen van contactgegevens om het platform te omzeilen zijn niet toegestaan vóór een geaccepteerde opdracht.",
  "Door te aanvaarden ga je akkoord met de chatregels en met gecontroleerde opslag van berichten (minimaal bewaartermijn i.v.m. geschillen).",
].join("\n\n");

export function hasAcceptedCurrentChatTerms(input: {
  acceptedAt: string | null | undefined;
  version: string | null | undefined;
}): boolean {
  return Boolean(
    input.acceptedAt && input.version === CHAT_TERMS_VERSION,
  );
}
