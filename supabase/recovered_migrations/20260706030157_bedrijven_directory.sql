-- RECOVERED PRODUCTION MIGRATION HISTORY
-- Read-only archive; do not apply directly or add to the active migration chain.
-- Production version: 20260706030157
-- Production name: bedrijven_directory
create or replace view public.bedrijven_directory as
select id, naam, slug, logo_url
from public.bedrijven
where is_active = true;

revoke all on public.bedrijven_directory from anon;
grant select on public.bedrijven_directory to authenticated;

drop policy if exists "Allow reading company names for werkposts" on public.bedrijven;

