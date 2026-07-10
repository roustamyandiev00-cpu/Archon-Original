-- Persoonlijke uitnodigingscodes: initialen + 4 cijfers (bv. JDV4729)

alter table public.profiles
  add column if not exists referral_code text,
  add column if not exists referred_by text,
  add column if not exists referral_pending_discount boolean not null default false;

create unique index if not exists profiles_referral_code_unique
  on public.profiles (referral_code)
  where referral_code is not null;

create index if not exists profiles_referred_by_idx
  on public.profiles (referred_by)
  where referred_by is not null;

create or replace function public.generate_referral_code(p_full_name text)
returns text
language plpgsql
set search_path to 'public', 'pg_temp'
as $function$
declare
  v_parts text[];
  v_initials text := '';
  v_part text;
  v_code text;
  v_attempt int := 0;
begin
  v_parts := regexp_split_to_array(trim(coalesce(p_full_name, '')), '\s+');

  if array_length(v_parts, 1) >= 2 then
    foreach v_part in array v_parts loop
      if v_part <> '' then
        v_initials := v_initials || upper(substr(v_part, 1, 1));
        exit when length(v_initials) >= 3;
      end if;
    end loop;
  elsif array_length(v_parts, 1) = 1 and v_parts[1] <> '' then
    v_initials := upper(substr(v_parts[1], 1, 2));
  end if;

  if v_initials = '' then
    v_initials := 'AP';
  end if;

  loop
    v_code := v_initials || lpad((floor(random() * 10000))::text, 4, '0');
    if not exists (select 1 from public.profiles where referral_code = v_code) then
      return v_code;
    end if;
    v_attempt := v_attempt + 1;
    exit when v_attempt > 25;
  end loop;

  return v_initials || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 4));
end;
$function$;

create or replace function public.ensure_user_referral(
  p_user_id uuid,
  p_full_name text default null,
  p_referred_by text default null
)
returns text
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  v_uid uuid := coalesce(p_user_id, auth.uid());
  v_email text;
  v_name text;
  v_code text;
  v_clean_ref text;
  v_meta jsonb;
begin
  if v_uid is null then
    raise exception 'Niet ingelogd';
  end if;

  select referral_code into v_code
  from public.profiles
  where id = v_uid;

  if v_code is not null then
    return v_code;
  end if;

  select
    u.email,
    coalesce(
      nullif(trim(p_full_name), ''),
      nullif(trim(u.raw_user_meta_data->>'full_name'), ''),
      nullif(trim(split_part(u.email, '@', 1)), '')
    ),
    u.raw_user_meta_data
  into v_email, v_name, v_meta
  from auth.users u
  where u.id = v_uid;

  v_code := public.generate_referral_code(v_name);

  v_clean_ref := upper(trim(coalesce(
    nullif(p_referred_by, ''),
    nullif(trim(v_meta->>'referred_by'), '')
  )));

  if v_clean_ref <> '' and v_clean_ref = v_code then
    v_clean_ref := '';
  end if;

  if v_clean_ref <> '' then
    if not exists (
      select 1 from public.profiles p where p.referral_code = v_clean_ref
    ) then
      v_clean_ref := '';
    end if;
  end if;

  insert into public.profiles (
    id,
    email,
    full_name,
    referral_code,
    referred_by,
    referral_pending_discount
  )
  values (
    v_uid,
    coalesce(v_email, ''),
    nullif(v_name, ''),
    v_code,
    nullif(v_clean_ref, ''),
    v_clean_ref <> ''
  )
  on conflict (id) do update set
    email = coalesce(excluded.email, public.profiles.email),
    full_name = coalesce(public.profiles.full_name, excluded.full_name),
    referral_code = coalesce(public.profiles.referral_code, excluded.referral_code),
    referred_by = coalesce(public.profiles.referred_by, excluded.referred_by),
    referral_pending_discount = case
      when public.profiles.referred_by is not null then public.profiles.referral_pending_discount
      when excluded.referred_by is not null then true
      else public.profiles.referral_pending_discount
    end,
    updated_at = now()
  returning referral_code into v_code;

  return v_code;
end;
$function$;

revoke all on function public.ensure_user_referral(uuid, text, text) from public, anon;
grant execute on function public.ensure_user_referral(uuid, text, text) to authenticated, service_role;
