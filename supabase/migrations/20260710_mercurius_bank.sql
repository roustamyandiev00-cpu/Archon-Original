-- Mercurius (B2G) + bankafstemming

alter table public.customers
  add column if not exists is_overheid boolean not null default false,
  add column if not exists mercurius_entiteit_id text;

comment on column public.customers.is_overheid is
  'Klant is Belgische overheid — facturatie via Mercurius/Peppol B2G.';
comment on column public.customers.mercurius_entiteit_id is
  'Optionele Mercurius-entiteit of overheids-Peppol-ID.';

alter table public.facturen
  add column if not exists mercurius_status text,
  add column if not exists mercurius_sent_at timestamptz,
  add column if not exists mercurius_last_error text;

create table if not exists public.bank_rekeningen (
  id bigint generated always as identity primary key,
  bedrijf_id bigint not null references public.bedrijven(id) on delete cascade,
  iban text not null,
  bank_naam text,
  alias text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (bedrijf_id, iban)
);

create table if not exists public.bank_transacties (
  id bigint generated always as identity primary key,
  bedrijf_id bigint not null references public.bedrijven(id) on delete cascade,
  rekening_id bigint references public.bank_rekeningen(id) on delete set null,
  transactie_datum date not null,
  bedrag numeric not null,
  valuta text not null default 'EUR',
  tegenpartij text,
  omschrijving text,
  gestructureerde_mededeling text,
  extern_referentie text,
  match_status text not null default 'open',
  factuur_id bigint references public.facturen(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (bedrijf_id, extern_referentie)
);

create index if not exists bank_transacties_bedrijf_idx
  on public.bank_transacties (bedrijf_id, transactie_datum desc);

create index if not exists bank_transacties_match_idx
  on public.bank_transacties (bedrijf_id, match_status);

alter table public.bank_rekeningen enable row level security;
alter table public.bank_transacties enable row level security;

drop policy if exists bank_rekeningen_all on public.bank_rekeningen;
create policy bank_rekeningen_all on public.bank_rekeningen for all
  to authenticated
  using (public.is_member_of_company(bedrijf_id))
  with check (public.is_member_of_company(bedrijf_id));

drop policy if exists bank_transacties_all on public.bank_transacties;
create policy bank_transacties_all on public.bank_transacties for all
  to authenticated
  using (public.is_member_of_company(bedrijf_id))
  with check (public.is_member_of_company(bedrijf_id));
