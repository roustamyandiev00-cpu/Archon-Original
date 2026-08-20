# Recovered Supabase migration history

Deze map bevat 82 migraties die op 2026-07-20 read-only zijn hersteld uit
`supabase_migrations.schema_migrations` van het productieproject.

## Belangrijk

- Dit is een historisch archief, geen actieve migratieketen.
- Verplaats deze bestanden niet rechtstreeks naar `supabase/migrations/`.
- Voer deze bestanden niet uit op productie, staging of lokaal zonder een
  afzonderlijk consolidatie- en herstelplan.
- De statements zijn afkomstig uit migratiehistoriek, niet uit klanttabellen.
- Er zijn geen mogelijke secrets of e-mailliteralen aangetroffen door de scan.

## Handmatige beoordeling vereist

Deze historische migraties bevatten schema-rebuilds of demo-/standaarddata:

- `20260403013312_remote_schema.sql`
- `20260408100001_bouwnetwerk_demo_data.sql`
- `20260501162030_fix_document_schema_full_rebuild.sql`
- `20260508012421_create_agent_tables_company_scoped.sql`
- `20260709183505_create_community_wall_posts.sql`

Gebruik voor een toekomstige lokale baseline een gecontroleerde schema-snapshot
of een nieuwe Supabase development branch. Behoud de productiehistoriek als
bron van waarheid en wijzig die niet zonder expliciet database-akkoord.
