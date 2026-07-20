# Production Readiness Checklist

Datum: 2026-07-20  
Branch: `feature/tasks-module`  
Status: **NO-GO voor productie** tot live items groen zijn.

## 1. Supabase

| Stap | Type | Status |
|------|------|--------|
| Alle lokale migraties in `supabase/migrations/` geïnventariseerd | AUTOMATED | DONE (39 files in tree) |
| Laatst verwachte migratie vóór Taken/Stripe: `20260717182756_customers_contact_type.sql` | MANUAL | OPEN |
| Nieuwe migraties in deze branch: `stripe_webhook_events`, `tasks_module` | AUTOMATED | zie migratiebestanden |
| Live `supabase migration list` / apply | BLOCKED_BY_PRODUCTION_ACCESS | OPEN |
| Tabel `platform_admins` aanwezig | BLOCKED_BY_PRODUCTION_ACCESS | OPEN |
| Tabel `audit_logs` aanwezig | BLOCKED_BY_PRODUCTION_ACCESS | OPEN |
| Tabel `tasks` (+ satellites na migratie) | BLOCKED_BY_PRODUCTION_ACCESS | OPEN |
| RLS enabled op tenanttabellen | BLOCKED_BY_PRODUCTION_ACCESS | OPEN |

### Controlequery’s (handmatig op live/staging)

```sql
-- Vereiste tabellen
select table_name from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'platform_admins','audit_logs','tasks','task_comments','task_attachments',
    'task_labels','task_label_assignments','task_reminders','task_recurrence_rules',
    'task_activity_logs','stripe_webhook_events'
  )
order by 1;

-- platform_admins
select user_id, role, created_at from public.platform_admins;

-- RLS status
select c.relname, c.relrowsecurity
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('tasks','task_comments','task_attachments','stripe_webhook_events')
order by 1;

-- Policies
select schemaname, tablename, policyname, cmd
from pg_policies
where tablename like 'task%' or tablename = 'stripe_webhook_events'
order by tablename, policyname;

-- RPC’s
select proname from pg_proc
where proname in ('is_platform_admin','is_member_of_company','is_company_admin','get_user_role_in_company');
```

### Rollback / herstel

- Nieuwe migraties zijn voorwaarts; rollback = nieuwe reverse-migratie (nooit herschrijven).
- Bij falende Taken-migratie: feature flag / nav-item verwijderen tot herstel.
- Stripe event-tabel: bij problemen webhook tijdelijk 503 + herstel uit Stripe dashboard replay.

## 2. Platform admin

| Stap | Type | Status |
|------|------|--------|
| CEO-gebruiker bestaat in Auth | BLOCKED_BY_PRODUCTION_ACCESS | OPEN |
| CEO in `platform_admins` (role ceo) | BLOCKED_BY_PRODUCTION_ACCESS | OPEN |
| `PLATFORM_ADMIN_BOOTSTRAP_ENABLED=false` in productie | BLOCKED_BY_CREDENTIALS | OPEN |
| `PLATFORM_CEO_EMAIL` / `PLATFORM_ADMIN_EMAILS` niet als normale productietoegang | MANUAL | OPEN |
| `IMPERSONATION_SECRET` gezet | BLOCKED_BY_CREDENTIALS | OPEN |

## 3. Stripe

| Stap | Type | Status |
|------|------|--------|
| Webhook endpoint `/api/webhooks/stripe` | MANUAL | OPEN |
| Events: `checkout.session.completed` (+ invoice events indien geconfigureerd) | MANUAL | OPEN |
| Signature verificatie (`STRIPE_WEBHOOK_SECRET`) | AUTOMATED (code) | DONE |
| Event-idempotency via `stripe_webhook_events` | AUTOMATED (code+tests) | DONE in branch |
| Logging zonder secrets | AUTOMATED | DONE |
| Testmode end-to-end | BLOCKED_BY_CREDENTIALS | OPEN |
| Live webhook delivery | BLOCKED_BY_PRODUCTION_ACCESS | OPEN |
| Herstel dubbele/gemiste events (Stripe replay + status failed→retry) | MANUAL | OPEN |

## 4. OAuth

| Provider | Callback | Scopes/refresh | Test | Status |
|----------|----------|----------------|------|--------|
| Google Calendar | `/dashboard/integraties/google-calendar/callback` | offline refresh in code | reconnect | BLOCKED_BY_CREDENTIALS |
| Microsoft Teams | `/dashboard/integraties/microsoft-teams/callback` | offline_access | reconnect | BLOCKED_BY_CREDENTIALS |
| Dropbox | `/dashboard/integraties/dropbox/callback` | offline | reconnect | BLOCKED_BY_CREDENTIALS |
| QuickBooks | `/dashboard/integraties/quickbooks/callback` | Intuit tokens | reconnect | BLOCKED_BY_CREDENTIALS |

Per provider handmatig: authorize → callback → token in `integraties` → expiry → refresh → revoke/disconnect.

## 5. End-to-end workflows

| Flow | Type | Status |
|------|------|--------|
| Registratie | MANUAL | OPEN |
| Bedrijf aanmaken | MANUAL | OPEN |
| Contact aanmaken | MANUAL | OPEN |
| Offerte maken/verzenden | MANUAL | OPEN |
| Publieke offerte openen | MANUAL | OPEN |
| Offerte → factuur | MANUAL | OPEN |
| Factuur verzenden / betaling | BLOCKED_BY_CREDENTIALS | OPEN |
| Incassoflow | MANUAL | OPEN |
| Auditlog controleren | MANUAL | OPEN |
| Taken CRUD + Command Center | MANUAL (na deploy migratie) | OPEN |

## Advies

- **GO** feature review op `feature/tasks-module` na groene typecheck/build/tests.
- **NO-GO** productie tot live Supabase-migraties, platform_admins, Stripe live en OAuth reconnect groen zijn.
