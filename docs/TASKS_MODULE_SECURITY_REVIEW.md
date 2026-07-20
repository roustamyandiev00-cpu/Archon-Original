# Tasks Module — Security Review

## Controls

| Control | Status |
|---------|--------|
| Tenant filter op company_id (server) | OK |
| RLS deny-by-default + member read | OK |
| Viewer/readonly write deny (`can_write_company_tasks`) | OK |
| Cross-tenant FK checks (contact/offerte/factuur/parent) | OK |
| Attachment path moet met `{companyId}/` starten | OK |
| Impersonatie: writes geblokkeerd via requireWriteAccess | OK |
| Audit events voor create/update/status/assign/delete/… | OK |
| Cron reminders achter CRON_SECRET | OK |
| AI task propose requiresApproval | OK |
| canApproveAction deny-by-default | OK |

## Residual risks

- RLS write policy “for all” op child tables is breed; server actions blijven primaire gate.
- Soft-deleted tasks blijven in DB; select policy hide via `deleted_at is null`.
- Live policy verification BLOCKED_BY_PRODUCTION_ACCESS.
