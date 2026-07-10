-- Per-account opslag, tenant-isolatie en provisioning bij nieuwe bedrijven.

-- ---------------------------------------------------------------------------
-- 1. Helper-functies
-- ---------------------------------------------------------------------------

create or replace function public.storage_path_company_id(object_path text)
returns bigint
language sql
immutable
set search_path to 'public', 'pg_temp'
as $$
  select case
    when coalesce((storage.foldername(object_path))[1], '') ~ '^\d+$'
      then ((storage.foldername(object_path))[1])::bigint
    when coalesce((storage.foldername(object_path))[2], '') ~ '^\d+$'
      then ((storage.foldername(object_path))[2])::bigint
    else null
  end;
$$;

create or replace function public.storage_tenant_access(object_path text)
returns boolean
language sql
stable
set search_path to 'public', 'pg_temp'
as $$
  select
    public.is_member_of_company(public.storage_path_company_id(object_path))
    or exists (
      select 1
      from public.samenwerking_contracts sc
      where sc.pdf_storage_path = object_path
        and (
          public.is_member_of_company(sc.party_a_company_id::bigint)
          or public.is_member_of_company(sc.party_b_company_id::bigint)
        )
    );
$$;

create or replace function public.is_company_admin(p_company_id bigint)
returns boolean
language sql
stable
set search_path to 'public', 'pg_temp'
as $$
  select exists (
    select 1
    from public.company_memberships cm
    where cm.company_id = p_company_id
      and cm.user_id = auth.uid()
      and cm.is_active = true
      and cm.role in ('admin', 'owner')
  );
$$;

grant execute on function public.storage_path_company_id(text) to authenticated, service_role;
grant execute on function public.storage_tenant_access(text) to authenticated, service_role;
grant execute on function public.is_company_admin(bigint) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 2. Starter AI-tegoed + provisioning bij nieuw bedrijf
-- ---------------------------------------------------------------------------

update public.plan_ai_token_limits
set tokens_on_signup = 10000,
    monthly_tokens = coalesce(monthly_tokens, 1000)
where plan = 'free';

create or replace function public.provision_company_defaults()
returns trigger
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
begin
  -- E-invoicing defaults
  insert into public.company_einvoicing_settings (
    bedrijf_id, is_enabled, provider_id, environment
  )
  values (new.id, false, 'PEPPOL_ACCESS_POINT', 'sandbox')
  on conflict (bedrijf_id) do nothing;

  -- AI credits (plan-based, idempotent via grant_plan_tokens)
  perform public.grant_plan_tokens(new.id, coalesce(new.plan, 'free'));

  return new;
end;
$function$;

drop trigger if exists on_bedrijf_created on public.bedrijven;
drop trigger if exists trigger_company_created_tokens on public.bedrijven;

create trigger on_bedrijf_created
  after insert on public.bedrijven
  for each row
  execute function public.provision_company_defaults();

-- Eén centrale provisioning-functie voor OAuth / landing accounts
create or replace function public.provision_landing_workspace(
  p_company_name text default null,
  p_user_name text default null
)
returns bigint
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  v_user_id uuid := auth.uid();
  v_company_id bigint;
  v_company_name text;
  v_user_name text;
  v_slug text;
  v_email text;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select cm.company_id into v_company_id
  from public.company_memberships cm
  where cm.user_id = v_user_id
    and cm.is_active is true
  order by cm.joined_at asc nulls last, cm.id asc
  limit 1;

  if v_company_id is not null then
    return v_company_id;
  end if;

  v_company_name := nullif(trim(p_company_name), '');
  v_user_name := nullif(trim(p_user_name), '');

  select u.email into v_email from auth.users u where u.id = v_user_id;

  if v_company_name is null then
    select coalesce(
      u.raw_user_meta_data->>'company_name',
      u.raw_user_meta_data->>'company',
      split_part(u.email, '@', 1),
      'Mijn bedrijf'
    )
    into v_company_name
    from auth.users u
    where u.id = v_user_id;
  end if;

  if v_user_name is null then
    select coalesce(
      u.raw_user_meta_data->>'full_name',
      u.raw_user_meta_data->>'name',
      split_part(u.email, '@', 1),
      'Gebruiker'
    )
    into v_user_name
    from auth.users u
    where u.id = v_user_id;
  end if;

  v_slug := lower(regexp_replace(v_company_name, '[^a-zA-Z0-9]+', '-', 'g'));
  v_slug := trim(both '-' from v_slug);
  if v_slug = '' then v_slug := 'bedrijf'; end if;
  v_slug := v_slug || '-' || substr(replace(v_user_id::text, '-', ''), 1, 8);

  insert into public.bedrijven (naam, email, user_id, owner_user_id, slug, is_active)
  values (v_company_name, v_email, v_user_id, v_user_id, v_slug, true)
  returning id into v_company_id;

  insert into public.company_memberships (
    user_id, company_id, role, is_active, joined_at, activated_at
  )
  values (v_user_id, v_company_id, 'admin', true, now(), now());

  update public.profiles
  set
    full_name = coalesce(nullif(full_name, ''), v_user_name),
    updated_at = now()
  where id = v_user_id;

  return v_company_id;
end;
$function$;

revoke all on function public.provision_landing_workspace(text, text) from public, anon;
grant execute on function public.provision_landing_workspace(text, text) to authenticated;

-- Owner = admin voor bestaande accounts
update public.company_memberships
set role = 'admin'
where role = 'owner';

-- ---------------------------------------------------------------------------
-- 3. RLS: bedrijfsinstellingen ook voor owners/admins
-- ---------------------------------------------------------------------------

drop policy if exists "Internal users update own company" on public.bedrijven;
create policy "Company admins update own company"
  on public.bedrijven for update
  to authenticated
  using (public.is_company_admin(id))
  with check (public.is_company_admin(id));

drop policy if exists "Internal users view own company credits" on public.company_ai_credits;
create policy "Company members view own credits"
  on public.company_ai_credits for select
  to authenticated
  using (public.is_member_of_company(company_id));

drop policy if exists "Internal users view own credit transactions" on public.ai_credit_transactions;
create policy "Company members view own credit transactions"
  on public.ai_credit_transactions for select
  to authenticated
  using (public.is_member_of_company(company_id));

-- ---------------------------------------------------------------------------
-- 4. Storage buckets — private tenant buckets
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit)
values
  ('company-private', 'company-private', false, 52428800)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit;

update storage.buckets
set public = false
where id in ('documents', 'invoices', 'quotations', 'project-files', 'customer-documents', 'portal-downloads');

-- ---------------------------------------------------------------------------
-- 5. Storage RLS — per bedrijf map: {companyId}/… of prefix/{companyId}/…
-- ---------------------------------------------------------------------------

drop policy if exists "CRM members read documents" on storage.objects;
drop policy if exists "CRM members upload documents" on storage.objects;
drop policy if exists "CRM members delete documents" on storage.objects;

drop policy if exists "werkpost_media_upload_members" on storage.objects;
drop policy if exists "werkpost_media_delete_members" on storage.objects;

drop policy if exists "tenant_storage_select" on storage.objects;
drop policy if exists "tenant_storage_insert" on storage.objects;
drop policy if exists "tenant_storage_update" on storage.objects;
drop policy if exists "tenant_storage_delete" on storage.objects;

drop policy if exists "company_private_select" on storage.objects;
drop policy if exists "company_private_insert" on storage.objects;
drop policy if exists "company_private_update" on storage.objects;
drop policy if exists "company_private_delete" on storage.objects;

create policy "tenant_storage_select"
  on storage.objects for select
  to authenticated
  using (
    bucket_id in (
      'documents', 'invoices', 'quotations', 'project-files',
      'customer-documents', 'portal-downloads', 'company-private'
    )
    and public.storage_tenant_access(name)
  );

create policy "tenant_storage_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id in (
      'documents', 'invoices', 'quotations', 'project-files',
      'customer-documents', 'portal-downloads', 'company-private'
    )
    and public.storage_tenant_access(name)
  );

create policy "tenant_storage_update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id in (
      'documents', 'invoices', 'quotations', 'project-files',
      'customer-documents', 'portal-downloads', 'company-private'
    )
    and public.storage_tenant_access(name)
  )
  with check (
    bucket_id in (
      'documents', 'invoices', 'quotations', 'project-files',
      'customer-documents', 'portal-downloads', 'company-private'
    )
    and public.storage_tenant_access(name)
  );

create policy "tenant_storage_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id in (
      'documents', 'invoices', 'quotations', 'project-files',
      'customer-documents', 'portal-downloads', 'company-private'
    )
    and public.storage_tenant_access(name)
  );

-- Werkpost-foto's: upload/delete alleen eigen bedrijfsmap; publiek leesbaar (bucket blijft public)
create policy "werkpost_media_select_public"
  on storage.objects for select
  to public
  using (bucket_id = 'werkpost-media');

create policy "werkpost_media_insert_members"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'werkpost-media'
    and public.storage_tenant_access(name)
  );

create policy "werkpost_media_delete_members"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'werkpost-media'
    and public.storage_tenant_access(name)
  );

-- Bedrijfslogo's (optionele bucket)
drop policy if exists "company_logos_select" on storage.objects;
drop policy if exists "company_logos_insert" on storage.objects;
drop policy if exists "company_logos_delete" on storage.objects;

create policy "company_logos_select"
  on storage.objects for select
  to public
  using (bucket_id = 'company-logos');

create policy "company_logos_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'company-logos'
    and public.storage_tenant_access(name)
  );

create policy "company_logos_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'company-logos'
    and public.storage_tenant_access(name)
  );

-- Directory-buckets: alleen ingelogde gebruikers mogen uploaden (geen anon)
drop policy if exists "bouwmaterialen_media_upload_public" on storage.objects;
drop policy if exists "dakbedrijven_media_upload_public" on storage.objects;

create policy "bouwmaterialen_media_upload_auth"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'bouwmaterialen-media');

create policy "dakbedrijven_media_upload_auth"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'dakbedrijven-media');

-- ---------------------------------------------------------------------------
-- 6. Backfill: ontbrekende AI credits + starter voor free plan
-- ---------------------------------------------------------------------------

insert into public.company_ai_credits (company_id, credits_remaining, credits_used, total_purchased)
select b.id, 10000, 0, 10000
from public.bedrijven b
where not exists (
  select 1 from public.company_ai_credits c where c.company_id = b.id
);

update public.company_ai_credits c
set
  credits_remaining = greatest(c.credits_remaining, 10000),
  total_purchased = greatest(c.total_purchased, 10000),
  updated_at = now()
from public.bedrijven b
where b.id = c.company_id
  and coalesce(b.plan, 'free') = 'free'
  and c.credits_remaining < 10000
  and c.total_purchased <= 100;
