-- RLS policies voor tabellen die RLS aan hadden zonder policies

-- uitnodigingen: alleen service role (legacy tabel, niet gebruikt in app)
drop policy if exists "uitnodigingen_service_role_all" on public.uitnodigingen;
create policy "uitnodigingen_service_role_all"
  on public.uitnodigingen for all
  to service_role
  using (true)
  with check (true);

-- uren_registratie: alleen service role (legacy tabel, niet gebruikt in app)
drop policy if exists "uren_registratie_service_role_all" on public.uren_registratie;
create policy "uren_registratie_service_role_all"
  on public.uren_registratie for all
  to service_role
  using (true)
  with check (true);

-- bedrijven_directory: security invoker i.p.v. definer
drop view if exists public.bedrijven_directory;
create view public.bedrijven_directory
  with (security_invoker = true)
  as
  select id, naam, slug, logo_url
  from public.bedrijven
  where is_active = true;
