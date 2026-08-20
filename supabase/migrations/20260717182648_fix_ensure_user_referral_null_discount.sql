-- Fix: v_clean_ref <> '' is NULL when v_clean_ref is NULL (SQL three-valued logic),
-- which wrote NULL into profiles.referral_pending_discount (NOT NULL).

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
  v_has_ref boolean;
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

  v_clean_ref := coalesce(
    nullif(
      upper(trim(coalesce(
        nullif(p_referred_by, ''),
        nullif(trim(v_meta->>'referred_by'), '')
      ))),
      ''
    ),
    ''
  );

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

  v_has_ref := v_clean_ref <> '';

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
    v_has_ref
  )
  on conflict (id) do update set
    email = coalesce(excluded.email, public.profiles.email),
    full_name = coalesce(public.profiles.full_name, excluded.full_name),
    referral_code = coalesce(public.profiles.referral_code, excluded.referral_code),
    referred_by = coalesce(public.profiles.referred_by, excluded.referred_by),
    referral_pending_discount = case
      when public.profiles.referred_by is not null
        then coalesce(public.profiles.referral_pending_discount, false)
      when excluded.referred_by is not null then true
      else coalesce(public.profiles.referral_pending_discount, false)
    end,
    updated_at = now()
  returning referral_code into v_code;

  return v_code;
end;
$function$;

revoke all on function public.ensure_user_referral(uuid, text, text) from public, anon;
grant execute on function public.ensure_user_referral(uuid, text, text) to authenticated, service_role;
