-- Dakbedrijven directory: publieke lijst van dakwinkels, bouwbedrijven en
-- dakdekkers, los van het bouwnetwerk en los van ArchonPro-accounts.
--
-- Doel: bouwbedrijven hoeven niet meer via Google te zoeken naar
-- leveranciers/dakdekkers — ze vinden en beoordelen ze hier. Iedereen mag
-- een bedrijf toevoegen, foto's uploaden en een review plaatsen, ook zonder
-- account (bewuste keuze — zie opmerking bij de RLS-policies hieronder).

create table if not exists public.dak_bedrijven (
  id bigint generated always as identity primary key,
  naam text not null,
  categorie text not null default 'bouwbedrijf'
    check (categorie in ('winkel', 'bouwbedrijf', 'dakdekker', 'leverancier', 'overig')),
  adres text,
  postcode text,
  stad text,
  regio text,
  telefoon text,
  website text,
  beschrijving text,
  fotos text[] not null default '{}',
  toegevoegd_door text,
  created_at timestamptz not null default now(),

  constraint dak_bedrijven_naam_check check (char_length(btrim(naam)) > 0)
);

create index if not exists dak_bedrijven_regio_idx on public.dak_bedrijven (regio);
create index if not exists dak_bedrijven_categorie_idx on public.dak_bedrijven (categorie);
create index if not exists dak_bedrijven_created_at_idx on public.dak_bedrijven (created_at desc);

alter table public.dak_bedrijven enable row level security;

-- Iedereen mag de directory bekijken.
drop policy if exists "dak_bedrijven_select_public" on public.dak_bedrijven;
create policy "dak_bedrijven_select_public"
  on public.dak_bedrijven for select
  to public
  using (true);

-- Iedereen mag een bedrijf toevoegen, ook zonder account. Bewust open
-- gehouden (geen login-drempel), zoals gevraagd. Let op: zonder verdere
-- moderatie/rate-limiting is dit gevoelig voor spam — overweeg later een
-- eenvoudige captcha of een goedkeuringsstap als dat een probleem wordt.
drop policy if exists "dak_bedrijven_insert_public" on public.dak_bedrijven;
create policy "dak_bedrijven_insert_public"
  on public.dak_bedrijven for insert
  to public
  with check (char_length(btrim(naam)) > 0);

-- Reviews (sterren + commentaar) op dakbedrijven.
create table if not exists public.dak_bedrijf_reviews (
  id uuid primary key default gen_random_uuid(),
  dak_bedrijf_id bigint not null references public.dak_bedrijven(id) on delete cascade,
  naam text not null default 'Anoniem',
  rating integer not null check (rating >= 1 and rating <= 5),
  commentaar text not null,
  created_at timestamptz not null default now(),

  constraint dak_bedrijf_reviews_commentaar_check check (char_length(btrim(commentaar)) > 0)
);

create index if not exists dak_bedrijf_reviews_dak_bedrijf_id_idx on public.dak_bedrijf_reviews (dak_bedrijf_id);

alter table public.dak_bedrijf_reviews enable row level security;

-- Iedereen mag reviews bekijken.
drop policy if exists "dak_bedrijf_reviews_select_public" on public.dak_bedrijf_reviews;
create policy "dak_bedrijf_reviews_select_public"
  on public.dak_bedrijf_reviews for select
  to public
  using (true);

-- Iedereen mag een review plaatsen, ook zonder account (zelfde afweging als
-- hierboven bij dak_bedrijven).
drop policy if exists "dak_bedrijf_reviews_insert_public" on public.dak_bedrijf_reviews;
create policy "dak_bedrijf_reviews_insert_public"
  on public.dak_bedrijf_reviews for insert
  to public
  with check (
    rating >= 1 and rating <= 5
    and char_length(btrim(commentaar)) > 0
  );

-- Bewust geen update/delete policies: eenmaal geplaatste bedrijven/reviews
-- zijn niet publiek te wijzigen of te verwijderen (voorkomt misbruik zonder
-- accountsysteem). Beheer kan altijd nog via de Supabase service role.

-- Publieke bucket voor foto's van dakbedrijven (adres/pand/werk).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'dakbedrijven-media',
  'dakbedrijven-media',
  true,
  10485760,
  array['image/png','image/jpeg','image/jpg','image/webp','image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "dakbedrijven_media_upload_public" on storage.objects;
create policy "dakbedrijven_media_upload_public"
  on storage.objects for insert
  to public
  with check (bucket_id = 'dakbedrijven-media');

drop policy if exists "dakbedrijven_media_select_public" on storage.objects;
create policy "dakbedrijven_media_select_public"
  on storage.objects for select
  to public
  using (bucket_id = 'dakbedrijven-media');
