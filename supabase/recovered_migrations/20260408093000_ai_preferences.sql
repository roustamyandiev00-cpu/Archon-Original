-- RECOVERED PRODUCTION MIGRATION HISTORY
-- Read-only archive; do not apply directly or add to the active migration chain.
-- Production version: 20260408093000
-- Production name: ai_preferences
alter table public.profiles
  add column if not exists ai_preferences jsonb not null default '{}'::jsonb;

-- Recovered statement 2
comment on column public.profiles.ai_preferences is
  'Persoonlijke AI voorkeuren voor de ArchonPro copilot, zoals stijl, diepgang en contextmodules.';

