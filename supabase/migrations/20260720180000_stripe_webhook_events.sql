-- Stripe webhook event ledger for idempotent processing.
-- No full sensitive payload storage; payload_hash only.

create table if not exists public.stripe_webhook_events (
  id uuid primary key default gen_random_uuid(),
  stripe_event_id text not null,
  event_type text not null,
  livemode boolean not null default false,
  status text not null default 'processing'
    check (status in ('processing', 'processed', 'failed', 'ignored')),
  processing_started_at timestamptz not null default now(),
  processed_at timestamptz,
  failed_at timestamptz,
  attempts integer not null default 1 check (attempts >= 1),
  last_error text,
  payload_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists stripe_webhook_events_stripe_event_id_key
  on public.stripe_webhook_events (stripe_event_id);

create index if not exists stripe_webhook_events_status_created_idx
  on public.stripe_webhook_events (status, created_at desc);

create index if not exists stripe_webhook_events_livemode_type_idx
  on public.stripe_webhook_events (livemode, event_type);

alter table public.stripe_webhook_events enable row level security;

revoke all on public.stripe_webhook_events from public, anon, authenticated;
grant all on public.stripe_webhook_events to service_role;

drop policy if exists stripe_webhook_events_service_role_all on public.stripe_webhook_events;
create policy stripe_webhook_events_service_role_all
  on public.stripe_webhook_events for all
  to service_role
  using (true)
  with check (true);

comment on table public.stripe_webhook_events is
  'Idempotency ledger for Stripe webhooks; service_role only.';
