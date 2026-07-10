-- Audit-log voor platform-admin "Bekijk als bedrijf" (read-only impersonatie).
-- Alleen service_role schrijft/leest hier; gewone gebruikers en admins via de
-- normale (RLS-scoped) client hebben geen toegang.

create table if not exists public.admin_impersonation_log (
  id bigserial primary key,
  admin_user_id uuid not null references auth.users(id) on delete cascade,
  target_company_id bigint not null references public.bedrijven(id) on delete cascade,
  started_at timestamptz not null default now()
);

create index if not exists admin_impersonation_log_admin_idx
  on public.admin_impersonation_log (admin_user_id);
create index if not exists admin_impersonation_log_company_idx
  on public.admin_impersonation_log (target_company_id);

alter table public.admin_impersonation_log enable row level security;

drop policy if exists "admin_impersonation_log_service_role_all" on public.admin_impersonation_log;
create policy "admin_impersonation_log_service_role_all"
  on public.admin_impersonation_log for all
  to service_role
  using (true)
  with check (true);
