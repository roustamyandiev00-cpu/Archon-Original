# Security Hardening Report

Datum: 2026-07-20

## Opgelost in deze sprint

### P0 — `canApproveAction` deny-by-default
- **Was:** `if (!userRole) return true` + blocklist (`viewer`/`guest`…).
- **Nu:** allowlist `owner`/`admin` only; `undefined`/`null`/onbekend → deny.
- Callsite: approve mag ook via `access.isAdmin` (RPC `is_company_admin`).
- Tests: `src/lib/agents/__tests__/can-approve-action.test.ts`.

### P0/P1 — Platform-admin bootstrap
- Bootstrap alleen bij `PLATFORM_ADMIN_BOOTSTRAP_ENABLED=true`.
- Standaard uit; DB RPC `is_platform_admin` is normaal pad.
- Vereist `userId` + e-mailmatch (geen anonieme toegang).
- Productie warning + best-effort audit bij bootstrap-hit.
- Docs in `.env.example`.

### P1 — Impersonatie
- TTL 30 minuten (was 60).
- Start + stop schrijven naar `audit_logs`.
- Blokkeert bedrijven met andere `platform_admins` (role=`ceo`).
- Verlopen cookie wordt verwijderd.
- Optionele `reason` in cookie/metadata.
- Tests uitgebreid (unauthorized, other admin, expiry).

### P1 — Cron auth
- Gedeelde helper `authorizeCronRequest` (deny zonder secret).
- Unit tests: geen/fout/correct secret.

### P1 — Audit UI
- `/dashboard/audit` laadt echte `audit_logs` gefilterd op `company_id`.
- Alleen company-admins (of impersonatie).
- Paginatie + actiefilter; metadata gesanitized (geen secrets).

## Bewust niet gedaan / open

| Item | Prioriteit | Reden |
|------|------------|-------|
| Stripe event-id idempotency ledger | P1 | Purchase-idempotency bestaat; event ledger ontbreekt |
| Live migratie-apply check | P0 ops | Geen destructieve DB-acties; remote status niet bewezen |
| Volledige OAuth live refresh E2E | P1 | Geen live credentials in deze sessie |
| `untyped()` volledig verwijderen | P2 | Types regenereren vereist linked Supabase |
| Taken-module bouwen | — | Expliciet buiten scope |

## Advies productie

1. Zet `PLATFORM_ADMIN_BOOTSTRAP_ENABLED=false`.
2. Zorg dat CEO in `platform_admins` staat.
3. `IMPERSONATION_SECRET` + `CRON_SECRET` + `STRIPE_WEBHOOK_SECRET` verplicht.
