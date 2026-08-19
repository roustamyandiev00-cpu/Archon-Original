# Taken-module — Test Report

Datum: 2026-07-20

## Automated

| Suite | Scope | Result |
|-------|-------|--------|
| `src/lib/tasks/__tests__/validation.test.ts` | parse/roles/recurrence keys | run in CI step |
| `src/lib/tasks/__tests__/policy.test.ts` | AI approval policies | run in CI step |
| `src/lib/stripe/__tests__/webhook-events.test.ts` | event ledger idempotency | run in CI step |
| Existing security tests | canApprove/cron/platform-admin | regressie |

## Covered behaviours

- create input validation
- viewer cannot write (unit)
- recurrence occurrence key stability
- Stripe first/duplicate/retry/livemode
- AI propose task requires approval

## Not fully automated (manual / blocked)

- Cross-tenant DB RLS live
- Concurrent reminder cron double-run on live DB
- Full UI kanban drag
- Attachment binary upload E2E

## Commands

```bash
pnpm exec vitest run src/lib/tasks src/lib/stripe/__tests__/webhook-events.test.ts
pnpm typecheck
pnpm build
```
