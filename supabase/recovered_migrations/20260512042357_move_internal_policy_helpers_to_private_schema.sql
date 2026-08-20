-- RECOVERED PRODUCTION MIGRATION HISTORY
-- Read-only archive; do not apply directly or add to the active migration chain.
-- Production version: 20260512042357
-- Production name: move_internal_policy_helpers_to_private_schema
create schema if not exists app_private;

revoke all on schema app_private from public;
grant usage on schema app_private to authenticated;

create or replace function app_private.get_user_company_id()
returns bigint
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select b.id
  from public.bedrijven b
  where b.user_id = auth.uid()
  limit 1;
$$;

create or replace function app_private.is_internal_user()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select not exists (
    select 1
    from public.customer_portal_users cpu
    where cpu.auth_user_id = auth.uid()
  );
$$;

revoke all on function app_private.get_user_company_id() from public, anon;
revoke all on function app_private.is_internal_user() from public, anon;
grant execute on function app_private.get_user_company_id() to authenticated;
grant execute on function app_private.is_internal_user() to authenticated;

-- Internal customers/portal policies should be available to signed-in users only,
-- and should use helpers outside the exposed public API schema.
drop policy if exists "Internal users view own credit transactions" on public.ai_credit_transactions;
create policy "Internal users view own credit transactions"
  on public.ai_credit_transactions
  for select
  to authenticated
  using (company_id = (select app_private.get_user_company_id()));

drop policy if exists "Internal users view own company credits" on public.company_ai_credits;
create policy "Internal users view own company credits"
  on public.company_ai_credits
  for select
  to authenticated
  using (company_id = (select app_private.get_user_company_id()));

drop policy if exists "Internal users select own audit logs" on public.customer_portal_audit_log;
create policy "Internal users select own audit logs"
  on public.customer_portal_audit_log
  for select
  to authenticated
  using (
    app_private.is_internal_user()
    and company_id = app_private.get_user_company_id()
  );

drop policy if exists "Internal users insert own invitations" on public.customer_portal_invitations;
create policy "Internal users insert own invitations"
  on public.customer_portal_invitations
  for insert
  to authenticated
  with check (
    app_private.is_internal_user()
    and company_id = app_private.get_user_company_id()
  );

drop policy if exists "Internal users select own invitations" on public.customer_portal_invitations;
create policy "Internal users select own invitations"
  on public.customer_portal_invitations
  for select
  to authenticated
  using (
    app_private.is_internal_user()
    and company_id = app_private.get_user_company_id()
  );

drop policy if exists "Internal users update own invitations" on public.customer_portal_invitations;
create policy "Internal users update own invitations"
  on public.customer_portal_invitations
  for update
  to authenticated
  using (
    app_private.is_internal_user()
    and company_id = app_private.get_user_company_id()
  );

drop policy if exists "Users see their own portal record" on public.customer_portal_users;
create policy "Users see their own portal record"
  on public.customer_portal_users
  for select
  to authenticated
  using (
    auth_user_id = auth.uid()
    or (
      app_private.is_internal_user()
      and company_id = app_private.get_user_company_id()
    )
  );

drop policy if exists "Internal users delete own customers" on public.customers;
create policy "Internal users delete own customers"
  on public.customers
  for delete
  to authenticated
  using (
    app_private.is_internal_user()
    and company_id = app_private.get_user_company_id()
  );

drop policy if exists "Internal users insert own customers" on public.customers;
create policy "Internal users insert own customers"
  on public.customers
  for insert
  to authenticated
  with check (
    app_private.is_internal_user()
    and company_id = app_private.get_user_company_id()
  );

drop policy if exists "Internal users select own customers" on public.customers;
create policy "Internal users select own customers"
  on public.customers
  for select
  to authenticated
  using (
    app_private.is_internal_user()
    and company_id = app_private.get_user_company_id()
  );

drop policy if exists "Internal users update own customers" on public.customers;
create policy "Internal users update own customers"
  on public.customers
  for update
  to authenticated
  using (
    app_private.is_internal_user()
    and company_id = app_private.get_user_company_id()
  );

revoke execute on function public.get_user_company_id() from authenticated;
revoke execute on function public.is_internal_user() from authenticated;
revoke execute on function public.grant_plan_tokens(bigint, character varying) from authenticated;

