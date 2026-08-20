-- RECOVERED PRODUCTION MIGRATION HISTORY
-- Read-only archive; do not apply directly or add to the active migration chain.
-- Production version: 20260718223900
-- Production name: get_platform_registration_count
-- Platform-wide aantal geregistreerde gebruikers (alleen aggregate).
-- Gebruikt voor topbar-teller en Bouwnetwerk unlock (100 gebruikers).

create or replace function public.get_platform_registration_count()
returns integer
language sql
stable
security definer
set search_path to 'public', 'pg_temp'
as $$
  select count(*)::integer from public.profiles;
$$;

revoke all on function public.get_platform_registration_count() from public;
grant execute on function public.get_platform_registration_count() to authenticated;
grant execute on function public.get_platform_registration_count() to service_role;

comment on function public.get_platform_registration_count() is
  'Aantal geregistreerde ArchonPro-gebruikers (aggregate). Voor topbar en Bouwnetwerk unlock.';

