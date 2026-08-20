# ArchonPro productroadmap

## Positionering

ArchonPro groeit van een CRM voor Belgische bouwbedrijven naar **het AI
Operating System voor bedrijven**: één werkruimte voor klanten, verkoop,
projecten, planning, facturatie, boekhouding en gecontroleerde AI-acties.

Dit document beschrijft de langetermijnrichting. `docs/MVP_SCOPE.md` blijft de
bindende scope voor het huidige productwerk.

## Productprincipes

1. **Eén product, twee omgevingen** — `/admin/*` voor ArchonPro-platformbeheer
   en `/dashboard/*` voor tenantgebonden klantwerk.
2. **Eerst een betrouwbare kernflow** — contact en prijslijst naar offerte,
   project, agenda, factuur en boekhouding.
3. **AI stelt voor, de gebruiker beslist** — financiële, juridische en externe
   acties vereisen menselijke goedkeuring en auditlogging.
4. **Geen lege navigatie** — een module verschijnt pas wanneer data, rechten,
   loading-, empty-, error- en success-states werkelijk werken.
5. **Tenant-isolatie is een productfunctie** — iedere klantactie en query blijft
   server-side aan het juiste bedrijf gebonden.

## Huidige basis

### Platform-admin

De bestaande basis omvat:

- CEO-overzicht met platform-KPI's en groei;
- bedrijvenoverzicht en bedrijfsdetail;
- AI Control Center en AI-credits;
- agentacties en goedkeuringssignalen;
- geschillen en rapportages;
- server-side afscherming van `/admin/*`.

Nog te voltooien binnen het platformbeheer:

- platformbrede AI-logs en filters;
- gebruikers- en rechtenoverzicht;
- abonnementen, betalingen en openstaande facturen;
- echte monitoring voor API, database, jobs en providers;
- security- en auditweergave;
- supportworkflow.

### Klantdashboard

De bestaande basis omvat:

- Command Center en dagelijkse signalen;
- contacten, leads en prijslijst;
- offertes, projecten, agenda en facturen;
- boekhouding-light en analytics;
- AI Crew, agentchat en agentactiviteit;
- instellingen en integraties.

Nog te voltooien binnen de CRM-kern:

- betrouwbaarheid van de volledige kernflow;
- sterkere persoonlijke dagplanning en opvolgprioriteiten;
- uniforme approvals vanuit Command Center en AI-chat;
- consistente permission-, empty-, loading- en error-states;
- mobiele controle van alle actieve MVP-routes.

## Uitvoerbare fasering

### Fase 1 — CRM en platformbeheer afronden

Doel: de huidige MVP-kern volledig bruikbaar, veilig en meetbaar maken.

1. Platformbrede AI-logs met bedrijf, agent, actie, status, fout en tijdstip.
2. Platformgebruikers en tenantrollen inzichtelijk maken zonder authgegevens te
   lekken.
3. Billingoverzicht koppelen aan echte Stripe- en factuurstatussen.
4. Monitoring bouwen op echte meetpunten; onbekende diensten blijven zichtbaar
   als "niet gemeten".
5. Command Center laten sturen op echte taken, vervallen facturen, leads,
   offertes en afspraken.
6. Kernflow en rollen negatief testen op tenantoverschrijding.

### Fase 2 — AI Business Manager

Lara wordt de centrale interface voor bestaande CRM-acties:

- vragen beantwoorden met tenantgebonden bedrijfsdata;
- acties voorbereiden zoals offerte, afspraak en opvolging;
- expliciete bevestiging vragen vóór schrijven, verzenden of publiceren;
- ieder voorstel, besluit en resultaat loggen;
- bij fouten veilig stoppen zonder nep-successtatus.

De invoervolgorde is: **lezen → voorstellen → goedkeuren → uitvoeren →
controleren**.

### Fase 3 — Website

Een tenantgebonden module binnen ArchonPro voor website-overzicht, pagina's,
blog, SEO, domeinen en analytics. Start pas nadat fase 1 en de goedkeuringslaag
van fase 2 betrouwbaar zijn.

### Fase 4 — Marketing Hub

Campagnes, socialkanalen, advertenties en e-mail vanuit één meetbaar overzicht.
Externe publicatie blijft providerbevestigd en auditbaar.

### Fase 5 — AI Agents

Een gecontroleerde crew voor sales, support, SEO, finance, website, planning en
marketing. Iedere agent heeft een afgebakende bevoegdheid, budget, status,
laatste taak, succespercentage, fouten en logs.

### Fase 6 — Automation Builder

Visuele workflows voor triggers, voorwaarden, approvals en acties. Financiële
en externe stappen kunnen nooit stil autonoom worden uitgevoerd.

### Fase 7 — Mobile App

Mobiele kernflows, pushmeldingen, voice, ondertekening en projectstatus. Geen
aparte bedrijfslogica: mobiel gebruikt dezelfde server-side contracten.

### Fase 8 — Klantenportaal

De bestaande bevroren `/portal/*`-code wordt pas opnieuw geactiveerd na een
aparte security- en productbeslissing over offertes, facturen, documenten,
projectstatus en chat.

### Fase 9 — Marketplace

Gecontroleerde installatie van templates, agents, integraties en workflowpacks,
met versiebeheer, rechten, moderatie en terugdraaibaarheid.

### Fase 10 — Enterprise

Multi-company, teams, fijnmazige rollen, white label, publieke API, auditlogs,
SSO en enterprise-beheer.

## Navigatieregel

De huidige navigatie toont uitsluitend werkende MVP-modules. Website,
Marketing, Marketplace en Enterprise worden pas toegevoegd wanneer de eerste
route in die module productieklaar is. Roadmap-items worden niet als actieve
functionaliteit gepresenteerd.

## Eerstvolgende productincrement

**Platformbrede AI-logs** is de aanbevolen eerste increment:

- route: `/admin/ai-logs`;
- bron: bestaande `agent_activity_logs` en bestaande platform-admincontrole;
- filters: bedrijf, agent, status en periode;
- weergave: actie, fout, bedrijf, agent en tijdstip;
- staten: loading, leeg, fout en permission denied;
- geen nieuwe tabel of externe provider nodig;
- geen prompt- of response-inhoud tonen zolang de opslag en privacy daarvan niet
  expliciet zijn ontworpen.

## Definitie van gereed per increment

- server-side autorisatie en tenantgrenzen zijn gecontroleerd;
- echte data of een eerlijke lege staat, nooit demo als live;
- desktop en mobiel werken;
- directe URL- en negatieve rechtentests slagen;
- lint, TypeScript, relevante tests en build slagen;
- gevoelige acties zijn gevalideerd, idempotent en gelogd;
- er is een duidelijke herstel- of rollbackroute.
