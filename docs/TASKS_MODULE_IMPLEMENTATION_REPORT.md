# Tasks Module — Implementation Report

Branch: `feature/tasks-module`  
Datum: 2026-07-20

## Architectuur

- Tenant-scoped CRM tasks via uitgebreide `public.tasks` + satellites.
- Server actions in `src/app/dashboard/taken/actions.ts`.
- UI: `/dashboard/taken` (lijst/kanban) + `/dashboard/taken/[taskId]`.
- Command Center laadt echte CRM-taken in `mission-data.ts`.
- Reminders via `/api/cron/task-reminders` + `authorizeCronRequest`.
- AI: `Nova:propose_create_task` / `Lima:propose_create_task` policies (approval vereist).

## Database

Migratie: `supabase/migrations/20260720201000_tasks_module.sql`

Tabellen: `tasks` (ALTER), `task_comments`, `task_attachments`, `task_labels`, `task_label_assignments`, `task_reminders`, `task_recurrence_rules`, `task_recurrence_occurrences`, `task_activity_logs`.

## Routes

- `/dashboard/taken`
- `/dashboard/taken/[taskId]`
- `/api/cron/task-reminders`

## Server actions

create/update/delete/restore/complete/reopen/assign/move, comments, attachments, labels, reminders, recurrence, list/get/activity.

## Componenten

- `TakenManager`, `TaskDetailClient`, `RelatedTasksPanel`

## RLS

- Read: `is_member_of_company`
- Write: `can_write_company_tasks` (viewer/readonly/guest denied)
- Server guards: `requireWriteAccess` + role check; reads via `getDashboardContext`

## Notificaties / recurring / AI

- Reminders: pending→sent claim (idempotent)
- Recurrence: occurrence_key uniek per regel/dag
- AI: deterministic policy + human approval

## Migratie-instructies

1. Review migraties lokaal.
2. Op staging: `supabase db push` (expliciete toestemming).
3. Zet bootstrap admin uit in productie.
4. Nav/feature beschikbaar na deploy.

## Rollback

- Reverse-migratie toevoegen (drop satellites / restore columns) — nooit history herschrijven.
- Feature tijdelijk uit nav halen.

## Bekende beperkingen

- Live migratie nog niet toegepast.
- Attachment upload UI beperkt (metadata path + storage_path guard).
- Types in `database.types.ts` deels via `untyped()` tot `types:generate` op linked schema.
- Mentions in comments niet geïmplementeerd.
