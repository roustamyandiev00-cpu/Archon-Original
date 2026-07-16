-- Fase 1 (§8.1): verificatiestatus + risicostatus op bedrijven
-- Risicostatus is intern (beheer); verificatie is zichtbaar op bedrijfsprofiel.

alter table public.bedrijven
  add column if not exists verificatiestatus text not null default 'onbevestigd',
  add column if not exists risicostatus text not null default 'normaal';

alter table public.bedrijven
  drop constraint if exists bedrijven_verificatiestatus_check;
alter table public.bedrijven
  add constraint bedrijven_verificatiestatus_check
  check (verificatiestatus in (
    'onbevestigd',
    'in_behandeling',
    'geverifieerd',
    'verlopen'
  ));

alter table public.bedrijven
  drop constraint if exists bedrijven_risicostatus_check;
alter table public.bedrijven
  add constraint bedrijven_risicostatus_check
  check (risicostatus in (
    'normaal',
    'gewaarschuwd',
    'tijdelijk_beperkt',
    'onder_onderzoek',
    'permanent_geblokkeerd'
  ));
