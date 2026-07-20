-- RECOVERED PRODUCTION MIGRATION HISTORY
-- Read-only archive; do not apply directly or add to the active migration chain.
-- Production version: 20260708021809
-- Production name: company_api_keys_and_api_v1_fetch
-- Tabel voor klant-API-sleutels (alleen de SHA-256 hash wordt bewaard)
create table if not exists public.company_api_keys (
  id uuid primary key default gen_random_uuid(),
  company_id bigint not null references public.bedrijven(id) on delete cascade,
  name text not null default 'API-sleutel',
  key_prefix text not null,
  key_hash text not null unique,
  scopes text[] not null default array['read']::text[],
  last_used_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

create index if not exists company_api_keys_company_id_idx on public.company_api_keys(company_id);
create index if not exists company_api_keys_key_hash_idx on public.company_api_keys(key_hash);

alter table public.company_api_keys enable row level security;

drop policy if exists company_api_keys_select on public.company_api_keys;
create policy company_api_keys_select on public.company_api_keys
  for select using (
    exists (select 1 from public.company_memberships m
            where m.company_id = company_api_keys.company_id
              and m.user_id = auth.uid() and m.is_active)
  );

drop policy if exists company_api_keys_insert on public.company_api_keys;
create policy company_api_keys_insert on public.company_api_keys
  for insert with check (
    exists (select 1 from public.company_memberships m
            where m.company_id = company_api_keys.company_id
              and m.user_id = auth.uid() and m.is_active)
  );

drop policy if exists company_api_keys_update on public.company_api_keys;
create policy company_api_keys_update on public.company_api_keys
  for update using (
    exists (select 1 from public.company_memberships m
            where m.company_id = company_api_keys.company_id
              and m.user_id = auth.uid() and m.is_active)
  );

drop policy if exists company_api_keys_delete on public.company_api_keys;
create policy company_api_keys_delete on public.company_api_keys
  for delete using (
    exists (select 1 from public.company_memberships m
            where m.company_id = company_api_keys.company_id
              and m.user_id = auth.uid() and m.is_active)
  );

-- SECURITY DEFINER: valideert de meegegeven hash, werkt last_used bij en geeft
-- uitsluitend data van het bijbehorende bedrijf terug. Zo is geen service-role
-- key nodig en blijft RLS elders intact.
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
  v_limit int := least(greatest(coalesce(p_limit, 50), 1), 200);
  v_offset int := greatest(coalesce(p_offset, 0), 0);
  v_data jsonb;
begin
  select id, company_id into v_key_id, v_company
  from public.company_api_keys
  where key_hash = p_hash and revoked_at is null
  limit 1;

  if v_company is null then
    return jsonb_build_object('error', 'invalid_key');
  end if;

  update public.company_api_keys set last_used_at = now() where id = v_key_id;

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

