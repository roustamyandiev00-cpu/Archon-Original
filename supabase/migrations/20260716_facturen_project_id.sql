-- Optionele koppeling factuur → project (werf)
alter table public.facturen
  add column if not exists project_id text references public.projecten(id) on delete set null;

create index if not exists idx_facturen_project_id on public.facturen(project_id);
