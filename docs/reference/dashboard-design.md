# Dashboard design referentie

Bewaar dit als bron van waarheid voor het **Overzicht**-dashboard.

## Referentiebeeld

- Lokaal: `docs/reference/dashboard-overzicht-reference.png`
- Deploy (login vereist): `https://archonpro-4jxauscob-psauras-projects.vercel.app/dashboard`

Firecrawl kan de live URL niet scrapen (Vercel SSO-login). Gebruik het PNG-referentiebeeld en de code in:

- `src/app/dashboard/overzicht/page.tsx`
- `src/components/dashboard/OverviewDashboard.tsx`
- `src/components/dashboard/OverviewActionsPanel.tsx`
- `src/components/dashboard/Topbar.tsx`
- `src/components/dashboard/Sidebar.tsx`

## Kleurenpalet (donker)

| Token | Hex | Gebruik |
|-------|-----|---------|
| `--color-bg` | `#0B0E14` | Pagina-achtergrond |
| `--color-surface` / `--color-card` | `#151921` | Kaarten, sidebar, topbar |
| `--color-primary` | `#3B82F6` | Actieve nav, primaire knoppen |
| `--color-text-muted` | `#94A3B8` | Subtekst, labels |
| Accent violet | `#8B5CF6` | Offerte-tags, chips |
| Accent amber | `#F59E0B` | Waarschuwingen, banner |
| Accent emerald | `#22C55E` | Goedkeuren, sync-dot |

## Layout

1. **Sidebar** (220px): ArchonPro + MISSION VIEW, groepen Overzicht / Operatie / Administratie
2. **Topbar**: Offertes vandaag · Verzonden · Pipeline · Zoeken · Agent Live · sync
3. **Banner** (optioneel): pending AI-goedkeuring (amber)
4. **KPI-strip**: 5 kaarten
5. **Hero**: begroeting + chips (AI-voorstellen, Offertes opvolgen)
6. **Grid 2 kolommen**: Acties vandaag | Nova + Snelle acties

## Standaard route

`/dashboard` → redirect naar `/dashboard/overzicht`
