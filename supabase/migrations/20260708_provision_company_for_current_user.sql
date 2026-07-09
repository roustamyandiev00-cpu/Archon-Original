-- Bouwnetwerk: laat een ingelogde gebruiker zonder bedrijf zelf een bedrijf
-- aanmaken (bv. wanneer de registratie geen bedrijfsnaam meestuurde en de
-- handle_new_user-trigger dus geen bedrijf aanmaakte).
--
-- Toegepast op vqiyftyqfpfbpwhadpvn via de Management API op 2026-07-08.
--
-- SECURITY DEFINER: nodig omdat er geen INSERT-policy op public.bedrijven is en
-- de INSERT-policy op company_memberships een bestaande admin vereist
-- (kip-en-ei). De functie werkt alleen voor de aanroepende gebruiker
-- (auth.uid()) en is idempotent: bestaat er al een actief lidmaatschap, dan
-- wordt dat bedrijf teruggegeven zonder een nieuw bedrijf aan te maken.

create or replace function public.provision_company_for_current_user(company_name text)
returns bigint
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  v_uid uuid := auth.uid();
  v_email text;
  v_slug text;
  v_bedrijf_id bigint;
begin
  if v_uid is null then
    raise exception 'Niet ingelogd';
  end if;

  select cm.company_id into v_bedrijf_id
  from public.company_memberships cm
  where cm.user_id = v_uid and cm.is_active = true
  limit 1;
  if v_bedrijf_id is not null then
    return v_bedrijf_id;
  end if;

  company_name := nullif(trim(company_name), '');
  if company_name is null then
    raise exception 'Bedrijfsnaam is verplicht';
  end if;

  select email into v_email from auth.users where id = v_uid;

  v_slug := lower(regexp_replace(company_name, '[^a-zA-Z0-9]+', '-', 'g'));
  v_slug := trim(both '-' from v_slug);
  if v_slug = '' then v_slug := 'bedrijf'; end if;
  v_slug := v_slug || '-' || substr(replace(v_uid::text, '-', ''), 1, 8);

  insert into public.bedrijven (naam, email, owner_user_id, user_id, slug)
  values (company_name, v_email, v_uid, v_uid, v_slug)
  returning id into v_bedrijf_id;

  insert into public.company_memberships (user_id, company_id, role, is_active)
  values (v_uid, v_bedrijf_id, 'admin', true);

  return v_bedrijf_id;
end;
$function$;

revoke all on function public.provision_company_for_current_user(text) from public, anon;
grant execute on function public.provision_company_for_current_user(text) to authenticated;
