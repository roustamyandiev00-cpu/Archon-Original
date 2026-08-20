-- RECOVERED PRODUCTION MIGRATION HISTORY
-- Read-only archive; do not apply directly or add to the active migration chain.
-- Production version: 20260512042432
-- Production name: convert_role_helpers_to_security_invoker
create or replace function public.get_user_role_in_company(p_company_id bigint)
returns character varying
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select cm.role::varchar
  from public.company_memberships cm
  where cm.user_id = auth.uid()
    and cm.company_id = p_company_id
    and cm.is_active = true
  limit 1;
$$;

create or replace function public.is_member_of_company(p_company_id bigint)
returns boolean
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.company_memberships cm
    where cm.user_id = auth.uid()
      and cm.company_id = p_company_id
      and cm.is_active = true
  );
$$;

create or replace function public.is_owner(p_company_id bigint)
returns boolean
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.company_memberships cm
    where cm.user_id = auth.uid()
      and cm.company_id = p_company_id
      and cm.is_active = true
      and cm.role = 'owner'
  );
$$;

create or replace function public.is_owner_or_admin(p_company_id bigint)
returns boolean
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.company_memberships cm
    where cm.user_id = auth.uid()
      and cm.company_id = p_company_id
      and cm.is_active = true
      and cm.role in ('owner', 'admin')
  );
$$;

create or replace function public.is_company_owner_record(p_company_id bigint, p_user_id uuid default auth.uid())
returns boolean
language plpgsql
stable
security invoker
set search_path = public, pg_temp
as $$
begin
  if p_user_id is distinct from auth.uid() then
    return false;
  end if;

  if exists (
    select 1
    from information_schema.columns c
    where c.table_schema = 'public'
      and c.table_name = 'bedrijven'
      and c.column_name = 'owner_user_id'
  ) then
    return exists (
      select 1
      from public.bedrijven b
      where b.id = p_company_id
        and coalesce(b.owner_user_id, b.user_id) = auth.uid()
    );
  end if;

  return exists (
    select 1
    from public.bedrijven b
    where b.id = p_company_id
      and b.user_id = auth.uid()
  );
end;
$$;

