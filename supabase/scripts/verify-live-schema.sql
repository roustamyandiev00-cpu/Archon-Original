-- ArchonPro — verificatie van het live schema vóór migreren
--
-- Uitsluitend leesqueries. Draai dit in de Supabase SQL-editor van het project
-- uit NEXT_PUBLIC_SUPABASE_URL, of via:
--   psql "$DATABASE_URL" -f supabase/scripts/verify-live-schema.sql
--
-- Doel: de aannames bevestigen waarop de branchconsolidatie van 2026-07-27
-- rust (zie docs/TAKEN_MODULE_KEUZE.md) voordat er iets wordt toegepast.

\echo '== 1. KRITIEK: type van tasks.project_id =='
-- De hele keuze voor de remote Taken-implementatie hangt hieraan.
-- VERWACHT: bigint (komt overeen met src/lib/tasks/types.ts en database.types.ts).
-- Is het text/character varying, dan klopt database.types.ts niet en moet de
-- Taken-module opnieuw beoordeeld worden vóór gebruik.
select
  column_name,
  data_type,
  is_nullable,
  case
    when column_name = 'project_id' and data_type = 'bigint'
      then 'OK — komt overeen met de code'
    when column_name = 'project_id'
      then 'AFWIJKING — code verwacht bigint'
    else ''
  end as oordeel
from information_schema.columns
where table_schema = 'public'
  and table_name = 'tasks'
  and column_name in (
    'project_id', 'completed_at', 'customer_id', 'assigned_to',
    'created_by', 'due_date', 'related_entity_id', 'related_entity_type'
  )
order by column_name;

\echo ''
\echo '== 2. Bestaat de tasks-tabel al, en met welke kolommen? =='
-- De remote-migratie 20260720181000 begint met UPDATE public.tasks en
-- veronderstelt dus dat de tabel bestaat.
select count(*) as aantal_kolommen
from information_schema.columns
where table_schema = 'public' and table_name = 'tasks';

\echo ''
\echo '== 3. Welke migraties zijn al toegepast? =='
-- Vergelijk met supabase/migrations/ (51 bestanden per 2026-07-27).
-- Let vooral op of deze al gedraaid zijn:
--   20260720181000_tasks_module
--   20260720180000_stripe_webhook_events
--   20260720110731_ceo_only_platform_admin
select version, name
from supabase_migrations.schema_migrations
order by version desc
limit 25;

\echo ''
\echo '== 4. Vereiste tabellen aanwezig? =='
select tablename
from pg_tables
where schemaname = 'public'
  and tablename in (
    'bedrijven','company_memberships','customers','offertes','facturen',
    'platform_admins','audit_logs','profiles',
    'tasks','task_comments','task_attachments','task_labels',
    'task_label_assignments','task_reminders','task_recurrence_rules',
    'task_recurrence_occurrences','task_activity_logs',
    'stripe_webhook_events','platform_billing_invoices',
    'company_ai_credits','ai_token_purchases'
  )
order by tablename;

\echo ''
\echo '== 5. Ontbreekt company_ai_credits.token_limit? =='
-- Zonder deze kolom degradeert /admin/ai-tokens naar een nette foutmelding
-- (zie describeTokenUsageLoadError). Migratie: 20260721062000.
select
  case when exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'company_ai_credits'
      and column_name = 'token_limit'
  ) then 'aanwezig' else 'ONTBREEKT — migratie 20260721062000 nog toepassen'
  end as token_limit_status;

\echo ''
\echo '== 6. RLS actief op tenanttabellen? =='
select c.relname as tabel, c.relrowsecurity as rls_actief
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
  and c.relname in (
    'tasks','task_comments','task_attachments','task_reminders',
    'task_activity_logs','stripe_webhook_events','audit_logs'
  )
order by c.relname;

\echo ''
\echo '== 7. Policies op de tasks-familie =='
-- VERWACHT na 20260720181000: tasks_select / tasks_insert / tasks_update /
-- tasks_delete. Zie je nog "Users can view tasks" of "Internal users can ...",
-- dan is 20260721060000_tasks_drop_legacy_policies nog niet toegepast; die
-- oude policies zijn te ruim.
select tablename, policyname, cmd
from pg_policies
where schemaname = 'public'
  and (tablename like 'task%' or tablename = 'stripe_webhook_events')
order by tablename, policyname;

\echo ''
\echo '== 8. Vereiste RPC-functies =='
select n.nspname as schema, p.proname as functie
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname in ('public','app_private')
  and p.proname in (
    'is_platform_admin','is_member_of_company','is_company_admin',
    'get_user_role_in_company','can_write_company_tasks',
    'current_user_is_platform_admin','get_platform_registration_count',
    'ceo_grant_ai_credits'
  )
order by n.nspname, p.proname;

\echo ''
\echo '== 9. Platform-admins =='
-- Verwacht precies één CEO-rij na 20260720110731_ceo_only_platform_admin.
-- Staat hier niemand, zet PLATFORM_ADMIN_BOOTSTRAP_ENABLED dan pas op false
-- nadat je hier een rij hebt aangemaakt — anders sluit je jezelf buiten.
select pa.user_id, pa.role, u.email, pa.created_at
from public.platform_admins pa
left join auth.users u on u.id = pa.user_id
order by pa.created_at;

\echo ''
\echo '== 10. Anon-rechten die er niet horen te zijn =='
-- Migraties 20260720163011 en 20260721061000 trekken deze in.
select r.routine_name, p.privilege_type, p.grantee
from information_schema.routine_privileges p
join information_schema.routines r
  on r.specific_name = p.specific_name
 and r.specific_schema = p.specific_schema
where p.grantee = 'anon'
  and r.routine_schema = 'public'
  and r.routine_name in (
    'team_add_member','team_list_members','team_update_member',
    'ensure_user_referral','apply_referral_reward'
  )
order by r.routine_name;
-- Lege uitkomst = goed.
