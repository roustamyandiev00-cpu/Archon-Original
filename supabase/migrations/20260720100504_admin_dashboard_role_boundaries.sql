-- Reproduceerbare scheiding tussen platform-admins en tenantgebruikers.
-- Deze migratie is idempotent en bevat geen destructieve datawijzigingen.

create schema if not exists app_private;
revoke all on schema app_private from public;
grant usage on schema app_private to authenticated, service_role;

-- Platform-admins zijn alleen benaderbaar via een gecontroleerde RPC.
create table if not exists public.platform_admins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'admin',
  created_at timestamptz not null default now()
);

create unique index if not exists platform_admins_user_id_key
  on public.platform_admins (user_id);

alter table public.platform_admins enable row level security;
revoke all on public.platform_admins from public, anon, authenticated;
grant all on public.platform_admins to service_role;

drop policy if exists platform_admins_service_role_all on public.platform_admins;
create policy platform_admins_service_role_all
  on public.platform_admins for all
  to service_role
  using (true)
  with check (true);

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
        and pa.role in ('owner', 'admin')
    );
$$;

revoke all on function app_private.current_user_is_platform_admin(uuid)
  from public, anon;
grant execute on function app_private.current_user_is_platform_admin(uuid)
  to authenticated, service_role;

create or replace function public.is_platform_admin(
  p_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security invoker
set search_path to 'public', 'app_private', 'pg_temp'
as $$
  select app_private.current_user_is_platform_admin(p_user_id);
$$;

revoke all on function public.is_platform_admin(uuid) from public, anon;
grant execute on function public.is_platform_admin(uuid)
  to authenticated, service_role;

-- Eén bron van waarheid voor actieve tenantrollen.
create or replace function app_private.current_user_membership_role(
  p_company_id bigint
)
returns text
language sql
stable
security definer
set search_path to 'public', 'pg_temp'
as $$
  select cm.role
  from public.company_memberships cm
  where cm.company_id = p_company_id
    and cm.user_id = auth.uid()
    and cm.is_active is true
  order by cm.joined_at asc nulls last, cm.id asc
  limit 1;
$$;

revoke all on function app_private.current_user_membership_role(bigint)
  from public, anon;
grant execute on function app_private.current_user_membership_role(bigint)
  to authenticated, service_role;

create or replace function app_private.is_company_member(p_company_id bigint)
returns boolean
language sql
stable
security definer
set search_path to 'public', 'app_private', 'pg_temp'
as $$
  select app_private.current_user_membership_role(p_company_id) is not null;
$$;

revoke all on function app_private.is_company_member(bigint) from public, anon;
grant execute on function app_private.is_company_member(bigint)
  to authenticated, service_role;

create or replace function public.is_member_of_company(p_company_id bigint)
returns boolean
language sql
stable
security invoker
set search_path to 'public', 'app_private', 'pg_temp'
as $$
  select app_private.is_company_member(p_company_id);
$$;

create or replace function public.get_user_role_in_company(p_company_id bigint)
returns text
language sql
stable
security invoker
set search_path to 'public', 'app_private', 'pg_temp'
as $$
  select app_private.current_user_membership_role(p_company_id);
$$;

create or replace function public.is_company_admin(p_company_id bigint)
returns boolean
language sql
stable
security invoker
set search_path to 'public', 'app_private', 'pg_temp'
as $$
  select coalesce(
    app_private.current_user_membership_role(p_company_id) in ('owner', 'admin'),
    false
  );
$$;

revoke all on function public.is_member_of_company(bigint) from public, anon;
revoke all on function public.get_user_role_in_company(bigint) from public, anon;
revoke all on function public.is_company_admin(bigint) from public, anon;
grant execute on function public.is_member_of_company(bigint)
  to authenticated, service_role;
grant execute on function public.get_user_role_in_company(bigint)
  to authenticated, service_role;
grant execute on function public.is_company_admin(bigint)
  to authenticated, service_role;

-- Integratiebeheer is een tenant-adminactie; leden behouden alleen read.
drop policy if exists integraties_insert on public.integraties;
create policy integraties_insert
  on public.integraties for insert
  to authenticated
  with check (public.is_company_admin(bedrijf_id));

drop policy if exists integraties_update on public.integraties;
create policy integraties_update
  on public.integraties for update
  to authenticated
  using (public.is_company_admin(bedrijf_id))
  with check (public.is_company_admin(bedrijf_id));

drop policy if exists integraties_delete on public.integraties;
create policy integraties_delete
  on public.integraties for delete
  to authenticated
  using (public.is_company_admin(bedrijf_id));

comment on table public.platform_admins is
  'Interne ArchonPro-platformbeheerders; uitsluitend server-side beheren.';
comment on function public.is_platform_admin(uuid) is
  'Controleert uitsluitend of de huidige ingelogde gebruiker platform-admin is.';
