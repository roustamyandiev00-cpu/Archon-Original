-- RECOVERED PRODUCTION MIGRATION HISTORY
-- Read-only archive; do not apply directly or add to the active migration chain.
-- Production version: 20260710220857
-- Production name: revoke_provision_defaults_rpc
revoke all on function public.provision_company_defaults() from public, anon, authenticated;

