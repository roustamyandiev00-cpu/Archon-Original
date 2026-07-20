# Verification Baseline — ArchonPro

Datum: 2026-07-20  
Branch: `wip/pre-facturen-safety-2026-07-18`  
Package manager: **pnpm** (`pnpm-lock.yaml`)  
Node: v22.22.2  
Next.js: 16.2.10  
TypeScript: ^5  

## Repository status (vóór hardening)

- ~178 lokale gewijzigde/untracked bestanden (bestaand gebruikerswerk; niet overschreven).
- Lockfile: `pnpm-lock.yaml` aanwezig.
- Config: `vercel.json`, `supabase/config.toml`, `vitest.config.ts`, `eslint.config.mjs`, `tsconfig.json`.
- CI: geen actieve GitHub Actions workflows gevonden in baseline-scan.
- Scripts: `dev`, `build`, `lint`, `test`, `test:watch` (later aangevuld met `typecheck`, `types:generate`).

## Commando’s en resultaten

| Check | Commando | Exit | Resultaat |
|------|----------|------|-----------|
| Typecheck (eerste run) | `pnpm exec tsc --noEmit` | 2 | Faalde door corrupte `.next/dev/types/routes.d.ts` (Turbopack generated) |
| ESLint (core security files) | `pnpm exec eslint src/lib/agents/policy.ts src/lib/platform-admin.ts src/lib/impersonation.ts` | 0 | OK |
| Unit tests (eerste run) | `pnpm test` | 1 | 120 passed / 1 failed (`context-access.test.ts` timeout 5s) |
| Production build | `pnpm build` | (na hardening) | Zie `VERIFICATION_FINAL.md` |

## Fouten / warnings

1. **`.next/dev/types/routes.d.ts` syntaxfouten**  
   - Oorzaak: gegenereerde Turbopack types opgenomen in `tsconfig.json` include.  
   - Oplossing: `.next/dev` uit typecheck gehaald; script `typecheck` toegevoegd.

2. **`context-access.test.ts` timeout**  
   - Bestaande flaky/timeout test; niet veroorzaakt door deze hardening.  
   - Status: open (P2), niet stil gefixt.

## Relevante bestanden

- `package.json`, `tsconfig.json`, `vitest.config.ts`, `vercel.json`
- `src/lib/agents/policy.ts`, `src/lib/platform-admin.ts`, `src/lib/impersonation.ts`
- `src/app/api/cron/*`, `src/app/api/webhooks/stripe/route.ts`

## Voorgestelde vervolgstappen

1. Typecheck + tests + build na hardening herhalen.
2. Live migratie-status op Supabase bevestigen (niet lokaal bewezen in deze fase).
3. E2E offerte→factuur en live Stripe/OAuth apart plannen.
