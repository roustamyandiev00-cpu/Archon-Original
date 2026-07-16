-- Fase 3: materialen-verificatie/prijzen, geschillen, agent guardrail-velden

-- 1) Directory-uitbreiding
alter table public.bouwmateriaal_winkels
  add column if not exists verificatiestatus text not null default 'niet_geverifieerd',
  add column if not exists laatste_controle_datum timestamptz null,
  add column if not exists openingsuren text null,
  add column if not exists leveringsgebied text null,
  add column if not exists materialen text[] not null default '{}';

alter table public.bouwmateriaal_winkels
  drop constraint if exists bouwmateriaal_winkels_verificatiestatus_check;
alter table public.bouwmateriaal_winkels
  add constraint bouwmateriaal_winkels_verificatiestatus_check
  check (verificatiestatus in ('niet_geverifieerd', 'in_behandeling', 'geverifieerd', 'verlopen'));

alter table public.dak_bedrijven
  add column if not exists verificatiestatus text not null default 'niet_geverifieerd',
  add column if not exists laatste_controle_datum timestamptz null,
  add column if not exists openingsuren text null,
  add column if not exists leveringsgebied text null;

alter table public.dak_bedrijven
  drop constraint if exists dak_bedrijven_verificatiestatus_check;
alter table public.dak_bedrijven
  add constraint dak_bedrijven_verificatiestatus_check
  check (verificatiestatus in ('niet_geverifieerd', 'in_behandeling', 'geverifieerd', 'verlopen'));

-- 2) Prijzen met verplichte brondatum
create table if not exists public.bouwmateriaal_prijzen (
  id uuid primary key default gen_random_uuid(),
  winkel_id bigint not null references public.bouwmateriaal_winkels(id) on delete cascade,
  productnaam text not null,
  merk text null,
  specificaties text null,
  eenheid text not null default 'stuks',
  prijs numeric not null check (prijs >= 0),
  hoeveelheid_beschikbaar numeric null,
  leveringskosten numeric null,
  levertijd_dagen integer null,
  bron_url text null,
  gecontroleerd_op timestamptz not null,
  btw_status text not null default 'onbekend'
    check (btw_status in ('incl', 'excl', 'onbekend')),
  created_by_company_id bigint null references public.bedrijven(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists bouwmateriaal_prijzen_winkel_id_idx
  on public.bouwmateriaal_prijzen (winkel_id);
create index if not exists bouwmateriaal_prijzen_product_idx
  on public.bouwmateriaal_prijzen using gin (to_tsvector('simple', coalesce(productnaam,'') || ' ' || coalesce(merk,'')));
create index if not exists bouwmateriaal_prijzen_gecontroleerd_op_idx
  on public.bouwmateriaal_prijzen (gecontroleerd_op);

alter table public.bouwmateriaal_prijzen enable row level security;

drop policy if exists "bouwmateriaal_prijzen_select_public" on public.bouwmateriaal_prijzen;
create policy "bouwmateriaal_prijzen_select_public"
  on public.bouwmateriaal_prijzen for select
  to public
  using (true);

drop policy if exists "bouwmateriaal_prijzen_insert_auth" on public.bouwmateriaal_prijzen;
create policy "bouwmateriaal_prijzen_insert_auth"
  on public.bouwmateriaal_prijzen for insert
  to authenticated
  with check (true);

-- 3) Geschillen
create table if not exists public.geschillen (
  id uuid primary key default gen_random_uuid(),
  melder_company_id bigint not null references public.bedrijven(id) on delete cascade,
  tegenpartij_company_id bigint null references public.bedrijven(id) on delete set null,
  werkpost_id uuid null references public.werkposts(id) on delete set null,
  channel_id uuid null,
  samenwerking_contract_id uuid null references public.samenwerking_contracts(id) on delete set null,
  titel text not null,
  beschrijving text not null,
  status text not null default 'ingediend'
    check (status in (
      'ingediend',
      'samenvatting_klaar',
      'verklaringen',
      'beslist',
      'in_bezwaar',
      'afgesloten'
    )),
  ai_samenvatting text null,
  melder_verklaring text null,
  tegenpartij_verklaring text null,
  beheerder_id uuid null references auth.users(id) on delete set null,
  motivatie text null,
  beslist_op timestamptz null,
  bezwaar_reden text null,
  bezwaar_op timestamptz null,
  agent_action_id bigint null references public.agent_actions(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists geschillen_status_idx on public.geschillen (status, created_at desc);
create index if not exists geschillen_melder_idx on public.geschillen (melder_company_id);

alter table public.geschillen enable row level security;

drop policy if exists "geschillen_select_party" on public.geschillen;
create policy "geschillen_select_party"
  on public.geschillen for select
  to authenticated
  using (
    app_private.is_company_member(melder_company_id)
    or (tegenpartij_company_id is not null and app_private.is_company_member(tegenpartij_company_id))
  );

drop policy if exists "geschillen_insert_member" on public.geschillen;
create policy "geschillen_insert_member"
  on public.geschillen for insert
  to authenticated
  with check (app_private.is_company_member(melder_company_id));

drop policy if exists "geschillen_update_party" on public.geschillen;
create policy "geschillen_update_party"
  on public.geschillen for update
  to authenticated
  using (
    app_private.is_company_member(melder_company_id)
    or (tegenpartij_company_id is not null and app_private.is_company_member(tegenpartij_company_id))
  );

-- 4) Guardrails op matching-settings
alter table public.onderaannemer_agent_settings
  add column if not exists cooldown_minuten integer not null default 60,
  add column if not exists last_auto_send_at timestamptz null,
  add column if not exists auto_send_na_goedkeuring boolean not null default true;
