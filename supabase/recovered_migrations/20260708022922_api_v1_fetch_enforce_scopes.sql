-- RECOVERED PRODUCTION MIGRATION HISTORY
-- Read-only archive; do not apply directly or add to the active migration chain.
-- Production version: 20260708022922
-- Production name: api_v1_fetch_enforce_scopes
-- Scopes = toegestane resource-ids per sleutel (least privilege)
alter table public.company_api_keys
  alter column scopes set default array['me','offertes','facturen','klanten','werkposts']::text[];

-- Bestaande sleutels (met de oude 'read'-placeholder of leeg) krijgen alle resources
update public.company_api_keys
  set scopes = array['me','offertes','facturen','klanten','werkposts']::text[]
  where scopes = array['read']::text[] or scopes = '{}'::text[];

create or replace function public.api_v1_fetch(
  p_hash text,
  p_resource text,
  p_limit int default 50,
  p_offset int default 0
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company bigint;
  v_key_id uuid;
  v_scopes text[];
  v_limit int := least(greatest(coalesce(p_limit, 50), 1), 200);
  v_offset int := greatest(coalesce(p_offset, 0), 0);
  v_data jsonb;
begin
  select id, company_id, scopes into v_key_id, v_company, v_scopes
  from public.company_api_keys
  where key_hash = p_hash and revoked_at is null
  limit 1;

  if v_company is null then
    return jsonb_build_object('error', 'invalid_key');
  end if;

  update public.company_api_keys set last_used_at = now() where id = v_key_id;

  if not (p_resource = any(v_scopes)) then
    return jsonb_build_object('error', 'forbidden');
  end if;

  if p_resource = 'me' then
    select to_jsonb(t) into v_data from (
      select id, naam, email, telefoon, adres, postcode, stad, kvk, btw, iban, plan, created_at
      from public.bedrijven where id = v_company
    ) t;
    return jsonb_build_object('data', coalesce(v_data, 'null'::jsonb));

  elsif p_resource = 'offertes' then
    select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) into v_data from (
      select id, nummer, klant, bedrag, datum, geldig_tot, status, customer_id, created_at
      from public.offertes where bedrijf_id = v_company
      order by created_at desc nulls last limit v_limit offset v_offset
    ) t;
    return jsonb_build_object('data', v_data);

  elsif p_resource = 'facturen' then
    select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) into v_data from (
      select id, nummer, klant, bedrag, btw_bedrag, totaal_bedrag, datum, vervaldatum, status, document_type, customer_id, paid_at, created_at
      from public.facturen where bedrijf_id = v_company
      order by created_at desc nulls last limit v_limit offset v_offset
    ) t;
    return jsonb_build_object('data', v_data);

  elsif p_resource = 'klanten' then
    select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) into v_data from (
      select id, name, first_name, last_name, email, phone, company_name, address, kvk, btw, is_active, created_at
      from public.customers where company_id = v_company
      order by created_at desc nulls last limit v_limit offset v_offset
    ) t;
    return jsonb_build_object('data', v_data);

  elsif p_resource = 'werkposts' then
    select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) into v_data from (
      select id, titel, type, status, urgentie, regio, stad, aantal_personen, startdatum, einddatum, budget_min, budget_max, tarief_per_uur, aantal_reacties, is_actief, created_at
      from public.werkposts where company_id = v_company
      order by created_at desc nulls last limit v_limit offset v_offset
    ) t;
    return jsonb_build_object('data', v_data);

  else
    return jsonb_build_object('error', 'unknown_resource');
  end if;
end;
$$;

revoke all on function public.api_v1_fetch(text, text, int, int) from public;
grant execute on function public.api_v1_fetch(text, text, int, int) to anon, authenticated;

