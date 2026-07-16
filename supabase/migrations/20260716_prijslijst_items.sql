-- Prijslijst-items per bedrijf (voor offertelijnen).
create table if not exists public.prijslijst_items (
  id bigserial primary key,
  company_id bigint not null references public.bedrijven(id) on delete cascade,
  omschrijving text not null,
  eenheid text not null default 'stuks',
  prijs numeric(12,2) not null default 0,
  btw_percentage numeric(5,2) not null default 21,
  categorie text null,
  is_active boolean not null default true,
  created_by uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint prijslijst_items_omschrijving_len check (char_length(trim(omschrijving)) >= 1),
  constraint prijslijst_items_prijs_nonneg check (prijs >= 0),
  constraint prijslijst_items_btw_range check (btw_percentage >= 0 and btw_percentage <= 100)
);

create index if not exists idx_prijslijst_items_company
  on public.prijslijst_items (company_id, is_active, omschrijving);

alter table public.prijslijst_items enable row level security;

drop policy if exists prijslijst_items_company_access on public.prijslijst_items;
create policy prijslijst_items_company_access
  on public.prijslijst_items for all
  to authenticated
  using (public.is_member_of_company(company_id))
  with check (public.is_member_of_company(company_id));
