# Taken-module — Security Review

Datum: 2026-07-20

## Controls

| Control | Status |
|---------|--------|
| Tenant filter `company_id` op alle queries | OK |
| Geen client-supplied `company_id` | OK |
| Relationele FK’s zelfde tenant | OK (server `assertTaskRelations`) |
| Viewer/readonly write deny | OK (`canWriteTasks` + RLS helper) |
| Soft delete i.p.v. hard delete (default) | OK |
| Impersonatie: write geblokkeerd via `requireWriteAccess` | OK |
| Attachment path moet met `{companyId}/` beginnen | OK |
| Audit events zonder secrets/prompts | OK |
| Cron auth deny-by-default | OK (`authorizeCronRequest`) |
| AI policies requireApproval | OK |

## Residual risks

1. Live RLS niet geverifieerd op productie-DB.
2. `project_id` legacy numeric vs `projecten.id` text — validatie best-effort.
3. Platform-admin zonder impersonatie krijgt geen tenant write via RLS (bedoeld).

## Conclusie

**READY_FOR_REVIEW** op feature branch. **NO-GO** productie tot migratie + live RLS-check.
