-- RECOVERED PRODUCTION MIGRATION HISTORY
-- Read-only archive; do not apply directly or add to the active migration chain.
-- Production version: 20260709183505
-- Production name: create_community_wall_posts
-- Community wall for landing page feedback (bericht, idee, tip)
create table if not exists public.community_wall_posts (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('bericht', 'idee', 'tip')),
  author_name text not null default 'Anoniem',
  company text,
  body text not null,
  status text not null default 'published' check (status in ('published', 'hidden')),
  created_at timestamptz not null default now(),
  constraint community_wall_posts_body_len check (char_length(body) between 1 and 2000),
  constraint community_wall_posts_author_len check (char_length(author_name) <= 80),
  constraint community_wall_posts_company_len check (company is null or char_length(company) <= 120)
);

create index if not exists community_wall_posts_created_at_idx
  on public.community_wall_posts (created_at desc);

alter table public.community_wall_posts enable row level security;

drop policy if exists "Public read published community posts" on public.community_wall_posts;
create policy "Public read published community posts"
  on public.community_wall_posts for select
  to anon, authenticated
  using (status = 'published');

drop policy if exists "Public insert community posts" on public.community_wall_posts;
create policy "Public insert community posts"
  on public.community_wall_posts for insert
  to anon, authenticated
  with check (
    status = 'published'
    and kind in ('bericht', 'idee', 'tip')
  );

insert into public.community_wall_posts (kind, author_name, company, body, created_at)
select * from (values
  ('bericht'::text, 'Tom V.'::text, 'VD Renovaties'::text, 'Eindelijk één plek voor offertes én opvolging. Goed bezig met die inbox — scheelt ons uren per week.'::text, '2026-07-05T10:20:00+00'::timestamptz),
  ('idee'::text, 'Sarah D.'::text, 'Elektro SD'::text, 'Zou handig zijn om foto''s van de werf direct aan een offerte te koppelen vanuit de app.'::text, '2026-07-06T14:05:00+00'::timestamptz),
  ('tip'::text, 'Marc L.'::text, null::text, 'Tip: zet je standaard offerteteksten in sjablonen. Dan hoef je alleen nog posten en m² aan te passen.'::text, '2026-07-07T09:15:00+00'::timestamptz),
  ('bericht'::text, 'Anouk B.'::text, 'Bouw & Co'::text, 'Nova die me herinnert welke offerte ik moet bellen — dat is precies wat we nodig hadden. Chapeau.'::text, '2026-07-08T16:40:00+00'::timestamptz)
) as seed(kind, author_name, company, body, created_at)
where not exists (select 1 from public.community_wall_posts limit 1);

