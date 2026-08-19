# Taken-module — Implementation Report

Datum: 2026-07-20  
Branch: `feature/tasks-module`

## Architectuur

- Server actions in `src/app/dashboard/taken/actions.ts`
- Pure helpers: `src/lib/tasks/{types,validation,relations,query}.ts`
- UI: `TakenBoard`, `TaskDetailActions`, `RelatedTasksPanel`
- Routes: `/dashboard/taken`, `/dashboard/taken/[taskId]`
- Cron: `/api/cron/task-reminders` (Bearer `CRON_SECRET`)
- Legacy `public.tasks` uitgebreid (geen tweede tabel)

## Database

Migratie: `supabase/migrations/20260720181000_tasks_module.sql`

Tabellen:
- `tasks` (ALTER + soft delete)
- `task_comments`, `task_attachments`, `task_labels`, `task_label_assignments`
- `task_reminders`, `task_recurrence_rules`, `task_recurrence_occurrences`
- `task_activity_logs`

RLS: member read; write via `app_private.can_write_company_tasks` (viewer/readonly denied).

## Server actions

create/update/delete/restore, complete/reopen/setStatus, assign, move, comments, attachments, labels, reminders, recurrence, list/get/activity.

## Integraties

- Nav: sidebar Operatie + mobile Meer
- Command Center: echte CRM-taken in mission-data + quick links
- RelatedTasksPanel op factuurdetail + leads
- AI policies: `Nova:propose_create_task`, `Lima:propose_invoice_followup_task` (approval verplicht)

## Migratie-instructies

1. Review SQL lokaal.
2. Op staging: `supabase db push` of SQL editor (expliciete toestemming).
3. Regenereren types indien linked: `pnpm types:generate`.
4. Bootstrap admin blijft uit in productie.

## Rollback

- Feature flag: nav-item verwijderen / route achter feature flag.
- Geen destructive drop in productie; eventueel soft-disable cron in `vercel.json`.

## Bekende beperkingen

- Live migratie nog niet toegepast.
- Attachment upload UI gebruikt metadata-API (storage path validatie); volledige drag-drop uploader beperkt.
- Deal-FK validatie lichtgewicht (geen aparte deals-company check in alle flows).
- Contact-/project-/afspraak-detailpagina’s hebben niet overal RelatedTasksPanel (lijstpagina’s).

## Handmatige teststappen

1. Open `/dashboard/taken`, maak taak, verplaats in kanban.
2. Open taakdetail, commentaar, voltooien.
3. Factuurdetail → gekoppelde taak aanmaken.
4. Command Center → Mijn Taken toont CRM-taken.
5. Cron dry-run met Bearer secret (staging).
