# Production Readiness Checklist

Datum: 2026-07-20  
Branch: `feature/tasks-module`  
Status: checklist — **geen live productieacties** zonder expliciete toestemming.

Legenda: `AUTOMATED` | `MANUAL` | `BLOCKED_BY_CREDENTIALS` | `BLOCKED_BY_PRODUCTION_ACCESS`

---

## 1. Supabase

| Stap | Type | Status |
|------|------|--------|
| Lokale migraties aanwezig in `supabase/migrations/` | AUTOMATED | OK (repo) |
| Laatst verwachte migratie vóór Taken/Stripe: `20260720163011_harden_referral_and_team_rpc_access.sql` | MANUAL | Te bevestigen live |
| Nieuwe migraties (deze branch): `stripe_webhook_events`, `tasks_module` | MANUAL | Nog niet live toepassen |
| Controle vereiste tabellen | BLOCKED_BY_PRODUCTION_ACCESS | Zie queries |
| `platform_admins` bevat CEO | BLOCKED_BY_PRODUCTION_ACCESS | Zie queries |
| RLS enabled op tenanttabellen | BLOCKED_BY_PRODUCTION_ACCESS | Zie queries |
| Policies aanwezig | BLOCKED_BY_PRODUCTION_ACCESS | Zie queries |
| RPC’s: `is_platform_admin`, `is_member_of_company`, `is_company_admin`, `get_user_role_in_company` | BLOCKED_BY_PRODUCTION_ACCESS | Zie queries |

### Controlequery’s (live / staging — alleen lezen)

```sql
-- Vereiste kern tabellen
select tablename from pg_tables
where schemaname = 'public'
  and tablename in (
    'bedrijven','company_memberships','offertes','facturen','customers',
    'audit_logs','platform_admins','tasks','stripe_webhook_events'
  )
order by 1;

-- Platform admins
select pa.user_id, pa.role, u.email
from public.platform_admins pa
left join auth.users u on u.id = pa.user_id;

-- RLS status
select c.relname, c.relrowsecurity
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
  and c.relname in ('tasks','task_comments','task_attachments','stripe_webhook_events','audit_logs')
order by 1;

-- Policies
select schemaname, tablename, policyname, cmd
from pg_policies
where tablename like 'task%' or tablename = 'stripe_webhook_events'
order by tablename, policyname;

-- RPC’s
select proname from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname in ('public','app_private')
  and proname in (
    'is_platform_admin','is_member_of_company','is_company_admin',
    'get_user_role_in_company','current_user_is_platform_admin'
  );
```

### Rollback / herstel

- Voorwaartse migraties niet herschrijven.
- Bij fout: nieuwe down-migratie of feature flag (route/nav verbergen) i.p.v. destructive drop in productie.
- `stripe_webhook_events`: mislukte events opnieuw via Stripe replay na fix.

---

## 2. Platform admin

| Stap | Type | Status |
|------|------|--------|
| CEO-gebruiker bestaat in Auth | BLOCKED_BY_PRODUCTION_ACCESS | |
| CEO-rij in `platform_admins` (role=`ceo`) | BLOCKED_BY_PRODUCTION_ACCESS | |
| `PLATFORM_ADMIN_BOOTSTRAP_ENABLED=false` in productie | MANUAL | Verplicht |
| `PLATFORM_CEO_EMAIL` niet als normale toegang | MANUAL | Alleen nood-bootstrap |

---

## 3. Stripe

| Stap | Type | Status |
|------|------|--------|
| Webhook endpoint `/api/webhooks/stripe` | MANUAL | |
| Events: `checkout.session.completed`, invoice.* | MANUAL | |
| Signatureverificatie (`constructEvent`) | AUTOMATED | Code + tests |
| Event-idempotency (`stripe_webhook_events`) | AUTOMATED | Deze branch |
| Logging zonder secrets | AUTOMATED | |
| Testmode end-to-end | BLOCKED_BY_CREDENTIALS | |
| Herstel: Stripe Dashboard → Resend + status in ledger | MANUAL | |

---

## 4. OAuth

| Provider | Callback | Scopes/refresh | Test | Type |
|----------|----------|----------------|------|------|
| Google Calendar | `/dashboard/integraties/google-calendar/callback` | offline + calendar.events | reconnect | BLOCKED_BY_CREDENTIALS |
| Microsoft Teams | `/dashboard/integraties/microsoft-teams/callback` | offline_access | reconnect | BLOCKED_BY_CREDENTIALS |
| Dropbox | `/dashboard/integraties/dropbox/callback` | offline | reconnect | BLOCKED_BY_CREDENTIALS |
| QuickBooks | `/dashboard/integraties/quickbooks/callback` | Intuit | reconnect | BLOCKED_BY_CREDENTIALS |

Per provider handmatig: authorize → callback → token opslag → expiry → refresh → revoke/disconnect. Zie `docs/OAUTH_INTEGRATION_AUDIT.md`.

---

## 5. End-to-end workflows

| Flow | Type |
|------|------|
| Registratie | BLOCKED_BY_PRODUCTION_ACCESS |
| Bedrijf aanmaken | BLOCKED_BY_PRODUCTION_ACCESS |
| Contact aanmaken | MANUAL (staging) |
| Offerte maken / verzenden / publiek openen | MANUAL |
| Converteren → factuur verzenden | MANUAL |
| Betaling / incasso | BLOCKED_BY_CREDENTIALS |
| Auditlog controleren | MANUAL |
| Taken CRUD + Command Center | AUTOMATED (unit) + MANUAL UI |

---

## GO / NO-GO productie

**NO-GO** tot: live migraties toegepast, CEO in `platform_admins`, bootstrap uit, Stripe testmode webhook groen, kritieke E2E handmatig OK.
