# Taken-module — Implementation Plan

Status: **ONTWERP ONLY** — niet gebouwd in de verification sprint.

## Doel

Tenant-gebonden taken met koppelingen naar CRM-objecten, human-in-the-loop agentacties, en Command Center-widget.

## 1. Database-schema (voorstel)

```sql
create table public.tasks (
  id bigserial primary key,
  company_id bigint not null references public.bedrijven(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'open'
    check (status in ('open','in_progress','blocked','done','cancelled')),
  priority text not null default 'medium'
    check (priority in ('low','medium','high','urgent')),
  starts_at timestamptz,
  due_at timestamptz,
  assignee_user_id uuid references auth.users(id),
  contact_id bigint,
  lead_id bigint,
  offerte_id bigint,
  factuur_id bigint,
  project_id bigint,
  afspraak_id bigint,
  labels text[] not null default '{}',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- comments, attachments, reminders, recurrence, activity_events als kindtabellen
```

## 2–4. Migratie / RLS / indexes

- Voorwaartse migratie `YYYYMMDD_tasks_module.sql`.
- RLS: `company_id` via membership; write voor owner/admin/member (productkeuze).
- Indexes: `(company_id, status)`, `(company_id, due_at)`, `(company_id, assignee_user_id)`.

## 5–7. Types / actions / validatie

- Regenereer `database.types.ts`.
- Server actions: create/update/status/assign/comment.
- Zod (of bestaande validatiestijl) voor inputs.

## 8–13. UI

- Routes: `/dashboard/taken`, `/dashboard/taken/[id]`.
- Lijst + kanban + drawer.
- Filters: status, assignee, due, linked object.
- Zoek: titel/beschrijving.

## 14–16. Notificaties / audit / tests

- Reminder cron (CRON_SECRET).
- Audit events: `task.created|updated|completed`.
- Tests: tenant isolation, role deny, reminder idempotency.

## 17–19. Integraties

- Command Center widget: open/due vandaag.
- Lara/Ela/Nova: voorstellen via `agent_actions` + `canApproveAction`.
- API: interne server actions eerst; publieke API later.

## 20. Definition of Done

- [ ] Migratie + RLS live
- [ ] Types gegenereerd (geen `untyped` nodig)
- [ ] CRUD + filters + kanban
- [ ] Tenant-tests groen
- [ ] Agent create-task policy + approval
- [ ] Geen secrets in client

## Volgorde na GO

1. Schema + RLS  
2. Server actions + tests  
3. Lijst/detail UI  
4. Kanban + Command Center  
5. Agent hooks  
