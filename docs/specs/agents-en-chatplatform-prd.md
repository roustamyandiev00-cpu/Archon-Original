# PRD: Onderaannemers-netwerk, chat-moderatie en agents

Status: concept — Fase 1–3 gebouwd (2026-07-16).
Auteur input: productconcept van 2026-07-11.

## 1. Probleem en doel

ArchonPro heeft vandaag al een bouwnetwerk (bedrijven, werkposts, reacties,
chat-kanalen, contracten, reviews) maar mist:

- een gestructureerd sanctie-/moderatiesysteem voor chatmisbruik;
- een geschillenprocedure met menselijke controle;
- autonome agents die opdrachten of materialen opzoeken;
- een betrouwbaarheidsscore en uitgebreide verificatie.

Doel van dit document is het concept dat is aangeleverd te vertalen naar
concrete requirements, gekoppeld aan het bestaande datamodel, en een
fasering te geven die niet meteen op "volledig autonome agents + automatische
bans" inzet — dat risico is expliciet benoemd in het concept zelf (§12) en
wordt hier overgenomen als leidend principe.

**Leidend principe:** agents doen voorstellen en verzamelen bewijs; een mens
bevestigt elke onomkeerbare of zware actie (schorsing, blokkering,
geschiluitspraak). Zie [§4](#4-waarschuwingen-en-sancties) en [§12](#12-belangrijkste-risicos).

## 2. Bestaande bouwstenen (hergebruiken, niet opnieuw bouwen)

| Concept-onderdeel | Bestaat al als |
|---|---|
| Pakketten (Starter/Professional/Enterprise) | `src/components/Pricing.tsx`, plan-logica in `src/lib/admin/platform-data.ts` |
| Bedrijfsprofiel | tabel `bedrijven` |
| Beoordelingen na opdracht | tabel `bedrijf_reviews` (1 review per bedrijfspaar, self-review geblokkeerd via CHECK) — migratie `supabase/migrations/20260709_bedrijf_reviews.sql` |
| Opdrachten/werkposts | `werkposts`, `werkpost_reacties` — `src/app/dashboard/werkposts/` |
| Chat-kanalen | `bouwnetwerk_channels` |
| Samenwerkingscontracten (AI-concept + ondertekening) | `samenwerking_contracts` — `supabase/migrations/20260711_samenwerking_contracts.sql` |
| Bouwmaterialen-directory | `bouwmateriaal_winkels` — `src/app/bouwmaterialen/`, `src/lib/bouwmaterialen.ts` |
| Leveranciers-/dakbedrijvendirectory | `dak_bedrijven` — vergelijkbaar patroon, incl. reviews via `DakBedrijfReviewsTrigger` |
| Autonome agent-infrastructuur (event-driven) | `domain_events`, `agent_runs`, `agent_actions` — `supabase/migrations/20260713_autonomous_admin_agents.sql`, `src/lib/agents/` |
| Interne agent-chat UI | `src/components/dashboard/agent-chat/` |

**Consequentie:** dit PRD beschrijft vooral *uitbreidingen* op dit fundament
(moderatie, sancties, geschillen, betrouwbaarheidsscore, subcontractor- en
materialenagent, kaart), niet een nieuw platform.

## 3. Niet-doelen (expliciet buiten scope)

- Volledig autonome, onomkeerbare acties door AI (bans, blokkades,
  geschiluitspraken) — blijft altijd mens-in-de-loop.
- Een publieke, permanente zwarte lijst (juridisch risico, zie §12) — in
  plaats daarvan een intern risicostatus-veld.
- Ongelimiteerd automatisch outreach-bericht versturen door de
  onderaannemersagent.

## 4. Functionele requirements per onderdeel

### 4.1 Pakketten en profiel-labels

- Profiel toont pakketlabel (Starter/Professional/Enterprise) als **informatief
  label**, expliciet niet als kwaliteitsindicator (UX-copy moet dit
  onderscheid duidelijk maken, bv. tooltip).
- Profielvelden (deels al aanwezig op `bedrijven`, aan te vullen):
  abonnement, bedrijfsinfo, specialisaties, werkregio, afgeronde opdrachten,
  gemiddelde beoordeling, aantal beoordelingen, verificatiestatus,
  waarschuwingen/beperkingen (nieuw: zie §4.4).

### 4.2 Beoordelingen

Grotendeels al gedekt door `bedrijf_reviews`. Uitbreidingen nodig:

- Alleen bedrijven die aantoonbaar hebben samengewerkt mogen reviewen — nu
  ontbreekt de koppeling aan een afgeronde opdracht/contract. Voorstel: FK
  `samenwerking_contracts.id` of `werkpost_id` op `bedrijf_reviews`,
  verplicht (`status = 'signed'` als voorwaarde).
- Type werkzaamheden, datum samenwerking, foto's/bewijs → extra kolommen op
  `bedrijf_reviews` (`werk_type text`, `samenwerking_datum date`,
  `bewijs_fotos text[]`).
  vlagged en niet automatisch verwijderd, behalve na bevestigde overtreding
  door beheerder (koppeling met §4.4 sanctiesysteem).

### 4.3 Opslag en controle van gesprekken

- Chatberichten in `bouwnetwerk_channels`-kanalen worden bewaard (retentie:
  te bepalen, voorstel minimaal 2 jaar i.v.m. geschillen).
- Nieuwe agent-taak (event-driven, zie `domain_events`/`agent_runs`
  patroon): `chat-moderation-agent` die berichten scant op de in het concept
  genoemde categorieën (belediging, bedreiging, spam, fraude, valse
  beschuldiging, delen van contactgegevens, review-manipulatie,
  niet-nagekomen afspraken).
- Agent-output is een **voorstel** (`agent_actions` met `status = 'pending_review'`),
  nooit een directe sanctie. Uitzondering: contactgegevens-detectie mag een
  automatische waarschuwing tonen aan de gebruiker zelf (geen sanctie, zie
  §4.5).
- Gebruiker geeft bij eerste chatgebruik expliciete toestemming (checkbox +
  timestamp) voor opslag/controle — vereist voor privacy-compliance (AVG/GDPR).

### 4.4 Waarschuwingen en sancties

Nieuw datamodel nodig, bv. tabel `bedrijf_sancties`:

| Kolom | Doel |
|---|---|
| `bedrijf_id` | FK naar `bedrijven` |
| `type` | `waarschuwing`, `schorsing_tijdelijk`, `schorsing_lang`, `blokkade` |
| `reden` | tekst |
| `bewijs_agent_run_id` | FK naar `agent_runs` (traceerbaarheid AI-voorstel) |
| `bevestigd_door` | FK naar admin-user — **verplicht** voor alles zwaarder dan waarschuwing |
| `status` | `voorgesteld`, `bevestigd`, `verworpen`, `in_bezwaar` |
| `ingaat_op`, `verloopt_op` | periode |

- Risicostatus op bedrijfsprofiel: `normaal`, `gewaarschuwd`,
  `tijdelijk_beperkt`, `onder_onderzoek`, `permanent_geblokkeerd` — géén
  publieke zwarte lijst, alleen intern zichtbaar voor beheerders.
- Escalatieketen (waarschuwing → 3 dagen → 7 dagen → langdurig/blokkade)
  configureerbaar, niet hardcoded.
- Gebruiker ziet reden van sanctie en kan bezwaar indienen (koppelt aan
  geschillenprocedure, §4.11).
- AI mag nooit direct naar `bevestigd` schrijven voor schorsing/blokkade —
  alleen naar `voorgesteld`. Dit is een **harde regel**, niet optioneel.

### 4.5 Chatregels en contactgegevens

- Verplaatsen naar externe platformen om ArchonPro te omzeilen is niet
  toegestaan; contactgegevens worden gedetecteerd (regex/NLP op
  telefoonnummer, WhatsApp-links, e-mail buiten platform-context).
- **Genuanceerde flow (i.p.v. hard blokkeren):**
  1. Voor geaccepteerde opdracht: contactgegevens verborgen/gewaarschuwd.
  2. Na geaccepteerde opdracht (`samenwerking_contracts.status = 'signed'`
     of werkpost-status "geaccepteerd"): contactgegevens mogen gecontroleerd
     vrijgegeven worden.
  3. Escalatie bij herhaling volgt het sanctiesysteem uit §4.4 (waarschuwing
     → tijdelijke blokkering 3 dagen → langere beperking/handmatige controle).
- Onboarding-scherm bij eerste chatgebruik: chatregels + akkoord +
  toestemming opslag (zie §4.3) — technisch: modal met versie-hash van de
  voorwaarden, opgeslagen per gebruiker/timestamp zodat bewijsbaar is welke
  versie is geaccepteerd.

### 4.6 Onderaannemersagent

Bouwt voort op bestaande `werkposts`/`werkpost_reacties` en de
autonome-agent-infra (`domain_events` → `agent_runs` → `agent_actions`).

- Instellingen per gebruiker: type werk, specialisaties, regio, max.
  afstand, beschikbaarheid, minimumprijs/uurtarief, opdrachtgevertype,
  werkdagen, uitsluitingen. Nieuwe tabel `onderaannemer_agent_settings`.
- Statusmodel voor gevonden opdrachten (uitgebreider dan simpel vinkje, zoals
  in het concept zelf al voorgesteld):
  `gevonden → interesse_verstuurd → reactie_ontvangen → info_nodig →
  gesprek_actief → offerte_aangevraagd → geaccepteerd | afgewezen | verlopen`.
- Anti-spam guardrails (hard vereist, geen toggle):
  - dagelijks max. aantal automatische berichten per bedrijf;
  - gepersonaliseerd bericht (template + opdracht-specifieke velden, geen
    letterlijke duplicatie);
  - dedupe-check tegen eerder verstuurde reacties op dezelfde werkpost;
  - wachttijd tussen opeenvolgende automatische berichten;
  - uitsluiting van verlopen werkposts;
  - handmatige goedkeuring verplicht voor het versturen van een offerte of
    het accepteren van een opdracht namens de gebruiker (blijft bij de
    mens — vergelijkbaar met hoe `samenwerking_contracts` al
    dubbele ondertekening vereist).

### 4.7 Zakelijke contacten / netwerk

- Terminologie: "zakelijke contacten" / "partners", niet "vrienden".
- Nieuwe tabel `bedrijf_connecties`: `bedrijf_id`, `connectie_bedrijf_id`,
  `status` (favoriet, eerder_samengewerkt, vaste_partner), `notities`
  (privé, alleen zichtbaar voor eigen bedrijf), `created_at`.
- Features: opnieuw uitnodigen, beschikbaarheidsmelding, privé-opdracht
  versturen — kunnen hergebruiken van bestaande werkpost-flow met een
  `zichtbaarheid = 'privé' | 'netwerk' | 'publiek'`-veld op `werkposts`.

### 4.8 Afspraken per opdracht

- Verplichte velden per opdracht (uit te breiden op `werkposts` /
  `samenwerking_contracts`): omschrijving, locatie, startdatum, einddatum,
  prijs/uurtarief, materiaalverantwoordelijkheid, betalingsvoorwaarden,
  aansprakelijkheid, benodigde certificaten, annuleringsvoorwaarden,
  goedkeuring meerwerk, contactpersonen, status.
- `samenwerking_contracts` heeft al `draft_html`/`draft_json` — het
  AI-concept-genereren kan hierop een completeness-check draaien vóór
  bevestiging: agent markeert ontbrekende verplichte velden en waarschuwt
  beide partijen (niet blokkerend, wel zichtbaar).

### 4.9 Bouwmaterialenagent

Bouwt voort op `bouwmateriaal_winkels` en `src/lib/bouwmaterialen.ts`.

- Zoekinstellingen: productnaam, merk/alternatief, specificaties,
  hoeveelheid, regio, max. afstand, leverdatum, afhalen/leveren, budget.
- Resultaatvelden: winkelnaam, adres, afstand, productnaam, prijs, prijs per
  eenheid, beschikbare hoeveelheid, leveringskosten, levertijd,
  openingsuren, contact, bronpagina, **controle-datum/tijd van de prijs**
  (verplicht veld — prijzen zonder brondatum mogen niet getoond worden als
  actueel).
- Resultaten: opslaan, filteren, sorteren, handmatig aanpassen, exporteren
  naar PDF, opnieuw controleren.
- Elke prijs toont expliciet "incl./excl. btw onbekend, controleer bij
  bron" tenzij dat bevestigd is — voorkomt aansprakelijkheid bij verouderde
  data.

### 4.10 Kaart met bouwwinkels/leveranciers

Bouwt voort op `dak_bedrijven` / `bouwmateriaal_winkels` (die hebben al
`lat`/`lng` op `bouwmateriaal_winkels`, ontbreekt nog op `dak_bedrijven` —
toevoegen voor kaartweergave).

- Toevoegbaar door: agent, bouwbedrijven, leveranciers, beheerders.
- Verplichte velden: naam, volledig adres, kaartpositie, categorie,
  materialen, leveringsgebied, openingsuren, website, telefoon,
  verificatiestatus, laatste-controle-datum.
- Locatie bepalen via: adreszoekfunctie, kaartpin, gps, handmatige correctie.
- Door gebruiker toegevoegde winkel start als `niet_geverifieerd` totdat
  adres/bedrijfsgegevens gecontroleerd zijn (nieuw veld
  `verificatiestatus` op `dak_bedrijven`/`bouwmateriaal_winkels`, patroon
  al aanwezig via `toegevoegd_door`).

### 4.11 Geschillenprocedure

Nieuwe tabel `geschillen`:

1. gebruiker meldt probleem (koppelt aan `werkpost_id`/`samenwerking_contracts.id`/kanaal);
2. gekoppelde opdracht + gesprekken worden verzameld (agent_run met
   `agent_id = 'dispute-summary-agent'`);
3. AI maakt neutrale samenvatting (`agent_actions`-voorstel, geen oordeel);
4. beide partijen geven verklaring (nieuw formulier);
5. beheerder beslist (`geschillen.status = 'beslist'`, `beheerder_id`,
   `motivatie`);
6. beide partijen ontvangen motivatie (notificatie);
7. bezwaar mogelijk (`geschillen.status = 'in_bezwaar'`, nieuwe ronde).

### 4.12 Betrouwbaarheidsscore en verificatie

- Score-formule niet publiek documenteren in code-comments of API-responses
  die naar de client gaan (manipulatie-risico) — bereken server-side,
  toon alleen het resultaat.
- Input: afgeronde opdrachten, reactiepercentage, annuleringen,
  betaalgedrag, geverifieerde documenten, geschillen, punctualiteit,
  herhaalsamenwerkingen.
- Verificatietypes: identiteit, ondernemingsnummer, btw-nummer,
  verzekeringsbewijs, certificaten, bankrekening, bedrijfsadres, telefoon,
  e-mail — elk met eigen status (`onbevestigd`, `in_behandeling`,
  `geverifieerd`, `verlopen`).

### 4.13 Meldingen

Nieuwe/uit te breiden notificaties: passende opdrachten, chatberichten,
ontvangen beoordelingen, ontbrekende afspraken, materiaalprijswijzigingen,
nieuwe leveranciers in regio, verlopen documenten, sancties/waarschuwingen.
Voorstel: hergebruik bestaand notificatiekanaal indien aanwezig, anders
nieuwe tabel `notificaties` met `type`, `bedrijf_id`, `payload`, `gelezen_op`.

## 5. Belangrijkste risico's (overgenomen uit het concept, niet afgezwakt)

- AI die onterecht iemand beschuldigt → mitigatie: mens bevestigt altijd
  zware sancties (§4.4), volledige logging via `agent_runs`/`domain_events`.
- Valse beoordelingen → mitigatie: review alleen na aantoonbare
  samenwerking (§4.2).
- Misbruik van opgeslagen gesprekken → toegangscontrole/RLS, alleen
  beheerders en betrokken partijen.
- Privacyproblemen (AVG) → expliciete toestemming, retentiebeleid,
  dataminimalisatie in agent-prompts.
- Discriminatie door profiel-/pakketlabels → UX-copy en eventueel
  sortering die pakket niet als kwaliteitsproxy gebruikt.
- Spam door automatische agents → guardrails in §4.6.
- Verouderde materiaalprijzen → brondatum verplicht (§4.9).
- Juridische risico's rond permanente zwarte lijsten → intern
  risicostatus-veld i.p.v. publieke blacklist (§4.4).
- Gebruikers die buiten platform communiceren → gefaseerde
  contactgegevens-vrijgave (§4.5).
- Onduidelijke verantwoordelijkheid bij foutieve AI-beslissingen → elke
  agent-actie is te herleiden tot `agent_run` + `bevestigd_door`.

## 6. Fasering

### Fase 1 — Fundament (uitbreiding bestaand systeem) — DONE (2026-07-16)
- ~~Profiel: verificatiestatus + waarschuwingen-veld toevoegen aan `bedrijven`.~~
- ~~`bedrijf_reviews` koppelen aan afgeronde samenwerking (verplichte FK).~~
- ~~Chatregels-onboarding (akkoord + toestemming opslag).~~
- ~~Opdrachtstatussen uitbreiden op `werkposts`.~~ (`pipeline_status` naast bestaande enum)
- ~~Meldingsfunctie voor gebruikers om content te rapporteren.~~
- ~~Handmatige beheercontrole (admin-UI voor rapportages, geen automatisering).~~

### Fase 2 — AI-ondersteuning (voorstellen, geen automatische acties) — DONE (2026-07-16)
- ~~Chat-moderatie-agent (samenvatting, detectie, voorstel — `pending`).~~
- ~~Contactgegevens-detectie met gefaseerde vrijgave.~~
- ~~Betrouwbaarheidsscore (server-side berekening).~~
- ~~Zakelijke-contacten/netwerk-features.~~
- ~~Automatische opdracht-matching (voorstellen, geen auto-send).~~

Migratie: `20260716_fase2_bouwnetwerk_agents.sql` (`bedrijf_sancties`,
`bedrijf_connecties`, `onderaannemer_agent_settings`, `zichtbaarheid`,
`betrouwbaarheidsscore`). UI: `/dashboard/bouwnetwerk/partners`.

### Fase 3 — Gedeeltelijk autonome agents — DONE (2026-07-16)
- Onderaannemersagent met guardrails (§4.6): na handmatige goedkeuring
  optioneel auto-send van werkpost-reactie (cooldown, daglimiet, dedupe).
  Migratie: `20260716_fase3_materialen_geschillen.sql`.
- Bouwmaterialenagent + leverancierskaart + PDF-export
  (`/dashboard/bouwmaterialen`, publieke kaart met verificatiestatus).
- Automatische prijs-herchecks (scheduler signaal, geen auto-update).
- Geschillenflow met AI-samenvatting-voorstel, verklaringen, beslissing
  en bezwaarronde (`/dashboard/geschillen`, admin).
- Soft contract-completeness waarschuwing (blokkeert niet).

## 7. Open vragen

- Retentietermijn voor chatgeschiedenis — juridisch te bepalen (AVG-bewaartermijn).
- Wie is "beheerder" in de sanctie-/geschilflow — er bestaat al een
  platform-admin-systeem (`src/lib/platform-admin.ts`,
  `src/app/dashboard/admin/`, incl. impersonation-logging via
  `20260712_admin_impersonation_log.sql`). Voorstel: hergebruik deze rol
  voor sanctie-/geschilbeslissingen i.p.v. een nieuwe rol te introduceren.
- Exacte betrouwbaarheidsscore-formule — productbeslissing, niet technisch.
- Prijsmodel-koppeling: krijgt Enterprise toegang tot meer agent-runs/dag
  dan Starter (rate limiting per pakket)?

## 8. Concrete uitvoeringstaken — Fase 1 — DONE (2026-07-16)

Status: **voltooid** — migraties + UI/actions gebouwd. Fasen 1–3 (§6) zijn afgerond.

1 en 4 waren onafhankelijke schema-uitbreidingen. 2 hing af van
`samenwerking_contracts`. 3, 5 en 6 vormden het meldsysteem-blok.

1. **Profiel-uitbreiding op `bedrijven`** — DONE
   Migratie `20260716_bedrijven_verificatie_risico.sql`: `verificatiestatus`,
   `risicostatus` + CHECKs. Read-only badge in Instellingen; risico in admin.

2. **`bedrijf_reviews` koppelen aan afgeronde samenwerking** — DONE
   Migratie `20260716_bedrijf_reviews_contract.sql`: nullable
   `samenwerking_contract_id`. `submitCompanyReview` eist signed contract.

3. **Chatregels-onboarding** — DONE
   `chat_terms_*` op `company_memberships`; `ChatTermsModal`; server-gate in
   `sendMessage`/`sendAttachments`.

4. **Opdrachtstatussen uitbreiden op `werkposts`** — DONE
   Bestaande enum behouden. Nieuwe kolom `pipeline_status` (migratie
   `20260716_werkposts_pipeline_status.sql`) voor agent-matchflow.

5. **Meldingsfunctie voor gebruikers** — DONE
   Tabel `content_rapportages` + `RapporteerButton` op chat/werkpost/review.

6. **Admin-UI voor rapportages** — DONE
   `/dashboard/admin/rapportages` — markeer behandeld/afgewezen (handmatig).
