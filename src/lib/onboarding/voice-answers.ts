/** Antwoorden voor Nova wanneer er geen ingelogde chat beschikbaar is. */
export function answerNovaTourQuestion(
  question: string,
  context?: { stepTitle?: string; stepText?: string },
): string {
  const q = question.toLowerCase().trim();

  if (
    q.includes("wat is archon") ||
    q.includes("wat doet archon") ||
    q.includes("wat is dit")
  ) {
    return "ArchonPro is je CRM voor bouwbedrijven: offertes, facturen, projecten en AI-hulp op één plek. Je kunt gratis starten zonder creditcard.";
  }

  if (
    q.includes("gratis") ||
    q.includes("kost") ||
    q.includes("prijs") ||
    q.includes("betalen")
  ) {
    return "Je start met 14 dagen gratis. Daarna kies je een plan — opzegbaar per maand, zonder verrassingen.";
  }

  if (
    q.includes("peppol") ||
    q.includes("e-factuur") ||
    q.includes("efactuur")
  ) {
    return "Ja, ArchonPro ondersteunt e-facturatie via Peppol. Zo verstuur en ontvang je conforme facturen rechtstreeks vanuit je dashboard.";
  }

  if (
    q.includes("ai") ||
    q.includes("nova") ||
    q.includes("assistent")
  ) {
    return "Nova is je AI-metgezel. Ze helpt met offertes, facturen, opvolging en herinnert je aan volgende stappen — altijd ter goedkeuring.";
  }

  if (
    q.includes("snap niet") ||
    q.includes("begrijp niet") ||
    q.includes("uitleg") ||
    q.includes("hoe werkt")
  ) {
    if (context?.stepTitle && context?.stepText) {
      return `Geen probleem. ${context.stepTitle}: ${context.stepText} Wil je verder met de rondleiding of direct een account aanmaken?`;
    }
    return "Geen probleem. Kies een onderwerp hierboven en ik leid je stap voor stap door ArchonPro. Je kunt ook direct gratis registreren.";
  }

  if (context?.stepTitle) {
    return `Goede vraag over ${context.stepTitle}. ${context.stepText ?? ""} Stel gerust nog iets — of klik op Volgende om verder te gaan.`.trim();
  }

  return "Dankjewel voor je vraag. Kies een optie hierboven om verder te gaan, of maak gratis een account aan — dan kan ik je persoonlijk verder helpen in het dashboard.";
}
