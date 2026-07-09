-- Peppol / e-facturatie (België BIS Billing 3.0) — verplichte velden & auditlog.
-- Toegepast op productie via Supabase migratie.

-- ── Bedrijf: Peppol-deelnemer ───────────────────────────────────────────────
alter table public.bedrijven
  add column if not exists peppol_participant_id text;

comment on column public.bedrijven.peppol_participant_id is
  'Peppol EndpointID leverancier, bv. 0208:0123456789 (KBO) of 9925:BE0123456789 (BTW).';

-- ── Klanten: adres + Peppol-identificatie koper ─────────────────────────────
alter table public.customers
  add column if not exists postcode text,
  add column if not exists city text,
  add column if not exists country text default 'BE',
  add column if not exists ondernemingsnummer text,
  add column if not exists peppol_participant_id text;

-- ── Facturen: Peppol-status + verplichte Belgische velden ───────────────────
alter table public.facturen
  add column if not exists buyer_reference text,
  add column if not exists structured_communication text,
  add column if not exists peppol_status text not null default 'niet_verzonden',
  add column if not exists peppol_sent_at timestamptz,
  add column if not exists peppol_message_id text,
  add column if not exists peppol_last_error text;

comment on column public.facturen.buyer_reference is
  'BT-10 Buyer reference — verplicht in België (orderref / PO / interne ref koper).';
comment on column public.facturen.structured_communication is
  'Belgische gestructureerde mededeling (+++xxx/xxxx/xxxxx+++).';
comment on column public.facturen.peppol_status is
  'niet_verzonden | klaar | verzonden | afgekeurd | fout';

create index if not exists facturen_peppol_status_idx
  on public.facturen (bedrijf_id, peppol_status);

-- ── Auditlog verzendingen ───────────────────────────────────────────────────
create table if not exists public.peppol_transmissions (
  id bigint generated always as identity primary key,
  bedrijf_id bigint not null references public.bedrijven(id) on delete cascade,
  factuur_id bigint not null references public.facturen(id) on delete cascade,
  direction text not null default 'outbound',
  status text not null,
  access_point text,
  message_id text,
  error_message text,
  ubl_hash text,
  created_at timestamptz not null default now()
);

create index if not exists peppol_transmissions_factuur_idx
  on public.peppol_transmissions (factuur_id, created_at desc);

alter table public.peppol_transmissions enable row level security;

drop policy if exists peppol_transmissions_select on public.peppol_transmissions;
create policy peppol_transmissions_select on public.peppol_transmissions for select
  to authenticated
  using (
    bedrijf_id in (
      select company_id from public.company_memberships where user_id = auth.uid()
    )
  );

drop policy if exists peppol_transmissions_insert on public.peppol_transmissions;
create policy peppol_transmissions_insert on public.peppol_transmissions for insert
  to authenticated
  with check (
    bedrijf_id in (
      select company_id from public.company_memberships where user_id = auth.uid()
    )
  );

-- Sync company_legal_entities vanuit bedrijfsgegevens (indien nog leeg).
insert into public.company_legal_entities (
  bedrijf_id,
  legal_name,
  enterprise_number,
  vat_number,
  iban,
  street,
  postal_code,
  city,
  country_code
)
select
  b.id,
  b.naam,
  coalesce(nullif(trim(b.kvk), ''), 'ONBEKEND'),
  coalesce(nullif(trim(b.btw), ''), 'ONBEKEND'),
  b.iban,
  b.adres,
  b.postcode,
  b.stad,
  'BE'
from public.bedrijven b
where b.kvk is not null and trim(b.kvk) <> ''
  and b.btw is not null and trim(b.btw) <> ''
  and not exists (
  select 1 from public.company_legal_entities cle where cle.bedrijf_id = b.id
);
