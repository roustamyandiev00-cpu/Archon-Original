-- Dakbedrijven: locatie (lat/lng) zodat bedrijven op een kaart gepind kunnen
-- worden en gebruikers zelf een pin kunnen plaatsen bij het toevoegen.
--
-- Losse, idempotente migratie bovenop 20260709_dakbedrijven_directory.sql
-- (kan veilig los uitgevoerd worden, ook als die eerste migratie al gedraaid is).

alter table public.dak_bedrijven
  add column if not exists lat double precision,
  add column if not exists lng double precision;

create index if not exists dak_bedrijven_lat_lng_idx on public.dak_bedrijven (lat, lng);
