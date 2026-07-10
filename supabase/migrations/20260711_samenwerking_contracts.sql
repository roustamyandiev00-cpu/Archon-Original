-- Samenwerking-contracten: AI-concept + ondertekening door beide partijen.

create table if not exists public.samenwerking_contracts (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references public.bouwnetwerk_channels(id) on delete cascade,
  werkpost_id uuid references public.werkposts(id) on delete set null,
  werkpost_reactie_id uuid references public.werkpost_reacties(id) on delete set null,
  created_by_company_id integer not null references public.bedrijven(id),
  party_a_company_id integer not null references public.bedrijven(id),
  party_b_company_id integer not null references public.bedrijven(id),
  titel text not null,
  draft_html text not null,
  draft_json jsonb not null default '{}'::jsonb,
  status text not null default 'draft'
    check (status in ('draft', 'pending_signatures', 'signed', 'void')),
  party_a_signed_at timestamptz,
  party_b_signed_at timestamptz,
  party_a_signed_by uuid references auth.users(id),
  party_b_signed_by uuid references auth.users(id),
  party_a_signer_name text,
  party_b_signer_name text,
  pdf_storage_path text,
  ai_prompt text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists samenwerking_contracts_active_channel_key
  on public.samenwerking_contracts (channel_id)
  where status <> 'void';

create index if not exists samenwerking_contracts_channel_id_idx
  on public.samenwerking_contracts (channel_id);

alter table public.samenwerking_contracts enable row level security;

drop policy if exists "samenwerking_contracts_select_member" on public.samenwerking_contracts;
create policy "samenwerking_contracts_select_member"
  on public.samenwerking_contracts for select
  to authenticated
  using (app_private.is_bouwnetwerk_channel_member(channel_id));

drop policy if exists "samenwerking_contracts_insert_member" on public.samenwerking_contracts;
create policy "samenwerking_contracts_insert_member"
  on public.samenwerking_contracts for insert
  to authenticated
  with check (
    app_private.is_bouwnetwerk_channel_member(channel_id)
    and app_private.is_company_member(created_by_company_id)
    and (
      created_by_company_id = party_a_company_id
      or created_by_company_id = party_b_company_id
    )
  );

drop policy if exists "samenwerking_contracts_update_member" on public.samenwerking_contracts;
create policy "samenwerking_contracts_update_member"
  on public.samenwerking_contracts for update
  to authenticated
  using (app_private.is_bouwnetwerk_channel_member(channel_id))
  with check (app_private.is_bouwnetwerk_channel_member(channel_id));
