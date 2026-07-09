-- Bouwnetwerk: likes op werkposts + publieke media-bucket voor foto's en
-- chat-bijlagen.
--
-- Toegepast op vqiyftyqfpfbpwhadpvn via de Management API op 2026-07-08.
-- Dit bestand staat in de repo als documentatie/herhaalbare migratie.

-- 1. Likes op werkposts. Bewust gekoppeld aan de INGELOGDE GEBRUIKER (user_id),
--    niet aan het bedrijf, zodat elke geregistreerde gebruiker een like kan
--    plaatsen — ook net-geregistreerde gebruikers zonder gekoppeld bedrijf.
create table if not exists public.werkpost_likes (
  id uuid primary key default gen_random_uuid(),
  werkpost_id uuid not null references public.werkposts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (werkpost_id, user_id)
);

create index if not exists werkpost_likes_werkpost_id_idx on public.werkpost_likes (werkpost_id);
create index if not exists werkpost_likes_user_id_idx on public.werkpost_likes (user_id);

alter table public.werkpost_likes enable row level security;

-- Iedereen mag de likes (tellingen) zien, net als de werkposts zelf publiek zijn.
drop policy if exists "werkpost_likes_select_public" on public.werkpost_likes;
create policy "werkpost_likes_select_public"
  on public.werkpost_likes for select
  to public
  using (true);

-- Je kan alleen namens jezelf liken/ontliken.
drop policy if exists "werkpost_likes_insert_self" on public.werkpost_likes;
create policy "werkpost_likes_insert_self"
  on public.werkpost_likes for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "werkpost_likes_delete_self" on public.werkpost_likes;
create policy "werkpost_likes_delete_self"
  on public.werkpost_likes for delete
  to authenticated
  using (user_id = auth.uid());

-- 2. Publieke bucket voor werkpost-foto's en chat-bijlagen. Publiek omdat de
--    werkpost-feed publiek zichtbaar is; bestanden staan in de map
--    <company_id>/... zodat de RLS-check op uploads/verwijderen werkt.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'werkpost-media',
  'werkpost-media',
  true,
  10485760,
  array['image/png','image/jpeg','image/jpg','image/webp','image/gif','application/pdf']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "werkpost_media_upload_members" on storage.objects;
create policy "werkpost_media_upload_members"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'werkpost-media'
    and is_member_of_company(((storage.foldername(name))[1])::bigint)
  );

drop policy if exists "werkpost_media_delete_members" on storage.objects;
create policy "werkpost_media_delete_members"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'werkpost-media'
    and is_member_of_company(((storage.foldername(name))[1])::bigint)
  );
