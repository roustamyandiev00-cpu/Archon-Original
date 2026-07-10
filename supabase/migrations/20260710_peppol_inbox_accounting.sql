-- Peppol ontvangst-inbox + boekhoudexport tracking

create table if not exists public.peppol_inbox (
  id bigint generated always as identity primary key,
  bedrijf_id bigint not null references public.bedrijven(id) on delete cascade,
  external_inbox_item_id text not null,
  peppol_file_id text,
  document_type text not null default 'invoice',
  sender_peppol_id text,
  receiver_peppol_id text,
  invoice_number text,
  supplier_name text,
  total_amount numeric,
  currency text not null default 'EUR',
  issue_date date,
  ubl_xml text,
  status text not null default 'ontvangen',
  access_point text not null default 'billit',
  received_at timestamptz not null default now(),
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (bedrijf_id, external_inbox_item_id)
);

create index if not exists peppol_inbox_bedrijf_idx
  on public.peppol_inbox (bedrijf_id, received_at desc);

create index if not exists peppol_inbox_status_idx
  on public.peppol_inbox (bedrijf_id, status);

alter table public.peppol_inbox enable row level security;

drop policy if exists peppol_inbox_select on public.peppol_inbox;
create policy peppol_inbox_select on public.peppol_inbox for select
  to authenticated
  using (public.is_member_of_company(bedrijf_id));

drop policy if exists peppol_inbox_insert on public.peppol_inbox;
create policy peppol_inbox_insert on public.peppol_inbox for insert
  to authenticated
  with check (public.is_member_of_company(bedrijf_id));

drop policy if exists peppol_inbox_update on public.peppol_inbox;
create policy peppol_inbox_update on public.peppol_inbox for update
  to authenticated
  using (public.is_member_of_company(bedrijf_id))
  with check (public.is_member_of_company(bedrijf_id));

drop policy if exists peppol_inbox_delete on public.peppol_inbox;
create policy peppol_inbox_delete on public.peppol_inbox for delete
  to authenticated
  using (public.is_member_of_company(bedrijf_id));

alter table public.facturen
  add column if not exists accounting_export_provider text,
  add column if not exists accounting_export_id text,
  add column if not exists accounting_exported_at timestamptz,
  add column if not exists accounting_export_error text;

comment on table public.peppol_inbox is
  'Inkomende Peppol-documenten (leveranciersfacturen, creditnota''s, IMR/MLR).';
comment on column public.facturen.accounting_export_provider is
  'billit, yuki, exact-online, … na succesvolle export.';
comment on column public.facturen.accounting_export_id is
  'Extern ID bij de boekhoudprovider (bv. Billit OrderID).';
