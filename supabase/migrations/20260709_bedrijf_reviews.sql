-- Bouwnetwerk: Bedrijf reviews (sterren + commentaar)
--
-- Dit bestand definieert de tabel en bijbehorende RLS-policies om bedrijven
-- elkaar sterren en reviews te laten geven na een samenwerking.

create table if not exists public.bedrijf_reviews (
  id uuid primary key default gen_random_uuid(),
  reviewer_company_id bigint not null references public.bedrijven(id) on delete cascade,
  target_company_id bigint not null references public.bedrijven(id) on delete cascade,
  rating integer not null check (rating >= 1 and rating <= 5),
  commentaar text not null,
  created_at timestamptz not null default now(),
  
  -- Een bedrijf kan zichzelf niet beoordelen
  constraint review_self_check check (reviewer_company_id <> target_company_id),
  
  -- Een bedrijf kan een ander bedrijf maximaal één keer beoordelen
  unique (reviewer_company_id, target_company_id)
);

create index if not exists bedrijf_reviews_target_company_id_idx on public.bedrijf_reviews (target_company_id);
create index if not exists bedrijf_reviews_reviewer_company_id_idx on public.bedrijf_reviews (reviewer_company_id);

alter table public.bedrijf_reviews enable row level security;

-- 1. Iedereen kan reviews bekijken
drop policy if exists "bedrijf_reviews_select_public" on public.bedrijf_reviews;
create policy "bedrijf_reviews_select_public"
  on public.bedrijf_reviews for select
  to public
  using (true);

-- 2. Alleen actieve leden van de reviewer-firma mogen reviews invoegen
drop policy if exists "bedrijf_reviews_insert_members" on public.bedrijf_reviews;
create policy "bedrijf_reviews_insert_members"
  on public.bedrijf_reviews for insert
  to authenticated
  with check (
    app_private.is_company_member(reviewer_company_id)
  );

-- 3. Alleen actieve leden van de reviewer-firma mogen hun eigen reviews wijzigen
drop policy if exists "bedrijf_reviews_update_members" on public.bedrijf_reviews;
create policy "bedrijf_reviews_update_members"
  on public.bedrijf_reviews for update
  to authenticated
  using (
    app_private.is_company_member(reviewer_company_id)
  )
  with check (
    app_private.is_company_member(reviewer_company_id)
  );

-- 4. Alleen actieve leden van de reviewer-firma mogen hun eigen reviews verwijderen
drop policy if exists "bedrijf_reviews_delete_members" on public.bedrijf_reviews;
create policy "bedrijf_reviews_delete_members"
  on public.bedrijf_reviews for delete
  to authenticated
  using (
    app_private.is_company_member(reviewer_company_id)
  );
