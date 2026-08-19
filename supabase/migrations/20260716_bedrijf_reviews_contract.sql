-- Fase 1 (§8.2): reviews koppelen aan afgeronde samenwerking.
-- Nullable tot bestaande rijen zijn opgeschoond; nieuwe reviews eisen signed contract via app.

alter table public.bedrijf_reviews
  add column if not exists samenwerking_contract_id uuid
    references public.samenwerking_contracts(id) on delete set null;

create index if not exists bedrijf_reviews_samenwerking_contract_id_idx
  on public.bedrijf_reviews (samenwerking_contract_id);
