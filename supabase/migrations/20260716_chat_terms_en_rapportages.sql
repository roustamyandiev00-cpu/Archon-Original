-- Fase 1 (§8.3 + §8.5): chat-terms op memberships + content_rapportages.

alter table public.company_memberships
  add column if not exists chat_terms_accepted_at timestamptz null,
  add column if not exists chat_terms_version text null;

create table if not exists public.content_rapportages (
  id uuid primary key default gen_random_uuid(),
  reporter_user_id uuid not null references auth.users(id) on delete cascade,
  reporter_company_id bigint not null references public.bedrijven(id) on delete cascade,
  target_type text not null
    check (target_type in ('chat_bericht', 'werkpost', 'review')),
  target_id text not null,
  reden text not null,
  status text not null default 'open'
    check (status in ('open', 'behandeld', 'afgewezen')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz null,
  resolved_by uuid null references auth.users(id) on delete set null
);

create index if not exists content_rapportages_status_idx
  on public.content_rapportages (status, created_at desc);

create index if not exists content_rapportages_reporter_idx
  on public.content_rapportages (reporter_company_id);

alter table public.content_rapportages enable row level security;

-- Gebruikers mogen eigen meldingen indienen (als actief lid van het bedrijf).
drop policy if exists "content_rapportages_insert_member" on public.content_rapportages;
create policy "content_rapportages_insert_member"
  on public.content_rapportages for insert
  to authenticated
  with check (
    reporter_user_id = auth.uid()
    and app_private.is_company_member(reporter_company_id)
  );

-- Geen select/update voor gewone users — admin via service role.
drop policy if exists "content_rapportages_select_own" on public.content_rapportages;
create policy "content_rapportages_select_own"
  on public.content_rapportages for select
  to authenticated
  using (reporter_user_id = auth.uid());
