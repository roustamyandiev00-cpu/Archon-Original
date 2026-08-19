# Taken-module — welke implementatie houden we?

Datum: 2026-07-27
Vergeleken: `feature/tasks-module` (lokaal, HEAD `3f44cb3`) vs `origin/feature/tasks-module`

---

## Advies

**Neem de remote-implementatie als basis.** Niet omdat hij mooier is, maar omdat
de lokale implementatie een schemafout bevat die pas op productie zou opvallen.

De lokale versie is geschreven zonder kennis van het echte productieschema,
omdat `supabase/recovered_migrations/` — het archief van de werkelijke
productiemigraties — **alleen op de remote branch bestaat**.

---

## De doorslaggevende fout in de lokale versie

Het productieschema van `public.tasks` (uit
`supabase/recovered_migrations/20260327175006_012_tasks.sql`) bevat al:

```sql
project_id  BIGINT REFERENCES projecten(id) ON DELETE SET NULL,
completed_at TIMESTAMP WITH TIME ZONE,
customer_id BIGINT REFERENCES customers(id),
assigned_to UUID, created_by UUID, due_date DATE
```

De lokale migratie doet op regel 31:

```sql
add column if not exists project_id text,
```

Op productie bestaat `project_id` al als `bigint`. `if not exists` maakt hiervan
dus een **stille no-op** — de kolom blijft `bigint`. Maar de lokale code denkt
dat het tekst is:

- `src/lib/tasks/types.ts:31` → `project_id: string | null`
- `src/types/database.types.ts:249` → `project_id: string | null`

Gevolg: elke insert of update van `project_id` vanuit de Taken-module gaat een
string naar een `bigint`-kolom sturen. Dat faalt op PostgREST-niveau, en de
types liegen tegen iedereen die er daarna aan werkt. Dit is precies het soort
fout dat lokaal, met een lege tabel, nooit zichtbaar wordt.

De remote-migratie voegt `project_id` en `completed_at` **bewust niet toe** —
die bestaan al. Dat klopt, en de remote-cron gebruikt `template.project_id`
correct.

> **Aanname die je moet bevestigen:** ik kan het live schema niet inzien (het
> project is lokaal niet aan Supabase gelinkt). Deze conclusie steunt op het
> recovered-migrations-archief. Verifieer met een `information_schema.columns`-
> query op staging voordat je definitief kiest.

---

## Volledige vergelijking

| | Lokaal `20260720201000` | Remote `20260720181000` |
|---|---|---|
| **`untyped()` in de module** | **32×** | **0×** — volledig getypeerd op `Database` |
| **Cron** | alleen herinneringen (94 r) | herinneringen **+ automatisch terugkerende taken aanmaken** (171 r) |
| **Terugkerende taken** | alleen via handmatige server action | draait vanzelf via cron |
| **`project_id`** | voegt `text` toe → conflicteert met productie-`bigint` | correct: laat bestaande kolom met rust |
| **`completed_at`** | voegt toe (no-op, type klopt wel) | laat met rust |
| **Basistabel** | `create table if not exists` — werkt ook op lege DB | veronderstelt dat `tasks` bestaat |
| **RLS-helper** | `public.can_write_company_tasks` | `app_private.can_write_company_tasks` + expliciete `auth.uid() is not null` |
| **DELETE op tasks** | iedere schrijver mag verwijderen | **alleen `is_company_admin`** |
| **Policies op kindtabellen** | generieke `for all`-lus (in je eigen securityreview al aangemerkt als "breed") | expliciet per tabel; `task_activity_logs` alleen `insert`, niet muteerbaar |
| **Grants** | impliciet (leunt op defaults) | expliciet per tabel + sequences |
| **Server actions** | 21 exports | 22 exports (incl. `setTaskStatus`) |
| **Tests** | 7 in één bestand | 8 in twee bestanden (`validation` + `policy`) |
| **UI** | `TakenManager` + `TaskDetailClient` | `TakenBoard` + `TaskDetailActions` + `RelatedTasksCreateButton` |
| **`source`-constraint** | incl. `'import'` | zonder `'import'` |
| **Command Center** | gekoppeld | gekoppeld (gelijkwaardig) |

Functioneel zijn ze bijna identiek: beide hebben lijst- én kanbanweergave,
statuswissel, commentaren, labels, bijlagen, herinneringen en herhalingen.
Geen van beide heeft echte drag-and-drop of een UI voor bijlagen uploaden.

### Waar de remote-versie op vier punten sterker is

1. **0 `untyped()` tegenover 32.** `docs/UNTYPED_REDUCTION_PLAN.md` heeft het
   terugdringen van `untyped()` als expliciet doel; de lokale versie voegt er 32 toe.
2. **Strengere RLS.** Verwijderen alleen door bedrijfsadmin, auditlogs niet
   muteerbaar, expliciete policies in plaats van één brede `for all`-lus.
3. **Herhalingen werken echt.** De cron maakt ze aan; lokaal moet iemand een
   server action aanroepen die nergens vandaan getriggerd wordt.
4. **Klopt met het productieschema.**

### Wat de lokale versie beter doet — meenemen naar de remote-basis

1. `create table if not exists public.tasks (...)` bovenaan de migratie, zodat
   een verse database (staging vanaf nul, CI) niet stukloopt. De remote-migratie
   begint met `update public.tasks` en faalt als de tabel niet bestaat.
2. De normalisatie `update ... set status = 'todo' where status is null or status = ''`
   — de remote dekt dit ook, maar de lokale variant is iets vollediger.
3. `'import'` in de `source`-constraint, als je ooit taken wil importeren.
4. Index `tasks_company_position_idx` op `(company_id, status, position)` — de
   remote heeft hem niet, terwijl de kanban wel op `position` sorteert.

---

## Er staat meer op de remote dan alleen Taken

Dit is geen keuze over één module. De remote branch bevat zes migraties die
lokaal volledig ontbreken:

| Migratie | Wat het doet |
|---|---|
| `20260719_platform_registration_count.sql` | registratieteller voor platformadmin |
| `20260720093303_platform_billing_invoices.sql` | facturatie-overzicht platform |
| `20260720100504_admin_dashboard_role_boundaries.sql` | rolgrenzen admin-dashboard |
| `20260720110731_ceo_only_platform_admin.sql` | **beperkt `/admin` tot één CEO**, met unieke index en `app_private.current_user_is_platform_admin()` |
| `20260720115810_ceo_atomic_ai_credit_grants.sql` | atomaire AI-credit-toekenning |
| `20260720163011_harden_referral_and_team_rpc_access.sql` | hardening referral- en team-RPC's |

`ceo_only_platform_admin` is direct relevant voor het lek dat ik gisteren vond in
`src/lib/platform-admin.ts:20` — het legt de databasekant al vast. De
`PLATFORM_ADMIN_EMAILS`-bypass in de applicatiecode blijft daarnaast alsnog een
apart te dichten gat.

Verder alleen op de remote: wachtwoordreset-flow, Google Calendar-integratie,
Zapier-webhook, `/admin/ai-logs`, `docs/PRODUCT_ROADMAP.md` en vier
verificatie-/auditdocumenten.

**Ook `stripe_webhook_events` bestaat dubbel** — `20260720180000` (remote) versus
`20260720200000` (lokaal). Zelfde probleem, zelfde oplossing nodig.

---

## Voorgestelde consolidatie

1. Maak een verse branch vanaf `origin/feature/tasks-module`.
2. Verifieer op staging het echte type van `tasks.project_id` met een
   `information_schema.columns`-query. Bevestigt dat `bigint`, dan staat de keuze vast.
3. Neem uit de lokale migratie over: de `create table if not exists`-aanhef, de
   `'import'`-source, en de `position`-index.
4. Cherry-pick uit lokaal wat uniek en gewenst is:
   - `20260721060000_tasks_drop_legacy_policies.sql` — **controleer eerst of dit
     nog nodig is**; het verwijdert policies met namen (`"Users can view tasks"`
     e.d.) die de remote-migratie misschien al vervangt.
   - `20260721061000_revoke_anon_team_rpcs.sql` — overlapt met remote
     `20260720163011_harden_referral_and_team_rpc_access.sql`; samenvoegen of één laten vallen.
   - `20260721062000_company_ai_credits_token_limit.sql`
   - `20260721070000_bouwmateriaal_winkels_categorieen.sql`
   - de admin-UI-componenten uit commit `3f44cb3`
5. Kies één `stripe_webhook_events`-migratie, gooi de andere weg.
6. `pnpm lint && pnpm typecheck && pnpm test && pnpm build`.
7. Push als één branch. Gooi de verliezende variant weg.

---

## Blokkade: er schrijft nu iets anders in deze repo

Tijdens deze analyse verschenen zonder mijn toedoen:

- 00:22:43 en 00:22:47 — twee commits (`a438b74`, `3f44cb3`)
- 00:26:47 — `supabase/migrations/20260727000000_company_discounts_and_referrals.sql`
  plus wijzigingen in `src/app/admin/actions.ts`, `src/lib/referral.ts`,
  `src/lib/admin/platform-data.ts`, `src/components/dashboard/admin/company-detail-data.ts`

Er draait dus een tweede agent of hook in deze werkmap. **Consolideren terwijl
dat gebeurt levert gegarandeerd een derde variant op.** Zet die eerst stil
voordat je stap 1 uitvoert — anders herhaalt precies het probleem zich dat we
nu proberen op te ruimen.
