-- Forward-only herstel voor omgevingen waar de platform-adminobjecten ontbreken
-- terwijl de historische migraties wel als toegepast geregistreerd staan.
-- Bestaande records blijven behouden; incompatibele gedeeltelijke tabellen falen
-- expliciet in plaats van data te verwijderen of te raden.

create schema if not exists app_private;
revoke all on schema app_private from public, anon;
grant usage on schema app_private to authenticated, service_role;

create table if not exists public.platform_admins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'support_admin',
  created_at timestamptz not null default now()
);

-- Herstel ook voorspelbare gedeeltelijke tabeldefinities zonder rijen te wissen.
alter table public.platform_admins
  add column if not exists id uuid default gen_random_uuid(),
  add column if not exists user_id uuid,
  add column if not exists role text default 'support_admin',
  add column if not exists created_at timestamptz default now();

-- Valideer bestaande data vóór constraints worden aangescherpt. Daardoor meldt
-- een gedeeltelijke of afwijkende tabel een bruikbare fout zonder data te wissen.
do $migration$
declare
  null_column text;
  duplicate_user_count bigint;
  invalid_roles text;
  privileged_admin_count bigint;
begin
  select column_name
  into null_column
  from (
    select 'id' as column_name, 1 as sort_order
    where exists (select 1 from public.platform_admins where id is null)
    union all
    select 'user_id', 2
    where exists (select 1 from public.platform_admins where user_id is null)
    union all
    select 'role', 3
    where exists (select 1 from public.platform_admins where role is null)
    union all
    select 'created_at', 4
    where exists (select 1 from public.platform_admins where created_at is null)
  ) as null_columns
  order by sort_order
  limit 1;

  if null_column is not null then
    raise exception
      'Platform-adminherstel afgebroken: kolom % bevat NULL-waarden',
      null_column
      using errcode = 'not_null_violation';
  end if;

  select count(*)
  into duplicate_user_count
  from (
    select user_id
    from public.platform_admins
    group by user_id
    having count(*) > 1
  ) as duplicate_users;

  if duplicate_user_count > 0 then
    raise exception
      'Platform-adminherstel afgebroken: % dubbele user_id-groep(en) gevonden',
      duplicate_user_count
      using errcode = 'unique_violation';
  end if;

  select string_agg(distinct role, ', ' order by role)
  into invalid_roles
  from public.platform_admins
  where role not in (
    'ceo',
    'support_admin',
    'super_admin',
    'owner',
    'admin'
  );

  if invalid_roles is not null then
    raise exception
      'Platform-adminherstel afgebroken: onbekende rol(len): %',
      invalid_roles
      using errcode = 'check_violation';
  end if;

  select count(*)
  into privileged_admin_count
  from public.platform_admins
  where role in ('ceo', 'super_admin', 'owner', 'admin');

  if privileged_admin_count > 1 then
    raise exception
      'Platform-adminherstel afgebroken: % bevoorrechte records gevonden',
      privileged_admin_count
      using errcode = 'check_violation';
  end if;
end;
$migration$;

alter table public.platform_admins
  alter column id set default gen_random_uuid(),
  alter column id set not null,
  alter column user_id set not null,
  alter column role set default 'support_admin',
  alter column role set not null,
  alter column created_at set default now(),
  alter column created_at set not null;

do $migration$
declare
  id_attnum smallint;
  user_id_attnum smallint;
  auth_user_id_attnum smallint;
  existing_primary_key smallint[];
begin
  select attnum
  into id_attnum
  from pg_catalog.pg_attribute
  where attrelid = 'public.platform_admins'::regclass
    and attname = 'id'
    and not attisdropped;

  select conkey
  into existing_primary_key
  from pg_catalog.pg_constraint
  where conrelid = 'public.platform_admins'::regclass
    and contype = 'p'
  limit 1;

  if existing_primary_key is not null
    and existing_primary_key <> array[id_attnum]::smallint[] then
    raise exception
      'Platform-adminherstel afgebroken: bestaande primary key staat niet exact op id'
      using errcode = 'invalid_table_definition';
  end if;

  if not exists (
    select 1
    from pg_catalog.pg_constraint
    where conrelid = 'public.platform_admins'::regclass
      and contype = 'p'
  ) then
    alter table public.platform_admins
      add constraint platform_admins_pkey primary key (id);
  end if;

  select attnum
  into user_id_attnum
  from pg_catalog.pg_attribute
  where attrelid = 'public.platform_admins'::regclass
    and attname = 'user_id'
    and not attisdropped;

  select attnum
  into auth_user_id_attnum
  from pg_catalog.pg_attribute
  where attrelid = 'auth.users'::regclass
    and attname = 'id'
    and not attisdropped;

  if exists (
    select 1
    from pg_catalog.pg_constraint
    where conrelid = 'public.platform_admins'::regclass
      and contype = 'f'
      and conkey = array[user_id_attnum]::smallint[]
      and confrelid = 'auth.users'::regclass
      and confkey = array[auth_user_id_attnum]::smallint[]
      and confdeltype <> 'c'
  ) then
    raise exception
      'Platform-adminherstel afgebroken: bestaande user_id-FK gebruikt niet ON DELETE CASCADE'
      using errcode = 'invalid_foreign_key';
  end if;

  if not exists (
    select 1
    from pg_catalog.pg_constraint
    where conrelid = 'public.platform_admins'::regclass
      and contype = 'f'
      and conkey = array[user_id_attnum]::smallint[]
      and confrelid = 'auth.users'::regclass
      and confkey = array[auth_user_id_attnum]::smallint[]
      and confdeltype = 'c'
  ) then
    alter table public.platform_admins
      add constraint platform_admins_user_id_fkey
      foreign key (user_id) references auth.users(id) on delete cascade;
  end if;
end;
$migration$;

do $migration$
declare
  user_id_attnum smallint;
begin
  select attnum
  into user_id_attnum
  from pg_catalog.pg_attribute
  where attrelid = 'public.platform_admins'::regclass
    and attname = 'user_id'
    and not attisdropped;

  if not exists (
    select 1
    from pg_catalog.pg_index
    where indrelid = 'public.platform_admins'::regclass
      and indisunique
      and indisvalid
      and indpred is null
      and indnkeyatts = 1
      and indkey[0] = user_id_attnum
  ) then
    create unique index platform_admins_user_id_key
      on public.platform_admins (user_id);
  end if;
end;
$migration$;

-- Behoud de laatst vastgelegde CEO-only semantiek uit 20260720110731.
-- De historische constraint moet vóór legacy-rolnormalisatie weg, anders kan
-- een oude ('super_admin', 'support_admin')-check de omzetting blokkeren.
alter table public.platform_admins
  drop constraint if exists platform_admins_role_check;

update public.platform_admins
set role = 'ceo'
where role in ('super_admin', 'owner', 'admin');

alter table public.platform_admins
  add constraint platform_admins_role_check
  check (role in ('ceo', 'support_admin'));

create unique index if not exists platform_admins_single_ceo_key
  on public.platform_admins (role)
  where role = 'ceo';

alter table public.platform_admins enable row level security;
revoke all on public.platform_admins
  from public, anon, authenticated, service_role;
grant select, insert, update, delete on public.platform_admins to service_role;

drop policy if exists platform_admins_service_role_all
  on public.platform_admins;
create policy platform_admins_service_role_all
  on public.platform_admins
  for all
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
set search_path = ''
as $function$
  select
    auth.uid() is not null
    and p_user_id = auth.uid()
    and exists (
      select 1
      from public.platform_admins as pa
      where pa.user_id = auth.uid()
        and pa.role = 'ceo'
    );
$function$;

revoke all on function app_private.current_user_is_platform_admin(uuid)
  from public, anon, authenticated, service_role;
grant execute on function app_private.current_user_is_platform_admin(uuid)
  to authenticated;

create or replace function public.is_platform_admin(
  p_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $function$
  select app_private.current_user_is_platform_admin(p_user_id);
$function$;

revoke all on function public.is_platform_admin(uuid)
  from public, anon, authenticated, service_role;
grant execute on function public.is_platform_admin(uuid)
  to authenticated;

comment on table public.platform_admins is
  'Interne ArchonPro-platformbeheerders; uitsluitend server-side beheren.';
comment on function app_private.current_user_is_platform_admin(uuid) is
  'Interne CEO-controle; vereist dat p_user_id overeenkomt met auth.uid().';
comment on function public.is_platform_admin(uuid) is
  'Legacy functienaam: geeft alleen true voor de enige actieve ArchonPro-CEO.';
