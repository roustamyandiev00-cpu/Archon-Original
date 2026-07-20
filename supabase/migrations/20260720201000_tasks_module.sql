-- Expand legacy public.tasks into a full CRM tasks module + satellites.
-- Forward-only; does not rewrite historical migrations.

-- Ensure base table exists (legacy environments already have it).
create table if not exists public.tasks (
  id bigserial primary key,
  company_id bigint not null references public.bedrijven(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'todo',
  priority text not null default 'normal',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Normalize legacy values before tighter checks.
update public.tasks set status = 'completed' where status in ('done', 'open');
update public.tasks set status = 'todo' where status is null or status = '';
update public.tasks set priority = 'normal' where priority in ('medium', '') or priority is null;

alter table public.tasks
  add column if not exists start_at timestamptz,
  add column if not exists due_at timestamptz,
  add column if not exists completed_at timestamptz,
  add column if not exists assigned_to_user_id uuid references auth.users(id) on delete set null,
  add column if not exists created_by_user_id uuid references auth.users(id) on delete set null,
  add column if not exists contact_id bigint,
  add column if not exists deal_id bigint,
  add column if not exists offerte_id bigint references public.offertes(id) on delete set null,
  add column if not exists factuur_id bigint,
  add column if not exists project_id text,
  add column if not exists afspraak_id bigint,
  add column if not exists parent_task_id bigint references public.tasks(id) on delete set null,
  add column if not exists source text not null default 'manual',
  add column if not exists ai_generated boolean not null default false,
  add column if not exists requires_approval boolean not null default false,
  add column if not exists recurrence_rule_id bigint,
  add column if not exists position numeric not null default 0,
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists deleted_at timestamptz;

-- Map legacy columns when present.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'tasks' and column_name = 'due_date'
  ) then
    execute $q$
      update public.tasks
      set due_at = coalesce(due_at, due_date::timestamptz)
      where due_at is null and due_date is not null
    $q$;
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'tasks' and column_name = 'assigned_to'
  ) then
    execute $q$
      update public.tasks
      set assigned_to_user_id = coalesce(assigned_to_user_id, assigned_to)
      where assigned_to_user_id is null and assigned_to is not null
    $q$;
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'tasks' and column_name = 'created_by'
  ) then
    execute $q$
      update public.tasks
      set created_by_user_id = coalesce(created_by_user_id, created_by)
      where created_by_user_id is null and created_by is not null
    $q$;
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'tasks' and column_name = 'customer_id'
  ) then
    execute $q$
      update public.tasks
      set contact_id = coalesce(contact_id, customer_id)
      where contact_id is null and customer_id is not null
    $q$;
  end if;
end $$;

alter table public.tasks drop constraint if exists tasks_status_check;
alter table public.tasks
  add constraint tasks_status_check
  check (status in ('backlog','todo','in_progress','waiting','completed','cancelled'));

alter table public.tasks drop constraint if exists tasks_priority_check;
alter table public.tasks
  add constraint tasks_priority_check
  check (priority in ('low','normal','high','urgent'));

alter table public.tasks drop constraint if exists tasks_source_check;
alter table public.tasks
  add constraint tasks_source_check
  check (source in ('manual','ai','agent','system','import','recurrence'));

create index if not exists tasks_company_status_idx
  on public.tasks (company_id, status) where deleted_at is null;
create index if not exists tasks_company_due_idx
  on public.tasks (company_id, due_at) where deleted_at is null;
create index if not exists tasks_company_assignee_idx
  on public.tasks (company_id, assigned_to_user_id) where deleted_at is null;
create index if not exists tasks_company_position_idx
  on public.tasks (company_id, status, position) where deleted_at is null;

-- Recurrence rules
create table if not exists public.task_recurrence_rules (
  id bigserial primary key,
  company_id bigint not null references public.bedrijven(id) on delete cascade,
  frequency text not null check (frequency in ('daily','weekly','monthly')),
  interval_count integer not null default 1 check (interval_count > 0),
  timezone text not null default 'Europe/Brussels',
  next_run_at timestamptz,
  ends_at timestamptz,
  is_active boolean not null default true,
  created_by_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists task_recurrence_rules_company_idx
  on public.task_recurrence_rules (company_id, is_active, next_run_at);

alter table public.tasks
  drop constraint if exists tasks_recurrence_rule_id_fkey;
alter table public.tasks
  add constraint tasks_recurrence_rule_id_fkey
  foreign key (recurrence_rule_id) references public.task_recurrence_rules(id) on delete set null;

create table if not exists public.task_comments (
  id bigserial primary key,
  company_id bigint not null references public.bedrijven(id) on delete cascade,
  task_id bigint not null references public.tasks(id) on delete cascade,
  body text not null,
  created_by_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists task_comments_task_idx
  on public.task_comments (task_id, created_at desc) where deleted_at is null;

create table if not exists public.task_attachments (
  id uuid primary key default gen_random_uuid(),
  company_id bigint not null references public.bedrijven(id) on delete cascade,
  task_id bigint not null references public.tasks(id) on delete cascade,
  file_name text not null,
  original_name text not null,
  mime_type text,
  size_bytes bigint,
  storage_bucket text not null default 'project-files',
  storage_path text not null,
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists task_attachments_task_idx
  on public.task_attachments (task_id, created_at desc) where deleted_at is null;

create table if not exists public.task_labels (
  id bigserial primary key,
  company_id bigint not null references public.bedrijven(id) on delete cascade,
  name text not null,
  color text,
  created_at timestamptz not null default now(),
  unique (company_id, name)
);

create table if not exists public.task_label_assignments (
  task_id bigint not null references public.tasks(id) on delete cascade,
  label_id bigint not null references public.task_labels(id) on delete cascade,
  company_id bigint not null references public.bedrijven(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (task_id, label_id)
);

create table if not exists public.task_reminders (
  id bigserial primary key,
  company_id bigint not null references public.bedrijven(id) on delete cascade,
  task_id bigint not null references public.tasks(id) on delete cascade,
  remind_at timestamptz not null,
  channel text not null default 'in_app'
    check (channel in ('in_app','email')),
  status text not null default 'pending'
    check (status in ('pending','sent','cancelled','failed')),
  idempotency_key text not null,
  sent_at timestamptz,
  last_error text,
  created_by_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, idempotency_key)
);

create index if not exists task_reminders_due_idx
  on public.task_reminders (status, remind_at);

create table if not exists public.task_activity_logs (
  id bigserial primary key,
  company_id bigint not null references public.bedrijven(id) on delete cascade,
  task_id bigint not null references public.tasks(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists task_activity_logs_task_idx
  on public.task_activity_logs (task_id, created_at desc);

-- Recurrence occurrence idempotency
create table if not exists public.task_recurrence_occurrences (
  id bigserial primary key,
  company_id bigint not null references public.bedrijven(id) on delete cascade,
  recurrence_rule_id bigint not null references public.task_recurrence_rules(id) on delete cascade,
  occurrence_key text not null,
  task_id bigint references public.tasks(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (recurrence_rule_id, occurrence_key)
);

-- RLS helpers: member read; non-viewer write
create or replace function public.can_write_company_tasks(p_company_id bigint)
returns boolean
language sql
stable
security definer
set search_path to 'public', 'pg_temp'
as $$
  select
    public.is_member_of_company(p_company_id)
    and coalesce(lower(public.get_user_role_in_company(p_company_id)), '') not in (
      'viewer', 'readonly', 'read_only', 'guest'
    );
$$;

revoke all on function public.can_write_company_tasks(bigint) from public, anon;
grant execute on function public.can_write_company_tasks(bigint)
  to authenticated, service_role;

alter table public.tasks enable row level security;
alter table public.task_comments enable row level security;
alter table public.task_attachments enable row level security;
alter table public.task_labels enable row level security;
alter table public.task_label_assignments enable row level security;
alter table public.task_reminders enable row level security;
alter table public.task_recurrence_rules enable row level security;
alter table public.task_recurrence_occurrences enable row level security;
alter table public.task_activity_logs enable row level security;

-- tasks policies
drop policy if exists tasks_select_member on public.tasks;
create policy tasks_select_member on public.tasks
  for select to authenticated
  using (public.is_member_of_company(company_id) and deleted_at is null);

drop policy if exists tasks_insert_writer on public.tasks;
create policy tasks_insert_writer on public.tasks
  for insert to authenticated
  with check (public.can_write_company_tasks(company_id));

drop policy if exists tasks_update_writer on public.tasks;
create policy tasks_update_writer on public.tasks
  for update to authenticated
  using (public.can_write_company_tasks(company_id))
  with check (public.can_write_company_tasks(company_id));

drop policy if exists tasks_delete_writer on public.tasks;
create policy tasks_delete_writer on public.tasks
  for delete to authenticated
  using (public.can_write_company_tasks(company_id));

-- Generic child policies
do $$
declare
  t text;
begin
  foreach t in array array[
    'task_comments','task_attachments','task_labels','task_label_assignments',
    'task_reminders','task_recurrence_rules','task_recurrence_occurrences','task_activity_logs'
  ]
  loop
    execute format('drop policy if exists %I_select_member on public.%I', t, t);
    execute format(
      'create policy %I_select_member on public.%I for select to authenticated using (public.is_member_of_company(company_id))',
      t, t
    );
    execute format('drop policy if exists %I_write on public.%I', t, t);
    execute format(
      'create policy %I_write on public.%I for all to authenticated using (public.can_write_company_tasks(company_id)) with check (public.can_write_company_tasks(company_id))',
      t, t
    );
  end loop;
end $$;

comment on table public.tasks is 'CRM workspace tasks (tenant-scoped, soft-deletable).';
