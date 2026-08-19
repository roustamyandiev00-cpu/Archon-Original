/**
 * Nederlandse demo-data voor de mission-view pagina's.
 * Wordt alleen getoond zolang er nog geen echte Supabase-data is.
 * Structuur geïnspireerd op de marketing-dashboard referentie, inhoud
 * aangepast aan de bouw/zakelijke context van ArchonPro.
 */

const minAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();
const dayAgo = (d: number) => new Date(Date.now() - d * 864e5).toISOString();

// ── Automatisaties ───────────────────────────────────────────────────

export const demoApprovals = [
  {
    id: -1,
    title: "Offerte 2024-118 versturen naar Bouwbedrijf De Vlaming",
    reason: "Klant vroeg om prijsindicatie voor gevelrenovatie",
    action_type: "send_offerte",
    agent_name: "Lara",
    created_at: minAgo(12),
  },
  {
    id: -2,
    title: "Betalingsherinnering sturen voor factuur 2024-091",
    reason: "Vervaldatum 6 dagen overschreden — € 4.250 openstaand",
    action_type: "send_reminder",
    agent_name: "Nina",
    created_at: minAgo(48),
  },
  {
    id: -3,
    title: "Opvolgmail plannen voor Renovatie Peeters",
    reason: "Offerte 5 dagen geleden bekeken, nog geen reactie",
    action_type: "follow_up",
    agent_name: "Daan",
    created_at: minAgo(140),
  },
  {
    id: -4,
    title: "Factuur opstellen voor afgeronde werf Sint-Niklaas",
    reason: "Project gemarkeerd als opgeleverd",
    action_type: "create_invoice",
    agent_name: "Nina",
    created_at: minAgo(320),
  },
];

export const demoSkillCounts = [
  { label: "Offerte opstellen", value: 46, hint: "2 u" },
  { label: "Herinnering sturen", value: 38, hint: "1 u" },
  { label: "Opvolging", value: 31, hint: "3 u" },
  { label: "Factuur versturen", value: 24, hint: "5 u" },
  { label: "Lead verwerken", value: 19, hint: "1 u" },
  { label: "Afspraak plannen", value: 12, hint: "6 u" },
];

export function demoHourly() {
  const now = new Date().getHours();
  const shape: Record<number, number> = {
    8: 6, 9: 14, 10: 22, 11: 18, 12: 9, 13: 11, 14: 25, 15: 20, 16: 16, 17: 8,
  };
  return Array.from({ length: 24 }, (_, hour) => ({
    hour,
    count: hour === now ? Math.max(shape[hour] ?? 0, 12) : shape[hour] ?? 0,
  })).filter((h) => h.count > 0);
}

export const demoAutomationSummary = { executions30d: 284, scheduledJobs: 7 };

// ── KPI ──────────────────────────────────────────────────────────────

const kpiOffertes = [6, 8, 7, 9, 11, 10, 12, 13, 11, 14, 16, 15];
const kpiOmzet = [4200, 5100, 4800, 6200, 7000, 6600, 7800, 8400, 7900, 9200, 9900, 10400];
const kpiKlanten = [1, 2, 1, 2, 3, 2, 3, 2, 3, 4, 3, 4];
const kpiFacturen = [3, 4, 5, 4, 6, 5, 7, 6, 8, 7, 9, 8];
const kpiAfspraken = [2, 3, 3, 4, 5, 4, 6, 5, 6, 7, 6, 8];

export function demoKpiFill<T extends { week: string }>(weeks: T[]) {
  const n = weeks.length;
  return weeks.map((w, i) => {
    const j = Math.max(0, 12 - n) + i;
    return {
      ...w,
      offertes: kpiOffertes[j] ?? 0,
      omzet: kpiOmzet[j] ?? 0,
      klanten: kpiKlanten[j] ?? 0,
      facturen: kpiFacturen[j] ?? 0,
      afspraken: kpiAfspraken[j] ?? 0,
    };
  });
}

// ── Analytics ────────────────────────────────────────────────────────

export function demoAnalyticsFill<T extends { key: string }>(series: T[]) {
  return series.map((s, i) => {
    const wobble = (Math.sin(i * 1.3) + 1) / 2;
    const offertes = Math.round(1 + wobble * 3);
    const omzet = Math.round(600 + wobble * 2200);
    return { ...s, offertes, omzet };
  });
}

export function demoAnalyticsTotals(series: { offertes: number; omzet: number }[]) {
  const offertesCount = series.reduce((s, d) => s + d.offertes, 0);
  const omzet = series.reduce((s, d) => s + d.omzet, 0);
  return {
    offertesCount,
    omzet,
    klantenCount: Math.round(offertesCount * 0.35),
    aiActies: Math.round(series.length * 9.5),
  };
}

// ── Geheugen ─────────────────────────────────────────────────────────

export const demoMemories = [
  { id: "m1", content: "Bouwbedrijf De Vlaming werkt bij voorkeur met een betalingstermijn van 14 dagen.", memory_type: "preference", importance: 9, created_at: dayAgo(2) },
  { id: "m2", content: "Klant Renovatie Peeters vraagt altijd om een gedetailleerde materiaalspecificatie bij offertes.", memory_type: "preference", importance: 8, created_at: dayAgo(4) },
  { id: "m3", content: "Standaard BTW-tarief voor renovatiewerken aan woningen ouder dan 10 jaar is 6%.", memory_type: "fact", importance: 8, created_at: dayAgo(6) },
  { id: "m4", content: "Werf Sint-Niklaas: toegang alleen mogelijk tussen 7u en 16u wegens buurtreglement.", memory_type: "context", importance: 6, created_at: dayAgo(8) },
  { id: "m5", content: "Bij offertes boven € 25.000 altijd een voorschotfactuur van 30% voorstellen.", memory_type: "instruction", importance: 7, created_at: dayAgo(11) },
  { id: "m6", content: "Contactpersoon bij Immo Coninckx is Sarah, bereikbaar na 14u.", memory_type: "context", importance: 5, created_at: dayAgo(13) },
];

export const demoKnowledge = [
  { id: "k1", title: "Algemene voorwaarden ArchonPro 2024", type: "document", source: "interne wiki", created_at: dayAgo(20) },
  { id: "k2", title: "Prijslijst gevelrenovatie per m²", type: "prijslijst", source: "calculatie", created_at: dayAgo(15) },
  { id: "k3", title: "Checklist werfopvolging", type: "procedure", source: "operations", created_at: dayAgo(9) },
  { id: "k4", title: "BTW-regels bouwsector België", type: "referentie", source: "FOD Financiën", created_at: dayAgo(30) },
];

export const demoMemoryTypeBreakdown = [
  { label: "Voorkeur", value: 14 },
  { label: "Feit", value: 11 },
  { label: "Context", value: 9 },
  { label: "Instructie", value: 6 },
];

// ── Cron ─────────────────────────────────────────────────────────────

export function demoCronJobs() {
  const at = (h: number, dayOffset = 0) => {
    const d = new Date();
    d.setDate(d.getDate() + dayOffset);
    d.setHours(h, 0, 0, 0);
    return d.getTime();
  };
  return [
    { id: "d-rem-1", title: "Betalingsherinnering factuur 2024-091", sub: "Herinnering · factuur", when: at(9, -1), kind: "reminder" as const },
    { id: "d-afs-1", title: "Werfbezoek Sint-Niklaas", sub: "Afspraak · plaatsbezoek", when: at(10), kind: "afspraak" as const },
    { id: "d-rem-2", title: "Offerte De Vlaming opvolgen", sub: "Herinnering · offerte", when: at(14), kind: "reminder" as const },
    { id: "d-afs-2", title: "Intake Immo Coninckx", sub: "Afspraak · verkoop", when: at(11, 1), kind: "afspraak" as const },
    { id: "d-task-1", title: "Maandrapport genereren", sub: "Taak · Lara · normaal", when: null, kind: "taak" as const },
    { id: "d-task-2", title: "Nieuwe leads verrijken", sub: "Taak · Daan · hoog", when: null, kind: "taak" as const },
  ];
}

// ── Activiteit ───────────────────────────────────────────────────────

export const demoActivity = [
  { id: -1, message: "Offerte 2024-118 opgesteld voor Bouwbedrijf De Vlaming", agent_name: "Lara", action_type: "create_offerte", error_message: null, created_at: minAgo(15) },
  { id: -2, message: "Betalingsherinnering verstuurd voor factuur 2024-091", agent_name: "Nina", action_type: "send_reminder", error_message: null, created_at: minAgo(95) },
  { id: -3, message: "3 nieuwe leads verrijkt met bedrijfsgegevens", agent_name: "Daan", action_type: "enrich", error_message: null, created_at: minAgo(180) },
  { id: -4, message: "Opvolgmail gepland voor Renovatie Peeters", agent_name: "Daan", action_type: "follow_up", error_message: null, created_at: minAgo(300) },
  { id: -5, message: "Kon offerte 2024-110 niet versturen — ongeldig e-mailadres", agent_name: "Lara", action_type: "send_offerte_failed", error_message: "SMTP: recipient rejected", created_at: minAgo(360) },
  { id: -6, message: "Factuur 2024-090 aangemaakt en verzonden", agent_name: "Nina", action_type: "create_invoice", error_message: null, created_at: dayAgo(1) },
  { id: -7, message: "Dagrapport samengesteld en gedeeld", agent_name: "Lara", action_type: "report", error_message: null, created_at: dayAgo(1) },
  { id: -8, message: "Afspraak werfbezoek Sint-Niklaas ingepland", agent_name: "Daan", action_type: "create_afspraak", error_message: null, created_at: dayAgo(2) },
];

export const demoActivityTypes = [
  "create_offerte", "send_offerte", "send_reminder", "follow_up",
  "create_invoice", "enrich", "report",
];

// ── Onderzoek ────────────────────────────────────────────────────────

export const demoSignals = [
  { id: "s1", title: "Stijgende vraag naar gevelrenovatie in Oost-Vlaanderen", content: "Regionale bouwaanvragen voor gevelisolatie stegen dit kwartaal met 18%. Kans om gerichte offertes voor te stellen aan bestaande klanten in de regio.", type: "opportunity", source: "marktanalyse", created_at: minAgo(90) },
  { id: "s2", title: "Nieuwe premie voor energiezuinige renovatie vanaf Q3", content: "De Vlaamse overheid verhoogt de renovatiepremie voor woningen. Vermeld dit proactief in offertes om conversie te verhogen.", type: "regulation", source: "Fluvius", created_at: minAgo(200) },
  { id: "s3", title: "Concurrent verlaagt tarieven voor kleine werken", content: "Lokale concurrent adverteert scherpe uurtarieven voor kleine herstellingen. Overweeg een instappakket voor kleine klussen.", type: "competitor", source: "web scan", created_at: dayAgo(1) },
  { id: "s4", title: "Klantsignaal: veel vragen over betaalplan", content: "Meerdere prospects vroegen naar gespreide betaling. Een standaard betaalschema kan drempel verlagen.", type: "pain", source: "gesprekken", created_at: dayAgo(3) },
];

export const demoSignalTypes = ["opportunity", "regulation", "competitor", "pain"];

// ── Deploy ───────────────────────────────────────────────────────────

export const demoRuntimeLog = [
  { id: -1, message: "Automatiseringscyclus voltooid — 4 acties verwerkt", agent_name: "Lara", action_type: "cycle", created_at: minAgo(8) },
  { id: -2, message: "Synchronisatie klantgegevens afgerond", agent_name: "Systeem", action_type: "sync", created_at: minAgo(35) },
  { id: -3, message: "Geplande taak 'maandrapport' uitgevoerd", agent_name: "Lara", action_type: "cron", created_at: minAgo(120) },
  { id: -4, message: "Databaseverbinding gezond — 0 fouten", agent_name: "Systeem", action_type: "health", created_at: minAgo(240) },
];
