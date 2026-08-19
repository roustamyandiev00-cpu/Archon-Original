-- Fase 2: sancties, connecties, zichtbaarheid, betrouwbaarheidsscore, agent-settings

-- 1) Sancties (AI mag alleen status 'voorgesteld' schrijven)
create table if not exists public.bedrijf_sancties (
  id uuid primary key default gen_random_uuid(),
  bedrijf_id bigint not null references public.bedrijven(id) on delete cascade,
  type text not null
    check (type in ('waarschuwing', 'schorsing_tijdelijk', 'schorsing_lang', 'blokkade')),
  reden text not null,
  bewijs_agent_run_id uuid null,
  bewijs_agent_action_id bigint null references public.agent_actions(id) on delete set null,
  bevestigd_door uuid null references auth.users(id) on delete set null,
  status text not null default 'voorgesteld'
    check (status in ('voorgesteld', 'bevestigd', 'verworpen', 'in_bezwaar')),
  ingaat_op timestamptz null,
  verloopt_op timestamptz null,
  channel_id uuid null,
  message_id uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists bedrijf_sancties_bedrijf_id_idx
  on public.bedrijf_sancties (bedrijf_id, created_at desc);
create index if not exists bedrijf_sancties_status_idx
  on public.bedrijf_sancties (status);

alter table public.bedrijf_sancties enable row level security;

drop policy if exists "bedrijf_sancties_select_member" on public.bedrijf_sancties;
create policy "bedrijf_sancties_select_member"
  on public.bedrijf_sancties for select
  to authenticated
  using (app_private.is_company_member(bedrijf_id));

-- Inserts/updates via service role / platform-admin (geen member insert van bevestigde sancties)

-- 2) Zakelijke contacten / partners
create table if not exists public.bedrijf_connecties (
  id uuid primary key default gen_random_uuid(),
  bedrijf_id bigint not null references public.bedrijven(id) on delete cascade,
  connectie_bedrijf_id bigint not null references public.bedrijven(id) on delete cascade,
  status text not null default 'favoriet'
    check (status in ('favoriet', 'eerder_samengewerkt', 'vaste_partner')),
  notities text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bedrijf_connecties_no_self check (bedrijf_id <> connectie_bedrijf_id),
  unique (bedrijf_id, connectie_bedrijf_id)
);

create index if not exists bedrijf_connecties_bedrijf_id_idx
  on public.bedrijf_connecties (bedrijf_id);

alter table public.bedrijf_connecties enable row level security;

drop policy if exists "bedrijf_connecties_select_own" on public.bedrijf_connecties;
create policy "bedrijf_connecties_select_own"
  on public.bedrijf_connecties for select
  to authenticated
  using (app_private.is_company_member(bedrijf_id));

drop policy if exists "bedrijf_connecties_insert_own" on public.bedrijf_connecties;
create policy "bedrijf_connecties_insert_own"
  on public.bedrijf_connecties for insert
  to authenticated
  with check (app_private.is_company_member(bedrijf_id));

drop policy if exists "bedrijf_connecties_update_own" on public.bedrijf_connecties;
create policy "bedrijf_connecties_update_own"
  on public.bedrijf_connecties for update
  to authenticated
  using (app_private.is_company_member(bedrijf_id))
  with check (app_private.is_company_member(bedrijf_id));

drop policy if exists "bedrijf_connecties_delete_own" on public.bedrijf_connecties;
create policy "bedrijf_connecties_delete_own"
  on public.bedrijf_connecties for delete
  to authenticated
  using (app_private.is_company_member(bedrijf_id));

-- 3) Werkpost-zichtbaarheid + cached betrouwbaarheidsscore
alter table public.werkposts
  add column if not exists zichtbaarheid text not null default 'publiek';

alter table public.werkposts
  drop constraint if exists werkposts_zichtbaarheid_check;
alter table public.werkposts
  add constraint werkposts_zichtbaarheid_check
  check (zichtbaarheid in ('prive', 'netwerk', 'publiek'));

alter table public.bedrijven
  add column if not exists betrouwbaarheidsscore integer null
    check (betrouwbaarheidsscore is null or (betrouwbaarheidsscore >= 0 and betrouwbaarheidsscore <= 100));

-- 4) Matching-instellingen (Fase 2: voorstellen, geen auto-send)
create table if not exists public.onderaannemer_agent_settings (
  id uuid primary key default gen_random_uuid(),
  company_id bigint not null unique references public.bedrijven(id) on delete cascade,
  enabled boolean not null default false,
  type_werk text[] not null default '{}',
  specialisaties text[] not null default '{}',
  regio text[] not null default '{}',
  max_afstand_km integer null,
  beschikbaar boolean not null default true,
  minimum_uurtarief numeric null,
  max_berichten_per_dag integer not null default 5,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.onderaannemer_agent_settings enable row level security;

drop policy if exists "onderaannemer_agent_settings_own" on public.onderaannemer_agent_settings;
create policy "onderaannemer_agent_settings_own"
  on public.onderaannemer_agent_settings for all
  to authenticated
  using (app_private.is_company_member(company_id))
  with check (app_private.is_company_member(company_id));
