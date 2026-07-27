-- RECOVERED PRODUCTION MIGRATION HISTORY
-- Read-only archive; do not apply directly or add to the active migration chain.
-- Production version: 20260512042545
-- Production name: move_vector_extension_to_extensions_schema
create schema if not exists extensions;

grant usage on schema extensions to postgres, anon, authenticated, service_role;

alter extension vector set schema extensions;

