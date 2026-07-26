# Veilige dagelijkse workflow voor ArchonPro

Gebruik deze volgorde telkens wanneer je met Cursor, Kiro, Codex of een andere AI-agent werkt.

## Documentatiebronnen

```
AGENTS.md                         ← Verplichte grondwet (lees altijd eerst)
WORKFLOW.md                       ← Dit bestand — dagelijkse werkprocedure
SKILL-autonomous-admin-agents.md  ← Nova, Lima, Archon Copilot (tenant agents)
docs/MVP_SCOPE.md                 ← Vaste MVP-scope en bevroren modules
```

Voor stack, mapstructuur, routeclassificatie en autorisatiegrenzen: zie `AGENTS.md` secties 2.1–2.3.
Maak geen aparte `ARCHITECTURE.md`, `ROUTE_STRUCTURE.md`, `SECURITY.md`, `CODING_STANDARDS.md` of `AI_AGENTS.md`.

---

## Voor je begint

1. Open altijd dezelfde lokale ArchonPro-repository.
2. Laat niet twee AI-agents tegelijk in dezelfde branch schrijven.
3. Controleer of je vorige werk gecommit en gepusht is.
4. Maak een kleine taakbranch, bijvoorbeeld `fix/login-redirect` of `feature/real-email-send`.
5. Geef één concrete taak met grenzen en acceptatiecriteria.

---

## Verplichte startvolgorde voor iedere taak

```
Lees AGENTS.md
      ↓
Controleer git status + branch
      ↓
Inspecteer bestaande implementatie (read-only)
      ↓
Raadpleeg MVP_SCOPE / SKILL-autonomous-admin-agents.md indien relevant
      ↓
Presenteer plan: scope · bestanden · risico's · aannames
      ↓
Wacht op akkoord (of start als scope klein en duidelijk is)
      ↓
Implementeer
      ↓
pnpm lint
      ↓
pnpm typecheck
      ↓
pnpm test
      ↓
pnpm build (bij route/config-wijzigingen)
      ↓
Commit (één taak, één commit)
      ↓
Push branch
```

---

## Veilige opdracht voor Cursor of Kiro

Gebruik dit als starttekst en vul alleen de taak in:

> Lees eerst `AGENTS.md` en inspecteer de bestaande implementatie zonder bestanden te wijzigen. Controleer Git-status en behandel bestaande wijzigingen als gebruikerswerk. Voor MVP-scope zie `docs/MVP_SCOPE.md`; voor tenant-AI-agents zie `SKILL-autonomous-admin-agents.md`. Taak: [VUL HIER ÉÉN TAAK IN]. Geef eerst diagnose, scope, verwachte bestanden, risico's en testplan. Verwijder, verplaats of hernoem niets. Maak geen duplicaten. Wijzig niets buiten deze taak. Voer na implementatie relevante lint-, typecheck-, test- en buildcontroles uit. Rapporteer exact wat gewijzigd is en wat nog onzeker blijft.

---

## Tijdens het werk

- Accepteer geen onverwachte projectbrede refactor.
- Stop wanneer de agent meer dan 10 bestanden wil wijzigen zonder duidelijke reden.
- Laat auth, database, migraties, betalingen of `.env` niet "even snel" aanpassen binnen een UI-taak.
- Start Kiro niet met schrijven zolang Cursor nog wijzigingen uitvoert, en omgekeerd.
- Bevroren modules (`bouwnetwerk`, `telegram`, `automatisaties`, `werkposts`, `comms`, `geheugen`, `geschillen`, `/portal/*`) worden niet aangeraakt.
- Routeverplaatsingen (bijv. `/dashboard/admin` → `/admin`) alleen als aparte, expliciet goedgekeurde taak — zie `AGENTS.md` sectie 2.3.

---

## Na iedere taak

1. Bekijk de gewijzigde bestanden en controleer of ze bij de taak horen.
2. Laat typecheck, tests en indien nodig build uitvoeren.
3. Test de aangepaste flow zelf één keer.
4. Maak één duidelijke commit.
5. Push de branch als veilige externe kopie.
6. Begin pas daarna aan de volgende taak.

---

## Als iets stukgaat

- Start geen tweede agent die blind een brede reparatie uitvoert.
- Noteer de exacte fout, route en laatste werkende commit.
- Laat eerst diagnosticeren zonder wijzigingen.
- Herstel via een kleine nieuwe fix of draai alleen de problematische commit gecontroleerd terug.
- Verwijder nooit willekeurig mappen zoals `.next`, migraties of configuratie zonder te begrijpen waarom.

---

## Aanbevolen volgorde voor ArchonPro

1. Productiedomeinen, registratie en login.
2. Tenant-isolatie en server-side rollen/rechten.
3. Echte abonnementen en Stripe-webhooks.
4. Echte e-mailverzending en statusregistratie.
5. Klantportaal en digitaal offerteakkoord.
6. Facturatie en Belgische gestructureerde e-facturatie/Peppol.
7. Agenda, team en overige placeholders.
8. AI-agents v1: Nova (offerte-opvolging) en Lima (factuurherinnering).
9. Pas daarna v2-agents en uitbreidingen.

---

## Welk doc gebruik ik wanneer?

| Vraag | Raadpleeg |
|---|---|
| Wat mag ik wel/niet doen als AI-agent? | `AGENTS.md` |
| Hoe werk ik dagelijks veilig? | `WORKFLOW.md` (dit bestand) |
| Stack, mappen, routes, autorisatie? | `AGENTS.md` secties 2.1–2.3 |
| Hoe werken Nova, Lima en Archon Copilot? | `SKILL-autonomous-admin-agents.md` |
| Wat is in scope voor de MVP? | `docs/MVP_SCOPE.md` |
