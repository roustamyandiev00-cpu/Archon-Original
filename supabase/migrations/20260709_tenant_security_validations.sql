-- Tenant-isolatie aanscherpen, verplichte velden en datacontroles voor CRM-kern.

-- ---------------------------------------------------------------------------
-- 1. RLS: alleen actieve company-leden (via is_member_of_company)
-- ---------------------------------------------------------------------------

drop policy if exists "offertes_company_access" on public.offertes;
create policy "offertes_company_access"
  on public.offertes for all
  to authenticated
  using (public.is_member_of_company(bedrijf_id))
  with check (public.is_member_of_company(bedrijf_id));

drop policy if exists "facturen_company_access" on public.facturen;
create policy "facturen_company_access"
  on public.facturen for all
  to authenticated
  using (public.is_member_of_company(bedrijf_id))
  with check (public.is_member_of_company(bedrijf_id));

drop policy if exists "offerte_lijnen_company_access" on public.offerte_lijnen;
create policy "offerte_lijnen_company_access"
  on public.offerte_lijnen for all
  to authenticated
  using (public.is_member_of_company(company_id))
  with check (public.is_member_of_company(company_id));

drop policy if exists "factuur_lijnen_company_access" on public.factuur_lijnen;
create policy "factuur_lijnen_company_access"
  on public.factuur_lijnen for all
  to authenticated
  using (public.is_member_of_company(company_id))
  with check (public.is_member_of_company(company_id));

drop policy if exists "offerte_activities_company_access" on public.offerte_activities;
create policy "offerte_activities_company_access"
  on public.offerte_activities for all
  to authenticated
  using (public.is_member_of_company(company_id))
  with check (public.is_member_of_company(company_id));

drop policy if exists integraties_select on public.integraties;
create policy integraties_select on public.integraties for select
  to authenticated
  using (public.is_member_of_company(bedrijf_id));

drop policy if exists integraties_insert on public.integraties;
create policy integraties_insert on public.integraties for insert
  to authenticated
  with check (public.is_member_of_company(bedrijf_id));

drop policy if exists integraties_update on public.integraties;
create policy integraties_update on public.integraties for update
  to authenticated
  using (public.is_member_of_company(bedrijf_id))
  with check (public.is_member_of_company(bedrijf_id));

drop policy if exists integraties_delete on public.integraties;
create policy integraties_delete on public.integraties for delete
  to authenticated
  using (public.is_member_of_company(bedrijf_id));

drop policy if exists agent_tasks_select on public.agent_tasks;
create policy agent_tasks_select on public.agent_tasks for select
  to authenticated
  using (public.is_member_of_company(company_id));

drop policy if exists agent_tasks_insert on public.agent_tasks;
create policy agent_tasks_insert on public.agent_tasks for insert
  to authenticated
  with check (public.is_member_of_company(company_id));

drop policy if exists agent_tasks_update on public.agent_tasks;
create policy agent_tasks_update on public.agent_tasks for update
  to authenticated
  using (public.is_member_of_company(company_id))
  with check (public.is_member_of_company(company_id));

drop policy if exists agent_tasks_delete on public.agent_tasks;
create policy agent_tasks_delete on public.agent_tasks for delete
  to authenticated
  using (public.is_member_of_company(company_id));

drop policy if exists peppol_transmissions_select on public.peppol_transmissions;
create policy peppol_transmissions_select on public.peppol_transmissions for select
  to authenticated
  using (public.is_member_of_company(bedrijf_id));

drop policy if exists peppol_transmissions_insert on public.peppol_transmissions;
create policy peppol_transmissions_insert on public.peppol_transmissions for insert
  to authenticated
  with check (public.is_member_of_company(bedrijf_id));

drop policy if exists peppol_transmissions_update on public.peppol_transmissions;
create policy peppol_transmissions_update on public.peppol_transmissions for update
  to authenticated
  using (public.is_member_of_company(bedrijf_id))
  with check (public.is_member_of_company(bedrijf_id));

drop policy if exists peppol_transmissions_delete on public.peppol_transmissions;
create policy peppol_transmissions_delete on public.peppol_transmissions for delete
  to authenticated
  using (public.is_member_of_company(bedrijf_id));

-- ---------------------------------------------------------------------------
-- 2. Verplichte bedrijf-koppeling (tenant key)
-- ---------------------------------------------------------------------------

alter table public.offertes
  alter column bedrijf_id set not null;

alter table public.facturen
  alter column bedrijf_id set not null;

alter table public.deals
  alter column bedrijf_id set not null;

alter table public.contacten
  alter column bedrijf_id set not null;

alter table public.factuur_lijnen
  alter column company_id set not null;

-- ---------------------------------------------------------------------------
-- 3. Datacontroles (bedragen, BTW, e-mail, omschrijving)
-- ---------------------------------------------------------------------------

alter table public.offertes
  drop constraint if exists offertes_bedrag_nonneg,
  add constraint offertes_bedrag_nonneg check (bedrag >= 0);

alter table public.facturen
  drop constraint if exists facturen_bedrag_nonneg,
  drop constraint if exists facturen_btw_bedrag_nonneg,
  drop constraint if exists facturen_totaal_bedrag_nonneg,
  add constraint facturen_bedrag_nonneg check (bedrag >= 0),
  add constraint facturen_btw_bedrag_nonneg check (btw_bedrag >= 0),
  add constraint facturen_totaal_bedrag_nonneg check (totaal_bedrag >= 0);

alter table public.offerte_lijnen
  drop constraint if exists offerte_lijnen_aantal_positive,
  drop constraint if exists offerte_lijnen_btw_range,
  drop constraint if exists offerte_lijnen_prijs_nonneg,
  drop constraint if exists offerte_lijnen_omschrijving_required,
  add constraint offerte_lijnen_aantal_positive check (aantal > 0),
  add constraint offerte_lijnen_btw_range check (btw_percentage >= 0 and btw_percentage <= 100),
  add constraint offerte_lijnen_prijs_nonneg check (prijs_per_eenheid >= 0),
  add constraint offerte_lijnen_omschrijving_required check (char_length(btrim(omschrijving)) > 0);

alter table public.factuur_lijnen
  drop constraint if exists factuur_lijnen_aantal_positive,
  drop constraint if exists factuur_lijnen_btw_range,
  drop constraint if exists factuur_lijnen_prijs_nonneg,
  drop constraint if exists factuur_lijnen_omschrijving_required,
  add constraint factuur_lijnen_aantal_positive check (aantal > 0),
  add constraint factuur_lijnen_btw_range check (btw_percentage >= 0 and btw_percentage <= 100),
  add constraint factuur_lijnen_prijs_nonneg check (prijs_per_eenheid >= 0),
  add constraint factuur_lijnen_omschrijving_required check (char_length(btrim(omschrijving)) > 0);

alter table public.contacten
  drop constraint if exists contacten_email_format,
  add constraint contacten_email_format check (
    email is null or email ~* '^[^@]+@[^@]+\.[^@]+$'
  );

alter table public.deals
  drop constraint if exists deals_email_format,
  add constraint deals_email_format check (
    email is null or email ~* '^[^@]+@[^@]+\.[^@]+$'
  );

-- ---------------------------------------------------------------------------
-- 4. Audit-tabel voor handmatige back-up runs (optioneel logboek)
-- ---------------------------------------------------------------------------

create table if not exists public.database_backup_log (
  id bigint generated always as identity primary key,
  backup_type text not null check (backup_type in ('manual', 'scheduled', 'pre_migration')),
  status text not null check (status in ('started', 'completed', 'failed')),
  file_path text,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.database_backup_log enable row level security;

drop policy if exists database_backup_log_service_role on public.database_backup_log;
create policy database_backup_log_service_role
  on public.database_backup_log for all
  to service_role
  using (true)
  with check (true);

comment on table public.database_backup_log is
  'Logboek van database-back-ups. Alleen service_role kan schrijven/lezen.';
