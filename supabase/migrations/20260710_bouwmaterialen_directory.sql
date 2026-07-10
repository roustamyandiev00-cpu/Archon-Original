-- Bouwmaterialen winkels: publieke lijst van winkels waar dak- of
-- tegelmaterialen gekocht kunnen worden, los van het bouwnetwerk en los van
-- ArchonPro-accounts. Zelfde opzet als dak_bedrijven (zie
-- 20260709_dakbedrijven_directory.sql), maar met een eenvoudigere
-- categorie-keuze: "dak" of "tegels".
--
-- Iedereen mag een winkel toevoegen, foto's uploaden. Geen account nodig
-- (bewuste keuze — zie opmerking bij de RLS-policies hieronder).

create table if not exists public.bouwmateriaal_winkels (
  id bigint generated always as identity primary key,
  naam text not null,
  categorie text not null default 'dak'
    check (categorie in ('dak', 'tegels')),
  adres text,
  postcode text,
  stad text,
  regio text,
  telefoon text,
  website text,
  beschrijving text,
  fotos text[] not null default '{}',
  toegevoegd_door text,
  lat double precision,
  lng double precision,
  created_at timestamptz not null default now(),

  constraint bouwmateriaal_winkels_naam_check check (char_length(btrim(naam)) > 0)
);

create index if not exists bouwmateriaal_winkels_regio_idx on public.bouwmateriaal_winkels (regio);
create index if not exists bouwmateriaal_winkels_categorie_idx on public.bouwmateriaal_winkels (categorie);
create index if not exists bouwmateriaal_winkels_created_at_idx on public.bouwmateriaal_winkels (created_at desc);

alter table public.bouwmateriaal_winkels enable row level security;

-- Iedereen mag de directory bekijken.
drop policy if exists "bouwmateriaal_winkels_select_public" on public.bouwmateriaal_winkels;
create policy "bouwmateriaal_winkels_select_public"
  on public.bouwmateriaal_winkels for select
  to public
  using (true);

-- Iedereen mag een winkel toevoegen, ook zonder account. Bewust open
-- gehouden (geen login-drempel). Let op: zonder verdere
-- moderatie/rate-limiting is dit gevoelig voor spam — overweeg later een
-- eenvoudige captcha of een goedkeuringsstap als dat een probleem wordt.
drop policy if exists "bouwmateriaal_winkels_insert_public" on public.bouwmateriaal_winkels;
create policy "bouwmateriaal_winkels_insert_public"
  on public.bouwmateriaal_winkels for insert
  to public
  with check (char_length(btrim(naam)) > 0);

-- Bewust geen update/delete policies: eenmaal toegevoegde winkels zijn niet
-- publiek te wijzigen of te verwijderen (voorkomt misbruik zonder
-- accountsysteem). Beheer kan altijd nog via de Supabase service role.

-- Publieke bucket voor foto's van bouwmaterialenwinkels (pand/materialen).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'bouwmaterialen-media',
  'bouwmaterialen-media',
  true,
  10485760,
  array['image/png','image/jpeg','image/jpg','image/webp','image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "bouwmaterialen_media_upload_public" on storage.objects;
create policy "bouwmaterialen_media_upload_public"
  on storage.objects for insert
  to public
  with check (bucket_id = 'bouwmaterialen-media');

drop policy if exists "bouwmaterialen_media_select_public" on storage.objects;
create policy "bouwmaterialen_media_select_public"
  on storage.objects for select
  to public
  using (bucket_id = 'bouwmaterialen-media');
