# ArchonPro — Wat moet er nu gebeuren

Datum analyse: 2026-07-27
Branch: `feature/tasks-module` (lokaal, HEAD `3f44cb3`)

---

## Voortgang sinds deze analyse (2026-07-27)

| Stap | Status |
|---|---|
| 1. Branch-divergentie oplossen | **KLAAR** — zie `consolidate/tasks-module`, merge `f1aee4b`. Keuze onderbouwd in `docs/TAKEN_MODULE_KEUZE.md` |
| 5. Bootstrap-adminlek dichten | **KLAAR** — commit `835f981`; de vlag wordt nu gelezen én bootstrap sluit database-admins niet meer buit |
| 2. Merge naar `main` | OPEN — [PR #3](https://github.com/roustamyandiev00-cpu/Archon-Original/pull/3) open; Vercel faalde door Hobby-cronlimiet |
| 2b. Vercel Hobby-cronfix | **KLAAR** — `task-reminders` van `*/15` naar dagelijks `0 8 * * *` (Hobby laat geen sub-dagelijkse crons toe) |
| 3. Env-sleutels invullen | OPEN — vereist jouw secrets |
| 4. Supabase linken + migraties + `types:generate` | DEELS — live project `vqiyftyqfpfbpwhadpvn` bereikbaar; Taken/Stripe-migraties staan al live (andere timestamps); verse staging nog geblokkeerd zonder baseline |
| 6. Handmatige kernflow-test op staging | OPEN — kan pas na merge + secrets |

Status na consolidatie: lint/typecheck/build groen. Live geverifieerd (2026-07-30):
`tasks.project_id` is **bigint**, RLS aan op `tasks` + kindtabellen, `stripe_webhook_events`
en tasks-hardeningmigraties staan op productie (versienummers wijken af van de repo-bestanden).

---

## CORRECTIE — stap 4 klopte niet

Mijn oorspronkelijke advies bij stap 4 was "op staging: `supabase db push`".
**Dat werkt niet**, en het is belangrijk dat je dat weet vóór je het probeert.

De actieve keten in `supabase/migrations/` is **niet zelfstandig**. Hij verwijst
naar tien tabellen die hij nergens aanmaakt:

```
agent_actions   bedrijven   bouwnetwerk_channels   customers   facturen
offertes        projecten   tasks                  werkposts   werkpost_reacties
```

Waaronder `bedrijven` — de kerntenanttabel, doelwit van 30 foreign keys. Die
tabellen worden alleen aangemaakt in `supabase/recovered_migrations/`
(o.a. `20260327174810_002_initial_schema.sql`), en dat archief zegt expliciet:
niet uitvoeren, niet verplaatsen naar de actieve keten.

### Wat dit betekent

- Een **verse Supabase-database kan niet uit deze repository worden opgebouwd**.
- Er is dus geen staging te maken die op productie lijkt.
- `supabase db push` of `db reset` op een leeg project faalt bij de eerste
  foreign key naar `bedrijven`.
- De enige database die het volledige schema heeft, is productie — opgebouwd
  door historie die nu alleen nog als archief bestaat.

Dit is geen gevolg van de consolidatie; het gold al vóór deze PR. Het betekent
wel dat stap 4 en 6 niet uitvoerbaar zijn zoals ze er stonden.

### De weg vooruit: één baseline-migratie

1. Dump het schema van productie (structuur, geen data):
   ```
   npx supabase db dump --linked --schema public -f supabase/baseline.sql
   ```
2. Leg dat vast als `supabase/migrations/00000000000000_baseline.sql`, met een
   tijdstempel vóór alle bestaande migraties.
3. Markeer op productie de bestaande migraties als toegepast (`supabase migration repair`)
   zodat de keten daar niet opnieuw draait.
4. Pas dán kan een leeg project de hele keten draaien en heb je staging.

Stap 1 en 3 vereisen toegang tot het productieproject. Zie ook de waarschuwing
in `supabase/recovered_migrations/README.md`, die precies dit
"consolidatie- en herstelplan" aankondigt.

> **Let op bij de Supabase-connector:** de gekoppelde account ziet alleen project
> `dtuemhsnerzmzsrzycss` ("Webaisite"). De app draait op `vqiyftyqfpfbpwhadpvn`.
> Autoriseer de connector voor de account die dát project bezit.

---

## 0. Samenvatting in één alinea

De code is technisch groen: typecheck, 99 tests, build en lint slagen allemaal.
Het probleem is niet de code maar de **staat van het project**: al het werk van
de laatste 3 weken zit vast in één featurebranch die nooit naar `main` is gegaan,
diezelfde branch is uit elkaar gelopen met zijn eigen remote (twee verschillende
Taken-modules die elkaar tegenspreken), de Supabase-migraties zijn nooit op een
echte database toegepast, en de helft van de `.env`-sleutels ontbreekt waardoor
Stripe, cron, e-mailversleuteling en AI niet kunnen draaien.

Er is dus niets kapot — er is alleen nooit iets **afgemaakt en uitgerold**.

---

## 1. Huidige technische status (gemeten, niet aangenomen)

| Controle | Resultaat |
|---|---|
| `pnpm typecheck` | slaagt |
| `pnpm test` | 18 bestanden, 99 tests, alles groen |
| `pnpm lint` | 0 errors, 27 warnings (ongebruikte imports/variabelen) |
| `pnpm build` | slaagt, alle routes bouwen |
| Werkende boom | schoon (alles gecommit) |

Migraties lokaal: 45 bestanden in `supabase/migrations/`.
`untyped()`-aanroepen in `src/`: **148**.
TODO/FIXME in `src/`: 4.

---

## 2. Blokkade #1 — de branch is uit elkaar gelopen

`feature/tasks-module` staat **7 commits vóór** en **5 commits achter** op
`origin/feature/tasks-module`. Het verschil is niet klein:

- **338 bestanden** verschillen (134 alleen op remote, 24 alleen lokaal, 179 gewijzigd)
- Er bestaan **twee volledig verschillende implementaties van de Taken-module**,
  met **twee verschillende migraties op dezelfde tabellen**:
  - lokaal: `supabase/migrations/20260720201000_tasks_module.sql`
  - remote: `supabase/migrations/20260720181000_tasks_module.sql`
- Lokaal heeft: `src/lib/tasks/service.ts`, `recurrence.ts`, `TakenManager.tsx`, `TaskDetailClient.tsx`
- Remote heeft in plaats daarvan: `src/lib/tasks/query.ts`, `relations.ts`, `validation.ts`, `types.ts`, `TakenBoard.tsx`, `TaskDetailActions.tsx`

**Naïef mergen is gevaarlijk**: dan draaien beide migraties na elkaar op
dezelfde tabellen en krijg je een kapot of dubbel schema.

Bovendien staat er werk op de remote dat lokaal helemaal niet bestaat:

- `docs/PRODUCT_ROADMAP.md` — de volledige productroadmap (fase 1 t/m 10)
- `docs/SECURITY_HARDENING_REPORT.md`, `docs/OAUTH_INTEGRATION_AUDIT.md`,
  `docs/AUDIT_CLAIMS_VERIFICATION.md`, `docs/VERIFICATION_BASELINE.md`, `docs/VERIFICATION_FINAL.md`
- Wachtwoord-reset flow (`src/app/auth/wachtwoord-resetten/`, `PasswordResetForm.tsx`)
- Google Calendar-integratie (`googleCalendar.ts`, `googleCalendarSetup.ts`)
- Zapier-webhook (`src/app/api/webhooks/zapier/[token]/route.ts`)
- `/admin/ai-logs` pagina
- `supabase/recovered_migrations/` — 22 teruggehaalde historische migraties met README

### Oorzaak

`WORKFLOW.md` zegt letterlijk: *"Laat niet twee AI-agents tegelijk in dezelfde
branch schrijven."* Dat is precies wat er gebeurd is — er zijn branches van
Cursor cloud-agents, Codex en Claude die allemaal op dezelfde featurebranch
hebben gewerkt. Dit is de belangrijkste procesfout om te stoppen.

### Wat je moet doen

1. **Kies één Taken-implementatie.** Vergelijk beide en beslis. De remote-versie
   is opgesplitst in kleinere modules (`query`/`validation`/`relations`/`types`),
   de lokale zit in één `service.ts` maar heeft recurrence + reminders + activity logs.
2. **Verwijder de verliezende migratie** uit de historie van de branch die je
   houdt (of maak één schone samengevoegde migratie).
3. **Cherry-pick het unieke remote-werk** dat je wilt houden (roadmap, docs,
   wachtwoordreset, Google Calendar, recovered_migrations).
4. **Push één geconsolideerde branch** en gooi de andere weg.
5. Zet daarna de regel hard: één agent per branch, altijd pushen na elke taak.

---

## 3. Blokkade #2 — niets staat op `main`

`main` loopt **21 commits achter** op de featurebranch. Alles — Taken, Stripe
webhook-idempotency, de admin-refactor naar `/admin/*` — zit in een branch die
nooit is samengevoegd.

**Wat je moet doen:** na stap 2 hierboven een PR maken naar `main`, mergen, en
deployen naar een staging-omgeving op Vercel. Zolang dit niet gebeurt is elk
nieuw stuk werk speculatie.

---

## 4. Blokkade #3 — de database is nooit bijgewerkt

`docs/PRODUCTION_READINESS_CHECKLIST.md` staat op **NO-GO** en alle
databasepunten zijn `BLOCKED_BY_PRODUCTION_ACCESS`. Concreet:

- Er is **geen `supabase/config.toml`** — het project is lokaal niet gelinkt aan Supabase.
- Daardoor werkt `pnpm types:generate` niet, en blijven die **148 `untyped()`**
  staan (zie `docs/UNTYPED_REDUCTION_PLAN.md`).
- De laatste 4 migraties zijn nooit toegepast:
  - `20260721060000_tasks_drop_legacy_policies.sql` — dit verwijdert **te ruime
    RLS-policies** op `tasks`. Zolang dit niet draait is de tenant-afscherming
    op taken zwakker dan de securityreview beweert.
  - `20260721061000_revoke_anon_team_rpcs.sql` — trekt `anon`-rechten in op de
    team-RPC's. Ook een echte securityfix die nog niet live is.
  - `20260721062000_company_ai_credits_token_limit.sql`
  - `20260721070000_bouwmateriaal_winkels_categorieen.sql`

**Wat je moet doen:**

```bash
npx supabase link --project-ref vqiyftyqfpfbpwhadpvn
npx supabase migration list
```

Daarmee zie je welke van de 51 migraties live al zijn toegepast.

> **Niet doen: `supabase db push` naar een leeg staging-project.** Dat faalt —
> zie de correctie bovenaan dit document. De actieve keten kan geen database
> vanaf nul opbouwen; er moet eerst een baseline-migratie uit productie komen.

Draai eerst `supabase/scripts/verify-live-schema.sql` (alleen lezen) om de
werkelijke stand vast te stellen. Zodra het project gelinkt is, kan ook:

```bash
npx supabase gen types typescript --linked > src/types/database.types.ts
```

Dat is meteen de opruiming van de resterende `untyped()`-aanroepen uit
`docs/UNTYPED_REDUCTION_PLAN.md`, en het bevestigt of `tasks.project_id`
werkelijk `bigint` is.

---

## 5. Blokkade #4 — ontbrekende secrets

`.env.local` bevat maar 7 sleutels. Ontbrekend ten opzichte van `.env.example`:

| Sleutel | Gevolg als hij ontbreekt |
|---|---|
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Abonnementen en webhooks werken niet |
| `CRON_SECRET` | Alle 3 cronjobs in `vercel.json` worden geweigerd (`src/lib/cron/auth.ts` weigert bij ontbrekend secret) — dus **geen taakherinneringen, geen agent-followups, geen Peppol-inbox** |
| `SECRETS_ENCRYPTION_KEY` | SMTP-wachtwoorden kunnen niet versleuteld worden opgeslagen |
| `IMPERSONATION_SECRET` | `src/lib/impersonation.ts` gooit een error — impersonatie werkt niet |
| `OPENAI_API_KEY` / `GROQ_API_KEY` | AI-agents (Nova, Lima, chat) doen niets |
| `GOOGLE_CALENDAR_*`, `TEAMS_*`, `DROPBOX_*`, `QUICKBOOKS_*` | Alle 4 OAuth-integraties werken niet |
| `NEXT_PUBLIC_APP_URL` | Links in e-mails/PDF's kunnen fout gaan |

**Wat je moet doen:** vul `.env.local` aan voor lokaal, en zet dezelfde sleutels
in Vercel (project `archon-original`, `prj_WceZwG8L6l67ZyepvTZve9PaINcP`) voor
Preview én Production.

---

## 6. Echte bug gevonden — platform-admin bootstrap staat altijd aan

`src/lib/platform-admin.ts:20` geeft platform-adminrechten aan iedereen wiens
e-mailadres in `PLATFORM_ADMIN_EMAILS` staat, **vóór** de database-controle:

```ts
if (email && bootstrapEmails().includes(email.toLowerCase())) {
  return true;
}
```

De vlag `PLATFORM_ADMIN_BOOTSTRAP_ENABLED` wordt **nergens in de code gelezen** —
hij bestaat alleen in `.env.example`, `.env.local` en de checklist. De checklist
zegt "zet hem op `false` in productie", maar dat heeft dus geen enkel effect.

Dat betekent: wie in productie `PLATFORM_ADMIN_EMAILS` kan zetten of raden,
krijgt de volledige CEO-console — zonder rij in `platform_admins`.

**Wat je moet doen (kleine, aparte fix):** ofwel de bootstrap-tak achter de vlag
zetten en de vlag standaard `false` maken, ofwel het e-mailpad volledig
verwijderen en alleen op de `platform_admins`-tabel + `is_platform_admin()` RPC
vertrouwen. Voeg een test toe die bewijst dat de bootstrap uit staat als de vlag
uit staat.

---

## 7. Kleinere punten (geen blokkade)

- **27 lint-warnings**: ongebruikte imports in o.a. `Topbar.tsx`,
  `CeoHomeDashboard.tsx`, `PlatformHealthCard.tsx`, `AgendaManager.tsx`.
  Opruimen kost 15 minuten.
- **Demo-data**: `src/lib/demo.ts` wordt als fallback getoond wanneer een tabel
  leeg is (`showDemoData(preview, count === 0)`) in offertes, facturen en het
  dashboard. Dat is bewust ontworpen, maar de roadmap eist "nooit demo als live" —
  controleer vóór productie of dit gedrag klopt voor echte klanten.
- **Bevroren modules staan wel in de navigatie**: `werkposts`, `samenwerkingen`,
  `geheugen`, `onderzoek` zitten in `sidebar-nav.ts` terwijl `docs/MVP_SCOPE.md`
  ze bevroren verklaart. Roadmapregel: "geen lege navigatie".
- Er verschijnen commits zonder dat jij ze maakt (twee commits op 2026-07-27
  00:22 tijdens deze analyse). Controleer of er een hook of achtergrondagent
  automatisch commit — dat maakt het onmogelijk om te weten wat van wie is.

---

## 8. Aanbevolen volgorde

### Deze week — opruimen en uitrollen (geen nieuwe features)

1. **Branch-divergentie oplossen.** Kies één Taken-implementatie, één migratie,
   cherry-pick het unieke remote-werk. Eén schone branch, gepusht.
2. **Merge naar `main`** en deploy naar staging op Vercel.
3. **Env-sleutels invullen** in `.env.local` én in Vercel (Preview + Production).
4. **Supabase linken**, migraties naar staging pushen, controlequery's draaien,
   `types:generate` uitvoeren.
5. **Bootstrap-adminlek dichten** (sectie 6) — aparte kleine commit met test.
6. **Handmatige kernflow-test op staging**: registreren → bedrijf → contact →
   offerte → publieke offerte openen → akkoord → factuur. Dit is de enige manier
   om te weten of het product werkt.

### Daarna — eerste echte productincrement

`docs/PRODUCT_ROADMAP.md` (staat op de remote branch) noemt als eerste
increment: **platformbrede AI-logs op `/admin/ai-logs`**, gevoed uit de
bestaande `agent_activity_logs`. Geen nieuwe tabel, geen externe provider, wel
direct nuttig. Dat is een goede eerste taak zodra stap 1–6 klaar zijn.

### Werkregel die je vanaf nu moet handhaven

Eén agent per branch. Na elke taak: `lint` → `typecheck` → `test` → commit →
push. Geen tweede agent starten op een branch waar de eerste nog schrijft.
Dat staat al in `WORKFLOW.md` — het is alleen niet nageleefd, en dat is precies
waar de huidige rommel vandaan komt.
