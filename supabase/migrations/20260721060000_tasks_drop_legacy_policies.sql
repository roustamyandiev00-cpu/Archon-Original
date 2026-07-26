-- Remove legacy permissive tasks policies that OR-bypass can_write_company_tasks.
-- Keep member-scoped select/write policies from tasks_module.

drop policy if exists "Internal users can delete tasks" on public.tasks;
drop policy if exists "Internal users can insert tasks" on public.tasks;
drop policy if exists "Internal users can update tasks" on public.tasks;
drop policy if exists "Users can view tasks" on public.tasks;
