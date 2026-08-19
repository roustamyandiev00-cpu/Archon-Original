# CLAUDE.md — instructies voor Claude in deze repository

Deze repo heeft al verplichte werkinstructies. Lees ze in deze volgorde
**voordat** je iets wijzigt:

1. `AGENTS.md` — grondwet: stack, projectkaart, routeclassificatie,
   autorisatiegrenzen, verplichte startcontrole, git-/db-/scope-regels.
2. `WORKFLOW.md` — dagelijkse werkprocedure en veilige startvolgorde.
3. `docs/MVP_SCOPE.md` — wat actief is vs. bevroren.
4. `SKILL-autonomous-admin-agents.md` — bij taken rond Nova/Lima/Archon Copilot.

Maak **geen** nieuw architectuur-/regeldocument (geen `ARCHITECTURE.md`,
`ROUTE_STRUCTURE.md`, `SECURITY.md`, `CODING_STANDARDS.md`, `AI_AGENTS.md`).
Alles wat daarin zou staan, staat al in `AGENTS.md`.

## Snelle referentie (uit AGENTS.md, niet leidend — bij twijfel: origineel)

- **Package manager:** uitsluitend `pnpm`. Nooit `npm install` draaien, nooit
  een `package-lock.json` aanmaken.
- **Commands:** `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`.
  Verzin geen andere scripts.
- **Structuur:** `src/app` (App Router; publiek in root, tenant-app onder
  `/dashboard/*`), `src/lib/<domein>` (business logic), `src/components`,
  `src/types/database.types.ts` (gegenereerd — nooit handmatig tabellen
  toevoegen).
- **Tenant-veiligheid is niet optioneel:** `companyId` altijd server-side
  bepalen, nooit client-input vertrouwen. Elke tenantquery filtert op
  `company_id`. RLS is aanvullend, geen vervanging voor server-side controle.
- **Platform-admin:** nieuwe code onder `src/app/admin/*`, niet onder
  `src/app/dashboard/admin` (dat is historisch en blijft voorlopig staan —
  niet uitbreiden).
- **Bevroren modules** (niet aanraken zonder expliciete opdracht):
  bouwnetwerk, telegram, automatisaties, werkposts, geschillen, comms,
  `/portal/*`.
- **Scope:** één afgebakende taak per keer. Geen tweede implementatie van
  iets dat al bestaat. Meer dan ~10 gewijzigde bestanden → eerst pauzeren
  en uitleggen waarom.
- **Verboden zonder expliciete toestemming:** bestanden verwijderen/
  verplaatsen/hernoemen, routes herstructureren, `-v2`/`-final`/`-backup`
  duplicaten aanmaken, dependencies upgraden, `.env*` wijzigen.
- **Voor elke taak:** kort plan (doel, bestanden, risico's, aannames) →
  pas daarna implementeren.
- **Na elke taak:** rapport met wat werkt, gewijzigde bestanden, welke
  controles slaagden/faalden, wat nog open staat. Nooit "helemaal klaar"
  zeggen als een controle niet kon draaien.

## Werkstijl (Roustam)

- Directe, duidelijke antwoorden — geen overbodige uitleg of verfraaiing.
- Iteratief en pragmatisch: kleine, werkende stappen boven grote refactors.
- Geen destructieve git-commando's, geen force-push, geen ongevraagde merge
  of deploy.
- Bij twijfel over scope of datamodel: eerst vragen, niet blind wijzigen.
