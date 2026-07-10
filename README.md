# ArchonPro

Next.js dashboard for ArchonPro — CRM, facturen, offertes, agent-chat, en admin tooling.

## Stack

- **Framework:** Next.js 16 (App Router) + React 19
- **Package manager:** pnpm (gebruik geen npm/yarn lockfiles)
- **Database:** Supabase
- **Styling:** Tailwind CSS 4

## Projectstructuur

```
src/app/          # App Router pages en server actions
src/components/   # UI-componenten
src/lib/          # Business logic, integraties, Supabase helpers
supabase/         # Migraties
public/           # Statische assets
```

Entry point: `src/app/page.tsx` (niet `app/page.tsx`).

## Lokaal starten

```bash
pnpm install
cp .env.example .env.local   # vul Supabase- en API-keys in
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

Mobiel op LAN:

```bash
pnpm dev:mobile
```

## Scripts

| Commando | Doel |
|----------|------|
| `pnpm dev` | Development server |
| `pnpm build` | Production build |
| `pnpm start` | Production server |
| `pnpm lint` | ESLint |

## Belangrijk voor agents

- **Dashboard-referentie:** `docs/reference/dashboard-overzicht-reference.png` + `docs/reference/dashboard-design.md`
- Standaard dashboard: `/dashboard/overzicht` (niet Command Center)
- Facturen/offertes lopen via **server actions** in `src/app/dashboard/facturen/` — er is geen `/api/documents` REST-endpoint.
- Gebruik `pnpm`, niet `npm install`.
- `.env.local` is lokaal en staat in `.gitignore`.
- Gescrapete docs in `.firecrawl/` horen niet in de repo (cache, geen bron van waarheid).
