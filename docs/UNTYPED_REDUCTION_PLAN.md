# Untyped() Reduction Plan

Datum: 2026-07-20  
Branch: `feature/tasks-module`

## Doel

`untyped()` terugdringen zonder fictieve types, `any` of `@ts-ignore`.

## Inventaris (hoogste counts eerst)

| Bestand | Tabel/RPC (typisch) | Huidige reden | Type beschikbaar | Actie | Prioriteit |
|---------|---------------------|---------------|------------------|-------|------------|
| `src/app/dashboard/integraties/actions.ts` | `integraties` | config JSON flexibel | deels | regenereer types; typed select | P1 |
| `src/app/dashboard/facturen/peppolActions.ts` | peppol/inbox | nieuwere kolommen | deels | gen types na migraties | P1 |
| `src/app/dashboard/geschillen/actions.ts` | geschillen | schema drift | onzeker | bevestig live schema | P1 |
| `src/lib/agents/events/store.ts` | agent events | drift | deels | gen types | P2 |
| `src/lib/peppol/inbox.ts` | integraties/inbox | drift | deels | gen types | P2 |
| `src/lib/accounting/tokens.ts` | accounting tokens | drift | deels | gen types | P2 |
| `src/app/dashboard/boekhouding/page.tsx` | bank/exports | drift | deels | gen types | P2 |
| `src/app/api/webhooks/stripe/route.ts` | purchases/credits | drift | deels | na `stripe_webhook_events` typed helper | P1 |
| `src/app/api/cron/peppol-inbox/route.ts` | integraties | drift | deels | gen types | P2 |
| Overige 1–2 hits | diverse | lokale drift | wisselend | case-by-case | P3 |

## Regels

1. Geen handgeschreven fictieve tabellen in `database.types.ts`.
2. Wel: kolommen/tabellen toevoegen die in **lokale migraties** in deze branch staan (`stripe_webhook_events`, tasks-satellites).
3. `pnpm types:generate` (linked Supabase) wanneer credentials beschikbaar zijn.
4. Typecheck na elke vervanggroep.

## Deze branch

- `stripe_webhook_events` + tasks-tabellen: types handmatig gesynchroniseerd met migraties.
- Massale `untyped()`-verwijdering **niet** gedaan zonder live schema-bevestiging.
