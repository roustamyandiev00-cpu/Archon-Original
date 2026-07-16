-- Projectbestanden: foto's & documenten gekoppeld aan project / offerte / klant
-- Bucket `project-files` bestaat al (tenant RLS via storage_tenant_access).

alter table public.projecten
  add column if not exists customer_id bigint references public.customers(id) on delete set null,
  add column if not exists offerte_id bigint references public.offertes(id) on delete set null;

create index if not exists idx_projecten_customer_id on public.projecten(customer_id);
create index if not exists idx_projecten_offerte_id on public.projecten(offerte_id);

create table if not exists public.project_bestanden (
  id uuid primary key default gen_random_uuid(),
  company_id bigint not null references public.bedrijven(id) on delete cascade,
  project_id text references public.projecten(id) on delete cascade,
  offerte_id bigint references public.offertes(id) on delete set null,
  customer_id bigint references public.customers(id) on delete set null,
  category text not null default 'document'
    check (category in ('foto', 'offerte_foto', 'document', 'plan', 'contract', 'andere')),
  file_name text not null,
  original_name text not null,
  mime_type text,
  size_bytes bigint,
  storage_bucket text not null default 'project-files',
  storage_path text not null,
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_project_bestanden_project
  on public.project_bestanden(project_id);
create index if not exists idx_project_bestanden_offerte
  on public.project_bestanden(offerte_id);
create index if not exists idx_project_bestanden_customer
  on public.project_bestanden(company_id, customer_id);
create index if not exists idx_project_bestanden_company
  on public.project_bestanden(company_id, created_at desc);

alter table public.project_bestanden enable row level security;

drop policy if exists "project_bestanden_select" on public.project_bestanden;
drop policy if exists "project_bestanden_insert" on public.project_bestanden;
drop policy if exists "project_bestanden_update" on public.project_bestanden;
drop policy if exists "project_bestanden_delete" on public.project_bestanden;

create policy "project_bestanden_select"
  on public.project_bestanden for select
  to authenticated
  using (app_private.is_company_member(company_id));

create policy "project_bestanden_insert"
  on public.project_bestanden for insert
  to authenticated
  with check (app_private.is_company_member(company_id));

create policy "project_bestanden_update"
  on public.project_bestanden for update
  to authenticated
  using (app_private.is_company_member(company_id))
  with check (app_private.is_company_member(company_id));

create policy "project_bestanden_delete"
  on public.project_bestanden for delete
  to authenticated
  using (app_private.is_company_member(company_id));

grant select, insert, update, delete on public.project_bestanden to authenticated;
grant all on public.project_bestanden to service_role;
