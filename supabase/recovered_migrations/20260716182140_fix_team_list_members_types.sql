-- RECOVERED PRODUCTION MIGRATION HISTORY
-- Read-only archive; do not apply directly or add to the active migration chain.
-- Production version: 20260716182140
-- Production name: fix_team_list_members_types
create or replace function public.team_list_members(p_company_id bigint)
returns table (
  membership_id bigint,
  user_id uuid,
  email text,
  full_name text,
  avatar_url text,
  role text,
  is_active boolean,
  invited_at timestamptz,
  joined_at timestamptz,
  activated_at timestamptz
)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
begin
  if not public.is_member_of_company(p_company_id) then
    raise exception 'Geen toegang tot dit bedrijf';
  end if;

  return query
  select
    cm.id::bigint as membership_id,
    cm.user_id,
    coalesce(p.email, u.email)::text as email,
    p.full_name::text as full_name,
    p.avatar_url::text as avatar_url,
    cm.role::text as role,
    coalesce(cm.is_active, false) as is_active,
    cm.invited_at,
    cm.joined_at,
    cm.activated_at
  from public.company_memberships cm
  left join public.profiles p on p.id = cm.user_id
  left join auth.users u on u.id = cm.user_id
  where cm.company_id = p_company_id
  order by coalesce(cm.is_active, false) desc, cm.joined_at asc nulls last, cm.id asc;
end;
$$;

