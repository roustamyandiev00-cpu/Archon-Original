# Tasks Module — Test Report

## Automated

| Suite | Scope | Result |
|-------|-------|--------|
| `src/lib/stripe/__tests__/webhook-events.test.ts` | claim/duplicate/retry/hash/livemode | 7/7 passed |
| `src/lib/cron/__tests__/auth.test.ts` | cron secret | 3/3 passed |
| `src/lib/tasks/__tests__/tasks-core.test.ts` | validation/recurrence/security helpers | 7/7 passed |
| `src/lib/agents/__tests__/can-approve-action.test.ts` | allowlist + task policy | 3/3 passed |
| `pnpm typecheck` | | passed |
| targeted eslint | taken/stripe/cron | passed |
| `pnpm build` | | passed |

## Not covered in CI (manual / blocked)

- Cross-tenant DB RLS against live Postgres
- Attachment binary upload E2E
- Concurrent cron reminder runs against live DB
- Full UI kanban drag (status select covered)

## Manual checklist

1. Create task on `/dashboard/taken`
2. Complete / reopen / assign
3. Kanban status move
4. Comment add
5. Reminder create + cron with secret
6. Related panel on factuur detail
7. Command Center shows CRM tasks
