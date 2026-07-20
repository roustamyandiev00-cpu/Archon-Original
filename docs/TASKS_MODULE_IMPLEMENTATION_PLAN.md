# Taken-module — Implementation Plan

Status: **GEÏMPLEMENTEERD op `feature/tasks-module`** (niet live gemerged).

Zie ook:

- `docs/TASKS_MODULE_IMPLEMENTATION_REPORT.md`
- `docs/TASKS_MODULE_SECURITY_REVIEW.md`
- `docs/TASKS_MODULE_TEST_REPORT.md`

## Schema-keuze

Bestaande `public.tasks` is uitgebreid (geen parallelle tabel). Statuswaarden: `backlog|todo|in_progress|waiting|completed|cancelled`. Prioriteit: `low|normal|high|urgent`. Soft delete via `deleted_at`.

## Recurrence semantiek

- Frequencies: daily / weekly / monthly + interval_count
- Occurrence idempotency: `task_recurrence_occurrences(recurrence_rule_id, occurrence_key)`
- occurrence_key = `{ruleId}:{YYYY-MM-DD}`
- Stop: `is_active=false`; skip = next_run_at opschuiven zonder insert
