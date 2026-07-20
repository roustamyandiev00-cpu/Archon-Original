-- /admin is uitsluitend toegankelijk voor één ArchonPro-CEO.
-- Andere platformrollen mogen blijven bestaan, maar geven geen admin-toegang.

do $$
declare
  privileged_admin_count bigint;
begin
  select count(*)
  into privileged_admin_count
  from public.platform_admins
  where role in ('ceo', 'super_admin', 'owner', 'admin');

  if privileged_admin_count > 1 then
    raise exception
      'CEO-migratie afgebroken: % bevoorrechte platform-admins gevonden',
      privileged_admin_count
      using errcode = 'check_violation';
  end if;
end;
$$;

alter table public.platform_admins
  drop constraint if exists platform_admins_role_check;

update public.platform_admins
set role = 'ceo'
where role in ('super_admin', 'owner', 'admin');

alter table public.platform_admins
  add constraint platform_admins_role_check
  check (role in ('ceo', 'support_admin')),
  alter column role set default 'support_admin';

create unique index if not exists platform_admins_single_ceo_key
  on public.platform_admins (role)
  where role = 'ceo';

create or replace function app_private.current_user_is_platform_admin(
  p_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path to 'public', 'pg_temp'
as $$
  select
    auth.uid() is not null
    and p_user_id = auth.uid()
    and exists (
      select 1
      from public.platform_admins pa
      where pa.user_id = auth.uid()
        and pa.role = 'ceo'
    );
$$;

revoke all on function app_private.current_user_is_platform_admin(uuid)
  from public, anon;
grant execute on function app_private.current_user_is_platform_admin(uuid)
  to authenticated, service_role;

comment on function public.is_platform_admin(uuid) is
  'Legacy functienaam: geeft alleen true voor de enige actieve ArchonPro-CEO.';
