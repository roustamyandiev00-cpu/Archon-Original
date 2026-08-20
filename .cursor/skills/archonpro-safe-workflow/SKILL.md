---
name: archonpro-safe-workflow
description: Veilige ArchonPro feature/bugfix-workflow met startcontrole, scope-limieten en eindrapport. Gebruik bij features, bugfixes, refactors of reviews in deze repository — vooral bij dashboard, offertes, facturen, agenda, speech, agents of Supabase.
---

# ArchonPro safe workflow

## Start

1. Lees `AGENTS.md` en `docs/MVP_SCOPE.md`.
2. Check branch, `git status --short`, bestaande userwijzigingen (niet overschrijven).
3. Zoek eerst de bestaande implementatie — geen duplicaten/`v2`.
4. Meld modus + kort plan: doel, bestanden, risico’s, verificatie.
5. Vraag toestemming vóór auth, DB/migraties, Stripe, secrets, dependencies of >10 bestanden.

## Uitvoeren

- Eén afgebakende taak; minimale diff.
- Tenant: `companyId` server-side; geen service-role in clientcode.
- Bevroren modules (`/portal/*`, bouwnetwerk, telegram, …) alleen bij build/security/regressie.
- Package manager: uitsluitend `pnpm`.

## Verifiëren

Minimaal waar relevant:

1. ESLint op geraakte files
2. `pnpm exec tsc --noEmit`
3. Gerichte `pnpm test` / vitest
4. `pnpm build` bij routes/config/brede wijzigingen

## Eindrapport

1. Resultaat  
2. Gewijzigde bestanden (+ reden)  
3. Database/config (of geen)  
4. Controles  
5. Openstaand / risico’s  

Geen commit/push/migrate/deploy zonder expliciete vraag.
