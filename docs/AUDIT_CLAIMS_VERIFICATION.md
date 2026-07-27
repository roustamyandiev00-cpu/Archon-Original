# Audit Claims Verification

Datum: 2026-07-20  
Methode: code-inspectie + unit tests. Geen live E2E tenzij expliciet vermeld.

| # | Claim | Resultaat | Bewijs | Status |
|---|------|-----------|--------|--------|
| 1 | Dashboardqueries zijn tenant-gefilterd | Kernpaden filteren op `company_id`/`bedrijf_id` via `getCompanyContext` / `requireWriteAccess` | `src/components/dashboard/context.ts`, actions in offertes/facturen/automatisaties | PARTIALLY_VERIFIED |
| 2 | RLS op alle tenanttabellen | Migraties bevatten RLS; niet alle 45 migraties live bewezen | `supabase/migrations/*`, o.a. platform_admins policies | PARTIALLY_VERIFIED |
| 3 | Service-role niet in client components | `createServiceClient` alleen server-side imports | `src/lib/supabase/service.ts` + grep client usage | VERIFIED |
| 4 | Platform-admin routes server-side beveiligd | `requirePlatformAdmin` in admin layout/actions | `src/lib/platform-admin.ts`, `src/app/admin/*` | VERIFIED |
| 5 | Impersonatie vereist autorisatie | `isPlatformAdmin` + signed cookie + company check | `src/lib/impersonation.ts` + tests | VERIFIED |
| 6 | AI-agent approval veilige allowlist | Was blocklist + `undefined → true`; nu deny-by-default allowlist | `canApproveAction` + tests | VERIFIED (na fix) |
| 7 | Stripe webhooks verifiëren signatures | `constructEvent` + secret check | `src/app/api/webhooks/stripe/route.ts` | VERIFIED |
| 8 | Stripe-verwerking idempotent | Purchase-status check aanwezig; geen event-id ledger | `fulfillCheckoutSession` alreadyCompleted | PARTIALLY_VERIFIED |
| 9 | Publieke offertelinks veilig/verlopend | Tokenroutes aanwezig; volledige expiry-E2E niet gedraaid | `/o/[token]` | PARTIALLY_VERIFIED |
| 10 | SMTP-geheimen versleuteld | `encryptSecret`/`decryptSecret` | `smtp-actions.ts`, `lib/crypto/secrets` | VERIFIED |
| 11 | Agentacties geaudit | `writeAuditEntry` bij approve/reject | `automatisaties/actions.ts` | VERIFIED |
| 12 | AI-credits server-side | grant/purchase flows server-side | `grantAiCreditsAfterPayment`, credits actions | PARTIALLY_VERIFIED |
| 13 | Cronroutes auth | Bearer `CRON_SECRET`; deny zonder secret | `src/lib/cron/auth.ts` + tests | VERIFIED (na fix) |
| 14 | OAuth-tokens veilig opgeslagen | Tokens in integratie-config; encryptie/refresh per provider wisselend | `src/lib/oauth.ts`, integratie routes | PARTIALLY_VERIFIED |
| 15 | Geen onbeveiligde tenant-id uit request | Meeste actions gebruiken context companyId; spot-check niet exhaustief | actions patterns | PARTIALLY_VERIFIED |

## Incorrecte of te sterke eerdere auditclaims

- “Productieklaar / geen kritieke leaks” was **te sterk**: `canApproveAction(undefined) === true` was een P0 autorisatiebug.
- “Platform Admin volledig afgeschermd” klopte deels, maar bootstrap via e-mail stond standaard open zonder flag.
- Audit-UI claim: `/dashboard/audit` was een **placeholder**, geen echte tenant auditlog (nu vervangen door echte pagina).
