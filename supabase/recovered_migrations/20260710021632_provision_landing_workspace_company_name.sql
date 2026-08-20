-- RECOVERED PRODUCTION MIGRATION HISTORY
-- Read-only archive; do not apply directly or add to the active migration chain.
-- Production version: 20260710021632
-- Production name: provision_landing_workspace_company_name
-- Werkruimte aanmaken voor ingelogde gebruikers zonder bedrijf (OAuth, oude accounts).
-- Idempotent: bestaand actief lidmaatschap wordt teruggegeven.

create or replace function public.provision_landing_workspace(
  p_company_name text default null,
  p_user_name text default null
)
returns bigint
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  v_user_id uuid := auth.uid();
  v_company_id bigint;
  v_company_name text;
  v_user_name text;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select cm.company_id into v_company_id
  from public.company_memberships cm
  where cm.user_id = v_user_id
    and cm.is_active is true
  order by cm.joined_at asc nulls last, cm.id asc
  limit 1;

  if v_company_id is not null then
    return v_company_id;
  end if;

  v_company_name := nullif(trim(p_company_name), '');
  v_user_name := nullif(trim(p_user_name), '');

  if v_company_name is null then
    select coalesce(
      u.raw_user_meta_data->>'company_name',
      u.raw_user_meta_data->>'company',
      split_part(u.email, '@', 1),
      'Mijn bedrijf'
    )
    into v_company_name
    from auth.users u
    where u.id = v_user_id;
  end if;

  if v_user_name is null then
    select coalesce(
      u.raw_user_meta_data->>'full_name',
      u.raw_user_meta_data->>'name',
      split_part(u.email, '@', 1),
      'Gebruiker'
    )
    into v_user_name
    from auth.users u
    where u.id = v_user_id;
  end if;

  insert into public.bedrijven (naam, user_id, owner_user_id, is_active)
  values (v_company_name, v_user_id, v_user_id, true)
  returning id into v_company_id;

  insert into public.company_memberships (
    user_id, company_id, role, is_active, joined_at, activated_at
  )
  values (v_user_id, v_company_id, 'owner', true, now(), now());

  update public.profiles
  set
    full_name = coalesce(nullif(full_name, ''), v_user_name),
    updated_at = now()
  where id = v_user_id;

  return v_company_id;
end;
$function$;

revoke all on function public.provision_landing_workspace(text, text) from public, anon;
grant execute on function public.provision_landing_workspace(text, text) to authenticated;

