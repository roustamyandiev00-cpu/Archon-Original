-- RECOVERED PRODUCTION MIGRATION HISTORY
-- Read-only archive; do not apply directly or add to the active migration chain.
-- Production version: 20260704013551
-- Production name: landingpage_demo_leads
create table if not exists public.demo_leads (
  id uuid primary key default gen_random_uuid(),
  email text not null check (email ~* '^[^@]+@[^@]+\.[^@]+$'),
  source text not null default 'landingpage',
  created_at timestamptz not null default now()
);

create index if not exists demo_leads_created_at_idx on public.demo_leads (created_at desc);

alter table public.demo_leads enable row level security;

drop policy if exists "Anyone can submit demo lead" on public.demo_leads;
create policy "Anyone can submit demo lead"
  on public.demo_leads for insert
  with check (true);

