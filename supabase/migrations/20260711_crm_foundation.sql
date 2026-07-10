-- CRM: koppel deals aan customers, tenant-validatie, RLS-aanvullingen,
-- pipeline-indexen en deals-resource in api_v1_fetch.

-- ---------------------------------------------------------------------------
-- 1. Deals ↔ customers (primair CRM-model; contacten is legacy)
-- ---------------------------------------------------------------------------

alter table public.deals
  add column if not exists customer_id bigint references public.customers(id) on delete set null;

create index if not exists idx_deals_customer_id on public.deals (customer_id);
create index if not exists idx_deals_bedrijf_stadium on public.deals (bedrijf_id, stadium);
create index if not exists idx_deals_bedrijf_deadline on public.deals (bedrijf_id, deadline);

create or replace function public.deals_enforce_customer_tenant()
returns trigger
language plpgsql
set search_path to 'public', 'pg_temp'
as $$
begin
  if new.customer_id is not null and not exists (
    select 1
    from public.customers c
    where c.id = new.customer_id
      and c.company_id = new.bedrijf_id
  ) then
    raise exception 'customer_id hoort niet bij dit bedrijf';
  end if;

  return new;
end;
$$;

drop trigger if exists deals_enforce_customer_tenant on public.deals;
create trigger deals_enforce_customer_tenant
  before insert or update of customer_id, bedrijf_id on public.deals
  for each row
  execute function public.deals_enforce_customer_tenant();

-- ---------------------------------------------------------------------------
-- 2. Klanten-validatie (consistent met deals/contacten)
-- ---------------------------------------------------------------------------

alter table public.customers
  drop constraint if exists customers_email_format,
  add constraint customers_email_format check (
    email is null or email ~* '^[^@]+@[^@]+\.[^@]+$'
  );

alter table public.deals
  drop constraint if exists deals_waarde_nonneg,
  add constraint deals_waarde_nonneg check (waarde is null or waarde >= 0);

-- ---------------------------------------------------------------------------
-- 3. contacten: ontbrekende update/delete policies (tenant-scoped)
-- ---------------------------------------------------------------------------

drop policy if exists "Allow authenticated update on contacten" on public.contacten;
create policy "Allow authenticated update on contacten"
  on public.contacten for update
  to authenticated
  using (
    exists (
      select 1
      from public.company_memberships cm
      where cm.company_id = contacten.bedrijf_id
        and cm.user_id = public.auth_user_id()
        and cm.is_active = true
    )
  )
  with check (
    exists (
      select 1
      from public.company_memberships cm
      where cm.company_id = contacten.bedrijf_id
        and cm.user_id = public.auth_user_id()
        and cm.is_active = true
    )
  );

drop policy if exists "Allow authenticated delete on contacten" on public.contacten;
create policy "Allow authenticated delete on contacten"
  on public.contacten for delete
  to authenticated
  using (
    exists (
      select 1
      from public.company_memberships cm
      where cm.company_id = contacten.bedrijf_id
        and cm.user_id = public.auth_user_id()
        and cm.is_active = true
    )
  );

-- ---------------------------------------------------------------------------
-- 4. afspraken: delete policy (insert/select/update bestonden al)
-- ---------------------------------------------------------------------------

drop policy if exists "Allow authenticated delete on afspraken" on public.afspraken;
create policy "Allow authenticated delete on afspraken"
  on public.afspraken for delete
  to authenticated
  using (
    exists (
      select 1
      from public.company_memberships cm
      where cm.company_id = afspraken.bedrijf_id
        and cm.user_id = public.auth_user_id()
        and cm.is_active = true
    )
  );

-- ---------------------------------------------------------------------------
-- 5. api_v1_fetch: deals-resource voor externe CRM-koppelingen
-- ---------------------------------------------------------------------------

create or replace function public.api_v1_fetch(
  p_hash text,
  p_resource text,
  p_limit integer default 50,
  p_offset integer default 0
)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
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
      select id, name, first_name, last_name, email, phone, company_name, address, postcode, city, country, kvk, btw, is_active, created_at
      from public.customers where company_id = v_company
      order by created_at desc nulls last limit v_limit offset v_offset
    ) t;
    return jsonb_build_object('data', v_data);

  elsif p_resource = 'deals' then
    select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) into v_data from (
      select
        id,
        titel,
        stadium,
        waarde,
        kans,
        deadline,
        customer_id,
        contactpersoon,
        telefoon,
        email,
        notitie,
        laatste_contact_op,
        created_at,
        updated_at
      from public.deals
      where bedrijf_id = v_company
      order by updated_at desc nulls last, created_at desc nulls last
      limit v_limit offset v_offset
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
