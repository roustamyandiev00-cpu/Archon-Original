# ArchonPro — verplichte werkinstructies voor AI coding agents

Deze regels gelden voor iedere AI-agent die in deze repository werkt, waaronder Cursor, Kiro, Codex en andere coding assistants.

## 1. Hoofddoel

Werk ArchonPro gecontroleerd af zonder bestaande functionaliteit, gebruikersdata, tenant-isolatie of projectstructuur te beschadigen.

Veiligheid en een werkende kernflow hebben voorrang op nieuwe modules, grote refactors en visuele vernieuwingen.

## 2. Projectcontext

Vóór productwerk: lees ook `docs/MVP_SCOPE.md` voor de vaste MVP-scope,
actieve modules en bevroren onderdelen.

ArchonPro is een multi-tenant SaaS-platform voor Belgische bouwbedrijven met onder andere:

- klanten en contacten;
- offertes, facturen en PDF-documenten;
- projecten en documenten;
- klantportaal;
- rollen en rechten;
- abonnementen en betalingen;
- AI-ondersteuning en opvolging;
- Supabase/database-integratie.

Waarschijnlijke stack: Next.js App Router, React, TypeScript, Tailwind, shadcn/ui, Supabase/Drizzle, Stripe, e-mailprovider en Vercel. Controleer de werkelijke repository voordat je aannames over de stack gebruikt.

### 2.0 Documentatiebronnen (bestaand)

Gebruik uitsluitend deze bestaande bronnen. Maak geen parallelle documentatiestructuur (`AI_AGENTS.md`, `docs/ARCHITECTURE.md`, `docs/ROUTE_STRUCTURE.md`, `docs/SECURITY.md`, `docs/CODING_STANDARDS.md`, enz.).

| Document | Inhoud |
|---|---|
| `AGENTS.md` | Verplichte werkinstructies, projectkaart, routeclassificatie, autorisatiegrenzen |
| `WORKFLOW.md` | Dagelijkse werkprocedure, startvolgorde, veilig herstellen |
| `SKILL-autonomous-admin-agents.md` | Nova, Lima, Archon Copilot — tenant business agents (centrale referentie; niet vervangen) |
| `docs/MVP_SCOPE.md` | Vaste MVP-scope, actieve en bevroren modules |
| `docs/PRODUCTION_READINESS_CHECKLIST.md` | Productiegereedheid per module |
| `docs/UNTYPED_REDUCTION_PLAN.md` | Plan om `untyped()` escape-hatch te elimineren |

Architectuur-, route- en beveiligingsregels voor coding agents staan in deze `AGENTS.md` (secties 2.1–2.3 en verder), niet in aparte nieuwe docs. Details over tenant-AI-agents staan in `SKILL-autonomous-admin-agents.md`.

### 2.1 Projectkaart — geverifieerde feiten (2026-07-21)

Gebruik deze feiten in plaats van zelf te zoeken. Verifieer alleen bij twijfel of veroudering.

**Stack (bevestigd):** Next.js 16 (App Router), React 19, TypeScript 5, Tailwind 4, Supabase (`@supabase/ssr`), Stripe, Vitest, pnpm@10.12.4, Node 22 (`engines` in package.json). Package manager is uitsluitend pnpm; maak nooit een `package-lock.json`.

**Commands (uitsluitend deze):**

- `pnpm lint` — ESLint
- `pnpm typecheck` — `tsc --noEmit`
- `pnpm test` — Vitest (single run); `pnpm test:watch` voor watch
- `pnpm build` — productiebuild
- `pnpm types:generate` — print de instructie voor Supabase-typegeneratie (vereist linked project)

**Structuur:**

- `src/app` — App Router. Publieke marketing-routes in de root (blog, prijzen, functies, …); tenant-app onder `/dashboard/*`.
- `src/lib/<domein>` — domeinlogica per module: offertes, facturen, peppol, stripe, tasks, agents, accounting, cron, auth, supabase, e.a.
- `src/components` — `ui/` (shadcn-patronen), `dashboard/`, domeinspecifieke mappen.
- `src/types/database.types.ts` — gegenereerde Supabase-types. Nooit fictieve tabellen handmatig toevoegen; zie `docs/UNTYPED_REDUCTION_PLAN.md`.
- `supabase/migrations` — voorwaartse migraties (41 stuks per 2026-07-21).
- `scripts/` — Python/shell-hulpscripts voor Peppol/Storecove/DB-queries; eigen venv, niet nodig voor de webapp.

**Platform-admin — huidige vs. doelarchitectuur:**

> **Huidige implementatie (historisch):** platform-adminfunctionaliteit is geïmplementeerd onder `src/app/dashboard/admin`. Dit is een historische situatie die vooralsnog intact blijft.
>
> **Goedgekeurde doelarchitectuur:** platform-admin hoort thuis onder `src/app/admin/*` (URL: `/admin/*`), gescheiden van de tenant-app. Nieuwe platform-adminfunctionaliteit mag niet verder worden toegevoegd onder `/dashboard/admin`.
>
> **Overgangsregel:** bestaande routes onder `src/app/dashboard/admin` mogen uitsluitend worden verplaatst via een afzonderlijke, expliciet goedgekeurde refactortaak (zie sectie 2.3). Een gewone feature- of bugfix mag deze routeverplaatsing nooit impliciet uitvoeren.

**Kernpatronen:**

- Supabase-clients in `src/lib/supabase/`: `server.ts` (server components/actions), `client.ts` (browser), `service.ts` (service-role, alleen server-side), `middleware.ts`, `readonly-guard.ts`. Gebruik altijd de bestaande helper, maak geen nieuwe client aan.
- Tenantveiligheid: server actions halen user én `companyId` server-side op en weigeren zonder beide (zie bv. `src/app/dashboard/taken/actions.ts`); tenantqueries filteren op `company_id` én steunen op RLS. Cross-tenant koppelingen controleren via helpers zoals `assertSameCompanyLinks` (`src/lib/tasks/service.ts`).
- `untyped()` (`src/lib/integraties.ts`) is een tijdelijke escape voor schema-drift. Voeg geen nieuwe aanroepen toe.
- Tests staan colocated in `__tests__`-mappen onder `src/lib/<domein>` en `src/components/dashboard` (Vitest).
- Agent-naamgeving: backend-IDs zijn Nova/Lima; Lara/Nina zijn uitsluitend UI-aliassen.

**Actief vs bevroren:** de actieve MVP-modules en bevroren modules staan in `docs/MVP_SCOPE.md`. Bevroren (niet aanraken buiten expliciete opdracht): bouwnetwerk, telegram, automatisaties, werkposts, geschillen, comms en `/portal/*`.

**Actuele rapporten:** `docs/PRODUCTION_READINESS_CHECKLIST.md`, `docs/TASKS_MODULE_IMPLEMENTATION_REPORT.md`, `docs/TASKS_MODULE_SECURITY_REVIEW.md`, `docs/TASKS_MODULE_TEST_REPORT.md`, `docs/UNTYPED_REDUCTION_PLAN.md`.

**Bekende valkuilen:**

- `ai-text-demo/` is een losstaand mini-package met eigen lockfile; niet meenemen in root-lint/typecheck en niet verplaatsen.
- `.venv*`, `screenshots/`, `exports/`, `_tmp_*` zijn lokale, gitignorede artefacten — negeren.
- `src/app/dashboard/cron`, `dashboard/deploy`, `dashboard/voorbeeld` en `src/app/dev` zijn interne/dev-routes; controleer server-side auth vóór je ze aanraakt.

### 2.2 Routeclassificatie en autorisatiegrenzen

Iedere route in de repository valt in precies één van de volgende categorieën. Gebruik deze indeling bij iedere beslissing over nieuwe code, autorisatie en routeplaatsing.

| Categorie | URL-prefix | Bestandspad (doel) | Toegang |
|---|---|---|---|
| PLATFORM_ADMIN | `/admin/*` | `src/app/admin/*` | Uitsluitend interne ArchonPro-platformbeheerders |
| TENANT_CRM | `/dashboard/*` | `src/app/dashboard/*` | Geauthenticeerde gebruikers van één actief bedrijf |
| TENANT_SETTINGS | `/dashboard/instellingen/*` | `src/app/dashboard/instellingen/*` | Geauthenticeerde gebruikers van één actief bedrijf |
| PORTAL | `/portal/*` | `src/app/portal/*` (bevroren) | Externe klanten met beperkte vervalbare toegang |
| PUBLIC | `/`, `/login`, `/registreer`, `/blog`, `/prijzen`, `/functies`, … | `src/app/(public)/*` e.a. | Iedereen |
| DEV_INTERNAL | `/dashboard/cron`, `/dashboard/deploy`, `/dashboard/voorbeeld`, `/dev/*` | Interne routes | Alleen intern, altijd server-side beveiligd |

**Autorisatiegrenzen per categorie:**

**PLATFORM_ADMIN (`/admin/*`):**
- Authenticatie verplicht.
- Expliciete server-side platform-admincontrole vereist op elke route handler, server action en gevoelige query.
- Verifieer de bron van waarheid voor platform-admin eerst in de repository voordat je aannames maakt.
- Tenantrol (owner, admin, member) geeft nooit automatisch platformtoegang.
- Een tenant-owner of tenant-admin is nooit automatisch platform-admin.

**TENANT_CRM en TENANT_SETTINGS (`/dashboard/*`):**
- Authenticatie verplicht.
- Actief company membership vereist.
- `companyId` wordt server-side bepaald; nooit van client-side input vertrouwen.
- Rollen en permissies worden server-side gecontroleerd.
- Tenantqueries filteren altijd op `company_id`.
- RLS is aanvullende beveiliging, geen vervanging voor server-side controle.
- Geen vertrouwen op alleen client-side navigatie, verborgen knoppen of UI-rolcontrole.

**PORTAL (`/portal/*`):**
- Beperkte, controleerbare en waar relevant vervalbare toegang.
- Minimale dataset; nooit toegang tot interne dashboarddata of platformdata.
- Geen toegang tot `/admin/*` of `/dashboard/*`.

**DEV_INTERNAL:**
- Altijd server-side auth controleren vóór je een interne route aanraakt.
- Niet behandelen als normale productroutes; niet blootstellen aan normale gebruikers.

### 2.3 Route-refactorprocedure

Routeverplaatsingen zijn hoog risico en vereisen een afzonderlijke, expliciet goedgekeurde taak. Voer onderstaande stappen in volgorde uit en stop wanneer een stap onduidelijk is.

1. **Read-only inventarisatie:** breng alle betrokken routes, bestanden en mappen volledig in kaart.
2. **Classificeer elke route** volgens de tabel in sectie 2.2.
3. **Controleer dataflow en autorisatie:** welke server actions, API-routes en middleware zijn betrokken?
4. **Inventariseer alle verwijzingen:** imports, interne links, `redirect()`-aanroepen, breadcrumbs en navigatiecomponenten.
5. **Controleer layouts en middleware:** welke `layout.tsx`, `middleware.ts` en RLS-policies horen bij de huidige en nieuwe locatie?
6. **Rapporteer exact** het oude pad en het nieuwe pad vóór je iets verplaatst.
7. **Maak een test- en rollbackplan:** hoe wordt na verplaatsing geverifieerd dat auth, data en UI correct werken?
8. **Verplaats in kleine batches:** nooit alle routes in één operatie; verplaats en verifieer stap voor stap.
9. **Combineer nooit** een routeverplaatsing met een brede businesslogica-refactor in dezelfde taak.
10. **Verwijder het oude pad pas** nadat het nieuwe pad en eventuele redirects bewezen werken.

## 3. Verplichte startcontrole

Voer vóór iedere wijziging eerst een read-only inventarisatie uit:

1. Lees deze `AGENTS.md` en eventuele lokale instructiebestanden.
2. Controleer de huidige Git-branch en `git status`.
3. Meld bestaande gewijzigde of niet-gevolgde bestanden. Behandel ze als werk van de gebruiker.
4. Zoek de bestaande implementatie, routes, componenten, services, database-tabellen en tests die bij de taak horen.
5. Controleer welk package-managementsysteem al wordt gebruikt aan de hand van het bestaande lockbestand.
6. Controleer of dezelfde functie al elders bestaat voordat je een nieuw bestand maakt.
7. Geef vóór implementatie een kort plan met:
   - doel en scope;
   - bestanden die waarschijnlijk veranderen;
   - risico's en aannames;
   - controles die na afloop worden uitgevoerd.

Begin niet blind te wijzigen wanneer de gevraagde functie, bron van waarheid of datamodel onduidelijk is.

## 4. Scope en wijzigingslimieten

- Werk aan één afgebakende taak per keer.
- Gebruik bestaande architectuur, patronen en componenten.
- Maak geen tweede implementatie van een bestaande pagina, service, hook, component of databasefunctie.
- Houd de wijziging zo klein mogelijk. Bij meer dan 10 gewijzigde bestanden: pauzeer en leg uit waarom dit nodig is.
- Voer geen projectbrede cleanup, formattering, dependency-upgrade of refactor uit binnen een gewone feature- of bugfix.
- Los geen ongerelateerde problemen op zonder ze eerst afzonderlijk te melden.
- Voeg geen nieuwe module, agent, integratie of database-entiteit toe buiten de expliciete opdracht.

## 5. Bestanden en mappen

Zonder expliciete toestemming van de gebruiker is het verboden om:

- bestanden of mappen te verwijderen;
- bestanden of mappen te verplaatsen of hernoemen;
- routes te verplaatsen of routegroepen te herstructureren;
- bestaande publieke exports te wijzigen;
- duplicaten zoals `new`, `final`, `fixed`, `v2` of `backup` aan te maken;
- gegenereerde code of grote aantallen bestanden toe te voegen;
- de volledige mapstructuur te reorganiseren.

Als verplaatsen of verwijderen echt noodzakelijk is, toon dan eerst:

1. het exacte oude en nieuwe pad;
2. alle imports, routes en tests die geraakt worden;
3. het migratie- of herstelplan;
4. waarom aanpassen op de bestaande locatie niet volstaat.

## 6. Git-veiligheid

- Werk bij voorkeur op een taakgerichte branch, niet rechtstreeks op de productiebranch.
- Verwijder, overschrijf, stash of revert nooit wijzigingen van de gebruiker.
- Gebruik nooit destructieve Git-commando's zoals `git reset --hard`, geforceerde checkout of geforceerde push.
- Commit geen `.env`-bestanden, tokens, wachtwoorden, sleutels of klantgegevens.
- Maak logische, kleine commits: één werkende taak per commit.
- Push, merge, deploy of open geen pull request tenzij de gebruiker dat expliciet vraagt.
- Als Cursor en Kiro dezelfde repository gebruiken, mag slechts één agent tegelijk schrijven. Parallel werk vereist aparte branches of Git worktrees.

## 7. Dependencies en configuratie

- Gebruik uitsluitend de package manager die bij het bestaande lockbestand hoort.
- Maak geen tweede lockbestand aan.
- Installeer, verwijder of upgrade geen dependency zonder noodzaak en zonder dit vooraf te melden.
- Wijzig geen framework-, TypeScript-, lint-, build-, deployment- of Tailwind-configuratie om een lokale fout te verbergen.
- Wijzig `.env`, `.env.local` en productievariabelen nooit automatisch.
- Nieuwe variabelen worden alleen toegevoegd aan het voorbeeldbestand, zonder echte geheime waarde, en worden gedocumenteerd.

## 8. Database, Supabase en migraties

Databasewijzigingen zijn hoog risico.

- Controleer eerst het bestaande schema, migraties, relaties, policies en gebruik in de applicatie.
- Herschrijf of verwijder nooit een migratie die mogelijk al is uitgevoerd.
- Maak voor schemawijzigingen een nieuwe, voorwaartse migratie.
- Voer geen destructive migration, dataverwijdering of productiequery uit zonder expliciete toestemming en herstelplan.
- Gebruik geen service-role key in browser- of clientcode.
- Iedere tenantgebonden query moet server-side tenantcontrole en waar van toepassing RLS hebben.
- Vertrouw nooit alleen op een verborgen knop of client-side rolcontrole voor autorisatie.
- Controleer bij rollen en rechten zowel lezen als schrijven, directe URL-toegang en API/server actions.
- Gebruik geen echte klantdata als testdata.

## 9. Authenticatie, betalingen en communicatie

Voor auth, Stripe, abonnementen, AI-credits, e-mail, klantportaal en facturatie geldt:

- Geen mockbetaling, nep-successtatus of placeholder presenteren als productiefunctionaliteit.
- Stripe-status wordt server-side en via geverifieerde webhooks bepaald.
- E-mailstatus mag pas `sent` worden na bevestiging van de provider.
- Wachtwoorden en SMTP-gegevens worden nooit plaintext opgeslagen.
- Publieke portaal- en offertelinks gebruiken beperkte, vervalbare en controleerbare toegang.
- Gevoelige acties krijgen autorisatie, validatie, idempotentie en logging.
- Facturatie moet het verschil tussen PDF en gestructureerde Belgische B2B e-facturatie respecteren; claim geen Peppol-ondersteuning zonder echte end-to-end integratie.

## 10. UI en routes

- Bij gewone feature- en bugfix-taken: behoud de bestaande App Router-structuur en routeconventies.
- Bij nieuwe code: volg de doelarchitectuur uit sectie 2.2 (PLATFORM_ADMIN → `src/app/admin/*`, TENANT_CRM → `src/app/dashboard/*`).
- Routeverplaatsingen zijn uitsluitend toegestaan als aparte, expliciet goedgekeurde refactortaak (zie sectie 2.3). Combineer nooit een routeverplaatsing met een normale feature of bugfix.
- Maak geen parallelle login-, dashboard-, offerte- of factuurflow.
- Hergebruik bestaande design tokens en shadcn/componentpatronen.
- Controleer desktop en mobiel.
- Voorzie loading, empty, error, disabled, success en permission-denied states waar relevant.
- Verberg fouten niet met demo-data of hardcoded fallbackdata.

## 11. Verplichte kwaliteitscontrole

Gebruik de bestaande scripts uit `package.json`; verzin geen commando's die het project niet kent.

Voer na implementatie, waar beschikbaar, minimaal uit:

1. formatter/lint voor de geraakte bestanden;
2. TypeScript/typecheck;
3. relevante unit- en integratietests;
4. productiebuild bij route-, configuratie- of brede wijzigingen;
5. relevante end-to-end flow of gerichte handmatige controle.

Een bestaande fout buiten de scope mag niet stil worden opgelost of verborgen. Meld duidelijk:

- welke controle slaagde;
- welke controle faalde;
- of de fout al bestond of door de wijziging ontstond;
- wat nog niet getest kon worden.

## 12. Definitie van klaar

Een taak is pas klaar wanneer:

- de gevraagde functie werkelijk werkt en geen placeholder is;
- bestaande kernflows niet zijn gebroken;
- autorisatie en tenant-isolatie gecontroleerd zijn indien relevant;
- loading-, empty-, error- en success-states behandeld zijn;
- relevante tests en typechecks slagen;
- geen secrets of echte klantdata zijn toegevoegd;
- de agent een overzicht geeft van gewijzigde bestanden, controles, risico's en resterend werk.

## 13. Verplicht eindrapport

Sluit iedere taak af met:

1. **Resultaat** — wat nu werkelijk werkt.
2. **Gewijzigde bestanden** — exact overzicht met reden per bestand.
3. **Database/configuratie** — migraties, variabelen of handmatige stappen.
4. **Controles** — lint, typecheck, tests, build en handmatige verificatie.
5. **Openstaand** — beperkingen, risico's en volgende logische stap.

Zeg nooit dat iets volledig klaar of veilig is als de relevante controle niet kon worden uitgevoerd.


## 14. Cursor Cloud specific instructions

Deze sectie geldt voor Cursor Cloud Agents die de ontwikkelomgeving opzetten of valideren.

### Boot requirements

1. **Dependencies:** `pnpm install` (Puppeteer, sharp en unrs-resolver draaien postinstall-scripts; toegestaan via `pnpm.onlyBuiltDependencies` in `package.json`).
2. **Environment:** kopieer `.env.example` naar `.env.local`. Minimaal vereist:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (of `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`)
   - `SUPABASE_SERVICE_ROLE_KEY` (server actions, cron-routes, admin flows)

Zonder Supabase-env vars start de dev-server wel, maar middleware faalt op de meeste routes (`src/lib/supabase/env.ts`).

### Running the app

```bash
pnpm dev          # http://localhost:3000
pnpm dev:mobile   # bind 0.0.0.0 voor LAN/mobiel
pnpm test         # vitest (geen DB)
pnpm lint         # eslint
pnpm typecheck    # tsc --noEmit
pnpm build        # productiebuild
```

Alleen één proces is lokaal vereist: de Next.js dev-server. Er is geen docker-compose in de repo.

### Supabase and migrations

- Voorwaartse migraties staan in `supabase/migrations/` (41+ patches per 2026-07-21).
- Baseline-schema staat in `supabase/recovered_migrations/` (referentie voor volledige lokale DB).
- Voor volledige CRM/dashboard-flows: gebruik een hosted Supabase-project (staging/productie), niet een lege lokale Postgres.
- `supabase/config.toml` is voor optioneel lokaal Supabase CLI-gebruik; lokale stack vereist Docker.

### Preview mode (beperkt dashboard zonder login)

Bezoek `/dashboard/voorbeeld` voor read-only demo-UI. Vereist nog steeds geldige Supabase-env vars voor middleware.

### Lint and tests

- `pnpm test` — unit tests in `src/lib/**/__tests__/` en `src/components/**/__tests__/`; geen Supabase nodig.
- `pnpm lint` — kan pre-existing ESLint-issues rapporteren; de linter zelf draait correct.

### Optional integrations (niet vereist om te booten)

Groq/OpenAI, ElevenLabs, Storecove/Peppol, Billit, Slack (`SLACK_CONNECTOR`), cron secrets — zie `.env.example`.
