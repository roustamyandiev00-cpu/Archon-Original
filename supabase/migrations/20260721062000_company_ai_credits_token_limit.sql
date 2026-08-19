-- Add per-company AI token limit used by platform admin AI tokens UI.
alter table public.company_ai_credits
  add column if not exists token_limit integer;

comment on column public.company_ai_credits.token_limit is
  'Optional per-company AI token ceiling managed by platform admins.';
