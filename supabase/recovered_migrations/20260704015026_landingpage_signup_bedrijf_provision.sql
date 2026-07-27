-- RECOVERED PRODUCTION MIGRATION HISTORY
-- Read-only archive; do not apply directly or add to the active migration chain.
-- Production version: 20260704015026
-- Production name: landingpage_signup_bedrijf_provision
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $$
declare
  v_company_name text;
  v_bedrijf_id bigint;
  v_slug text;
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
    updated_at = now();

  v_company_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'company'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'company_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'bedrijfsnaam'), '')
  );

  if v_company_name is not null and not exists (
    select 1
    from public.company_memberships cm
    where cm.user_id = new.id
      and cm.is_active = true
  ) then
    v_slug := lower(regexp_replace(v_company_name, '[^a-zA-Z0-9]+', '-', 'g'));
    v_slug := trim(both '-' from v_slug);
    if v_slug = '' then
      v_slug := 'bedrijf';
    end if;
    v_slug := v_slug || '-' || substr(replace(new.id::text, '-', ''), 1, 8);

    insert into public.bedrijven (naam, email, owner_user_id, user_id, slug)
    values (v_company_name, new.email, new.id, new.id, v_slug)
    returning id into v_bedrijf_id;

    insert into public.company_memberships (user_id, company_id, role, is_active)
    values (new.id, v_bedrijf_id, 'admin', true);
  end if;

  return new;
end;
$$;

