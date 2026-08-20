-- Winkeladressen-directory verbreden van dak & tegels naar alle
-- bouw- en renovatiematerialen.
alter table public.bouwmateriaal_winkels
  drop constraint if exists bouwmateriaal_winkels_categorie_check;

alter table public.bouwmateriaal_winkels
  add constraint bouwmateriaal_winkels_categorie_check
  check (
    categorie in (
      'dak',
      'tegels',
      'hout',
      'isolatie',
      'sanitair',
      'elektro',
      'verf',
      'gereedschap',
      'algemeen'
    )
  );
