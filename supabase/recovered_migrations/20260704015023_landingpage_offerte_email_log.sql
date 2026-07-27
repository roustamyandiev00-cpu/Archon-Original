-- RECOVERED PRODUCTION MIGRATION HISTORY
-- Read-only archive; do not apply directly or add to the active migration chain.
-- Production version: 20260704015023
-- Production name: landingpage_offerte_email_log
create table if not exists public.offerte_email_log (
  id uuid primary key default gen_random_uuid(),
  bedrijf_id bigint not null references public.bedrijven (id) on delete cascade,
  offerte_id bigint not null references public.offertes (id) on delete cascade,
  recipient_email text not null check (recipient_email ~* '^[^@]+@[^@]+\.[^@]+$'),
  status text not null default 'sent' check (status in ('sent', 'failed')),
  error_message text,
  sent_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists offerte_email_log_offerte_idx
  on public.offerte_email_log (offerte_id, created_at desc);

alter table public.offerte_email_log enable row level security;

drop policy if exists "Company members manage offerte email log" on public.offerte_email_log;
create policy "Company members manage offerte email log"
  on public.offerte_email_log for all
  using (public.is_member_of_company(bedrijf_id))
  with check (public.is_member_of_company(bedrijf_id));

