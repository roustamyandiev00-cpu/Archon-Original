# Untyped() Reduction Plan

Datum: 2026-07-20  
Doel: `untyped()` alleen behouden waar gegenereerde types ontbreken; geen `any`/`ts-ignore`.

## Inventaris (hoogste volume eerst)

| Bestand | Tabel/RPC | Huidige reden | Type beschikbaar | Actie | Prioriteit |
|---------|-----------|---------------|------------------|-------|------------|
| `src/app/dashboard/integraties/actions.ts` | `integraties` | Config JSON / ontbrekende kolommen | Deels | Regenereer types; typed select | P1 |
| `src/app/dashboard/facturen/peppolActions.ts` | peppol/integraties | Nieuwere velden | Deels | Types + typed client | P1 |
| `src/app/dashboard/geschillen/actions.ts` | geschillen | Migratie na types snapshot | Waarschijnlijk ja in DB | Gen types + vervang | P1 |
| `src/lib/agents/events/store.ts` | agent events | Ontbrekende tables in types | Onzeker | Bevestig schema | P2 |
| `src/lib/impersonation.ts` | `admin_impersonation_log`, `audit_logs`, `company_memberships`, `platform_admins` | Mix | Ja voor meeste | Vervang waar typed | P1 |
| `src/lib/admin/platform-billing.ts` | platform billing | Nieuwe tabellen | Migratie aanwezig | Gen types | P1 |
| `src/lib/peppol/*` | peppol inbox/build | Untyped config | Deels | Incremental | P2 |
| `src/lib/accounting/*` | accounting tokens | Provider tokens JSON | Deels | Incremental | P2 |
| `src/app/api/webhooks/stripe/route.ts` | purchases / credits | Historisch | Deels | Na `stripe_webhook_events` typed gebruiken | P0 (deze branch) |
| `src/app/dashboard/prijslijst/*` | `prijslijst_items` | Types mogelijk aanwezig | Ja (migratie 20260716) | Vervang | P1 |
| `src/app/dashboard/team/*` | memberships | Types aanwezig | Ja | Vervang | P1 |
| Overige (bouwnetwerk, e-facturen, …) | diverse | Snapshot achterstand | Wisselend | Batch na `types:generate` | P2 |

## Regels

1. Geen handgeschreven fictieve tabellen.
2. Geen `any` als vervanging voor `untyped()`.
3. Geen `@ts-ignore`.
4. Voorkeur: `pnpm types:generate` (linked Supabase) → diff review → vervangen.
5. Typecheck na iedere groep.

## Deze branch

- `stripe_webhook_events` krijgt types in `database.types.ts` en helper gebruikt typed service client waar mogelijk.
- Taken-tabellen krijgen types mee; Taken-code vermijdt `untyped()`.
- Geen massale vervanging van alle historische call sites (risico + geen live schema-confirm).

## Volgende batch (na linked gen types)

1. prijslijst + team  
2. impersonation + platform-billing  
3. integraties/peppol  
4. rest
