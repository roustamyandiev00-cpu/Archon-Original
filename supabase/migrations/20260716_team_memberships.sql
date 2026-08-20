-- Teambeheer op bestaande company_memberships.
-- Uitnodigen werkt voor accounts die al in Supabase Auth bestaan; e-mailbezorging
-- blijft een aparte SMTP/integratiestap.

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

create or replace function public.team_add_member(
  p_company_id bigint,
  p_email text,
  p_role text default 'member'
)
returns bigint
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_user_id uuid;
  v_membership_id bigint;
  v_email text := lower(trim(p_email));
  v_role text := lower(trim(p_role));
begin
  if not public.is_company_admin(p_company_id) then
    raise exception 'Alleen beheerders kunnen teamleden toevoegen';
  end if;

  if v_email is null or v_email !~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'Vul een geldig e-mailadres in';
  end if;

  if v_role not in ('admin', 'member') then
    raise exception 'Ongeldige rol';
  end if;

  select id into v_user_id
  from auth.users
  where lower(email) = v_email
  limit 1;

  if v_user_id is null then
    raise exception 'Dit e-mailadres heeft nog geen ArchonPro-account';
  end if;

  select id into v_membership_id
  from public.company_memberships
  where company_id = p_company_id
    and user_id = v_user_id
  limit 1;

  if v_membership_id is not null then
    update public.company_memberships
    set
      role = v_role,
      is_active = true,
      activated_at = now(),
      deactivated_at = null,
      deactivated_by = null,
      updated_at = now()
    where id = v_membership_id;
    return v_membership_id;
  end if;

  insert into public.company_memberships (
    company_id,
    user_id,
    role,
    is_active,
    invited_by,
    invited_at,
    joined_at,
    activated_at
  )
  values (
    p_company_id,
    v_user_id,
    v_role,
    true,
    auth.uid(),
    now(),
    now(),
    now()
  )
  returning id into v_membership_id;

  return v_membership_id;
end;
$$;

create or replace function public.team_update_member(
  p_company_id bigint,
  p_membership_id bigint,
  p_role text,
  p_is_active boolean
)
returns void
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_target public.company_memberships%rowtype;
  v_role text := lower(trim(p_role));
  v_active_admins integer;
begin
  if not public.is_company_admin(p_company_id) then
    raise exception 'Alleen beheerders kunnen teamleden beheren';
  end if;

  if v_role not in ('admin', 'member') then
    raise exception 'Ongeldige rol';
  end if;

  select * into v_target
  from public.company_memberships
  where id = p_membership_id
    and company_id = p_company_id
  for update;

  if not found then
    raise exception 'Teamlid niet gevonden';
  end if;

  if v_target.user_id = auth.uid() and (not p_is_active or v_role <> v_target.role) then
    raise exception 'Je kunt je eigen toegang of rol niet wijzigen';
  end if;

  if v_target.is_active
     and v_target.role = 'admin'
     and (not p_is_active or v_role <> 'admin') then
    select count(*) into v_active_admins
    from public.company_memberships
    where company_id = p_company_id
      and is_active = true
      and role = 'admin';

    if v_active_admins <= 1 then
      raise exception 'Een bedrijf moet minstens één actieve beheerder behouden';
    end if;
  end if;

  update public.company_memberships
  set
    role = v_role,
    is_active = p_is_active,
    activated_at = case when p_is_active then coalesce(activated_at, now()) else activated_at end,
    deactivated_at = case when p_is_active then null else now() end,
    deactivated_by = case when p_is_active then null else auth.uid() end,
    updated_at = now()
  where id = p_membership_id
    and company_id = p_company_id;
end;
$$;

revoke all on function public.team_list_members(bigint) from public;
revoke all on function public.team_add_member(bigint, text, text) from public;
revoke all on function public.team_update_member(bigint, bigint, text, boolean) from public;
grant execute on function public.team_list_members(bigint) to authenticated;
grant execute on function public.team_add_member(bigint, text, text) to authenticated;
grant execute on function public.team_update_member(bigint, bigint, text, boolean) to authenticated;
