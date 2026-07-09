-- Integraties: koppelingen tussen een bedrijf en externe software / Peppol.
--
-- Toegepast op vqiyftyqfpfbpwhadpvn via de Management API.
-- Eén rij per (bedrijf, provider). `config` bewaart provider-specifieke
-- instellingen (bv. API-key, Peppol access point + participant-id).

create table if not exists public.integraties (
  id bigint generated always as identity primary key,
  bedrijf_id bigint not null references public.bedrijven(id) on delete cascade,
  provider text not null,
  status text not null default 'disconnected',
  config jsonb not null default '{}'::jsonb,
  connected_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists integraties_bedrijf_provider_key
  on public.integraties (bedrijf_id, provider);

alter table public.integraties enable row level security;

drop policy if exists integraties_select on public.integraties;
create policy integraties_select on public.integraties for select
  to authenticated
  using (
    bedrijf_id in (
      select company_id from public.company_memberships where user_id = auth.uid()
    )
  );

drop policy if exists integraties_insert on public.integraties;
create policy integraties_insert on public.integraties for insert
  to authenticated
  with check (
    bedrijf_id in (
      select company_id from public.company_memberships where user_id = auth.uid()
    )
  );

drop policy if exists integraties_update on public.integraties;
create policy integraties_update on public.integraties for update
  to authenticated
  using (
    bedrijf_id in (
      select company_id from public.company_memberships where user_id = auth.uid()
    )
  )
  with check (
    bedrijf_id in (
      select company_id from public.company_memberships where user_id = auth.uid()
    )
  );

drop policy if exists integraties_delete on public.integraties;
create policy integraties_delete on public.integraties for delete
  to authenticated
  using (
    bedrijf_id in (
      select company_id from public.company_memberships where user_id = auth.uid()
    )
  );
