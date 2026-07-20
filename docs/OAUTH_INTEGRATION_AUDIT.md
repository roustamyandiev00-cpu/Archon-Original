# OAuth Integration Audit

Datum: 2026-07-20  
Scope: code-audit. Live token refresh met providercredentials: **niet uitgevoerd**.

## Overzicht

| Provider | Authorization | Callback | Tokenopslag | Encryptie | Refresh | Expiry | Revoke | Error handling | Status |
|----------|---------------|----------|-------------|-----------|---------|--------|--------|----------------|--------|
| Google Calendar | `/integraties/[provider]/authorize` + scopes offline | callback route | `integraties.config` | Niet bewezen encrypted-at-rest | `refreshTokens()` aanwezig | `isTokenExpired()` | disconnect actions | basis | PARTIAL |
| Microsoft Teams | OAuth v2 + offline_access | callback | idem | Niet bewezen | `refreshTokens()` | ja | disconnect | basis | PARTIAL |
| Dropbox | authorize + offline token | callback | idem | Niet bewezen | refresh helper | ja | disconnect | basis | PARTIAL |
| QuickBooks | Intuit endpoints in `OAUTH_CONFIGS` | callback | idem | Niet bewezen | refresh helper | ja | disconnect | basis | PARTIAL |
| Exact Online / Teamleader | aanwezig in `oauth.ts` | aanwezig | idem | Niet bewezen | refresh helper | ja | disconnect | basis | PARTIAL |
| Slack | aparte authorize/callback | aanwezig | config | Niet bewezen | provider-specifiek | — | — | basis | PARTIAL |

## Gemeenschappelijke bevindingen

- State-parameter / PKCE: aanwezigheid wisselt per route; niet exhaustief getest.
- Tokens landen in integratie-config JSON; aparte envelope-encryptie niet overal aangetoond (SMTP wel apart encrypted).
- `refreshTokens` in `src/lib/oauth.ts` is generiek; live callsites per provider niet end-to-end bewezen.
- Logging: geen tokens in tests gezien; runtime logs niet live gecontroleerd.

## Wat niet verifieerbaar was

- Live Google/Teams/Dropbox/QuickBooks refresh met echte secrets.
- Token revoke bij provider.
- Expiry-gedrag onder productieclock skew.

## Aanbeveling

1. Unit-tests rond `isTokenExpired` / refresh payload mapping (intern) uitbreiden.
2. Per provider: 1 handmatige reconnect-test in staging.
3. Overweeg encryptie van refresh tokens at rest (zelfde patroon als SMTP secrets).
