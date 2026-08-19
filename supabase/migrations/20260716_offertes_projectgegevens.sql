-- Structured projectgegevens op offerte (geen tekst-parsing meer nodig)
alter table public.offertes
  add column if not exists project_naam text,
  add column if not exists afmetingen text;

comment on column public.offertes.project_naam is 'Structured project/werf naam uit offerte-wizard';
comment on column public.offertes.afmetingen is 'Structured afmetingen (bv. m²) uit offerte-wizard';
