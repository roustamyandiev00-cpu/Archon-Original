# ArchonPro — agent instructions

## Project overview

Single Next.js 16 (App Router) application for ArchonPro: Belgian construction CRM, invoicing, Peppol, AI agents, and admin tooling.

- **Package manager:** pnpm 10.x (`pnpm-lock.yaml` — do not use npm/yarn)
- **Node:** 22.x
- **Database:** hosted Supabase (PostgreSQL + Auth + RLS)
- **Entry:** `src/app/page.tsx`

Standard commands are documented in `README.md` and `package.json` scripts.

## Cursor Cloud specific instructions

### Boot requirements

1. **Dependencies:** `pnpm install` (Puppeteer, sharp, and unrs-resolver run postinstall scripts; allowed via `pnpm.onlyBuiltDependencies` in `package.json`).
2. **Environment:** copy `.env.example` to `.env.local`. Minimum required keys:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`)
   - `SUPABASE_SERVICE_ROLE_KEY` (server actions, cron routes, admin flows)

Without Supabase env vars the dev server starts, but middleware throws on most routes (`src/lib/supabase/env.ts`).

### Running the app

```bash
pnpm dev          # http://localhost:3000
pnpm dev:mobile   # bind 0.0.0.0 for LAN/mobile
pnpm test         # vitest (no DB)
pnpm lint         # eslint
pnpm build        # production build
```

Only one process is required locally: the Next.js dev server. There is no docker-compose in the repo.

### Supabase and migrations

- SQL migrations live in `supabase/migrations/` (24 incremental patches).
- **Important:** migrations assume a pre-existing base schema on the hosted Supabase project. They are not self-contained for a fresh database — `supabase start` fails when applying the first migration unless the base tables already exist.
- For full CRM/dashboard flows, use a hosted Supabase project with the complete schema (production/staging), not a blank local Postgres.
- `supabase/config.toml` is for optional local Supabase CLI usage; local stack requires Docker.

### Preview mode (limited dashboard without login)

Visit `/dashboard/voorbeeld` for read-only demo UI. Still requires valid Supabase env vars for middleware.

### Lint and tests

- `pnpm test` — 28 unit tests in `src/lib/agents/__tests__/`; no Supabase needed.
- `pnpm lint` — may report pre-existing ESLint issues in the codebase; the linter itself runs correctly.

### Optional integrations (not required to boot)

Groq/OpenAI, ElevenLabs, Storecove/Peppol, Billit, Slack (`SLACK_CONNECTOR`), cron secrets — see `.env.example`.

### Dashboard conventions

- Design reference: `docs/reference/dashboard-overzicht-reference.png`, `docs/reference/dashboard-design.md`
- Default dashboard route in product: `/dashboard/overzicht`
- Invoices/quotes use server actions under `src/app/dashboard/facturen/`, not a REST `/api/documents` endpoint
