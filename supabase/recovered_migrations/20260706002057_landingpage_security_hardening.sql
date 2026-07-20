-- RECOVERED PRODUCTION MIGRATION HISTORY
-- Read-only archive; do not apply directly or add to the active migration chain.
-- Production version: 20260706002057
-- Production name: landingpage_security_hardening
-- Security hardening (Supabase advisor)
-- 1. Vast search_path op SMTP-trigger
-- 2. provision_landing_workspace alleen voor ingelogde gebruikers

create or replace function public.set_bedrijf_smtp_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.provision_landing_workspace(text, text) from public;
revoke all on function public.provision_landing_workspace(text, text) from anon;
grant execute on function public.provision_landing_workspace(text, text) to authenticated;
grant execute on function public.provision_landing_workspace(text, text) to service_role;

